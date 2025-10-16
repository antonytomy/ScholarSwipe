"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { GraduationCap, Sparkles, X, Heart, ArrowUp } from "lucide-react"
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
  {
    id: 6,
    title: "Global Citizen Scholarship",
    organization: "International Education Fund",
    amount: 15000,
    deadline: "September 1, 2025",
    winProbability: 73,
    tags: ["International", "Study Abroad", "Cultural Exchange"],
    description: "Promoting global understanding by funding students interested in international studies or study abroad programs.",
    matchReasons: [
      "Fluent in two foreign languages",
      "Participated in high school exchange program",
      "Essay on global issues was highly rated",
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
    if (isAnimating || currentIndex >= scholarships.length) return

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
      setCurrentIndex((prev) => prev + 1)
      setIsAnimating(false)
      setSwipeDirection(null)
    }, 500)
  }

  const handleLike = () => {
    if (isAnimating || currentIndex >= scholarships.length) return
    setLikedCount((prev) => prev + 1)
    // Show brief animation
    setShowCelebration(true)
    setTimeout(() => setShowCelebration(false), 1000)
    
    // Advance to next card after liking (like a swipe action)
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1)
    }, 500)
  }

  const handleKeyPress = (e: KeyboardEvent) => {
    if (currentIndex >= scholarships.length) return
    if (e.key === "ArrowDown") handleSwipe("down")
    if (e.key === "ArrowUp") handleSwipe("up")
    if (e.key === " " || e.key === "l") handleLike()
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [currentIndex, isAnimating])

  // Show friendly message when user runs out of suggested scholarships
  if (currentIndex >= scholarships.length) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-primary via-secondary to-primary flex items-center justify-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-secondary/60 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/60 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/40 rounded-full blur-3xl animate-pulse delay-500" />
          <div className="absolute top-1/6 right-1/6 w-48 h-48 bg-primary/50 rounded-full blur-2xl animate-pulse delay-300" />
          <div className="absolute bottom-1/6 left-1/6 w-56 h-56 bg-secondary/50 rounded-full blur-2xl animate-pulse delay-700" />
        </div>

        <div className="relative z-10 text-center space-y-8 max-w-md mx-auto px-6">
          {/* Dark overlay for better text contrast */}
          <div className="absolute inset-0 -m-6 bg-black/20 backdrop-blur-sm rounded-3xl" />
          {/* Celebration icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl animate-pulse" />
            <div className="relative w-32 h-32 mx-auto bg-gradient-to-br from-secondary to-primary rounded-full flex items-center justify-center shadow-2xl">
              <GraduationCap className="w-16 h-16 text-white" />
            </div>
          </div>

          {/* Main message */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight drop-shadow-2xl">
              Amazing Work! 🎉
            </h1>
            <p className="text-xl text-white leading-relaxed drop-shadow-lg">
              You've reviewed all your personalized scholarship suggestions! 
              Check back soon for new opportunities.
            </p>
          </div>

          {/* Stats summary */}
          <div className="bg-white/25 backdrop-blur-sm rounded-3xl p-6 space-y-4 border border-white/40 shadow-2xl">
            <h3 className="text-lg font-semibold text-white drop-shadow-md">Your Session Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary drop-shadow-md">{savedCount}</div>
                <div className="text-sm text-white/80">Saved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary drop-shadow-md">{likedCount}</div>
                <div className="text-sm text-white/80">Liked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white/70 drop-shadow-md">{passedCount}</div>
                <div className="text-sm text-white/80">Passed</div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-4">
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-secondary to-primary hover:from-secondary/90 hover:to-primary/90 text-white font-semibold py-4 rounded-2xl transition-all duration-300 hover:scale-105 shadow-2xl"
              onClick={() => {
                setCurrentIndex(0)
                setSavedCount(0)
                setPassedCount(0)
                setLikedCount(0)
              }}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Start Fresh Session
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full bg-white/25 border-white/40 text-white hover:bg-white/35 py-4 rounded-2xl backdrop-blur-sm shadow-lg"
              onClick={() => window.location.href = '/saved'}
            >
              View Saved Scholarships
            </Button>
          </div>

          {/* Encouraging message */}
          <p className="text-sm text-white drop-shadow-md">
            New scholarships are added regularly. Keep checking back for fresh opportunities! ✨
          </p>
        </div>
      </div>
    )
  }

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
            <span className="text-sm font-medium text-primary">Find Your Perfect Match</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">Swipe Through Scholarships</h1>
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
          {scholarships.slice(currentIndex, currentIndex + 3).map((scholarship, index) => (
            <SwipeCard
              key={`${scholarship.id}-${currentIndex + index}`}
              scholarship={scholarship}
              isTop={index === 0}
              stackPosition={index}
              swipeDirection={index === 0 ? swipeDirection : null}
              onSwipe={index === 0 ? handleSwipe : undefined}
              onLike={index === 0 ? handleLike : undefined}
            />
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleSwipe("down")}
            disabled={isAnimating || currentIndex >= scholarships.length}
            className="rounded-full w-16 h-16 hover:bg-red-50 hover:border-red-200"
          >
            <X className="w-8 h-8 text-red-500" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleLike}
            disabled={isAnimating || currentIndex >= scholarships.length}
            className="rounded-full w-16 h-16 hover:bg-yellow-50 hover:border-yellow-200"
          >
            <Heart className="w-8 h-8 text-yellow-500" />
          </Button>
          <Button
            size="lg"
            onClick={() => handleSwipe("up")}
            disabled={isAnimating || currentIndex >= scholarships.length}
            className="rounded-full w-16 h-16 bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:scale-105 transition-all"
          >
            <ArrowUp className="w-8 h-8" />
          </Button>
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
              <div className="absolute inset-0 bg-gradient-to-r from-secondary to-primary rounded-full blur-3xl opacity-60 animate-pulse" />
              <div className="relative glass-card-advanced rounded-3xl p-8 text-center space-y-4 shadow-2xl">
                <div className="text-6xl animate-bounce-subtle">❤️</div>
                <div className="font-display text-2xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">Liked!</div>
                <p className="text-muted-foreground">Added to your favorites</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
