import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "") 

export const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

// ─── Per-User Cost Limiter ($0.50 max) ───
const userCostMap = new Map<string, number>()
const MAX_COST_PER_USER = 0.50
const EST_COST_PER_CALL = 0.00005

export function checkCostLimit(userId: string): boolean {
  const spent = userCostMap.get(userId) || 0
  if (spent >= MAX_COST_PER_USER) return false
  userCostMap.set(userId, spent + EST_COST_PER_CALL)
  return true
}

export function getUserSpent(userId: string): number {
  return userCostMap.get(userId) || 0
}

interface UserProfile {
  education_level: string
  academic_year: string
  gpa: string
  intended_major: string
  intended_majors?: string[]
  citizenship: string
  income_range: string
  first_generation: boolean | string
  location_state: string
  disabilities: string
  military: boolean | string
  extracurriculars?: string
  career_goals?: string
  interests?: string
}

function getMajorText(user: UserProfile) {
  if (Array.isArray(user.intended_majors) && user.intended_majors.length > 0) {
    return user.intended_majors.join(", ")
  }
  return user.intended_major
}

interface Scholarship {
  title: string
  amount: string | number
  deadline: string
  description: string
  requirements?: any
  categories?: any
}

// ─── Retry helper with exponential backoff ───
// Handles 429 (rate limit) AND 403 (forbidden/quota exhausted)
async function callWithRetry(fn: () => Promise<any>, maxRetries = 2): Promise<any> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      const status = error?.status || error?.httpStatusCode
      const isRetryable = status === 429 || error?.message?.includes('429')
      const isForbidden = status === 403 || error?.message?.includes('403')

      if (isForbidden) {
        console.error('⛔ Gemini 403 Forbidden — API key may be blocked or quota exhausted. Falling back to hard filter scores.')
        throw error  // Don't retry 403s — it won't resolve
      }

      if (isRetryable && attempt < maxRetries) {
        const waitMs = Math.min(5000 * Math.pow(2, attempt), 30000)
        console.log(`⏳ Rate limited, retrying in ${waitMs / 1000}s (attempt ${attempt + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, waitMs))
        continue
      }
      throw error
    }
  }
}

/**
 * BATCH AI RANKING — sends up to 20 scholarships in ONE API call.
 * AI returns ranked scores + reasons for all of them at once.
 * Much more efficient than scoring one-at-a-time.
 */
export async function batchAiRankScholarships(
  user: UserProfile,
  scholarships: { title: string, amount: string, description: string, id: string }[]
): Promise<{ id: string, score: number, reasons: string[] }[]> {
  if (scholarships.length === 0) return []

  const limit = Math.min(scholarships.length, 20)
  const batch = scholarships.slice(0, limit)

  const scholarshipList = batch.map((s, i) =>
    `${i + 1}. "${s.title}" — ${s.amount || 'Varies'}\n   ${(s.description || '').substring(0, 150)}`
  ).join('\n\n')

  const prompt = `
You are a scholarship advisor. Rank these ${limit} scholarships by how well they match this student.

STUDENT:
- Major: ${getMajorText(user)}
- GPA: ${user.gpa}
- Year: ${user.academic_year}
- State: ${user.location_state}
- Citizenship: ${user.citizenship}
- First Gen: ${user.first_generation}
- Military: ${user.military}

SCHOLARSHIPS:
${scholarshipList}

RULES:
1. If a scholarship targets a specific field that DOESN'T match "${getMajorText(user)}", give it a LOW score (0.1-0.3)
2. If it targets "${getMajorText(user)}" or a related STEM field, give it a HIGH score (0.7-0.95)
3. If it's open to all fields, score 0.5-0.7 based on other criteria match
4. Consider GPA, state, citizenship, and background alignment

Respond with JSON array, one entry per scholarship in the SAME ORDER:
[{"score": 0.85, "reason": "One sentence why it fits or doesn't (max 10 words)"},...]
Return EXACTLY ${limit} entries.
`

  try {
    const result = await callWithRetry(async () => {
      return await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      })
    })

    const text = result.response.text()
    const parsed = JSON.parse(text)

    if (!Array.isArray(parsed) || parsed.length < limit) {
      console.error('AI batch returned wrong count:', parsed?.length, 'expected:', limit)
      return []
    }

    return batch.map((s, i) => ({
      id: s.id,
      score: Math.max(0.05, Math.min(parsed[i]?.score || 0.3, 0.99)),
      reasons: [parsed[i]?.reason || 'AI-matched for your profile'],
    }))
  } catch (error) {
    console.error('Batch AI ranking failed:', error)
    return []  // Empty = fallback to hard filter scores
  }
}

/**
 * Combined AI scoring + reasons in a SINGLE API call to minimize requests.
 */
export async function calculateAiMatchScoreAndReasons(
  user: UserProfile, 
  scholarship: Scholarship
): Promise<{ score: number, reasons: string[] }> {
  try {
    const prompt = `
You are a realistic scholarship advisor. Analyze this student-scholarship match.

STUDENT PROFILE:
- Education Level: ${user.education_level}
- Year: ${user.academic_year}
- GPA: ${user.gpa}
- Intended Major: ${getMajorText(user)}
- Citizenship: ${user.citizenship}
- Income Range: ${user.income_range}
- First Generation: ${user.first_generation}
- Location: ${user.location_state}
- Military Background: ${user.military}
- Extracurriculars: ${user.extracurriculars ?? 'Not specified'}

SCHOLARSHIP DETAILS:
- Title: ${scholarship.title}
- Amount: ${scholarship.amount}
- Deadline: ${scholarship.deadline}
- Description: ${scholarship.description}

MATCHING RULES:
1. If scholarship targets a specific race/gender/religion the student doesn't match → score 0.1-0.3
2. If student misses a hard requirement (GPA, Major, State, Citizenship) → score < 0.3
3. If student meets all requirements → baseline 0.6, adjust based on fit
4. MOST IMPORTANT: Does the student's major "${getMajorText(user)}" ACTUALLY align with this scholarship's field? If not, score < 0.3.

Respond with JSON:
{"win_probability": 0.72, "reasons": ["Reason 1 (max 7 words)", "Reason 2", "Reason 3"]}
`

    const result = await callWithRetry(async () => {
      return await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      })
    })

    const text = result.response.text()
    const json = JSON.parse(text)
    return {
      score: json.win_probability || 0.5,
      reasons: Array.isArray(json.reasons) ? json.reasons.slice(0, 3) : ['AI-matched for your profile'],
    }
  } catch (error) {
    console.error("Gemini Combined Error:", error)
    return { score: 0.3, reasons: ['Could not generate AI match'] }
  }
}

// Keep individual functions as wrappers for backward compatibility
export async function calculateAiMatchScore(user: UserProfile, scholarship: Scholarship): Promise<number> {
  const result = await calculateAiMatchScoreAndReasons(user, scholarship)
  return result.score
}

export async function calculateAiMatchReasons(user: UserProfile, scholarship: Scholarship): Promise<string[]> {
  const result = await calculateAiMatchScoreAndReasons(user, scholarship)
  return result.reasons
}

/**
 * Perform a standard structured output call to Gemini
 */
export async function generateContent(prompt: string, isJson = false) {
  try {
    const result = await callWithRetry(async () => {
      return await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: isJson ? "application/json" : "text/plain",
        },
      })
    })
    return result.response.text()
  } catch (error) {
    console.error("Gemini API Error:", error)
    throw error
  }
}
