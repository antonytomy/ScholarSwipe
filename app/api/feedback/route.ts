import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, subject, message } = body || {}

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 })
    }

    const { error } = await supabaseAdmin!
      .from('feedback')
      .insert({
        name: name || null,
        email: email || null,
        subject: subject || null,
        message,
      })

    if (error) {
      console.error('Failed to save feedback:', error)
      return NextResponse.json({ error: 'Failed to submit feedback.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error handling feedback submission:', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

