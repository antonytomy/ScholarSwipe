"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

export default function HeroSection() {
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

            {/* Main heading */}
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight text-balance text-foreground">
              <span className="text-primary">ScholarSwipe</span> — Your scholarship search, <span className="text-primary">powered by AI</span>
            </h1>

            {/* Subheading */}
                    <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed text-pretty">
                      Swipe through scholarships matched to your profile. See your win probability and apply with ease.
                    </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                size="lg"
                className="group bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/50 hover:from-primary/90 hover:to-secondary/90 text-lg px-8 py-6"
              >
                <Link href="/signup" className="flex items-center gap-2">
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
                <Link href="/swipe">Try Demo</Link>
              </Button>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-primary border-2 border-background flex items-center justify-center text-xs font-bold text-primary-foreground"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <div className="font-semibold text-foreground">100+ students</div>
                <div className="text-muted-foreground">on waiting list</div>
              </div>
            </div>
          </div>

          {/* Right side - Product mockup */}
          <div
            className={`relative transition-all duration-1000 delay-300 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"}`}
          >
            <div className="relative">
              {/* Main mockup card */}
              <div className="relative glass-card-advanced rounded-3xl p-8 hover-lift">
                <div className="space-y-6">
                  {/* Scholarship card mockup */}
                  <div className="bg-muted/30 rounded-2xl p-6 border border-border">
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-2">
                        <div className="h-3 w-32 bg-foreground/80 rounded animate-shimmer" />
                        <div className="h-2 w-24 bg-foreground/40 rounded" />
                      </div>
                      <div className="px-3 py-1 bg-primary/20 rounded-full">
                        <span className="text-xs font-bold text-primary">$10,000</span>
                      </div>
                    </div>

                    {/* Win probability meter */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Win Probability</span>
                        <span className="font-bold text-primary">87%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full w-[87%] bg-primary rounded-full animate-shimmer" />
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      <div className="px-3 py-1 bg-background/50 rounded-full text-xs">STEM</div>
                      <div className="px-3 py-1 bg-background/50 rounded-full text-xs">Undergrad</div>
                      <div className="px-3 py-1 bg-background/50 rounded-full text-xs">3.5+ GPA</div>
                    </div>
                  </div>

                  {/* Action buttons mockup */}
                  <div className="flex gap-4">
                    <div className="flex-1 h-12 bg-destructive/20 rounded-xl flex items-center justify-center border border-destructive/30">
                      <span className="text-2xl">✕</span>
                    </div>
                    <div className="flex-1 h-12 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
                      <span className="text-2xl">♥</span>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">250+</div>
                      <div className="text-xs text-muted-foreground">Matches</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-secondary">$2.5M</div>
                      <div className="text-xs text-muted-foreground">Available</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">92%</div>
                      <div className="text-xs text-muted-foreground">Avg Match</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating notification card */}
              <div className="absolute -right-4 top-1/4 glass-card-advanced rounded-2xl p-4 shadow-xl animate-bounce-subtle max-w-[200px]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                    🎓
                  </div>
                  <div>
                    <div className="text-xs font-semibold">New Match!</div>
                    <div className="text-xs text-muted-foreground">95% probability</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
