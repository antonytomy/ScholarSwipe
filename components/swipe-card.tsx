"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Clock, DollarSign, Heart, ArrowUp, ArrowDown, Info, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

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
  onLike?: () => void
  onSave?: () => void
}

export default function SwipeCard({
  scholarship,
  isTop,
  stackPosition = 0,
  onSwipe,
  onLike,
  onSave,
}: SwipeCardProps) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const startPos = useRef({ x: 0, y: 0 })

  // Calculate days until deadline
  const daysUntilDeadline = Math.ceil(
    (new Date(scholarship.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
  )

  // TikTok-style gesture handling
  const handleDragStart = (clientX: number, clientY: number) => {
    if (!isTop || !onSwipe) return
    setIsDragging(true)
    startPos.current = { x: clientX, y: clientY }
  }

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging || !isTop) return
    
    const deltaX = clientX - startPos.current.x
    const deltaY = clientY - startPos.current.y
    
    // Allow horizontal swipes for left/right interaction
    setDragOffset({ x: deltaX, y: deltaY })
  }

  const handleDragEnd = () => {
    if (!isDragging || !isTop) return
    setIsDragging(false)
    
    const threshold = 100
    if (Math.abs(dragOffset.x) > threshold) {
      const direction = dragOffset.x < 0 ? "left" : "right"
      setSwipeDirection(direction)
      onSwipe?.(direction)
    }
    
    setDragOffset({ x: 0, y: 0 })
  }

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleDragStart(touch.clientX, touch.clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleDragMove(touch.clientX, touch.clientY)
  }

  const handleTouchEnd = () => {
    handleDragEnd()
  }

  // Mouse events for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    handleDragStart(e.clientX, e.clientY)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleDragMove(e.clientX, e.clientY)
    }
  }

  const handleMouseUp = () => {
    handleDragEnd()
  }

  // Add global mouse events for smooth dragging
  useEffect(() => {
    if (isDragging && isTop) {
      document.addEventListener('mousemove', handleMouseMove as any)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove as any)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isTop])

  // Reset swipe direction after animation
  useEffect(() => {
    if (swipeDirection) {
      const timer = setTimeout(() => {
        setSwipeDirection(null)
      }, 400) // Match the transition duration
      return () => clearTimeout(timer)
    }
  }, [swipeDirection])

  // TikTok-style animations
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

  // Gesture feedback
  const getSwipeFeedback = () => {
    const absY = Math.abs(dragOffset.y)
    if (absY > 50) {
      return dragOffset.y < 0 ? (
        <div className="absolute top-1/2 right-8 transform -translate-y-1/2 z-30">
          <div className="bg-green-500/90 backdrop-blur-sm rounded-full p-4 text-white shadow-lg">
            <ArrowUp className="w-8 h-8" />
            <div className="text-sm font-medium mt-1">SAVE</div>
          </div>
        </div>
      ) : (
        <div className="absolute top-1/2 right-8 transform -translate-y-1/2 z-30">
          <div className="bg-red-500/90 backdrop-blur-sm rounded-full p-4 text-white shadow-lg">
            <ArrowDown className="w-8 h-8" />
            <div className="text-sm font-medium mt-1">PASS</div>
          </div>
        </div>
      )
    }
    return null
  }

  const rotation = isTop ? (dragOffset.y / 10) : 0
  const opacity = isTop ? (1 - Math.abs(dragOffset.y) / 300) : 1

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
        className={`relative h-full glass-card-advanced rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing ${
          isTop ? "hover-lift" : ""
        }`}
        style={{
          transform: isTop && !swipeDirection
            ? `translateY(${dragOffset.y}px) rotate(${rotation}deg)`
            : getSwipeTransform(),
          opacity: isTop && !swipeDirection ? opacity : 1,
          transition: isDragging ? "none" : "all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Gesture feedback */}
        {getSwipeFeedback()}

        {/* Card content - original theme */}
        <div className="relative h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-border/50">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-primary">{scholarship.organization}</span>
                </div>
                <h2 className="text-2xl font-bold leading-tight">{scholarship.title}</h2>
              </div>
              
              {/* Win probability badge */}
              <div className="glass-card-advanced rounded-2xl px-4 py-3 text-center">
                <div className="text-3xl font-bold text-gradient-animate">{scholarship.winProbability}%</div>
                <div className="text-xs text-muted-foreground">Win Chance</div>
              </div>
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">${scholarship.amount.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Amount</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <div className="font-semibold">{daysUntilDeadline}d</div>
                  <div className="text-sm text-muted-foreground">Deadline</div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 space-y-4">
            <p className="text-muted-foreground leading-relaxed">{scholarship.description}</p>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {scholarship.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full border border-primary/20"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Match reasons */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Why this matches you:</h4>
              <ul className="space-y-1">
                {scholarship.matchReasons.slice(0, 3).map((reason, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border/50">
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDetails(!showDetails)
                }}
                className="flex-1"
              >
                <Info className="w-4 h-4 mr-2" />
                Details
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onSave?.()
                }}
                className="flex-1"
              >
                <ArrowUp className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onSave?.()
                }}
                className="flex-1"
              >
                <Heart className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
            
            {/* Swipe hint */}
            <div className="text-center mt-3 text-xs text-muted-foreground">
              Swipe left to pass • Swipe right to save
            </div>
          </div>
        </div>

        {/* Details overlay */}
        {showDetails && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-20 flex items-center justify-center p-6">
            <div className="glass-card-advanced rounded-2xl p-6 max-w-md w-full space-y-4 max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">Why This Matches You</h3>
              <ul className="space-y-3">
                {scholarship.matchReasons.map((reason, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm">{reason}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => setShowDetails(false)}
                className="w-full mt-4"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}