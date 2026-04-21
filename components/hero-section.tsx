"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Bookmark, Share2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

export default function HeroSection() {
  const { user } = useAuth()
  const [isVisible, setIsVisible] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center pt-20 px-4 overflow-hidden bg-primary/5"
    >
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text content */}
          <div
            className={`space-y-8 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight text-balance text-foreground">
              <span className="text-primary">Scholar Swipe</span> — Your scholarship search, <span className="text-primary">powered by AI</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed text-pretty">
              Swipe through scholarships matched to your profile. See your win probability and apply with ease.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="group bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/50 hover:from-primary/90 hover:to-secondary/90 text-lg px-8 py-6"
              >
                <Link href={user ? "/swipe" : "/signup"} className="flex items-center gap-2">
                  Start Swiping Free
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 hover:bg-primary/5 hover:border-primary/50 transition-all duration-300 bg-transparent"
              >
                <Link href="/demo">Try Demo</Link>
              </Button>
            </div>
            <div className="rounded-2xl border border-primary/15 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">
                    For Scholarship Providers
                  </p>
                  <p className="text-sm text-muted-foreground sm:text-base">
                    Are you an organization or company offering a scholarship? Submit it here for review.
                  </p>
                </div>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <Link href="/add-scholarship">Add Your Scholarship</Link>
                </Button>
              </div>
            </div>

          </div>

          {/* Right side - Realistic dashboard mockup */}
          <div
            className={`relative transition-all duration-1000 delay-300 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"}`}
          >
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 200px",
              gap: 16,
              maxWidth: 560,
              margin: "0 auto",
            }}>
              {/* Left: Gradient scholarship card */}
              <div style={{
                borderRadius: 20,
                overflow: "hidden",
                background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
                position: "relative",
              }}>
                <div style={{
                  padding: "28px 24px",
                  color: "white",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}>
                  {/* Tags */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
                    {["STEM", "College", "High Value"].map((tag) => (
                      <span key={tag} style={{
                        background: "rgba(255,255,255,0.15)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        padding: "4px 12px",
                        borderRadius: 16,
                        fontSize: 10,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        fontWeight: 600,
                      }}>{tag}</span>
                    ))}
                  </div>

                  {/* Amount */}
                  <div style={{
                    fontSize: 36,
                    fontWeight: 800,
                    color: "#fbbf24",
                    marginBottom: 10,
                    letterSpacing: -1,
                  }}>$10,000</div>

                  {/* Title */}
                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, lineHeight: 1.3 }}>
                    STEM Excellence Scholarship
                  </h3>

                  {/* Description */}
                  <p style={{ fontSize: 12, opacity: 0.8, lineHeight: 1.5, marginBottom: 20, flex: 1 }}>
                    For students pursuing STEM degrees with outstanding academic records and research experience.
                  </p>

                  {/* Action bar */}
                  <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: "#fbbf24", border: "1px solid #fbbf24",
                      color: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Bookmark size={16} fill="currentColor" />
                    </div>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)",
                      color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Share2 size={16} />
                    </div>
                    <div style={{
                      flex: 1, borderRadius: 12,
                      background: "white", color: "#1e293b",
                      fontSize: 13, fontWeight: 700, border: "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      Apply Now
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Match panel */}
              <div style={{
                background: "white",
                borderRadius: 20,
                padding: "20px 16px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                alignSelf: "center",
                fontSize: 12,
              }}>
                {/* Match badge */}
                <span style={{
                  display: "inline-block",
                  background: "#fbbf24",
                  color: "white",
                  padding: "6px 14px",
                  borderRadius: 16,
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 16,
                }}>87% Match</span>

                {/* Why this fits */}
                <div style={{
                  background: "#fef3c7",
                  border: "1px solid #fbbf24",
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 16,
                }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    marginBottom: 8, fontSize: 12, fontWeight: 700, color: "#1e3a8a",
                  }}>
                    <span>🧩</span>
                    <span>Why this fits:</span>
                  </div>
                  <p style={{ color: "#78716c", lineHeight: 1.5, fontSize: 11 }}>
                    3.8 GPA exceeds 3.5 requirement. Computer Science major matches STEM focus.
                  </p>
                </div>

                {/* Checklist */}
                <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12 }}>
                  {[
                    { label: "GPA: 3.5", pass: true },
                    { label: "Field: STEM", pass: true },
                    { label: "Level: College", pass: true },
                  ].map((item, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "8px 0",
                      borderBottom: i < 2 ? "1px solid #e5e7eb" : "none",
                    }}>
                      <span style={{ fontSize: 11 }}>{item.label}</span>
                      <span style={{
                        fontSize: 9, padding: "3px 8px", borderRadius: 10,
                        fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5,
                        background: "#d1fae5", color: "#065f46",
                      }}>ELIGIBLE</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
