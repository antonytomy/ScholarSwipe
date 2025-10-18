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

    // Insert or update the swipe action using admin client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('user_swipes')
      .upsert({
        user_id: user.id,
        scholarship_id: swipeData.scholarship_id,
        action: swipeData.action,
      }, {
        onConflict: 'user_id,scholarship_id'
      })
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to save swipe action' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Swipe action saved successfully',
      data: data[0]
    })

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

    let query = supabaseAdmin
      .from('user_swipes')
      .select(`
        id,
        scholarship_id,
        action,
        created_at,
        scholarship:scholarship_id (*)
      `)
      .eq('user_id', user.id)

    if (action && ['saved', 'passed', 'liked'].includes(action)) {
      query = query.eq('action', action)
    }

    const { data: swipes, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch user swipes' },
        { status: 500 }
      )
    }

    return NextResponse.json(swipes || [])

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
