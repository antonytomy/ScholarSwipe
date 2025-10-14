"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

export default function CTASection() {
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
      <div className="max-w-5xl mx-auto">
        <div
          className={`relative glass-card-advanced rounded-3xl p-12 md:p-16 text-center space-y-8 overflow-hidden transition-all duration-1000 ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-secondary/25 rounded-full blur-3xl animate-float-slow" />
            <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-secondary/20 rounded-full blur-3xl animate-float" />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Start Free Today</span>
          </div>

          {/* Heading */}
          <h2 className="font-display text-4xl md:text-6xl font-bold text-balance">
            Ready to find your perfect scholarship match?
          </h2>

          {/* Description */}
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Join thousands of students who have already found funding for their education. No credit card required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              asChild
              size="lg"
              className="group bg-primary text-primary-foreground hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/50 hover:bg-primary/90 text-lg px-8 py-6"
            >
              <Link href="/404" className="flex items-center gap-2">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 hover:bg-primary/5 hover:border-primary/50 transition-all duration-300 bg-transparent"
            >
              <Link href="/404">Schedule a Demo</Link>
            </Button>
          </div>

          {/* Trust indicator */}
          <p className="text-sm text-muted-foreground pt-4">Free forever • No credit card required • 2 minute setup</p>
        </div>
      </div>
    </section>
  )
}
