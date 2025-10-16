"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export default function CTA() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="relative py-32 px-4">
      <div className="max-w-5xl mx-auto">
        <div
          className={`relative glass-card p-12 md:p-20 rounded-[3rem] overflow-hidden transition-all duration-1000 ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <div className="absolute inset-0 bg-primary/5" />

          <div className="absolute top-10 right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 left-10 w-40 h-40 bg-secondary/25 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute top-1/2 left-1/2 w-36 h-36 bg-secondary/20 rounded-full blur-3xl animate-float" />

          <div className="relative z-10 text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
              <span className="text-primary">Ready to find</span>
              <br />
              <span className="text-foreground">your perfect match?</span>
            </h2>

            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of students who are already finding scholarships with ScholarSwipe. Start swiping today.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="group relative overflow-hidden bg-primary text-primary-foreground px-10 py-7 text-lg rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/50 hover:bg-primary/90"
              >
                <Link href="/404" className="flex items-center gap-2">
                  <span className="relative z-10 flex items-center gap-2">
                    Get Started
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="ghost"
                className="px-10 py-7 text-lg rounded-2xl transition-all duration-300 hover:scale-105 text-foreground hover:text-primary"
              >
                <Link href="/404">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
