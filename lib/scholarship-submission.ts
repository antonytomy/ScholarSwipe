import { z } from "zod"

const dateRegex = /^\d{4}-\d{2}-\d{2}$/

function splitCommaSeparated(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function isValidDateString(value: string) {
  if (!dateRegex.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value)
}

export const scholarshipSubmissionSchema = z.object({
  organization_name: z.string().trim().min(2, "Organization / Company Name is required").max(120, "Keep this under 120 characters"),
  contact_name: z.string().trim().min(2, "Contact Name is required").max(120, "Keep this under 120 characters"),
  contact_email: z.string().trim().email("Enter a valid contact email").max(200, "Keep this under 200 characters"),
  scholarship_title: z.string().trim().min(4, "Scholarship Title is required").max(160, "Keep this under 160 characters"),
  description: z.string().trim().min(40, "Scholarship Description should be at least 40 characters").max(6000, "Keep this under 6000 characters"),
  amount: z.string().trim().min(1, "Award Amount is required").max(80, "Keep this under 80 characters"),
  deadline: z.string().trim().refine(isValidDateString, "Enter a valid deadline"),
  official_url: z.string().trim().url("Enter a valid official URL").max(500, "Keep this under 500 characters"),
  eligibility_requirements: z.string().trim().min(20, "Eligibility Requirements should be at least 20 characters").max(5000, "Keep this under 5000 characters"),
  eligible_majors: z.string().trim().max(500, "Keep this under 500 characters").optional().default(""),
  eligible_states: z.string().trim().max(500, "Keep this under 500 characters").optional().default(""),
  minimum_gpa: z.union([z.string(), z.number()]).optional().transform((value) => {
    if (value === undefined || value === null || value === "") return null
    const parsed = typeof value === "number" ? value : Number(value)
    return Number.isFinite(parsed) ? parsed : Number.NaN
  }).refine((value) => value === null || (value >= 0 && value <= 4.5), "Minimum GPA must be between 0.00 and 4.50"),
  citizenship_requirements: z.string().trim().min(2, "Citizenship Requirements are required").max(240, "Keep this under 240 characters"),
  academic_level: z.string().trim().min(2, "Academic Level / Grade Level is required").max(240, "Keep this under 240 characters"),
  tags: z.string().trim().max(500, "Keep this under 500 characters").optional().default(""),
  additional_notes: z.string().trim().max(3000, "Keep this under 3000 characters").optional().default(""),
  company_website: z.string().max(0).optional().default(""),
})

export type ScholarshipSubmissionInput = z.input<typeof scholarshipSubmissionSchema>
export type ScholarshipSubmissionData = z.infer<typeof scholarshipSubmissionSchema>

export function toScholarshipSubmissionInsert(data: ScholarshipSubmissionData) {
  return {
    organization_name: data.organization_name,
    contact_name: data.contact_name,
    contact_email: data.contact_email.toLowerCase(),
    scholarship_title: data.scholarship_title,
    description: data.description,
    amount: data.amount,
    deadline: data.deadline,
    official_url: data.official_url,
    eligibility_requirements: data.eligibility_requirements,
    eligible_majors: splitCommaSeparated(data.eligible_majors),
    eligible_states: splitCommaSeparated(data.eligible_states),
    minimum_gpa: data.minimum_gpa,
    citizenship_requirements: data.citizenship_requirements,
    academic_level: data.academic_level,
    tags: splitCommaSeparated(data.tags),
    additional_notes: data.additional_notes || null,
  }
}
