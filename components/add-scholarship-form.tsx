"use client"

import { useMemo, useState } from "react"
import { ArrowUpRight, Building2, CheckCircle2, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { scholarshipSubmissionSchema, type ScholarshipSubmissionInput } from "@/lib/scholarship-submission"

type FormErrors = Partial<Record<keyof ScholarshipSubmissionInput, string>>

const initialFormData: ScholarshipSubmissionInput = {
  organization_name: "",
  contact_name: "",
  contact_email: "",
  scholarship_title: "",
  description: "",
  amount: "",
  deadline: "",
  official_url: "",
  eligibility_requirements: "",
  eligible_majors: "",
  eligible_states: "",
  minimum_gpa: "",
  citizenship_requirements: "",
  academic_level: "",
  tags: "",
  additional_notes: "",
  company_website: "",
}

const academicLevelOptions = [
  "High School",
  "Undergraduate",
  "Graduate",
  "Community College",
  "Open to Multiple Levels",
]

const citizenshipOptions = [
  "U.S. Citizen",
  "Permanent Resident",
  "International Students Allowed",
  "Open to All Citizenship Statuses",
  "Other / See Eligibility",
]

function fieldErrorMap(input: ScholarshipSubmissionInput) {
  const parsed = scholarshipSubmissionSchema.safeParse(input)
  if (parsed.success) return {}

  const nextErrors: FormErrors = {}
  for (const issue of parsed.error.issues) {
    const field = issue.path[0] as keyof ScholarshipSubmissionInput
    if (field && !nextErrors[field]) {
      nextErrors[field] = issue.message
    }
  }
  return nextErrors
}

export default function AddScholarshipForm() {
  const [formData, setFormData] = useState<ScholarshipSubmissionInput>(initialFormData)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const requiredFieldsComplete = useMemo(() => {
    return [
      formData.organization_name,
      formData.contact_name,
      formData.contact_email,
      formData.scholarship_title,
      formData.description,
      formData.amount,
      formData.deadline,
      formData.official_url,
      formData.eligibility_requirements,
      formData.citizenship_requirements,
      formData.academic_level,
    ].every((value) => value.trim().length > 0)
  }, [formData])

  const setField = (field: keyof ScholarshipSubmissionInput, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError(null)
    setSuccessMessage(null)

    const nextErrors = fieldErrorMap(formData)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setSubmitError("Please correct the highlighted fields before submitting.")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/scholarship-submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        setErrors((result?.fieldErrors || {}) as FormErrors)
        throw new Error(result?.error || "Failed to submit scholarship")
      }

      setFormData(initialFormData)
      setErrors({})
      setSuccessMessage(
        result?.message ||
          "Thanks for submitting your scholarship. Our team will review it before publishing."
      )
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "We couldn't submit your scholarship right now. Please try again."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass = (field: keyof ScholarshipSubmissionInput) =>
    errors[field] ? "border-destructive focus-visible:ring-destructive/20" : ""

  return (
    <div className="rounded-[2rem] border border-border bg-white/95 shadow-[0_25px_80px_rgba(33,62,153,0.12)] backdrop-blur-sm">
      <div className="border-b border-border px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
              <Building2 className="h-4 w-4" />
              Scholarship Provider Submission
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                Submit your scholarship for review
              </h2>
              <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                Share your opportunity with Scholar Swipe. Our team reviews every submission before it appears in the public feed.
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Reviewed before publishing
          </div>
        </div>
      </div>

      <form className="space-y-8 px-6 py-8 sm:px-8" onSubmit={handleSubmit} noValidate>
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={formData.company_website}
          onChange={(event) => setField("company_website", event.target.value)}
          className="hidden"
          aria-hidden="true"
        />

        <section className="space-y-5">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground">Provider details</h3>
            <p className="text-sm text-muted-foreground">
              Tell us who is offering the scholarship and how we can reach you during review.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="organization_name">Organization / Company Name</Label>
              <Input
                id="organization_name"
                value={formData.organization_name}
                onChange={(event) => setField("organization_name", event.target.value)}
                className={inputClass("organization_name")}
                aria-invalid={Boolean(errors.organization_name)}
                placeholder="Acme Foundation"
              />
              {errors.organization_name && <p className="text-sm text-destructive">{errors.organization_name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_name">Contact Name</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(event) => setField("contact_name", event.target.value)}
                className={inputClass("contact_name")}
                aria-invalid={Boolean(errors.contact_name)}
                placeholder="Jane Smith"
              />
              {errors.contact_name && <p className="text-sm text-destructive">{errors.contact_name}</p>}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(event) => setField("contact_email", event.target.value)}
                className={inputClass("contact_email")}
                aria-invalid={Boolean(errors.contact_email)}
                placeholder="scholarships@company.org"
              />
              {errors.contact_email && <p className="text-sm text-destructive">{errors.contact_email}</p>}
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground">Scholarship details</h3>
            <p className="text-sm text-muted-foreground">
              Include the information students need in order to understand the opportunity.
            </p>
          </div>
          <div className="grid gap-5">
            <div className="space-y-2">
              <Label htmlFor="scholarship_title">Scholarship Title</Label>
              <Input
                id="scholarship_title"
                value={formData.scholarship_title}
                onChange={(event) => setField("scholarship_title", event.target.value)}
                className={inputClass("scholarship_title")}
                aria-invalid={Boolean(errors.scholarship_title)}
                placeholder="2026 Future Leaders Scholarship"
              />
              {errors.scholarship_title && <p className="text-sm text-destructive">{errors.scholarship_title}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Scholarship Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(event) => setField("description", event.target.value)}
                className={`min-h-36 ${inputClass("description")}`}
                aria-invalid={Boolean(errors.description)}
                placeholder="Describe the scholarship, its purpose, and what makes it valuable for students."
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Award Amount</Label>
                <Input
                  id="amount"
                  value={formData.amount}
                  onChange={(event) => setField("amount", event.target.value)}
                  className={inputClass("amount")}
                  aria-invalid={Boolean(errors.amount)}
                  placeholder="$5,000"
                />
                {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(event) => setField("deadline", event.target.value)}
                  className={inputClass("deadline")}
                  aria-invalid={Boolean(errors.deadline)}
                />
                {errors.deadline && <p className="text-sm text-destructive">{errors.deadline}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="official_url">Official Scholarship URL / Application Link</Label>
              <Input
                id="official_url"
                type="url"
                value={formData.official_url}
                onChange={(event) => setField("official_url", event.target.value)}
                className={inputClass("official_url")}
                aria-invalid={Boolean(errors.official_url)}
                placeholder="https://www.company.org/scholarship"
              />
              {errors.official_url && <p className="text-sm text-destructive">{errors.official_url}</p>}
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground">Eligibility and review notes</h3>
            <p className="text-sm text-muted-foreground">
              Structured details help our review team and improve how the scholarship is categorized later.
            </p>
          </div>
          <div className="grid gap-5">
            <div className="space-y-2">
              <Label htmlFor="eligibility_requirements">Eligibility Requirements</Label>
              <Textarea
                id="eligibility_requirements"
                value={formData.eligibility_requirements}
                onChange={(event) => setField("eligibility_requirements", event.target.value)}
                className={`min-h-32 ${inputClass("eligibility_requirements")}`}
                aria-invalid={Boolean(errors.eligibility_requirements)}
                placeholder="List key requirements such as year, residency, need, essay, enrollment status, or background criteria."
              />
              {errors.eligibility_requirements && (
                <p className="text-sm text-destructive">{errors.eligibility_requirements}</p>
              )}
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="eligible_majors">Eligible Majors</Label>
                <Input
                  id="eligible_majors"
                  value={formData.eligible_majors}
                  onChange={(event) => setField("eligible_majors", event.target.value)}
                  className={inputClass("eligible_majors")}
                  aria-invalid={Boolean(errors.eligible_majors)}
                  placeholder="Computer Science, Engineering, Business"
                />
                {errors.eligible_majors && <p className="text-sm text-destructive">{errors.eligible_majors}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="eligible_states">Eligible States / Location Restrictions</Label>
                <Input
                  id="eligible_states"
                  value={formData.eligible_states}
                  onChange={(event) => setField("eligible_states", event.target.value)}
                  className={inputClass("eligible_states")}
                  aria-invalid={Boolean(errors.eligible_states)}
                  placeholder="PA, NJ, NY or Nationwide"
                />
                {errors.eligible_states && <p className="text-sm text-destructive">{errors.eligible_states}</p>}
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="minimum_gpa">Minimum GPA</Label>
                <Input
                  id="minimum_gpa"
                  type="number"
                  min="0"
                  max="4.5"
                  step="0.01"
                  value={String(formData.minimum_gpa ?? "")}
                  onChange={(event) => setField("minimum_gpa", event.target.value)}
                  className={inputClass("minimum_gpa")}
                  aria-invalid={Boolean(errors.minimum_gpa)}
                  placeholder="3.25"
                />
                {errors.minimum_gpa && <p className="text-sm text-destructive">{errors.minimum_gpa}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="citizenship_requirements">Citizenship Requirements</Label>
                <Select
                  value={formData.citizenship_requirements}
                  onValueChange={(value) => setField("citizenship_requirements", value)}
                >
                  <SelectTrigger
                    id="citizenship_requirements"
                    className={`w-full ${inputClass("citizenship_requirements")}`}
                    aria-invalid={Boolean(errors.citizenship_requirements)}
                  >
                    <SelectValue placeholder="Select requirement" />
                  </SelectTrigger>
                  <SelectContent>
                    {citizenshipOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.citizenship_requirements && (
                  <p className="text-sm text-destructive">{errors.citizenship_requirements}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="academic_level">Academic Level / Grade Level</Label>
                <Select
                  value={formData.academic_level}
                  onValueChange={(value) => setField("academic_level", value)}
                >
                  <SelectTrigger
                    id="academic_level"
                    className={`w-full ${inputClass("academic_level")}`}
                    aria-invalid={Boolean(errors.academic_level)}
                  >
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicLevelOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.academic_level && <p className="text-sm text-destructive">{errors.academic_level}</p>}
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tags">Tags / Categories</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(event) => setField("tags", event.target.value)}
                  className={inputClass("tags")}
                  aria-invalid={Boolean(errors.tags)}
                  placeholder="STEM, Need-based, Leadership"
                />
                {errors.tags && <p className="text-sm text-destructive">{errors.tags}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="additional_notes">Additional Notes</Label>
                <Textarea
                  id="additional_notes"
                  value={formData.additional_notes}
                  onChange={(event) => setField("additional_notes", event.target.value)}
                  className={`min-h-28 ${inputClass("additional_notes")}`}
                  aria-invalid={Boolean(errors.additional_notes)}
                  placeholder="Anything our review team should know before publishing."
                />
                {errors.additional_notes && <p className="text-sm text-destructive">{errors.additional_notes}</p>}
              </div>
            </div>
          </div>
        </section>

        {successMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-800">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">{successMessage}</p>
            </div>
          </div>
        )}

        {submitError && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-4 text-destructive">
            <p className="text-sm font-medium">{submitError}</p>
          </div>
        )}

        <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Required fields are validated on both the form and the server. Approved scholarships are published after review.
          </p>
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || !requiredFieldsComplete}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSubmitting ? "Submitting..." : "Submit for Review"}
            {!isSubmitting && <ArrowUpRight className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  )
}
