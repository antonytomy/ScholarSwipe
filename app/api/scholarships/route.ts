import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

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

    console.log('Returning scholarships:', parsedScholarships.length)
    return NextResponse.json(parsedScholarships)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
