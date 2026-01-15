-- =============================================
-- Help & Support System Migration
-- =============================================

-- Help Articles (FAQ)
CREATE TABLE IF NOT EXISTS help_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title_tr TEXT NOT NULL,
  title_en TEXT NOT NULL,
  content_md_tr TEXT NOT NULL,
  content_md_en TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Help article categories
CREATE TABLE IF NOT EXISTS help_categories (
  id TEXT PRIMARY KEY,
  name_tr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_tr TEXT,
  description_en TEXT,
  icon TEXT DEFAULT 'HelpCircle',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Insert default help categories
INSERT INTO help_categories (id, name_tr, name_en, description_tr, description_en, icon, sort_order) VALUES
  ('getting_started', 'Başlangıç', 'Getting Started', 'ViralForge AI''yi kullanmaya başlayın', 'Get started with ViralForge AI', 'Rocket', 1),
  ('hook_generator', 'Hook Oluşturucu', 'Hook Generator', 'Hook oluşturma hakkında', 'About hook generation', 'Lightbulb', 2),
  ('video_analysis', 'Video Analizi', 'Video Analysis', 'Video analizi özellikleri', 'Video analysis features', 'Video', 3),
  ('content_planner', 'İçerik Planlayıcı', 'Content Planner', 'İçerik planlama araçları', 'Content planning tools', 'Calendar', 4),
  ('ab_testing', 'A/B Test', 'A/B Testing', 'A/B test özellikleri', 'A/B testing features', 'FlaskConical', 5),
  ('xp_rewards', 'XP & Ödüller', 'XP & Rewards', 'Ödül sistemi hakkında', 'About the reward system', 'Gift', 6),
  ('subscription_billing', 'Abonelik & Faturalandırma', 'Subscription & Billing', 'Plan ve ödeme bilgileri', 'Plan and payment info', 'CreditCard', 7),
  ('account_settings', 'Hesap Ayarları', 'Account Settings', 'Hesap yönetimi', 'Account management', 'Settings', 8)
ON CONFLICT (id) DO NOTHING;

-- Bug Reports
CREATE TABLE IF NOT EXISTS bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  page_url TEXT,
  browser_info JSONB DEFAULT '{}',
  device_info JSONB DEFAULT '{}',
  screenshot_url TEXT,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'in_progress', 'resolved', 'wont_fix', 'duplicate')),
  assigned_to TEXT,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Bug report comments (admin responses)
CREATE TABLE IF NOT EXISTS bug_report_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bug_report_id UUID REFERENCES bug_reports(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_admin BOOLEAN DEFAULT false,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Feature Requests / Feedback
CREATE TABLE IF NOT EXISTS feedback_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'feature' CHECK (category IN ('feature', 'improvement', 'integration', 'other')),
  importance TEXT DEFAULT 'medium' CHECK (importance IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'under_review', 'planned', 'in_progress', 'shipped', 'rejected')),
  vote_count INTEGER DEFAULT 0,
  admin_response TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Feedback votes (users can vote on feedback)
CREATE TABLE IF NOT EXISTS feedback_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID REFERENCES feedback_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(feedback_id, user_id)
);

-- Onboarding Steps Configuration
CREATE TABLE IF NOT EXISTS onboarding_config (
  step_key TEXT PRIMARY KEY,
  title_tr TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_tr TEXT,
  description_en TEXT,
  xp_reward INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  icon TEXT DEFAULT 'CheckCircle',
  action_url TEXT,
  action_label_tr TEXT,
  action_label_en TEXT
);

-- Insert default onboarding steps
INSERT INTO onboarding_config (step_key, title_tr, title_en, description_tr, description_en, xp_reward, sort_order, icon, action_url, action_label_tr, action_label_en) VALUES
  ('generate_first_hook', 'İlk Hook''unu Oluştur', 'Generate Your First Hook', 'Hook kütüphanesini keşfet ve ilk hook''unu oluştur', 'Explore the hook library and create your first hook', 50, 1, 'Lightbulb', '/hooks', 'Hook Oluştur', 'Create Hook'),
  ('pick_platform', 'Platform Seç', 'Pick Your Platform', 'Hedef platformunu seç (TikTok, Reels, Shorts)', 'Choose your target platform (TikTok, Reels, Shorts)', 25, 2, 'Smartphone', '/hooks', 'Platform Seç', 'Choose Platform'),
  ('analyze_first_video', 'İlk Videoyu Analiz Et', 'Analyze First Video', 'Bir video yükle ve AI analizini gör', 'Upload a video and see the AI analysis', 50, 3, 'Video', '/dashboard', 'Video Yükle', 'Upload Video'),
  ('create_content_plan', 'İçerik Planı Oluştur', 'Create Content Plan', 'Haftalık içerik planı oluştur', 'Create a weekly content plan', 50, 4, 'Calendar', '/planner', 'Plan Oluştur', 'Create Plan'),
  ('complete_first_abtest', 'İlk A/B Testini Yap', 'Complete First A/B Test', 'İki hook''u karşılaştır ve kazananı seç', 'Compare two hooks and pick a winner', 25, 5, 'FlaskConical', '/abtest', 'Test Başlat', 'Start Test'),
  ('visit_rewards_shop', 'Ödül Mağazasını Ziyaret Et', 'Visit Rewards Shop', 'XP''ni ödüllere dönüştür', 'Convert your XP into rewards', 25, 6, 'Gift', '/rewards', 'Mağazaya Git', 'Go to Shop')
ON CONFLICT (step_key) DO NOTHING;

-- User Onboarding Progress
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  step_key TEXT REFERENCES onboarding_config(step_key) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT now(),
  xp_awarded BOOLEAN DEFAULT false,
  UNIQUE(user_id, step_key)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_help_articles_category ON help_articles(category);
CREATE INDEX IF NOT EXISTS idx_help_articles_published ON help_articles(is_published);
CREATE INDEX IF NOT EXISTS idx_bug_reports_user ON bug_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_feedback_requests_user ON feedback_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_requests_status ON feedback_requests(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user ON onboarding_progress(user_id);

-- RLS Policies

-- Help Articles (public read)
ALTER TABLE help_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read published help articles" ON help_articles;
CREATE POLICY "Anyone can read published help articles" ON help_articles
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Admins can manage help articles" ON help_articles;
CREATE POLICY "Admins can manage help articles" ON help_articles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Help Categories (public read)
ALTER TABLE help_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read help categories" ON help_categories;
CREATE POLICY "Anyone can read help categories" ON help_categories
  FOR SELECT USING (is_active = true);

-- Bug Reports
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bug reports" ON bug_reports;
CREATE POLICY "Users can view own bug reports" ON bug_reports
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create bug reports" ON bug_reports;
CREATE POLICY "Users can create bug reports" ON bug_reports
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can manage bug reports" ON bug_reports;
CREATE POLICY "Admins can manage bug reports" ON bug_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Bug Report Comments
ALTER TABLE bug_report_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view comments on own bug reports" ON bug_report_comments;
CREATE POLICY "Users can view comments on own bug reports" ON bug_report_comments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM bug_reports WHERE id = bug_report_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Users can add comments to own bug reports" ON bug_report_comments;
CREATE POLICY "Users can add comments to own bug reports" ON bug_report_comments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM bug_reports WHERE id = bug_report_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Feedback Requests
ALTER TABLE feedback_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read feedback" ON feedback_requests;
CREATE POLICY "Anyone can read feedback" ON feedback_requests
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create feedback" ON feedback_requests;
CREATE POLICY "Authenticated users can create feedback" ON feedback_requests
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can manage feedback" ON feedback_requests;
CREATE POLICY "Admins can manage feedback" ON feedback_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Admins can delete feedback" ON feedback_requests;
CREATE POLICY "Admins can delete feedback" ON feedback_requests
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Feedback Votes
ALTER TABLE feedback_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can vote on feedback" ON feedback_votes;
CREATE POLICY "Users can vote on feedback" ON feedback_votes
  FOR ALL USING (user_id = auth.uid());

-- Onboarding Config (public read)
ALTER TABLE onboarding_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read onboarding config" ON onboarding_config;
CREATE POLICY "Anyone can read onboarding config" ON onboarding_config
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage onboarding config" ON onboarding_config;
CREATE POLICY "Admins can manage onboarding config" ON onboarding_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Onboarding Progress
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own onboarding progress" ON onboarding_progress;
CREATE POLICY "Users can view own onboarding progress" ON onboarding_progress
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own onboarding progress" ON onboarding_progress;
CREATE POLICY "Users can update own onboarding progress" ON onboarding_progress
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Function to complete onboarding step and award XP
CREATE OR REPLACE FUNCTION complete_onboarding_step(
  p_user_id UUID,
  p_step_key TEXT
) RETURNS JSONB AS $$
DECLARE
  v_xp_reward INTEGER;
  v_already_completed BOOLEAN;
  v_result JSONB;
BEGIN
  -- Check if already completed
  SELECT EXISTS(
    SELECT 1 FROM onboarding_progress
    WHERE user_id = p_user_id AND step_key = p_step_key
  ) INTO v_already_completed;

  IF v_already_completed THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Step already completed'
    );
  END IF;

  -- Get XP reward
  SELECT xp_reward INTO v_xp_reward
  FROM onboarding_config
  WHERE step_key = p_step_key AND is_active = true;

  IF v_xp_reward IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Invalid step'
    );
  END IF;

  -- Mark step as completed
  INSERT INTO onboarding_progress (user_id, step_key, xp_awarded)
  VALUES (p_user_id, p_step_key, true);

  -- Award XP
  IF v_xp_reward > 0 THEN
    INSERT INTO xp_ledger (user_id, amount, reason, reference_type, reference_id)
    VALUES (p_user_id, v_xp_reward, 'Onboarding: ' || p_step_key, 'onboarding', p_step_key);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'xp_awarded', v_xp_reward,
    'step_key', p_step_key
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's onboarding status
CREATE OR REPLACE FUNCTION get_onboarding_status(p_user_id UUID)
RETURNS TABLE (
  step_key TEXT,
  title_tr TEXT,
  title_en TEXT,
  description_tr TEXT,
  description_en TEXT,
  xp_reward INTEGER,
  icon TEXT,
  action_url TEXT,
  action_label_tr TEXT,
  action_label_en TEXT,
  is_completed BOOLEAN,
  completed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    oc.step_key,
    oc.title_tr,
    oc.title_en,
    oc.description_tr,
    oc.description_en,
    oc.xp_reward,
    oc.icon,
    oc.action_url,
    oc.action_label_tr,
    oc.action_label_en,
    (op.id IS NOT NULL) AS is_completed,
    op.completed_at
  FROM onboarding_config oc
  LEFT JOIN onboarding_progress op ON op.step_key = oc.step_key AND op.user_id = p_user_id
  WHERE oc.is_active = true
  ORDER BY oc.sort_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment feedback vote count
CREATE OR REPLACE FUNCTION increment_feedback_vote()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE feedback_requests SET vote_count = vote_count + 1 WHERE id = NEW.feedback_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_feedback_vote()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE feedback_requests SET vote_count = vote_count - 1 WHERE id = OLD.feedback_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_feedback_vote ON feedback_votes;
CREATE TRIGGER trigger_increment_feedback_vote
  AFTER INSERT ON feedback_votes
  FOR EACH ROW EXECUTE FUNCTION increment_feedback_vote();

DROP TRIGGER IF EXISTS trigger_decrement_feedback_vote ON feedback_votes;
CREATE TRIGGER trigger_decrement_feedback_vote
  AFTER DELETE ON feedback_votes
  FOR EACH ROW EXECUTE FUNCTION decrement_feedback_vote();

-- Storage bucket for bug report screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('support-screenshots', 'support-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for support-screenshots
DROP POLICY IF EXISTS "Users can upload screenshots" ON storage.objects;
CREATE POLICY "Users can upload screenshots" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'support-screenshots'
    AND auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Anyone can view screenshots" ON storage.objects;
CREATE POLICY "Anyone can view screenshots" ON storage.objects
  FOR SELECT USING (bucket_id = 'support-screenshots');
