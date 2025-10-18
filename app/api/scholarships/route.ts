import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

// Generate tags based on scholarship data and win probability
function generateTags(scholarship: any, winProbability: number): string[] {
  const tags = []
  
  // Amount-based tags
  if (scholarship.amount > 10000) {
    tags.push('High Value')
  } else if (scholarship.amount > 5000) {
    tags.push('Medium Value')
  } else {
    tags.push('Small Amount')
  }
  
  // Win probability tags
  if (winProbability > 0.7) {
    tags.push('High Match')
  } else if (winProbability > 0.5) {
    tags.push('Good Match')
  } else if (winProbability > 0.3) {
    tags.push('Possible Match')
  } else {
    tags.push('Low Match')
  }
  
  // Deadline-based tags
  const deadline = new Date(scholarship.deadline)
  const now = new Date()
  const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysUntilDeadline < 30) {
    tags.push('Urgent')
  } else if (daysUntilDeadline < 60) {
    tags.push('Soon')
  } else {
    tags.push('No Rush')
  }
  
  // Category-based tags
  if (scholarship.categories && Array.isArray(scholarship.categories)) {
    tags.push(...scholarship.categories.slice(0, 2)) // Add up to 2 category tags
  }
  
  return tags.slice(0, 5) // Limit to 5 tags total
}

export async function GET(request: NextRequest) {
  try {
    console.log('Scholarships API called')
    const { searchParams } = new URL(request.url)
    const offset = parseInt(searchParams.get('offset') || '0')
    const limit = parseInt(searchParams.get('limit') || '10')
    const userId = searchParams.get('userId')
    
    console.log('Pagination params:', { offset, limit, userId })
    
    // Validate pagination parameters
    if (offset < 0 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }

    // Get all scholarships first
    const { data: allScholarships, error: scholarshipsError } = await supabaseAdmin
      .from('scholarship')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (scholarshipsError) {
      console.error('Database error:', scholarshipsError)
      return NextResponse.json(
        { error: 'Failed to fetch scholarships' },
        { status: 500 }
      )
    }

    // If user is authenticated, filter out already-swiped scholarships
    let filteredScholarships = allScholarships || []
    
    if (userId) {
      const { data: userSwipes, error: swipesError } = await supabaseAdmin
        .from('user_swipes')
        .select('scholarship_id')
        .eq('user_id', userId)

      if (!swipesError && userSwipes) {
        const swipedIds = new Set(userSwipes.map(swipe => swipe.scholarship_id))
        filteredScholarships = allScholarships.filter(scholarship => 
          !swipedIds.has(scholarship.id)
        )
        console.log(`Filtered out ${allScholarships.length - filteredScholarships.length} already-swiped scholarships`)
      }
    }

    // Apply pagination to filtered results
    const scholarships = filteredScholarships.slice(offset, offset + limit)

    console.log('Database query result:', { scholarshipsCount: scholarships?.length })

    // Parse JSON fields safely
    const parsedScholarships = scholarships?.map(scholarship => {
      let requirements = []
      let categories = []
      
      try {
        requirements = scholarship.requirements ? JSON.parse(scholarship.requirements) : []
      } catch (e) {
        console.error('Error parsing requirements:', e)
        requirements = []
      }
      
      try {
        categories = scholarship.categories ? JSON.parse(scholarship.categories) : []
      } catch (e) {
        console.error('Error parsing categories:', e)
        categories = []
      }
      
      return {
        ...scholarship,
        requirements,
        categories,
      }
    }) || []

    // If user is authenticated, get AI matching scores
    let scholarshipsWithMatching = parsedScholarships
    if (userId && parsedScholarships.length > 0) {
      try {
        const scholarshipIds = parsedScholarships.map(s => s.id)
        const matchingResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai-matching`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            scholarshipIds
          })
        })

        if (matchingResponse.ok) {
          const { matches } = await matchingResponse.json()
          const matchMap = new Map(matches.map((match: any) => [match.scholarship_id, match]))
          
          scholarshipsWithMatching = parsedScholarships.map(scholarship => ({
            ...scholarship,
            winProbability: matchMap.get(scholarship.id)?.win_probability || 0.3,
            matchReasons: matchMap.get(scholarship.id)?.match_reasons || ['This scholarship may be worth applying to'],
            tags: generateTags(scholarship, matchMap.get(scholarship.id)?.win_probability || 0.3)
          }))
        }
      } catch (error) {
        console.error('AI matching error:', error)
        // Fallback to default values if AI matching fails
        scholarshipsWithMatching = parsedScholarships.map(scholarship => ({
          ...scholarship,
          winProbability: 0.3,
          matchReasons: ['This scholarship may be worth applying to'],
          tags: generateTags(scholarship, 0.3)
        }))
      }
    } else {
      // For non-authenticated users, add default values
      scholarshipsWithMatching = parsedScholarships.map(scholarship => ({
        ...scholarship,
        winProbability: 0.3,
        matchReasons: ['This scholarship may be worth applying to'],
        tags: generateTags(scholarship, 0.3)
      }))
    }

    console.log('Returning scholarships:', scholarshipsWithMatching.length)
    return NextResponse.json({ scholarships: scholarshipsWithMatching })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
