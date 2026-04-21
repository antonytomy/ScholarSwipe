import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { scholarshipPassesHardFilter } from '@/lib/matching-logic'
import { formatMajorsSummary } from '@/lib/profile-form-options'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const dbClient = supabaseAdmin || supabase

    // 1. Fetch User Profile
    const { data: userProfile, error: profileError } = await dbClient
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // 2. Fetch ALL scholarships from Scholarship_trial
    const { data: allScholarships, error: scholarshipsError } = await dbClient
      .from('Scholarship_trial')
      .select('*')

    if (scholarshipsError || !allScholarships) {
      return NextResponse.json({ error: 'Failed to fetch scholarships' }, { status: 500 })
    }

    // 3. HARD FILTER
    const matchedScholarships: any[] = []

    for (const scholarship of allScholarships) {
      scholarship.id = scholarship.id || scholarship.UUID

      const result = scholarshipPassesHardFilter(userProfile, scholarship)
      if (result.pass) {
        matchedScholarships.push({
          id: scholarship.id,
          title: scholarship.title,
          score: result.score
        })
      }
    }

    return NextResponse.json({
      userProfile: {
        id: userProfile.id,
        gpa: userProfile.gpa,
        major: formatMajorsSummary(userProfile.intended_majors, userProfile.intended_major),
        state: userProfile.location_state,
        first_gen: userProfile.first_generation
      },
      matchesCount: matchedScholarships.length,
      matches: matchedScholarships.slice(0, 10).map(m => ({
        ...m,
        formattedScore: (m.score * 100).toFixed(0) + '%'
      }))
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
