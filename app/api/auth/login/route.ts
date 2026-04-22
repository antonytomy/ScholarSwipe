import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function serializeAuthError(error: unknown) {
  if (!error || typeof error !== 'object') return { message: String(error) }
  return {
    name: 'name' in error ? (error as { name?: unknown }).name : undefined,
    message: 'message' in error ? (error as { message?: unknown }).message : undefined,
    status: 'status' in error ? (error as { status?: unknown }).status : undefined,
    code: 'code' in error ? (error as { code?: unknown }).code : undefined,
    details: 'details' in error ? (error as { details?: unknown }).details : undefined,
    hint: 'hint' in error ? (error as { hint?: unknown }).hint : undefined,
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Supabase API login failed:', serializeAuthError(error))
      return NextResponse.json(
        { error: error.message, details: serializeAuthError(error) },
        { status: 401 }
      )
    }

    console.log('Supabase API login succeeded:', {
      userId: data.user?.id ?? null,
      hasSession: Boolean(data.session),
    })

    return NextResponse.json({
      message: 'Login successful',
      user: data.user
    })

  } catch (error) {
    console.error('Login error:', {
      error,
      details: serializeAuthError(error),
      stack: error instanceof Error ? error.stack : null,
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
