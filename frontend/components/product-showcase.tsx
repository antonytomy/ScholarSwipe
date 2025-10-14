"use client"

import { useEffect, useRef, useState } from "react"
import { Sparkles, Target, Zap, Heart, X } from "lucide-react"

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
          {/* Left side - Visual mockup */}
          <div
            className={`relative transition-all duration-1000 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`}
          >
            <div className="relative">
              {/* Main showcase card */}
              <div className="relative glass-card-advanced rounded-3xl p-8 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">STEM Excellence Award</h3>
                    <p className="text-muted-foreground">National Science Foundation</p>
                  </div>
                  <div className="text-3xl font-bold text-primary">$10,000</div>
                </div>

                {/* Win probability with animation */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Your Win Probability</span>
                    <span className="text-2xl font-bold text-primary">87%</span>
                  </div>
                  <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-1000"
                      style={{ width: isVisible ? "87%" : "0%" }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Based on your GPA, major, and extracurriculars</p>
                </div>

                {/* Match reasons */}
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <p className="text-sm font-semibold">Why you're a great match:</p>
                  <div className="space-y-2">
                    {[
                      { icon: Target, text: "3.8 GPA exceeds 3.5 requirement", color: "text-primary" },
                      { icon: Sparkles, text: "Computer Science major matches STEM focus", color: "text-secondary" },
                      { icon: Zap, text: "Research experience aligns with criteria", color: "text-primary" },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-xl bg-background/50 hover:bg-background transition-colors"
                      >
                        <item.icon className={`w-5 h-5 ${item.color} flex-shrink-0 mt-0.5`} />
                        <span className="text-sm">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-4">
                  <button className="flex-1 py-3 rounded-xl bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 transition-all hover:scale-105 font-medium flex items-center justify-center gap-2">
                    <X className="w-5 h-5 text-black" />
                    Pass
                  </button>
                  <button className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground hover:scale-105 transition-all hover:shadow-xl hover:shadow-primary/50 font-medium flex items-center justify-center gap-2">
                    <Heart className="w-4 h-4 text-white fill-white" />
                    Save & Apply
                  </button>
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
              Our AI analyzes your profile against scholarship requirements and past winners to calculate your win
              probability. No more guessing—know your chances before you apply.
            </p>

            <div className="space-y-4 pt-4">
              {[
                {
                  title: "AI-Powered Analysis",
                  description: "Machine learning models trained on thousands of successful applications",
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
