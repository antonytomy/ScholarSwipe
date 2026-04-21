import type { SupabaseClient } from '@supabase/supabase-js'
import type { NormalizedProfilePayload } from '@/lib/profile-payload'

export const USER_PROFILE_TABLE = 'user_profiles'

export const USER_PROFILE_COLUMN_CANDIDATES = [
  'id',
  'full_name',
  'email',
  'phone',
  'date_of_birth',
  'gender',
  'education_level',
  'graduation_year',
  'school',
  'gpa',
  'gpa_range',
  'sat_score',
  'act_score',
  'intended_major',
  'intended_majors',
  'academic_year',
  'extracurriculars',
  'ethnicity',
  'ethnicity_other',
  'citizenship',
  'income_range',
  'first_generation',
  'location_state',
  'disabilities',
  'military',
] as const

export type UserProfileColumn = (typeof USER_PROFILE_COLUMN_CANDIDATES)[number]

const REQUIRED_SIGNUP_PROFILE_COLUMNS: UserProfileColumn[] = [
  'id',
  'full_name',
  'email',
  'phone',
  'date_of_birth',
  'gender',
  'education_level',
  'graduation_year',
  'school',
  'gpa',
  'gpa_range',
  'intended_major',
  'intended_majors',
  'extracurriculars',
  'ethnicity',
  'ethnicity_other',
  'citizenship',
  'income_range',
  'first_generation',
  'location_state',
  'disabilities',
  'military',
] as const

type DatabaseErrorLike = {
  code?: string
  message?: string
  details?: string
  hint?: string
}

let supportedColumnsCache: Promise<Set<UserProfileColumn>> | null = null

function errorText(error: DatabaseErrorLike | null | undefined) {
  return [error?.code, error?.message, error?.details, error?.hint].filter(Boolean).join(' | ').toLowerCase()
}

function isMissingColumnError(error: DatabaseErrorLike | null | undefined) {
  const text = errorText(error)
  return (
    error?.code === 'PGRST204' ||
    text.includes('schema cache') ||
    text.includes('could not find') ||
    text.includes('column') && text.includes('not found')
  )
}

function optionalText(value: string | null | undefined) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function buildBaseProfilePayload(userId: string, normalized: NormalizedProfilePayload) {
  return {
    id: userId,
    full_name: normalized.full_name ?? null,
    email: normalized.email ?? null,
    phone: normalized.phone ?? null,
    date_of_birth: normalized.date_of_birth ?? null,
    gender: normalized.gender ?? null,
    education_level: normalized.education_level ?? null,
    graduation_year: normalized.graduation_year ?? null,
    school: normalized.school ?? null,
    gpa: normalized.gpa,
    gpa_range: optionalText(normalized.gpa_range),
    sat_score: normalized.sat_score,
    act_score: normalized.act_score,
    intended_major: optionalText(normalized.intended_major),
    intended_majors: normalized.intended_majors,
    academic_year: optionalText(normalized.academic_year),
    extracurriculars: optionalText(normalized.extracurriculars),
    ethnicity: normalized.ethnicity ?? null,
    ethnicity_other: optionalText(normalized.ethnicity_other),
    citizenship: normalized.citizenship ?? null,
    income_range: normalized.income_range ?? null,
    first_generation: normalized.first_generation,
    location_state: optionalText(normalized.location_state),
    disabilities: optionalText(normalized.disabilities),
    military: normalized.military,
  } satisfies Record<UserProfileColumn, unknown>
}

async function checkColumnExists(db: SupabaseClient, column: UserProfileColumn) {
  const { error } = await db.from(USER_PROFILE_TABLE).select(column).limit(1)
  if (!error) return true
  if (isMissingColumnError(error)) return false
  throw error
}

export async function resolveSupportedUserProfileColumns(db: SupabaseClient) {
  if (!supportedColumnsCache) {
    supportedColumnsCache = (async () => {
      const checks = await Promise.all(
        USER_PROFILE_COLUMN_CANDIDATES.map(async (column) => ({
          column,
          exists: await checkColumnExists(db, column),
        }))
      )

      return new Set(
        checks
          .filter((entry) => entry.exists)
          .map((entry) => entry.column)
      )
    })()
  }

  return supportedColumnsCache
}

export function getMissingRequiredSignupColumns(supportedColumns: Set<UserProfileColumn>) {
  return REQUIRED_SIGNUP_PROFILE_COLUMNS.filter((column) => !supportedColumns.has(column))
}

export function buildUserProfileWritePayload(
  userId: string,
  normalized: NormalizedProfilePayload,
  supportedColumns: Set<UserProfileColumn>
) {
  const basePayload = buildBaseProfilePayload(userId, normalized)
  const payload: Partial<Record<UserProfileColumn, unknown>> = {}
  const unsupportedColumns: UserProfileColumn[] = []

  for (const column of USER_PROFILE_COLUMN_CANDIDATES) {
    const value = basePayload[column]
    if (value === undefined) continue

    if (supportedColumns.has(column)) {
      payload[column] = value
    } else {
      unsupportedColumns.push(column)
    }
  }

  return { payload, unsupportedColumns }
}

export function filterPayloadToTouchedKeys(
  payload: Partial<Record<UserProfileColumn, unknown>>,
  touchedKeys: Iterable<string>
) {
  const touched = new Set(touchedKeys)
  const filtered: Partial<Record<UserProfileColumn, unknown>> = {}

  for (const [key, value] of Object.entries(payload)) {
    if (touched.has(key)) {
      filtered[key as UserProfileColumn] = value
    }
  }

  return filtered
}

export function validateUserProfileWritePayload(
  payload: Partial<Record<UserProfileColumn, unknown>>,
  options: { requireId?: boolean } = {}
) {
  const errors: string[] = []
  const requireId = options.requireId ?? false

  const assertString = (key: UserProfileColumn) => {
    const value = payload[key]
    if (value !== null && value !== undefined && typeof value !== 'string') {
      errors.push(`${key} must be a string or null`)
    }
  }

  const assertNumber = (key: UserProfileColumn) => {
    const value = payload[key]
    if (value !== null && value !== undefined && (typeof value !== 'number' || !Number.isFinite(value))) {
      errors.push(`${key} must be a finite number or null`)
    }
  }

  const assertBoolean = (key: UserProfileColumn) => {
    const value = payload[key]
    if (value !== undefined && typeof value !== 'boolean') {
      errors.push(`${key} must be a boolean`)
    }
  }

  if (requireId) {
    const id = payload.id
    if (typeof id !== 'string' || id.trim() === '') {
      errors.push('id must be a non-empty string')
    }
  }

  ;([
    'id',
    'full_name',
    'email',
    'phone',
    'date_of_birth',
    'gender',
    'education_level',
    'graduation_year',
    'school',
    'gpa_range',
    'intended_major',
    'academic_year',
    'extracurriculars',
    'ethnicity',
    'ethnicity_other',
    'citizenship',
    'income_range',
    'location_state',
    'disabilities',
  ] as UserProfileColumn[]).forEach(assertString)

  ;(['gpa', 'sat_score', 'act_score'] as UserProfileColumn[]).forEach(assertNumber)
  ;(['first_generation', 'military'] as UserProfileColumn[]).forEach(assertBoolean)

  if ('intended_majors' in payload) {
    const value = payload.intended_majors
    if (
      value !== null &&
      value !== undefined &&
      (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || item.trim() === ''))
    ) {
      errors.push('intended_majors must be an array of non-empty strings')
    }
  }

  return errors
}
