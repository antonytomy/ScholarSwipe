CREATE TABLE IF NOT EXISTS public.scholarship_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  scholarship_title TEXT NOT NULL,
  description TEXT NOT NULL,
  amount TEXT NOT NULL,
  deadline DATE NOT NULL,
  official_url TEXT NOT NULL,
  eligibility_requirements TEXT NOT NULL,
  eligible_majors TEXT[] NOT NULL DEFAULT '{}',
  eligible_states TEXT[] NOT NULL DEFAULT '{}',
  minimum_gpa NUMERIC(3,2),
  citizenship_requirements TEXT NOT NULL,
  academic_level TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  additional_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitter_ip INET,
  submitter_user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scholarship_submissions_status
  ON public.scholarship_submissions(status);

CREATE INDEX IF NOT EXISTS idx_scholarship_submissions_created_at
  ON public.scholarship_submissions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scholarship_submissions_contact_email
  ON public.scholarship_submissions(contact_email);

ALTER TABLE public.scholarship_submissions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_scholarship_submissions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_scholarship_submissions_updated_at ON public.scholarship_submissions;

CREATE TRIGGER set_scholarship_submissions_updated_at
  BEFORE UPDATE ON public.scholarship_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_scholarship_submissions_updated_at();
