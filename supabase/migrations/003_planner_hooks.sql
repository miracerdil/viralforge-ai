-- =============================================
-- VIRALFORGE-AI: Planner & Hooks Migration
-- =============================================

-- =============================================
-- PLANNER TABLES
-- =============================================

-- Planner Requests Table
CREATE TABLE IF NOT EXISTS public.planner_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    locale TEXT NOT NULL DEFAULT 'tr',
    niche TEXT NOT NULL,
    goal TEXT NOT NULL,
    audience TEXT,
    tone TEXT,
    frequency INT NOT NULL DEFAULT 7,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly Plans Table
CREATE TABLE IF NOT EXISTS public.weekly_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES public.planner_requests(id) ON DELETE CASCADE,
    locale TEXT NOT NULL,
    plan_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for planner tables
CREATE INDEX IF NOT EXISTS idx_planner_requests_user_id ON public.planner_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_planner_requests_created_at ON public.planner_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_user_id ON public.weekly_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_request_id ON public.weekly_plans(request_id);

-- RLS for planner_requests
ALTER TABLE public.planner_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own planner requests"
    ON public.planner_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own planner requests"
    ON public.planner_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own planner requests"
    ON public.planner_requests FOR DELETE
    USING (auth.uid() = user_id);

-- RLS for weekly_plans
ALTER TABLE public.weekly_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weekly plans"
    ON public.weekly_plans FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly plans"
    ON public.weekly_plans FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weekly plans"
    ON public.weekly_plans FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================
-- HOOKS TABLES
-- =============================================

-- Hook Templates Table (public library)
CREATE TABLE IF NOT EXISTS public.hook_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    locale TEXT NOT NULL,
    niche TEXT NOT NULL,
    tone TEXT NOT NULL,
    hook_text TEXT NOT NULL,
    tags TEXT[],
    is_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Favorite Hooks Table
CREATE TABLE IF NOT EXISTS public.user_favorite_hooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    hook_id UUID NOT NULL REFERENCES public.hook_templates(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, hook_id)
);

-- Indexes for hooks tables
CREATE INDEX IF NOT EXISTS idx_hook_templates_locale ON public.hook_templates(locale);
CREATE INDEX IF NOT EXISTS idx_hook_templates_niche ON public.hook_templates(niche);
CREATE INDEX IF NOT EXISTS idx_hook_templates_tone ON public.hook_templates(tone);
CREATE INDEX IF NOT EXISTS idx_hook_templates_locale_niche ON public.hook_templates(locale, niche);
CREATE INDEX IF NOT EXISTS idx_user_favorite_hooks_user_id ON public.user_favorite_hooks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorite_hooks_hook_id ON public.user_favorite_hooks(hook_id);

-- RLS for hook_templates
ALTER TABLE public.hook_templates ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read hook_templates
CREATE POLICY "Authenticated users can view hooks"
    ON public.hook_templates FOR SELECT
    TO authenticated
    USING (true);

-- Only service role can insert/update (admin)
-- No insert/update policies for regular users

-- RLS for user_favorite_hooks
ALTER TABLE public.user_favorite_hooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
    ON public.user_favorite_hooks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
    ON public.user_favorite_hooks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
    ON public.user_favorite_hooks FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================
-- PLANNER USAGE TRACKING (for FREE plan limits)
-- =============================================

-- Function to count plans created this week
CREATE OR REPLACE FUNCTION public.get_weekly_plan_count(p_user_id UUID)
RETURNS INT AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM public.planner_requests
        WHERE user_id = p_user_id
        AND created_at >= date_trunc('week', NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to count user favorites
CREATE OR REPLACE FUNCTION public.get_favorite_count(p_user_id UUID)
RETURNS INT AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM public.user_favorite_hooks
        WHERE user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
