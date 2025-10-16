"use client"

import { useEffect, useRef, useState } from "react"
import { Brain, TrendingUp, FileCheck } from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "Smart Matching",
    description: "Our AI analyzes your profile to find scholarships that match your unique qualifications.",
  },
  {
    icon: TrendingUp,
    title: "Win Probability",
    description: "See your chances of winning each scholarship based on your profile and competition.",
  },
  {
    icon: FileCheck,
    title: "Easy Applications",
    description: "Save time with our streamlined application process for multiple scholarships.",
  },
]

export default function Features() {
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const sectionRef = useRef<HTMLElement>(null)

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
    <section ref={sectionRef} className="relative py-32 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div
          className={`text-center mb-20 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-6 text-balance">
            <span className="text-primary">Everything you need</span>
            <br />
            <span className="text-foreground">to find scholarships</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Finding the perfect scholarship match has never been easier.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className={`group relative glass-card p-8 rounded-3xl transition-all duration-700 hover:scale-105 cursor-pointer ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="relative z-10">
                  {/* Icon with animations */}
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-6 transition-all duration-500 ${
                      hoveredIndex === index ? "scale-110 rotate-6" : "scale-100 rotate-0"
                    }`}
                  >
                    <Icon
                      className={`w-8 h-8 text-primary-foreground transition-all duration-500 ${
                        hoveredIndex === index ? "scale-110" : "scale-100"
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold mb-4 text-foreground group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>

                  {/* Hover indicator */}
                  <div
                    className={`mt-6 flex items-center gap-2 text-primary font-semibold transition-all duration-300 ${
                      hoveredIndex === index ? "translate-x-2 opacity-100" : "translate-x-0 opacity-0"
                    }`}
                  >
                    Learn more
                    <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
