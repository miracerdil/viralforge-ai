-- ============================================
-- VIRALFORGE-AI ADMIN FEATURES MIGRATION
-- ============================================

-- Add admin-related columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS comped_until DATE DEFAULT NULL;

-- Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_disabled ON public.profiles(is_disabled);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Comment for documentation
COMMENT ON COLUMN public.profiles.is_disabled IS 'If true, user cannot access the app';
COMMENT ON COLUMN public.profiles.comped_until IS 'If set and >= today, user gets PRO features for free until this date';
