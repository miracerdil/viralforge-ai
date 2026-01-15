-- Performance Tracking and Auto Optimization
-- Tracks AI generation metadata, user-provided results, and pattern statistics

-- ============================================
-- A) ai_generations - Tracks generation metadata
-- ============================================
CREATE TABLE IF NOT EXISTS ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL CHECK (feature IN ('hooks', 'planner', 'abtest', 'script')),
  platform TEXT NOT NULL,
  category_group TEXT,
  category_slug TEXT,
  tone TEXT,
  goal TEXT,
  persona_context JSONB, -- Snapshot of persona data used
  prompt_hash TEXT, -- Hash of the prompt for deduplication
  output_preview TEXT, -- First 500 chars of output
  output_count INTEGER DEFAULT 1, -- Number of items generated
  generation_time_ms INTEGER, -- How long the AI took
  model_used TEXT DEFAULT 'gpt-4o-mini',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- B) content_results - User-provided performance data
-- ============================================
CREATE TABLE IF NOT EXISTS content_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generation_id UUID REFERENCES ai_generations(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('hook', 'plan', 'abtest', 'script')),
  content_preview TEXT, -- What was posted
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  followers_gained INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2), -- Calculated: (likes+comments+shares+saves)/views*100
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- C) pattern_stats - Aggregated pattern scoring
-- ============================================
CREATE TABLE IF NOT EXISTS pattern_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  category_group TEXT,
  category_slug TEXT,
  tone TEXT,
  goal TEXT,
  pattern_key TEXT NOT NULL, -- Combination key for quick lookup
  total_generations INTEGER DEFAULT 0,
  total_results INTEGER DEFAULT 0,
  avg_views DECIMAL(12,2) DEFAULT 0,
  avg_engagement_rate DECIMAL(5,2) DEFAULT 0,
  weighted_score DECIMAL(8,4) DEFAULT 0, -- Combined performance score
  best_performing_preview TEXT, -- Best performing content for this pattern
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, pattern_key)
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ai_generations_user_platform ON ai_generations(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_ai_generations_user_feature ON ai_generations(user_id, feature);
CREATE INDEX IF NOT EXISTS idx_ai_generations_created ON ai_generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_generations_prompt_hash ON ai_generations(prompt_hash);

CREATE INDEX IF NOT EXISTS idx_content_results_generation ON content_results(generation_id);
CREATE INDEX IF NOT EXISTS idx_content_results_user_platform ON content_results(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_content_results_created ON content_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_results_posted ON content_results(posted_at DESC);

CREATE INDEX IF NOT EXISTS idx_pattern_stats_user_platform ON pattern_stats(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_pattern_stats_pattern_key ON pattern_stats(user_id, pattern_key);
CREATE INDEX IF NOT EXISTS idx_pattern_stats_score ON pattern_stats(weighted_score DESC);

-- ============================================
-- RLS Policies - Users can only access their own rows
-- ============================================

-- ai_generations RLS
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own generations"
  ON ai_generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generations"
  ON ai_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own generations"
  ON ai_generations FOR DELETE
  USING (auth.uid() = user_id);

-- content_results RLS
ALTER TABLE content_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own results"
  ON content_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own results"
  ON content_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own results"
  ON content_results FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own results"
  ON content_results FOR DELETE
  USING (auth.uid() = user_id);

-- pattern_stats RLS
ALTER TABLE pattern_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pattern stats"
  ON pattern_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pattern stats"
  ON pattern_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pattern stats"
  ON pattern_stats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pattern stats"
  ON pattern_stats FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Helper function: Calculate engagement rate
-- ============================================
CREATE OR REPLACE FUNCTION calculate_engagement_rate()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.views > 0 THEN
    NEW.engagement_rate := ((COALESCE(NEW.likes, 0) + COALESCE(NEW.comments, 0) + COALESCE(NEW.shares, 0) + COALESCE(NEW.saves, 0))::DECIMAL / NEW.views) * 100;
  ELSE
    NEW.engagement_rate := 0;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_engagement
  BEFORE INSERT OR UPDATE ON content_results
  FOR EACH ROW
  EXECUTE FUNCTION calculate_engagement_rate();

-- ============================================
-- Helper function: Generate pattern key
-- ============================================
CREATE OR REPLACE FUNCTION generate_pattern_key(
  p_platform TEXT,
  p_category_group TEXT,
  p_category_slug TEXT,
  p_tone TEXT,
  p_goal TEXT
) RETURNS TEXT AS $$
BEGIN
  RETURN CONCAT_WS(':',
    COALESCE(p_platform, 'any'),
    COALESCE(p_category_group, 'any'),
    COALESCE(p_category_slug, 'any'),
    COALESCE(p_tone, 'any'),
    COALESCE(p_goal, 'any')
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- Function: Recalculate pattern stats for a user
-- ============================================
CREATE OR REPLACE FUNCTION recalculate_pattern_stats(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  pattern RECORD;
BEGIN
  -- Loop through all unique patterns for this user
  FOR pattern IN
    SELECT DISTINCT
      g.platform,
      g.category_group,
      g.category_slug,
      g.tone,
      g.goal,
      generate_pattern_key(g.platform, g.category_group, g.category_slug, g.tone, g.goal) as pattern_key
    FROM ai_generations g
    WHERE g.user_id = p_user_id
  LOOP
    -- Upsert pattern stats
    INSERT INTO pattern_stats (
      user_id,
      platform,
      category_group,
      category_slug,
      tone,
      goal,
      pattern_key,
      total_generations,
      total_results,
      avg_views,
      avg_engagement_rate,
      weighted_score,
      best_performing_preview,
      last_calculated_at
    )
    SELECT
      p_user_id,
      pattern.platform,
      pattern.category_group,
      pattern.category_slug,
      pattern.tone,
      pattern.goal,
      pattern.pattern_key,
      COUNT(DISTINCT g.id),
      COUNT(DISTINCT r.id),
      COALESCE(AVG(r.views), 0),
      COALESCE(AVG(r.engagement_rate), 0),
      -- Weighted score: 60% engagement rate + 40% normalized views
      COALESCE(
        (AVG(r.engagement_rate) * 0.6) +
        (LEAST(AVG(r.views) / 10000, 10) * 0.4),
        0
      ),
      (
        SELECT cr.content_preview
        FROM content_results cr
        JOIN ai_generations ag ON cr.generation_id = ag.id
        WHERE ag.user_id = p_user_id
          AND ag.platform = pattern.platform
          AND COALESCE(ag.category_group, '') = COALESCE(pattern.category_group, '')
          AND COALESCE(ag.category_slug, '') = COALESCE(pattern.category_slug, '')
        ORDER BY cr.views DESC
        LIMIT 1
      ),
      NOW()
    FROM ai_generations g
    LEFT JOIN content_results r ON r.generation_id = g.id
    WHERE g.user_id = p_user_id
      AND g.platform = pattern.platform
      AND COALESCE(g.category_group, '') = COALESCE(pattern.category_group, '')
      AND COALESCE(g.category_slug, '') = COALESCE(pattern.category_slug, '')
      AND COALESCE(g.tone, '') = COALESCE(pattern.tone, '')
      AND COALESCE(g.goal, '') = COALESCE(pattern.goal, '')
    ON CONFLICT (user_id, pattern_key)
    DO UPDATE SET
      total_generations = EXCLUDED.total_generations,
      total_results = EXCLUDED.total_results,
      avg_views = EXCLUDED.avg_views,
      avg_engagement_rate = EXCLUDED.avg_engagement_rate,
      weighted_score = EXCLUDED.weighted_score,
      best_performing_preview = EXCLUDED.best_performing_preview,
      last_calculated_at = NOW();
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
