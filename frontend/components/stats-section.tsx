"use client"

import { useEffect, useRef, useState } from "react"

const stats = [
  { value: "$50M+", label: "In scholarships matched", color: "from-primary to-secondary" },
  { value: "10,000+", label: "Students helped", color: "from-secondary to-accent" },
  { value: "5,000+", label: "Verified scholarships", color: "from-accent to-primary" },
  { value: "92%", label: "Average match score", color: "from-primary to-accent" },
]

export default function StatsSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [counts, setCounts] = useState(stats.map(() => 0))
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
    <section id="about" ref={sectionRef} className="py-32 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="glass-card-advanced rounded-3xl p-12 md:p-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            {stats.map((stat, i) => (
              <div
                key={i}
                className={`text-center space-y-2 transition-all duration-1000 ${
                  isVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className={`text-5xl md:text-6xl font-bold text-primary`}>{stat.value}</div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
