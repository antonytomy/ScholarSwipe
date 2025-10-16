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
  sat_score?: number
  act_score?: number
  intended_major?: string
  academic_year?: string
  
  // Background & Demographics
  ethnicity?: string
  citizenship?: string
  income_range?: string
  first_generation: boolean
  location_state?: string
  disabilities?: string
  military: boolean
  
  // Activities & Goals
  extracurriculars: string[]
  honors_awards: string[]
  target_scholarship_type: string[]
  scholarship_amount_range?: string
  special_talents: string[]
  parent_occupation?: string
  
  created_at: string
  updated_at: string
}

export interface Scholarship {
  id: string
  external_id?: string
  title: string
  description?: string
  amount?: number
  deadline?: string
  application_url?: string
  organization?: string
  requirements?: string
  categories?: string
  source?: string
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
  gpa: string
  sat_score: string
  act_score: string
  intended_major: string
  academic_year: string
  
  // Background & Demographics
  ethnicity: string
  citizenship: string
  income_range: string
  first_generation: boolean
  location_state: string
  disabilities: string
  military: boolean
  
  // Activities & Goals
  extracurriculars: string
  honors_awards: string
  target_scholarship_type: string
  scholarship_amount_range: string
  special_talents: string
  parent_occupation: string
}
