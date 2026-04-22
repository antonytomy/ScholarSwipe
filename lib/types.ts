export interface UserProfile {
  id: string
  full_name?: string
  email?: string
  phone?: string
  date_of_birth?: string
  gender?: string
  
  // Academic Information
  education_level?: string
  graduation_year?: string
  school?: string
  gpa?: number
  gpa_range?: string
  sat_score?: number
  act_score?: number
  intended_major?: string
  intended_majors?: string[]
  academic_year?: string
  extracurriculars?: string
  
  // Background & Demographics
  ethnicity?: string
  ethnicity_other?: string
  citizenship?: string
  income_range?: string
  first_generation: boolean
  location_state?: string
  disabilities?: string
  military: boolean
  
  created_at: string
  updated_at: string
}

export interface Scholarship {
  id: string
  source_url?: string
  title: string
  meta_description?: string
  overview?: string
  eligibility_text?: string
  application_text?: string
  eligibility_fields?: Record<string, any>
  application_materials?: string[]
  categories?: string[]
  grade_level_summary?: string
  amount?: string
  citizenship_status?: string
  academic_interest?: string
  other_background_interest?: string
  state_residency?: string
  minimum_gpa?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserSwipe {
  id: string
  user_id: string
  scholarship_id: string
  action: 'saved' | 'passed' | 'liked'
  created_at: string
}

export interface SwipeAction {
  scholarship_id: string
  action: 'saved' | 'passed' | 'liked'
  winProbability?: number
  matchReasons?: string[]
}

export interface SignupData {
  // Basic Information
  full_name: string
  email: string
  phone: string
  dob: string
  gender: string
  password: string
  confirmPassword: string
  
  // Academic & Educational
  education_level: string
  graduation_year: string
  school: string
  gpa_mode: "exact" | "range"
  gpa_scale: "4.0" | "4.3" | "5.0" | "5.3" | "100"
  gpa_exact: string
  gpa_range: string
  sat_score: string
  act_score: string
  intended_majors: string[]
  academic_year?: string // Optional; includes High School option
  extracurriculars: string

  // Background & Demographics
  ethnicity: string
  ethnicity_other: string
  citizenship: string
  income_range: string
  first_generation: boolean
  location_state: string
  disabilities: string
  military: boolean
}

export type SignupFailureStage =
  | 'client_validation'
  | 'auth_signup'
  | 'profile_save'
  | 'onboarding_save'
  | 'rls_policy'
  | 'schema_mismatch'
  | 'match_bootstrap'
  | 'cleanup'
  | 'unknown'

export interface SignupApiResponse {
  success: boolean
  message?: string
  error?: string
  warning?: string
  stage?: SignupFailureStage
  requestId?: string
  cleanupAttempted?: boolean
  cleanupSucceeded?: boolean
  details?: string
}
