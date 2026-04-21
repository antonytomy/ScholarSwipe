import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { hardFilterEligible, scholarshipPassesHardFilter } from '@/lib/matching-logic'
import { formatGpaSummary, formatMajorsSummary } from '@/lib/profile-form-options'
import { buildEligibilityChecks, buildMatchReasons } from '@/lib/scholarship-match-ui'

let guestMatchesCache: any[] | null = null
let guestCacheTimestamp = 0
const GUEST_CACHE_TTL = 1000 * 60 * 60 * 24

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
}

function getSupabasePublishableKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY
  )
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  return {
    message: typeof error === 'string' ? error : JSON.stringify(error),
  }
}

function getMissingEnvVars() {
  const missing: string[] = []

  if (!getSupabaseUrl()) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!getSupabasePublishableKey()) {
    missing.push('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
  }

  return missing
}

function generateTags(scholarship: any, winProbability: number): string[] {
  const tags = []
  const isValid = (v: any) => v && v !== 'null' && v !== 'NULL' && v !== 'undefined' && String(v).trim() !== ''

  const amountStr = scholarship.amount || ''
  const amountNum = parseInt(String(amountStr).replace(/[^0-9]/g, ''), 10) || 0
  if (amountNum > 10000) {
    tags.push('High Value')
  } else if (amountNum > 5000) {
    tags.push('Medium Value')
  } else if (amountNum > 0) {
    tags.push('Scholarship')
  }

  if (winProbability > 0.7) {
    tags.push('High Match')
  } else if (winProbability > 0.5) {
    tags.push('Good Match')
  } else if (winProbability > 0.3) {
    tags.push('Possible Match')
  } else {
    tags.push('Low Match')
  }

  if (isValid(scholarship.grade_level_summary)) {
    tags.push(scholarship.grade_level_summary)
  }

  if (isValid(scholarship.academic_interest)) {
    tags.push(scholarship.academic_interest)
  }

  return tags.slice(0, 5)
}

export async function GET(request: NextRequest) {
  try {
    console.log('Scholarships API called')
    const { searchParams } = new URL(request.url)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const userId = searchParams.get('userId')

    console.log('Pagination params:', { offset, limit, userId })

    if (offset < 0 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }

    const missingEnvVars = getMissingEnvVars()
    if (missingEnvVars.length > 0) {
      console.error('Scholarships API misconfigured. Missing env vars:', missingEnvVars)
      return NextResponse.json(
        {
          error: 'Scholarships API is misconfigured',
          details: `Missing env vars: ${missingEnvVars.join(', ')}`,
        },
        { status: 500 }
      )
    }

    const dbClient = supabaseAdmin || supabase
    console.log('Using DB client:', supabaseAdmin ? 'admin' : 'public')

    let authClient = dbClient
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const supabaseUrl = getSupabaseUrl()
      const supabasePublishableKey = getSupabasePublishableKey()

      if (!supabaseUrl || !supabasePublishableKey) {
        throw new Error('Supabase auth client is not configured')
      }

      const { createClient } = await import('@supabase/supabase-js')
      authClient = createClient(
        supabaseUrl,
        supabasePublishableKey,
        {
          global: {
            headers: { Authorization: `Bearer ${token}` }
          }
        }
      )
    }

    if (!userId) {
      const now = Date.now()
      if (guestMatchesCache && now - guestCacheTimestamp < GUEST_CACHE_TTL) {
        console.log('Returning cached guest matches')
        return NextResponse.json({ scholarships: guestMatchesCache })
      }

      console.log('Generating fresh guest matches...')
      const { data: sampleScholarships, error: sampleError } = await dbClient
        .from('Scholarship_trial')
        .select('*')
        .limit(Math.min(limit, 20))

      if (sampleError) {
        console.error('Sample fetch error:', sampleError)
        return NextResponse.json({ error: 'Failed to fetch scholarships' }, { status: 500 })
      }

      if (!sampleScholarships || sampleScholarships.length === 0) {
        return NextResponse.json({ scholarships: [] })
      }

      const result = sampleScholarships.map((scholarship, index) => {
        scholarship.id = scholarship.id || scholarship.UUID
        const guestScore = Math.max(0.5, 0.8 - index * 0.01)
        return {
          ...scholarship,
          winProbability: guestScore,
          matchReasons: ['Create your profile to unlock personalized scholarship filtering.'],
          eligibilityChecks: [],
          tags: generateTags(scholarship, guestScore),
          aiProcessed: false,
          isGuestMatch: true,
        }
      })

      guestMatchesCache = result
      guestCacheTimestamp = now

      return NextResponse.json({
        scholarships: result,
        meta: { total: result.length, aiScored: 0, matchingMode: 'hard-filter-only' }
      })
    }

    const { data: userProfile, error: profileError } = await authClient
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
    }

    if (!userProfile) {
      console.log('No user profile found, returning unfiltered results')
      const { data: fallback } = await dbClient
        .from('Scholarship_trial')
        .select('*')
        .limit(limit)

      return NextResponse.json({
        scholarships: (fallback || []).map((scholarship) => ({
          ...scholarship,
          id: scholarship.id || scholarship.UUID,
          winProbability: 0.3,
          matchReasons: ['Complete your profile for personalized matches'],
          eligibilityChecks: [],
          tags: generateTags(scholarship, 0.3),
          aiProcessed: false,
        })),
        meta: { total: fallback?.length || 0, aiScored: 0, matchingMode: 'hard-filter-only' }
      })
    }

    console.log('User profile loaded:', {
      gpa: userProfile.gpa,
      major: formatMajorsSummary(userProfile.intended_majors, userProfile.intended_major),
      state: userProfile.location_state,
    })

    const { data: cachedRows, error: cachedError } = await dbClient
      .from('scholarship_eligibility')
      .select('scholarship_id, match_score')
      .eq('user_id', userId)
      .eq('status', 'eligible')
      .order('match_score', { ascending: false })

    if (cachedError) {
      console.error('Error fetching cached scores:', cachedError)
    }

    const cachedMap = new Map<string, number>()
    if (cachedRows && cachedRows.length > 0) {
      for (const row of cachedRows) {
        cachedMap.set(row.scholarship_id, row.match_score || 0)
      }
      console.log(`Found ${cachedMap.size} cached scores`)
    }

    const { data: excludedRows, error: excludeError } = await dbClient
      .from('scholarship_eligibility')
      .select('scholarship_id')
      .eq('user_id', userId)
      .in('status', ['applied'])

    if (excludeError) {
      console.error('Error fetching excluded IDs:', excludeError)
    }

    const excludedIds = new Set((excludedRows || []).map((row) => row.scholarship_id))
    console.log(`Excluded ${excludedIds.size} already-consumed scholarships`)

    const { data: allScholarships, error: scholarshipsError } = await dbClient
      .from('Scholarship_trial')
      .select('*')

    if (scholarshipsError) {
      console.error('Database error fetching scholarships:', scholarshipsError)
      return NextResponse.json(
        {
          error: 'Failed to fetch scholarships',
          details: scholarshipsError.message || 'Database query failed',
        },
        { status: 500 }
      )
    }

    if (!allScholarships || allScholarships.length === 0) {
      return NextResponse.json({ scholarships: [] })
    }

    console.log('Total scholarships from DB:', allScholarships.length)

    const scoredScholarships: any[] = []
    let disqualified = 0

    for (const scholarship of allScholarships) {
      scholarship.id = scholarship.id || scholarship.UUID
      if (excludedIds.has(scholarship.id)) continue

      if (!hardFilterEligible(userProfile, scholarship)) {
        disqualified++
        continue
      }

      const cachedScore = cachedMap.get(scholarship.id)
      if (cachedScore && cachedScore > 0) {
        scoredScholarships.push({
          ...scholarship,
          _matchScore: cachedScore,
          _matchReasons: ['Previously matched from your profile details'],
        })
        continue
      }

      const result = scholarshipPassesHardFilter(userProfile, scholarship)
      scoredScholarships.push({
        ...scholarship,
        _matchScore: result.score,
        _matchReasons: result.reasons,
      })
    }

    console.log(`Pre-ranking: ${scoredScholarships.length} eligible, ${disqualified} disqualified`)

    scoredScholarships.sort((a, b) => (b._matchScore || 0) - (a._matchScore || 0))

    const paginatedScholarships = scoredScholarships.slice(offset, offset + limit)

    console.log(
      `Hard filter profile: major=${formatMajorsSummary(userProfile.intended_majors, userProfile.intended_major || 'General')}, ` +
      `gpa=${formatGpaSummary(userProfile.gpa, userProfile.gpa_range)}, state=${userProfile.location_state || 'Any'}`
    )

    const results = paginatedScholarships.flatMap((scholarship) => {
      try {
        const fallbackReasons = scholarship._matchReasons || ['Eligibility match']
        const matchReasons = buildMatchReasons(userProfile, scholarship, fallbackReasons)
        const eligibilityChecks = buildEligibilityChecks(userProfile, scholarship)

        return [{
          ...scholarship,
          winProbability: scholarship._matchScore,
          matchReasons,
          eligibilityChecks,
          tags: generateTags(scholarship, scholarship._matchScore),
          aiProcessed: false,
        }]
      } catch (scholarshipError) {
        console.error('Failed to shape scholarship result:', {
          scholarshipId: scholarship.id,
          title: scholarship.title,
          error: formatError(scholarshipError),
        })
        return []
      }
    })

    results.sort((a, b) => (b.winProbability || 0) - (a.winProbability || 0))

    console.log(`Returning ${results.length} scholarships (hard-filter only)`)

    return NextResponse.json({
      scholarships: results,
      meta: { total: scoredScholarships.length, aiScored: 0, matchingMode: 'hard-filter-only' }
    })
  } catch (error) {
    const formattedError = formatError(error)
    console.error('Scholarships API unhandled error:', formattedError)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: formattedError.message,
      },
      { status: 500 }
    )
  }
}
