"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Rocket, Bookmark, Share2, ChevronDown, ArrowRight
} from "lucide-react"
import { demoScholarships } from "@/lib/demo-scholarships"

const GRADIENTS = [
  "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
  "linear-gradient(135deg, #312e81 0%, #4338ca 100%)",
  "linear-gradient(135deg, #064e3b 0%, #10b981 100%)",
  "linear-gradient(135deg, #701a75 0%, #d946ef 100%)",
  "linear-gradient(135deg, #7c2d12 0%, #f97316 100%)",
]

export default function DemoPage() {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())
  const [toastMsg, setToastMsg] = useState("")
  const [showToast, setShowToast] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)
  const feedRef = useRef<HTMLDivElement>(null)

  const toast = (msg: string) => {
    setToastMsg(msg)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  const toggleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id); toast("Removed from saved") }
      else { next.add(id); toast("Saved!") }
      return next
    })
  }

  const markApplied = (id: string) => {
    setAppliedIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
    toast("Marked as applied!")
  }

  const shareScholarship = (title: string) => {
    navigator.clipboard.writeText(`Check out "${title}" on ScholarSwipe!`)
    toast("Shared to clipboard!")
  }

  return (
    <div className="flex h-screen overflow-hidden"
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
        background: "#f8fafc", color: "#334155",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        :root { --navy: #1e293b; --light-bg: #f8fafc; --card-bg: #ffffff; --text: #334155; --border: #e2e8f0; --accent: #4f46e5; }
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes arrowPulse { 0%,100% { opacity:0.5; transform:translateY(0) } 50% { opacity:1; transform:translateY(3px) } }
        @keyframes betaShine { 0% { background-position: 0% 50% } 50% { background-position: 100% 50% } 100% { background-position: 0% 50% } }
      `}} />

      {/* Sidebar */}
      <aside style={{
        width: 260, background: "#ffffff", borderRight: "1px solid #e2e8f0",
        display: "flex", flexDirection: "column", flexShrink: 0,
      }}>
        <div style={{ padding: "32px 24px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          <Link href="/"><Image src="/logo.png" alt="ScholarSwipe" width={200} height={40} style={{ objectFit: "contain" }} priority /></Link>
          <div style={{
            background: "linear-gradient(90deg, #F5C518, #1B3764, #F5C518, #1B3764)",
            backgroundSize: "300% 300%", animation: "betaShine 4s linear infinite",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 3,
          }}>Demo Mode</div>
        </div>

        <nav style={{ padding: "24px 16px", flex: 1 }}>
          <div style={{
            width: "100%", display: "flex", alignItems: "center", gap: 12,
            padding: "12px 20px", marginBottom: 8, borderRadius: 10,
            background: "#4f46e5", color: "white",
            border: "none", fontSize: 15,
          }}>
            <Rocket size={18} /> Discover
          </div>
          <div style={{
            width: "100%", display: "flex", alignItems: "center", gap: 12,
            padding: "12px 20px", marginBottom: 8, borderRadius: 10,
            background: "transparent", color: "#334155",
            border: "none", fontSize: 15, opacity: 0.6,
          }}>
            <Bookmark size={18} /> Saved
            {savedIds.size > 0 && (
              <span style={{
                marginLeft: "auto", background: "#fbbf24", color: "#1e293b",
                fontSize: 12, padding: "2px 8px", borderRadius: 12, fontWeight: 600,
              }}>{savedIds.size}</span>
            )}
          </div>
        </nav>

        {/* CTA */}
        <div style={{ padding: 16, borderTop: "1px solid #e2e8f0" }}>
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

      {/* Toast */}
      <div style={{
        position: "fixed", bottom: 32, right: 32, background: "#1e293b",
        color: "white", padding: "16px 24px", borderRadius: 12,
        boxShadow: "0 10px 40px rgba(0,0,0,0.2)", zIndex: 1000,
        opacity: showToast ? 1 : 0, transform: showToast ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.3s", pointerEvents: "none",
      }}>
        {toastMsg}
      </div>

      {/* Main feed */}
      <div
        ref={feedRef}
        style={{
          flex: 1, overflowY: "auto",
          scrollSnapType: "y mandatory",
          scrollBehavior: "smooth",
        }}
        onScroll={() => { if (!hasScrolled) setHasScrolled(true) }}
      >
        {demoScholarships.map((s, idx) => {
          const tags = s.tags || []
          const score = Math.round(s.winProbability * 100)
          const isSaved = savedIds.has(s.id)
          const isApplied = appliedIds.has(s.id)
          const grad = GRADIENTS[idx % GRADIENTS.length]

          return (
            <div key={s.id} style={{
              scrollSnapAlign: "start", height: "100vh",
              display: "grid", gridTemplateColumns: "1fr 380px", gap: 32,
              alignItems: "center", padding: "24px 48px",
              maxWidth: 1200, margin: "0 auto",
            }}>
              {/* Left: Scholarship Card */}
              <div style={{
                borderRadius: 28, overflow: "hidden",
                boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
                position: "relative", height: "calc(100vh - 48px)", maxHeight: 900,
                background: grad,
              }}>
                <div style={{
                  position: "relative", zIndex: 2, padding: "40px 36px",
                  color: "white", display: "flex", flexDirection: "column",
                  height: "100%", overflowY: "auto",
                }}>
                  {/* Tags */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 32 }}>
                    {tags.map((t, i) => (
                      <span key={i} style={{
                        background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)",
                        border: "1px solid rgba(255,255,255,0.2)", padding: "6px 16px",
                        borderRadius: 20, fontSize: 12, textTransform: "uppercase",
                        letterSpacing: 1, fontWeight: 600,
                      }}>{t}</span>
                    ))}
                  </div>

                  {/* Amount */}
                  <div style={{ fontSize: 56, fontWeight: 800, color: "#fbbf24", marginBottom: 16, letterSpacing: -1 }}>
                    {s.amount || "N/A"}
                  </div>

                  {/* Title */}
                  <h2 style={{ fontSize: 28, marginBottom: 8, fontWeight: 700 }}>{s.title}</h2>

                  {/* Description */}
                  <p style={{ fontSize: 15, opacity: 0.85, marginBottom: 24, lineHeight: 1.6 }}>
                    {s.matchReasons.join(". ")}
                  </p>

                  {/* Action bar */}
                  <div style={{ display: "flex", gap: 12, marginTop: "auto" }}>
                    <button
                      onClick={() => toggleSave(s.id)}
                      style={{
                        width: 56, height: 56, borderRadius: 16,
                        background: isSaved ? "#fbbf24" : "rgba(255,255,255,0.15)",
                        backdropFilter: "blur(10px)",
                        border: isSaved ? "1px solid #fbbf24" : "1px solid rgba(255,255,255,0.2)",
                        color: isSaved ? "#1e293b" : "white",
                        fontSize: 20, cursor: "pointer", transition: "all 0.2s",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Bookmark size={20} fill={isSaved ? "currentColor" : "none"} />
                    </button>
                    <button
                      onClick={() => shareScholarship(s.title)}
                      style={{
                        width: 56, height: 56, borderRadius: 16,
                        background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)",
                        border: "1px solid rgba(255,255,255,0.2)", color: "white",
                        fontSize: 20, cursor: "pointer", transition: "all 0.2s",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Share2 size={20} />
                    </button>
                    <button
                      onClick={() => markApplied(s.id)}
                      style={{
                        flex: 1, padding: "16px 32px", borderRadius: 16,
                        background: isApplied ? "#10b981" : "white",
                        color: isApplied ? "white" : "#1e293b",
                        fontSize: 16, fontWeight: 700, border: "none",
                        cursor: isApplied ? "default" : "pointer", transition: "all 0.2s",
                      }}
                    >
                      {isApplied ? "✓ Applied" : "Apply Now"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Match Panel */}
              <div style={{
                background: "#ffffff", borderRadius: 24, padding: 32,
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                alignSelf: "center", maxHeight: "calc(100vh - 48px)", overflowY: "auto",
              }}>
                <span style={{
                  display: "inline-block", background: "#fbbf24", color: "white",
                  padding: "8px 20px", borderRadius: 20, fontSize: 14, fontWeight: 600,
                  textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 24,
                }}>
                  {score}% Match
                </span>

                {/* Why this fits */}
                <div style={{
                  background: "#fef3c7", border: "1px solid #fbbf24",
                  borderRadius: 16, padding: 24, marginBottom: 24,
                }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 12,
                    marginBottom: 12, fontSize: 16, fontWeight: 700, color: "#1e3a8a",
                  }}>
                    <span style={{ fontSize: 24 }}>🧩</span>
                    <span>Why this fits:</span>
                  </div>
                  <p style={{ color: "#78716c", lineHeight: 1.6, fontSize: 14 }}>
                    {s.matchReasons.join(". ")}
                  </p>
                </div>

                {/* Checklist */}
                <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 20 }}>
                  {[
                    { label: `GPA Min: ${s.minimum_gpa || "N/A"}`, pass: true },
                    { label: `Field: ${s.academic_interest || "N/A"}`, pass: true },
                    { label: `Level: ${s.grade_level_summary || "N/A"}`, pass: true },
                    { label: `Citizenship: ${s.citizenship_status || "N/A"}`, pass: true },
                  ].map((item, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "14px 0", borderBottom: i < 3 ? "1px solid #e2e8f0" : "none",
                    }}>
                      <span style={{ fontSize: 14 }}>{item.label}</span>
                      <span style={{
                        fontSize: 11, padding: "4px 12px", borderRadius: 12,
                        fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5,
                        background: "#d1fae5", color: "#065f46",
                      }}>ELIGIBLE</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}

        {/* End CTA */}
        <div style={{
          scrollSnapAlign: "start",
          height: "100vh",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          textAlign: "center", padding: 48,
        }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>🎓</div>
          <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 16, color: "#1e293b" }}>
            That&apos;s just a taste!
          </h2>
          <p style={{ fontSize: 18, color: "#64748b", marginBottom: 40, maxWidth: 500, lineHeight: 1.6 }}>
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
      </div>

      {/* Space navigation hint */}
      <div style={{
        position: "fixed", bottom: 28, right: 32,
        display: "flex", alignItems: "center", gap: 10,
        background: "#1B3764", padding: "10px 20px", borderRadius: 30,
        border: "2px solid #F5C518", boxShadow: "0 4px 20px rgba(27,55,100,0.35)",
        zIndex: 50, color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 600,
        opacity: hasScrolled ? 0 : 1, transform: hasScrolled ? "translateY(20px)" : "translateY(0)",
        transition: "all 0.5s", pointerEvents: "none",
      }}>
        <kbd style={{
          background: "#F5C518", color: "#1B3764", padding: "6px 14px",
          borderRadius: 8, fontSize: 11, fontWeight: 800, letterSpacing: 1.5, border: "none",
        }}>SCROLL</kbd>
        <span>Next</span>
        <ChevronDown size={14} style={{ animation: "arrowPulse 1.5s ease-in-out infinite" }} />
      </div>
    </div>
  )
}
