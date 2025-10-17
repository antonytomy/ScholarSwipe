"use client"

import { Heart, X } from "lucide-react"

interface SwipeStatsProps {
  saved: number
  passed: number
}

export default function SwipeStats({ saved, passed }: SwipeStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-6 mb-8 max-w-md mx-auto">
      <div className="glass-card-advanced rounded-2xl p-4 text-center space-y-2 hover-lift">
        <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <Heart className="w-5 h-5 text-primary" />
        </div>
        <div className="text-3xl font-bold text-primary">{saved}</div>
        <div className="text-sm text-muted-foreground">Saved</div>
      </div>

      <div className="glass-card-advanced rounded-2xl p-4 text-center space-y-2 hover-lift">
        <div className="w-10 h-10 mx-auto rounded-full bg-muted flex items-center justify-center">
          <X className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="text-3xl font-bold text-muted-foreground">{passed}</div>
        <div className="text-sm text-muted-foreground">Passed</div>
      </div>
    </div>
  )
}
