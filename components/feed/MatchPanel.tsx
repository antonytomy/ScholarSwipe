"use client"

import { Puzzle } from "lucide-react"
import type { FeedScholarship, EligibilityResult } from "@/lib/feed-types"

interface MatchPanelProps {
  scholarship: FeedScholarship
  results: EligibilityResult[]
  score: number
}

export function MatchPanel({
  scholarship,
  results,
  score,
}: MatchPanelProps) {
  return (
    <div className="bg-card rounded-3xl p-8 border border-border shadow-lg self-center max-h-[calc(100vh-48px)] overflow-y-auto">
      <div className="inline-block bg-primary text-primary-foreground px-5 py-2 rounded-[20px] text-sm font-semibold uppercase tracking-wide mb-6">
        {score}% Match
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-400 dark:border-amber-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-2xl">
            <Puzzle className="w-6 h-6 text-primary" />
          </div>
          <span className="text-base font-bold text-foreground">
            Why this fits:
          </span>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {scholarship.pitch}
        </p>
      </div>

      <div className="border-t border-border pt-5">
        {results.map((r) => (
          <div
            key={r.label}
            className="flex justify-between items-center py-3.5 border-b border-border last:border-0"
          >
            <span className="text-sm text-foreground">{r.label}</span>
            <span
              className={r.pass ? "status-match" : "status-miss"}
            >
              {r.pass ? "ELIGIBLE" : "NOT MET"}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
