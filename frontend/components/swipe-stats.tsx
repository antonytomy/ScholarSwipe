"use client"

import { Heart, X, Layers, ThumbsUp } from "lucide-react"

interface SwipeStatsProps {
  saved: number
  passed: number
  liked?: number
}

export default function SwipeStats({ saved, passed, liked = 0 }: SwipeStatsProps) {
  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
      <div className="flex gap-6 bg-black/20 backdrop-blur-sm rounded-full px-6 py-3 border border-white/10">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-red-400" />
          <span className="text-white font-medium">{saved}</span>
        </div>
        <div className="flex items-center gap-2">
          <X className="w-4 h-4 text-gray-400" />
          <span className="text-white font-medium">{passed}</span>
        </div>
        <div className="flex items-center gap-2">
          <ThumbsUp className="w-4 h-4 text-yellow-400" />
          <span className="text-white font-medium">{liked}</span>
        </div>
      </div>
    </div>
  )
}
