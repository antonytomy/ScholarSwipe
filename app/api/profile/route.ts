import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { normalizeProfilePayload } from '@/lib/profile-payload'
import { classifySupabaseError } from '@/lib/supabase-error-utils'
import {
  USER_PROFILE_TABLE,
  buildUserProfileWritePayload,
  filterPayloadToTouchedKeys,
  resolveSupportedUserProfileColumns,
  validateUserProfileWritePayload,
} from '@/lib/user-profile-schema'

// Use admin client if available, fall back to public client
const getDbClient = () => supabaseAdmin || supabase

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID()
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error(`[profile:get:${requestId}] Auth error:`, authError?.message)
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    console.log(`[profile:get:${requestId}] Fetching profile for user ${user.id}`)
    
    // Create an authenticated client that respects RLS using the user's token
    const { createClient } = await import('@supabase/supabase-js')
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` }
        }
      }
    )

    const { data: profile, error } = await authClient
      .from('user_profiles')
      .select('*')
      .or(`id.eq.${user.id},email.eq.${user.email || ''}`)
      .limit(1)
      .maybeSingle()

    if (error) {
      const classified = classifySupabaseError(error)
      console.error(`[profile:get:${requestId}] Profile fetch failed:`, classified.logMessage, error)
      return NextResponse.json({ error: classified.userMessage, details: error.message }, { status: classified.category === 'rls_policy' ? 403 : 500 })
    }
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found. Please complete signup first.' }, { status: 404 })
    }

    // Sanitize string fields that might have quotes or newlines from CSV imports
    const sanitizedProfile = { ...profile }
    for (const key in sanitizedProfile) {
      if (typeof sanitizedProfile[key] === 'string') {
        sanitizedProfile[key] = sanitizedProfile[key]
          .replace(/^[\n\r"]+|[\n\r"]+$/g, '') // Remove wrapping quotes and newlines
          .trim() // standard trim
      }
    }

    console.log(`[profile:get:${requestId}] Profile fetched successfully for ${sanitizedProfile.full_name || user.id}`)
    return NextResponse.json(sanitizedProfile)
  } catch (error) {
    console.error(`[profile:get:${requestId}] Unexpected API error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const requestId = crypto.randomUUID()
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error(`[profile:put:${requestId}] Auth error:`, authError?.message)
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    const updates = await request.json()

    const normalized = normalizeProfilePayload(updates)
    const supportedColumns = await resolveSupportedUserProfileColumns(getDbClient())
    const { payload: fullPayload, unsupportedColumns } = buildUserProfileWritePayload(user.id, normalized, supportedColumns)
    const sanitized = filterPayloadToTouchedKeys(fullPayload, Object.keys(updates)) as Record<string, unknown>

    sanitized.updated_at = new Date().toISOString()
    const payloadValidationErrors = validateUserProfileWritePayload(sanitized)

    if (payloadValidationErrors.length > 0) {
      console.error(`[profile:put:${requestId}] Profile payload validation failed`, {
        authUserId: user.id,
        table: USER_PROFILE_TABLE,
        payload: sanitized,
        validationErrors: payloadValidationErrors,
      })
      return NextResponse.json({ error: payloadValidationErrors.join(', ') }, { status: 400 })
    }

    console.log(`[profile:put:${requestId}] Updating profile for user ${user.id}.`, {
      table: USER_PROFILE_TABLE,
      fields: Object.keys(sanitized),
      unsupportedColumns,
      payload: sanitized,
    })
    
    // Create an authenticated client
    const { createClient } = await import('@supabase/supabase-js')
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` }
        }
      }
    )

    const { data, error } = await authClient
      .from(USER_PROFILE_TABLE)
      .update(sanitized)
      .or(`id.eq.${user.id},email.eq.${user.email || ''}`)
      .select()
      .maybeSingle()

    if (error) {
      const classified = classifySupabaseError(error)
      console.error(`[profile:put:${requestId}] Profile update failed`, {
        authUserId: user.id,
        table: USER_PROFILE_TABLE,
        payload: sanitized,
        error: {
          code: error.code ?? null,
          message: error.message ?? null,
          details: error.details ?? null,
          hint: error.hint ?? null,
        },
      })
      console.error(`[profile:put:${requestId}] Classified profile update failure:`, classified.logMessage)
      return NextResponse.json({ error: classified.userMessage, details: error.message }, { status: classified.category === 'rls_policy' ? 403 : 500 })
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    console.log(`[profile:put:${requestId}] Profile updated successfully for ${user.id}`)

    // Reactive re-evaluation: clear stale 'eligible' matches so new ones surface
    try {
      console.log('Clearing stale eligible matches for user:', user.id)
      const dbClient = supabaseAdmin || supabase
      const { error: clearError } = await dbClient
        .from('scholarship_eligibility')
        .delete()
        .eq('user_id', user.id)
        .eq('status', 'eligible')

      if (clearError) {
        console.error('Error clearing stale eligible matches:', clearError)
      } else {
        console.log('✅ Cleared stale eligible matches — profile change will trigger fresh filtering')
      }
    } catch (clearErr) {
      console.error('Failed to clear eligible matches (non-fatal):', clearErr)
    }

    console.log('Skipping generate-matches edge function during beta; hard filter runs at read time.')

    return NextResponse.json(data)
  } catch (error) {
    console.error('Profile PUT API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
