"use client"

import { useEffect, useRef, useState } from "react"

const universities = [
  "Harvard University",
  "Stanford University",
  "MIT",
  "Yale University",
  "Princeton University",
  "Columbia University",
  "UC Berkeley",
  "Cornell University",
]

export default function TrustBadges() {
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
    <section ref={sectionRef} className="py-20 px-4 border-y border-border/50 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div
          className={`text-center mb-12 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Trusted by students at top universities
          </p>
        </div>

        {/* Scrolling logo strip */}
        <div className="relative overflow-hidden">
          <div className="flex gap-12 animate-marquee">
            {[...universities, ...universities].map((uni, i) => (
              <div
                key={i}
                className="flex-shrink-0 px-6 py-3 text-lg font-semibold text-muted-foreground/60 hover:text-foreground transition-colors whitespace-nowrap"
              >
                {uni}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
