ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS intended_majors text[] DEFAULT '{}'::text[];

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS gpa_range text;

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS ethnicity_other text;

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS extracurriculars text;

UPDATE public.user_profiles
SET intended_majors = ARRAY[intended_major]
WHERE intended_major IS NOT NULL
  AND trim(intended_major) <> ''
  AND (intended_majors IS NULL OR cardinality(intended_majors) = 0);

CREATE INDEX IF NOT EXISTS idx_user_profiles_intended_majors
ON public.user_profiles
USING gin (intended_majors);
