"use client"

import { useState } from "react"
import { Trash2, Clock, DollarSign, ExternalLink, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Scholarship {
  id: number
  title: string
  organization: string
  amount: number
  deadline: string
  applicationUrl: string
  winProbability: number
  tags: string[]
  description: string
  savedAt: string
}

interface SavedScholarshipCardProps {
  scholarship: Scholarship
  onRemove: (id: number) => void
  isRemoving: boolean
}

export default function SavedScholarshipCard({ scholarship, onRemove, isRemoving }: SavedScholarshipCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const daysUntilDeadline = Math.ceil(
    (new Date(scholarship.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
  )

  const handleRemoveClick = () => {
    if (showConfirm) {
      onRemove(scholarship.id)
    } else {
      setShowConfirm(true)
      setTimeout(() => setShowConfirm(false), 3000)
    }
  }

  return (
    <div
      className={`relative group transition-all duration-500 ${
        isRemoving ? "opacity-0 scale-95" : "opacity-100 scale-100"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="glass-card-advanced rounded-3xl p-6 space-y-4 hover-lift transition-all duration-300">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-display text-xl font-bold mb-1 text-balance leading-tight">{scholarship.title}</h3>
            <p className="text-sm text-muted-foreground">{scholarship.organization}</p>
          </div>
          <Button
            variant={showConfirm ? "destructive" : "ghost"}
            size="icon"
            className={`flex-shrink-0 transition-all duration-300 ${showConfirm ? "animate-pulse scale-110" : ""}`}
            onClick={handleRemoveClick}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Win Probability Badge */}
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Win Probability</span>
            <span className="font-display text-3xl font-bold text-gradient-animate">{Math.round(scholarship.winProbability * 100)}%</span>
          </div>
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-secondary to-accent rounded-full transition-all duration-1000 ease-out"
              style={{
                width: isHovered ? `${Math.round(scholarship.winProbability * 100)}%` : "0%",
              }}
            />
          </div>
        </div>

        {/* Amount and Deadline */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl border border-primary/10">
            <DollarSign className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="font-bold text-primary truncate">${scholarship.amount.toLocaleString()}</p>
            </div>
          </div>
          <div
            className={`flex items-center gap-2 p-3 rounded-xl border ${
              daysUntilDeadline <= 7 ? "bg-destructive/5 border-destructive/20" : "bg-secondary/5 border-secondary/10"
            }`}
          >
            <Clock
              className={`w-4 h-4 flex-shrink-0 ${daysUntilDeadline <= 7 ? "text-destructive" : "text-secondary"}`}
            />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Deadline</p>
              <p className={`font-bold truncate ${daysUntilDeadline <= 7 ? "text-destructive" : ""}`}>
                {daysUntilDeadline} days
                {daysUntilDeadline <= 7 && <span className="ml-1">⚠️</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{scholarship.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {scholarship.tags.slice(0, 3).map((tag, i) => (
            <div
              key={i}
              className="px-3 py-1 bg-background/80 backdrop-blur-sm rounded-lg border border-border text-xs font-medium transition-transform hover:scale-105"
            >
              {tag}
            </div>
          ))}
          {scholarship.tags.length > 3 && (
            <div className="px-3 py-1 bg-muted rounded-lg text-xs font-medium">+{scholarship.tags.length - 3}</div>
          )}
        </div>

        {/* Saved date */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
          <Calendar className="w-3 h-3" />
          Saved on {new Date(scholarship.savedAt).toLocaleDateString()}
        </div>

        {/* Apply button */}
        <Button 
          className="w-full gap-2 group/btn" 
          size="lg"
          asChild
        >
          <a 
            href={scholarship.applicationUrl || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2"
          >
            Apply Now
            <ExternalLink className="w-4 h-4 transition-transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
          </a>
        </Button>

        {/* Hover glow effect */}
        <div
          className={`absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none -z-10 blur-xl`}
        />
      </div>
    </div>
  )
}
