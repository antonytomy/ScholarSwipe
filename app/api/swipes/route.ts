import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { SwipeAction } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    // Get the current user
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    const swipeData: SwipeAction = await request.json()
    
    console.log('💾 Saving swipe action:', {
      scholarship_id: swipeData.scholarship_id,
      action: swipeData.action,
      winProbability: swipeData.winProbability,
      matchReasons: swipeData.matchReasons
    })
    
    // Validate required fields
    if (!swipeData.scholarship_id || !swipeData.action) {
      return NextResponse.json(
        { error: 'Scholarship ID and action are required' },
        { status: 400 }
      )
    }

    // Validate action
    if (!['saved', 'passed', 'liked'].includes(swipeData.action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be saved, passed, or liked' },
        { status: 400 }
      )
    }

    const dbClient = supabaseAdmin || supabase

    // Skip user_swipes entirely due to old foreign key constraints on scholarships_demo,
    // and directly sync to new unified scholarship_eligibility table.
    try {
      const eligStatus = swipeData.action === 'saved' ? 'saved'
        : swipeData.action === 'liked' ? 'applied'
        : 'dismissed'

      const { data, error } = await dbClient
        .from('scholarship_eligibility')
        .upsert({
          user_id: user.id,
          scholarship_id: swipeData.scholarship_id,
          status: eligStatus,
          match_score: swipeData.winProbability || 0.70,
          hard_filter_version: 'v2.0',
        }, { onConflict: 'user_id,scholarship_id' })
        .select()

      if (error) throw error;
      console.log(`✅ Synced eligibility status to '${eligStatus}' for scholarship ${swipeData.scholarship_id}`)

      return NextResponse.json({
        message: 'Swipe action saved successfully',
        data: data[0]
      })
    } catch (syncError) {
      console.error('Failed to sync eligibility status:', syncError)
      return NextResponse.json({ error: 'Failed to save swipe action' }, { status: 500 })
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the current user
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    const dbClient = supabaseAdmin || supabase

    let query = dbClient
      .from('scholarship_eligibility')
      .select(`
        scholarship_id,
        status,
        updated_at,
        match_score
      `)
      .eq('user_id', user.id)

    if (action) {
      const eligStatus = action === 'saved' ? 'saved' : (action === 'liked' ? 'applied' : 'dismissed')
      query = query.eq('status', eligStatus)
    }

    const { data: swipes, error } = await query.order('updated_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch user swipes' },
        { status: 500 }
      )
    }

    if (!swipes || swipes.length === 0) {
      return NextResponse.json([])
    }

    // Find full scholarship metadata for the swipes
    let scholarshipsData: any[] = []
    
    // Fallback: Just query the feed for matching titles or matching IDs.
    // Try grabbing all scholarships at once using the raw scholarship_id matching `id` or `UUID` string.
    const uniqueIds = [...new Set(swipes.map(s => s.scholarship_id))].filter(Boolean)

    if (uniqueIds.length > 0) {
      // First try to match by UUID
      const { data: uData } = await dbClient.from('Scholarship_trial').select('*').in('UUID', uniqueIds)
      if (uData && uData.length > 0) scholarshipsData.push(...uData)
      
      // Then try numeric formatting if possible
      const numericIds = uniqueIds.filter(id => !isNaN(Number(id)))
      if (numericIds.length > 0) {
        const { data: nData } = await dbClient.from('Scholarship_trial').select('*').in('id', numericIds)
        if (nData && nData.length > 0) scholarshipsData.push(...nData)
      }
    }
    
    const scholarshipMap = new Map()
    if (scholarshipsData) {
      scholarshipsData.forEach(s => {
        // Build map on BOTH keys to ensure we catch strings/UUIDs reliably
        if (s.id) scholarshipMap.set(String(s.id), s)
        if (s.UUID) scholarshipMap.set(String(s.UUID), s)
      })
    }
    
    const enrichedSwipes = swipes.map(swipe => {
      // Find the matched metadata
      const matched = scholarshipMap.get(String(swipe.scholarship_id))
      return {
        ...swipe,
        scholarship: matched || null
      }
    })

    return NextResponse.json(enrichedSwipes)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
