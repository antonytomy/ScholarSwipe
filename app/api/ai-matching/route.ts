import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

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
You are an expert scholarship matching AI. Analyze how well this student matches this scholarship opportunity.

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

Analyze the match quality and provide:
1. A match score from 0.0 to 1.0 (where 1.0 is perfect match)
2. 3 specific reasons why this is a good match (or why it's not)
3. The likelihood of winning this scholarship (0.0 to 1.0)

Respond in JSON format:
{
  "match_score": 0.85,
  "win_probability": 0.72,
  "reasons": ["Reason 1", "Reason 2", "Reason 3"]
}
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
        temperature: 0.3
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

    // Parse AI response
    const matchData = JSON.parse(aiResponse)
    return Math.max(0.05, Math.min(0.95, matchData.match_score || 0.3))

  } catch (error) {
    console.error('AI matching error:', error)
    return 0.3 // Fallback score
  }
}

// Calculate win probability based on match score and competition factors
function calculateWinProbability(matchScore: number, scholarship: Scholarship): number {
  // Base probability from match score
  let baseProbability = matchScore

  // Adjust for scholarship amount (higher amounts = more competition)
  const amount = scholarship.amount || 1000
  if (amount > 10000) {
    baseProbability *= 0.8 // 20% reduction for high-value scholarships
  } else if (amount > 5000) {
    baseProbability *= 0.9 // 10% reduction for medium-value scholarships
  }

  // Adjust for deadline (closer deadlines = less competition)
  const deadline = new Date(scholarship.deadline)
  const now = new Date()
  const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysUntilDeadline < 30) {
    baseProbability *= 0.7 // 30% reduction for very close deadlines
  } else if (daysUntilDeadline < 60) {
    baseProbability *= 0.85 // 15% reduction for close deadlines
  }

  // Add some randomness to make it more realistic
  const randomness = (Math.random() - 0.5) * 0.1 // ±5% randomness
  const finalProbability = Math.max(0.01, Math.min(0.95, baseProbability + randomness))

  return Math.round(finalProbability * 100) / 100 // Round to 2 decimal places
}

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

    // Calculate matches for each scholarship using AI
    const matches = await Promise.all(scholarships.map(async (scholarship) => {
      try {
        const matchScore = await calculateMatchScore(userProfile as UserProfile, scholarship as Scholarship)
        const winProbability = calculateWinProbability(matchScore, scholarship as Scholarship)
        
        // Get AI-generated reasons
        const aiReasons = await getAIReasons(userProfile as UserProfile, scholarship as Scholarship)
        
        return {
          scholarship_id: scholarship.id,
          match_score: matchScore,
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

    return NextResponse.json({ matches })

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
Analyze why this student matches this scholarship. Provide 3 specific, personalized reasons.

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

Provide 3 specific reasons why this is a good match. Be personal and detailed.
Respond as a JSON array: ["Reason 1", "Reason 2", "Reason 3"]
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

    // Parse AI response
    const reasons = JSON.parse(aiResponse)
    return Array.isArray(reasons) ? reasons.slice(0, 3) : ['This scholarship may be worth applying to']

  } catch (error) {
    console.error('AI reasons error:', error)
    return ['This scholarship may be worth applying to']
  }
}
