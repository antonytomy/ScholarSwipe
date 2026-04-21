import {
  deriveGpaRangeFromExactGpa,
  formatMajorsSummary,
  getExactGpaValidationMessage,
  getGpaRangeLowerBound,
  isValidExactGpaInput,
  isValidGpaValue,
  normalizeStateValue,
  normalizeMajorsInput,
} from "@/lib/profile-form-options"

type ProfilePayloadInput = {
  [key: string]: unknown
  full_name?: string
  email?: string
  phone?: string
  date_of_birth?: string
  dob?: string
  gender?: string
  education_level?: string
  graduation_year?: string
  school?: string
  gpa?: string | number | null
  gpa_exact?: string | number | null
  gpa_range?: string | null
  gpa_mode?: "exact" | "range" | null
  sat_score?: string | number | null
  act_score?: string | number | null
  intended_major?: string
  intended_majors?: string[] | string
  academic_year?: string
  extracurriculars?: string
  ethnicity?: string
  ethnicity_other?: string
  citizenship?: string
  income_range?: string
  first_generation?: boolean
  location_state?: string
  disabilities?: string
  military?: boolean
}

export interface NormalizedProfilePayload {
  full_name?: string
  email?: string
  phone?: string
  date_of_birth?: string
  gender?: string
  education_level?: string
  graduation_year?: string
  school?: string
  gpa: number | null
  gpa_range: string | null
  sat_score: number | null
  act_score: number | null
  intended_major: string
  intended_majors: string[]
  academic_year?: string
  extracurriculars: string
  ethnicity?: string
  ethnicity_other: string
  citizenship?: string
  income_range?: string
  first_generation: boolean
  location_state?: string
  disabilities: string
  military: boolean
}

function toOptionalString(value: unknown) {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function toStringOrEmpty(value: unknown) {
  if (typeof value !== "string") return ""
  return value.trim()
}

function toNullableNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function normalizeProfilePayload(input: ProfilePayloadInput): NormalizedProfilePayload {
  const intendedMajors = normalizeMajorsInput(input.intended_majors ?? input.intended_major)
  const requestedGpaRange = toOptionalString(input.gpa_range) ?? null
  const requestedGpaMode = input.gpa_mode ?? null
  const rawGpaExact = toNullableNumber(input.gpa_exact ?? input.gpa)
  const gpaExact = requestedGpaMode === "range" ? null : rawGpaExact
  const gpaRange = requestedGpaRange ?? deriveGpaRangeFromExactGpa(gpaExact)
  const derivedGpa = gpaExact ?? getGpaRangeLowerBound(gpaRange)

  return {
    full_name: toOptionalString(input.full_name),
    email: toOptionalString(input.email),
    phone: toOptionalString(input.phone),
    date_of_birth: toOptionalString(input.date_of_birth ?? input.dob),
    gender: toOptionalString(input.gender),
    education_level: toOptionalString(input.education_level),
    graduation_year: toOptionalString(input.graduation_year),
    school: toOptionalString(input.school),
    gpa: derivedGpa,
    gpa_range: gpaRange,
    sat_score: toNullableNumber(input.sat_score),
    act_score: toNullableNumber(input.act_score),
    intended_major: formatMajorsSummary(intendedMajors, toOptionalString(input.intended_major) ?? ""),
    intended_majors: intendedMajors,
    academic_year: toOptionalString(input.academic_year),
    extracurriculars: toStringOrEmpty(input.extracurriculars),
    ethnicity: toOptionalString(input.ethnicity),
    ethnicity_other: toOptionalString(input.ethnicity) === "other" ? toStringOrEmpty(input.ethnicity_other) : "",
    citizenship: toOptionalString(input.citizenship),
    income_range: toOptionalString(input.income_range),
    first_generation: Boolean(input.first_generation),
    location_state: normalizeStateValue(toOptionalString(input.location_state)),
    disabilities: toStringOrEmpty(input.disabilities),
    military: Boolean(input.military),
  }
}

export function validateProfilePayload(
  input: ProfilePayloadInput,
  options: { requireCoreFields?: boolean } = {}
) {
  const normalized = normalizeProfilePayload(input)
  const errors: string[] = []
  const requireCoreFields = options.requireCoreFields ?? false

  if (requireCoreFields) {
    const requiredStringFields: Array<[keyof NormalizedProfilePayload, string]> = [
      ["full_name", "full_name"],
      ["email", "email"],
      ["phone", "phone"],
      ["date_of_birth", "dob"],
      ["gender", "gender"],
      ["education_level", "education_level"],
      ["graduation_year", "graduation_year"],
      ["school", "school"],
      ["ethnicity", "ethnicity"],
      ["citizenship", "citizenship"],
      ["income_range", "income_range"],
      ["location_state", "location_state"],
    ]

    for (const [key, label] of requiredStringFields) {
      if (!normalized[key]) errors.push(label)
    }
  }

  if (normalized.intended_majors.length === 0) {
    errors.push("intended_majors")
  }

  if (!isValidGpaValue(normalized.gpa)) {
    errors.push("gpa")
  }

  const gpaMode = input.gpa_mode ?? null
  const requestedExactGpa = toNullableNumber(input.gpa_exact ?? input.gpa)
  if (gpaMode === "exact" && !isValidExactGpaInput(requestedExactGpa)) {
    errors.push(getExactGpaValidationMessage(input.gpa_exact ?? input.gpa) || "gpa")
  }

  if (gpaMode === "range" && !normalized.gpa_range) {
    errors.push("gpa_range")
  }

  if (normalized.ethnicity === "other" && !normalized.ethnicity_other) {
    errors.push("ethnicity_other")
  }

  return { normalized, errors }
}
