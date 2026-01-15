-- ============================================
-- Daily Missions & Sharing Features
-- ============================================

-- Daily missions table
CREATE TABLE IF NOT EXISTS daily_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  locale TEXT NOT NULL CHECK (locale IN ('tr', 'en')),
  niche TEXT NOT NULL CHECK (niche IN ('lifestyle', 'comedy', 'education', 'food', 'fitness', 'tech', 'beauty', 'travel', 'general')),
  mission_text TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  xp_reward INT NOT NULL DEFAULT 10,
  is_pro_only BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User mission progress table
CREATE TABLE IF NOT EXISTS user_mission_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES daily_missions(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, mission_id, date)
);

-- User streaks table
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  total_missions_completed INT NOT NULL DEFAULT 0,
  total_xp INT NOT NULL DEFAULT 0,
  last_completed_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shared cards table (for tracking shares)
CREATE TABLE IF NOT EXISTS shared_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_type TEXT NOT NULL CHECK (card_type IN ('analysis', 'planner')),
  reference_id UUID NOT NULL,
  share_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  view_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_missions_locale ON daily_missions(locale);
CREATE INDEX IF NOT EXISTS idx_daily_missions_niche ON daily_missions(niche);
CREATE INDEX IF NOT EXISTS idx_user_mission_progress_user_date ON user_mission_progress(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_streaks_user ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_cards_token ON shared_cards(share_token);

-- RLS Policies
ALTER TABLE daily_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mission_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_cards ENABLE ROW LEVEL SECURITY;

-- Daily missions: anyone can read
CREATE POLICY "Anyone can read missions"
  ON daily_missions FOR SELECT
  USING (true);

-- User mission progress: users can only access their own
CREATE POLICY "Users can view own mission progress"
  ON user_mission_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mission progress"
  ON user_mission_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mission progress"
  ON user_mission_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- User streaks: users can only access their own
CREATE POLICY "Users can view own streaks"
  ON user_streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks"
  ON user_streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks"
  ON user_streaks FOR UPDATE
  USING (auth.uid() = user_id);

-- Shared cards: users can manage their own, anyone can view by token
CREATE POLICY "Users can manage own shared cards"
  ON shared_cards FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view shared cards"
  ON shared_cards FOR SELECT
  USING (true);

-- Function to update streak on mission completion
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  v_streak_record user_streaks%ROWTYPE;
  v_mission daily_missions%ROWTYPE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
  -- Only process when marking as completed
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
    -- Get mission details for XP
    SELECT * INTO v_mission FROM daily_missions WHERE id = NEW.mission_id;

    -- Get or create streak record
    SELECT * INTO v_streak_record FROM user_streaks WHERE user_id = NEW.user_id;

    IF NOT FOUND THEN
      INSERT INTO user_streaks (user_id, current_streak, longest_streak, total_missions_completed, total_xp, last_completed_date)
      VALUES (NEW.user_id, 1, 1, 1, COALESCE(v_mission.xp_reward, 10), CURRENT_DATE);
    ELSE
      -- Check if continuing streak or starting new one
      IF v_streak_record.last_completed_date = v_yesterday THEN
        -- Continue streak
        UPDATE user_streaks SET
          current_streak = current_streak + 1,
          longest_streak = GREATEST(longest_streak, current_streak + 1),
          total_missions_completed = total_missions_completed + 1,
          total_xp = total_xp + COALESCE(v_mission.xp_reward, 10),
          last_completed_date = CURRENT_DATE,
          updated_at = NOW()
        WHERE user_id = NEW.user_id;
      ELSIF v_streak_record.last_completed_date = CURRENT_DATE THEN
        -- Already completed today, just add XP
        UPDATE user_streaks SET
          total_missions_completed = total_missions_completed + 1,
          total_xp = total_xp + COALESCE(v_mission.xp_reward, 10),
          updated_at = NOW()
        WHERE user_id = NEW.user_id;
      ELSE
        -- Streak broken, start new
        UPDATE user_streaks SET
          current_streak = 1,
          total_missions_completed = total_missions_completed + 1,
          total_xp = total_xp + COALESCE(v_mission.xp_reward, 10),
          last_completed_date = CURRENT_DATE,
          updated_at = NOW()
        WHERE user_id = NEW.user_id;
      END IF;
    END IF;

    -- Set completed_at
    NEW.completed_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for streak updates
DROP TRIGGER IF EXISTS trigger_update_streak ON user_mission_progress;
CREATE TRIGGER trigger_update_streak
  BEFORE UPDATE ON user_mission_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streak();

-- Also trigger on insert when completed is true
CREATE OR REPLACE FUNCTION update_user_streak_on_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_streak_record user_streaks%ROWTYPE;
  v_mission daily_missions%ROWTYPE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
  IF NEW.completed = true THEN
    -- Get mission details for XP
    SELECT * INTO v_mission FROM daily_missions WHERE id = NEW.mission_id;

    -- Get or create streak record
    SELECT * INTO v_streak_record FROM user_streaks WHERE user_id = NEW.user_id;

    IF NOT FOUND THEN
      INSERT INTO user_streaks (user_id, current_streak, longest_streak, total_missions_completed, total_xp, last_completed_date)
      VALUES (NEW.user_id, 1, 1, 1, COALESCE(v_mission.xp_reward, 10), CURRENT_DATE);
    ELSE
      IF v_streak_record.last_completed_date = v_yesterday THEN
        UPDATE user_streaks SET
          current_streak = current_streak + 1,
          longest_streak = GREATEST(longest_streak, current_streak + 1),
          total_missions_completed = total_missions_completed + 1,
          total_xp = total_xp + COALESCE(v_mission.xp_reward, 10),
          last_completed_date = CURRENT_DATE,
          updated_at = NOW()
        WHERE user_id = NEW.user_id;
      ELSIF v_streak_record.last_completed_date = CURRENT_DATE THEN
        UPDATE user_streaks SET
          total_missions_completed = total_missions_completed + 1,
          total_xp = total_xp + COALESCE(v_mission.xp_reward, 10),
          updated_at = NOW()
        WHERE user_id = NEW.user_id;
      ELSE
        UPDATE user_streaks SET
          current_streak = 1,
          total_missions_completed = total_missions_completed + 1,
          total_xp = total_xp + COALESCE(v_mission.xp_reward, 10),
          last_completed_date = CURRENT_DATE,
          updated_at = NOW()
        WHERE user_id = NEW.user_id;
      END IF;
    END IF;

    NEW.completed_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_streak_insert ON user_mission_progress;
CREATE TRIGGER trigger_update_streak_insert
  BEFORE INSERT ON user_mission_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streak_on_insert();
