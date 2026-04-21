-- ============================================================
-- Migration: Matching Engine — scholarship_eligibility as central state
-- Run in Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- 1. Add missing columns to scholarship_eligibility if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'scholarship_eligibility'
      AND column_name = 'status'
  ) THEN
    ALTER TABLE public.scholarship_eligibility
      ADD COLUMN status TEXT NOT NULL DEFAULT 'eligible';
    RAISE NOTICE 'Added status column to scholarship_eligibility';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'scholarship_eligibility'
      AND column_name = 'match_score'
  ) THEN
    ALTER TABLE public.scholarship_eligibility
      ADD COLUMN match_score NUMERIC;
    RAISE NOTICE 'Added match_score column to scholarship_eligibility';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'scholarship_eligibility'
      AND column_name = 'hard_filter_version'
  ) THEN
    ALTER TABLE public.scholarship_eligibility
      ADD COLUMN hard_filter_version TEXT;
    RAISE NOTICE 'Added hard_filter_version column to scholarship_eligibility';
  END IF;
END $$;

-- 2. Add index for fast exclusion queries (user + status)
CREATE INDEX IF NOT EXISTS idx_elig_user_status
  ON public.scholarship_eligibility(user_id, status);

-- 3. Add updated_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'scholarship_eligibility'
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.scholarship_eligibility
      ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
    RAISE NOTICE 'Added updated_at column to scholarship_eligibility';
  ELSE
    RAISE NOTICE 'updated_at column already exists on scholarship_eligibility';
  END IF;
END $$;

-- 4. Migrate existing user_swipes data into scholarship_eligibility
-- This preserves saved/applied status so those scholarships won't reappear in feed
INSERT INTO public.scholarship_eligibility (user_id, scholarship_id, status, match_score)
SELECT
  user_id,
  scholarship_id,
  CASE action
    WHEN 'saved' THEN 'saved'
    WHEN 'liked' THEN 'applied'
    ELSE 'seen'
  END,
  0.70
FROM public.user_swipes
WHERE action IS NOT NULL
ON CONFLICT (user_id, scholarship_id)
DO UPDATE SET
  status = EXCLUDED.status,
  updated_at = now();

-- 5. Create auto-update trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_elig_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_elig_updated_at ON public.scholarship_eligibility;
CREATE TRIGGER set_elig_updated_at
  BEFORE UPDATE ON public.scholarship_eligibility
  FOR EACH ROW
  EXECUTE FUNCTION public.update_elig_updated_at();
