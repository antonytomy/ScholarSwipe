"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { GraduationCap, Mail, Lock, Eye, EyeOff, User, BookOpen, MapPin, Users } from "lucide-react"
import Link from "next/link"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    full_name: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    password: "",
    confirmPassword: "",
    
    // Step 2: Academic & Educational
    education_level: "",
    graduation_year: "",
    school: "",
    gpa: "",
    sat_score: "",
    act_score: "",
    intended_major: "",
    academic_year: "",
    
    // Step 3: Background & Demographics
    ethnicity: "",
    citizenship: "",
    income_range: "",
    first_generation: false,
    location_state: "",
    disabilities: "",
    military: false,
    
    // Step 4: Activities & Goals
    extracurriculars: "",
    honors_awards: "",
    target_scholarship_type: "",
    scholarship_amount_range: "",
    special_talents: "",
    parent_occupation: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    } else {
      // Handle final signup logic here
      setIsSubmitting(true)
      setSubmitError(null)
      
      try {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })
        
        const result = await response.json()
        
        if (!response.ok) {
          throw new Error(result.error || 'Signup failed')
        }
        
        // Show email confirmation notification instead of redirecting
        setShowEmailConfirmation(true)
        
      } catch (error) {
        console.error('Signup error:', error)
        setSubmitError(error instanceof Error ? error.message : 'An error occurred during signup')
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.full_name && formData.email && formData.password && formData.confirmPassword && 
               formData.password === formData.confirmPassword && formData.password.length >= 6
      case 2:
        return formData.education_level && formData.graduation_year && formData.gpa && formData.intended_major
      case 3:
        return formData.ethnicity && formData.citizenship && formData.income_range
      case 4:
        return true // Optional fields
      default:
        return false
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 flex items-center justify-center px-4 py-12">
        {/* Background decoration */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float-slow" />
        </div>

        <div className="w-full max-w-2xl">
          <div className="glass-card-advanced rounded-3xl p-8 space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary">
                <GraduationCap className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold">Create Account</h1>
                <p className="text-muted-foreground mt-2">Start finding scholarships that match your profile</p>
              </div>
              
              {/* Progress Steps */}
              <div className="flex items-center justify-center space-x-2 mt-6">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= step 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {step}
                    </div>
                    {step < 4 && (
                      <div className={`w-6 h-0.5 mx-1 ${
                        currentStep > step ? 'bg-primary' : 'bg-muted'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              
              <div className="text-sm text-muted-foreground">
                {currentStep === 1 && "Basic Information"}
                {currentStep === 2 && "Academic & Educational"}
                {currentStep === 3 && "Background & Demographics"}
                {currentStep === 4 && "Activities & Goals"}
              </div>
            </div>

            {/* Multi-Step Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-5">
              <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-sm font-medium">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                        id="full_name"
                    type="text"
                    placeholder="John Doe"
                        value={formData.full_name}
                        onChange={(e) => handleChange("full_name", e.target.value)}
                    className="pl-10 h-12 placeholder:text-muted-foreground/60 placeholder:italic"
                    required
                  />
                </div>
              </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="pl-10 h-12 placeholder:text-muted-foreground/60 placeholder:italic"
                    required
                  />
                </div>
              </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Phone Number
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="(555) 123-4567"
                          value={formData.phone}
                          onChange={(e) => handleChange("phone", e.target.value)}
                          className="pl-10 h-12 placeholder:text-muted-foreground/60 placeholder:italic"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="dob" className="text-sm font-medium">
                        Date of Birth
                      </Label>
                      <Input
                        id="dob"
                        type="date"
                        value={formData.dob}
                        onChange={(e) => handleChange("dob", e.target.value)}
                        className="h-12"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-sm font-medium">
                        Gender
                      </Label>
                      <Select value={formData.gender} onValueChange={(value) => handleChange("gender", value)}>
                        <SelectTrigger className="h-12">
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    className="pl-10 pr-10 h-12 placeholder:text-muted-foreground/60 placeholder:italic"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                    className="pl-10 pr-10 h-12 placeholder:text-muted-foreground/60 placeholder:italic"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
                  </div>
                </div>
              )}

              {/* Step 2: Academic & Educational */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="education_level" className="text-sm font-medium">
                        Current Education Level
                      </Label>
                      <Select value={formData.education_level} onValueChange={(value) => handleChange("education_level", value)}>
                        <SelectTrigger className="h-12">
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
                      <Label htmlFor="academic_year" className="text-sm font-medium">
                        Academic Year
                      </Label>
                      <Select value={formData.academic_year} onValueChange={(value) => handleChange("academic_year", value)}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select academic year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="freshman">Freshman</SelectItem>
                          <SelectItem value="sophomore">Sophomore</SelectItem>
                          <SelectItem value="junior">Junior</SelectItem>
                          <SelectItem value="senior">Senior</SelectItem>
                          <SelectItem value="graduate_student">Graduate Student</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="school" className="text-sm font-medium">
                      Current School/University
                    </Label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                        id="school"
                        type="text"
                        placeholder="University of California, Berkeley"
                        value={formData.school}
                        onChange={(e) => handleChange("school", e.target.value)}
                        className="pl-10 h-12 placeholder:text-muted-foreground/60 placeholder:italic"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="gpa" className="text-sm font-medium">
                        GPA (4.0 scale)
                      </Label>
                      <div className="relative">
                        <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                          id="gpa"
                          type="number"
                          step="0.01"
                          min="0"
                          max="4"
                          placeholder="3.50"
                          value={formData.gpa}
                          onChange={(e) => handleChange("gpa", e.target.value)}
                          className="pl-10 h-12 placeholder:text-muted-foreground/60 placeholder:italic"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="graduation_year" className="text-sm font-medium">
                        Expected Graduation Year
                      </Label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                          id="graduation_year"
                          type="number"
                          min="2024"
                          max="2030"
                          placeholder="2026"
                          value={formData.graduation_year}
                          onChange={(e) => handleChange("graduation_year", e.target.value)}
                          className="pl-10 h-12 placeholder:text-muted-foreground/60 placeholder:italic"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="sat_score" className="text-sm font-medium">
                        SAT Score (Optional)
                      </Label>
                        <Input
                        id="sat_score"
                        type="number"
                        min="400"
                        max="1600"
                        placeholder="1200"
                        value={formData.sat_score}
                        onChange={(e) => handleChange("sat_score", e.target.value)}
                        className="h-12 placeholder:text-muted-foreground/60 placeholder:italic"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="act_score" className="text-sm font-medium">
                        ACT Score (Optional)
                      </Label>
                      <Input
                        id="act_score"
                        type="number"
                        min="1"
                        max="36"
                        placeholder="28"
                        value={formData.act_score}
                        onChange={(e) => handleChange("act_score", e.target.value)}
                        className="h-12 placeholder:text-muted-foreground/60 placeholder:italic"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="intended_major" className="text-sm font-medium">
                      Intended Major/Field of Study
                    </Label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="intended_major"
                        type="text"
                        placeholder="Computer Science, Business, Medicine, etc."
                        value={formData.intended_major}
                        onChange={(e) => handleChange("intended_major", e.target.value)}
                        className="pl-10 h-12 placeholder:text-muted-foreground/60 placeholder:italic"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Background & Demographics */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="ethnicity" className="text-sm font-medium">
                        Race/Ethnicity
                      </Label>
                      <Select value={formData.ethnicity} onValueChange={(value) => handleChange("ethnicity", value)}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select ethnicity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asian">Asian</SelectItem>
                          <SelectItem value="black">Black/African American</SelectItem>
                          <SelectItem value="hispanic">Hispanic/Latino</SelectItem>
                          <SelectItem value="native_american">Native American</SelectItem>
                          <SelectItem value="pacific_islander">Pacific Islander</SelectItem>
                          <SelectItem value="white">White</SelectItem>
                          <SelectItem value="mixed">Mixed Race</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="citizenship" className="text-sm font-medium">
                        Citizenship Status
                      </Label>
                      <Select value={formData.citizenship} onValueChange={(value) => handleChange("citizenship", value)}>
                        <SelectTrigger className="h-12">
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
                      <Label htmlFor="income_range" className="text-sm font-medium">
                        Family Income Range
                      </Label>
                      <Select value={formData.income_range} onValueChange={(value) => handleChange("income_range", value)}>
                        <SelectTrigger className="h-12">
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
                      <Label htmlFor="location_state" className="text-sm font-medium">
                        State
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="location_state"
                          type="text"
                          placeholder="California, Texas, New York, etc."
                          value={formData.location_state}
                          onChange={(e) => handleChange("location_state", e.target.value)}
                          className="pl-10 h-12 placeholder:text-muted-foreground/60 placeholder:italic"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="disabilities" className="text-sm font-medium">
                      Disabilities (Optional)
                    </Label>
                    <Input
                      id="disabilities"
                      type="text"
                      placeholder="Describe any disabilities or accommodations needed"
                      value={formData.disabilities}
                      onChange={(e) => handleChange("disabilities", e.target.value)}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="first_generation" 
                        checked={formData.first_generation}
                        onCheckedChange={(checked) => handleChange("first_generation", checked as boolean)}
                      />
                      <Label htmlFor="first_generation" className="text-sm font-medium cursor-pointer">
                        I am a first-generation college student
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="military" 
                        checked={formData.military}
                        onCheckedChange={(checked) => handleChange("military", checked as boolean)}
                      />
                      <Label htmlFor="military" className="text-sm font-medium cursor-pointer">
                        I am a veteran or military family member
                      </Label>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Activities & Goals */}
              {currentStep === 4 && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="extracurriculars" className="text-sm font-medium">
                      Extracurricular Activities
                    </Label>
                    <textarea
                      id="extracurriculars"
                      placeholder="List your extracurricular activities, clubs, sports, volunteer work, etc."
                      value={formData.extracurriculars}
                      onChange={(e) => handleChange("extracurriculars", e.target.value)}
                      className="w-full h-24 p-3 border border-border rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="honors_awards" className="text-sm font-medium">
                      Honors & Awards
                    </Label>
                    <textarea
                      id="honors_awards"
                      placeholder="List any academic honors, awards, recognitions, etc."
                      value={formData.honors_awards}
                      onChange={(e) => handleChange("honors_awards", e.target.value)}
                      className="w-full h-24 p-3 border border-border rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="target_scholarship_type" className="text-sm font-medium">
                        Target Scholarship Type
                      </Label>
                      <Select value={formData.target_scholarship_type} onValueChange={(value) => handleChange("target_scholarship_type", value)}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select scholarship type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="merit_based">Merit-based</SelectItem>
                          <SelectItem value="need_based">Need-based</SelectItem>
                          <SelectItem value="minority">Minority-specific</SelectItem>
                          <SelectItem value="major_specific">Major-specific</SelectItem>
                          <SelectItem value="leadership">Leadership</SelectItem>
                          <SelectItem value="community_service">Community Service</SelectItem>
                          <SelectItem value="athletic">Athletic</SelectItem>
                          <SelectItem value="all">All Types</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="scholarship_amount_range" className="text-sm font-medium">
                        Scholarship Amount Range
                      </Label>
                      <Select value={formData.scholarship_amount_range} onValueChange={(value) => handleChange("scholarship_amount_range", value)}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select amount range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="under_1k">Under $1,000</SelectItem>
                          <SelectItem value="1k_5k">$1,000 - $5,000</SelectItem>
                          <SelectItem value="5k_10k">$5,000 - $10,000</SelectItem>
                          <SelectItem value="10k_25k">$10,000 - $25,000</SelectItem>
                          <SelectItem value="over_25k">Over $25,000</SelectItem>
                          <SelectItem value="any">Any Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="special_talents" className="text-sm font-medium">
                      Special Talents & Passions
                    </Label>
                    <textarea
                      id="special_talents"
                      placeholder="Describe your special talents, passions, or unique qualities"
                      value={formData.special_talents}
                      onChange={(e) => handleChange("special_talents", e.target.value)}
                      className="w-full h-24 p-3 border border-border rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parent_occupation" className="text-sm font-medium">
                      Parent/Family Occupation
                    </Label>
                    <Input
                      id="parent_occupation"
                      type="text"
                      placeholder="e.g., Teacher, Engineer, Small Business Owner, etc."
                      value={formData.parent_occupation}
                      onChange={(e) => handleChange("parent_occupation", e.target.value)}
                      className="h-12"
                    />
                  </div>
                </div>
              )}

              {/* Terms and Privacy Policy */}
              {currentStep === 1 && (
              <div className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="rounded border-border mt-0.5" required />
                <span className="text-muted-foreground">
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </span>
              </div>
              )}

              {/* Error Display */}
              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {submitError}
                </div>
              )}

              {/* Email Confirmation Notification */}
              {showEmailConfirmation && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Mail className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-green-800">Check Your Email!</h3>
                      <p className="text-sm text-green-700">
                        We've sent a confirmation link to <strong>{formData.email}</strong>. 
                        Please click the link in your email to verify your account and start your scholarship journey!
                      </p>
                      <div className="flex gap-3 mt-3">
                        <Button
                          onClick={() => window.location.href = '/login'}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Go to Login
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowEmailConfirmation(false)}
                          className="border-green-300 text-green-700 hover:bg-green-50"
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    className="flex-1 h-12"
                    disabled={isSubmitting}
                  >
                    Previous
                  </Button>
                )}
              <Button
                type="submit"
                  className="flex-1 h-12 bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30"
                  disabled={!isStepValid(currentStep) || isSubmitting}
              >
                  {isSubmitting ? "Creating Account..." : currentStep === 4 ? "Create Account" : "Next"}
              </Button>
              </div>
            </form>

            {/* Login link */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
