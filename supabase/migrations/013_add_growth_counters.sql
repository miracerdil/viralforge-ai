-- Migration: Add Growth Assistant usage counters
-- Adds daily_suggestions_used and caption_generations_used to usage_counters

-- Add new columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'usage_counters' AND column_name = 'daily_suggestions_used'
  ) THEN
    ALTER TABLE usage_counters ADD COLUMN daily_suggestions_used INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'usage_counters' AND column_name = 'caption_generations_used'
  ) THEN
    ALTER TABLE usage_counters ADD COLUMN caption_generations_used INTEGER DEFAULT 0;
  END IF;
END $$;
