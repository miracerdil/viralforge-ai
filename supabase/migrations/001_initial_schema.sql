-- ============================================
-- VIRALFORGE-AI DATABASE SCHEMA
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    plan TEXT NOT NULL DEFAULT 'FREE' CHECK (plan IN ('FREE', 'PRO')),
    stripe_customer_id TEXT,
    preferred_locale TEXT DEFAULT 'tr' CHECK (preferred_locale IN ('tr', 'en')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. ANALYSES TABLE
-- ============================================
CREATE TABLE public.analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    video_path TEXT,
    transcript TEXT,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'done', 'failed')),
    duration_sec INTEGER,
    result_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for faster queries
CREATE INDEX idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX idx_analyses_created_at ON public.analyses(created_at DESC);

-- RLS for analyses
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses"
    ON public.analyses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
    ON public.analyses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses"
    ON public.analyses FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
    ON public.analyses FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 3. ANALYSIS_FRAMES TABLE
-- ============================================
CREATE TABLE public.analysis_frames (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
    frame_path TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for faster queries
CREATE INDEX idx_analysis_frames_analysis_id ON public.analysis_frames(analysis_id);

-- RLS for analysis_frames
ALTER TABLE public.analysis_frames ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analysis frames"
    ON public.analysis_frames FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.analyses
            WHERE analyses.id = analysis_frames.analysis_id
            AND analyses.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own analysis frames"
    ON public.analysis_frames FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.analyses
            WHERE analyses.id = analysis_frames.analysis_id
            AND analyses.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own analysis frames"
    ON public.analysis_frames FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.analyses
            WHERE analyses.id = analysis_frames.analysis_id
            AND analyses.user_id = auth.uid()
        )
    );

-- ============================================
-- 4. USAGE_DAILY TABLE
-- ============================================
CREATE TABLE public.usage_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    analyses_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, date)
);

-- Index for faster queries
CREATE INDEX idx_usage_daily_user_date ON public.usage_daily(user_id, date);

-- RLS for usage_daily
ALTER TABLE public.usage_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
    ON public.usage_daily FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
    ON public.usage_daily FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
    ON public.usage_daily FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================
-- 5. AB_TESTS TABLE
-- ============================================
CREATE TABLE public.ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    input_json JSONB NOT NULL,
    result_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for faster queries
CREATE INDEX idx_ab_tests_user_id ON public.ab_tests(user_id);
CREATE INDEX idx_ab_tests_created_at ON public.ab_tests(created_at DESC);

-- RLS for ab_tests
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ab_tests"
    ON public.ab_tests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ab_tests"
    ON public.ab_tests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ab_tests"
    ON public.ab_tests FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ab_tests"
    ON public.ab_tests FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 6. FUNCTION: Create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 7. STORAGE BUCKETS (Run these in Supabase Dashboard or via API)
-- ============================================
-- Note: Storage bucket creation must be done via Supabase Dashboard or API
-- Buckets to create:
-- 1. videos (private)
-- 2. frames (private)

-- Storage policies will be set up in the dashboard:
-- videos bucket:
--   - INSERT: authenticated users can upload to their own folder (user_id/*)
--   - SELECT: authenticated users can view their own files
--   - DELETE: authenticated users can delete their own files

-- frames bucket:
--   - INSERT: authenticated users can upload to their own folder
--   - SELECT: authenticated users can view their own files
--   - DELETE: authenticated users can delete their own files

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;
