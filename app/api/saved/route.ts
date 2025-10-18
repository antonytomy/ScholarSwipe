import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

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

    // Get saved scholarships for the user
    const { data: savedScholarships, error } = await supabaseAdmin
      .from('user_swipes')
      .select(`
        id,
        action,
        created_at,
        scholarship:scholarship_id (*)
      `)
      .eq('user_id', user.id)
      .eq('action', 'saved')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch saved scholarships' },
        { status: 500 }
      )
    }

    // Transform the data to match the expected format
    const transformedData = savedScholarships?.map(item => ({
      id: item.id,
      saved_at: item.created_at,
      scholarship: {
        id: item.scholarship.id,
        title: item.scholarship.title,
        organization: item.scholarship.organization,
        amount: parseFloat(item.scholarship.amount),
        deadline: item.scholarship.deadline,
        description: item.scholarship.description,
        categories: item.scholarship.categories ? JSON.parse(item.scholarship.categories) : [],
        requirements: item.scholarship.requirements ? JSON.parse(item.scholarship.requirements) : []
      }
    })) || []

    return NextResponse.json(transformedData)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}