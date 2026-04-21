"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, GraduationCap, Loader2, Mail, MapPin, Save, Shield, User, X } from "lucide-react"
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
import {
  deriveGpaRangeFromExactGpa,
  ETHNICITY_OPTIONS,
  getExactGpaValidationMessage,
  formatGpaSummary,
  formatMajorsSummary,
  getStateLabel,
  isValidExactGpaInput,
  normalizeMajorsInput,
  normalizeStateValue,
  US_STATES,
} from "@/lib/profile-form-options"
import { supabase } from "@/lib/supabase"
import type { UserProfile } from "@/lib/types"

type ProfileFormData = UserProfile & {
  gpa_mode: "exact" | "range"
}

function toProfileFormData(profile: Partial<UserProfile>): ProfileFormData {
  const normalizedGpaRange = profile.gpa_range || deriveGpaRangeFromExactGpa(profile.gpa)
  const normalizedState = normalizeStateValue(profile.location_state)

  return {
    id: profile.id || "",
    full_name: profile.full_name || "",
    email: profile.email || "",
    phone: profile.phone || "",
    date_of_birth: profile.date_of_birth || "",
    gender: profile.gender || "",
    education_level: profile.education_level || "",
    graduation_year: profile.graduation_year || "",
    school: profile.school || "",
    gpa: typeof profile.gpa === "number" ? profile.gpa : undefined,
    gpa_range: normalizedGpaRange || "",
    sat_score: typeof profile.sat_score === "number" ? profile.sat_score : undefined,
    act_score: typeof profile.act_score === "number" ? profile.act_score : undefined,
    intended_major: profile.intended_major || "",
    intended_majors: normalizeMajorsInput(profile.intended_majors ?? profile.intended_major),
    academic_year: profile.academic_year || "",
    extracurriculars: profile.extracurriculars || "",
    ethnicity: profile.ethnicity || "",
    ethnicity_other: profile.ethnicity_other || "",
    citizenship: profile.citizenship || "",
    income_range: profile.income_range || "",
    first_generation: Boolean(profile.first_generation),
    location_state: normalizedState || "",
    disabilities: profile.disabilities || "",
    military: Boolean(profile.military),
    created_at: profile.created_at || "",
    updated_at: profile.updated_at || "",
    gpa_mode: typeof profile.gpa === "number" && isValidExactGpaInput(profile.gpa) ? "exact" : normalizedGpaRange ? "range" : "exact",
  }
}

function toggleMajorInProfile(current: string[], major: string) {
  return current.includes(major) ? current.filter((item) => item !== major) : [...current, major]
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileFormData | null>(null)
  const [editProfile, setEditProfile] = useState<ProfileFormData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push("/login")
      return
    }

    const fetchProfile = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          setError("Session expired. Please log in again.")
          return
        }

        const res = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })

        if (res.status === 404) {
          setIsLoading(false)
          return
        }

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          throw new Error(errorData.error || `Failed to fetch profile (${res.status})`)
        }

        const data = await res.json()
        const normalized = toProfileFormData(data)
        setProfile(normalized)
        setEditProfile(normalized)
      } catch (err) {
        console.error("Error fetching profile:", err)
        setError(err instanceof Error ? err.message : "Failed to load profile.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [authLoading, router, user])

  const handleFieldChange = <K extends keyof ProfileFormData>(field: K, value: ProfileFormData[K]) => {
    setEditProfile((prev) => {
      if (!prev) return prev

      const next = { ...prev, [field]: value }

      if (field === "ethnicity" && value !== "other") {
        next.ethnicity_other = ""
      }

      if (field === "gpa_mode") {
        if (value === "exact") {
          next.gpa_range = ""
        } else {
          next.gpa = undefined
        }
      }

      return next
    })
  }

  const handleSave = async () => {
    if (!editProfile) return
    const gpaValidationMessage = editProfile.gpa_mode === "exact" ? getExactGpaValidationMessage(editProfile.gpa) : ""

    if (gpaValidationMessage) {
      setError(gpaValidationMessage)
      return
    }

    if (editProfile.gpa_mode === "range" && !editProfile.gpa_range) {
      setError("Select a GPA range before saving.")
      return
    }

    if (!editProfile.intended_majors?.length) {
      setError("Select at least one intended major before saving.")
      return
    }

    if (editProfile.ethnicity === "other" && !(editProfile.ethnicity_other || "").trim()) {
      setError("Specify your race or ethnicity when selecting Other.")
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("Session expired. Please log in again.")
      }

      const payload = {
        ...editProfile,
        gpa_exact: editProfile.gpa_mode === "exact" ? String(editProfile.gpa ?? "") : "",
        gpa_range: editProfile.gpa_mode === "range" ? editProfile.gpa_range : "",
      }

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to update profile")
      }

      const updated = toProfileFormData(await res.json())
      setProfile(updated)
      setEditProfile(updated)
      setIsEditing(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error("Error saving profile:", err)
      setError(err instanceof Error ? err.message : "Failed to save changes")
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <>
        <Navbar />
        <div
          className="min-h-screen pt-24 flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #fefce8 100%)" }}
        >
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: "#213e99" }} />
            <p className="text-gray-500 text-lg">Loading your profile...</p>
          </div>
        </div>
      </>
    )
  }

  if (!profile || !editProfile) {
    return (
      <>
        <Navbar />
        <div
          className="min-h-screen pt-24 flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #fefce8 100%)" }}
        >
          <div className="text-center max-w-md mx-auto px-4">
            <div
              className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "linear-gradient(135deg, #213e99, #3355c2)" }}
            >
              <User className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: "#1e293b" }}>
              No Profile Found
            </h2>
            <p className="text-gray-500 mb-6">Create an account to build your profile and get matched with scholarships.</p>
            <Link
              href="/signup"
              className="inline-flex px-8 py-3 rounded-xl text-white font-semibold transition-all hover:shadow-lg"
              style={{ background: "linear-gradient(135deg, #213e99, #3355c2)" }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div
        className="min-h-screen pt-24 pb-16 px-4"
        style={{ background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #fefce8 100%)" }}
      >
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div
            className="absolute top-32 left-10 w-72 h-72 rounded-full blur-3xl animate-float"
            style={{ background: "rgba(33, 62, 153, 0.06)" }}
          />
          <div
            className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl animate-float-slow"
            style={{ background: "rgba(245, 197, 24, 0.06)" }}
          />
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-3">
              <button
                onClick={() => router.push("/swipe")}
                className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: "#213e99" }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: "linear-gradient(135deg, #213e99, #3355c2)" }}
                >
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold" style={{ color: "#1e293b" }}>
                    {profile.full_name || "Your Profile"}
                  </h1>
                  <p className="text-gray-500">{profile.email}</p>
                </div>
              </div>
            </div>

            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 rounded-xl font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #213e99, #3355c2)" }}
              >
                Edit Profile
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => { setEditProfile(profile); setIsEditing(false) }}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            )}
          </div>

          {success && (
            <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border" style={{ background: "#f0fdf4", borderColor: "#bbf7d0", color: "#166534" }}>
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">Profile updated successfully.</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border" style={{ background: "#fef2f2", borderColor: "#fecaca", color: "#991b1b" }}>
              <X className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div className="grid gap-6">
            <section className="rounded-3xl border bg-white/85 backdrop-blur-md p-6 space-y-5" style={{ borderColor: "#e2e8f0" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #213e99, #3355c2)" }}>
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: "#1e293b" }}>Personal Information</h2>
                  <p className="text-sm text-gray-500">Basic account and contact details.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={editProfile.full_name || ""} onChange={(e) => handleFieldChange("full_name", e.target.value)} disabled={!isEditing} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="flex items-center gap-3 rounded-xl border px-3 py-3 bg-slate-50" style={{ borderColor: "#e2e8f0" }}>
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700">{profile.email || "Not specified"}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={editProfile.phone || ""} onChange={(e) => handleFieldChange("phone", e.target.value)} disabled={!isEditing} />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={editProfile.date_of_birth || ""}
                    onChange={(e) => handleFieldChange("date_of_birth", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={editProfile.gender || ""} onValueChange={(value) => handleFieldChange("gender", value)} disabled={!isEditing}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="non-binary">Non-binary</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border bg-white/85 backdrop-blur-md p-6 space-y-5" style={{ borderColor: "#e2e8f0" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #213e99, #3355c2)" }}>
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: "#1e293b" }}>Academic & Educational</h2>
                  <p className="text-sm text-gray-500">Major interests, GPA profile, testing, and extracurricular context.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label>Education Level</Label>
                  <Select value={editProfile.education_level || ""} onValueChange={(value) => handleFieldChange("education_level", value)} disabled={!isEditing}>
                    <SelectTrigger><SelectValue placeholder="Select education level" /></SelectTrigger>
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
                    value={editProfile.academic_year || "unspecified"}
                    onValueChange={(value) => handleFieldChange("academic_year", value === "unspecified" ? "" : value)}
                    disabled={!isEditing}
                  >
                    <SelectTrigger><SelectValue placeholder="Select academic year" /></SelectTrigger>
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
                  <Label>School / University</Label>
                  <Input value={editProfile.school || ""} onChange={(e) => handleFieldChange("school", e.target.value)} disabled={!isEditing} />
                </div>
                <div className="space-y-2">
                  <Label>Expected Graduation Year</Label>
                  <Input
                    type="number"
                    min="2024"
                    max="2036"
                    value={editProfile.graduation_year || ""}
                    onChange={(e) => handleFieldChange("graduation_year", e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {isEditing ? (
                <GpaProfileField
                  mode={editProfile.gpa_mode}
                  exactValue={editProfile.gpa}
                  rangeValue={editProfile.gpa_range}
                  onModeChange={(value) => handleFieldChange("gpa_mode", value)}
                  onExactChange={(value) => handleFieldChange("gpa", value ? Number(value) : undefined)}
                  onRangeChange={(value) => handleFieldChange("gpa_range", value)}
                />
              ) : (
                <div className="rounded-2xl border border-slate-200 p-4 space-y-2 bg-slate-50/70">
                  <Label className="text-sm font-semibold">GPA Profile</Label>
                  <p className="text-sm text-slate-700">{formatGpaSummary(profile.gpa, profile.gpa_range)}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label>SAT Score</Label>
                  <Input
                    type="number"
                    min="400"
                    max="1600"
                    value={editProfile.sat_score ?? ""}
                    onChange={(e) => handleFieldChange("sat_score", e.target.value ? Number(e.target.value) : undefined)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label>ACT Score</Label>
                  <Input
                    type="number"
                    min="1"
                    max="36"
                    value={editProfile.act_score ?? ""}
                    onChange={(e) => handleFieldChange("act_score", e.target.value ? Number(e.target.value) : undefined)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Intended majors</Label>
                {isEditing ? (
                  <MajorSelector
                    selectedMajors={editProfile.intended_majors || []}
                    onToggleMajor={(major) => handleFieldChange("intended_majors", toggleMajorInProfile(editProfile.intended_majors || [], major))}
                    helperText="Select all that apply. Multiple majors are saved as a structured list for matching."
                  />
                ) : (
                  <p className="text-sm text-slate-700">{formatMajorsSummary(profile.intended_majors, profile.intended_major)}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Extracurriculars, leadership, work, or service</Label>
                <Textarea
                  value={editProfile.extracurriculars || ""}
                  onChange={(e) => handleFieldChange("extracurriculars", e.target.value)}
                  disabled={!isEditing}
                  className="min-h-32"
                />
              </div>
            </section>

            <section className="rounded-3xl border bg-white/85 backdrop-blur-md p-6 space-y-5" style={{ borderColor: "#e2e8f0" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #213e99, #3355c2)" }}>
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: "#1e293b" }}>Background & Demographics</h2>
                  <p className="text-sm text-gray-500">Residency and identity details used for eligibility matching.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label>Race / Ethnicity</Label>
                  <Select value={editProfile.ethnicity || ""} onValueChange={(value) => handleFieldChange("ethnicity", value)} disabled={!isEditing}>
                    <SelectTrigger><SelectValue placeholder="Select ethnicity" /></SelectTrigger>
                    <SelectContent>
                      {ETHNICITY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {((isEditing && editProfile.ethnicity === "other") || (!isEditing && profile.ethnicity === "other")) && (
                    <Input
                      value={editProfile.ethnicity_other || ""}
                      onChange={(e) => handleFieldChange("ethnicity_other", e.target.value)}
                      disabled={!isEditing}
                      placeholder="Please specify"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Citizenship Status</Label>
                  <Select value={editProfile.citizenship || ""} onValueChange={(value) => handleFieldChange("citizenship", value)} disabled={!isEditing}>
                    <SelectTrigger><SelectValue placeholder="Select citizenship" /></SelectTrigger>
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
                  <Select value={editProfile.income_range || ""} onValueChange={(value) => handleFieldChange("income_range", value)} disabled={!isEditing}>
                    <SelectTrigger><SelectValue placeholder="Select income range" /></SelectTrigger>
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
                  {isEditing ? (
                    <Select value={editProfile.location_state || ""} onValueChange={(value) => handleFieldChange("location_state", value)}>
                      <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                      <SelectContent>
                        {US_STATES.map((state) => (
                          <SelectItem key={state.value} value={state.value}>
                            {state.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-3 rounded-xl border px-3 py-3 bg-slate-50" style={{ borderColor: "#e2e8f0" }}>
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-700">{getStateLabel(profile.location_state)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Disabilities or accommodation context</Label>
                <Input value={editProfile.disabilities || ""} onChange={(e) => handleFieldChange("disabilities", e.target.value)} disabled={!isEditing} />
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/70 space-y-4">
                <label className="flex items-center gap-3">
                  <Checkbox
                    checked={Boolean(editProfile.first_generation)}
                    onCheckedChange={(checked) => handleFieldChange("first_generation", Boolean(checked))}
                    disabled={!isEditing}
                  />
                  <span className="text-sm font-medium">First-generation college student</span>
                </label>
                <label className="flex items-center gap-3">
                  <Checkbox checked={Boolean(editProfile.military)} onCheckedChange={(checked) => handleFieldChange("military", Boolean(checked))} disabled={!isEditing} />
                  <span className="text-sm font-medium">Veteran or military family member</span>
                </label>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}
