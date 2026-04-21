"use client"

import { Check } from "lucide-react"
import { MAJOR_OPTIONS } from "@/lib/profile-form-options"

type MajorSelectorProps = {
  selectedMajors: string[]
  onToggleMajor: (major: string) => void
  disabled?: boolean
  className?: string
  helperText?: string
}

export function MajorSelector({
  selectedMajors,
  onToggleMajor,
  disabled = false,
  className = "",
  helperText = "Select all that apply. We store majors as a structured list for matching.",
}: MajorSelectorProps) {
  return (
    <div className={`rounded-2xl border border-border/70 p-4 bg-background/70 ${className}`.trim()}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {MAJOR_OPTIONS.map((major) => {
          const selected = selectedMajors.includes(major)

          return (
            <button
              key={major}
              type="button"
              onClick={() => onToggleMajor(major)}
              disabled={disabled}
              aria-pressed={selected}
              className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm text-left transition-colors ${
                selected
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background hover:border-primary/40 hover:bg-primary/5"
              } ${disabled ? "cursor-not-allowed opacity-70" : ""}`.trim()}
            >
              <span>{major}</span>
              <span
                className={`ml-3 inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                  selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30 text-transparent"
                }`}
              >
                <Check className="h-3 w-3" />
              </span>
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{helperText}</p>
    </div>
  )
}
