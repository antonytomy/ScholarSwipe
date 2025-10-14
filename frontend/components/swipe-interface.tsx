"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { GraduationCap, Sparkles } from "lucide-react"
import SwipeCard from "@/components/swipe-card"
import SwipeStats from "@/components/swipe-stats"

// Mock scholarship data
const scholarships = [
  {
    id: 1,
    title: "STEM Excellence Scholarship",
    organization: "National Science Foundation",
    amount: 10000,
    deadline: "May 15, 2025",
    winProbability: 87,
    tags: ["STEM", "Undergraduate", "3.5+ GPA"],
    description:
      "Supporting outstanding students pursuing degrees in Science, Technology, Engineering, and Mathematics.",
    matchReasons: [
      "3.8 GPA exceeds 3.5 requirement",
      "Computer Science major matches STEM focus",
      "Research experience aligns with criteria",
    ],
  },
  {
    id: 2,
    title: "Future Leaders Award",
    organization: "Leadership Foundation",
    amount: 5000,
    deadline: "June 1, 2025",
    winProbability: 92,
    tags: ["Leadership", "Community Service", "All Majors"],
    description: "Recognizing students who demonstrate exceptional leadership potential and community engagement.",
    matchReasons: [
      "100+ volunteer hours exceed requirement",
      "President of 2 student organizations",
      "Strong leadership essay portfolio",
    ],
  },
  {
    id: 3,
    title: "Women in Technology Grant",
    organization: "Tech Diversity Initiative",
    amount: 7500,
    deadline: "April 30, 2025",
    winProbability: 78,
    tags: ["Women", "Technology", "Graduate"],
    description: "Empowering women pursuing advanced degrees in technology and computer science fields.",
    matchReasons: [
      "Female student in CS program",
      "Published research in tech journals",
      "Internship at Fortune 500 tech company",
    ],
  },
  {
    id: 4,
    title: "First Generation Scholar Award",
    organization: "Education Equity Fund",
    amount: 15000,
    deadline: "May 20, 2025",
    winProbability: 95,
    tags: ["First-Gen", "Financial Need", "All Majors"],
    description: "Supporting first-generation college students in achieving their educational dreams.",
    matchReasons: [
      "First-generation college student",
      "Demonstrated financial need",
      "Strong academic performance (3.7+ GPA)",
    ],
  },
  {
    id: 5,
    title: "Innovation Challenge Prize",
    organization: "Entrepreneurship Institute",
    amount: 12000,
    deadline: "July 15, 2025",
    winProbability: 81,
    tags: ["Innovation", "Entrepreneurship", "Project-Based"],
    description: "Funding innovative student projects that solve real-world problems.",
    matchReasons: [
      "Developed mobile app with 10K+ downloads",
      "Won university hackathon competition",
      "Strong business plan and pitch deck",
    ],
  },
]

export default function SwipeInterface() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [savedCount, setSavedCount] = useState(0)
  const [passedCount, setPassedCount] = useState(0)
  const [likedCount, setLikedCount] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState<"up" | "down" | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)

  const currentScholarship = scholarships[currentIndex]
  const hasMore = currentIndex < scholarships.length - 1

  const handleSwipe = (direction: "up" | "down") => {
    if (isAnimating || !hasMore) return

    setIsAnimating(true)
    setSwipeDirection(direction)

    if (direction === "up") {
      // Swipe up = save
      setSavedCount((prev) => prev + 1)
      // Show celebration for high probability matches
      if (currentScholarship.winProbability >= 85) {
        setShowCelebration(true)
        setTimeout(() => setShowCelebration(false), 2000)
      }
    } else {
      // Swipe down = pass
      setPassedCount((prev) => prev + 1)
    }

    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % scholarships.length) // Loop back to start for infinite scrolling
      setIsAnimating(false)
      setSwipeDirection(null)
    }, 500)
  }

  const handleLike = () => {
    if (isAnimating) return
    setLikedCount((prev) => prev + 1)
    // Show brief animation
    setShowCelebration(true)
    setTimeout(() => setShowCelebration(false), 1000)
  }

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") handleSwipe("down")
    if (e.key === "ArrowUp") handleSwipe("up")
    if (e.key === " " || e.key === "l") handleLike()
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [currentIndex, isAnimating])

  // Remove the "All Done" screen for infinite scrolling
  // The interface will continue showing scholarships indefinitely

  return (
    <div className="min-h-screen px-4 py-8">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float-slow" />
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {scholarships.length - currentIndex} scholarships remaining
            </span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">Find Your Perfect Match</h1>
          <p className="text-muted-foreground">Swipe up to save, down to pass, tap heart to like</p>
        </div>

        {/* Stats */}
        <SwipeStats
          saved={savedCount}
          passed={passedCount}
          liked={likedCount}
        />

        {/* Card Stack - TikTok style vertical */}
        <div className="relative" style={{ height: "calc(100vh - 400px)", minHeight: "500px" }}>
          {scholarships.slice(currentIndex, currentIndex + 2).map((scholarship, index) => (
            <SwipeCard
              key={scholarship.id}
              scholarship={scholarship}
              isTop={index === 0}
              stackPosition={index}
              swipeDirection={index === 0 ? swipeDirection : null}
              onSwipe={index === 0 ? handleSwipe : undefined}
              onLike={index === 0 ? handleLike : undefined}
            />
          ))}
        </div>

        {/* Keyboard hint */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>Use arrow keys: ↓ to pass, ↑ to save, Space or L to like</p>
        </div>
      </div>

      {/* Celebration overlay */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
          <div className="animate-scale-in">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur-3xl opacity-50 animate-pulse" />
              <div className="relative glass-card-advanced rounded-3xl p-8 text-center space-y-4">
                <div className="text-6xl animate-bounce-subtle">❤️</div>
                <div className="font-display text-2xl font-bold text-gradient-animate">Liked!</div>
                <p className="text-muted-foreground">Added to your favorites</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
