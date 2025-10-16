"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { GraduationCap, Sparkles, X, Heart, ArrowUp } from "lucide-react"
import SwipeCard from "@/components/swipe-card"
import SwipeStats from "@/components/swipe-stats"
import { Scholarship } from "@/lib/types"

export default function SwipeInterface() {
  const [scholarships, setScholarships] = useState<(Scholarship & {
    winProbability: number
    tags: string[]
    matchReasons: string[]
  })[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [savedCount, setSavedCount] = useState(0)
  const [passedCount, setPassedCount] = useState(0)
  const [likedCount, setLikedCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  // Fetch scholarships from API
  useEffect(() => {
    fetchScholarships()
  }, [])

  const fetchScholarships = async (offset = 0) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/scholarships?offset=${offset}&limit=10`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch scholarships')
      }
      
      const data = await response.json()
      
      // Transform API data to match component expectations
      const transformedScholarships = data.map((scholarship: any) => ({
        ...scholarship,
        // Generate mock win probability for now (will be replaced with AI matching)
        winProbability: Math.floor(Math.random() * 30) + 70, // 70-100%
        tags: scholarship.categories || [],
        matchReasons: [
          "Profile matches scholarship criteria",
          "Strong academic performance",
          "Extracurricular activities align with requirements"
        ]
      }))
      
      setScholarships(transformedScholarships)
      
    } catch (error) {
      console.error('Error fetching scholarships:', error)
      setError('Failed to load scholarships. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const saveSwipeAction = async (scholarshipId: string, action: 'saved' | 'passed' | 'liked') => {
    try {
      // Get auth token from Supabase
      const { data: { session } } = await import('@/lib/supabase').then(m => m.supabase.auth.getSession())
      
      if (!session) {
        console.error('No active session')
        return
      }

      const response = await fetch('/api/swipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          scholarship_id: scholarshipId,
          action
        })
      })

      if (!response.ok) {
        console.error('Failed to save swipe action')
      }
    } catch (error) {
      console.error('Error saving swipe action:', error)
    }
  }

  const handleSwipe = (direction: 'left' | 'right') => {
    if (currentIndex >= scholarships.length || isAnimating) return

    const currentScholarship = scholarships[currentIndex]
    const action = direction === 'right' ? 'liked' : 'passed'
    
    // Save the action
    saveSwipeAction(currentScholarship.id, action)
    
    // Update counts
    if (direction === 'right') {
      setLikedCount(prev => prev + 1)
    } else {
      setPassedCount(prev => prev + 1)
    }

    // Move to next scholarship
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
    }, 300)
  }

  const handleLike = () => {
    if (currentIndex >= scholarships.length || isAnimating) return

    const currentScholarship = scholarships[currentIndex]
    
    // Save the action
    saveSwipeAction(currentScholarship.id, 'liked')
    
    // Update count
    setLikedCount(prev => prev + 1)

    // Move to next scholarship after delay
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
    }, 1000)
  }

  const handleSave = () => {
    if (currentIndex >= scholarships.length || isAnimating) return

    const currentScholarship = scholarships[currentIndex]
    
    // Save the action
    saveSwipeAction(currentScholarship.id, 'saved')
    
    // Update count
    setSavedCount(prev => prev + 1)

    // Move to next scholarship
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
    }, 300)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (currentIndex >= scholarships.length) return
    
    switch (e.key) {
      case 'ArrowLeft':
        handleSwipe('left')
        break
      case 'ArrowRight':
        handleSwipe('right')
        break
      case 'ArrowUp':
        handleSave()
        break
      case ' ':
        e.preventDefault()
        handleLike()
        break
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen px-4 py-8 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center animate-spin">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <p className="text-lg text-muted-foreground">Loading scholarships...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen px-4 py-8 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-lg text-red-600">{error}</p>
          <Button 
            onClick={() => fetchScholarships()}
            className="bg-gradient-to-r from-primary to-secondary"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

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
                fetchScholarships()
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
    <div 
      className="min-h-screen px-4 py-8 relative"
      onKeyDown={handleKeyPress}
      tabIndex={0}
    >
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float-slow" />
      </div>

      {/* Header */}
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Find Your Perfect Match
        </h1>
        <p className="text-lg text-muted-foreground">
          Swipe through scholarships matched to your profile
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8">
        <SwipeStats saved={savedCount} passed={passedCount} liked={likedCount} />
      </div>

      {/* Card Stack */}
      <div className="relative mx-auto max-w-md" style={{ height: "calc(100vh - 400px)" }}>
        {scholarships.slice(currentIndex, currentIndex + 3).map((scholarship, index) => (
          <SwipeCard
            key={scholarship.id}
            scholarship={scholarship}
            isTop={index === 0}
            onSwipe={handleSwipe}
            onLike={handleLike}
            onSave={handleSave}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-6 mt-8">
        <Button
          size="lg"
          variant="outline"
          className="w-16 h-16 rounded-full border-2 border-red-500 text-red-500 hover:bg-red-50 hover:scale-110 transition-all duration-200 disabled:opacity-50"
          onClick={() => handleSwipe('left')}
          disabled={isAnimating || currentIndex >= scholarships.length}
        >
          <X className="w-6 h-6" />
        </Button>

        <Button
          size="lg"
          className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary text-white hover:scale-110 transition-all duration-200 disabled:opacity-50"
          onClick={handleSave}
          disabled={isAnimating || currentIndex >= scholarships.length}
        >
          <ArrowUp className="w-6 h-6" />
        </Button>

        <Button
          size="lg"
          variant="outline"
          className="w-16 h-16 rounded-full border-2 border-green-500 text-green-500 hover:bg-green-50 hover:scale-110 transition-all duration-200 disabled:opacity-50"
          onClick={handleLike}
          disabled={isAnimating || currentIndex >= scholarships.length}
        >
          <Heart className="w-6 h-6" />
        </Button>
      </div>

      {/* Keyboard hint */}
      <div className="text-center mt-6 text-sm text-muted-foreground">
        <p>Use ← → arrows to swipe, ↑ to save, or spacebar to like</p>
      </div>
    </div>
  )
}