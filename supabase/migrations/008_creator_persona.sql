-- ============================================
-- Creator Persona Modeling System
-- Adapts AI outputs to user's style over time
-- ============================================

-- 1) Creator Persona Profiles
-- Stores aggregated style preferences and patterns
CREATE TABLE IF NOT EXISTS creator_persona_profiles (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,

  -- Tone weights: { "funny": 0.4, "educational": 0.3, "serious": 0.2, "inspirational": 0.1 }
  tone_weights JSONB NOT NULL DEFAULT '{"funny": 0.2, "serious": 0.2, "educational": 0.2, "controversial": 0.2, "inspirational": 0.2}',

  -- Opening bias: { "question": 0.3, "statement": 0.25, "statistic": 0.2, "story": 0.15, "challenge": 0.1 }
  opening_bias JSONB NOT NULL DEFAULT '{"question": 0.2, "statement": 0.2, "statistic": 0.2, "story": 0.2, "challenge": 0.2}',

  -- Format bias: { "listicle": 0.3, "story": 0.25, "tutorial": 0.2, "reaction": 0.15, "comparison": 0.1 }
  format_bias JSONB NOT NULL DEFAULT '{"listicle": 0.2, "story": 0.2, "tutorial": 0.2, "reaction": 0.2, "comparison": 0.2}',

  -- CTA style preference
  cta_style TEXT NOT NULL DEFAULT 'soft' CHECK (cta_style IN ('soft', 'direct', 'question', 'urgency', 'social_proof')),

  -- Average hook length in words
  avg_hook_length INT NOT NULL DEFAULT 12 CHECK (avg_hook_length BETWEEN 5 AND 30),

  -- Content pacing preference
  pacing TEXT NOT NULL DEFAULT 'medium' CHECK (pacing IN ('fast', 'medium', 'slow')),

  -- Engagement stats for optimization
  total_generations INT NOT NULL DEFAULT 0,
  total_saves INT NOT NULL DEFAULT 0,
  total_exports INT NOT NULL DEFAULT 0,
  total_ab_wins INT NOT NULL DEFAULT 0,

  -- Performance tracking
  avg_performance_score DECIMAL(5,2) DEFAULT NULL,
  best_performing_tone TEXT DEFAULT NULL,
  best_performing_opening TEXT DEFAULT NULL,
  best_performing_format TEXT DEFAULT NULL,

  -- Onboarding answers for initial seeding
  onboarding_answers JSONB DEFAULT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_persona_profiles_updated ON creator_persona_profiles(last_updated_at);

-- 2) Persona Event Logs
-- Tracks all persona-relevant events for learning
CREATE TABLE IF NOT EXISTS persona_event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Event type
  event_type TEXT NOT NULL CHECK (event_type IN (
    'generation',      -- AI generated content
    'save',            -- User saved hook/content
    'export',          -- User exported content
    'ab_test_win',     -- User selected A/B winner
    'result_added',    -- Performance metrics added
    'onboarding'       -- Onboarding completed
  )),

  -- Event metadata
  meta JSONB NOT NULL DEFAULT '{}',
  -- Expected meta structure:
  -- {
  --   "tone": "funny",
  --   "opening_type": "question",
  --   "format": "listicle",
  --   "cta_style": "soft",
  --   "hook_length": 12,
  --   "platform": "tiktok",
  --   "generation_id": "uuid",
  --   "content_snippet": "first 50 chars..."
  -- }

  -- Reference to related content (optional)
  generation_id UUID DEFAULT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_persona_events_user ON persona_event_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_persona_events_type ON persona_event_logs(user_id, event_type);
-- Regular index for recent events queries (partial index with NOW() is not allowed)
CREATE INDEX IF NOT EXISTS idx_persona_events_created ON persona_event_logs(created_at DESC);

-- 3) Content Results
-- Stores performance metrics for content
CREATE TABLE IF NOT EXISTS content_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Reference to the generation
  generation_id UUID NOT NULL,

  -- Platform where content was posted
  platform TEXT NOT NULL DEFAULT 'tiktok',

  -- Performance metrics
  metrics JSONB NOT NULL DEFAULT '{}',
  -- Expected metrics structure:
  -- {
  --   "views": 10000,
  --   "likes": 500,
  --   "comments": 50,
  --   "saves": 100,
  --   "shares": 25,
  --   "completion_rate": 0.65,
  --   "engagement_rate": 0.08
  -- }

  -- Content metadata at time of generation (for correlation)
  content_meta JSONB DEFAULT NULL,
  -- {
  --   "tone": "funny",
  --   "opening_type": "question",
  --   "format": "listicle",
  --   "hook_length": 12
  -- }

  -- Calculated performance score (0-100)
  performance_score DECIMAL(5,2) DEFAULT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_content_results_user ON content_results(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_results_generation ON content_results(generation_id);
CREATE INDEX IF NOT EXISTS idx_content_results_score ON content_results(user_id, performance_score DESC) WHERE performance_score IS NOT NULL;

-- 4) RLS Policies

ALTER TABLE creator_persona_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_event_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_results ENABLE ROW LEVEL SECURITY;

-- Creator Persona Profiles: users can only access their own
DROP POLICY IF EXISTS "Users can view own persona" ON creator_persona_profiles;
CREATE POLICY "Users can view own persona"
  ON creator_persona_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own persona" ON creator_persona_profiles;
CREATE POLICY "Users can update own persona"
  ON creator_persona_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own persona" ON creator_persona_profiles;
CREATE POLICY "Users can insert own persona"
  ON creator_persona_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Persona Event Logs: users can only access their own
DROP POLICY IF EXISTS "Users can view own events" ON persona_event_logs;
CREATE POLICY "Users can view own events"
  ON persona_event_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own events" ON persona_event_logs;
CREATE POLICY "Users can insert own events"
  ON persona_event_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Content Results: users can only access their own
DROP POLICY IF EXISTS "Users can view own results" ON content_results;
CREATE POLICY "Users can view own results"
  ON content_results FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own results" ON content_results;
CREATE POLICY "Users can insert own results"
  ON content_results FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own results" ON content_results;
CREATE POLICY "Users can update own results"
  ON content_results FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- 5) Functions for Persona Updates

-- Function to initialize persona from onboarding
CREATE OR REPLACE FUNCTION initialize_persona_from_onboarding(
  p_user_id UUID,
  p_answers JSONB
) RETURNS void AS $$
DECLARE
  v_tone_weights JSONB;
  v_cta_style TEXT;
  v_pacing TEXT;
  v_avg_hook_length INT;
BEGIN
  -- Parse onboarding answers to set initial weights
  -- Expected answers: { "preferred_tone": "funny", "content_style": "educational", "cta_preference": "soft" }

  v_tone_weights := '{"funny": 0.2, "serious": 0.2, "educational": 0.2, "controversial": 0.2, "inspirational": 0.2}'::JSONB;

  -- Boost preferred tone
  IF p_answers->>'preferred_tone' IS NOT NULL THEN
    v_tone_weights := jsonb_set(v_tone_weights, ARRAY[p_answers->>'preferred_tone'], '0.4');
  END IF;

  -- Set CTA style from preference
  v_cta_style := COALESCE(p_answers->>'cta_preference', 'soft');
  IF v_cta_style NOT IN ('soft', 'direct', 'question', 'urgency', 'social_proof') THEN
    v_cta_style := 'soft';
  END IF;

  -- Set pacing from content style
  v_pacing := CASE p_answers->>'content_style'
    WHEN 'fast_paced' THEN 'fast'
    WHEN 'slow_detailed' THEN 'slow'
    ELSE 'medium'
  END;

  -- Set hook length preference
  v_avg_hook_length := CASE p_answers->>'hook_style'
    WHEN 'short_punchy' THEN 8
    WHEN 'long_detailed' THEN 18
    ELSE 12
  END;

  -- Upsert persona profile
  INSERT INTO creator_persona_profiles (
    user_id,
    tone_weights,
    cta_style,
    pacing,
    avg_hook_length,
    onboarding_answers
  ) VALUES (
    p_user_id,
    v_tone_weights,
    v_cta_style,
    v_pacing,
    v_avg_hook_length,
    p_answers
  )
  ON CONFLICT (user_id) DO UPDATE SET
    tone_weights = EXCLUDED.tone_weights,
    cta_style = EXCLUDED.cta_style,
    pacing = EXCLUDED.pacing,
    avg_hook_length = EXCLUDED.avg_hook_length,
    onboarding_answers = EXCLUDED.onboarding_answers,
    last_updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate performance score from metrics
CREATE OR REPLACE FUNCTION calculate_performance_score(
  p_metrics JSONB
) RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_views INT;
  v_likes INT;
  v_comments INT;
  v_saves INT;
  v_shares INT;
  v_completion_rate DECIMAL;
  v_score DECIMAL;
BEGIN
  v_views := COALESCE((p_metrics->>'views')::INT, 0);
  v_likes := COALESCE((p_metrics->>'likes')::INT, 0);
  v_comments := COALESCE((p_metrics->>'comments')::INT, 0);
  v_saves := COALESCE((p_metrics->>'saves')::INT, 0);
  v_shares := COALESCE((p_metrics->>'shares')::INT, 0);
  v_completion_rate := COALESCE((p_metrics->>'completion_rate')::DECIMAL, 0.5);

  -- Weighted score calculation
  -- Engagement rate * completion rate * reach factor
  IF v_views > 0 THEN
    v_score := (
      (v_likes * 1.0 + v_comments * 3.0 + v_saves * 2.0 + v_shares * 4.0) / v_views * 100.0
    ) * v_completion_rate * LEAST(LOG(v_views + 1) / 5.0, 2.0);
  ELSE
    v_score := 0;
  END IF;

  RETURN LEAST(GREATEST(v_score, 0), 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update persona from events (lightweight, called periodically)
CREATE OR REPLACE FUNCTION update_persona_from_events(
  p_user_id UUID
) RETURNS void AS $$
DECLARE
  v_tone_counts JSONB;
  v_opening_counts JSONB;
  v_format_counts JSONB;
  v_total_events INT;
  v_avg_length INT;
  v_total_saves INT;
  v_total_exports INT;
  v_total_ab_wins INT;
  v_total_generations INT;
  v_best_tone TEXT;
  v_best_opening TEXT;
  v_best_format TEXT;
  v_avg_perf DECIMAL;
BEGIN
  -- Get event counts from last 30 days (weighted more recent)
  SELECT
    COALESCE(jsonb_object_agg(tone, cnt), '{}'::JSONB),
    COUNT(*)
  INTO v_tone_counts, v_total_events
  FROM (
    SELECT
      meta->>'tone' as tone,
      COUNT(*) as cnt
    FROM persona_event_logs
    WHERE user_id = p_user_id
      AND created_at > NOW() - INTERVAL '30 days'
      AND meta->>'tone' IS NOT NULL
      AND event_type IN ('save', 'export', 'ab_test_win')
    GROUP BY meta->>'tone'
  ) t;

  -- Get opening type counts
  SELECT COALESCE(jsonb_object_agg(opening, cnt), '{}'::JSONB)
  INTO v_opening_counts
  FROM (
    SELECT
      meta->>'opening_type' as opening,
      COUNT(*) as cnt
    FROM persona_event_logs
    WHERE user_id = p_user_id
      AND created_at > NOW() - INTERVAL '30 days'
      AND meta->>'opening_type' IS NOT NULL
      AND event_type IN ('save', 'export', 'ab_test_win')
    GROUP BY meta->>'opening_type'
  ) t;

  -- Get format counts
  SELECT COALESCE(jsonb_object_agg(format, cnt), '{}'::JSONB)
  INTO v_format_counts
  FROM (
    SELECT
      meta->>'format' as format,
      COUNT(*) as cnt
    FROM persona_event_logs
    WHERE user_id = p_user_id
      AND created_at > NOW() - INTERVAL '30 days'
      AND meta->>'format' IS NOT NULL
      AND event_type IN ('save', 'export', 'ab_test_win')
    GROUP BY meta->>'format'
  ) t;

  -- Get average hook length from saves
  SELECT COALESCE(AVG((meta->>'hook_length')::INT), 12)::INT
  INTO v_avg_length
  FROM persona_event_logs
  WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '30 days'
    AND meta->>'hook_length' IS NOT NULL
    AND event_type IN ('save', 'export');

  -- Get action counts
  SELECT
    COUNT(*) FILTER (WHERE event_type = 'generation'),
    COUNT(*) FILTER (WHERE event_type = 'save'),
    COUNT(*) FILTER (WHERE event_type = 'export'),
    COUNT(*) FILTER (WHERE event_type = 'ab_test_win')
  INTO v_total_generations, v_total_saves, v_total_exports, v_total_ab_wins
  FROM persona_event_logs
  WHERE user_id = p_user_id;

  -- Get best performing styles from content_results
  SELECT
    content_meta->>'tone',
    content_meta->>'opening_type',
    content_meta->>'format',
    AVG(performance_score)
  INTO v_best_tone, v_best_opening, v_best_format, v_avg_perf
  FROM content_results
  WHERE user_id = p_user_id
    AND performance_score IS NOT NULL
    AND performance_score > 50
  GROUP BY content_meta->>'tone', content_meta->>'opening_type', content_meta->>'format'
  ORDER BY AVG(performance_score) DESC
  LIMIT 1;

  -- Only update if we have enough events
  IF v_total_events >= 3 THEN
    UPDATE creator_persona_profiles SET
      -- Blend current weights with new counts (80% old, 20% new for stability)
      tone_weights = CASE
        WHEN v_tone_counts != '{}'::JSONB THEN
          jsonb_build_object(
            'funny', COALESCE((tone_weights->>'funny')::DECIMAL * 0.8 + COALESCE((v_tone_counts->>'funny')::DECIMAL / NULLIF(v_total_events, 0), 0) * 0.2, 0.2),
            'serious', COALESCE((tone_weights->>'serious')::DECIMAL * 0.8 + COALESCE((v_tone_counts->>'serious')::DECIMAL / NULLIF(v_total_events, 0), 0) * 0.2, 0.2),
            'educational', COALESCE((tone_weights->>'educational')::DECIMAL * 0.8 + COALESCE((v_tone_counts->>'educational')::DECIMAL / NULLIF(v_total_events, 0), 0) * 0.2, 0.2),
            'controversial', COALESCE((tone_weights->>'controversial')::DECIMAL * 0.8 + COALESCE((v_tone_counts->>'controversial')::DECIMAL / NULLIF(v_total_events, 0), 0) * 0.2, 0.2),
            'inspirational', COALESCE((tone_weights->>'inspirational')::DECIMAL * 0.8 + COALESCE((v_tone_counts->>'inspirational')::DECIMAL / NULLIF(v_total_events, 0), 0) * 0.2, 0.2)
          )
        ELSE tone_weights
      END,
      avg_hook_length = CASE
        WHEN v_avg_length BETWEEN 5 AND 30 THEN
          ROUND((avg_hook_length * 0.7 + v_avg_length * 0.3))::INT
        ELSE avg_hook_length
      END,
      total_generations = COALESCE(v_total_generations, total_generations),
      total_saves = COALESCE(v_total_saves, total_saves),
      total_exports = COALESCE(v_total_exports, total_exports),
      total_ab_wins = COALESCE(v_total_ab_wins, total_ab_wins),
      best_performing_tone = COALESCE(v_best_tone, best_performing_tone),
      best_performing_opening = COALESCE(v_best_opening, best_performing_opening),
      best_performing_format = COALESCE(v_best_format, best_performing_format),
      avg_performance_score = COALESCE(v_avg_perf, avg_performance_score),
      last_updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6) Trigger to auto-create persona on profile creation
CREATE OR REPLACE FUNCTION create_default_persona()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO creator_persona_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_persona ON profiles;
CREATE TRIGGER trigger_create_persona
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_persona();

-- 7) Function to normalize persona weights
CREATE OR REPLACE FUNCTION normalize_persona_weights()
RETURNS void AS $$
DECLARE
  rec RECORD;
  tone_sum DECIMAL;
  opening_sum DECIMAL;
  format_sum DECIMAL;
BEGIN
  FOR rec IN SELECT user_id, tone_weights, opening_bias, format_bias FROM creator_persona_profiles LOOP
    -- Calculate sums
    tone_sum := COALESCE((rec.tone_weights->>'funny')::DECIMAL, 0) +
                COALESCE((rec.tone_weights->>'serious')::DECIMAL, 0) +
                COALESCE((rec.tone_weights->>'educational')::DECIMAL, 0) +
                COALESCE((rec.tone_weights->>'controversial')::DECIMAL, 0) +
                COALESCE((rec.tone_weights->>'inspirational')::DECIMAL, 0);

    opening_sum := COALESCE((rec.opening_bias->>'question')::DECIMAL, 0) +
                   COALESCE((rec.opening_bias->>'statement')::DECIMAL, 0) +
                   COALESCE((rec.opening_bias->>'statistic')::DECIMAL, 0) +
                   COALESCE((rec.opening_bias->>'story')::DECIMAL, 0) +
                   COALESCE((rec.opening_bias->>'challenge')::DECIMAL, 0);

    format_sum := COALESCE((rec.format_bias->>'listicle')::DECIMAL, 0) +
                  COALESCE((rec.format_bias->>'story')::DECIMAL, 0) +
                  COALESCE((rec.format_bias->>'tutorial')::DECIMAL, 0) +
                  COALESCE((rec.format_bias->>'reaction')::DECIMAL, 0) +
                  COALESCE((rec.format_bias->>'comparison')::DECIMAL, 0);

    -- Normalize if sum is too far from 1.0
    IF tone_sum > 0 AND (tone_sum < 0.9 OR tone_sum > 1.1) THEN
      UPDATE creator_persona_profiles SET
        tone_weights = jsonb_build_object(
          'funny', ROUND((rec.tone_weights->>'funny')::DECIMAL / tone_sum, 3),
          'serious', ROUND((rec.tone_weights->>'serious')::DECIMAL / tone_sum, 3),
          'educational', ROUND((rec.tone_weights->>'educational')::DECIMAL / tone_sum, 3),
          'controversial', ROUND((rec.tone_weights->>'controversial')::DECIMAL / tone_sum, 3),
          'inspirational', ROUND((rec.tone_weights->>'inspirational')::DECIMAL / tone_sum, 3)
        ),
        last_updated_at = NOW()
      WHERE user_id = rec.user_id;
    END IF;

    IF opening_sum > 0 AND (opening_sum < 0.9 OR opening_sum > 1.1) THEN
      UPDATE creator_persona_profiles SET
        opening_bias = jsonb_build_object(
          'question', ROUND((rec.opening_bias->>'question')::DECIMAL / opening_sum, 3),
          'statement', ROUND((rec.opening_bias->>'statement')::DECIMAL / opening_sum, 3),
          'statistic', ROUND((rec.opening_bias->>'statistic')::DECIMAL / opening_sum, 3),
          'story', ROUND((rec.opening_bias->>'story')::DECIMAL / opening_sum, 3),
          'challenge', ROUND((rec.opening_bias->>'challenge')::DECIMAL / opening_sum, 3)
        ),
        last_updated_at = NOW()
      WHERE user_id = rec.user_id;
    END IF;

    IF format_sum > 0 AND (format_sum < 0.9 OR format_sum > 1.1) THEN
      UPDATE creator_persona_profiles SET
        format_bias = jsonb_build_object(
          'listicle', ROUND((rec.format_bias->>'listicle')::DECIMAL / format_sum, 3),
          'story', ROUND((rec.format_bias->>'story')::DECIMAL / format_sum, 3),
          'tutorial', ROUND((rec.format_bias->>'tutorial')::DECIMAL / format_sum, 3),
          'reaction', ROUND((rec.format_bias->>'reaction')::DECIMAL / format_sum, 3),
          'comparison', ROUND((rec.format_bias->>'comparison')::DECIMAL / format_sum, 3)
        ),
        last_updated_at = NOW()
      WHERE user_id = rec.user_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8) Create personas for existing users
INSERT INTO creator_persona_profiles (user_id)
SELECT id FROM profiles
WHERE id NOT IN (SELECT user_id FROM creator_persona_profiles)
ON CONFLICT (user_id) DO NOTHING;
