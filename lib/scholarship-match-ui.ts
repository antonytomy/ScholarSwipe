import {
  formatGpaSummary,
  formatMajorsSummary,
  formatGpaTierLabel,
  getStateLabel,
} from "@/lib/profile-form-options"

type GenericRow = Record<string, any>

interface EligibilityCheck {
  label: string
  pass: boolean
}

function cleanText(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim().toLowerCase()).filter(Boolean).join(" ")
  }
  return String(value ?? "").trim().toLowerCase()
}

function parseAmount(value: unknown) {
  const match = String(value ?? "").replace(/[^0-9.]/g, "")
  const parsed = Number(match)
  return Number.isFinite(parsed) ? parsed : null
}

function textIncludesOneOf(text: string, patterns: string[]) {
  return patterns.some((pattern) => text.includes(pattern))
}

function matchesYear(user: GenericRow, scholarship: GenericRow) {
  const yearText = cleanText(scholarship.grade_level_summary)
  if (!yearText) return true

  const userYear = cleanText(user.academic_year)
  const educationLevel = cleanText(user.education_level)

  if (textIncludesOneOf(yearText, ["all students", "all grade", "open to all"])) return true
  if (yearText.includes("graduate")) return userYear.includes("graduate") || educationLevel.includes("graduate")
  if (textIncludesOneOf(yearText, ["college", "undergrad", "undergraduate", "university"])) {
    return textIncludesOneOf(userYear, ["freshman", "sophomore", "junior", "senior"]) || educationLevel.includes("undergraduate")
  }
  if (yearText.includes("high school")) {
    return userYear.includes("high_school") || educationLevel.includes("high_school")
  }

  return true
}

function matchesState(user: GenericRow, scholarship: GenericRow) {
  const scholarshipState = cleanText(scholarship.state_residency)
  if (!scholarshipState) return true

  const userState = cleanText(user.location_state)
  if (!userState) return true

  return scholarshipState.includes(userState) || scholarshipState.includes(getStateLabel(user.location_state).toLowerCase())
}

function matchesCitizenship(user: GenericRow, scholarship: GenericRow) {
  const scholarshipCitizenship = cleanText(scholarship.citizenship_status)
  if (!scholarshipCitizenship) return true
  const userCitizenship = cleanText(user.citizenship)
  if (!userCitizenship) return true
  return scholarshipCitizenship.includes(userCitizenship.replaceAll("_", " ")) || scholarshipCitizenship.includes("us citizen")
}

function matchesMajor(user: GenericRow, scholarship: GenericRow) {
  const scholarshipAcademic = cleanText(scholarship.academic_interest)
  const majorSummary = cleanText(formatMajorsSummary(user.intended_majors, user.intended_major))
  if (!scholarshipAcademic || !majorSummary) return true
  if (textIncludesOneOf(scholarshipAcademic, ["all majors", "all fields", "any major", "open to all"])) return true

  const userMajors = majorSummary.split(",").map((item) => item.trim()).filter(Boolean)
  return userMajors.some((major) => scholarshipAcademic.includes(major.toLowerCase()))
}

function extracurricularSignals(extracurriculars: string) {
  const text = cleanText(extracurriculars)
  return {
    leadership: textIncludesOneOf(text, ["president", "captain", "leader", "founder", "chair", "lead"]),
    volunteer: textIncludesOneOf(text, ["volunteer", "community service", "service", "mentor", "tutor"]),
    research: textIncludesOneOf(text, ["research", "lab", "project", "robotics", "science fair"]),
    work: textIncludesOneOf(text, ["intern", "job", "work", "employment", "assistant"]),
    athletics: textIncludesOneOf(text, ["athletic", "soccer", "basketball", "track", "swim", "tennis"]),
  }
}

export function buildEligibilityChecks(user: GenericRow, scholarship: GenericRow): EligibilityCheck[] {
  const minimumGpa = parseAmount(scholarship.minimum_gpa)
  const userGpa = typeof user.gpa === "number" ? user.gpa : null

  return [
    {
      label: minimumGpa ? `GPA minimum: ${minimumGpa}` : "GPA minimum: Not specified",
      pass: minimumGpa && userGpa ? userGpa >= Number(minimumGpa) : true,
    },
    {
      label: scholarship.academic_interest ? `Major focus: ${scholarship.academic_interest}` : "Major focus: Open or not specified",
      pass: matchesMajor(user, scholarship),
    },
    {
      label: scholarship.grade_level_summary ? `Class year: ${scholarship.grade_level_summary}` : "Class year: Open or not specified",
      pass: matchesYear(user, scholarship),
    },
    {
      label: scholarship.state_residency ? `Location: ${scholarship.state_residency}` : "Location: No state restriction listed",
      pass: matchesState(user, scholarship),
    },
  ]
}

export function buildMatchReasons(user: GenericRow, scholarship: GenericRow, fallbackReasons: string[] = []) {
  const reasons: string[] = []
  const majorSummary = formatMajorsSummary(user.intended_majors, user.intended_major)
  const gpaSummary = formatGpaSummary(user.gpa, user.gpa_range)
  const gpaTier = formatGpaTierLabel(user.gpa, user.gpa_range)
  const minimumGpa = parseAmount(scholarship.minimum_gpa)
  const extracurricularText = cleanText(user.extracurriculars)
  const scholarshipText = cleanText([
    scholarship.title,
    scholarship.description,
    scholarship.overview,
    scholarship.eligibility_text,
    scholarship.other_background_interest,
    scholarship.academic_interest,
  ])
  const signals = extracurricularSignals(user.extracurriculars || "")

  if (matchesMajor(user, scholarship) && scholarship.academic_interest) {
    reasons.push(`Your ${majorSummary} interest lines up with this scholarship's ${scholarship.academic_interest} focus.`)
  }

  if (typeof user.gpa === "number" && minimumGpa !== null) {
    if (user.gpa >= minimumGpa) {
      reasons.push(`Your ${gpaSummary} clears the ${minimumGpa.toFixed(2)} GPA minimum.`)
    }
  } else if (typeof user.gpa === "number" && gpaTier) {
    reasons.push(`Your ${gpaSummary} gives you a ${gpaTier.toLowerCase()} academic profile for merit-based awards.`)
  }

  if (matchesState(user, scholarship) && scholarship.state_residency) {
    reasons.push(`${getStateLabel(user.location_state)} residency matches this scholarship's location requirement.`)
  }

  if (matchesYear(user, scholarship) && scholarship.grade_level_summary) {
    reasons.push(`Your class year fits the ${scholarship.grade_level_summary} audience listed for this award.`)
  }

  if (signals.leadership && textIncludesOneOf(scholarshipText, ["leadership", "leader", "initiative"])) {
    reasons.push("Your leadership background aligns with the leadership emphasis in this scholarship.")
  }

  if (signals.volunteer && textIncludesOneOf(scholarshipText, ["volunteer", "community", "service", "civic"])) {
    reasons.push("Your volunteer and service work matches the community-impact angle of this scholarship.")
  }

  if (signals.research && textIncludesOneOf(scholarshipText, ["research", "innovation", "project", "stem"])) {
    reasons.push("Your projects and research-style experience support the technical fit for this scholarship.")
  }

  if (signals.work && textIncludesOneOf(scholarshipText, ["work", "employment", "career", "professional"])) {
    reasons.push("Your work experience adds practical relevance to this scholarship's career-oriented focus.")
  }

  if (user.first_generation && textIncludesOneOf(scholarshipText, ["first-generation", "first gen"])) {
    reasons.push("This scholarship specifically supports first-generation students, which matches your profile.")
  }

  if (user.military && textIncludesOneOf(scholarshipText, ["military", "veteran", "service member"])) {
    reasons.push("Your military background aligns with the service-related eligibility notes for this award.")
  }

  if (user.disabilities && textIncludesOneOf(scholarshipText, ["disability", "accessibility", "accommodation"])) {
    reasons.push("Your accessibility context appears relevant to the scholarship's stated eligibility criteria.")
  }

  if (matchesCitizenship(user, scholarship) && scholarship.citizenship_status) {
    reasons.push(`Your ${String(user.citizenship).replaceAll("_", " ")} status fits the listed citizenship requirement.`)
  }

  for (const fallback of fallbackReasons) {
    if (!reasons.includes(fallback)) reasons.push(fallback)
  }

  return reasons.filter(Boolean).slice(0, 4)
}
