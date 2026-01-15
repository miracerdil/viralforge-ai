-- Migration: Add multi-platform support
-- Platforms: tiktok, instagram_reels, instagram_post, youtube_shorts

-- Create platform type (as text with check constraint for flexibility)
-- Using text with default 'tiktok' for backwards compatibility

-- ============================================
-- 1. ANALYSES TABLE
-- ============================================

-- Add platform column to analyses
ALTER TABLE analyses
ADD COLUMN IF NOT EXISTS platform text NOT NULL DEFAULT 'tiktok';

-- Add check constraint for valid platforms
ALTER TABLE analyses
ADD CONSTRAINT analyses_platform_check
CHECK (platform IN ('tiktok', 'instagram_reels', 'instagram_post', 'youtube_shorts'));

-- Create index for filtering by user, platform, and date
CREATE INDEX IF NOT EXISTS idx_analyses_user_platform_created
ON analyses(user_id, platform, created_at DESC);

-- ============================================
-- 2. PLANNER TABLES
-- ============================================

-- Add platform column to planner_requests
ALTER TABLE planner_requests
ADD COLUMN IF NOT EXISTS platform text NOT NULL DEFAULT 'tiktok';

-- Add check constraint
ALTER TABLE planner_requests
ADD CONSTRAINT planner_requests_platform_check
CHECK (platform IN ('tiktok', 'instagram_reels', 'instagram_post', 'youtube_shorts'));

-- Create index
CREATE INDEX IF NOT EXISTS idx_planner_requests_user_platform
ON planner_requests(user_id, platform, created_at DESC);

-- Add platform column to weekly_plans
ALTER TABLE weekly_plans
ADD COLUMN IF NOT EXISTS platform text NOT NULL DEFAULT 'tiktok';

-- Add check constraint
ALTER TABLE weekly_plans
ADD CONSTRAINT weekly_plans_platform_check
CHECK (platform IN ('tiktok', 'instagram_reels', 'instagram_post', 'youtube_shorts'));

-- Create index
CREATE INDEX IF NOT EXISTS idx_weekly_plans_user_platform
ON weekly_plans(user_id, platform, created_at DESC);

-- ============================================
-- 3. HOOK TEMPLATES TABLE
-- ============================================

-- Add platform column to hook_templates
ALTER TABLE hook_templates
ADD COLUMN IF NOT EXISTS platform text NOT NULL DEFAULT 'tiktok';

-- Add check constraint
ALTER TABLE hook_templates
ADD CONSTRAINT hook_templates_platform_check
CHECK (platform IN ('tiktok', 'instagram_reels', 'instagram_post', 'youtube_shorts'));

-- Create composite index for filtering hooks
CREATE INDEX IF NOT EXISTS idx_hook_templates_platform_locale_niche
ON hook_templates(platform, locale, niche, tone);

-- ============================================
-- 4. UPDATE EXISTING DATA (optional - all existing = tiktok)
-- ============================================

-- Update any NULL values to tiktok (should not exist due to DEFAULT, but safety)
UPDATE analyses SET platform = 'tiktok' WHERE platform IS NULL;
UPDATE planner_requests SET platform = 'tiktok' WHERE platform IS NULL;
UPDATE weekly_plans SET platform = 'tiktok' WHERE platform IS NULL;
UPDATE hook_templates SET platform = 'tiktok' WHERE platform IS NULL;

-- ============================================
-- 5. GRANT PERMISSIONS (RLS already handles access)
-- ============================================

-- No additional RLS needed - existing policies cover the new column
-- Users can only read/write their own rows

COMMENT ON COLUMN analyses.platform IS 'Target platform: tiktok, instagram_reels, instagram_post, youtube_shorts';
COMMENT ON COLUMN planner_requests.platform IS 'Target platform for content plan';
COMMENT ON COLUMN weekly_plans.platform IS 'Target platform for weekly plan';
COMMENT ON COLUMN hook_templates.platform IS 'Platform this hook is optimized for';
