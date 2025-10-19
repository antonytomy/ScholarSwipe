"use client"

import { useEffect, useRef, useState } from "react"
import { Brain, Heart, Rocket, Shield, Sparkles, Zap } from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "AI-Powered Matching",
    description:
      "Our AI analyzes your profile and matches you with scholarships you're most likely to win.",
    color: "from-primary to-secondary",
  },
  {
    icon: Zap,
    title: "Win Probability Score",
    description:
      "See your exact chances of winning each scholarship based on your qualifications and how well you match the requirements.",
    color: "from-secondary to-accent",
  },
  {
    icon: Heart,
    title: "Swipe Interface",
    description: "Browse scholarships like your favorite apps. Swipe right to save, left to pass. It's that simple.",
    color: "from-accent to-primary",
  },
  {
    icon: Rocket,
    title: "Quick Access to Apply",
    description:
      "Get direct links to scholarship applications. Save your matches and come back anytime to apply.",
    color: "from-primary to-accent",
  },
  {
    icon: Shield,
    title: "Verified Opportunities",
    description: "Every scholarship is verified and legitimate. No scams, no spam—just real funding opportunities.",
    color: "from-secondary to-primary",
  },
  {
    icon: Sparkles,
    title: "Track Your Favorites",
    description: "Save scholarships you're interested in and keep track of deadlines. Never lose a good opportunity.",
    color: "from-accent to-secondary",
  },
]

export default function FeaturesGrid() {
  const [visibleCards, setVisibleCards] = useState<number[]>([])
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          features.forEach((_, i) => {
            setTimeout(() => {
              setVisibleCards((prev) => [...prev, i])
            }, i * 100)
          })
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
    <section id="features" ref={sectionRef} className="py-32 px-4 bg-gradient-to-br from-background via-primary/3 to-secondary/3">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30 backdrop-blur-sm shadow-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Features</span>
          </div>
          <h2 className="font-display text-4xl md:text-6xl font-bold text-balance">
            Everything you need to find funding
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Powerful features designed to help you discover and win scholarships faster than ever before.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className={`group glass-card-advanced rounded-2xl p-8 hover-lift transition-all duration-500 ${
                visibleCards.includes(i) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {/* Icon */}
              <div className="relative mb-6">
                <div
                  className={`relative w-14 h-14 rounded-2xl bg-gradient-to-r from-primary to-secondary flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}
                >
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
