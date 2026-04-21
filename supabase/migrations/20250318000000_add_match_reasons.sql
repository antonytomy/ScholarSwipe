-- ============================================================
-- Migration: Add match_reasons column to scholarship_eligibility
-- Run in Supabase Dashboard > SQL Editor > New query
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'scholarship_eligibility'
      AND column_name = 'match_reasons'
  ) THEN
    ALTER TABLE public.scholarship_eligibility
      ADD COLUMN match_reasons TEXT[] DEFAULT '{}';
    RAISE NOTICE 'Added match_reasons column to scholarship_eligibility';
  ELSE
    RAISE NOTICE 'match_reasons column already exists on scholarship_eligibility';
  END IF;

  -- Also add ai_scored flag to track which rows have been AI-refined
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'scholarship_eligibility'
      AND column_name = 'ai_scored'
  ) THEN
    ALTER TABLE public.scholarship_eligibility
      ADD COLUMN ai_scored BOOLEAN NOT NULL DEFAULT false;
    RAISE NOTICE 'Added ai_scored column to scholarship_eligibility';
  ELSE
    RAISE NOTICE 'ai_scored column already exists on scholarship_eligibility';
  END IF;
END $$;

-- Index for quickly finding un-scored eligible rows
CREATE INDEX IF NOT EXISTS idx_elig_ai_pending
  ON public.scholarship_eligibility(user_id, ai_scored)
  WHERE status = 'eligible' AND ai_scored = false;
