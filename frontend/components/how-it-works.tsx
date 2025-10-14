"use client"

import { useEffect, useRef, useState } from "react"
import { UserPlus, Search, Heart, Trophy } from "lucide-react"

const steps = [
  {
    icon: UserPlus,
    title: "Create Your Profile",
    description: "Tell us about your academic achievements, interests, and goals. Takes less than 5 minutes.",
    color: "bg-primary",
  },
  {
    icon: Search,
    title: "Get Matched",
    description: "Our AI instantly finds scholarships that match your profile and calculates your win probability.",
    color: "bg-secondary",
  },
  {
    icon: Heart,
    title: "Swipe & Save",
    description: "Browse through your matches. Swipe right on scholarships you want to apply for.",
    color: "bg-accent",
  },
  {
    icon: Trophy,
    title: "Apply & Win",
    description: "Submit applications with one click. Track your progress and celebrate your wins.",
    color: "bg-primary",
  },
]

export default function HowItWorks() {
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
    <section id="how-it-works" ref={sectionRef} className="py-32 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20 space-y-4">
          <h2 className="font-display text-4xl md:text-6xl font-bold text-balance">How ScholarSwipe works</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            From profile to payout in four simple steps
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-primary -translate-y-1/2" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`relative transition-all duration-1000 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${i * 200}ms` }}
              >
                {/* Step number */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm z-10 shadow-lg">
                  {i + 1}
                </div>

                {/* Card */}
                <div className="glass-card-advanced rounded-2xl p-8 text-center space-y-4 hover-lift h-full">
                  {/* Icon */}
                  <div className="flex justify-center">
                    <div className={`w-16 h-16 rounded-2xl bg-primary flex items-center justify-center`}>
                      <step.icon className="w-8 h-8 text-primary-foreground" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
