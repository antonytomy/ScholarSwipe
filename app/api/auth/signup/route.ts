import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { SignupData } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const signupData: SignupData = await request.json()
    console.log('Signup attempt for:', signupData.email)
    
    // Validate required fields
    const requiredFields = [
      'email', 'password', 'full_name', 'phone', 'dob', 'gender',
      'education_level', 'graduation_year', 'school', 'gpa', 'intended_major', 'academic_year',
      'ethnicity', 'citizenship', 'income_range', 'location_state',
      'extracurriculars', 'honors_awards', 'target_scholarship_type', 
      'scholarship_amount_range', 'special_talents', 'parent_occupation'
    ]
    
    const missingFields = requiredFields.filter(field => !signupData[field as keyof SignupData])
    
    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields)
      return NextResponse.json(
        { error: `Please fill in all required fields: ${missingFields.join(', ')}` },
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
    const redirectUrl = `https://scholarswipe.com/auth/callback`
    console.log('Email redirect URL:', redirectUrl)
    console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL)
    console.log('Request origin:', request.headers.get('origin'))
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: signupData.email,
      password: signupData.password,
      options: {
        data: {
          full_name: signupData.full_name,
        },
        emailRedirectTo: redirectUrl
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
      phone: signupData.phone,
      date_of_birth: signupData.dob,
      gender: signupData.gender,
      education_level: signupData.education_level,
      graduation_year: signupData.graduation_year,
      school: signupData.school,
      gpa: parseFloat(signupData.gpa),
      sat_score: signupData.sat_score ? parseInt(signupData.sat_score) : null,
      act_score: signupData.act_score ? parseInt(signupData.act_score) : null,
      intended_major: signupData.intended_major,
      academic_year: signupData.academic_year,
      ethnicity: signupData.ethnicity,
      citizenship: signupData.citizenship,
      income_range: signupData.income_range,
      first_generation: signupData.first_generation || false,
      location_state: signupData.location_state,
      disabilities: signupData.disabilities || '',
      military: signupData.military || false,
      extracurriculars: signupData.extracurriculars ? 
        signupData.extracurriculars.split(',').map(s => s.trim()).filter(s => s.length > 0) : [],
      honors_awards: signupData.honors_awards ? 
        signupData.honors_awards.split(',').map(s => s.trim()).filter(s => s.length > 0) : [],
      target_scholarship_type: signupData.target_scholarship_type ? 
        [signupData.target_scholarship_type] : [],
      scholarship_amount_range: signupData.scholarship_amount_range,
      special_talents: signupData.special_talents ? 
        signupData.special_talents.split(',').map(s => s.trim()).filter(s => s.length > 0) : [],
      parent_occupation: signupData.parent_occupation,
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
