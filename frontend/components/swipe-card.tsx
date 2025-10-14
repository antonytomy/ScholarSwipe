"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Clock, DollarSign, Info, Target, Sparkles, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Scholarship {
  id: number
  title: string
  organization: string
  amount: number
  deadline: string
  winProbability: number
  tags: string[]
  description: string
  matchReasons: string[]
}

interface SwipeCardProps {
  scholarship: Scholarship
  isTop: boolean
  stackPosition: number
  swipeDirection: "up" | "down" | null
  onSwipe?: (direction: "up" | "down") => void
  onLike?: () => void
}

export default function SwipeCard({
  scholarship,
  isTop,
  stackPosition,
  swipeDirection,
  onSwipe,
  onLike,
}: SwipeCardProps) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const startPos = useRef({ x: 0, y: 0 })

  // Calculate days until deadline
  const daysUntilDeadline = Math.ceil(
    (new Date(scholarship.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
  )

  const handleDragStart = (clientX: number, clientY: number) => {
    if (!isTop || !onSwipe) return
    setIsDragging(true)
    startPos.current = { x: clientX, y: clientY }
  }

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging || !isTop) return
    const deltaX = clientX - startPos.current.x
    const deltaY = clientY - startPos.current.y
    setDragOffset({ x: deltaX, y: deltaY })
  }

  const handleDragEnd = () => {
    if (!isDragging || !isTop || !onSwipe) return
    setIsDragging(false)

    const threshold = 100
    if (Math.abs(dragOffset.y) > threshold) {
      onSwipe(dragOffset.y < 0 ? "up" : "down")
    }
    setDragOffset({ x: 0, y: 0 })
  }

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    handleDragStart(e.clientX, e.clientY)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX, e.clientY)
  }

  const handleMouseUp = () => {
    handleDragEnd()
  }

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX, e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX, e.touches[0].clientY)
  }

  const handleTouchEnd = () => {
    handleDragEnd()
  }

  const rotation = dragOffset.y * 0.05
  const opacity = 1 - Math.abs(dragOffset.y) / 500

  const getSwipeTransform = () => {
    if (swipeDirection === "up") {
      return "translateY(-150%) scale(0.8)"
    }
    if (swipeDirection === "down") {
      return "translateY(150%) scale(0.8)"
    }
    return ""
  }

  const getStackStyle = () => {
    if (!isTop) {
      const scale = 1 - stackPosition * 0.05
      const translateY = stackPosition * 30
      const opacity = 1 - stackPosition * 0.4
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

  return (
    <div
      ref={cardRef}
      className="absolute inset-0 transition-all duration-300"
      style={{
        ...getStackStyle(),
        pointerEvents: isTop ? "auto" : "none",
      }}
    >
      <div
        className={`relative h-full glass-card-advanced rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing ${
          isTop ? "hover-lift" : ""
        }`}
        style={{
          transform:
            isTop && !swipeDirection
              ? `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${rotation}deg)`
              : getSwipeTransform(),
          opacity: isTop && !swipeDirection ? opacity : 1,
          transition: isDragging ? "none" : "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {isTop && (
          <>
            <div
              className="absolute top-8 left-1/2 -translate-x-1/2 z-10 transition-opacity duration-200"
              style={{ opacity: Math.max(0, -dragOffset.y / 150) }}
            >
              <div className="bg-primary/90 backdrop-blur-sm text-primary-foreground px-6 py-3 rounded-2xl font-bold text-xl border-4 border-primary shadow-xl">
                SAVE ↑
              </div>
            </div>
            <div
              className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 transition-opacity duration-200"
              style={{ opacity: Math.max(0, dragOffset.y / 150) }}
            >
              <div className="bg-destructive/90 backdrop-blur-sm text-destructive-foreground px-6 py-3 rounded-2xl font-bold text-xl border-4 border-destructive shadow-xl">
                PASS ↓
              </div>
            </div>
          </>
        )}

        {isTop && onLike && (
          <Button
            size="icon"
            className="absolute top-8 right-8 z-10 w-14 h-14 rounded-full bg-secondary/90 hover:bg-secondary backdrop-blur-sm border-2 border-secondary shadow-xl hover:scale-110 transition-all"
            onClick={(e) => {
              e.stopPropagation()
              onLike()
            }}
          >
            <Heart className="w-6 h-6 text-secondary-foreground" />
          </Button>
        )}

        {/* Card content */}
        <div className="h-full overflow-y-auto p-8 space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="font-display text-3xl font-bold mb-2 text-balance">{scholarship.title}</h2>
                <p className="text-muted-foreground text-lg">{scholarship.organization}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDetails(!showDetails)
                }}
              >
                <Info className="w-5 h-5" />
              </Button>
            </div>

            {/* Amount and deadline */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-xl border border-primary/20">
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="font-bold text-xl text-primary">${scholarship.amount.toLocaleString()}</span>
              </div>
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
                  daysUntilDeadline <= 7
                    ? "bg-destructive/10 border-destructive/20"
                    : "bg-secondary/10 border-secondary/20"
                }`}
              >
                <Clock className={`w-5 h-5 ${daysUntilDeadline <= 7 ? "text-destructive" : "text-secondary"}`} />
                <span className="font-medium">
                  {daysUntilDeadline} days left
                  {daysUntilDeadline <= 7 && <span className="ml-1 animate-pulse">⚠️</span>}
                </span>
              </div>
            </div>
          </div>

          {/* Win probability */}
          <div className="space-y-3 p-6 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl border border-primary/10">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-lg">Your Win Probability</span>
              <span className="font-display text-4xl font-bold text-gradient-animate">
                {scholarship.winProbability}%
              </span>
            </div>
            <div className="relative h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-secondary to-primary rounded-full animate-shimmer"
                style={{ width: `${scholarship.winProbability}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">Based on your profile and past winners</p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {scholarship.tags.map((tag, i) => (
              <div
                key={i}
                className="px-4 py-2 bg-background/80 backdrop-blur-sm rounded-xl border border-border text-sm font-medium animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {tag}
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">About This Scholarship</h3>
            <p className="text-muted-foreground leading-relaxed">{scholarship.description}</p>
          </div>

          {/* Match reasons */}
          {showDetails && (
            <div className="space-y-3 animate-fade-in-up">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Why You're a Great Match
              </h3>
              <div className="space-y-2">
                {scholarship.matchReasons.map((reason, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-4 bg-background/50 rounded-xl hover:bg-background transition-colors animate-slide-in-left"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="w-3 h-3 text-primary-foreground" />
                    </div>
                    <span className="text-sm leading-relaxed">{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading skeleton for next card preview */}
          {!isTop && (
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/50 backdrop-blur-sm" />
          )}
        </div>
      </div>
    </div>
  )
}
