"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import {
  Rocket, Bookmark, CheckCircle2, Settings, Moon, Sun,
  UserCircle, ArrowLeft, Trash2, ExternalLink, Share2,
  ChevronDown, ChevronUp, LayoutDashboard, Clock
} from "lucide-react"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface ScholarshipRow {
  id: string
  source_url?: string
  title: string
  meta_description?: string
  overview?: string
  eligibility_text?: string
  application_text?: string
  eligibility_fields?: string
  application_materials?: string
  categories?: string
  grade_level_summary?: string
  amount?: string
  citizenship_status?: string
  academic_interest?: string
  other_background_interest?: string
  state_residency?: string
  minimum_gpa?: number
  // AI-enriched fields added by the API
  winProbability?: number
  matchReasons?: string[]
  tags?: string[]
}

/* ------------------------------------------------------------------ */
/*  Gradient palette for cards                                         */
/* ------------------------------------------------------------------ */
const GRADIENTS = [
  "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
  "linear-gradient(135deg, #312e81 0%, #4338ca 100%)",
  "linear-gradient(135deg, #064e3b 0%, #10b981 100%)",
  "linear-gradient(135deg, #701a75 0%, #d946ef 100%)",
  "linear-gradient(135deg, #7c2d12 0%, #f97316 100%)",
  "linear-gradient(135deg, #0c4a6e 0%, #0ea5e9 100%)",
  "linear-gradient(135deg, #4a1d96 0%, #8b5cf6 100%)",
  "linear-gradient(135deg, #831843 0%, #ec4899 100%)",
]

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function SwipeInterface() {
  const { user, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const SCHOLARSHIP_FETCH_TIMEOUT_MS = 60000

  const [scholarships, setScholarships] = useState<ScholarshipRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null) // For save animation
  const isHydrated = useRef(false)
  const lastFetchedUserId = useRef<string | null>(null)
  const lastProfileRefreshToken = useRef<string | null>(null)
  const fetchScholarshipsRef = useRef<() => void>(() => {})
  const seenIdsRef = useRef<Set<string>>(new Set())
  const seenFlushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())

  const [loadedSavedScholarships, setLoadedSavedScholarships] = useState<ScholarshipRow[]>([])
  const [loadedAppliedScholarships, setLoadedAppliedScholarships] = useState<ScholarshipRow[]>([])
  const [loadedCompletedScholarships, setLoadedCompletedScholarships] = useState<ScholarshipRow[]>([])

  const scholarshipsRef = useRef<ScholarshipRow[]>([])

  useEffect(() => {
    scholarshipsRef.current = scholarships
  }, [scholarships])

  // Hydrate from localStorage after mount to prevent SSR mismatch
  useEffect(() => {
    try {
      lastProfileRefreshToken.current = localStorage.getItem('scholarswipe-profile-updated-at')
      const sCache = sessionStorage.getItem('scholarships_session_cache')
      if (sCache) {
        const parsed = JSON.parse(sCache)
        if (parsed.length > 0) {
          setScholarships(parsed)
          setIsLoading(false)
          isHydrated.current = true
        }
      }

      const sIdsCache = localStorage.getItem('saved_ids_cache')
      if (sIdsCache) setSavedIds(new Set(JSON.parse(sIdsCache)))

      const aIdsCache = localStorage.getItem('applied_ids_cache')
      if (aIdsCache) setAppliedIds(new Set(JSON.parse(aIdsCache)))

      const sLoadCache = localStorage.getItem('saved_scholarships_cache')
      if (sLoadCache) setLoadedSavedScholarships(JSON.parse(sLoadCache))

      const aLoadCache = localStorage.getItem('applied_scholarships_cache')
      if (aLoadCache) setLoadedAppliedScholarships(JSON.parse(aLoadCache))

      const cIdsCache = localStorage.getItem('completed_ids_cache')
      if (cIdsCache) setCompletedIds(new Set(JSON.parse(cIdsCache)))
      const cLoadCache = localStorage.getItem('completed_scholarships_cache')
      if (cLoadCache) setLoadedCompletedScholarships(JSON.parse(cLoadCache))
    } catch (e) {
      console.error('Error hydrating cache', e)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return

    const handleProfileRefresh = () => {
      const nextToken = localStorage.getItem('scholarswipe-profile-updated-at')
      if (!nextToken || nextToken === lastProfileRefreshToken.current) return

      console.log('Profile update detected — clearing scholarship cache and refreshing matches')
      lastProfileRefreshToken.current = nextToken
      sessionStorage.removeItem('scholarships_session_cache')
      isHydrated.current = false
      lastFetchedUserId.current = null
      setScholarships([])
      setCurrentScholarshipIndex(0)
      fetchScholarshipsRef.current()
    }

    handleProfileRefresh()
    window.addEventListener('storage', handleProfileRefresh)
    window.addEventListener('focus', handleProfileRefresh)

    return () => {
      window.removeEventListener('storage', handleProfileRefresh)
      window.removeEventListener('focus', handleProfileRefresh)
    }
  }, [authLoading])

  // UI state
  const [activeTab, setActiveTab] = useState<"discover" | "saved" | "applied" | "completed">("discover")
  const [darkMode, setDarkMode] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState("")
  const [showToast, setShowToast] = useState(false)
  const [currentScholarshipIndex, setCurrentScholarshipIndex] = useState(0)
  const [slideDirection, setSlideDirection] = useState<"up" | "down" | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)
  const hasInitialRender = useRef(true)
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    containerRef.current?.focus()
  }, [])

  /* ---------- read ?tab= from URL -------------------------------- */
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === "saved" || tab === "applied" || tab === "completed") {
      setActiveTab(tab as any)
    }
  }, [searchParams])

  /* ---------- load saved/applied IDs from Supabase --------------- */
  useEffect(() => {
    if (authLoading || !user || isHydrated.current) return
    const loadUserSwipes = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        const headers = { 'Authorization': `Bearer ${session.access_token}` }

        const [savedRes, appliedRes] = await Promise.all([
          fetch('/api/swipes?action=saved', { headers }),
          fetch('/api/swipes?action=liked', { headers }),
        ])

        if (savedRes.ok) {
          const savedData = await savedRes.json()
          const ids = savedData.map((s: any) => s.scholarship_id)
          setSavedIds(new Set(ids))
          const loadedS = savedData.map((s: any) => s.scholarship ? { ...s.scholarship, id: s.scholarship.id || s.scholarship.UUID } : null).filter(Boolean)
          setLoadedSavedScholarships(loadedS)

          if (typeof window !== 'undefined') {
            localStorage.setItem('saved_ids_cache', JSON.stringify(ids))
            localStorage.setItem('saved_scholarships_cache', JSON.stringify(loadedS))
          }
        }
        if (appliedRes.ok) {
          const appliedData = await appliedRes.json()
          const ids = appliedData.map((s: any) => s.scholarship_id)
          setAppliedIds(new Set(ids))
          const loadedA = appliedData.map((s: any) => s.scholarship ? { ...s.scholarship, id: s.scholarship.id || s.scholarship.UUID } : null).filter(Boolean)
          setLoadedAppliedScholarships(loadedA)

          if (typeof window !== 'undefined') {
            localStorage.setItem('applied_ids_cache', JSON.stringify(ids))
            localStorage.setItem('applied_scholarships_cache', JSON.stringify(loadedA))
          }
        }
      } catch (err) {
        console.error('Failed to load user swipes:', err)
      }
    }
    loadUserSwipes()
  }, [authLoading, user])

  /* ---------- fetch scholarships ---------------------------------- */
  const fetchScholarships = useCallback(async () => {
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), SCHOLARSHIP_FETCH_TIMEOUT_MS)

    try {
      setIsLoading(true)
      setLoadError(null)
      const url = user
        ? `/api/scholarships?limit=50&userId=${user.id}`
        : `/api/scholarships?limit=50`
      console.log('Fetching scholarships from:', url)

      // Always append Authorization token so backend can query Supabase through RLS
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      if (session) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const res = await fetch(url, { headers, signal: controller.signal })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('Scholarship API error:', res.status, errorData)
        throw new Error(errorData.error || `Failed to fetch scholarships (${res.status})`)
      }
      const data = await res.json()
      console.log('Scholarships received:', data.scholarships?.length || 0)
      setScholarships(data.scholarships || [])
      isHydrated.current = true
      lastFetchedUserId.current = user?.id ?? '__guest__'

      if (typeof window !== 'undefined' && data.scholarships && data.scholarships.length > 0) {
        sessionStorage.setItem('scholarships_session_cache', JSON.stringify(data.scholarships))
      }

      // ─── Background AI Scoring ───
      // If the API returned un-scored scholarship IDs, trigger AI refinement
      if (false) {
        console.log(`🤖 Triggering background AI scoring for ${data.meta.uncachedIds.length} scholarships...`)
        fetch('/api/ai-matching', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            userId: user.id,
            scholarshipIds: data.meta.uncachedIds,
          }),
        })
          .then(res => res.ok ? res.json() : null)
          .then(aiData => {
            if (aiData?.matches) {
              console.log(`🤖 AI scoring complete for ${aiData.matches.length} scholarships`)
              // Merge AI scores into existing scholarships
              setScholarships(prev => {
                const aiMap = new Map<string, any>(
                  aiData.matches.map((m: any) => [m.scholarship_id, m])
                )
                return prev.map(s => {
                  const aiResult = aiMap.get(s.id)
                  if (aiResult) {
                    return {
                      ...s,
                      winProbability: aiResult.win_probability || aiResult.match_score,
                      matchReasons: aiResult.match_reasons || s.matchReasons,
                      aiProcessed: true,
                    }
                  }
                  return s
                }).sort((a, b) => (b.winProbability || 0) - (a.winProbability || 0))
              })
            }
          })
          .catch(err => console.error('Background AI scoring failed:', err))
      }
    } catch (err) {
      console.error("Fetch error:", err)
      if (err instanceof Error && err.name === 'AbortError') {
        if (scholarshipsRef.current.length === 0) {
          setLoadError('Loading scholarships timed out. Please try again.')
        } else {
          console.warn('Scholarship fetch timed out, keeping existing results on screen.')
        }
      } else if (err instanceof Error) {
        setScholarships([])
        setLoadError(err.message)
      } else {
        setScholarships([])
        setLoadError('Unable to load scholarships right now.')
      }
    } finally {
      window.clearTimeout(timeoutId)
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchScholarshipsRef.current = fetchScholarships
  }, [fetchScholarships])

  useEffect(() => {
    if (authLoading) return

    const currentUserId = user?.id ?? '__guest__'
    if (lastFetchedUserId.current && lastFetchedUserId.current !== currentUserId) {
      console.log('Auth state changed — clearing stale cache, re-fetching for new user state')
      sessionStorage.removeItem('scholarships_session_cache')
      isHydrated.current = false
    }

    if (!isHydrated.current) {
      fetchScholarships()
    }
  }, [authLoading, user?.id, fetchScholarships])

  /* ---------- dark mode ------------------------------------------- */
  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode)
  }, [darkMode])

  useEffect(() => {
    if (scholarships.length === 0) {
      setCurrentScholarshipIndex(0)
      return
    }

    setCurrentScholarshipIndex((prev) => Math.min(prev, scholarships.length - 1))
  }, [scholarships.length])


  /* ---------- helpers --------------------------------------------- */
  const toast = (msg: string) => {
    setToastMsg(msg)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  const persistSwipe = async (scholarshipId: string, action: string) => {
    // Always try to save to DB, but don't silently fail
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.warn('⚠️ No session — save stored locally only. Will sync when user logs in.')
        return
      }
      const res = await fetch('/api/swipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ scholarship_id: scholarshipId, action }),
      })
      if (!res.ok) {
        console.error('Save API returned error:', res.status)
      } else {
        console.log(`✅ Saved swipe: ${scholarshipId} → ${action}`)
      }
    } catch (err) {
      console.error('Failed to persist swipe to DB:', err)
    }
  }

  const toggleSave = (id: string) => {
    const wasSaved = savedIds.has(id)
    const scholarship = scholarships.find(s => s.id === id)

    // Update saved IDs
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        toast("Removed from saved")
        persistSwipe(id, 'passed')
      } else {
        next.add(id)
        toast("Saved! ✨")
        persistSwipe(id, 'saved')
      }
      if (typeof window !== 'undefined') localStorage.setItem('saved_ids_cache', JSON.stringify([...next]))
      return next
    })

    // Save/remove full scholarship data to localStorage for offline access
    if (!wasSaved && scholarship) {
      setLoadedSavedScholarships(prev => {
        const updated = [...prev.filter(s => s.id !== id), scholarship]
        if (typeof window !== 'undefined') localStorage.setItem('saved_scholarships_cache', JSON.stringify(updated))
        return updated
      })
      // Swoosh animation — visual only, card stays in feed
      setSavingId(id)
      setTimeout(() => setSavingId(null), 600)
    } else {
      // Removing from saved — remove from cache
      setLoadedSavedScholarships(prev => {
        const updated = prev.filter(s => s.id !== id)
        if (typeof window !== 'undefined') localStorage.setItem('saved_scholarships_cache', JSON.stringify(updated))
        return updated
      })
    }
  }

  const markApplied = (id: string, link?: string) => {
    setAppliedIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      if (typeof window !== 'undefined') localStorage.setItem('applied_ids_cache', JSON.stringify([...next]))
      return next
    })
    persistSwipe(id, 'liked')
    if (link) window.open(link, "_blank")
    toast("Marked as applied!")
  }

  const removeApplied = (id: string) => {
    setAppliedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      if (typeof window !== 'undefined') localStorage.setItem('applied_ids_cache', JSON.stringify([...next]))
      return next
    })
    persistSwipe(id, 'passed')
  }

  const markCompleted = (id: string, s: ScholarshipRow) => {
    setCompletedIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      if (typeof window !== 'undefined') localStorage.setItem('completed_ids_cache', JSON.stringify([...next]))
      return next
    })
    setLoadedCompletedScholarships((prev) => {
      if (!prev.find(p => p.id === id)) {
        const updated = [...prev, s]
        if (typeof window !== 'undefined') localStorage.setItem('completed_scholarships_cache', JSON.stringify(updated))
        return updated
      }
      return prev
    })
    
    // Remove from "In Progress" tab without generating exactly a "passed" swipe API call
    setAppliedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      if (typeof window !== 'undefined') localStorage.setItem('applied_ids_cache', JSON.stringify([...next]))
      return next
    })

    setActiveTab("completed")
    toast("Marked as Applied!")
  }

  const removeCompleted = (id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      if (typeof window !== 'undefined') localStorage.setItem('completed_ids_cache', JSON.stringify([...next]))
      return next
    })
    setLoadedCompletedScholarships((prev) => {
      const updated = prev.filter(p => p.id !== id)
      if (typeof window !== 'undefined') localStorage.setItem('completed_scholarships_cache', JSON.stringify(updated))
      return updated
    })
  }

  const shareScholarship = (s: any) => {
    const sourceUrl = s.source_url || ''
    const shareText = sourceUrl
      ? `Apply for ${s.title} here: ${sourceUrl} via ScholarSwipe: https://scholarswipe.com/`
      : `Apply for ${s.title} via ScholarSwipe: https://scholarswipe.com/`
    navigator.clipboard.writeText(shareText)
    toast("Link copied to clipboard!")
  }

  const openScholarship = (link?: string) => {
    if (!link) {
      toast("No scholarship link available yet")
      return
    }
    window.open(link, "_blank", "noopener,noreferrer")
  }

  const parseTags = (s: ScholarshipRow): string[] => {
    const isValid = (v: any) => v && v !== 'null' && v !== 'NULL' && v !== 'undefined' && String(v).trim() !== ''
    if (s.tags && s.tags.length > 0) return s.tags.filter(isValid)
    const t: string[] = []
    if (isValid(s.grade_level_summary)) t.push(s.grade_level_summary!)
    if (isValid(s.academic_interest)) t.push(s.academic_interest!)
    if (isValid(s.citizenship_status)) t.push(s.citizenship_status!)
    try {
      if (s.categories) {
        const parsed = JSON.parse(s.categories)
        if (Array.isArray(parsed)) t.push(...parsed.filter(isValid).slice(0, 3))
      }
    } catch { /* ignore */ }
    return t.slice(0, 4)
  }

  const matchScore = (s: ScholarshipRow): number => {
    if (s.winProbability) return Math.round(s.winProbability * 100)
    return 50 // fallback
  }

  const goToNextScholarship = useCallback(() => {
    if (isAnimating) return
    if (!hasScrolled) setHasScrolled(true)
    hasInitialRender.current = false
    setCurrentScholarshipIndex((prev) => {
      if (prev >= scholarships.length - 1) return prev
      setSlideDirection("up")
      setIsAnimating(true)
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current)
      animationTimeoutRef.current = setTimeout(() => {
        setIsAnimating(false)
      }, 500)
      return prev + 1
    })
  }, [scholarships.length, isAnimating, hasScrolled])

  const goToPreviousScholarship = useCallback(() => {
    if (isAnimating) return
    if (!hasScrolled) setHasScrolled(true)
    hasInitialRender.current = false
    setCurrentScholarshipIndex((prev) => {
      if (prev <= 0) return prev
      setSlideDirection("down")
      setIsAnimating(true)
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current)
      animationTimeoutRef.current = setTimeout(() => {
        setIsAnimating(false)
      }, 500)
      return prev - 1
    })
  }, [isAnimating, hasScrolled])

  useEffect(() => {
    if (activeTab !== "discover") return

    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowDown") {
        e.preventDefault()
        goToNextScholarship()
      } else if (e.code === "ArrowUp") {
        e.preventDefault()
        goToPreviousScholarship()
      }
    }

    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [activeTab, goToNextScholarship, goToPreviousScholarship])

  /* ---------- overlay content ------------------------------------- */
  const allKnownScholarships = [...scholarships, ...loadedSavedScholarships, ...loadedAppliedScholarships, ...loadedCompletedScholarships].filter((s, index, self) =>
    index === self.findIndex((t) => t.id === s.id)
  )

  const savedList = allKnownScholarships.filter((s) => savedIds.has(s.id))
  const appliedList = allKnownScholarships.filter((s) => appliedIds.has(s.id))
  const completedList = allKnownScholarships.filter((s) => completedIds.has(s.id))
  const currentScholarship = scholarships[currentScholarshipIndex] ?? null
  const s = currentScholarship
  const currentTags = s ? parseTags(s) : []
  const currentScore = s ? matchScore(s) : 0
  const currentIsSaved = s ? savedIds.has(s.id) : false
  const currentIsApplied = s ? appliedIds.has(s.id) : false
  const currentIsCompleted = s ? completedIds.has(s.id) : false
  const currentGrad = GRADIENTS[currentScholarshipIndex % GRADIENTS.length]
  const rawDescription = s?.meta_description || s?.overview || "N/A"
  const isDescTruncated = rawDescription.length > 400
  const currentDescription = isDescTruncated ? rawDescription.slice(0, 400) : rawDescription
  const currentEligibility = (s?.eligibility_text || "Eligibility details are listed on the scholarship page.").slice(0, 500)
  const currentApplication = (s?.application_text || "Visit the scholarship page for application instructions.").slice(0, 500)

  useEffect(() => {
    if (activeTab !== "discover" || !currentScholarship?.id) return
    if (seenIdsRef.current.has(currentScholarship.id)) return

    seenIdsRef.current.add(currentScholarship.id)
    if (seenFlushTimer.current) clearTimeout(seenFlushTimer.current)
    seenFlushTimer.current = setTimeout(async () => {
      const ids = Array.from(seenIdsRef.current)
      if (ids.length === 0) return
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        await fetch('/api/scholarships/seen', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ scholarship_ids: ids }),
        })
      } catch (err) {
        console.error('Failed to flush seen IDs:', err)
      }
    }, 400)
  }, [activeTab, currentScholarship?.id])

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? "dark-mode" : ""}`}
      ref={containerRef}
      tabIndex={0}
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
        background: "var(--light-bg, #0b0f1a)",
        color: "var(--text, #e2e8f0)",
        outline: "none",
      }}
    >
      {/* ── CSS Variables ── */}
      <style dangerouslySetInnerHTML={{
        __html: `
        :root {
          --navy: #1e293b;
          --light-bg: #f8fafc;
          --card-bg: #ffffff;
          --text: #1e293b;
          --muted: #64748b;
          --border: rgba(0,0,0,0.08);
          --accent: #6366f1;
          --surface-2: #f1f5f9;
          --surface-3: rgba(255, 255, 255, 0.9);
          --button-surface: rgba(0,0,0,0.04);
          --button-border: rgba(0,0,0,0.1);
          --card-shadow: 0 24px 60px rgba(0, 0, 0, 0.08);
          --warm-surface: rgba(251, 191, 36, 0.08);
          --warm-border: rgba(251, 191, 36, 0.3);
          --warm-text: #b45309;
          --success-surface: rgba(16, 185, 129, 0.1);
          --success-text: #059669;
          --glass: rgba(255, 255, 255, 0.75);
          --glass-border: rgba(0,0,0,0.08);
        }
        body.dark-mode {
          --light-bg: #030712;
          --card-bg: #0f172a;
          --text: #f1f5f9;
          --muted: #94a3b8;
          --border: rgba(255,255,255,0.05);
          --accent: #818cf8;
          --surface-2: #1e293b;
          --surface-3: rgba(15, 23, 42, 0.8);
          --button-surface: rgba(255,255,255,0.06);
          --button-border: rgba(255,255,255,0.1);
          --card-shadow: 0 28px 70px rgba(0, 0, 0, 0.5);
          --warm-surface: rgba(251, 191, 36, 0.06);
          --warm-border: rgba(251, 191, 36, 0.2);
          --warm-text: #fcd34d;
          --success-surface: rgba(16, 185, 129, 0.08);
          --success-text: #6ee7b7;
          --glass: rgba(15, 23, 42, 0.7);
          --glass-border: rgba(255,255,255,0.06);
        }
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes betaShine { 0% { background-position: 0% 50% } 50% { background-position: 100% 50% } 100% { background-position: 0% 50% } }
        @keyframes slideInUp {
          0% { transform: translateY(30%); opacity: 0.3; }
          60% { opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideInDown {
          0% { transform: translateY(-30%); opacity: 0.3; }
          60% { opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeInScale {
          from { transform: scale(0.98); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes bounceHint {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }
      `}} />

      {/* ── Sidebar ── */}
      <aside
        style={{
          width: 260, background: "var(--card-bg)", borderRight: "1px solid var(--border)",
          display: "flex", flexDirection: "column", flexShrink: 0,
        }}
      >
        {/* Brand */}
        <div style={{ padding: "32px 24px 24px", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          <Link href="/"><Image src="/logo.png" alt="ScholarSwipe" width={200} height={40} style={{ objectFit: "contain" }} priority /></Link>
          <div style={{
            alignSelf: "center",
            background: "linear-gradient(90deg, #F5C518, #1B3764, #F5C518, #1B3764)",
            backgroundSize: "300% 300%",
            animation: "betaShine 4s linear infinite",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 3,
          }}>
            Beta Release
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: "24px 16px", flex: 1 }}>
          {([
            { key: "discover" as const, icon: <Rocket size={18} />, label: "Discover", count: 0 },
            { key: "saved" as const, icon: <Bookmark size={18} />, label: "Saved", count: savedIds.size },
            { key: "applied" as const, icon: <LayoutDashboard size={18} />, label: "In Progress", count: appliedIds.size },
            { key: "completed" as const, icon: <CheckCircle2 size={18} />, label: "Applied", count: completedIds.size },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "12px 20px", marginBottom: 8, borderRadius: 10,
                background: activeTab === tab.key ? "var(--accent)" : "transparent",
                color: activeTab === tab.key ? "white" : "var(--text)",
                border: "none", fontSize: 15, cursor: "pointer", transition: "all 0.2s",
                position: "relative",
              }}
            >
              {tab.icon}
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  marginLeft: "auto",
                  background: (tab.key === "applied" || tab.key === "completed") ? "#10b981" : "#fbbf24",
                  color: (tab.key === "applied" || tab.key === "completed") ? "white" : "#1e293b",
                  fontSize: 12, padding: "2px 8px", borderRadius: 12, fontWeight: 600,
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Settings */}
        <div style={{ padding: 16, borderTop: "1px solid var(--border)", position: "relative" }}>
          <button
            onClick={() => setSettingsOpen((o) => !o)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12,
              padding: "12px 20px", borderRadius: 10, background: "none",
              border: "none", color: "var(--text)", fontSize: 15, cursor: "pointer",
            }}
          >
            <Settings size={18} /> Settings
          </button>
          {settingsOpen && (
            <div style={{
              position: "absolute", bottom: "100%", left: 16, right: 16,
              background: "var(--card-bg)", border: "1px solid var(--border)",
              borderRadius: 10, boxShadow: "0 10px 40px rgba(0,0,0,0.3)", padding: 8,
            }}>
              <button
                onClick={() => { setDarkMode((d) => !d); setSettingsOpen(false) }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 16px", borderRadius: 8, background: "none",
                  border: "none", color: "var(--text)", fontSize: 14, cursor: "pointer", textAlign: "left",
                }}
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                {darkMode ? "Light Mode" : "Dark Mode"}
              </button>
              <Link
                href="/profile"
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 16px", borderRadius: 8, color: "var(--text)",
                  fontSize: 14, textDecoration: "none",
                }}
              >
                <UserCircle size={18} /> View Profile
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* ── Toast ── */}
      <div style={{
        position: "fixed", bottom: 32, right: 32, background: "#1e293b",
        color: "white", padding: "16px 24px", borderRadius: 12,
        boxShadow: "0 10px 40px rgba(0,0,0,0.3)", zIndex: 1000,
        opacity: showToast ? 1 : 0, transform: showToast ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.3s", pointerEvents: "none",
      }}>
        {toastMsg}
      </div>

      {/* ── Main Content — TikTok-style Discover ── */}
      {activeTab === "discover" && (
        <div
          style={{
            flex: 1, overflow: "hidden", position: "relative",
            background: "var(--light-bg)",
          }}
        >
          {isLoading ? (
            <div style={{
              height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
              opacity: 1, transition: "opacity 300ms ease",
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 48, height: 48, border: "3px solid var(--border)", borderTop: "3px solid var(--accent)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
                <p style={{ color: "var(--text)", fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Finding your best scholarship matches... Please wait.</p>
                <p style={{ color: "var(--muted)", fontSize: 14 }}>Loading personalized scholarship cards from the database.</p>
              </div>
            </div>
          ) : scholarships.length === 0 ? (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center", maxWidth: 420, padding: "0 24px" }}>
                <p style={{ color: "var(--text)", fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                  {loadError ? "We couldn't load scholarships" : "No scholarships found"}
                </p>
                <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 16 }}>
                  {loadError || "Try updating your profile for more personalized matches."}
                </p>
                <button
                  onClick={() => fetchScholarships()}
                  style={{
                    background: "var(--accent)", color: "white", border: "none",
                    borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  Try again
                </button>
              </div>
            </div>
          ) : s ? (
            <>
              {/* ── Full-viewport scholarship card ── */}
              <div
                key={s.id}
                style={{
                  position: "absolute", inset: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "24px 40px 80px",
                  animation: isAnimating && slideDirection === "up" ? "slideInUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards"
                    : isAnimating && slideDirection === "down" ? "slideInDown 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards"
                    : hasInitialRender.current ? "fadeInScale 0.3s ease-out forwards"
                    : "none",
                }}
              >
                <div style={{
                  width: "100%", maxWidth: 1200,
                  display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 32,
                  alignItems: "start",
                }}>
                  {/* ── Left: Main card ── */}
                  <div style={{
                    borderRadius: 24, overflow: "hidden",
                    background: currentGrad,
                    display: "flex", flexDirection: "column",
                    minHeight: "85vh",
                  }}>
                    {/* Tags at top */}
                    {currentTags.length > 0 && (
                      <div style={{ padding: "36px 40px 0", display: "flex", flexWrap: "wrap", gap: 10 }}>
                        {currentTags.map((t, i) => (
                          <span key={i} style={{
                            background: "rgba(255,255,255,0.15)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            padding: "8px 18px", borderRadius: 999,
                            fontSize: 14, textTransform: "uppercase", letterSpacing: 1,
                            fontWeight: 700, color: "rgba(255,255,255,0.9)",
                          }}>{t}</span>
                        ))}
                      </div>
                    )}

                    {/* Amount + Title */}
                    <div style={{ padding: currentTags.length > 0 ? "28px 40px 0" : "36px 40px 0" }}>
                      <div style={{ fontSize: 56, fontWeight: 800, color: "#fbbf24", lineHeight: 1, marginBottom: 16 }}>
                        {s.amount || "N/A"}
                      </div>
                      <h2 style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.3, color: "white", margin: 0 }}>{s.title}</h2>
                    </div>

                    {/* Description */}
                    <div style={{ padding: "20px 40px 0" }}>
                      <p style={{ fontSize: 16, lineHeight: 1.7, color: "rgba(255,255,255,0.75)", margin: 0 }}>
                        {currentDescription}
                        {isDescTruncated && (
                          <a
                            href={s.source_url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#fbbf24",
                              fontWeight: 600,
                              textDecoration: "none",
                              marginLeft: 4,
                              cursor: "pointer",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline" }}
                            onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none" }}
                          >
                            ...see more
                          </a>
                        )}
                      </p>
                    </div>

                    {/* Eligibility + Application details inside left card */}
                    <div style={{ padding: "0 40px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: "auto" }}>
                      <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: 20 }}>
                        <p style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 1.5, color: "rgba(255,255,255,0.5)", marginBottom: 8, fontWeight: 600 }}>Eligibility</p>
                        <p style={{ fontSize: 15, lineHeight: 1.6, color: "rgba(255,255,255,0.85)", margin: 0 }}>{currentEligibility}</p>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: 20 }}>
                        <p style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 1.5, color: "rgba(255,255,255,0.5)", marginBottom: 8, fontWeight: 600 }}>Application</p>
                        <p style={{ fontSize: 15, lineHeight: 1.6, color: "rgba(255,255,255,0.85)", margin: 0 }}>{currentApplication}</p>
                      </div>
                    </div>

                    {/* Action buttons inside card */}
                    <div style={{ padding: "0 40px 36px", display: "flex", alignItems: "center", gap: 12 }}>
                      <button
                        onClick={() => toggleSave(s.id)}
                        style={{
                          width: 48, height: 48, borderRadius: 14,
                          background: currentIsSaved ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.15)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          color: currentIsSaved ? "#fbbf24" : "white",
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.2s",
                        }}
                      >
                        <Bookmark size={20} fill={currentIsSaved ? "currentColor" : "none"} />
                      </button>
                      <button
                        onClick={() => shareScholarship(s)}
                        style={{
                          width: 48, height: 48, borderRadius: 14,
                          background: "rgba(255,255,255,0.15)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          color: "white", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.2s",
                        }}
                      >
                        <Share2 size={20} />
                      </button>
                      
                      <button
                        onClick={() => markApplied(s.id, s.source_url)}
                        title="Save to In Progress and open link"
                        style={{
                          flex: 1.5, height: 48, borderRadius: 14,
                          background: currentIsApplied ? "rgba(255,255,255,0.3)" : "white",
                          border: "none",
                          color: currentIsApplied ? "#1e293b" : "#1e293b",
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          gap: 8, fontSize: 15, fontWeight: 800, transition: "all 0.2s",
                        }}
                      >
                        {currentIsApplied ? <><Clock size={18} /> In Progress</> : "Apply Now"}
                      </button>
                    </div>
                  </div>

                  {/* ── Right: Details panel ── */}
                  <div style={{
                    background: "var(--card-bg)", borderRadius: 24,
                    padding: 32, display: "flex", flexDirection: "column", gap: 24,
                    border: "1px solid var(--border)",
                  }}>
                    {/* Match badge */}
                    <div>
                      <span style={{
                        display: "inline-block",
                        background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                        color: "#1e293b", padding: "10px 24px", borderRadius: 999,
                        fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5,
                      }}>
                        {currentScore}% Match
                      </span>
                    </div>

                    {/* Why this fits */}
                    <div style={{
                      background: "var(--warm-surface)", border: "1px solid var(--warm-border)",
                      borderRadius: 16, padding: 24,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <span style={{ fontSize: 20 }}>✨</span>
                        <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Why this fits:</span>
                      </div>
                      <p style={{ color: "var(--muted)", lineHeight: 1.7, fontSize: 15, margin: 0 }}>
                        {s.matchReasons && s.matchReasons.length > 0
                          ? s.matchReasons.join(". ")
                          : s.overview || s.meta_description || "This scholarship matches your profile."}
                      </p>
                    </div>

                    {/* Requirements with ELIGIBLE badges */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                      {[
                        { label: "GPA", value: (!s.minimum_gpa || String(s.minimum_gpa) === 'null' || String(s.minimum_gpa) === 'NULL') ? null : String(s.minimum_gpa) },
                        { label: "Field", value: (!s.academic_interest || s.academic_interest === 'null' || s.academic_interest === 'NULL') ? null : s.academic_interest },
                        { label: "Level", value: (!s.grade_level_summary || s.grade_level_summary === 'null' || s.grade_level_summary === 'NULL') ? null : s.grade_level_summary },
                        { label: "Citizenship", value: (!s.citizenship_status || s.citizenship_status === 'null' || s.citizenship_status === 'NULL') ? null : s.citizenship_status },
                      ].filter(item => item.value).map((item, i) => (
                        <div key={i} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "16px 0",
                          borderBottom: "1px solid var(--border)",
                        }}>
                          <span style={{ fontSize: 15, color: "var(--text)", fontWeight: 500 }}>
                            {item.label}: {item.value}
                          </span>
                          <span style={{
                            background: "rgba(16, 185, 129, 0.1)",
                            color: "#10b981", border: "1px solid rgba(16,185,129,0.2)",
                            padding: "4px 12px", borderRadius: 999,
                            fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5,
                          }}>
                            Eligible
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Scroll hint (hidden after first scroll) ── */}
              {!hasScrolled && currentScholarshipIndex < scholarships.length - 1 && (
                <div style={{
                  position: "absolute", bottom: 90, left: "50%", transform: "translateX(-50%)",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  animation: "bounceHint 2s ease-in-out infinite",
                  background: "rgba(0,0,0,0.5)", padding: "10px 20px",
                  borderRadius: 30, backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.3)", pointerEvents: "none", zIndex: 50,
                }}>
                  <span style={{ fontSize: 14, color: "white", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>Space for next</span>
                  <ChevronDown size={20} style={{ color: "white" }} />
                </div>
              )}

              {/* ── Minimal bottom nav ── */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                padding: "12px 0 20px",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 16,
                zIndex: 20,
              }}>
                <button
                  onClick={goToPreviousScholarship}
                  disabled={currentScholarshipIndex === 0}
                  style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: "var(--button-surface)", border: "1px solid var(--border)",
                    color: currentScholarshipIndex === 0 ? "var(--muted)" : "var(--text)",
                    cursor: currentScholarshipIndex === 0 ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    opacity: currentScholarshipIndex === 0 ? 0.3 : 0.7,
                    transition: "all 0.2s",
                  }}
                >
                  <ChevronUp size={20} />
                </button>
                <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>
                  {currentScholarshipIndex + 1} / {scholarships.length}
                </span>
                <button
                  onClick={goToNextScholarship}
                  disabled={currentScholarshipIndex >= scholarships.length - 1}
                  style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: "var(--button-surface)", border: "1px solid var(--border)",
                    color: currentScholarshipIndex >= scholarships.length - 1 ? "var(--muted)" : "var(--text)",
                    cursor: currentScholarshipIndex >= scholarships.length - 1 ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    opacity: currentScholarshipIndex >= scholarships.length - 1 ? 0.3 : 0.7,
                    transition: "all 0.2s",
                  }}
                >
                  <ChevronDown size={20} />
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ── Saved Overlay ── */}
      {activeTab === "saved" && (
        <div style={{ flex: 1, background: "var(--light-bg)", overflowY: "auto" }}>
          <div style={{
            padding: "32px 40px", borderBottom: "1px solid var(--border)",
            background: "var(--card-bg)", position: "sticky", top: 0, zIndex: 10,
          }}>
            <button onClick={() => setActiveTab("discover")} style={{
              background: "none", border: "none", color: "var(--text)", fontSize: 15,
              cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
            }}>
              <ArrowLeft size={16} /> Back to Feed
            </button>
            <h2 style={{ fontSize: 24, fontWeight: 700 }}>Your Saved Scholarships</h2>
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 24, padding: 40,
          }}>
            {savedList.length === 0 ? (
              <div style={{
                gridColumn: "1/-1", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", minHeight: "50vh", opacity: 0.5,
              }}>
                <Bookmark size={48} style={{ marginBottom: 20 }} />
                <h3>No scholarships saved yet.</h3>
              </div>
            ) : (
              savedList.map((s) => (
                <div key={s.id} style={{
                  background: "var(--card-bg)", border: "1px solid var(--border)",
                  borderRadius: 16, padding: 24, position: "relative",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                  display: "flex", flexDirection: "column",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.2)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.15)"; }}>
                  <button onClick={() => toggleSave(s.id)} style={{
                    position: "absolute", top: 16, right: 16, background: "var(--surface-2)",
                    border: "none", color: "var(--text)", opacity: 0.6, width: 32, height: 32,
                    borderRadius: 8, cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center", transition: "all 0.2s",
                  }} onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.opacity = "1"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.opacity = "0.6"; }}>
                    <Bookmark size={16} fill="currentColor" />
                  </button>
                  <span style={{
                    display: "inline-block", background: "var(--success-surface)", color: "var(--success-text)",
                    padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                    marginBottom: 16, alignSelf: "flex-start",
                  }}>{matchScore(s)}% Match</span>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#fbbf24", marginBottom: 12, letterSpacing: -0.5 }}>
                    {s.amount || "N/A"}
                  </div>
                  <h3 style={{ marginBottom: 12, fontSize: 18, fontWeight: 700, lineHeight: 1.4 }}>{s.title}</h3>
                  <p style={{ fontSize: 14, opacity: 0.6, marginBottom: 24, flex: 1, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {s.meta_description || s.overview || "N/A"}
                  </p>
                  <button onClick={() => markApplied(s.id, s.source_url)} style={{
                    display: "block", width: "100%", padding: 14, fontSize: 15,
                    background: "var(--accent)", color: "white", border: "none",
                    borderRadius: 12, fontWeight: 600, cursor: "pointer",
                    textAlign: "center", transition: "all 0.2s",
                  }}>
                    Apply Now
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Applied Overlay ── */}
      {activeTab === "applied" && (
        <div style={{ flex: 1, background: "var(--light-bg)", overflowY: "auto" }}>
          <div style={{
            padding: "32px 40px", borderBottom: "1px solid var(--border)",
            background: "var(--card-bg)", position: "sticky", top: 0, zIndex: 10,
          }}>
            <button onClick={() => setActiveTab("discover")} style={{
              background: "none", border: "none", color: "var(--text)", fontSize: 15,
              cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
            }}>
              <ArrowLeft size={16} /> Back to Feed
            </button>
            <h2 style={{ fontSize: 24, fontWeight: 700 }}>Your In Progress Scholarships</h2>
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 24, padding: 40,
          }}>
            {appliedList.length === 0 ? (
              <div style={{
                gridColumn: "1/-1", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", minHeight: "50vh", opacity: 0.5,
              }}>
                <CheckCircle2 size={48} style={{ marginBottom: 20 }} />
                <h3>No applications yet.</h3>
              </div>
            ) : (
              appliedList.map((s) => (
                <div key={s.id} style={{
                  background: "var(--card-bg)", border: "1px solid var(--border)",
                  borderRadius: 16, padding: 24, position: "relative",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column",
                }}>
                  <button onClick={() => removeApplied(s.id)} style={{
                    position: "absolute", top: 16, right: 16, background: "var(--surface-2)",
                    border: "none", color: "var(--text)", opacity: 0.6, width: 32, height: 32,
                    borderRadius: 8, cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center", transition: "all 0.2s",
                  }} onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.opacity = "1"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.opacity = "0.6"; }}>
                    <Trash2 size={16} />
                  </button>
                  <span style={{
                    display: "inline-flex", background: "#f59e0b", color: "white",
                    padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                    marginBottom: 16, alignSelf: "flex-start", alignItems: "center", gap: 6,
                  }}><Clock size={14} /> In Progress</span>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#fbbf24", marginBottom: 12, opacity: 0.7, letterSpacing: -0.5 }}>
                    {s.amount || "N/A"}
                  </div>
                  <h3 style={{ marginBottom: 12, fontSize: 18, fontWeight: 700, lineHeight: 1.4, opacity: 0.8 }}>{s.title}</h3>
                  <p style={{ fontSize: 14, opacity: 0.5, marginBottom: 24, flex: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {s.meta_description || s.overview || "N/A"}
                  </p>
                  <div style={{ display: "flex", gap: 12, marginTop: "auto" }}>
                    {s.source_url && (
                      <a href={s.source_url} target="_blank" rel="noopener noreferrer" style={{
                        flex: 1, padding: "12px 14px", fontSize: 14,
                        background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)",
                        borderRadius: 12, fontWeight: 600, cursor: "pointer",
                        textAlign: "center", textDecoration: "none", transition: "all 0.2s",
                      }}>
                        View
                      </a>
                    )}
                    <button onClick={() => markCompleted(s.id, s)} style={{
                      flex: 1, padding: "12px 14px", fontSize: 14,
                      background: "#10b981", color: "white", border: "none",
                      borderRadius: 12, fontWeight: 700, cursor: "pointer",
                      textAlign: "center", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}>
                      <CheckCircle2 size={16} /> Applied?
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Completed Overlay ── */}
      {activeTab === "completed" && (
        <div style={{ flex: 1, background: "var(--light-bg)", overflowY: "auto" }}>
          <div style={{
            padding: "32px 40px", borderBottom: "1px solid var(--border)",
            background: "var(--card-bg)", position: "sticky", top: 0, zIndex: 10,
          }}>
            <button onClick={() => setActiveTab("discover")} style={{
              background: "none", border: "none", color: "var(--text)", fontSize: 15,
              cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
            }}>
              <ArrowLeft size={16} /> Back to Feed
            </button>
            <h2 style={{ fontSize: 24, fontWeight: 700 }}>Your Applied Scholarships</h2>
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 24, padding: 40,
          }}>
            {completedList.length === 0 ? (
              <div style={{
                gridColumn: "1/-1", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", minHeight: "50vh", opacity: 0.5,
              }}>
                <CheckCircle2 size={48} style={{ marginBottom: 20 }} />
                <h3>No finished applications yet.</h3>
              </div>
            ) : (
              completedList.map((s) => (
                <div key={s.id} style={{
                  background: "var(--card-bg)", border: "1px solid var(--border)",
                  borderRadius: 16, padding: 24, position: "relative",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column",
                }}>
                  <button onClick={() => removeCompleted(s.id)} style={{
                    position: "absolute", top: 16, right: 16, background: "var(--surface-2)",
                    border: "none", color: "var(--text)", opacity: 0.6, width: 32, height: 32,
                    borderRadius: 8, cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center", transition: "all 0.2s",
                  }} onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.opacity = "1"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.opacity = "0.6"; }}>
                    <Trash2 size={16} />
                  </button>
                  <span style={{
                    display: "inline-flex", background: "#10b981", color: "white",
                    padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                    marginBottom: 16, alignSelf: "flex-start", alignItems: "center", gap: 6,
                  }}><CheckCircle2 size={14} /> Applied!</span>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#fbbf24", marginBottom: 12, opacity: 0.7, letterSpacing: -0.5 }}>
                    {s.amount || "N/A"}
                  </div>
                  <h3 style={{ marginBottom: 12, fontSize: 18, fontWeight: 700, lineHeight: 1.4, opacity: 0.8 }}>{s.title}</h3>
                  <p style={{ fontSize: 14, opacity: 0.5, marginBottom: 24, flex: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {s.meta_description || s.overview || "N/A"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
