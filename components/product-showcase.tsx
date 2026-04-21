"use client"

import { useEffect, useRef, useState } from "react"
import { Sparkles, Bookmark, Share2 } from "lucide-react"

export default function ProductShowcase() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="py-32 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left side - Realistic dashboard mockup */}
          <div
            className={`relative transition-all duration-1000 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`}
          >
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 220px",
              gap: 16,
            }}>
              {/* Gradient scholarship card */}
              <div style={{
                borderRadius: 20,
                overflow: "hidden",
                background: "linear-gradient(135deg, #064e3b 0%, #10b981 100%)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
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
                    {["Leadership", "Community Service", "All Majors"].map((tag) => (
                      <span key={tag} style={{
                        background: "rgba(255,255,255,0.15)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        padding: "4px 12px", borderRadius: 16,
                        fontSize: 10, textTransform: "uppercase",
                        letterSpacing: 1, fontWeight: 600,
                      }}>{tag}</span>
                    ))}
                  </div>

                  {/* Amount */}
                  <div style={{
                    fontSize: 36, fontWeight: 800,
                    color: "#fbbf24", marginBottom: 10, letterSpacing: -1,
                  }}>$5,000</div>

                  {/* Title */}
                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, lineHeight: 1.3 }}>
                    Future Leaders Award
                  </h3>

                  {/* Description */}
                  <p style={{ fontSize: 12, opacity: 0.8, lineHeight: 1.5, marginBottom: 20, flex: 1 }}>
                    For students demonstrating exceptional leadership and community involvement.
                  </p>

                  {/* Eligibility info */}
                  <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 2, opacity: 0.6, marginBottom: 6 }}>
                      ELIGIBILITY
                    </p>
                    <p style={{ fontSize: 11, lineHeight: 1.5, opacity: 0.85 }}>
                      Open to U.S. citizens. All majors welcome. Minimum 3.0 GPA required.
                    </p>
                  </div>

                  {/* Action bar */}
                  <div style={{ display: "flex", gap: 8 }}>
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
                      fontSize: 13, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      Apply Now
                    </div>
                  </div>
                </div>
              </div>

              {/* Match panel */}
              <div style={{
                background: "white", borderRadius: 20,
                padding: "20px 16px", border: "1px solid #e5e7eb",
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                alignSelf: "center", fontSize: 12,
              }}>
                <span style={{
                  display: "inline-block", background: "#fbbf24", color: "white",
                  padding: "6px 14px", borderRadius: 16, fontSize: 12,
                  fontWeight: 600, textTransform: "uppercase",
                  letterSpacing: 0.5, marginBottom: 16,
                }}>92% Match</span>

                <div style={{
                  background: "#fef3c7", border: "1px solid #fbbf24",
                  borderRadius: 12, padding: 14, marginBottom: 16,
                }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    marginBottom: 8, fontSize: 12, fontWeight: 700, color: "#1e3a8a",
                  }}>
                    <span>🧩</span>
                    <span>Why this fits:</span>
                  </div>
                  <p style={{ color: "#78716c", lineHeight: 1.5, fontSize: 11 }}>
                    100+ volunteer hours exceed requirement. President of 2 student organizations.
                  </p>
                </div>

                <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 12 }}>
                  {[
                    { label: "GPA: 3.0", pass: true },
                    { label: "Major: All", pass: true },
                    { label: "Level: College", pass: true },
                    { label: "Region: Any", pass: true },
                  ].map((item, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "8px 0",
                      borderBottom: i < 3 ? "1px solid #e5e7eb" : "none",
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

          {/* Right side - Text content */}
          <div
            className={`space-y-6 transition-all duration-1000 delay-300 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"}`}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Smart Matching</span>
            </div>

            <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight text-balance">
              See exactly how likely you are to win
            </h2>

            <p className="text-lg text-muted-foreground leading-relaxed text-pretty">
              Our AI analyzes your profile against scholarship requirements to calculate your win
              probability. No more guessing—know your chances before you apply.
            </p>

            <div className="space-y-4 pt-4">
              {[
                {
                  title: "AI-Powered Analysis",
                  description: "Advanced AI compares your profile to scholarship requirements for accurate matching",
                },
                {
                  title: "Personalized Matches",
                  description: "Only see scholarships where you have a real chance of winning",
                },
                {
                  title: "Save Time",
                  description: "Focus on high-probability opportunities instead of spray-and-pray",
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
