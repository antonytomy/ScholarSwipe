-- ============================================================
-- Migration: Create `scholarships_demo` table
-- Run in Supabase Dashboard > SQL Editor > New query
--
-- WARNING: This drops old tables and swipe data.
-- ============================================================

-- 1. Drop dependent foreign keys first
ALTER TABLE IF EXISTS public.user_swipes
  DROP CONSTRAINT IF EXISTS user_swipes_scholarship_id_fkey;

-- 2. Drop existing tables
DROP TABLE IF EXISTS public.scholarship CASCADE;
DROP TABLE IF EXISTS public.scholarships CASCADE;
DROP TABLE IF EXISTS public.scholarships_demo CASCADE;

-- 3. Create the new scholarships_demo table
CREATE TABLE public.scholarships_demo (
  id                        UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Core info
  source_url                TEXT,
  title                     TEXT NOT NULL,
  meta_description          TEXT,
  overview                  TEXT,

  -- Eligibility & application
  eligibility_text          TEXT,
  application_text          TEXT,
  eligibility_fields        TEXT,
  application_materials     TEXT,

  -- Classification
  categories                TEXT,
  grade_level_summary       TEXT,

  -- Match criteria
  amount                    TEXT,
  citizenship_status        TEXT,
  academic_interest         TEXT,
  other_background_interest TEXT,
  state_residency           TEXT,
  minimum_gpa               NUMERIC,

  -- Housekeeping
  is_active                 BOOLEAN NOT NULL DEFAULT true,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Indexes
CREATE INDEX idx_scholarships_demo_is_active   ON public.scholarships_demo(is_active);
CREATE INDEX idx_scholarships_demo_created_at  ON public.scholarships_demo(created_at DESC);
CREATE INDEX idx_scholarships_demo_grade_level ON public.scholarships_demo(grade_level_summary);

-- 5. RLS
ALTER TABLE public.scholarships_demo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active scholarships"
  ON public.scholarships_demo FOR SELECT
  USING (is_active = true);

-- 6. Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_scholarships_demo_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_scholarships_demo_updated_at
  BEFORE UPDATE ON public.scholarships_demo
  FOR EACH ROW
  EXECUTE FUNCTION public.update_scholarships_demo_updated_at();

-- 7. Clear orphaned swipe data and re-add foreign key
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_swipes'
  ) THEN
    TRUNCATE TABLE public.user_swipes;

    ALTER TABLE public.user_swipes
      ADD CONSTRAINT user_swipes_scholarship_id_fkey
      FOREIGN KEY (scholarship_id) REFERENCES public.scholarships_demo(id)
      ON DELETE CASCADE;
  END IF;
END $$;
