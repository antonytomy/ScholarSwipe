import { normalizeMajorsInput, normalizeStateValue } from "@/lib/profile-form-options"
import { inflateRawSync } from "node:zlib"

export type ParsedDocumentKind = "common-app" | "resume"

export interface ParsedDocumentReview {
  education?: string
  extracurriculars?: string
  leadership?: string
  honors_awards?: string
  work_experience?: string
  volunteer_experience?: string
  skills?: string
}

export interface ParsedProfileDocumentData {
  full_name?: string
  email?: string
  phone?: string
  dob?: string
  gender?: string
  education_level?: string
  school?: string
  gpa?: string
  graduation_year?: string
  sat_score?: string
  act_score?: string
  intended_major?: string
  academic_year?: string
  ethnicity?: string
  citizenship?: string
  first_generation?: boolean
  location_state?: string
  disabilities?: string
  military?: boolean
  income_range?: string
  extracurriculars?: string
  intended_majors?: string[]
}

const SECTION_HEADINGS = [
  "education",
  "experience",
  "work experience",
  "leadership",
  "activities",
  "extracurriculars",
  "volunteer",
  "community service",
  "honors",
  "awards",
  "skills",
  "projects",
  "certifications",
]

function extractField(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  return ""
}

function findSection(text: string, headings: string[]) {
  const lower = text.toLowerCase()

  for (const heading of headings) {
    const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const startRegex = new RegExp(`(?:^|\\n)\\s*${escapedHeading}\\s*(?:\\n|:|\\r\\n)`, "i")
    const startMatch = startRegex.exec(text)
    if (!startMatch || startMatch.index === undefined) continue

    const contentStart = startMatch.index + startMatch[0].length
    let endIndex = text.length

    for (const nextHeading of SECTION_HEADINGS) {
      if (headings.includes(nextHeading)) continue
      const escapedNext = nextHeading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      const nextRegex = new RegExp(`(?:^|\\n)\\s*${escapedNext}\\s*(?:\\n|:|\\r\\n)`, "i")
      const sliced = text.slice(contentStart)
      const nextMatch = nextRegex.exec(sliced)
      if (nextMatch && nextMatch.index !== undefined) {
        endIndex = Math.min(endIndex, contentStart + nextMatch.index)
      }
    }

    const section = text.slice(contentStart, endIndex).trim()
    if (section) return section
  }

  if (headings.some((heading) => lower.includes(heading))) {
    return ""
  }

  return ""
}

function normalizeWhitespace(text: string) {
  return text.replace(/\r/g, "").replace(/\t/g, " ").replace(/[ ]{2,}/g, " ").trim()
}

function decodeXmlText(xml: string) {
  return xml
    .replace(/<w:tab\/>/g, " ")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

async function extractTextFromDocx(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer())
  let offset = 0

  while (offset < buffer.length - 30) {
    const signature = buffer.readUInt32LE(offset)
    if (signature !== 0x04034b50) {
      offset += 1
      continue
    }

    const compressionMethod = buffer.readUInt16LE(offset + 8)
    const compressedSize = buffer.readUInt32LE(offset + 18)
    const fileNameLength = buffer.readUInt16LE(offset + 26)
    const extraFieldLength = buffer.readUInt16LE(offset + 28)
    const fileNameStart = offset + 30
    const fileName = buffer.toString("utf8", fileNameStart, fileNameStart + fileNameLength)
    const dataStart = fileNameStart + fileNameLength + extraFieldLength
    const dataEnd = dataStart + compressedSize

    if (fileName === "word/document.xml") {
      const compressed = buffer.subarray(dataStart, dataEnd)
      const xmlBuffer =
        compressionMethod === 0
          ? compressed
          : compressionMethod === 8
            ? inflateRawSync(compressed)
            : null

      if (!xmlBuffer) {
        throw new Error("Unsupported DOCX compression method.")
      }

      return decodeXmlText(xmlBuffer.toString("utf8"))
    }

    offset = dataEnd
  }

  throw new Error("Could not locate document text in the DOCX file.")
}

function splitResumeLines(text: string) {
  return normalizeWhitespace(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

function inferAcademicYear(text: string) {
  const lower = text.toLowerCase()
  if (lower.includes("graduate")) return "graduate_student"
  if (lower.includes("senior")) return "senior"
  if (lower.includes("junior")) return "junior"
  if (lower.includes("sophomore")) return "sophomore"
  if (lower.includes("freshman")) return "freshman"
  if (lower.includes("high school")) return "high_school"
  return ""
}

function inferEducationLevel(text: string) {
  const lower = text.toLowerCase()
  if (lower.includes("graduate") || lower.includes("master") || lower.includes("phd") || lower.includes("doctoral")) {
    return "graduate"
  }
  if (lower.includes("community college") || lower.includes("associate")) {
    return "community_college"
  }
  if (lower.includes("high school") || lower.includes("secondary school")) {
    return "high_school"
  }
  if (lower.includes("college") || lower.includes("university") || lower.includes("bachelor")) {
    return "undergraduate"
  }
  return ""
}

function formatSectionForTextarea(label: string, value: string) {
  if (!value.trim()) return ""
  const cleaned = value
    .split("\n")
    .map((line) => line.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean)
    .join("; ")

  return cleaned ? `${label}: ${cleaned}` : ""
}

function parseResumeText(text: string): { data: ParsedProfileDocumentData; review: ParsedDocumentReview } {
  const lines = splitResumeLines(text)
  const email = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)?.[0] ?? ""
  const phone =
    text.match(/(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/)?.[1] ??
    text.match(/(\+\d{1,2}\s*\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/)?.[1] ??
    ""

  const headerLines = lines.slice(0, 6)
  const fullName =
    headerLines.find((line) => /^[A-Z][A-Za-z' -]+$/.test(line) && !line.includes("@") && !/\d{3}/.test(line)) ?? ""

  const gpa = extractField(text, [
    /(?:gpa|grade point average|cumulative gpa)\s*[:\-]?\s*(\d(?:\.\d{1,2})?)/i,
  ])

  const graduationYear = extractField(text, [
    /(?:expected\s+graduation|graduation|class of)\s*[:\-]?\s*(20\d{2})/i,
    /\b(20\d{2})\b/,
  ])

  const intendedMajor = extractField(text, [
    /(?:major|field of study|program of study)\s*[:\-]?\s*([A-Za-z,&/ \-]{3,})/i,
  ])

  const educationSection = findSection(text, ["education"])
  const leadershipSection = findSection(text, ["leadership"])
  const activitiesSection = findSection(text, ["activities", "extracurriculars", "projects"])
  const honorsSection = findSection(text, ["honors", "awards"])
  const workSection = findSection(text, ["experience", "work experience"])
  const volunteerSection = findSection(text, ["volunteer", "community service"])
  const skillsSection = findSection(text, ["skills", "certifications"])

  const school =
    extractField(educationSection, [/([A-Z][A-Za-z0-9&'.,\- ]+(?:University|College|School|Academy|Institute))/]) ||
    extractField(text, [/([A-Z][A-Za-z0-9&'.,\- ]+(?:University|College|School|Academy|Institute))/]) ||
    ""

  const majorCandidates = normalizeMajorsInput(intendedMajor || educationSection)
  const extracurricularSummary = [
    formatSectionForTextarea("Activities", activitiesSection),
    formatSectionForTextarea("Leadership", leadershipSection),
    formatSectionForTextarea("Work", workSection),
    formatSectionForTextarea("Volunteer", volunteerSection),
    formatSectionForTextarea("Honors", honorsSection),
    formatSectionForTextarea("Skills", skillsSection),
  ]
    .filter(Boolean)
    .join("\n")

  const stateMatch =
    text.match(/\b([A-Z]{2})\s+\d{5}(?:-\d{4})?\b/)?.[1] ??
    extractField(text, [/(?:address|location)\s*[:\-]?\s*.*?,\s*([A-Z]{2})\s+\d{5}/i])

  const data: ParsedProfileDocumentData = {
    full_name: fullName || undefined,
    email: email || undefined,
    phone: phone || undefined,
    education_level: inferEducationLevel(educationSection || text) || undefined,
    school: school || undefined,
    gpa: gpa || undefined,
    graduation_year: graduationYear || undefined,
    intended_major: majorCandidates[0] || undefined,
    intended_majors: majorCandidates.length > 0 ? majorCandidates : undefined,
    academic_year: inferAcademicYear(educationSection || text) || undefined,
    location_state: stateMatch ? normalizeStateValue(stateMatch) : undefined,
    extracurriculars: extracurricularSummary || undefined,
  }

  return {
    data,
    review: {
      education: educationSection || undefined,
      extracurriculars: activitiesSection || undefined,
      leadership: leadershipSection || undefined,
      honors_awards: honorsSection || undefined,
      work_experience: workSection || undefined,
      volunteer_experience: volunteerSection || undefined,
      skills: skillsSection || undefined,
    },
  }
}

function mapGenderValue(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes("male") && !lower.includes("female")) return "male"
  if (lower.includes("female")) return "female"
  if (lower.includes("non-binary") || lower.includes("nonbinary")) return "non-binary"
  return "prefer-not-to-say"
}

function mapEthnicityValue(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes("asian")) return "asian"
  if (lower.includes("black") || lower.includes("african")) return "black"
  if (lower.includes("hispanic") || lower.includes("latino") || lower.includes("latina")) return "hispanic"
  if (lower.includes("native american") || lower.includes("indigenous") || lower.includes("american indian")) return "native_american"
  if (lower.includes("pacific islander") || lower.includes("hawaiian")) return "pacific_islander"
  if (lower.includes("white") || lower.includes("caucasian")) return "white"
  if (lower.includes("mixed") || lower.includes("multiracial") || lower.includes("two or more")) return "mixed"
  return "other"
}

function mapCitizenshipValue(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes("u.s. citizen") || lower.includes("us citizen") || lower.includes("united states citizen")) return "us_citizen"
  if (lower.includes("permanent resident") || lower.includes("green card")) return "permanent_resident"
  if (lower.includes("international")) return "international_student"
  if (lower.includes("daca")) return "daca"
  return "other"
}

function parseCommonAppText(text: string): { data: ParsedProfileDocumentData; review: ParsedDocumentReview } {
  const data: ParsedProfileDocumentData = {}

  const personalInfoMatch = text.match(/Personal\s+information\s*\n\s*(.+)/i)
  if (personalInfoMatch) {
    let nameLine = personalInfoMatch[1].trim().replace(/^Name\s+/i, "")
    const commaMatch = nameLine.match(/^(.+?),\s*(.+)$/)
    if (commaMatch) {
      nameLine = `${commaMatch[2].trim()} ${commaMatch[1].trim()}`
    }
    data.full_name = nameLine
  }

  data.email = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)?.[0] || undefined
  data.phone =
    text.match(/(?:phone|tel|mobile|cell)\s*[:\-]?\s*(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/i)?.[1] ||
    text.match(/(\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4})/)?.[1] ||
    undefined

  const dobMatch =
    text.match(/(?:date\s*of\s*birth|d\.?o\.?b\.?|birth\s*date|born)\s*[:\-]?\s*(\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4})/i) ||
    text.match(/(?:date\s*of\s*birth|d\.?o\.?b\.?|birth\s*date|born)\s*[:\-]?\s*([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i)
  if (dobMatch) {
    const dateObj = new Date(dobMatch[1])
    data.dob = Number.isNaN(dateObj.getTime()) ? dobMatch[1] : dateObj.toISOString().split("T")[0]
  }

  const genderRaw = extractField(text, [/(?:sex|gender)\s*[:\-]?\s*([A-Za-z\-\s]+?)(?:\n|$)/i])
  if (genderRaw) data.gender = mapGenderValue(genderRaw)

  const schoolSectionMatch = text.match(/[Cc]urrent\s+(?:or\s+most\s+recent\s+)?[Ss]econdary\s+[Ss]chool[\s\S]*?\n\s*(.+)/)
  data.school =
    schoolSectionMatch?.[1]?.trim() ||
    extractField(text, [/(?:current\s*school|secondary\s*school|high\s*school|school\s*name)\s*[:\-]?\s*(.+?)(?:\n|$)/i]) ||
    undefined

  const gpaMatch = text.match(/(?:gpa|grade\s*point\s*average|cumulative\s*gpa)\s*[:\-]?\s*(\d(?:\.\d{1,2})?)/i)
  if (gpaMatch) data.gpa = gpaMatch[1]

  const gradMatch = text.match(/(?:graduation|grad|expected\s*graduation|class\s*of)\s*[:\-]?\s*(\d{4})/i)
  if (gradMatch) data.graduation_year = gradMatch[1]

  const satMatch = text.match(/(?:sat)\s*(?:score|total)?\s*[:\-]?\s*(\d{3,4})/i)
  if (satMatch) data.sat_score = satMatch[1]

  const actMatch = text.match(/(?:act)\s*(?:score|composite)?\s*[:\-]?\s*(\d{1,2})/i)
  if (actMatch) data.act_score = actMatch[1]

  const eduRaw = extractField(text, [/(?:education\s*level|current\s*level|grade\s*level|year)\s*[:\-]?\s*(.+?)(?:\n|$)/i])
  if (eduRaw) data.education_level = inferEducationLevel(eduRaw) || undefined
  if (!data.education_level) data.education_level = inferEducationLevel(text) || undefined

  const ethnicityRaw = extractField(text, [/(?:race|ethnicity|ethnic\s*background)\s*[:\-]?\s*(.+?)(?:\n|$)/i])
  if (ethnicityRaw) data.ethnicity = mapEthnicityValue(ethnicityRaw)

  const citizenshipRaw = extractField(text, [/(?:citizenship|citizenship\s*status|citizen)\s*[:\-]?\s*(.+?)(?:\n|$)/i])
  if (citizenshipRaw) data.citizenship = mapCitizenshipValue(citizenshipRaw)

  const stateMatch =
    text.match(/,\s*([A-Z]{2})\s+\d{5}/)?.[1] ||
    extractField(text, [/(?:state|home\s*state|state\s*of\s*residence|state\/province)\s*[:\-]?\s*([A-Za-z\s]+?)(?:\n|$)/i])
  if (stateMatch) data.location_state = normalizeStateValue(stateMatch)

  data.first_generation = /first[\s\-]generation/i.test(text)
  data.military = /(?:veteran|military\s*service|armed\s*forces|military\s*family)/i.test(text)

  return {
    data,
    review: {},
  }
}

export async function extractTextFromDocument(file: File) {
  const lowerName = file.name.toLowerCase()
  if (lowerName.endsWith(".pdf") || file.type === "application/pdf") {
    const { PDFParse } = await import("pdf-parse")
    const arrayBuffer = await file.arrayBuffer()
    const parser = new PDFParse({ data: new Uint8Array(arrayBuffer) })
    const result = await parser.getText()
    await parser.destroy()
    return result.text
  }

  if (lowerName.endsWith(".txt") || file.type === "text/plain") {
    return file.text()
  }

  if (
    lowerName.endsWith(".docx") ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return extractTextFromDocx(file)
  }

  throw new Error("Unsupported file type. Please upload a PDF, DOCX, or TXT file.")
}

export function parseProfileDocument(kind: ParsedDocumentKind, text: string) {
  return kind === "common-app" ? parseCommonAppText(text) : parseResumeText(text)
}
