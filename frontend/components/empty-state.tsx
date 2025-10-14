"use client"

import { Heart, Search, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface EmptyStateProps {
  hasFilters: boolean
  onClearFilters: () => void
}

export default function EmptyState({ hasFilters, onClearFilters }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in-up">
      <div className="relative mb-8">
        {/* Animated background circles */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-48 h-48 bg-secondary/10 rounded-full blur-2xl animate-pulse delay-300" />
        </div>

        {/* Icon */}
        <div className="relative w-32 h-32 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full animate-pulse" />
          <div className="absolute inset-2 bg-background rounded-full flex items-center justify-center">
            {hasFilters ? (
              <Search className="w-12 h-12 text-muted-foreground" />
            ) : (
              <Heart className="w-12 h-12 text-muted-foreground" />
            )}
          </div>
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-primary animate-bounce-subtle" />
        </div>
      </div>

      {hasFilters ? (
        <>
          <h2 className="font-display text-3xl font-bold mb-3">No scholarships found</h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-md">
            We couldn't find any scholarships matching your filters. Try adjusting your search criteria.
          </p>
          <Button onClick={onClearFilters} size="lg" className="gap-2">
            Clear Filters
            <Sparkles className="w-4 h-4" />
          </Button>
        </>
      ) : (
        <>
          <h2 className="font-display text-3xl font-bold mb-3">No saved scholarships yet</h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-md">
            Start swiping to discover scholarships that match your profile and save your favorites!
          </p>
          <Link href="/swipe">
            <Button size="lg" className="gap-2">
              Start Swiping
              <Sparkles className="w-4 h-4" />
            </Button>
          </Link>
        </>
      )}

      {/* Decorative elements */}
      <div className="mt-12 flex gap-4 opacity-50">
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-2 h-2 rounded-full bg-secondary animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  )
}
