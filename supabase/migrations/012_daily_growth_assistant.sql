-- Migration: Daily Growth Assistant
-- Creates tables for daily suggestions, performance insights, and publishing workflow

-- ============================================
-- A) daily_suggestions - Store generated daily content suggestions
-- ============================================
CREATE TABLE IF NOT EXISTS daily_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestion_date DATE NOT NULL,
  platform TEXT NOT NULL,
  suggestion_json JSONB NOT NULL,
  -- suggestion_json structure:
  -- {
  --   "hook_idea": "string",
  --   "format": "listicle|story|tutorial|reaction|comparison",
  --   "tone": "funny|serious|educational|controversial|inspirational",
  --   "cta": "string",
  --   "reason": "why this suggestion based on performance",
  --   "pattern_key": "source pattern from pattern_stats",
  --   "is_exploration": boolean (30% new patterns)
  -- }
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  generation_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, suggestion_date, platform)
);

-- ============================================
-- B) performance_insights - Weekly aggregated insights
-- ============================================
CREATE TABLE IF NOT EXISTS performance_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  insights_json JSONB NOT NULL,
  -- insights_json structure:
  -- {
  --   "summary": "Human readable summary",
  --   "best_format": { "format": "string", "avg_engagement": number },
  --   "best_tone": { "tone": "string", "avg_engagement": number },
  --   "best_cta": "string",
  --   "best_platform": "string",
  --   "platform_comparison": [{ "platform": "string", "avg_views": number, "avg_engagement": number }],
  --   "week_over_week": { "views_change": number, "engagement_change": number },
  --   "recommendations": ["string", "string", "string"],
  --   "persona_alignment_score": 0-100,
  --   "total_content": number,
  --   "total_views": number
  -- }
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_start)
);

-- ============================================
-- C) planned_posts - Distribution and publishing workflow
-- ============================================
CREATE TABLE IF NOT EXISTS planned_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  hook TEXT NOT NULL,
  caption TEXT,
  hashtags TEXT[],
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'published', 'skipped')),
  source_suggestion_id UUID REFERENCES daily_suggestions(id) ON DELETE SET NULL,
  source_generation_id UUID,
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMPTZ,
  result_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- D) Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_daily_suggestions_user_date
  ON daily_suggestions(user_id, suggestion_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_suggestions_used
  ON daily_suggestions(user_id, used, suggestion_date DESC);

CREATE INDEX IF NOT EXISTS idx_performance_insights_user_period
  ON performance_insights(user_id, period_start DESC);

CREATE INDEX IF NOT EXISTS idx_planned_posts_user_scheduled
  ON planned_posts(user_id, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_planned_posts_status
  ON planned_posts(status, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_planned_posts_user_status
  ON planned_posts(user_id, status);

-- ============================================
-- E) RLS Policies
-- ============================================
ALTER TABLE daily_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_posts ENABLE ROW LEVEL SECURITY;

-- Daily Suggestions Policies
DROP POLICY IF EXISTS "Users can view own suggestions" ON daily_suggestions;
CREATE POLICY "Users can view own suggestions" ON daily_suggestions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own suggestions" ON daily_suggestions;
CREATE POLICY "Users can update own suggestions" ON daily_suggestions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own suggestions" ON daily_suggestions;
CREATE POLICY "Users can insert own suggestions" ON daily_suggestions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Performance Insights Policies
DROP POLICY IF EXISTS "Users can view own insights" ON performance_insights;
CREATE POLICY "Users can view own insights" ON performance_insights
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own insights" ON performance_insights;
CREATE POLICY "Users can insert own insights" ON performance_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Planned Posts Policies
DROP POLICY IF EXISTS "Users can manage own posts" ON planned_posts;
CREATE POLICY "Users can manage own posts" ON planned_posts
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- F) Helper Functions
-- ============================================

-- Function to get today's suggestions for a user
CREATE OR REPLACE FUNCTION get_today_suggestions(p_user_id UUID)
RETURNS SETOF daily_suggestions AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM daily_suggestions
  WHERE user_id = p_user_id
    AND suggestion_date = CURRENT_DATE
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get latest insights for a user
CREATE OR REPLACE FUNCTION get_latest_insights(p_user_id UUID)
RETURNS performance_insights AS $$
DECLARE
  v_result performance_insights;
BEGIN
  SELECT * INTO v_result FROM performance_insights
  WHERE user_id = p_user_id
  ORDER BY period_start DESC
  LIMIT 1;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get upcoming posts for a user
CREATE OR REPLACE FUNCTION get_upcoming_posts(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS SETOF planned_posts AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM planned_posts
  WHERE user_id = p_user_id
    AND status = 'planned'
    AND scheduled_at >= NOW()
  ORDER BY scheduled_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark suggestion as used
CREATE OR REPLACE FUNCTION mark_suggestion_used(
  p_suggestion_id UUID,
  p_generation_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE daily_suggestions
  SET used = TRUE,
      used_at = NOW(),
      generation_id = COALESCE(p_generation_id, generation_id)
  WHERE id = p_suggestion_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update post status
CREATE OR REPLACE FUNCTION update_post_status(
  p_post_id UUID,
  p_status TEXT,
  p_result_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE planned_posts
  SET status = p_status,
      result_id = COALESCE(p_result_id, result_id),
      updated_at = NOW()
  WHERE id = p_post_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- G) Grant permissions
-- ============================================
GRANT EXECUTE ON FUNCTION get_today_suggestions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_insights(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_upcoming_posts(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_suggestion_used(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_post_status(UUID, TEXT, UUID) TO authenticated;
