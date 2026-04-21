-- Migration: Simplify user_profiles - make removed fields nullable
-- Run this in Supabase SQL Editor: Supabase Dashboard > SQL Editor > New query
--
-- These columns are no longer collected in signup. Making them nullable
-- so new signups don't fail. Existing data is preserved.
-- Only runs ALTER for columns that exist.

DO $$
DECLARE
  col_name text;
  cols text[] := ARRAY['academic_year', 'extracurriculars', 'honors_awards', 
    'target_scholarship_type', 'scholarship_amount_range', 'special_talents', 'parent_occupation'];
BEGIN
  FOREACH col_name IN ARRAY cols
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = col_name
    ) THEN
      EXECUTE format('ALTER TABLE user_profiles ALTER COLUMN %I DROP NOT NULL', col_name);
      RAISE NOTICE 'Dropped NOT NULL from user_profiles.%', col_name;
    ELSE
      RAISE NOTICE 'Column user_profiles.% does not exist, skipping', col_name;
    END IF;
  END LOOP;
END $$;
