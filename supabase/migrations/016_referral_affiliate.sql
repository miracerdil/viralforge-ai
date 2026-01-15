-- =============================================
-- SPEC 3: REFERRAL & AFFILIATE SYSTEM
-- =============================================

-- =============================================
-- REFERRAL SYSTEM TABLES
-- =============================================

-- Referral configuration
CREATE TABLE IF NOT EXISTS referral_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default referral config
INSERT INTO referral_config (config_key, config_value, description) VALUES
  ('referrer_xp_reward', '500', 'XP reward for referrer when referred user signs up'),
  ('referred_xp_reward', '250', 'XP reward for new user who signed up via referral'),
  ('referrer_conversion_xp', '1000', 'Additional XP when referred user upgrades to PRO'),
  ('referrer_usage_credit', '50', 'Usage credits when referred user upgrades to PRO'),
  ('max_referrals_per_user', '100', 'Maximum referrals a user can make'),
  ('referral_code_length', '8', 'Length of generated referral codes')
ON CONFLICT (config_key) DO NOTHING;

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE NOT NULL,
  referred_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  referred_email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'signed_up', 'converted', 'expired', 'cancelled')),
  signed_up_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Referral rewards
CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('xp', 'usage_credit', 'discount', 'free_month')),
  reward_value INTEGER NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('signup', 'conversion', 'milestone')),
  applied_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add referral_code to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;

-- Generate referral code function
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code TEXT := '';
  code_length INTEGER;
  i INTEGER;
BEGIN
  SELECT COALESCE(config_value::INTEGER, 8) INTO code_length
  FROM referral_config WHERE config_key = 'referral_code_length';

  FOR i IN 1..code_length LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;

  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate referral code for new users
CREATE OR REPLACE FUNCTION auto_generate_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  attempts INTEGER := 0;
BEGIN
  -- Generate unique code
  LOOP
    new_code := generate_referral_code();
    attempts := attempts + 1;

    -- Check if code exists
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE referral_code = new_code) THEN
      NEW.referral_code := new_code;
      EXIT;
    END IF;

    -- Prevent infinite loop
    IF attempts > 10 THEN
      NEW.referral_code := 'VF' || substr(NEW.id::text, 1, 8);
      EXIT;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_referral_code ON profiles;
CREATE TRIGGER trigger_auto_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.referral_code IS NULL)
  EXECUTE FUNCTION auto_generate_referral_code();

-- Process referral signup
CREATE OR REPLACE FUNCTION process_referral_signup(
  p_new_user_id UUID,
  p_referral_code TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_id UUID;
  v_referrer_xp INTEGER;
  v_referred_xp INTEGER;
BEGIN
  -- Find referrer
  SELECT id INTO v_referrer_id
  FROM profiles
  WHERE referral_code = upper(p_referral_code);

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code');
  END IF;

  -- Prevent self-referral
  IF v_referrer_id = p_new_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot refer yourself');
  END IF;

  -- Check if user already referred
  IF EXISTS (SELECT 1 FROM profiles WHERE id = p_new_user_id AND referred_by IS NOT NULL) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User already referred');
  END IF;

  -- Get reward config
  SELECT config_value::INTEGER INTO v_referrer_xp
  FROM referral_config WHERE config_key = 'referrer_xp_reward';

  SELECT config_value::INTEGER INTO v_referred_xp
  FROM referral_config WHERE config_key = 'referred_xp_reward';

  -- Create referral record
  INSERT INTO referrals (referrer_id, referral_code, referred_user_id, status, signed_up_at)
  VALUES (v_referrer_id, p_referral_code, p_new_user_id, 'signed_up', now())
  RETURNING id INTO v_referral_id;

  -- Update new user's referred_by
  UPDATE profiles SET referred_by = v_referrer_id WHERE id = p_new_user_id;

  -- Update referrer's count
  UPDATE profiles SET referral_count = referral_count + 1 WHERE id = v_referrer_id;

  -- Award XP to referrer
  INSERT INTO referral_rewards (user_id, referral_id, reward_type, reward_value, reason, applied_at)
  VALUES (v_referrer_id, v_referral_id, 'xp', v_referrer_xp, 'signup', now());

  UPDATE profiles SET xp = xp + v_referrer_xp WHERE id = v_referrer_id;

  -- Award XP to new user
  INSERT INTO referral_rewards (user_id, referral_id, reward_type, reward_value, reason, applied_at)
  VALUES (p_new_user_id, v_referral_id, 'xp', v_referred_xp, 'signup', now());

  UPDATE profiles SET xp = xp + v_referred_xp WHERE id = p_new_user_id;

  -- Log activity
  INSERT INTO user_activity_log (user_id, action, action_label, entity_type, metadata)
  VALUES
    (v_referrer_id, 'referral_signup', 'Referral Signup', 'referral', jsonb_build_object('referred_user_id', p_new_user_id, 'xp_earned', v_referrer_xp)),
    (p_new_user_id, 'referred_signup', 'Referred Signup', 'referral', jsonb_build_object('referrer_id', v_referrer_id, 'xp_earned', v_referred_xp));

  RETURN jsonb_build_object(
    'success', true,
    'referral_id', v_referral_id,
    'referrer_xp', v_referrer_xp,
    'referred_xp', v_referred_xp
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Process referral conversion (when referred user upgrades to PRO)
CREATE OR REPLACE FUNCTION process_referral_conversion(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_id UUID;
  v_conversion_xp INTEGER;
  v_usage_credit INTEGER;
BEGIN
  -- Find referrer
  SELECT referred_by INTO v_referrer_id FROM profiles WHERE id = p_user_id;

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User was not referred');
  END IF;

  -- Find pending referral
  SELECT id INTO v_referral_id
  FROM referrals
  WHERE referred_user_id = p_user_id AND status = 'signed_up';

  IF v_referral_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No pending referral found');
  END IF;

  -- Get reward config
  SELECT config_value::INTEGER INTO v_conversion_xp
  FROM referral_config WHERE config_key = 'referrer_conversion_xp';

  SELECT config_value::INTEGER INTO v_usage_credit
  FROM referral_config WHERE config_key = 'referrer_usage_credit';

  -- Update referral status
  UPDATE referrals SET status = 'converted', converted_at = now() WHERE id = v_referral_id;

  -- Award conversion XP
  INSERT INTO referral_rewards (user_id, referral_id, reward_type, reward_value, reason, applied_at)
  VALUES (v_referrer_id, v_referral_id, 'xp', v_conversion_xp, 'conversion', now());

  UPDATE profiles SET xp = xp + v_conversion_xp WHERE id = v_referrer_id;

  -- Award usage credit
  INSERT INTO referral_rewards (user_id, referral_id, reward_type, reward_value, reason, applied_at)
  VALUES (v_referrer_id, v_referral_id, 'usage_credit', v_usage_credit, 'conversion', now());

  -- Log activity
  INSERT INTO user_activity_log (user_id, action, action_label, entity_type, metadata)
  VALUES (v_referrer_id, 'referral_conversion', 'Referral Conversion', 'referral', jsonb_build_object(
    'referred_user_id', p_user_id,
    'xp_earned', v_conversion_xp,
    'usage_credit', v_usage_credit
  ));

  RETURN jsonb_build_object(
    'success', true,
    'conversion_xp', v_conversion_xp,
    'usage_credit', v_usage_credit
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- AFFILIATE SYSTEM TABLES
-- =============================================

-- Affiliate applications/accounts
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  affiliate_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended', 'terminated')),
  commission_rate DECIMAL(5,2) DEFAULT 15.00, -- 15% default
  payout_method TEXT CHECK (payout_method IN ('bank_transfer', 'paypal', 'wise', 'crypto')),
  payout_details JSONB DEFAULT '{}',
  min_payout_amount DECIMAL(10,2) DEFAULT 50.00,
  total_clicks INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_earnings DECIMAL(12,2) DEFAULT 0,
  total_paid DECIMAL(12,2) DEFAULT 0,
  pending_balance DECIMAL(12,2) DEFAULT 0,
  application_note TEXT,
  admin_note TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Affiliate clicks tracking
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL, -- Fingerprint or session ID
  ip_address INET,
  user_agent TEXT,
  landing_page TEXT,
  referrer_url TEXT,
  country_code TEXT,
  device_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for tracking unique visitors
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_visitor ON affiliate_clicks(affiliate_id, visitor_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_date ON affiliate_clicks(created_at);

-- Affiliate conversions (when click leads to subscription)
CREATE TABLE IF NOT EXISTS affiliate_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  click_id UUID REFERENCES affiliate_clicks(id),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_id TEXT, -- Stripe subscription ID
  plan_type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL, -- Subscription amount
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'refunded', 'disputed')),
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Affiliate payouts
CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payout_method TEXT NOT NULL,
  payout_details JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  transaction_id TEXT,
  notes TEXT,
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Link payouts to conversions
CREATE TABLE IF NOT EXISTS affiliate_payout_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id UUID NOT NULL REFERENCES affiliate_payouts(id) ON DELETE CASCADE,
  conversion_id UUID NOT NULL REFERENCES affiliate_conversions(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Generate affiliate code function
CREATE OR REPLACE FUNCTION generate_affiliate_code(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_email TEXT;
  v_code TEXT;
  v_suffix INTEGER := 1;
BEGIN
  -- Get user email
  SELECT email INTO v_email FROM profiles WHERE id = p_user_id;

  -- Create base code from email prefix
  v_code := upper(split_part(v_email, '@', 1));
  v_code := regexp_replace(v_code, '[^A-Z0-9]', '', 'g');
  v_code := left(v_code, 10);

  -- Add suffix if code exists
  WHILE EXISTS (SELECT 1 FROM affiliates WHERE affiliate_code = v_code || CASE WHEN v_suffix > 1 THEN v_suffix::text ELSE '' END) LOOP
    v_suffix := v_suffix + 1;
  END LOOP;

  IF v_suffix > 1 THEN
    v_code := v_code || v_suffix::text;
  END IF;

  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Track affiliate click
CREATE OR REPLACE FUNCTION track_affiliate_click(
  p_affiliate_code TEXT,
  p_visitor_id TEXT,
  p_ip_address INET,
  p_user_agent TEXT,
  p_landing_page TEXT,
  p_referrer_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_affiliate_id UUID;
  v_click_id UUID;
  v_device_type TEXT;
BEGIN
  -- Find affiliate
  SELECT id INTO v_affiliate_id
  FROM affiliates
  WHERE affiliate_code = upper(p_affiliate_code) AND status = 'approved';

  IF v_affiliate_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Determine device type from user agent
  IF p_user_agent ILIKE '%mobile%' OR p_user_agent ILIKE '%android%' OR p_user_agent ILIKE '%iphone%' THEN
    v_device_type := 'mobile';
  ELSIF p_user_agent ILIKE '%tablet%' OR p_user_agent ILIKE '%ipad%' THEN
    v_device_type := 'tablet';
  ELSE
    v_device_type := 'desktop';
  END IF;

  -- Insert click (check for duplicate within 24 hours)
  IF NOT EXISTS (
    SELECT 1 FROM affiliate_clicks
    WHERE affiliate_id = v_affiliate_id
      AND visitor_id = p_visitor_id
      AND created_at > now() - interval '24 hours'
  ) THEN
    INSERT INTO affiliate_clicks (
      affiliate_id, visitor_id, ip_address, user_agent,
      landing_page, referrer_url, device_type
    ) VALUES (
      v_affiliate_id, p_visitor_id, p_ip_address, p_user_agent,
      p_landing_page, p_referrer_url, v_device_type
    ) RETURNING id INTO v_click_id;

    -- Update affiliate click count
    UPDATE affiliates SET total_clicks = total_clicks + 1 WHERE id = v_affiliate_id;
  END IF;

  RETURN v_click_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Process affiliate conversion
CREATE OR REPLACE FUNCTION process_affiliate_conversion(
  p_user_id UUID,
  p_affiliate_code TEXT,
  p_subscription_id TEXT,
  p_plan_type TEXT,
  p_amount DECIMAL
)
RETURNS JSONB AS $$
DECLARE
  v_affiliate_id UUID;
  v_affiliate_user_id UUID;
  v_commission_rate DECIMAL;
  v_commission_amount DECIMAL;
  v_click_id UUID;
  v_conversion_id UUID;
BEGIN
  -- Find affiliate
  SELECT id, user_id, commission_rate INTO v_affiliate_id, v_affiliate_user_id, v_commission_rate
  FROM affiliates
  WHERE affiliate_code = upper(p_affiliate_code) AND status = 'approved';

  IF v_affiliate_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid affiliate code');
  END IF;

  -- Prevent self-referral
  IF v_affiliate_user_id = p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot earn commission from own purchase');
  END IF;

  -- Check for existing conversion
  IF EXISTS (SELECT 1 FROM affiliate_conversions WHERE user_id = p_user_id AND affiliate_id = v_affiliate_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Conversion already recorded');
  END IF;

  -- Calculate commission
  v_commission_amount := p_amount * (v_commission_rate / 100);

  -- Find most recent click from this user (within 30 days)
  SELECT id INTO v_click_id
  FROM affiliate_clicks
  WHERE affiliate_id = v_affiliate_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Create conversion
  INSERT INTO affiliate_conversions (
    affiliate_id, click_id, user_id, subscription_id,
    plan_type, amount, commission_rate, commission_amount, status
  ) VALUES (
    v_affiliate_id, v_click_id, p_user_id, p_subscription_id,
    p_plan_type, p_amount, v_commission_rate, v_commission_amount, 'pending'
  ) RETURNING id INTO v_conversion_id;

  -- Update affiliate stats
  UPDATE affiliates SET
    total_conversions = total_conversions + 1,
    total_earnings = total_earnings + v_commission_amount,
    pending_balance = pending_balance + v_commission_amount,
    updated_at = now()
  WHERE id = v_affiliate_id;

  -- Log activity
  INSERT INTO user_activity_log (user_id, action, action_label, entity_type, metadata)
  VALUES (v_affiliate_user_id, 'affiliate_conversion', 'Affiliate Conversion', 'affiliate', jsonb_build_object(
    'conversion_id', v_conversion_id,
    'plan_type', p_plan_type,
    'commission', v_commission_amount
  ));

  RETURN jsonb_build_object(
    'success', true,
    'conversion_id', v_conversion_id,
    'commission_amount', v_commission_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE referral_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payout_items ENABLE ROW LEVEL SECURITY;

-- Referral config: Public read (admin write handled via service role)
DROP POLICY IF EXISTS "referral_config_public_read" ON referral_config;
CREATE POLICY "referral_config_public_read" ON referral_config FOR SELECT USING (true);

-- Referrals: Users see own
DROP POLICY IF EXISTS "referrals_own_read" ON referrals;
CREATE POLICY "referrals_own_read" ON referrals FOR SELECT
  USING (referrer_id = auth.uid() OR referred_user_id = auth.uid());

-- Referral rewards: Users see own
DROP POLICY IF EXISTS "referral_rewards_own_read" ON referral_rewards;
CREATE POLICY "referral_rewards_own_read" ON referral_rewards FOR SELECT
  USING (user_id = auth.uid());

-- Affiliates: Users see own
DROP POLICY IF EXISTS "affiliates_own_read" ON affiliates;
CREATE POLICY "affiliates_own_read" ON affiliates FOR SELECT
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "affiliates_own_insert" ON affiliates;
CREATE POLICY "affiliates_own_insert" ON affiliates FOR INSERT
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "affiliates_own_update" ON affiliates;
CREATE POLICY "affiliates_own_update" ON affiliates FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Affiliate clicks: Only affiliate owner
DROP POLICY IF EXISTS "affiliate_clicks_owner_read" ON affiliate_clicks;
CREATE POLICY "affiliate_clicks_owner_read" ON affiliate_clicks FOR SELECT
  USING (EXISTS (SELECT 1 FROM affiliates WHERE id = affiliate_id AND user_id = auth.uid()));

-- Affiliate conversions: Only affiliate owner
DROP POLICY IF EXISTS "affiliate_conversions_owner_read" ON affiliate_conversions;
CREATE POLICY "affiliate_conversions_owner_read" ON affiliate_conversions FOR SELECT
  USING (EXISTS (SELECT 1 FROM affiliates WHERE id = affiliate_id AND user_id = auth.uid()));

-- Affiliate payouts: Only affiliate owner
DROP POLICY IF EXISTS "affiliate_payouts_owner_read" ON affiliate_payouts;
CREATE POLICY "affiliate_payouts_owner_read" ON affiliate_payouts FOR SELECT
  USING (EXISTS (SELECT 1 FROM affiliates WHERE id = affiliate_id AND user_id = auth.uid()));

-- Payout items: Only via payout access
DROP POLICY IF EXISTS "affiliate_payout_items_owner_read" ON affiliate_payout_items;
CREATE POLICY "affiliate_payout_items_owner_read" ON affiliate_payout_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM affiliate_payouts p
    JOIN affiliates a ON p.affiliate_id = a.id
    WHERE p.id = payout_id AND a.user_id = auth.uid()
  ));

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_user ON referral_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_user ON affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_code ON affiliates(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_affiliate ON affiliate_conversions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_user ON affiliate_conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_affiliate ON affiliate_payouts(affiliate_id);
