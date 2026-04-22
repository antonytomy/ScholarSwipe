"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Rocket, Bookmark, CheckCircle2, ArrowLeft, Trash2, Share2,
  ChevronDown, ChevronUp, LayoutDashboard, Clock, ArrowRight
} from "lucide-react"
import { demoScholarships } from "@/lib/demo-scholarships"

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

export default function DemoPage() {
  const [scholarships] = useState(demoScholarships)
  
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())

  // UI state
  const [activeTab, setActiveTab] = useState<"discover" | "saved" | "applied" | "completed">("discover")
  const [darkMode, setDarkMode] = useState(false)
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

  // Hydrate only theme
  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode)
  }, [darkMode])

  const toast = (msg: string) => {
    setToastMsg(msg)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  const toggleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        toast("Removed from saved")
      } else {
        next.add(id)
        toast("Saved! ✨")
      }
      return next
    })
  }

  const markApplied = (id: string, link?: string) => {
    setAppliedIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
    if (link) window.open(link, "_blank")
    toast("Marked as in progress!")
  }

  const removeApplied = (id: string) => {
    setAppliedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const markCompleted = (id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
    setAppliedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setActiveTab("completed")
    toast("Marked as Applied!")
  }

  const removeCompleted = (id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const shareScholarship = (s: any) => {
    navigator.clipboard.writeText(`Apply for ${s.title} here: ${s.source_url} via ScholarSwipe!`)
    toast("Link copied to clipboard!")
  }

  const matchScore = (s: any): number => {
    if (s.winProbability) return Math.round(s.winProbability * 100)
    return 50
  }

  const goToNextScholarship = useCallback(() => {
    if (isAnimating) return
    if (!hasScrolled) setHasScrolled(true)
    hasInitialRender.current = false
    setCurrentScholarshipIndex((prev) => {
      if (prev >= scholarships.length) return prev
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

  const savedList = scholarships.filter((s) => savedIds.has(s.id))
  const appliedList = scholarships.filter((s) => appliedIds.has(s.id))
  const completedList = scholarships.filter((s) => completedIds.has(s.id))
  const currentScholarship = scholarships[currentScholarshipIndex] ?? null
  const s = currentScholarship
  const currentTags = s?.tags || []
  const currentScore = s ? matchScore(s) : 0
  const currentIsSaved = s ? savedIds.has(s.id) : false
  const currentIsApplied = s ? appliedIds.has(s.id) : false
  const currentGrad = GRADIENTS[currentScholarshipIndex % GRADIENTS.length]
  const currentDescription = s ? s.matchReasons.join(". ") : ""
  const currentEligibility = s ? `Must have GPA of ${s.minimum_gpa || 'N/A'}. Field: ${s.academic_interest || 'Any'}. Citizenship: ${s.citizenship_status || 'Any'}.` : "Eligibility details mapped from demo profile."
  const currentApplication = "Click apply now to visit the scholarship page."

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
        }
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
        @keyframes betaShine { 0% { background-position: 0% 50% } 50% { background-position: 100% 50% } 100% { background-position: 0% 50% } }
      `}} />

      {/* ── Sidebar ── */}
      <aside
        style={{
          width: 260, background: "var(--card-bg)", borderRight: "1px solid var(--border)",
          display: "flex", flexDirection: "column", flexShrink: 0,
        }}
      >
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
            Demo Mode
          </div>
        </div>

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

        {/* Demo Call to action */}
        <div style={{ padding: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/signup" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", padding: "14px 20px", borderRadius: 12,
            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
            color: "white", fontSize: 14, fontWeight: 700,
            textDecoration: "none", transition: "all 0.2s",
          }}>
            Sign Up for Full Access <ArrowRight size={16} />
          </Link>
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

      {/* ── Main Content — Discover ── */}
      {activeTab === "discover" && (
        <div style={{ flex: 1, overflow: "hidden", position: "relative", background: "var(--light-bg)" }}>
          {s ? (
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
              {/* Left card */}
              <div style={{
                borderRadius: 24, overflow: "hidden",
                background: currentGrad,
                display: "flex", flexDirection: "column",
                minHeight: "85vh",
              }}>
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

                <div style={{ padding: "28px 40px 0" }}>
                  <div style={{ fontSize: 56, fontWeight: 800, color: "#fbbf24", lineHeight: 1, marginBottom: 16 }}>
                    {s.amount || "N/A"}
                  </div>
                  <h2 style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.3, color: "white", margin: 0 }}>{s.title}</h2>
                </div>

                <div style={{ padding: "20px 40px 0" }}>
                  <p style={{ fontSize: 16, lineHeight: 1.7, color: "rgba(255,255,255,0.75)", margin: 0 }}>
                    {currentDescription}
                  </p>
                </div>

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

                <div style={{ padding: "0 40px 36px", display: "flex", alignItems: "center", gap: 12 }}>
                  <button onClick={() => toggleSave(s.id)} style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: currentIsSaved ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.2)", color: currentIsSaved ? "#fbbf24" : "white",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
                  }}>
                    <Bookmark size={20} fill={currentIsSaved ? "currentColor" : "none"} />
                  </button>
                  <button onClick={() => shareScholarship(s)} style={{
                    width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.2)", color: "white", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
                  }}>
                    <Share2 size={20} />
                  </button>
                  <button onClick={() => markApplied(s.id, s.source_url)} style={{
                    flex: 1.5, height: 48, borderRadius: 14, background: currentIsApplied ? "rgba(255,255,255,0.3)" : "white",
                    border: "none", color: "#1e293b", cursor: "pointer", display: "flex", alignItems: "center",
                    justifyContent: "center", gap: 8, fontSize: 15, fontWeight: 800, transition: "all 0.2s",
                  }}>
                    {currentIsApplied ? <><Clock size={18} /> In Progress</> : "Apply Now"}
                  </button>
                </div>
              </div>

              {/* Right card */}
              <div style={{
                background: "var(--card-bg)", borderRadius: 24, padding: 32, display: "flex", flexDirection: "column", gap: 24,
                border: "1px solid var(--border)",
              }}>
                <div>
                  <span style={{
                    display: "inline-block", background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                    color: "#1e293b", padding: "10px 24px", borderRadius: 999,
                    fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5,
                  }}>
                    {currentScore}% Match
                  </span>
                </div>
                <div style={{ background: "var(--warm-surface)", border: "1px solid var(--warm-border)", borderRadius: 16, padding: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 20 }}>✨</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Why this fits:</span>
                  </div>
                  <p style={{ color: "var(--muted)", lineHeight: 1.7, fontSize: 15, margin: 0 }}>
                    {s.matchReasons && s.matchReasons.length > 0 ? s.matchReasons.join(". ") : "This scholarship matches your profile."}
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {[
                    { label: "GPA", value: s.minimum_gpa },
                    { label: "Field", value: s.academic_interest },
                    { label: "Level", value: s.grade_level_summary },
                    { label: "Citizenship", value: s.citizenship_status },
                  ].filter(item => item.value).map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontSize: 15, color: "var(--text)", fontWeight: 500 }}>{item.label}: {item.value}</span>
                      <span style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)", padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Eligible</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          ) : currentScholarshipIndex === scholarships.length ? (
            <div
              key="cta"
              style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                padding: "24px 40px", textAlign: "center", background: "var(--light-bg)",
                animation: isAnimating && slideDirection === "up" ? "slideInUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards" : isAnimating && slideDirection === "down" ? "slideInDown 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards" : "none",
              }}
            >
              <div style={{ fontSize: 64, marginBottom: 24 }}>🎓</div>
              <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 16, color: "var(--text)" }}>
                That's just a taste!
              </h2>
              <p style={{ fontSize: 18, color: "var(--muted)", marginBottom: 40, maxWidth: 500, lineHeight: 1.6 }}>
                Sign up to access thousands of scholarships matched to your unique profile, powered by our AI matching engine.
              </p>
              <Link href="/signup" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "18px 40px", borderRadius: 16,
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                color: "white", fontSize: 18, fontWeight: 700,
                textDecoration: "none", boxShadow: "0 10px 40px rgba(79,70,229,0.4)",
                transition: "all 0.3s",
              }}>
                Get Started Free <ArrowRight size={20} />
              </Link>
            </div>
          ) : null}

          {!hasScrolled && currentScholarshipIndex < scholarships.length && (
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

          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 0 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 16, zIndex: 20 }}>
            <button onClick={goToPreviousScholarship} disabled={currentScholarshipIndex === 0} style={{ width: 44, height: 44, borderRadius: 12, background: "var(--button-surface)", border: "1px solid var(--border)", color: currentScholarshipIndex === 0 ? "var(--muted)" : "var(--text)", cursor: currentScholarshipIndex === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: currentScholarshipIndex === 0 ? 0.3 : 0.7, transition: "all 0.2s" }}>
              <ChevronUp size={20} />
            </button>
            <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>
              {currentScholarshipIndex < scholarships.length ? `${currentScholarshipIndex + 1} / ${scholarships.length}` : `Ready`}
            </span>
            <button onClick={goToNextScholarship} disabled={currentScholarshipIndex >= scholarships.length} style={{ width: 44, height: 44, borderRadius: 12, background: "var(--button-surface)", border: "1px solid var(--border)", color: currentScholarshipIndex >= scholarships.length ? "var(--muted)" : "var(--text)", cursor: currentScholarshipIndex >= scholarships.length ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: currentScholarshipIndex >= scholarships.length ? 0.3 : 0.7, transition: "all 0.2s" }}>
              <ChevronDown size={20} />
            </button>
          </div>
        </div>
      )}

      {/* ── Saved Overlay ── */}
      {activeTab === "saved" && (
        <div style={{ flex: 1, background: "var(--light-bg)", overflowY: "auto" }}>
          <div style={{ padding: "32px 40px", borderBottom: "1px solid var(--border)", background: "var(--card-bg)", position: "sticky", top: 0, zIndex: 10 }}>
            <button onClick={() => setActiveTab("discover")} style={{ background: "none", border: "none", color: "var(--text)", fontSize: 15, cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <ArrowLeft size={16} /> Back to Feed
            </button>
            <h2 style={{ fontSize: 24, fontWeight: 700 }}>Your Saved Scholarships</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24, padding: 40 }}>
            {savedList.length === 0 ? (
              <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", opacity: 0.5 }}>
                <Bookmark size={48} style={{ marginBottom: 20 }} />
                <h3>No scholarships saved yet.</h3>
              </div>
            ) : (
              savedList.map((s) => (
                <div key={s.id} style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, position: "relative", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", transition: "transform 0.2s, box-shadow 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.2)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.15)"; }}>
                  <button onClick={() => toggleSave(s.id)} style={{ position: "absolute", top: 16, right: 16, background: "var(--surface-2)", border: "none", color: "var(--text)", opacity: 0.6, width: 32, height: 32, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.opacity = "1"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.opacity = "0.6"; }}>
                    <Bookmark size={16} fill="currentColor" />
                  </button>
                  <span style={{ display: "inline-block", background: "var(--success-surface)", color: "var(--success-text)", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700, marginBottom: 16, alignSelf: "flex-start" }}>{matchScore(s)}% Match</span>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#fbbf24", marginBottom: 12, letterSpacing: -0.5 }}>{s.amount || "N/A"}</div>
                  <h3 style={{ marginBottom: 12, fontSize: 18, fontWeight: 700, lineHeight: 1.4 }}>{s.title}</h3>
                  <p style={{ fontSize: 14, opacity: 0.6, marginBottom: 24, flex: 1, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{s.matchReasons.join(". ")}</p>
                  <button onClick={() => markApplied(s.id, s.source_url)} style={{ display: "block", width: "100%", padding: 14, fontSize: 15, background: "var(--accent)", color: "white", border: "none", borderRadius: 12, fontWeight: 600, cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}>Apply Now</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Applied Overlay (In Progress) ── */}
      {activeTab === "applied" && (
        <div style={{ flex: 1, background: "var(--light-bg)", overflowY: "auto" }}>
          <div style={{ padding: "32px 40px", borderBottom: "1px solid var(--border)", background: "var(--card-bg)", position: "sticky", top: 0, zIndex: 10 }}>
            <button onClick={() => setActiveTab("discover")} style={{ background: "none", border: "none", color: "var(--text)", fontSize: 15, cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <ArrowLeft size={16} /> Back to Feed
            </button>
            <h2 style={{ fontSize: 24, fontWeight: 700 }}>Your In Progress Scholarships</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24, padding: 40 }}>
            {appliedList.length === 0 ? (
              <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", opacity: 0.5 }}>
                <CheckCircle2 size={48} style={{ marginBottom: 20 }} />
                <h3>No applications yet.</h3>
              </div>
            ) : (
              appliedList.map((s) => (
                <div key={s.id} style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, position: "relative", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column" }}>
                  <button onClick={() => removeApplied(s.id)} style={{ position: "absolute", top: 16, right: 16, background: "var(--surface-2)", border: "none", color: "var(--text)", opacity: 0.6, width: 32, height: 32, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.opacity = "1"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.opacity = "0.6"; }}>
                    <Trash2 size={16} />
                  </button>
                  <span style={{ display: "inline-flex", background: "#f59e0b", color: "white", padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, marginBottom: 16, alignSelf: "flex-start", alignItems: "center", gap: 6 }}><Clock size={14} /> In Progress</span>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#fbbf24", marginBottom: 12, opacity: 0.7, letterSpacing: -0.5 }}>{s.amount || "N/A"}</div>
                  <h3 style={{ marginBottom: 12, fontSize: 18, fontWeight: 700, lineHeight: 1.4, opacity: 0.8 }}>{s.title}</h3>
                  <p style={{ fontSize: 14, opacity: 0.5, marginBottom: 24, flex: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{s.matchReasons.join(". ")}</p>
                  <div style={{ display: "flex", gap: 12, marginTop: "auto" }}>
                    {s.source_url && (
                      <a href={s.source_url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "12px 14px", fontSize: 14, background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 12, fontWeight: 600, cursor: "pointer", textAlign: "center", textDecoration: "none", transition: "all 0.2s" }}>View</a>
                    )}
                    <button onClick={() => markCompleted(s.id)} style={{ flex: 1, padding: "12px 14px", fontSize: 14, background: "#10b981", color: "white", border: "none", borderRadius: 12, fontWeight: 700, cursor: "pointer", textAlign: "center", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
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
          <div style={{ padding: "32px 40px", borderBottom: "1px solid var(--border)", background: "var(--card-bg)", position: "sticky", top: 0, zIndex: 10 }}>
            <button onClick={() => setActiveTab("discover")} style={{ background: "none", border: "none", color: "var(--text)", fontSize: 15, cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <ArrowLeft size={16} /> Back to Feed
            </button>
            <h2 style={{ fontSize: 24, fontWeight: 700 }}>Your Applied Scholarships</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24, padding: 40 }}>
            {completedList.length === 0 ? (
              <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", opacity: 0.5 }}>
                <CheckCircle2 size={48} style={{ marginBottom: 20 }} />
                <h3>No finished applications yet.</h3>
              </div>
            ) : (
              completedList.map((s) => (
                <div key={s.id} style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, position: "relative", boxShadow: "0 10px 30px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column" }}>
                  <button onClick={() => removeCompleted(s.id)} style={{ position: "absolute", top: 16, right: 16, background: "var(--surface-2)", border: "none", color: "var(--text)", opacity: 0.6, width: 32, height: 32, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.opacity = "1"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.opacity = "0.6"; }}>
                    <Trash2 size={16} />
                  </button>
                  <span style={{ display: "inline-flex", background: "#10b981", color: "white", padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, marginBottom: 16, alignSelf: "flex-start", alignItems: "center", gap: 6 }}><CheckCircle2 size={14} /> Applied!</span>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#fbbf24", marginBottom: 12, opacity: 0.7, letterSpacing: -0.5 }}>{s.amount || "N/A"}</div>
                  <h3 style={{ marginBottom: 12, fontSize: 18, fontWeight: 700, lineHeight: 1.4, opacity: 0.8 }}>{s.title}</h3>
                  <p style={{ fontSize: 14, opacity: 0.5, marginBottom: 24, flex: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{s.matchReasons.join(". ")}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

