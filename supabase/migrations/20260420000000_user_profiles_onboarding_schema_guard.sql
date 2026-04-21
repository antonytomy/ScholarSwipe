ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS academic_year text;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS intended_majors text[] DEFAULT '{}'::text[];

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS gpa_range text;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS ethnicity_other text;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS extracurriculars text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'location_state'
      AND data_type <> 'text'
  ) THEN
    ALTER TABLE public.user_profiles
      ALTER COLUMN location_state TYPE text USING location_state::text;
  END IF;
END $$;
