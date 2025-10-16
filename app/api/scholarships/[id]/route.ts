import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: scholarship, error } = await supabase
      .from('scholarship')
      .select('*')
      .eq('id', params.id)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Scholarship not found' },
          { status: 404 }
        )
      }
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch scholarship' },
        { status: 500 }
      )
    }

    // Parse JSON fields
    const parsedScholarship = {
      ...scholarship,
      requirements: scholarship.requirements ? JSON.parse(scholarship.requirements) : [],
      categories: scholarship.categories ? JSON.parse(scholarship.categories) : [],
    }

    return NextResponse.json(parsedScholarship)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
