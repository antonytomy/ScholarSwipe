import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { SignupData } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const signupData: SignupData = await request.json()
    
    // Validate required fields
    if (!signupData.email || !signupData.password || !signupData.full_name) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      )
    }

    // Validate password confirmation
    if (signupData.password !== signupData.confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    // Create user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: signupData.email,
      password: signupData.password,
      options: {
        data: {
          full_name: signupData.full_name,
        }
      }
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    // Create user profile
    const profileData = {
      id: authData.user.id,
      full_name: signupData.full_name,
      email: signupData.email,
      phone: signupData.phone || null,
      date_of_birth: signupData.dob || null,
      gender: signupData.gender || null,
      education_level: signupData.education_level || null,
      graduation_year: signupData.graduation_year || null,
      school: signupData.school || null,
      gpa: signupData.gpa ? parseFloat(signupData.gpa) : null,
      sat_score: signupData.sat_score ? parseInt(signupData.sat_score) : null,
      act_score: signupData.act_score ? parseInt(signupData.act_score) : null,
      intended_major: signupData.intended_major || null,
      academic_year: signupData.academic_year || null,
      ethnicity: signupData.ethnicity || null,
      citizenship: signupData.citizenship || null,
      income_range: signupData.income_range || null,
      first_generation: signupData.first_generation,
      location_state: signupData.location_state || null,
      disabilities: signupData.disabilities || null,
      military: signupData.military,
      extracurriculars: signupData.extracurriculars ? 
        signupData.extracurriculars.split(',').map(s => s.trim()).filter(s => s.length > 0) : [],
      honors_awards: signupData.honors_awards ? 
        signupData.honors_awards.split(',').map(s => s.trim()).filter(s => s.length > 0) : [],
      target_scholarship_type: signupData.target_scholarship_type ? 
        signupData.target_scholarship_type.split(',').map(s => s.trim()).filter(s => s.length > 0) : [],
      scholarship_amount_range: signupData.scholarship_amount_range || null,
      special_talents: signupData.special_talents ? 
        signupData.special_talents.split(',').map(s => s.trim()).filter(s => s.length > 0) : [],
      parent_occupation: signupData.parent_occupation || null,
    }

    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert(profileData)

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'User created successfully',
      user: authData.user
    })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
