-- ============================================================================
-- REWARD SHOP (XP MARKET) MIGRATION
-- ============================================================================

-- 1) Add columns to profiles table
-- ============================================================================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS xp_balance int NOT NULL DEFAULT 0;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS premium_hooks_until timestamptz NULL;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS analysis_credit_balance int NOT NULL DEFAULT 0;

-- Add check constraints
ALTER TABLE profiles
ADD CONSTRAINT profiles_xp_balance_non_negative CHECK (xp_balance >= 0);

ALTER TABLE profiles
ADD CONSTRAINT profiles_analysis_credit_non_negative CHECK (analysis_credit_balance >= 0);

-- 2) Create xp_ledger table
-- ============================================================================
CREATE TABLE IF NOT EXISTS xp_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('earn', 'spend')),
  source text NOT NULL,
  amount int NOT NULL CHECK (amount > 0),
  metadata jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_xp_ledger_user_created
ON xp_ledger(user_id, created_at DESC);

-- 3) Create shop_items table
-- ============================================================================
CREATE TABLE IF NOT EXISTS shop_items (
  id text PRIMARY KEY,
  is_active boolean NOT NULL DEFAULT true,
  xp_cost int NOT NULL CHECK (xp_cost > 0),
  reward_type text NOT NULL CHECK (reward_type IN ('analysis_credit', 'premium_hooks')),
  reward_value int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4) Create redemptions table
-- ============================================================================
CREATE TABLE IF NOT EXISTS redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id text NOT NULL REFERENCES shop_items(id),
  xp_spent int NOT NULL CHECK (xp_spent > 0),
  metadata jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_redemptions_user_created
ON redemptions(user_id, created_at DESC);

-- 5) Seed shop_items
-- ============================================================================
INSERT INTO shop_items (id, is_active, xp_cost, reward_type, reward_value) VALUES
  ('analysis_credit_1', true, 100, 'analysis_credit', 1),
  ('premium_hooks_24h', true, 150, 'premium_hooks', 24)
ON CONFLICT (id) DO UPDATE SET
  xp_cost = EXCLUDED.xp_cost,
  reward_type = EXCLUDED.reward_type,
  reward_value = EXCLUDED.reward_value;

-- 6) RLS Policies
-- ============================================================================

-- xp_ledger: users can only read their own entries
ALTER TABLE xp_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own xp_ledger" ON xp_ledger;
CREATE POLICY "Users can view own xp_ledger" ON xp_ledger
  FOR SELECT USING (auth.uid() = user_id);

-- shop_items: readable by all authenticated users
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view shop_items" ON shop_items;
CREATE POLICY "Authenticated users can view shop_items" ON shop_items
  FOR SELECT USING (auth.role() = 'authenticated');

-- redemptions: users can only read their own entries
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own redemptions" ON redemptions;
CREATE POLICY "Users can view own redemptions" ON redemptions
  FOR SELECT USING (auth.uid() = user_id);

-- 7) RPC Functions (SECURITY DEFINER)
-- ============================================================================

-- Function to earn XP
CREATE OR REPLACE FUNCTION earn_xp(
  p_user_id uuid,
  p_amount int,
  p_source text,
  p_metadata jsonb DEFAULT NULL
)
RETURNS TABLE (new_xp_balance int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Update profile xp_balance
  UPDATE profiles
  SET xp_balance = xp_balance + p_amount
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Insert ledger entry
  INSERT INTO xp_ledger (user_id, type, source, amount, metadata)
  VALUES (p_user_id, 'earn', p_source, p_amount, p_metadata);

  -- Return new balance
  RETURN QUERY
  SELECT profiles.xp_balance FROM profiles WHERE id = p_user_id;
END;
$$;

-- Function to spend XP and redeem item
CREATE OR REPLACE FUNCTION spend_xp_and_redeem(
  p_user_id uuid,
  p_item_id text
)
RETURNS TABLE (
  success boolean,
  new_xp_balance int,
  new_analysis_credits int,
  new_premium_hooks_until timestamptz,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item shop_items%ROWTYPE;
  v_current_balance int;
  v_current_premium_until timestamptz;
  v_new_premium_until timestamptz;
BEGIN
  -- Get shop item
  SELECT * INTO v_item
  FROM shop_items
  WHERE id = p_item_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 0, NULL::timestamptz, 'Item not found or inactive'::text;
    RETURN;
  END IF;

  -- Lock user row and get current values
  SELECT xp_balance, premium_hooks_until
  INTO v_current_balance, v_current_premium_until
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 0, NULL::timestamptz, 'User not found'::text;
    RETURN;
  END IF;

  -- Check sufficient balance
  IF v_current_balance < v_item.xp_cost THEN
    RETURN QUERY SELECT false, v_current_balance, 0, NULL::timestamptz, 'Insufficient XP balance'::text;
    RETURN;
  END IF;

  -- Deduct XP
  UPDATE profiles
  SET xp_balance = xp_balance - v_item.xp_cost
  WHERE id = p_user_id;

  -- Insert xp_ledger spend entry
  INSERT INTO xp_ledger (user_id, type, source, amount, metadata)
  VALUES (p_user_id, 'spend', 'shop_redeem', v_item.xp_cost, jsonb_build_object('item_id', p_item_id));

  -- Insert redemption entry
  INSERT INTO redemptions (user_id, item_id, xp_spent, metadata)
  VALUES (p_user_id, p_item_id, v_item.xp_cost, jsonb_build_object('reward_type', v_item.reward_type, 'reward_value', v_item.reward_value));

  -- Apply reward effect
  IF v_item.reward_type = 'analysis_credit' THEN
    UPDATE profiles
    SET analysis_credit_balance = analysis_credit_balance + v_item.reward_value
    WHERE id = p_user_id;

  ELSIF v_item.reward_type = 'premium_hooks' THEN
    -- Calculate new premium_hooks_until
    -- If already has active premium, extend from that; otherwise from now
    IF v_current_premium_until IS NOT NULL AND v_current_premium_until > now() THEN
      v_new_premium_until := v_current_premium_until + (v_item.reward_value || ' hours')::interval;
    ELSE
      v_new_premium_until := now() + (v_item.reward_value || ' hours')::interval;
    END IF;

    UPDATE profiles
    SET premium_hooks_until = v_new_premium_until
    WHERE id = p_user_id;
  END IF;

  -- Return updated values
  RETURN QUERY
  SELECT
    true,
    p.xp_balance,
    p.analysis_credit_balance,
    p.premium_hooks_until,
    NULL::text
  FROM profiles p
  WHERE p.id = p_user_id;
END;
$$;

-- Function to use analysis credit
CREATE OR REPLACE FUNCTION use_analysis_credit(p_user_id uuid)
RETURNS TABLE (success boolean, remaining_credits int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_credits int;
BEGIN
  -- Lock and get current credits
  SELECT analysis_credit_balance INTO v_current_credits
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;

  IF v_current_credits <= 0 THEN
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;

  -- Decrement credit
  UPDATE profiles
  SET analysis_credit_balance = analysis_credit_balance - 1
  WHERE id = p_user_id;

  -- Return success and remaining
  RETURN QUERY
  SELECT true, analysis_credit_balance
  FROM profiles
  WHERE id = p_user_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION earn_xp TO authenticated;
GRANT EXECUTE ON FUNCTION spend_xp_and_redeem TO authenticated;
GRANT EXECUTE ON FUNCTION use_analysis_credit TO authenticated;
