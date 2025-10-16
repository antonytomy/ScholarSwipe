"use client"

import { Button } from "@/components/ui/button"
import { Heart, X } from "lucide-react"

interface SwipeControlsProps {
  onPass: () => void
  onSave: () => void
  disabled?: boolean
}

export default function SwipeControls({ onPass, onSave, disabled }: SwipeControlsProps) {
  return (
    <div className="flex items-center justify-center gap-6">
      {/* Pass button */}
      <Button
        size="lg"
        variant="outline"
        disabled={disabled}
        onClick={onPass}
        className="group relative w-20 h-20 rounded-full border-2 border-border bg-background hover:bg-muted hover:scale-110 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
      >
        <X className="w-8 h-8 text-black relative z-10 group-hover:rotate-90 transition-transform duration-300" />
      </Button>

      {/* Save button */}
      <Button
        size="lg"
        disabled={disabled}
        onClick={onSave}
        className="group relative w-24 h-24 rounded-full bg-primary text-white hover:bg-primary/90 hover:scale-110 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-primary/50 disabled:opacity-50 disabled:hover:scale-100"
      >
        <Heart className="w-10 h-10 relative z-10 group-hover:scale-110 transition-transform duration-300 fill-current" />
      </Button>
    </div>
  )
}
