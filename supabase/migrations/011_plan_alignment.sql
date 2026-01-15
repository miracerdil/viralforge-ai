-- Migration: Plan Alignment & Usage Counters
-- Aligns the 2-tier plan system (FREE/PRO) to 3-tier (free/creator_pro/business_pro)
-- Creates usage_counters table for tracking feature usage per billing period

-- 1. Update profiles.plan constraint to use 3-tier system
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_plan_check;

-- Update existing data BEFORE adding new constraint
UPDATE profiles SET plan = 'free' WHERE plan = 'FREE';
UPDATE profiles SET plan = 'creator_pro' WHERE plan = 'PRO';

ALTER TABLE profiles
ADD CONSTRAINT profiles_plan_check
CHECK (plan IN ('free', 'creator_pro', 'business_pro'));

-- 2. Add subscription tracking columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- Add constraint for subscription_status (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_subscription_status_check'
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_subscription_status_check
    CHECK (subscription_status IN ('none', 'active', 'past_due', 'canceled', 'trialing', 'incomplete'));
  END IF;
END $$;

-- 3. Create usage_counters table
CREATE TABLE IF NOT EXISTS usage_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  hooks_used INTEGER DEFAULT 0,
  ab_tests_used INTEGER DEFAULT 0,
  content_plans_used INTEGER DEFAULT 0,
  video_analysis_used INTEGER DEFAULT 0,
  brand_kits_created INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_start)
);

-- 4. Enable RLS for usage_counters
ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own counters" ON usage_counters;
DROP POLICY IF EXISTS "Users can update own counters" ON usage_counters;
DROP POLICY IF EXISTS "Users can insert own counters" ON usage_counters;

-- Create RLS policies
CREATE POLICY "Users can view own counters" ON usage_counters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own counters" ON usage_counters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own counters" ON usage_counters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_usage_counters_user_period
  ON usage_counters(user_id, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_usage_counters_user_id
  ON usage_counters(user_id);

-- 6. Function to get or create current period counters
CREATE OR REPLACE FUNCTION get_or_create_usage_counters(p_user_id UUID)
RETURNS usage_counters AS $$
DECLARE
  v_period_start DATE;
  v_period_end DATE;
  v_result usage_counters;
BEGIN
  -- Get user's billing period from profile (or use calendar month for free users)
  SELECT
    COALESCE(current_period_start::date, date_trunc('month', NOW())::date),
    COALESCE(current_period_end::date, (date_trunc('month', NOW()) + interval '1 month' - interval '1 day')::date)
  INTO v_period_start, v_period_end
  FROM profiles WHERE id = p_user_id;

  -- If no profile found, use calendar month
  IF v_period_start IS NULL THEN
    v_period_start := date_trunc('month', NOW())::date;
    v_period_end := (date_trunc('month', NOW()) + interval '1 month' - interval '1 day')::date;
  END IF;

  -- Try to get existing record
  SELECT * INTO v_result FROM usage_counters
  WHERE user_id = p_user_id AND period_start = v_period_start;

  -- Create if not exists
  IF v_result IS NULL THEN
    INSERT INTO usage_counters (user_id, period_start, period_end)
    VALUES (p_user_id, v_period_start, v_period_end)
    RETURNING * INTO v_result;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function to increment usage counter
CREATE OR REPLACE FUNCTION increment_usage_counter(
  p_user_id UUID,
  p_column TEXT,
  p_amount INTEGER DEFAULT 1
) RETURNS usage_counters AS $$
DECLARE
  v_counters usage_counters;
BEGIN
  -- Ensure counters exist for current period
  v_counters := get_or_create_usage_counters(p_user_id);

  -- Validate column name (security)
  IF p_column NOT IN ('hooks_used', 'ab_tests_used', 'content_plans_used', 'video_analysis_used', 'brand_kits_created') THEN
    RAISE EXCEPTION 'Invalid column name: %', p_column;
  END IF;

  -- Increment the appropriate column
  EXECUTE format(
    'UPDATE usage_counters SET %I = %I + $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    p_column, p_column
  ) INTO v_counters USING p_amount, v_counters.id;

  RETURN v_counters;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Function to get current usage for a user
CREATE OR REPLACE FUNCTION get_current_usage(p_user_id UUID)
RETURNS TABLE (
  hooks_used INTEGER,
  ab_tests_used INTEGER,
  content_plans_used INTEGER,
  video_analysis_used INTEGER,
  brand_kits_created INTEGER,
  period_start DATE,
  period_end DATE
) AS $$
DECLARE
  v_counters usage_counters;
BEGIN
  v_counters := get_or_create_usage_counters(p_user_id);

  RETURN QUERY
  SELECT
    v_counters.hooks_used,
    v_counters.ab_tests_used,
    v_counters.content_plans_used,
    v_counters.video_analysis_used,
    v_counters.brand_kits_created,
    v_counters.period_start,
    v_counters.period_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Grant execute permissions
GRANT EXECUTE ON FUNCTION get_or_create_usage_counters(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_usage_counter(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_usage(UUID) TO authenticated;

-- 10. Add indexes on profiles for subscription queries
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
  ON profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status
  ON profiles(subscription_status) WHERE subscription_status != 'none';
