-- ============================================
-- FIX: Drop existing policies first, then recreate
-- Run this if you get "policy already exists" errors
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read feature flags" ON feature_flags;
DROP POLICY IF EXISTS "Users can view own AI usage" ON ai_usage_logs;
DROP POLICY IF EXISTS "System can insert AI usage" ON ai_usage_logs;
DROP POLICY IF EXISTS "Users can view own notifications" ON user_notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON user_notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON user_notifications;
DROP POLICY IF EXISTS "Users can view own activity" ON user_activity_log;
DROP POLICY IF EXISTS "System can insert activity" ON user_activity_log;
DROP POLICY IF EXISTS "Users can manage own shares" ON content_shares;
DROP POLICY IF EXISTS "Anyone can view public shares" ON content_shares;
DROP POLICY IF EXISTS "Anyone can read plan limits" ON plan_limits_config;

-- ============================================
-- D) user_notifications - Notification center
-- ============================================
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('system', 'achievement', 'feature', 'warning', 'info')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  action_label TEXT,
  icon TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON user_notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON user_notifications(user_id, is_read) WHERE is_read = FALSE;

ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON user_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON user_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON user_notifications FOR INSERT
  WITH CHECK (true);

-- ============================================
-- E) user_activity_log - Activity timeline
-- ============================================
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  action_label TEXT,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_user ON user_activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_action ON user_activity_log(action, created_at DESC);

ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity"
  ON user_activity_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity"
  ON user_activity_log FOR INSERT
  WITH CHECK (true);

-- ============================================
-- F) content_shares - Public share links
-- ============================================
CREATE TABLE IF NOT EXISTS content_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('hooks', 'analysis', 'planner', 'ab_test')),
  content_id UUID NOT NULL,
  title TEXT,
  is_public BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shares_token ON content_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_shares_user ON content_shares(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shares_content ON content_shares(content_type, content_id);

ALTER TABLE content_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own shares"
  ON content_shares FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public shares"
  ON content_shares FOR SELECT
  USING (is_public = true AND (expires_at IS NULL OR expires_at > NOW()));

-- ============================================
-- G) admin_audit_log - Admin action tracking
-- ============================================
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_entity_type TEXT,
  target_entity_id UUID,
  changes JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_admin ON admin_audit_log(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_target_user ON admin_audit_log(target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON admin_audit_log(action, created_at DESC);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- H) plan_limits_config - Configurable plan limits
-- ============================================
CREATE TABLE IF NOT EXISTS plan_limits_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan TEXT UNIQUE NOT NULL CHECK (plan IN ('free', 'creator_pro', 'business_pro')),
  hooks_limit INTEGER DEFAULT 10,
  abtest_limit INTEGER DEFAULT 3,
  planner_limit INTEGER DEFAULT 5,
  analyses_limit INTEGER DEFAULT 3,
  brand_kits_limit INTEGER DEFAULT 0,
  persona_enabled BOOLEAN DEFAULT FALSE,
  performance_tracking_enabled BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO plan_limits_config (plan, hooks_limit, abtest_limit, planner_limit, analyses_limit, brand_kits_limit, persona_enabled, performance_tracking_enabled)
VALUES
  ('free', 10, 3, 5, 3, 0, false, false),
  ('creator_pro', 100, 50, 50, 30, 1, true, true),
  ('business_pro', 500, 200, 200, 100, 10, true, true)
ON CONFLICT (plan) DO NOTHING;

ALTER TABLE plan_limits_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read plan limits"
  ON plan_limits_config FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- Recreate feature_flags policy
-- ============================================
CREATE POLICY "Anyone can read feature flags"
  ON feature_flags FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- Recreate ai_usage_logs policies
-- ============================================
CREATE POLICY "Users can view own AI usage"
  ON ai_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert AI usage"
  ON ai_usage_logs FOR INSERT
  WITH CHECK (true);

-- ============================================
-- I) Helper Functions
-- ============================================

-- Log AI usage
CREATE OR REPLACE FUNCTION log_ai_usage(
  p_user_id UUID,
  p_feature TEXT,
  p_model TEXT,
  p_input_tokens INTEGER,
  p_output_tokens INTEGER,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_cost_usd DECIMAL(10,6);
  v_log_id UUID;
BEGIN
  v_cost_usd := CASE p_model
    WHEN 'gpt-4o' THEN (p_input_tokens * 0.000005 + p_output_tokens * 0.000015)
    WHEN 'gpt-4o-mini' THEN (p_input_tokens * 0.00000015 + p_output_tokens * 0.0000006)
    ELSE (p_input_tokens * 0.000001 + p_output_tokens * 0.000002)
  END;

  INSERT INTO ai_usage_logs (user_id, feature, model, input_tokens, output_tokens, cost_usd, metadata)
  VALUES (p_user_id, p_feature, p_model, p_input_tokens, p_output_tokens, v_cost_usd, p_metadata)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_action TEXT,
  p_action_label TEXT DEFAULT NULL,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO user_activity_log (user_id, action, action_label, entity_type, entity_id, metadata)
  VALUES (p_user_id, p_action, p_action_label, p_entity_type, p_entity_id, p_metadata)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create notification for user
CREATE OR REPLACE FUNCTION create_user_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_action_url TEXT DEFAULT NULL,
  p_action_label TEXT DEFAULT NULL,
  p_icon TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_notif_id UUID;
BEGIN
  INSERT INTO user_notifications (user_id, type, title, message, action_url, action_label, icon)
  VALUES (p_user_id, p_type, p_title, p_message, p_action_url, p_action_label, p_icon)
  RETURNING id INTO v_notif_id;

  RETURN v_notif_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check feature flag for user
CREATE OR REPLACE FUNCTION check_feature_flag(
  p_flag_key TEXT,
  p_user_id UUID,
  p_user_plan TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_flag RECORD;
BEGIN
  SELECT * INTO v_flag FROM feature_flags WHERE flag_key = p_flag_key;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF NOT v_flag.is_enabled THEN
    RETURN FALSE;
  END IF;

  IF p_user_id = ANY(v_flag.target_user_ids) THEN
    RETURN TRUE;
  END IF;

  IF LOWER(p_user_plan) = ANY(v_flag.target_plans) THEN
    RETURN TRUE;
  END IF;

  IF array_length(v_flag.target_plans, 1) IS NULL AND array_length(v_flag.target_user_ids, 1) IS NULL THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate share token
CREATE OR REPLACE FUNCTION generate_share_token() RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Log admin action
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id UUID,
  p_action TEXT,
  p_target_user_id UUID DEFAULT NULL,
  p_target_entity_type TEXT DEFAULT NULL,
  p_target_entity_id UUID DEFAULT NULL,
  p_changes JSONB DEFAULT '{}'::jsonb,
  p_ip_address TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO admin_audit_log (admin_id, action, target_user_id, target_entity_type, target_entity_id, changes, ip_address)
  VALUES (p_admin_id, p_action, p_target_user_id, p_target_entity_type, p_target_entity_id, p_changes, p_ip_address)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- J) Views for Admin Dashboard
-- ============================================

CREATE OR REPLACE VIEW admin_lifecycle_funnel AS
SELECT
  stage,
  COUNT(*) as user_count,
  COUNT(*) FILTER (WHERE last_activity_at > NOW() - INTERVAL '7 days') as active_last_7_days,
  COUNT(*) FILTER (WHERE last_activity_at > NOW() - INTERVAL '30 days') as active_last_30_days
FROM user_lifecycle
GROUP BY stage
ORDER BY CASE stage
  WHEN 'new_user' THEN 1
  WHEN 'activated' THEN 2
  WHEN 'engaged' THEN 3
  WHEN 'at_risk' THEN 4
  WHEN 'churn_risk' THEN 5
  ELSE 6
END;

CREATE OR REPLACE VIEW admin_ai_costs_summary AS
SELECT
  DATE(created_at) as date,
  feature,
  model,
  COUNT(*) as request_count,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens,
  SUM(cost_usd) as total_cost_usd
FROM ai_usage_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), feature, model
ORDER BY date DESC, feature;

CREATE OR REPLACE VIEW admin_daily_ai_costs AS
SELECT
  DATE(created_at) as date,
  SUM(cost_usd) as total_cost_usd,
  COUNT(*) as total_requests
FROM ai_usage_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ============================================
-- K) Insert default feature flags
-- ============================================
INSERT INTO feature_flags (flag_key, flag_name, description, is_enabled, target_plans)
VALUES
  ('persona_learning', 'Persona Learning', 'AI learns user content style', true, ARRAY['creator_pro', 'business_pro']),
  ('performance_tracking', 'Performance Tracking', 'Track content performance metrics', true, ARRAY['creator_pro', 'business_pro']),
  ('advanced_analytics', 'Advanced Analytics', 'Detailed analytics dashboard', true, ARRAY['business_pro']),
  ('api_access', 'API Access', 'REST API access for integrations', false, ARRAY['business_pro']),
  ('priority_support', 'Priority Support', 'Priority customer support queue', true, ARRAY['business_pro']),
  ('bulk_export', 'Bulk Export', 'Export all data at once', true, ARRAY['creator_pro', 'business_pro']),
  ('team_sharing', 'Team Sharing', 'Share content with team members', false, ARRAY['business_pro'])
ON CONFLICT (flag_key) DO NOTHING;

-- ============================================
-- Grant permissions
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;
