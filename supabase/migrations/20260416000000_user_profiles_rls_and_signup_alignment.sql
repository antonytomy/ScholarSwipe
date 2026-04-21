ALTER TABLE public.user_profiles
  ENABLE ROW LEVEL SECURITY;

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

UPDATE public.user_profiles
SET intended_majors = ARRAY[intended_major]
WHERE intended_major IS NOT NULL
  AND trim(intended_major) <> ''
  AND (intended_majors IS NULL OR cardinality(intended_majors) = 0);

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;
CREATE POLICY "Users can delete own profile"
ON public.user_profiles
FOR DELETE
TO authenticated
USING (auth.uid() = id);
