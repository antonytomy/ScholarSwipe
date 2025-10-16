"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, GraduationCap } from "lucide-react"
import Link from "next/link"

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float-slow" />
        <div
          className="absolute bottom-20 left-1/3 w-80 h-80 bg-secondary/15 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-secondary/10 rounded-full blur-3xl animate-float-slow" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8 transition-all duration-700 border border-secondary/20 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <GraduationCap className="w-4 h-4 text-secondary" />
          <span className="text-sm font-medium text-foreground">AI-Powered Scholarship Matching</span>
          <span className="text-sm text-secondary font-semibold">Learn more →</span>
        </div>

        <h1
          className={`text-6xl md:text-8xl lg:text-9xl font-bold mb-6 transition-all duration-1000 delay-100 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="inline-block text-balance">
            <span className="text-primary">Find Your Perfect</span>
          </span>
          <br />
          <span className="text-foreground">Scholarship Match</span>
        </h1>

        <p
          className={`text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed transition-all duration-1000 delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          ScholarSwipe uses AI to match you with scholarships based on your profile. Swipe through opportunities and see
          your chances of winning in real-time.
        </p>

        <div
          className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-1000 delay-500 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <Button
            asChild
            size="lg"
            className="group relative overflow-hidden bg-primary text-primary-foreground px-8 py-6 text-lg rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/50 hover:bg-primary/90 font-semibold"
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
            variant="outline"
            className="group glass-card px-8 py-6 text-lg rounded-2xl transition-all duration-300 hover:scale-105 hover:bg-card/50 border-2 bg-transparent"
          >
            <Link href="/404" className="flex items-center gap-2">
              <span className="flex items-center gap-2">
                Learn More
                <span className="inline-block transition-transform group-hover:scale-110">→</span>
              </span>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
