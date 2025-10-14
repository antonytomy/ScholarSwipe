"use client"

import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Calendar, DollarSign } from "lucide-react"

export default function ScholarshipCard() {
  const [isVisible, setIsVisible] = useState(false)
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
      <div className="max-w-4xl mx-auto">
        <div
          className={`text-center mb-16 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">Swipe Through Opportunities</h2>
          <p className="text-lg text-muted-foreground">See exactly how scholarships match your profile</p>
        </div>

        <div
          className={`transition-all duration-1000 delay-300 ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <Card className="relative overflow-hidden glass-card p-8 rounded-3xl border-2 hover:scale-105 transition-all duration-500 cursor-pointer group">
            {/* Match percentage badge */}
            <div className="absolute top-6 right-6">
              <Badge className="bg-primary text-primary-foreground text-lg px-4 py-2 font-bold">87% Match</Badge>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-3xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  STEM Excellence Scholarship
                </h3>
                <div className="flex items-center gap-2 text-2xl font-bold text-primary">
                  <DollarSign className="w-6 h-6" />
                  <span>10,000</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  Engineering
                </Badge>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  Computer Science
                </Badge>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  Mathematics
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-5 h-5" />
                <span className="text-sm font-medium">Deadline: May 15, 2025</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
