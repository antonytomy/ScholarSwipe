/**
 * TypeScript port of Useful_Scripts/hardfilter.py
 * 
 * This is a direct, faithful translation of the Python hard filter logic.
 * All filter checks (citizenship, grade_level, gpa, state, academic, background)
 * match the Python version exactly.
 */

type Row = Record<string, any>

// Mapped correctly to match our 'user_profiles' table schema
export const USER_COLS = {
  id: 'id',
  name: 'full_name',
  education: 'education_level',
  standing: 'academic_year',
  gpa: 'gpa',
  major: 'intended_major',
  majors: 'intended_majors',
  citizenship: 'citizenship',
  income: 'income_range',
  first_gen: 'first_generation',
  state: 'location_state',
  disability: 'disabilities',
  military: 'military',
}

export const SCH_COLS = {
  url: 'source_url',
  title: 'title',
  grade_level: 'grade_level_summary',
  amount: 'amount',
  citizenship: 'citizenship_status',
  academic: 'academic_interest',
  other_background: 'other_background_interest',
  state_residency: 'state_residency',
  minimum_gpa: 'minimum_gpa',
  uuid: 'UUID',
}

// =========================
// HELPERS
// =========================

function isNullish(value: unknown): boolean {
  if (value === null || value === undefined) return true
  const s = String(value).trim().toLowerCase()
  return ['', 'null', 'none', 'nan', 'n/a'].includes(s)
}

function cleanText(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim().toLowerCase())
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
  }
  if (isNullish(value)) return ''
  return String(value).trim().toLowerCase().replace(/\s+/g, ' ')
}

function toFloat(value: unknown): number | null {
  if (isNullish(value)) return null
  const s = String(value).replace(/[$,]/g, '').trim()
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

function normalizeBool(value: unknown): boolean | null {
  const s = cleanText(value)
  if (['true', '1', 'yes', 'y'].includes(s)) return true
  if (['false', '0', 'no', 'n'].includes(s)) return false
  return null
}

const STATE_MAP: Record<string, string> = {
  'alabama': 'AL', 'al': 'AL', 'alaska': 'AK', 'ak': 'AK',
  'arizona': 'AZ', 'az': 'AZ', 'arkansas': 'AR', 'ar': 'AR',
  'california': 'CA', 'ca': 'CA', 'colorado': 'CO', 'co': 'CO',
  'connecticut': 'CT', 'ct': 'CT', 'delaware': 'DE', 'de': 'DE',
  'florida': 'FL', 'fl': 'FL', 'georgia': 'GA', 'ga': 'GA',
  'hawaii': 'HI', 'hi': 'HI', 'idaho': 'ID', 'id': 'ID',
  'illinois': 'IL', 'il': 'IL', 'indiana': 'IN', 'in': 'IN',
  'iowa': 'IA', 'ia': 'IA', 'kansas': 'KS', 'ks': 'KS',
  'kentucky': 'KY', 'ky': 'KY', 'louisiana': 'LA', 'la': 'LA',
  'maine': 'ME', 'me': 'ME', 'maryland': 'MD', 'md': 'MD',
  'massachusetts': 'MA', 'ma': 'MA', 'michigan': 'MI', 'mi': 'MI',
  'minnesota': 'MN', 'mn': 'MN', 'mississippi': 'MS', 'ms': 'MS',
  'missouri': 'MO', 'mo': 'MO', 'montana': 'MT', 'mt': 'MT',
  'nebraska': 'NE', 'ne': 'NE', 'nevada': 'NV', 'nv': 'NV',
  'new hampshire': 'NH', 'nh': 'NH', 'new jersey': 'NJ', 'nj': 'NJ',
  'new mexico': 'NM', 'nm': 'NM', 'new york': 'NY', 'ny': 'NY',
  'north carolina': 'NC', 'nc': 'NC', 'north dakota': 'ND', 'nd': 'ND',
  'ohio': 'OH', 'oh': 'OH', 'oklahoma': 'OK', 'ok': 'OK',
  'oregon': 'OR', 'or': 'OR', 'pennsylvania': 'PA', 'pa': 'PA',
  'rhode island': 'RI', 'ri': 'RI', 'south carolina': 'SC', 'sc': 'SC',
  'south dakota': 'SD', 'sd': 'SD', 'tennessee': 'TN', 'tn': 'TN',
  'texas': 'TX', 'tx': 'TX', 'utah': 'UT', 'ut': 'UT',
  'vermont': 'VT', 'vt': 'VT', 'virginia': 'VA', 'va': 'VA',
  'washington': 'WA', 'wa': 'WA', 'west virginia': 'WV', 'wv': 'WV',
  'wisconsin': 'WI', 'wi': 'WI', 'wyoming': 'WY', 'wy': 'WY',
  'district of columbia': 'DC', 'dc': 'DC',
}

function normalizeState(value: unknown): string {
  const s = cleanText(value).replaceAll('.', '')
  return STATE_MAP[s] ?? (s.length === 2 ? s.toUpperCase() : s)
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function extractStates(text: unknown): Set<string> {
  const t = cleanText(text).replaceAll('.', '')
  if (!t) return new Set()
  if (t.includes('united states') || t.includes('u.s.') || t.includes('nationwide') || t.includes('national')) {
    return new Set()
  }

  const found = new Set<string>()
  for (const [raw, abbr] of Object.entries(STATE_MAP)) {
    const re = new RegExp(`\\b${escapeRegex(raw)}\\b`)
    if (re.test(t)) found.add(abbr)
  }
  return found
}

function normalizeUserCitizenship(value: unknown): string {
  const s = cleanText(value)
  if (s.includes('us_citizen') || s.includes('u.s. citizen') || s.includes('us citizen')) {
    return 'us_citizen'
  }
  if (s.includes('permanent') || s.includes('green card')) {
    return 'permanent_resident'
  }
  if (s.includes('internation') || s.includes('f1') || s.includes('visa') || s.includes('non-us')) {
    return 'international'
  }
  if (s.includes('other')) {
    return 'other'
  }
  return s
}

function scholarshipCitizenshipAllowsUser(userCitizenship: string, scholarshipRequirement: unknown): boolean {
  const req = cleanText(scholarshipRequirement)
  if (!req || !userCitizenship) return true

  const allowed = new Set<string>()
  if (req.includes('u.s. citizen') || req.includes('us citizen')) allowed.add('us_citizen')
  if (req.includes('permanent resident') || req.includes('green card')) allowed.add('permanent_resident')
  if (req.includes('international') || req.includes('f1') || req.includes('non-us')) allowed.add('international')
  if (req.includes('other')) allowed.add('other')

  if (allowed.size === 0) return true
  return allowed.has(userCitizenship)
}

function getUserEducationBucket(userRow: Row): [string, string] {
  const education = cleanText(userRow[USER_COLS.education])
  const standing = cleanText(userRow[USER_COLS.standing])

  if (education.includes('high')) return ['high_school', standing]
  if (education.includes('undergrad') || ['freshman', 'sophomore', 'junior', 'senior'].includes(standing)) {
    return ['undergrad', standing]
  }
  if (education.includes('graduate') || ['graduate', 'masters', 'phd'].includes(standing)) {
    return ['graduate', standing]
  }
  return ['', standing]
}

function gradeLevelMatch(userRow: Row, scholarshipGradeText: unknown): boolean {
  const g = cleanText(scholarshipGradeText)
  if (!g || g.includes('all grade') || g.includes('all students')) return true

  const [bucket, standing] = getUserEducationBucket(userRow)

  if (bucket === 'high_school') {
    if (!['high school', 'high sch'].some(k => g.includes(k))) return false
    const mentioned = ['freshman', 'sophomore', 'junior', 'senior'].filter(y => g.includes(y))
    return mentioned.length ? mentioned.includes(standing) : true
  }

  if (bucket === 'undergrad') {
    if (!['college', 'undergrad', 'undergraduate', 'university'].some(k => g.includes(k))) return false
    const mentioned = ['freshman', 'sophomore', 'junior', 'senior'].filter(y => g.includes(y))
    return mentioned.length ? mentioned.includes(standing) : true
  }

  if (bucket === 'graduate') {
    return ['graduate', 'grad', 'master', 'phd', 'doctoral'].some(k => g.includes(k))
  }

  return true
}

const MAJOR_GROUPS: Record<string, string[]> = {
  engineering: ['engineering', 'mechanical', 'electrical', 'civil', 'chemical', 'biomedical', 'industrial', 'aerospace'],
  computer: ['computer', 'software', 'cyber', 'informatics', 'information technology', 'data science'],
  business: ['business', 'finance', 'accounting', 'marketing', 'management', 'economics'],
  education: ['education', 'teacher', 'teaching'],
  psychology: ['psychology', 'psych'],
  biology: ['biology', 'biological', 'biochem', 'biochemistry'],
  medicine_health: ['medicine', 'medical', 'health', 'nursing', 'dentistry', 'public health'],
  architecture: ['architecture'],
  agriculture: ['agriculture', 'agricultural'],
  foreign_language: ['foreign language', 'spanish', 'french', 'german', 'arabic', 'linguistics'],
  literature: ['literature', 'english', 'writing'],
  visual_arts: ['visual', 'performing', 'art', 'music', 'dance', 'theatre', 'theater', 'film'],
  law: ['law', 'legal', 'pre-law', 'prelaw'],
}

function canonicalMajorGroups(text: unknown): Set<string> {
  const s = cleanText(text)
  const matched = new Set<string>()
  for (const [group, keywords] of Object.entries(MAJOR_GROUPS)) {
    if (keywords.some(k => s.includes(k))) matched.add(group)
  }
  return matched
}

function academicMatch(userMajor: unknown, scholarshipAcademic: unknown): boolean {
  const sch = cleanText(scholarshipAcademic)
  const usr = cleanText(userMajor)

  if (!sch || !usr) return true
  if (['all majors', 'any major', 'open to all', 'all fields'].some(x => sch.includes(x))) return true

  const schGroups = canonicalMajorGroups(sch)
  const usrGroups = canonicalMajorGroups(usr)

  if (schGroups.size === 0 || usrGroups.size === 0) return true

  return [...schGroups].some(g => usrGroups.has(g))
}

function getUserMajorText(userRow: Row): string {
  const majors = userRow[USER_COLS.majors]
  if (Array.isArray(majors) && majors.length > 0) {
    return majors.join(' ')
  }
  return String(userRow[USER_COLS.major] || '')
}

function gpaMatch(userGpaValue: unknown, scholarshipMinGpaValue: unknown): boolean {
  const userGpa = toFloat(userGpaValue)
  const minGpa = toFloat(scholarshipMinGpaValue)
  if (minGpa === null || userGpa === null) return true
  return userGpa >= minGpa
}

function stateMatch(userStateValue: unknown, scholarshipStateValue: unknown): boolean {
  const req = cleanText(scholarshipStateValue)
  if (!req) return true
  const userState = normalizeState(userStateValue)
  if (!userState) return true
  const requiredStates = extractStates(req)
  if (requiredStates.size === 0) return true
  return requiredStates.has(userState)
}

function backgroundMatch(userRow: Row, scholarshipBackground: unknown): boolean {
  const bg = cleanText(scholarshipBackground)
  if (!bg) return true

  const firstGen = normalizeBool(userRow[USER_COLS.first_gen])
  const military = normalizeBool(userRow[USER_COLS.military])
  const hasDisability = !isNullish(userRow[USER_COLS.disability])
  const income = cleanText(userRow[USER_COLS.income])

  if ((bg.includes('first gen') || bg.includes('first-generation')) && firstGen === false) return false
  if (['military', 'veteran', 'service member'].some(k => bg.includes(k)) && military === false) return false
  if (bg.includes('disab') && !hasDisability) return false
  if (bg.includes('low income') && ['100k_150k', 'over_150k'].includes(income)) return false

  return true
}

// =========================
// MAIN HARD FILTER — direct port of Python's is_eligible check
// =========================

/**
 * Returns true if the user passes all 6 hard filter checks for this scholarship.
 * This is a 1:1 port of the Python hardfilter.py logic.
 */
export function hardFilterEligible(user: Row, scholarship: Row): boolean {
  const userCit = normalizeUserCitizenship(user[USER_COLS.citizenship])

  const citPass = scholarshipCitizenshipAllowsUser(userCit, scholarship[SCH_COLS.citizenship])
  const gradePass = gradeLevelMatch(user, scholarship[SCH_COLS.grade_level])
  const gpaPass = gpaMatch(user[USER_COLS.gpa], scholarship[SCH_COLS.minimum_gpa])
  const stPass = stateMatch(user[USER_COLS.state], scholarship[SCH_COLS.state_residency])
  const acadPass = academicMatch(getUserMajorText(user), scholarship[SCH_COLS.academic])
  const bgPass = backgroundMatch(user, scholarship[SCH_COLS.other_background])

  return citPass && gradePass && gpaPass && stPass && acadPass && bgPass
}

/**
 * Returns pass/fail plus a relevance score and reasons.
 * Uses the same 6 checks from the Python hard filter.
 * Score is used to rank eligible scholarships before AI scoring.
 */
export function scholarshipPassesHardFilter(
  user: Row, scholarship: Row
): { pass: boolean, score: number, reasons: string[] } {
  const userCit = normalizeUserCitizenship(user[USER_COLS.citizenship])

  const citPass = scholarshipCitizenshipAllowsUser(userCit, scholarship[SCH_COLS.citizenship])
  const gradePass = gradeLevelMatch(user, scholarship[SCH_COLS.grade_level])
  const gpaPass = gpaMatch(user[USER_COLS.gpa], scholarship[SCH_COLS.minimum_gpa])
  const stPass = stateMatch(user[USER_COLS.state], scholarship[SCH_COLS.state_residency])
  const acadPass = academicMatch(getUserMajorText(user), scholarship[SCH_COLS.academic])
  const bgPass = backgroundMatch(user, scholarship[SCH_COLS.other_background])

  const pass = citPass && gradePass && gpaPass && stPass && acadPass && bgPass

  if (!pass) {
    return { pass: false, score: 0, reasons: [] }
  }

  // Eligible! Now compute a relevance score for ranking.
  let score = 0.50  // base for passing all checks
  const reasons: string[] = ['Meets eligibility requirements']

  // Major/field match quality
  const acadText = cleanText(scholarship[SCH_COLS.academic])
  const userMajor = cleanText(getUserMajorText(user))
  if (acadText && userMajor) {
    if (['all majors', 'any major', 'open to all', 'all fields'].some(x => acadText.includes(x))) {
      score += 0.05
      reasons.push('Open to all majors')
    } else {
      const schGroups = canonicalMajorGroups(acadText)
      const usrGroups = canonicalMajorGroups(userMajor)
      if (schGroups.size > 0 && [...schGroups].some(g => usrGroups.has(g))) {
        score += 0.20
        reasons.push('Major/field directly matches')
      }
    }
  }

  // Also check title + description for major keywords (bonus)
  const titleText = cleanText(scholarship[SCH_COLS.title] || scholarship.title || '')
  const descText = cleanText(scholarship.description || scholarship.overview || '')
  const fullText = `${titleText} ${descText}`
  const majorKeywords = userMajor.split(/\s+/).filter(w => w.length > 3)
  let kwHits = 0
  for (const kw of majorKeywords) {
    if (fullText.includes(kw)) kwHits++
  }
  if (kwHits > 0) {
    score += Math.min(kwHits * 0.05, 0.10)
    reasons.push(`${kwHits} keyword match${kwHits > 1 ? 'es' : ''} in title/description`)
  }

  // GPA margin
  const userGpa = toFloat(user[USER_COLS.gpa])
  const minGpa = toFloat(scholarship[SCH_COLS.minimum_gpa])
  if (userGpa !== null && minGpa !== null) {
    const margin = userGpa - minGpa
    if (margin >= 0.5) {
      score += 0.08
      reasons.push(`GPA ${userGpa} well above min ${minGpa}`)
    } else {
      score += 0.04
      reasons.push(`GPA meets minimum ${minGpa}`)
    }
  } else if (userGpa !== null && userGpa >= 3.5) {
    score += 0.03
    reasons.push('Strong GPA')
  }

  // State match bonus
  const schStates = extractStates(scholarship[SCH_COLS.state_residency])
  if (schStates.size > 0) {
    score += 0.05
    reasons.push('State residency matches')
  }

  // Background match bonus
  const bg = cleanText(scholarship[SCH_COLS.other_background])
  if (bg) {
    score += 0.05
    reasons.push('Background criteria matched')
  }

  return { pass: true, score: Math.min(score, 0.99), reasons }
}
