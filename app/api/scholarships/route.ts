import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { performAIMatching } from '@/lib/ai-matching'

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
    const { data: allScholarships, error: scholarshipsError } = await supabaseAdmin!
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
      const { data: userSwipes, error: swipesError } = await supabaseAdmin!
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
      // Check if we should skip AI matching (if it's been failing consistently)
      const shouldSkipAI = false // TODO: Implement persistent failure tracking
      
      if (shouldSkipAI) {
        console.log('⚠️ Skipping AI matching due to previous failures')
        scholarshipsWithMatching = parsedScholarships.map(scholarship => {
          const baseProbability = 0.4
          const amountBonus = scholarship.amount > 10000 ? 0.1 : scholarship.amount > 5000 ? 0.05 : 0
          const deadlineBonus = new Date(scholarship.deadline) > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 0.1 : 0
          const fallbackProbability = Math.min(0.8, baseProbability + amountBonus + deadlineBonus)
          
          return {
            ...scholarship,
            winProbability: fallbackProbability,
            matchReasons: [
              'This scholarship matches your profile',
              'Good opportunity based on your background',
              'Worth applying to increase your chances'
            ],
            tags: generateTags(scholarship, fallbackProbability),
            aiProcessed: false
          }
        })
      } else {
        try {
          console.log('🤖 Starting AI matching for', parsedScholarships.length, 'scholarships')
          
          // Call AI matching function directly (no HTTP request)
          const matches = await performAIMatching(userId, parsedScholarships.map(s => s.id))
          const matchMap = new Map(matches.map((match: any) => [match.scholarship_id, match]))
          
          scholarshipsWithMatching = parsedScholarships.map(scholarship => {
            const match = matchMap.get(scholarship.id)
            return {
              ...scholarship,
              winProbability: (match as any)?.win_probability || 0.3,
              matchReasons: (match as any)?.match_reasons || ['This scholarship may be worth applying to'],
              tags: generateTags(scholarship, (match as any)?.win_probability || 0.3),
              aiProcessed: true
            }
          })
          
          console.log('✅ AI matching completed successfully')
        } catch (error) {
        console.error('❌ AI matching error:', error)
        console.error('❌ Error details:', error instanceof Error ? error.message : String(error))
        console.error('❌ Error type:', error instanceof Error ? error.constructor.name : typeof error)
        if (error instanceof Error) {
          console.error('❌ Error stack:', error.stack)
        }
        // Fallback to default values if AI matching fails
        console.log('⚠️ Using fallback matching due to AI timeout/failure')
        scholarshipsWithMatching = parsedScholarships.map(scholarship => {
          // Generate a more realistic fallback probability based on scholarship data
          const baseProbability = 0.4 // Base 40% chance
          const amountBonus = scholarship.amount > 10000 ? 0.1 : scholarship.amount > 5000 ? 0.05 : 0
          const deadlineBonus = new Date(scholarship.deadline) > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 0.1 : 0
          const fallbackProbability = Math.min(0.8, baseProbability + amountBonus + deadlineBonus)
          
          return {
            ...scholarship,
            winProbability: fallbackProbability,
            matchReasons: [
              'This scholarship matches your profile',
              'Good opportunity based on your background',
              'Worth applying to increase your chances'
            ],
            tags: generateTags(scholarship, fallbackProbability),
            aiProcessed: false
          }
        })
        }
      }
    } else {
      // For non-authenticated users, add default values
      scholarshipsWithMatching = parsedScholarships.map(scholarship => ({
        ...scholarship,
        winProbability: 0.3,
        matchReasons: ['This scholarship may be worth applying to'],
        tags: generateTags(scholarship, 0.3),
        aiProcessed: false
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
