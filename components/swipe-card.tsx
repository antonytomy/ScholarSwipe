"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Clock, DollarSign, ArrowUp, ArrowDown, Sparkles, Heart } from "lucide-react"

import { Scholarship } from "@/lib/types"

interface SwipeCardProps {
  scholarship: Scholarship & {
    winProbability: number
    tags: string[]
    matchReasons: string[]
  }
  isTop: boolean
  stackPosition?: number
  onSwipe?: (direction: "left" | "right") => void
  isLiked?: boolean
  isViewedBefore?: boolean
}

export default function SwipeCard({
  scholarship,
  isTop,
  stackPosition = 0,
  onSwipe,
  isLiked = false,
  isViewedBefore = false,
}: SwipeCardProps) {
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  // Calculate days until deadline
  const daysUntilDeadline = Math.ceil(
    (new Date(scholarship.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
  )

  // Simple click handler for heart button
  const handleSave = () => {
    if (!isTop || !onSwipe) return
    setSwipeDirection("right")
    onSwipe("right")
  }

  // Reset swipe direction after animation
  useEffect(() => {
    if (swipeDirection) {
      const timer = setTimeout(() => {
        setSwipeDirection(null)
      }, 400) // Match the transition duration
      return () => clearTimeout(timer)
    }
  }, [swipeDirection])

  // Simple animations
  const getSwipeTransform = () => {
    if (swipeDirection === "left") {
      return "translateX(-120vw) rotate(-15deg) scale(0.8)"
    }
    if (swipeDirection === "right") {
      return "translateX(120vw) rotate(15deg) scale(0.8)"
    }
    return ""
  }

  const getStackStyle = () => {
    if (!isTop) {
      const scale = 1 - stackPosition * 0.08
      const translateY = stackPosition * 20
      const opacity = 1 - stackPosition * 0.3
      return {
        transform: `scale(${scale}) translateY(${translateY}px)`,
        opacity,
        zIndex: 10 - stackPosition,
      }
    }
    return {
      zIndex: 20,
    }
  }

  // No gesture feedback needed
  const rotation = 0
  const opacity = 1

  return (
    <div
      ref={cardRef}
      className="absolute inset-0 transition-all duration-300"
      style={{
        ...getStackStyle(),
        pointerEvents: isTop ? "auto" : "none",
      }}
    >
      {/* Original theme card with TikTok-style improvements */}
        <div
          className={`relative h-full w-full max-w-4xl mx-auto glass-card-advanced rounded-3xl overflow-hidden ${
            isTop ? "hover-lift" : ""
          } ${
            isLiked && isViewedBefore 
              ? "ring-2 ring-purple-500/50 bg-gradient-to-br from-purple-50/20 to-pink-50/20" 
              : isLiked 
                ? "ring-2 ring-pink-500/50 bg-gradient-to-br from-pink-50/20 to-red-50/20" 
                : isViewedBefore 
                  ? "ring-2 ring-blue-500/50 bg-gradient-to-br from-blue-50/20 to-indigo-50/20" 
                  : ""
          }`}
          style={{
            transform: getSwipeTransform(),
            opacity: 1,
            transition: "all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          }}
        >

        {/* Card content - original theme */}
        <div className="relative h-full flex flex-col">
          {/* Win Chance Badge - Top Right */}
          <div className="absolute top-4 right-4 z-10">
            <div className="glass-card-advanced rounded-xl px-3 py-2 text-center">
              <div className="text-2xl font-bold text-gradient-animate">{Math.round(scholarship.winProbability * 100)}%</div>
              <div className="text-xs text-muted-foreground">Win Chance</div>
            </div>
          </div>

          {/* Previously Viewed Badge - Top Left */}
          {isViewedBefore && (
            <div className="absolute top-4 left-4 z-10">
              <div className={`${
                isLiked 
                  ? "bg-green-500/90" 
                  : "bg-gray-500/90"
              } backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg`}>
                <ArrowUp className="w-3 h-3" />
                {isLiked ? "Liked & Viewed" : "Previously Viewed"}
              </div>
            </div>
          )}
          
          {/* Header */}
          <div className="p-6 border-b border-border/50">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary">{scholarship.organization}</span>
              </div>
              <h2 className="text-2xl font-bold leading-tight">{scholarship.title}</h2>
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-lg font-semibold">${scholarship.amount.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Amount</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <div className="text-lg font-semibold">{daysUntilDeadline}d</div>
                  <div className="text-sm text-muted-foreground">Deadline</div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 space-y-4">
            <p className="text-muted-foreground leading-relaxed text-base line-clamp-3">{scholarship.description}</p>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {scholarship.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-primary/10 text-primary text-sm rounded-full border border-primary/20"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* AI Match Reasons */}
            {scholarship.matchReasons && scholarship.matchReasons.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="text-base font-semibold text-primary">Why this matches you:</span>
                </div>
                <div className="space-y-2">
                  {scholarship.matchReasons.map((reason, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary/60 mt-2 flex-shrink-0"></div>
                      <p className="text-base text-muted-foreground leading-relaxed font-medium">{reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-border/50">
            {/* Heart button only */}
            <div className="flex justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleSave()
                }}
                className={`w-12 h-12 rounded-full transition-all duration-200 flex items-center justify-center shadow-lg ${
                  isLiked 
                    ? "bg-gradient-to-r from-pink-600 to-red-600 text-white scale-110 shadow-pink-500/50" 
                    : "bg-gradient-to-r from-pink-500 to-red-500 text-white hover:scale-110"
                }`}
              >
                <Heart className={`w-6 h-6 ${isLiked ? "fill-current" : ""}`} />
              </button>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  )
}