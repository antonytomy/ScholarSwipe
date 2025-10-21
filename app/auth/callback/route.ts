import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/swipe'
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  console.log('Auth callback received:', { code: !!code, next, error, errorDescription })

  // Handle error cases
  if (error) {
    console.error('Auth callback error:', error, errorDescription)
    return NextResponse.redirect(new URL(`/login?error=${error}&description=${encodeURIComponent(errorDescription || '')}`, requestUrl.origin))
  }

  if (code) {
    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Code exchange error:', exchangeError)
        return NextResponse.redirect(new URL('/login?error=code_exchange_failed', requestUrl.origin))
      }
      
      console.log('Code exchange successful, redirecting to:', next)
    } catch (error) {
      console.error('Unexpected error during code exchange:', error)
      return NextResponse.redirect(new URL('/login?error=unexpected_error', requestUrl.origin))
    }
  } else {
    console.log('No code provided, redirecting to login')
    return NextResponse.redirect(new URL('/login?error=no_code', requestUrl.origin))
  }

  // Redirect to the next URL or default to /swipe
  return NextResponse.redirect(new URL(next, requestUrl.origin))
}

