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
You are a realistic scholarship advisor. Calculate this student's win probability for this scholarship. Be honest but balanced - not too harsh, not too lenient.

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
- Disabilities: ${user.disabilities}
- Military: ${user.military}
- Extracurriculars: ${user.extracurriculars}
- Career Goals: ${user.career_goals}
- Interests: ${user.interests}

SCHOLARSHIP DETAILS:
- Title: ${scholarship.title}
- Amount: $${scholarship.amount}
- Deadline: ${scholarship.deadline}
- Requirements: ${JSON.stringify(scholarship.requirements)}
- Categories: ${JSON.stringify(scholarship.categories)}
- Description: ${scholarship.description}

CALCULATION RULES:
1. Base probability: 0.1 (10%) if student meets basic requirements
2. GPA bonus: +0.1 for 3.5+, +0.15 for 3.7+, +0.2 for 3.9+
3. Test scores: +0.1 for SAT 1200+, +0.15 for SAT 1400+, +0.2 for SAT 1500+
4. Demographics: +0.1 for underrepresented groups, +0.15 for first-gen
5. Major match: +0.2 if exact match, +0.1 if related
6. Extracurriculars: +0.1 for leadership, +0.05 for relevant activities
7. Financial need: +0.1 if income <$50k, +0.05 if <$100k
8. Location: +0.05 for state/local scholarships
9. Competition penalty: -0.1 for very competitive scholarships
10. Deadline urgency: +0.05 if deadline >30 days away

IMPORTANT: 
- Return ONLY a decimal number between 0.0 and 1.0
- Be realistic - most students get 0.3-0.7 range
- Avoid clustering around 0.32, 0.65, etc. - use varied decimals
- Consider the scholarship's competitiveness and requirements
- Factor in the student's unique advantages and disadvantages

Calculate the win probability as a decimal (e.g., 0.67 for 67%):
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
            content: 'You are a realistic scholarship advisor who provides balanced, honest assessments. Always return only a decimal number between 0.0 and 1.0.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.9,
        max_tokens: 10
      })
    })

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText)
      return 0.3
    }

    const data = await response.json()
    const scoreText = data.choices[0]?.message?.content?.trim()
    
    if (!scoreText) {
      console.error('No score returned from OpenAI')
      return 0.3
    }

    // Parse the score, handling various formats
    let score = parseFloat(scoreText)
    
    // Handle percentage format (e.g., "67%" -> 0.67)
    if (scoreText.includes('%')) {
      score = score / 100
    }
    
    // Handle whole number format (e.g., "67" -> 0.67)
    if (score > 1) {
      score = score / 100
    }
    
    // Ensure score is between 0 and 1
    score = Math.max(0, Math.min(1, score))
    
    console.log(`AI calculated score for ${scholarship.title}: ${score} (${Math.round(score * 100)}%)`)
    return score

  } catch (error) {
    console.error('❌ AI matching error for scholarship:', scholarship.title)
    console.error('❌ Error details:', error)
    console.error('❌ Error type:', error instanceof Error ? error.constructor.name : typeof error)
    if (error instanceof Error) {
      console.error('❌ Error message:', error.message)
      console.error('❌ Error stack:', error.stack)
    }
    return 0.3 // Fallback score
  }
}

// Generate AI-powered match reasons
async function getAIReasons(user: UserProfile, scholarship: Scholarship): Promise<string[]> {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      return ['This scholarship matches your profile', 'Good opportunity based on your background', 'Worth applying to increase your chances']
    }

    const prompt = `
You are a creative scholarship advisor who crafts unique, specific match reasons. Generate 3 short, compelling reasons why this student should apply for this scholarship.

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
- Disabilities: ${user.disabilities}
- Military: ${user.military}
- Extracurriculars: ${user.extracurriculars}
- Career Goals: ${user.career_goals}
- Interests: ${user.interests}

SCHOLARSHIP DETAILS:
- Title: ${scholarship.title}
- Amount: $${scholarship.amount}
- Deadline: ${scholarship.deadline}
- Requirements: ${JSON.stringify(scholarship.requirements)}
- Categories: ${JSON.stringify(scholarship.categories)}
- Description: ${scholarship.description}

RULES:
- Generate exactly 3 reasons
- Each reason should be 3-7 words MAX
- Be specific and unique to this student and scholarship
- NO ellipses (...) or incomplete thoughts
- Use complete, direct phrases
- Focus on the student's strengths and the scholarship's benefits
- Make each reason different and compelling

GOOD EXAMPLES:
- "Strong GPA matches requirements"
- "First-generation student advantage"
- "Perfect major alignment"

BAD EXAMPLES:
- "Good student with..." (incomplete)
- "This scholarship is great because..." (too long)
- "Academic excellence and..." (incomplete)

Generate 3 unique, specific reasons:
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
            content: 'You are a creative scholarship advisor who crafts unique, specific match reasons. Always return exactly 3 short, compelling reasons.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.9,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      console.error('OpenAI API error for reasons:', response.status, response.statusText)
      return ['This scholarship matches your profile', 'Good opportunity based on your background', 'Worth applying to increase your chances']
    }

    const data = await response.json()
    const reasonsText = data.choices[0]?.message?.content?.trim()
    
    if (!reasonsText) {
      console.error('No reasons returned from OpenAI')
      return ['This scholarship matches your profile', 'Good opportunity based on your background', 'Worth applying to increase your chances']
    }

    // Parse reasons from the response
    const reasons = reasonsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Remove numbering (1., 2., 3., etc.)
        return line.replace(/^\d+\.\s*/, '').trim()
      })
      .filter(reason => reason.length > 0)
      .slice(0, 3) // Take only first 3

    // If we don't have 3 reasons, fill with defaults
    while (reasons.length < 3) {
      reasons.push('This scholarship matches your profile')
    }

    console.log(`AI generated reasons for ${scholarship.title}:`, reasons)
    return reasons.slice(0, 3).map(reason => reason.trim())

  } catch (error) {
    console.error('❌ AI reasons error for scholarship:', scholarship.title)
    console.error('❌ Error details:', error)
    console.error('❌ Error type:', error instanceof Error ? error.constructor.name : typeof error)
    if (error instanceof Error) {
      console.error('❌ Error message:', error.message)
      console.error('❌ Error stack:', error.stack)
    }
    return ['This scholarship matches your profile', 'Good opportunity based on your background', 'Worth applying to increase your chances']
  }
}

// Main AI matching function
export async function performAIMatching(userId: string, scholarshipIds: string[]): Promise<any[]> {
  try {
    console.log('🤖 AI matching API called')
    console.log('🤖 supabaseAdmin available:', !!supabaseAdmin)
    console.log('🤖 OpenAI API key available:', !!process.env.OPENAI_API_KEY)
    console.log('🤖 OpenAI API key first 10 chars:', process.env.OPENAI_API_KEY?.substring(0, 10) || 'NOT SET')
    console.log('🤖 All env vars starting with OPENAI:', Object.keys(process.env).filter(k => k.startsWith('OPENAI')))
    
    console.log('🤖 AI matching request:', { userId, scholarshipIds: scholarshipIds?.length })

    if (!userId) {
      throw new Error('User ID is required')
    }

    if (!scholarshipIds || scholarshipIds.length === 0) {
      throw new Error('Scholarship IDs are required')
    }

    // Get user profile
    const { data: userProfile, error: userError } = await supabaseAdmin!
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (userError || !userProfile) {
      console.error('User profile not found:', userError)
      throw new Error('User profile not found')
    }

    console.log('🤖 User profile found:', userProfile.id)

    // Get scholarships
    const { data: scholarships, error: scholarshipsError } = await supabaseAdmin!
      .from('scholarship')
      .select('*')
      .in('id', scholarshipIds)
      .eq('is_active', true)

    if (scholarshipsError || !scholarships) {
      console.error('Scholarships not found:', scholarshipsError)
      throw new Error('Scholarships not found')
    }

    console.log('🤖 Found scholarships:', scholarships.length)

    // Process each scholarship with AI
    const matches = []
    for (const scholarship of scholarships) {
      try {
        console.log(`🤖 Processing scholarship: ${scholarship.title}`)
        
        // Parse JSON fields safely
        let requirements = []
        let categories = []
        
        try {
          requirements = scholarship.requirements ? JSON.parse(scholarship.requirements) : []
        } catch (e) {
          console.error('Error parsing requirements:', e)
          requirements = []
        }
        
        try {
          categories = scholarship.categories ? JSON.parse(scholarship.categories) : []
        } catch (e) {
          console.error('Error parsing categories:', e)
          categories = []
        }

        const scholarshipWithParsedData = {
          ...scholarship,
          requirements,
          categories,
        }

        // Get AI match score and reasons
        const [winProbability, matchReasons] = await Promise.all([
          calculateMatchScore(userProfile, scholarshipWithParsedData),
          getAIReasons(userProfile, scholarshipWithParsedData)
        ])

        matches.push({
          scholarship_id: scholarship.id,
          win_probability: winProbability,
          match_reasons: matchReasons
        })

        console.log(`✅ Processed ${scholarship.title}: ${Math.round(winProbability * 100)}% match`)
      } catch (error) {
        console.error(`❌ Error processing scholarship ${scholarship.title}:`, error)
        // Add fallback match
        matches.push({
          scholarship_id: scholarship.id,
          win_probability: 0.3,
          match_reasons: ['This scholarship matches your profile', 'Good opportunity based on your background', 'Worth applying to increase your chances']
        })
      }
    }

    console.log('✅ AI matching completed for all scholarships')
    return matches

  } catch (error) {
    console.error('❌ AI matching error:', error)
    console.error('❌ Error details:', error instanceof Error ? error.message : String(error))
    console.error('❌ Error type:', error instanceof Error ? error.constructor.name : typeof error)
    if (error instanceof Error) {
      console.error('❌ Error message:', error.message)
      console.error('❌ Error stack:', error.stack)
    }
    throw error
  }
}
