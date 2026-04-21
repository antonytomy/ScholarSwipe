import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/scholarships/seen
 * 
 * Called by the frontend when a user scrolls past scholarship cards.
 * Marks scholarships as "seen" in scholarship_eligibility so they
 * won't reappear in the discover feed on refresh.
 * 
 * Body: { scholarship_ids: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    const body = await request.json()
    const { scholarship_ids } = body

    if (!scholarship_ids || !Array.isArray(scholarship_ids) || scholarship_ids.length === 0) {
      return NextResponse.json({ error: 'scholarship_ids array is required' }, { status: 400 })
    }

    // Cap at 50 per request to prevent abuse
    const ids = scholarship_ids.slice(0, 50)

    const dbClient = supabaseAdmin || supabase

    // Upsert rows into scholarship_eligibility with status = 'seen'
    // Only update if current status is 'eligible' (don't overwrite saved/applied)
    const rows = ids.map(scholarship_id => ({
      user_id: user.id,
      scholarship_id,
      status: 'seen',
      match_score: 0.70, // default if no existing score
      hard_filter_version: 'v2.0',
    }))

    // First, check which already have a non-eligible status
    const { data: existingRows } = await dbClient
      .from('scholarship_eligibility')
      .select('scholarship_id, status')
      .eq('user_id', user.id)
      .in('scholarship_id', ids)
      .in('status', ['saved', 'applied', 'dismissed'])

    const protectedIds = new Set((existingRows || []).map(r => r.scholarship_id))

    // Only mark as seen those that are eligible or don't exist yet
    const rowsToUpsert = rows.filter(r => !protectedIds.has(r.scholarship_id))

    if (rowsToUpsert.length > 0) {
      const { error: upsertError } = await dbClient
        .from('scholarship_eligibility')
        .upsert(rowsToUpsert, { onConflict: 'user_id,scholarship_id' })

      if (upsertError) {
        console.error('Error marking scholarships as seen:', upsertError)
        return NextResponse.json({ error: 'Failed to mark as seen' }, { status: 500 })
      }
    }

    console.log(`Marked ${rowsToUpsert.length} scholarships as seen for user ${user.id}`)

    return NextResponse.json({
      success: true,
      marked_count: rowsToUpsert.length,
      skipped_count: protectedIds.size,
    })

  } catch (error) {
    console.error('Seen API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
