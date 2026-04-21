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

    const dbClient = supabaseAdmin || supabase

    // Get saved scholarships for the user
    const { data: savedSwipes, error } = await dbClient
      .from('user_swipes')
      .select(`
        id,
        action,
        scholarship_id,
        created_at,
        win_probability,
        match_reasons
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
    
    if (!savedSwipes || savedSwipes.length === 0) {
      return NextResponse.json([])
    }
    
    const scholarshipIds = [...new Set(savedSwipes.map(s => s.scholarship_id))]

    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
    const uuidIds = scholarshipIds.filter(id => uuidRegex.test(String(id)))
    const numericIds = scholarshipIds.filter(id => !uuidRegex.test(String(id)) && !isNaN(Number(id)))

    let scholarshipsData: any[] = []

    if (uuidIds.length > 0) {
      const { data, error } = await dbClient
        .from('Scholarship_trial')
        .select('*')
        .in('UUID', uuidIds)
      if (error) console.error('Error fetching by UUID:', error)
      if (data) scholarshipsData.push(...data)
    }

    if (numericIds.length > 0) {
      const { data, error } = await dbClient
        .from('Scholarship_trial')
        .select('*')
        .in('id', numericIds)
      if (error) console.error('Error fetching by numeric id:', error)
      if (data) scholarshipsData.push(...data)
    }

    const scholarshipMap = new Map()
    if (scholarshipsData) {
      scholarshipsData.forEach(s => {
        const sid = s.id || s.UUID
        scholarshipMap.set(sid, s)
      })
    }

    // Transform the data to match the expected format
    const transformedData = savedSwipes.map(item => {
      const scholarship = scholarshipMap.get(item.scholarship_id)
      if (!scholarship) return null
      
      console.log('🔍 Saved scholarship data:', {
        id: scholarship.id || scholarship.UUID,
        title: scholarship.title,
        win_probability: item.win_probability,
        match_reasons: item.match_reasons
      })
      
      return {
        id: item.id,
        saved_at: item.created_at,
        scholarship: {
          id: scholarship.id || scholarship.UUID,
          title: scholarship.title,
          organization: scholarship.organization,
          amount: parseFloat(scholarship.amount) || 0,
          deadline: scholarship.deadline,
          description: scholarship.description || scholarship.meta_description || scholarship.overview,
          application_url: scholarship.source_url,
          categories: scholarship.categories ? (typeof scholarship.categories === 'string' ? JSON.parse(scholarship.categories).catch(()=>[]) : scholarship.categories) : [],
          requirements: scholarship.eligibility_text ? [scholarship.eligibility_text] : [],
          winProbability: item.win_probability || 0.3,
          matchReasons: item.match_reasons ? (typeof item.match_reasons === 'string' ? JSON.parse(item.match_reasons).catch(()=>[]) : item.match_reasons) : []
        }
      }
    }).filter(Boolean)

    return NextResponse.json(transformedData)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}