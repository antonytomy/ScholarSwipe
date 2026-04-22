"use client"

import type React from "react"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Upload,
  User,
} from "lucide-react"
import Footer from "@/components/footer"
import Navbar from "@/components/navbar"
import { GpaProfileField } from "@/components/profile/gpa-profile-field"
import { MajorSelector } from "@/components/profile/major-selector"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { validateProfilePayload } from "@/lib/profile-payload"
import {
  ETHNICITY_OPTIONS,
  US_STATES,
  getExactGpaValidationMessage,
  normalizeMajorsInput,
  normalizeStateValue,
} from "@/lib/profile-form-options"
import type { SignupApiResponse, SignupData } from "@/lib/types"

type SignupFormState = SignupData & {
  dob: string
}

interface ParsedCommonAppResponse {
  error?: string
  message?: string
  fieldsExtracted?: number
  data?: Partial<Record<string, unknown>>
}

const INITIAL_FORM_DATA: SignupFormState = {
  full_name: "",
  email: "",
  phone: "",
  dob: "",
  gender: "",
  password: "",
  confirmPassword: "",
  education_level: "",
  graduation_year: "",
  school: "",
  gpa_mode: "range",
  gpa_exact: "",
  gpa_range: "",
  sat_score: "",
  act_score: "",
  intended_majors: [],
  academic_year: "",
  extracurriculars: "",
  ethnicity: "",
  ethnicity_other: "",
  citizenship: "",
  income_range: "",
  first_generation: false,
  location_state: "",
  disabilities: "",
  military: false,
}

const STEP_LABELS = {
  1: "Basic Information",
  2: "Academic & Educational",
  3: "Extracurriculars",
  4: "Background & Demographics",
} as const

function getSignupStageLabel(stage?: SignupApiResponse["stage"]) {
  switch (stage) {
    case "client_validation":
      return "Validation"
    case "auth_signup":
      return "Auth signup"
    case "profile_save":
      return "Profile save"
    case "onboarding_save":
      return "Onboarding save"
    case "rls_policy":
      return "Permissions"
    case "schema_mismatch":
      return "Schema mismatch"
    case "match_bootstrap":
      return "Match bootstrap"
    case "cleanup":
      return "Cleanup"
    default:
      return "Signup"
  }
}

export default function SignupPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const signupRequestLockRef = useRef(false)
  const lastSignupAttemptRef = useRef<{ id: string; email: string; startedAt: number } | null>(null)

  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<SignupFormState>(INITIAL_FORM_DATA)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [parseSuccess, setParseSuccess] = useState<string | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [preFilledFields, setPreFilledFields] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!authLoading && user) {
      router.push("/swipe")
    }
  }, [authLoading, router, user])

  const preFilledClass = useCallback(
    (field: string) => (preFilledFields.has(field) ? "ring-2 ring-green-300 bg-green-50/60" : ""),
    [preFilledFields]
  )

  const handleChange = <K extends keyof SignupFormState>(field: K, value: SignupFormState[K]) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value }

      if (field === "ethnicity" && value !== "other") {
        next.ethnicity_other = ""
      }

      if (field === "gpa_mode") {
        if (value === "exact") {
          next.gpa_range = ""
        } else {
          next.gpa_exact = ""
        }
      }

      return next
    })
  }

  const toggleMajor = (major: string) => {
    setFormData((prev) => ({
      ...prev,
      intended_majors: prev.intended_majors.includes(major)
        ? prev.intended_majors.filter((item) => item !== major)
        : [...prev.intended_majors, major],
    }))
  }

  const isStepValid = useMemo(() => {
    return (step: number) => {
      if (step === 1) {
        return Boolean(
          formData.full_name &&
            formData.email &&
            formData.phone &&
            formData.dob &&
            formData.gender &&
            formData.password &&
            formData.confirmPassword &&
            formData.password.length >= 6 &&
            formData.password === formData.confirmPassword &&
            acceptedTerms
        )
      }

      if (step === 2) {
        const hasGpa =
          (formData.gpa_mode === "exact" &&
            Boolean(formData.gpa_exact) &&
            !getExactGpaValidationMessage(formData.gpa_exact)) ||
          (formData.gpa_mode === "range" && Boolean(formData.gpa_range))

        return Boolean(
          formData.education_level &&
            formData.graduation_year &&
            formData.school &&
            hasGpa &&
            formData.intended_majors.length > 0
        )
      }

      if (step === 3) {
        return Boolean(formData.extracurriculars.trim())
      }

      if (step === 4) {
        return Boolean(
          formData.ethnicity &&
            formData.citizenship &&
            formData.income_range &&
            formData.location_state &&
            (formData.ethnicity !== "other" || formData.ethnicity_other.trim())
        )
      }

      return false
    }
  }, [acceptedTerms, formData])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (signupRequestLockRef.current) {
      const activeAttempt = lastSignupAttemptRef.current
      console.warn("[signup-ui] Ignoring duplicate submit while signup is already in flight", {
        trigger: "SignupPage.handleSubmit",
        email: formData.email.trim().toLowerCase(),
        activeAttemptId: activeAttempt?.id ?? null,
        activeAttemptAgeMs: activeAttempt ? Date.now() - activeAttempt.startedAt : null,
      })
      return
    }

    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1)
      return
    }

    const { errors } = validateProfilePayload(formData as unknown as Record<string, unknown>, {
      requireCoreFields: true,
    })

    if (formData.password !== formData.confirmPassword) {
      setSubmitError("Validation: passwords do not match.")
      return
    }

    if (!acceptedTerms) {
      setSubmitError("Validation: accept the Terms of Service and Privacy Policy before creating your account.")
      return
    }

    if (errors.length > 0) {
      setSubmitError(`Validation: fix these fields before creating your account: ${errors.join(", ")}`)
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)
    signupRequestLockRef.current = true

    const signupAttemptId = crypto.randomUUID()
    const normalizedEmail = formData.email.trim().toLowerCase()
    const previousAttempt = lastSignupAttemptRef.current
    const repeatedEmailWithinMs =
      previousAttempt && previousAttempt.email === normalizedEmail
        ? Date.now() - previousAttempt.startedAt
        : null

    lastSignupAttemptRef.current = {
      id: signupAttemptId,
      email: normalizedEmail,
      startedAt: Date.now(),
    }

    console.log("[signup-ui] Signup started", {
      trigger: "SignupPage.handleSubmit",
      attemptId: signupAttemptId,
      email: normalizedEmail,
      currentStep,
      repeatedEmailWithinMs,
    })

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-signup-attempt-id": signupAttemptId,
          "x-signup-trigger": "SignupPage.handleSubmit",
        },
        body: JSON.stringify(formData),
      })

      const result: SignupApiResponse = await response.json().catch(() => ({ success: false, error: "Signup failed" }))
      if (!response.ok) {
        console.error("[signup-ui] Signup request failed", {
          trigger: "SignupPage.handleSubmit",
          attemptId: signupAttemptId,
          email: normalizedEmail,
          status: response.status,
          result,
        })
        const stageLabel = getSignupStageLabel(result.stage)
        const cleanupNote =
          result.cleanupAttempted && result.cleanupSucceeded === false
            ? " Partial auth cleanup also failed; contact support before retrying."
            : ""
        const requestNote = result.requestId ? ` [ref: ${result.requestId}]` : ""
        setSubmitError(`${stageLabel}: ${result.error || "Signup failed"}${cleanupNote}${requestNote}`)
        return
      }

      if (result.warning) {
        console.warn("[signup-ui] Signup warning", {
          attemptId: signupAttemptId,
          email: normalizedEmail,
          warning: result.warning,
        })
      }
      console.log("[signup-ui] Signup completed", {
        trigger: "SignupPage.handleSubmit",
        attemptId: signupAttemptId,
        email: normalizedEmail,
        requestId: result.requestId ?? null,
      })

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: formData.password,
      })

      if (signInError) {
        console.warn("[signup-ui] Automatic sign-in after signup failed", {
          attemptId: signupAttemptId,
          email: normalizedEmail,
          requestId: result.requestId ?? null,
          error: signInError.message,
        })
        setSubmitError(
          signInError.message.toLowerCase().includes("email not confirmed")
            ? "Account created. Please confirm your email, then sign in."
            : `Account created, but automatic sign-in failed: ${signInError.message}`
        )
        setShowEmailConfirmation(true)
        return
      }

      window.location.href = "/swipe"
    } catch (error) {
      console.error("[signup-ui] Signup error", {
        trigger: "SignupPage.handleSubmit",
        attemptId: signupAttemptId,
        email: normalizedEmail,
        error,
      })
      setSubmitError(error instanceof Error ? error.message : "An error occurred during signup")
    } finally {
      signupRequestLockRef.current = false
      setIsSubmitting(false)
    }
  }

  const handlePdfUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setParseError("Please upload a PDF file.")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setParseError("File size must be under 10MB.")
      return
    }

    setIsParsing(true)
    setParseError(null)
    setParseSuccess(null)
    setUploadedFileName(file.name)

    try {
      const uploadData = new FormData()
      uploadData.append("pdf", file)

      const response = await fetch("/api/parse-common-app", {
        method: "POST",
        body: uploadData,
      })

      const result: ParsedCommonAppResponse = await response.json().catch(() => ({}))
      if (!response.ok) {
        setParseError(result.error || "Failed to parse PDF")
        return
      }

      const parsed = result.data ?? {}
      const filledFields = new Set<string>()

      setFormData((prev) => {
        const next = { ...prev }

        Object.entries(parsed).forEach(([key, value]) => {
          if (!value && value !== false) return

          if (key === "gpa") {
            next.gpa_mode = "exact"
            next.gpa_exact = String(value)
            filledFields.add("gpa_exact")
            return
          }

          if (key === "intended_major") {
            next.intended_majors = normalizeMajorsInput(value)
            filledFields.add("intended_majors")
            return
          }

          if (key === "location_state") {
            next.location_state = normalizeStateValue(String(value))
            filledFields.add("location_state")
            return
          }

          if (key in next) {
            ;(next as Record<string, unknown>)[key] = value
            filledFields.add(key)
          }
        })

        return next
      })

      setPreFilledFields(filledFields)
      setParseSuccess(result.message || `Extracted ${result.fieldsExtracted ?? 0} fields from your PDF.`)
      setTimeout(() => setCurrentStep(1), 1200)
    } catch (error) {
      console.error("PDF parse error:", error)
      setParseError(error instanceof Error ? error.message : "Failed to parse PDF. You can fill in the form manually.")
    } finally {
      setIsParsing(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) handlePdfUpload(file)
  }

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) handlePdfUpload(file)
  }, [])

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 flex items-center justify-center px-4 py-12">
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float-slow" />
        </div>

        <div className="w-full max-w-3xl">
          <div className="glass-card-advanced rounded-3xl p-8 space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary">
                <GraduationCap className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold">Create Account</h1>
                <p className="text-muted-foreground mt-2">
                  Build a strong profile so the matching engine has the right academic and background context.
                </p>
              </div>

              {currentStep > 0 && (
                <>
                  <div className="flex items-center justify-center space-x-2 mt-6">
                    {[1, 2, 3, 4].map((step) => (
                      <div key={step} className="flex items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            currentStep >= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {step}
                        </div>
                        {step < 4 && <div className={`w-6 h-0.5 mx-1 ${currentStep > step ? "bg-primary" : "bg-muted"}`} />}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">{STEP_LABELS[currentStep as keyof typeof STEP_LABELS]}</div>
                </>
              )}

              {currentStep > 0 && preFilledFields.size > 0 && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg mt-2">
                  <p className="text-sm flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Fields highlighted in green were auto-filled from your Common App PDF.
                  </p>
                </div>
              )}
            </div>

            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">How would you like to get started?</h2>
                  <p className="text-muted-foreground text-sm">
                    Upload your Common App PDF for a head start, or complete the form manually.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="group relative p-6 rounded-2xl border-2 border-border hover:border-primary/50 bg-card hover:bg-primary/5 transition-all duration-300 text-left flex flex-col hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
                  >
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300 mb-4">
                      <Pencil className="w-7 h-7 text-white" />
                    </div>
                    <div className="mb-4">
                      <h3 className="font-semibold text-lg">Fill in Manually</h3>
                      <p className="text-muted-foreground text-sm mt-1">Walk through each section and tailor your academic profile.</p>
                    </div>
                    <div className="mt-auto border-2 border-dashed border-primary/20 rounded-xl p-4 text-center group-hover:border-primary/40 group-hover:bg-primary/5 transition-all duration-300">
                      <Pencil className="w-6 h-6 mx-auto mb-2 text-primary/50 group-hover:text-primary transition-colors" />
                      <p className="text-sm text-primary font-medium">Start the profile flow</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">4 steps</p>
                    </div>
                  </button>

                  <div
                    className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 text-left flex flex-col ${
                      isDragging
                        ? "border-green-500 bg-green-50 shadow-lg shadow-green-500/20 scale-[1.02]"
                        : "border-border hover:border-green-500/50 bg-card hover:bg-green-50/50 hover:shadow-lg hover:shadow-green-500/10 hover:-translate-y-1"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform duration-300 mb-4">
                      <FileText className="w-7 h-7 text-white" />
                    </div>
                    <div className="mb-4">
                      <h3 className="font-semibold text-lg">Upload Common App PDF</h3>
                      <p className="text-muted-foreground text-sm mt-1">We&apos;ll pre-fill the fields we can trust and leave the rest editable.</p>
                    </div>

                    {!isParsing && !parseSuccess && (
                      <div
                        className={`mt-auto border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-300 ${
                          isDragging ? "border-green-500 bg-green-100/50" : "border-muted-foreground/30 hover:border-green-500/50"
                        }`}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className={`w-6 h-6 mx-auto mb-2 ${isDragging ? "text-green-600" : "text-muted-foreground"}`} />
                        <p className="text-sm text-muted-foreground">
                          <span className="text-primary font-medium">Click to browse</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">PDF only, max 10MB</p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </div>
                    )}

                    {isParsing && (
                      <div className="mt-auto border-2 border-dashed border-primary/30 rounded-xl p-4 text-center bg-primary/5">
                        <Loader2 className="w-6 h-6 mx-auto mb-2 text-primary animate-spin" />
                        <p className="text-sm text-primary font-medium">Parsing {uploadedFileName}...</p>
                        <p className="text-xs text-muted-foreground mt-1">Extracting profile fields</p>
                      </div>
                    )}

                    {parseSuccess && (
                      <div className="mt-auto border-2 border-green-300 rounded-xl p-4 text-center bg-green-50">
                        <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-green-600" />
                        <p className="text-sm text-green-700 font-medium">{parseSuccess}</p>
                        <p className="text-xs text-green-600 mt-1">Moving you into the form...</p>
                      </div>
                    )}
                  </div>
                </div>

                {parseError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{parseError}</p>
                      <button
                        onClick={() => {
                          setParseError(null)
                          setCurrentStep(1)
                        }}
                        className="text-sm text-red-600 underline mt-1 hover:text-red-800"
                      >
                        Continue with manual entry
                      </button>
                    </div>
                  </div>
                )}

                <div className="text-center text-sm pt-2">
                  <span className="text-muted-foreground">Already have an account? </span>
                  <Link href="/login" className="text-primary hover:underline font-medium">
                    Sign in
                  </Link>
                </div>
              </div>
            )}

            {currentStep > 0 && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {currentStep === 1 && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) => handleChange("full_name", e.target.value)}
                            className={`pl-10 h-12 ${preFilledClass("full_name")}`}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                            className={`pl-10 h-12 ${preFilledClass("email")}`}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => handleChange("phone", e.target.value)}
                          className={`h-12 ${preFilledClass("phone")}`}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dob">Date of Birth</Label>
                        <Input
                          id="dob"
                          type="date"
                          value={formData.dob}
                          onChange={(e) => handleChange("dob", e.target.value)}
                          className={`h-12 ${preFilledClass("dob")}`}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label>Gender</Label>
                        <Select value={formData.gender} onValueChange={(value) => handleChange("gender", value)}>
                          <SelectTrigger className={`h-12 ${preFilledClass("gender")}`}>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="non-binary">Non-binary</SelectItem>
                            <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => handleChange("password", e.target.value)}
                          className="h-12"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleChange("confirmPassword", e.target.value)}
                        className="h-12"
                        required
                      />
                    </div>

                    <label className="flex items-start gap-3 text-sm">
                      <Checkbox checked={acceptedTerms} onCheckedChange={(checked) => setAcceptedTerms(Boolean(checked))} />
                      <span className="text-muted-foreground">
                        I agree to the <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and{" "}
                        <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                      </span>
                    </label>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label>Current Education Level</Label>
                        <Select value={formData.education_level} onValueChange={(value) => handleChange("education_level", value)}>
                          <SelectTrigger className={`h-12 ${preFilledClass("education_level")}`}>
                            <SelectValue placeholder="Select education level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high_school">High School</SelectItem>
                            <SelectItem value="undergraduate">Undergraduate</SelectItem>
                            <SelectItem value="graduate">Graduate</SelectItem>
                            <SelectItem value="community_college">Community College</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Academic Year</Label>
                        <Select
                          value={formData.academic_year || "unspecified"}
                          onValueChange={(value) => handleChange("academic_year", value === "unspecified" ? "" : value)}
                        >
                          <SelectTrigger className={`h-12 ${preFilledClass("academic_year")}`}>
                            <SelectValue placeholder="Select academic year" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unspecified">Not specified</SelectItem>
                            <SelectItem value="high_school">High School</SelectItem>
                            <SelectItem value="freshman">Freshman</SelectItem>
                            <SelectItem value="sophomore">Sophomore</SelectItem>
                            <SelectItem value="junior">Junior</SelectItem>
                            <SelectItem value="senior">Senior</SelectItem>
                            <SelectItem value="graduate_student">Graduate Student</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="school">School / University</Label>
                        <div className="relative">
                          <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            id="school"
                            value={formData.school}
                            onChange={(e) => handleChange("school", e.target.value)}
                            className={`pl-10 h-12 ${preFilledClass("school")}`}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="graduation_year">Expected Graduation Year</Label>
                        <Input
                          id="graduation_year"
                          type="number"
                          min="2024"
                          max="2036"
                          value={formData.graduation_year}
                          onChange={(e) => handleChange("graduation_year", e.target.value)}
                          className={`h-12 ${preFilledClass("graduation_year")}`}
                          required
                        />
                      </div>
                    </div>

                    <GpaProfileField
                      mode={formData.gpa_mode}
                      exactValue={formData.gpa_exact}
                      rangeValue={formData.gpa_range}
                      onModeChange={(value) => handleChange("gpa_mode", value)}
                      onExactChange={(value) => handleChange("gpa_exact", value)}
                      onRangeChange={(value) => handleChange("gpa_range", value)}
                      exactInputClassName={`h-12 ${preFilledClass("gpa_exact")}`}
                      rangeInputClassName={`h-12 ${preFilledClass("gpa_range")}`}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="sat_score">SAT Score</Label>
                        <Input
                          id="sat_score"
                          type="number"
                          min="400"
                          max="1600"
                          value={formData.sat_score}
                          onChange={(e) => handleChange("sat_score", e.target.value)}
                          className={`h-12 ${preFilledClass("sat_score")}`}
                          placeholder="Optional"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="act_score">ACT Score</Label>
                        <Input
                          id="act_score"
                          type="number"
                          min="1"
                          max="36"
                          value={formData.act_score}
                          onChange={(e) => handleChange("act_score", e.target.value)}
                          className={`h-12 ${preFilledClass("act_score")}`}
                          placeholder="Optional"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Select your intended majors or academic interests</Label>
                      <MajorSelector
                        selectedMajors={formData.intended_majors}
                        onToggleMajor={toggleMajor}
                        className={preFilledClass("intended_majors")}
                        helperText="Select all that apply. Multiple majors are saved as a structured list for matching."
                      />
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold">Extracurriculars</h3>
                      <p className="text-sm text-muted-foreground">
                        Add leadership, service, athletics, work, research, and clubs so eligibility and fit logic has stronger context.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="extracurriculars">Extracurriculars, leadership, work, or service</Label>
                      <Textarea
                        id="extracurriculars"
                        value={formData.extracurriculars}
                        onChange={(e) => handleChange("extracurriculars", e.target.value)}
                        className={`min-h-40 ${preFilledClass("extracurriculars")}`}
                        placeholder="Student government, robotics, volunteer work, part-time job, athletics, research, clubs..."
                        required
                      />
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label>Race / Ethnicity</Label>
                        <Select value={formData.ethnicity} onValueChange={(value) => handleChange("ethnicity", value)}>
                          <SelectTrigger className={`h-12 ${preFilledClass("ethnicity")}`}>
                            <SelectValue placeholder="Select ethnicity" />
                          </SelectTrigger>
                          <SelectContent>
                            {ETHNICITY_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formData.ethnicity === "other" && (
                          <Input
                            value={formData.ethnicity_other}
                            onChange={(e) => handleChange("ethnicity_other", e.target.value)}
                            placeholder="Please specify"
                            className="h-11"
                          />
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Citizenship Status</Label>
                        <Select value={formData.citizenship} onValueChange={(value) => handleChange("citizenship", value)}>
                          <SelectTrigger className={`h-12 ${preFilledClass("citizenship")}`}>
                            <SelectValue placeholder="Select citizenship" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="us_citizen">US Citizen</SelectItem>
                            <SelectItem value="permanent_resident">Permanent Resident</SelectItem>
                            <SelectItem value="international_student">International Student</SelectItem>
                            <SelectItem value="daca">DACA Recipient</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label>Family Income Range</Label>
                        <Select value={formData.income_range} onValueChange={(value) => handleChange("income_range", value)}>
                          <SelectTrigger className={`h-12 ${preFilledClass("income_range")}`}>
                            <SelectValue placeholder="Select income range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="under_25k">Under $25,000</SelectItem>
                            <SelectItem value="25k_50k">$25,000 - $50,000</SelectItem>
                            <SelectItem value="50k_75k">$50,000 - $75,000</SelectItem>
                            <SelectItem value="75k_100k">$75,000 - $100,000</SelectItem>
                            <SelectItem value="100k_150k">$100,000 - $150,000</SelectItem>
                            <SelectItem value="over_150k">Over $150,000</SelectItem>
                            <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Primary State</Label>
                        <Select value={formData.location_state} onValueChange={(value) => handleChange("location_state", value)}>
                          <SelectTrigger className={`h-12 ${preFilledClass("location_state")}`}>
                            <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Select your state" />
                          </SelectTrigger>
                          <SelectContent>
                            {US_STATES.map((state) => (
                              <SelectItem key={state.value} value={state.value}>
                                {state.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="disabilities">Disabilities or accommodation context</Label>
                      <Input
                        id="disabilities"
                        value={formData.disabilities}
                        onChange={(e) => handleChange("disabilities", e.target.value)}
                        className={`h-12 ${preFilledClass("disabilities")}`}
                        placeholder="Optional"
                      />
                    </div>

                    <div className="space-y-4 rounded-2xl border border-border/70 p-4 bg-background/70">
                      <label className="flex items-center space-x-3">
                        <Checkbox
                          checked={formData.first_generation}
                          onCheckedChange={(checked) => handleChange("first_generation", Boolean(checked))}
                        />
                        <span className="text-sm font-medium">I am a first-generation college student</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <Checkbox checked={formData.military} onCheckedChange={(checked) => handleChange("military", Boolean(checked))} />
                        <span className="text-sm font-medium">I am a veteran or military family member</span>
                      </label>
                    </div>
                  </div>
                )}

                {submitError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{submitError}</div>}

                {showEmailConfirmation && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Mail className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold text-green-800">Check Your Email</h3>
                        <p className="text-sm text-green-700">
                          We&apos;ve sent a confirmation link to <strong>{formData.email}</strong>. Confirm it to activate your account.
                        </p>
                        <div className="flex gap-3 mt-3">
                          <Button onClick={() => (window.location.href = "/login")} className="bg-green-600 hover:bg-green-700 text-white">
                            Go to Login
                          </Button>
                          <Button variant="outline" onClick={() => setShowEmailConfirmation(false)}>
                            Close
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  {currentStep > 1 && (
                    <Button type="button" variant="outline" onClick={() => setCurrentStep((prev) => prev - 1)} className="flex-1 h-12">
                      Previous
                    </Button>
                  )}
                  <Button
                    type="submit"
                    className="flex-1 h-12 bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:scale-[1.01] transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
                    disabled={!isStepValid(currentStep) || isSubmitting}
                  >
                    {isSubmitting ? "Creating Account..." : currentStep === 4 ? "Create Account" : "Next"}
                  </Button>
                </div>
              </form>
            )}

            {currentStep > 0 && (
              <div className="text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
