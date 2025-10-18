import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { SignupData } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const signupData: SignupData = await request.json()
    console.log('Signup attempt for:', signupData.email)
    
    // Validate required fields
    if (!signupData.email || !signupData.password || !signupData.full_name) {
      console.log('Missing required fields')
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
      console.error('Auth error:', authError)
      
      // Provide user-friendly error messages
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please try logging in instead.' },
          { status: 400 }
        )
      } else if (authError.message.includes('Invalid email')) {
        return NextResponse.json(
          { error: 'Please enter a valid email address.' },
          { status: 400 }
        )
      } else if (authError.message.includes('Password')) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters long.' },
          { status: 400 }
        )
      } else {
        return NextResponse.json(
          { error: authError.message },
          { status: 400 }
        )
      }
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    // Create user profile using admin client (bypasses RLS for initial creation)
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

    // Use admin client to bypass RLS for initial profile creation
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert(profileData)

    if (profileError) {
      console.error('Profile creation error:', profileError)
      
      // Provide user-friendly error messages for profile creation
      if (profileError.message.includes('duplicate key') || profileError.message.includes('already exists')) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please try logging in instead.' },
          { status: 400 }
        )
      } else if (profileError.message.includes('foreign key constraint')) {
        return NextResponse.json(
          { error: 'There was an issue creating your profile. Please try again or contact support.' },
          { status: 500 }
        )
      } else if (profileError.message.includes('violates')) {
        return NextResponse.json(
          { error: 'Some of the information provided is invalid. Please check your details and try again.' },
          { status: 400 }
        )
      } else {
        return NextResponse.json(
          { error: 'Failed to create your profile. Please try again.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      message: 'User created successfully',
      user: authData.user
    })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Something went wrong during signup. Please try again.' },
      { status: 500 }
    )
  }
}
