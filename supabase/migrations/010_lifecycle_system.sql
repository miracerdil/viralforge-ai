-- Lifecycle System, Upgrade Nudges, and Analytics Events
-- Handles user lifecycle stages, upgrade triggers, and event tracking

-- ============================================
-- A) user_lifecycle - Track user stages
-- ============================================
CREATE TABLE IF NOT EXISTS user_lifecycle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stage TEXT NOT NULL DEFAULT 'new_user' CHECK (stage IN ('new_user', 'activated', 'engaged', 'at_risk', 'churn_risk')),
  checklist_completed JSONB DEFAULT '{"first_generation": false, "platform_picked": false, "first_task": false}'::jsonb,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  last_transition_at TIMESTAMPTZ DEFAULT NOW(),
  streak_count INTEGER DEFAULT 0,
  streak_last_date DATE,
  weekly_active_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- B) lifecycle_events - Track user events
-- ============================================
CREATE TABLE IF NOT EXISTS lifecycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'signup_completed', 'first_generation', 'first_result_added',
    'ab_test_created', 'streak_broken', 'limit_hit', 'upgrade_completed',
    'upgrade_prompt_shown', 'upgrade_clicked', 'feature_blocked',
    'checklist_item_completed', 'stage_transition'
  )),
  feature TEXT, -- Which feature triggered the event
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- C) upgrade_nudges - Track upgrade prompts
-- ============================================
CREATE TABLE IF NOT EXISTS upgrade_nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('in_app', 'email', 'toast', 'modal')),
  threshold_status TEXT CHECK (threshold_status IN ('warning', 'critical', 'blocked')),
  last_sent_at TIMESTAMPTZ DEFAULT NOW(),
  send_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, feature, channel)
);

-- ============================================
-- D) lifecycle_emails_sent - Track email sends
-- ============================================
CREATE TABLE IF NOT EXISTS lifecycle_emails_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  meta JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id, template, sent_at)
);

-- ============================================
-- E) user_entitlements - Feature limits by plan
-- ============================================
CREATE TABLE IF NOT EXISTS user_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'creator_pro', 'business_pro')),

  -- Usage counters (reset monthly)
  hooks_used INTEGER DEFAULT 0,
  hooks_limit INTEGER DEFAULT 10,
  abtest_used INTEGER DEFAULT 0,
  abtest_limit INTEGER DEFAULT 3,
  planner_used INTEGER DEFAULT 0,
  planner_limit INTEGER DEFAULT 5,
  brand_kits_used INTEGER DEFAULT 0,
  brand_kits_limit INTEGER DEFAULT 0,
  analyses_used INTEGER DEFAULT 0,
  analyses_limit INTEGER DEFAULT 3,

  -- Bonus from rewards/promos
  bonus_hooks INTEGER DEFAULT 0,
  bonus_analyses INTEGER DEFAULT 0,

  -- Feature flags
  persona_enabled BOOLEAN DEFAULT FALSE,
  performance_tracking_enabled BOOLEAN DEFAULT FALSE,

  -- Reset tracking
  usage_reset_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_lifecycle_stage ON user_lifecycle(stage);
CREATE INDEX IF NOT EXISTS idx_user_lifecycle_activity ON user_lifecycle(last_activity_at DESC);

CREATE INDEX IF NOT EXISTS idx_lifecycle_events_user ON lifecycle_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lifecycle_events_type ON lifecycle_events(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_upgrade_nudges_user ON upgrade_nudges(user_id, feature);
CREATE INDEX IF NOT EXISTS idx_upgrade_nudges_sent ON upgrade_nudges(last_sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_lifecycle_emails_user ON lifecycle_emails_sent(user_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_entitlements_plan ON user_entitlements(plan);

-- ============================================
-- RLS Policies
-- ============================================

-- user_lifecycle RLS
ALTER TABLE user_lifecycle ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lifecycle"
  ON user_lifecycle FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own lifecycle"
  ON user_lifecycle FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert lifecycle"
  ON user_lifecycle FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- lifecycle_events RLS
ALTER TABLE lifecycle_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events"
  ON lifecycle_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events"
  ON lifecycle_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- upgrade_nudges RLS
ALTER TABLE upgrade_nudges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own nudges"
  ON upgrade_nudges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage nudges"
  ON upgrade_nudges FOR ALL
  USING (auth.uid() = user_id);

-- lifecycle_emails_sent RLS
ALTER TABLE lifecycle_emails_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own emails"
  ON lifecycle_emails_sent FOR SELECT
  USING (auth.uid() = user_id);

-- user_entitlements RLS
ALTER TABLE user_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entitlements"
  ON user_entitlements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own entitlements"
  ON user_entitlements FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- Functions
-- ============================================

-- Initialize entitlements for new user
CREATE OR REPLACE FUNCTION initialize_user_entitlements()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_entitlements (user_id, plan)
  VALUES (NEW.id, 'free')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO user_lifecycle (user_id, stage)
  VALUES (NEW.id, 'new_user')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create entitlements on profile creation
DROP TRIGGER IF EXISTS trigger_init_entitlements ON profiles;
CREATE TRIGGER trigger_init_entitlements
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_entitlements();

-- Update entitlements based on plan
CREATE OR REPLACE FUNCTION update_plan_entitlements(
  p_user_id UUID,
  p_plan TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE user_entitlements
  SET
    plan = p_plan,
    hooks_limit = CASE
      WHEN p_plan = 'free' THEN 10
      WHEN p_plan = 'creator_pro' THEN 100
      WHEN p_plan = 'business_pro' THEN 500
    END,
    abtest_limit = CASE
      WHEN p_plan = 'free' THEN 3
      WHEN p_plan = 'creator_pro' THEN 50
      WHEN p_plan = 'business_pro' THEN 200
    END,
    planner_limit = CASE
      WHEN p_plan = 'free' THEN 5
      WHEN p_plan = 'creator_pro' THEN 50
      WHEN p_plan = 'business_pro' THEN 200
    END,
    brand_kits_limit = CASE
      WHEN p_plan = 'free' THEN 0
      WHEN p_plan = 'creator_pro' THEN 1
      WHEN p_plan = 'business_pro' THEN 10
    END,
    analyses_limit = CASE
      WHEN p_plan = 'free' THEN 3
      WHEN p_plan = 'creator_pro' THEN 30
      WHEN p_plan = 'business_pro' THEN 100
    END,
    persona_enabled = p_plan != 'free',
    performance_tracking_enabled = p_plan != 'free',
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log lifecycle event
CREATE OR REPLACE FUNCTION log_lifecycle_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_feature TEXT DEFAULT NULL,
  p_meta JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO lifecycle_events (user_id, event_type, feature, meta)
  VALUES (p_user_id, p_event_type, p_feature, p_meta)
  RETURNING id INTO v_event_id;

  -- Update last activity
  UPDATE user_lifecycle
  SET last_activity_at = NOW(), updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check and update lifecycle stage
CREATE OR REPLACE FUNCTION evaluate_lifecycle_stage(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_current_stage TEXT;
  v_new_stage TEXT;
  v_lifecycle RECORD;
  v_days_inactive INTEGER;
  v_weekly_days INTEGER;
BEGIN
  SELECT * INTO v_lifecycle FROM user_lifecycle WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN 'new_user';
  END IF;

  v_current_stage := v_lifecycle.stage;
  v_new_stage := v_current_stage;
  v_days_inactive := EXTRACT(DAY FROM NOW() - v_lifecycle.last_activity_at);

  -- Stage transition rules
  CASE v_current_stage
    WHEN 'new_user' THEN
      -- Check if activated (first generation + first task)
      IF (v_lifecycle.checklist_completed->>'first_generation')::boolean
         AND (v_lifecycle.checklist_completed->>'first_task')::boolean THEN
        v_new_stage := 'activated';
      END IF;

    WHEN 'activated' THEN
      -- Check if engaged (3 different days in 7-day window)
      IF v_lifecycle.weekly_active_days >= 3 THEN
        v_new_stage := 'engaged';
      ELSIF v_days_inactive >= 5 THEN
        v_new_stage := 'at_risk';
      END IF;

    WHEN 'engaged' THEN
      IF v_days_inactive >= 5 THEN
        v_new_stage := 'at_risk';
      END IF;

    WHEN 'at_risk' THEN
      IF v_days_inactive >= 10 THEN
        v_new_stage := 'churn_risk';
      ELSIF v_days_inactive < 2 THEN
        v_new_stage := 'engaged';
      END IF;

    WHEN 'churn_risk' THEN
      IF v_days_inactive < 2 THEN
        v_new_stage := 'engaged';
      END IF;
  END CASE;

  -- Update if stage changed
  IF v_new_stage != v_current_stage THEN
    UPDATE user_lifecycle
    SET stage = v_new_stage, last_transition_at = NOW(), updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Log the transition
    PERFORM log_lifecycle_event(p_user_id, 'stage_transition', NULL,
      jsonb_build_object('from', v_current_stage, 'to', v_new_stage));
  END IF;

  RETURN v_new_stage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reset monthly usage
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS VOID AS $$
BEGIN
  UPDATE user_entitlements
  SET
    hooks_used = 0,
    abtest_used = 0,
    planner_used = 0,
    analyses_used = 0,
    usage_reset_at = NOW(),
    updated_at = NOW()
  WHERE usage_reset_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
