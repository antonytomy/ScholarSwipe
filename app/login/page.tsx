"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GraduationCap, Mail, Lock, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Redirect logged-in users to swipe
  useEffect(() => {
    if (!loading && user) {
      router.push('/swipe')
    }
  }, [user, loading, router])

  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const logAuthError = (label: string, authError: unknown) => {
    console.error(label, {
      error: authError,
      payload:
        authError && typeof authError === "object"
          ? {
              name: "name" in authError ? (authError as { name?: unknown }).name : undefined,
              message: "message" in authError ? (authError as { message?: unknown }).message : undefined,
              status: "status" in authError ? (authError as { status?: unknown }).status : undefined,
              code: "code" in authError ? (authError as { code?: unknown }).code : undefined,
              details: "details" in authError ? (authError as { details?: unknown }).details : undefined,
              hint: "hint" in authError ? (authError as { hint?: unknown }).hint : undefined,
            }
          : String(authError),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    try {
      // Use Supabase client directly to ensure auth state updates
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        logAuthError('Supabase login failed:', error)
        throw new Error(error.message)
      }

      try {
        const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
        if (aalError) {
          logAuthError('Supabase MFA/AAL check failed; continuing with password session:', aalError)
        } else if (aalData?.nextLevel === 'aal2' && aalData.currentLevel !== 'aal2') {
          console.warn('Supabase MFA is configured for this user, but the app is bypassing the 2FA challenge for now.', aalData)
        }
      } catch (mfaError) {
        logAuthError('Supabase MFA bypass check threw:', mfaError)
      }

      console.log('Supabase login succeeded:', {
        userId: data.user?.id ?? null,
        session: Boolean(data.session),
      })

      // Redirect to swipe page on success
      window.location.href = '/swipe'
      
    } catch (error) {
      console.error('Login error:', error)
      setError(error instanceof Error ? error.message : 'An error occurred during login')
    } finally {
      setIsSubmitting(false)
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

        <div className="w-full max-w-md">
          <div className="glass-card-advanced rounded-3xl p-8 space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary">
                <GraduationCap className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold">Welcome Back to Scholar Swipe</h1>
                <p className="text-muted-foreground mt-2">Sign in to continue finding scholarships that match your profile</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12"
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

              <div className="flex items-center text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-border" />
                  <span className="text-muted-foreground">Remember me</span>
                </label>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Signing In..." : "Sign In"}
              </Button>
            </form>


            {/* Sign up link */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link href="/signup" className="text-primary hover:underline font-medium">
                Create one now
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
