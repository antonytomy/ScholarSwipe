import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

interface UserProfile {
  id: string
  education_level: string
  graduation_year: string
  gpa: string
  sat_score: string
  act_score: string
  intended_major: string
  ethnicity: string
  citizenship: string
  income_range: string
  first_generation: boolean
  location_state: string
  disabilities: string
  military: boolean
  extracurriculars: string
  career_goals: string
  interests: string
}

interface Scholarship {
  id: string
  title: string
  amount: number
  deadline: string
  requirements: any
  categories: any
  description: string
}

// AI-powered matching using OpenAI
async function calculateMatchScore(user: UserProfile, scholarship: Scholarship): Promise<number> {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      console.warn('OpenAI API key not found, using fallback matching')
      return 0.3 // Fallback score
    }

    const prompt = `
You are a HARSH scholarship advisor. Calculate this student's realistic win probability for this scholarship. Be brutally honest.

STUDENT PROFILE:
- Education Level: ${user.education_level}
- Graduation Year: ${user.graduation_year}
- GPA: ${user.gpa}
- SAT Score: ${user.sat_score}
- ACT Score: ${user.act_score}
- Intended Major: ${user.intended_major}
- Ethnicity: ${user.ethnicity}
- Citizenship: ${user.citizenship}
- Income Range: ${user.income_range}
- First Generation: ${user.first_generation}
- Location: ${user.location_state}
- Military Background: ${user.military}
- Extracurriculars: ${user.extracurriculars}
- Career Goals: ${user.career_goals}
- Interests: ${user.interests}

SCHOLARSHIP DETAILS:
- Title: ${scholarship.title}
- Amount: $${scholarship.amount}
- Deadline: ${scholarship.deadline}
- Description: ${scholarship.description}
- Requirements: ${JSON.stringify(scholarship.requirements)}
- Categories: ${JSON.stringify(scholarship.categories)}

CALCULATE WIN PROBABILITY CONSIDERING:
1. Scholarship competitiveness (high-value = more competition)
2. How well student meets ALL requirements
3. Student's uniqueness vs thousands of other applicants
4. Student's specific weaknesses for this scholarship
5. How many other qualified students likely apply
6. Deadline urgency and application complexity

REALISTIC RANGES:
- 0.05-0.25: Poor match, major gaps, highly competitive
- 0.25-0.45: Decent match, some strengths, very competitive  
- 0.45-0.65: Good match, strong profile, moderately competitive
- 0.65-0.85: Excellent match, exceptional profile, less competitive

Be HARSH: Most students get 15-35%. Only truly exceptional matches get 50%+.

IMPORTANT: Respond ONLY with a JSON object in this exact format:
{"win_probability": 0.32}
`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert scholarship advisor with deep knowledge of college financial aid and scholarship matching. Provide accurate, helpful analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      console.error('OpenAI API error:', response.status)
      return 0.3 // Fallback score
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content

    if (!aiResponse) {
      console.error('No AI response received')
      return 0.3 // Fallback score
    }

    // Parse AI response - handle markdown formatting
    let cleanResponse = aiResponse.trim()
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }
    
    try {
      const matchData = JSON.parse(cleanResponse)
      return Math.max(0.05, Math.min(0.95, matchData.win_probability || 0.3))
    } catch (parseError) {
      console.error('JSON parse error for win probability:', parseError)
      console.error('Raw response:', aiResponse)
      return 0.3 // Fallback score
    }

  } catch (error) {
    console.error('AI matching error:', error)
    return 0.3 // Fallback score
  }
}


export async function POST(request: NextRequest) {
  try {
    console.log('🤖 AI matching API called')
    console.log('🤖 supabaseAdmin available:', !!supabaseAdmin)
    console.log('🤖 OpenAI API key available:', !!process.env.OPENAI_API_KEY)
    
    const { userId, scholarshipIds } = await request.json()
    console.log('🤖 AI matching request:', { userId, scholarshipIds: scholarshipIds?.length })

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user profile
    console.log('🤖 Fetching user profile for:', userId)
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    console.log('🤖 Profile query result:', { userProfile: !!userProfile, error: profileError })

    if (profileError || !userProfile) {
      console.log('🤖 Profile error:', profileError)
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Get scholarships
    console.log('🤖 Fetching scholarships:', scholarshipIds)
    const { data: scholarships, error: scholarshipsError } = await supabaseAdmin
      .from('scholarship')
      .select('*')
      .in('id', scholarshipIds)

    console.log('🤖 Scholarships query result:', { count: scholarships?.length, error: scholarshipsError })

    if (scholarshipsError || !scholarships) {
      console.log('🤖 Scholarships error:', scholarshipsError)
      return NextResponse.json({ error: 'Scholarships not found' }, { status: 404 })
    }

    // Calculate matches for each scholarship using AI with batching
    console.log('🤖 Starting AI matching for', scholarships.length, 'scholarships')
    const matches = await Promise.allSettled(scholarships.map(async (scholarship) => {
      try {
        console.log('🤖 Processing scholarship:', scholarship.title)
        // Use Promise.race to timeout individual AI calls
        const aiPromise = Promise.all([
          calculateMatchScore(userProfile as UserProfile, scholarship as Scholarship),
          getAIReasons(userProfile as UserProfile, scholarship as Scholarship)
        ])
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI timeout')), 3000)
        )
        
        const [winProbability, aiReasons] = await Promise.race([aiPromise, timeoutPromise]) as [number, string[]]
        
        console.log('🤖 AI result for', scholarship.title, ':', { winProbability })
        
        return {
          scholarship_id: scholarship.id,
          match_score: winProbability, // Use win probability as match score too
          win_probability: winProbability,
          match_reasons: aiReasons
        }
      } catch (error) {
        console.error('Error matching scholarship:', scholarship.id, error)
        return {
          scholarship_id: scholarship.id,
          match_score: 0.3,
          win_probability: 0.3,
          match_reasons: ['This scholarship may be worth applying to']
        }
      }
    }))

    // Extract successful results
    const successfulMatches = matches
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value)

    console.log('🤖 AI matching completed:', { successful: successfulMatches.length, total: matches.length })
    return NextResponse.json({ matches: successfulMatches })

  } catch (error) {
    console.error('AI matching error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// AI-powered reason generation
async function getAIReasons(user: UserProfile, scholarship: Scholarship): Promise<string[]> {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      return ['This scholarship may be worth applying to']
    }

    const prompt = `
Analyze this student's scholarship match critically. Be honest about strengths and weaknesses.

STUDENT PROFILE:
- Education Level: ${user.education_level}
- GPA: ${user.gpa}
- Intended Major: ${user.intended_major}
- Ethnicity: ${user.ethnicity}
- First Generation: ${user.first_generation}
- Location: ${user.location_state}
- Military: ${user.military}
- Extracurriculars: ${user.extracurriculars}
- Career Goals: ${user.career_goals}

SCHOLARSHIP:
- Title: ${scholarship.title}
- Amount: $${scholarship.amount}
- Requirements: ${JSON.stringify(scholarship.requirements)}

Provide 3 realistic reasons why this student might win this scholarship. Consider competition level and requirements carefully. Be honest - not every match is strong.

Keep each reason under 8 words. Be concise and realistic.

IMPORTANT: Respond ONLY with a JSON array in this exact format:
["Realistic reason 1", "Realistic reason 2", "Realistic reason 3"]
`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful scholarship advisor. Provide specific, personalized reasons for matches.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.4
      })
    })

    if (!response.ok) {
      return ['This scholarship may be worth applying to']
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content

    if (!aiResponse) {
      return ['This scholarship may be worth applying to']
    }

    // Parse AI response - handle markdown formatting
    let cleanResponse = aiResponse.trim()
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }
    
    try {
      const reasons = JSON.parse(cleanResponse)
      if (Array.isArray(reasons)) {
        // Ensure reasons are short and trim if needed
        return reasons.slice(0, 3).map(reason => {
          const trimmed = reason.trim()
          // If reason is too long, truncate it
          if (trimmed.length > 50) {
            return trimmed.substring(0, 47) + '...'
          }
          return trimmed
        })
      }
      return ['Good match for your profile']
    } catch (parseError) {
      console.error('JSON parse error for reasons:', parseError)
      console.error('Raw response:', aiResponse)
      return ['Good match for your profile']
    }

  } catch (error) {
    console.error('AI reasons error:', error)
    return ['Good match for your profile']
  }
}
