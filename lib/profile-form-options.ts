export const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "DC", label: "District of Columbia" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
] as const

export const MAJOR_OPTIONS = [
  "Computer Science",
  "Engineering",
  "Business",
  "Finance",
  "Accounting",
  "Biology",
  "Chemistry",
  "Physics",
  "Mathematics",
  "Nursing",
  "Pre-Med",
  "Education",
  "Psychology",
  "Political Science",
  "Communications",
  "English",
  "History",
  "Economics",
  "Art & Design",
  "Music & Performing Arts",
] as const

export const ETHNICITY_OPTIONS = [
  { value: "asian", label: "Asian" },
  { value: "black", label: "Black / African American" },
  { value: "hispanic", label: "Hispanic / Latino" },
  { value: "native_american", label: "Native American" },
  { value: "pacific_islander", label: "Pacific Islander" },
  { value: "white", label: "White" },
  { value: "mixed", label: "Mixed Race" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const

export const GPA_RANGE_OPTIONS = [
  { value: "4.0_plus", label: "4.00+", lowerBound: 4.0, upperBound: 5.0, tierLabel: "Outstanding" },
  { value: "3.75_3.99", label: "3.75-3.99", lowerBound: 3.75, upperBound: 3.99, tierLabel: "Top academic standing" },
  { value: "3.5_3.74", label: "3.50-3.74", lowerBound: 3.5, upperBound: 3.74, tierLabel: "Strong academic standing" },
  { value: "3.0_3.49", label: "3.00-3.49", lowerBound: 3.0, upperBound: 3.49, tierLabel: "Solid academic standing" },
  { value: "2.5_2.99", label: "2.50-2.99", lowerBound: 2.5, upperBound: 2.99, tierLabel: "Developing academic standing" },
  { value: "below_2.5", label: "Below 2.50", lowerBound: 0, upperBound: 2.49, tierLabel: "Needs academic support" },
] as const

export type GpaMode = "exact" | "range"
export const GPA_MIN = 0
export const GPA_MAX = 4
export const GPA_LEGACY_MAX = 5

export function getGpaRangeLowerBound(range: string | null | undefined) {
  if (!range) return null
  const match = GPA_RANGE_OPTIONS.find((option) => option.value === range)
  return match ? match.lowerBound : null
}

export function getGpaRangeOption(range: string | null | undefined) {
  if (!range) return null
  return GPA_RANGE_OPTIONS.find((option) => option.value === range) ?? null
}

export function deriveGpaRangeFromExactGpa(gpa: number | null | undefined) {
  if (typeof gpa !== "number" || !Number.isFinite(gpa)) return null
  return (
    GPA_RANGE_OPTIONS.find((option) => gpa >= option.lowerBound && gpa <= option.upperBound)?.value ?? null
  )
}

export function isValidGpaValue(gpa: number | null | undefined) {
  return typeof gpa === "number" && Number.isFinite(gpa) && gpa >= GPA_MIN && gpa <= GPA_LEGACY_MAX
}

export function isValidExactGpaInput(gpa: number | null | undefined) {
  return typeof gpa === "number" && Number.isFinite(gpa) && gpa >= GPA_MIN && gpa <= GPA_MAX
}

export function getExactGpaValidationMessage(value: string | number | null | undefined) {
  if (value == null || value === "") return ""
  const parsed = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(parsed)) return "Enter a numeric GPA."
  if (parsed < GPA_MIN || parsed > GPA_MAX) return "Enter a GPA between 0.00 and 4.00."
  return ""
}

export function formatGpaTierLabel(gpa: number | null | undefined, gpaRange: string | null | undefined) {
  const option = getGpaRangeOption(gpaRange) ?? getGpaRangeOption(deriveGpaRangeFromExactGpa(gpa))
  return option?.tierLabel ?? ""
}

export function formatGpaSummary(gpa: number | null | undefined, gpaRange: string | null | undefined) {
  const rangeOption = getGpaRangeOption(gpaRange) ?? getGpaRangeOption(deriveGpaRangeFromExactGpa(gpa))
  if (gpaRange) {
    if (typeof gpa === "number" && Number.isFinite(gpa) && rangeOption) {
      return `${gpa.toFixed(2)} GPA (${rangeOption.label}, ${rangeOption.tierLabel})`
    }
    if (rangeOption) return `${rangeOption.label} (${rangeOption.tierLabel})`
  }
  if (typeof gpa === "number" && Number.isFinite(gpa)) {
    return rangeOption ? `${gpa.toFixed(2)} GPA (${rangeOption.tierLabel})` : `${gpa.toFixed(2)} GPA`
  }
  return "Not specified"
}

export function normalizeMajorsInput(value: unknown): string[] {
  const normalizedValues = new Set<string>()

  const addValue = (item: unknown) => {
    const trimmed = String(item).trim()
    if (trimmed) normalizedValues.add(trimmed)
  }

  if (Array.isArray(value)) {
    value.forEach(addValue)
    return [...normalizedValues]
  }

  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return []

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          parsed.forEach(addValue)
          return [...normalizedValues]
        }
      } catch {
        // Fall through to delimiter parsing for legacy malformed strings.
      }
    }

    trimmed
      .split(/[,;/|]+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => normalizedValues.add(item))
    return [...normalizedValues]
  }

  return []
}

export function majorsToLegacyString(majors: string[]) {
  return majors.join(", ")
}

export function formatMajorsSummary(majors: unknown, fallback?: string | null) {
  const normalized = normalizeMajorsInput(majors)
  if (normalized.length > 0) return normalized.join(", ")
  return fallback || "Not specified"
}

export function normalizeStateValue(value: string | null | undefined) {
  const trimmed = value?.trim()
  if (!trimmed) return ""

  const match = US_STATES.find(
    (state) => state.value.toLowerCase() === trimmed.toLowerCase() || state.label.toLowerCase() === trimmed.toLowerCase()
  )

  return match?.value ?? trimmed.toUpperCase()
}

export function getStateLabel(value: string | null | undefined) {
  if (!value) return "Not specified"
  const match = US_STATES.find((state) => state.value === normalizeStateValue(value))
  return match?.label || value
}
