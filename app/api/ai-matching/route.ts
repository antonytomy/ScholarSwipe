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

CRITICAL MATCHING PRIORITY (Check in this exact order):

STEP 1: CHECK DEMOGRAPHIC TARGETING (HIGHEST PRIORITY - Can make or break the match)
- If scholarship title/description specifically mentions a demographic (race, ethnicity, gender, religion, etc.):
  * Student MATCHES that demographic → MINIMUM 70%, likely 75-85%
  * Student DOES NOT match → MAXIMUM 25%, likely 10-20%
  * Examples: "African American Scholarship" + Black student = 75%+
  * Examples: "Women in STEM" + Female STEM student = 80%+
  * Examples: "Hispanic Heritage" + Hispanic student = 75%+
  * Examples: "LGBTQ+ Scholarship" + LGBTQ+ student = 75%+

STEP 2: CHECK HARD REQUIREMENTS (Must meet or very low probability)
- GPA minimum: Student below requirement → MAX 30%
- Major requirement: Wrong major → MAX 35%
- Citizenship: Doesn't meet citizenship requirement → MAX 20%
- Location: Wrong state/region required → MAX 30%
- Education level: Wrong level (high school vs college) → MAX 25%

STEP 3: CALCULATE BASE PROBABILITY (If passed Steps 1 & 2)
- Meets ALL stated requirements adequately → START at 55%
- Meets ALL requirements + exceeds some → START at 65%
- Meets ALL requirements + exceeds most → START at 75%

STEP 4: ADD BONUSES FOR ADVANTAGES
- First-generation student + scholarship values first-gen → +15%
- Military/veteran + military scholarship → +20%
- Underrepresented minority + diversity scholarship → +15%
- Location preference match → +10%
- Major perfectly aligns (e.g., Engineering scholarship + Engineering major) → +15%
- Exceptional GPA (3.8+) → +10%
- Strong extracurriculars matching scholarship focus → +10%

STEP 5: COMPETITIVENESS ADJUSTMENT
- Small local scholarships (<$2,000) → +5%
- Large national scholarships ($15,000+) → -10%
- Niche/specific criteria (fewer applicants) → +5%
- Very broad criteria (many applicants) → -5%

FINAL PROBABILITY RANGES:
- 0.10-0.30: Critical mismatch (wrong demographic, missing key requirements)
- 0.30-0.50: Weak match (meets some requirements, but missing important ones)
- 0.50-0.70: Good match (meets requirements, solid candidate)
- 0.70-0.88: Excellent match (perfect demographic fit OR exceeds all requirements)

EXPECTED DISTRIBUTION: A well-qualified student should see:
- 60-75% for most general scholarships where they meet requirements
- 75-85% for demographic-targeted scholarships where they match the target
- 30-50% for scholarships where they're missing key requirements or wrong demographic
- Only 10-25% for clear mismatches (wrong race for race-specific, wrong major for major-specific, etc.)

CRITICAL - VARIETY IS REQUIRED: 
- NEVER use round numbers like 0.65, 0.70, 0.75, 0.80, 0.50
- NEVER use the same probability for multiple scholarships
- ALWAYS use specific decimals with unique values: 0.67, 0.71, 0.58, 0.82, 0.69, 0.73, etc.
- Avoid clustering around any specific values - spread probabilities across the range
- Each scholarship match is unique - probability should reflect specific factors

BAD examples: 0.65, 0.70, 0.60, 0.50 (too round, too clustered)
GOOD examples: 0.67, 0.71, 0.58, 0.82, 0.69, 0.73, 0.77, 0.63, 0.68, 0.74

IMPORTANT: Respond ONLY with a JSON object in this exact format with a SPECIFIC, UNIQUE decimal value:
{"win_probability": 0.67}

DO NOT USE: 0.32, 0.50, 0.65, 0.70, 0.75, 0.80 - these are forbidden. Use nearby values like 0.31, 0.48, 0.67, 0.72, 0.76, 0.81 instead.
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
            content: 'You are a realistic scholarship advisor who gives balanced, honest assessments. You recognize student strengths while being truthful about competitiveness. Your goal is to help students focus on scholarships where they have a genuine, reasonable chance of winning.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.9
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
Analyze this student-scholarship match and provide 3 SPECIFIC, UNIQUE reasons why they're a good (or poor) fit.

STUDENT PROFILE:
- Education Level: ${user.education_level}
- GPA: ${user.gpa}
- Major: ${user.intended_major}
- Ethnicity: ${user.ethnicity}
- First Generation: ${user.first_generation}
- Location: ${user.location_state}
- Military: ${user.military}
- Extracurriculars: ${user.extracurriculars}
- Special Talents: ${user.special_talents}
- Honors/Awards: ${user.honors_awards}

SCHOLARSHIP:
- Title: ${scholarship.title}
- Amount: $${scholarship.amount}
- Organization: ${scholarship.organization}
- Requirements: ${JSON.stringify(scholarship.requirements)}
- Description: ${scholarship.description}

PROVIDE 3 SPECIFIC MATCH REASONS:

RULES FOR VARIETY:
1. Each reason must be UNIQUE and SPECIFIC to this scholarship
2. Reference SPECIFIC details from student profile or scholarship requirements
3. Mention actual numbers when relevant (GPA, amount, location, etc.)
4. Vary your phrasing - don't repeat patterns
5. Be creative with wording - each scholarship should feel different

GOOD EXAMPLES (specific, varied, descriptive):
- "3.9 GPA exceeds their 3.5 minimum requirement"
- "Computer Science major aligns perfectly with tech focus"
- "Pennsylvania residency matches location requirement"
- "Asian ethnicity aligns with diversity scholarship mission"
- "High Honor Roll status showcases academic excellence"
- "Soccer team captain demonstrates valued leadership skills"
- "First-generation student fits scholarship's diversity goals"
- "Coding competition wins prove technical expertise"

BAD EXAMPLES (too generic, repetitive):
- "Strong GPA and academic involvement" (too vague)
- "Demonstrated leadership and community service" (no specifics)
- "First-generation status may stand out" (too generic)
- "Active in extracurriculars" (what activities? be specific!)

STRICT LENGTH REQUIREMENT: Each reason must be 3-7 words MAXIMUM. Short and punchy!
Be specific and reference actual details from the profile or scholarship.

CRITICAL RULES: 
- MAXIMUM 7 WORDS per reason - NO EXCEPTIONS
- Each reason MUST be a COMPLETE thought
- NEVER use ellipses (...) or cut off mid-sentence
- Use SHORT phrases like: "3.9 GPA exceeds minimum" or "CS major matches perfectly"
- Remove ALL unnecessary words like "aligns with", "demonstrates", "showcases"
- Be direct and concise

IMPORTANT: Respond ONLY with a JSON array of 3 SHORT, complete reasons:
["Short reason 1", "Short reason 2", "Short reason 3"]

GOOD EXAMPLES (short, complete, NO "..."):
["3.9 GPA exceeds requirement", "CS major perfect fit", "Pennsylvania resident", "First-gen matches diversity goal", "High Honor Roll proves excellence", "Soccer captain shows leadership"]

BAD EXAMPLES (too long, will be cut off):
["First-generation status aligns with diversity scholarship mission" - TOO LONG!
["Passion for computer science reflects scholarship focus areas" - TOO LONG!
["Volunteer work demonstrates commitment to community service" - TOO LONG!
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
            content: 'You are a scholarship advisor who writes SHORT, punchy match reasons. Maximum 7 words per reason. Use simple, direct language. No long sentences. Be specific but brief. Never use ellipses or incomplete phrases.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.9
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
        // Return the first 3 reasons, trimmed
        return reasons.slice(0, 3).map(reason => reason.trim())
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
