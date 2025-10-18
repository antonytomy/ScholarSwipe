import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { userId, scholarshipIds } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Get scholarships
    const { data: scholarships, error: scholarshipsError } = await supabaseAdmin
      .from('scholarships')
      .select('*')
      .in('id', scholarshipIds)

    if (scholarshipsError || !scholarships) {
      return NextResponse.json({ error: 'Scholarships not found' }, { status: 404 })
    }

    // Use OpenAI to analyze matches
    const matches = []
    
    for (const scholarship of scholarships) {
      try {
        const prompt = `
Analyze how well this user profile matches this scholarship and provide:
1. A match score (0-1)
2. Win probability (0-1) 
3. 3 specific reasons why it's a good match

USER PROFILE:
- Education Level: ${userProfile.education_level}
- GPA: ${userProfile.gpa}
- Major: ${userProfile.intended_major}
- Ethnicity: ${userProfile.ethnicity}
- First Generation: ${userProfile.first_generation}
- Military: ${userProfile.military}
- Location: ${userProfile.location_state}
- Income: ${userProfile.income_range}
- Extracurriculars: ${userProfile.extracurriculars}
- Career Goals: ${userProfile.career_goals}

SCHOLARSHIP:
- Title: ${scholarship.title}
- Amount: $${scholarship.amount}
- Requirements: ${JSON.stringify(scholarship.requirements)}
- Description: ${scholarship.description}

Respond in JSON format:
{
  "match_score": 0.85,
  "win_probability": 0.72,
  "reasons": ["Reason 1", "Reason 2", "Reason 3"]
}
`

        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
        })

        const response = JSON.parse(completion.choices[0].message.content || '{}')
        
        matches.push({
          scholarship_id: scholarship.id,
          match_score: response.match_score || 0.5,
          win_probability: response.win_probability || 0.3,
          match_reasons: response.reasons || ['Profile matches scholarship criteria']
        })
      } catch (error) {
        console.error('OpenAI error for scholarship:', scholarship.id, error)
        // Fallback to basic matching
        matches.push({
          scholarship_id: scholarship.id,
          match_score: 0.5,
          win_probability: 0.3,
          match_reasons: ['Profile matches scholarship criteria']
        })
      }
    }

    return NextResponse.json({ matches })

  } catch (error) {
    console.error('AI matching error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
