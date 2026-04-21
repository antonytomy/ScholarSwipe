"use client"

import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavHintProps {
  isVisible: boolean
}

export function NavHint({ isVisible }: NavHintProps) {
  return (
    <div
      className={cn(
        "fixed bottom-7 right-8 flex items-center gap-2.5 bg-[#1B3764] px-5 py-2.5 rounded-full border-2 border-[#F5C518] shadow-lg z-50 transition-all duration-500 text-white/90 text-xs font-semibold",
        !isVisible && "opacity-0 translate-y-5"
      )}
    >
      <kbd className="bg-[#F5C518] text-[#1B3764] px-3.5 py-1.5 rounded-lg text-[11px] font-extrabold tracking-wider">
        SPACE
      </kbd>
      <span>Next</span>
      <ChevronDown className="w-4 h-4 animate-bounce" />
    </div>
  )
}
