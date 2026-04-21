"use client"

import { Bookmark, Send, ExternalLink } from "lucide-react"
import { MatchPanel } from "./MatchPanel"
import type {
  FeedScholarship,
  UserProfileData,
  EligibilityResult,
} from "@/lib/feed-types"
import { cn } from "@/lib/utils"

interface FeedCardProps {
  scholarship: FeedScholarship
  userData: UserProfileData
  isSaved: boolean
  isApplied: boolean
  onToggleSave: (id: number) => void
  onShare: (title: string) => void
  onApply: (id: number, link: string) => void
}

function computeEligibility(
  s: FeedScholarship,
  user: UserProfileData
): EligibilityResult[] {
  return [
    {
      label: "GPA Min: " + s.reqs.gpa,
      pass: user.gpa >= s.reqs.gpa,
    },
    {
      label: "Major: " + s.reqs.major,
      pass: user.major === s.reqs.major,
    },
    {
      label: "Level: " + s.reqs.year,
      pass: user.year === s.reqs.year,
    },
    {
      label: "Region: " + s.reqs.location,
      pass:
        s.reqs.location === "USA" ||
        s.reqs.location === "Global" ||
        user.location === s.reqs.location,
    },
  ]
}

export function FeedCard({
  scholarship,
  userData,
  isSaved,
  isApplied,
  onToggleSave,
  onShare,
  onApply,
}: FeedCardProps) {
  const results = computeEligibility(scholarship, userData)
  const score = Math.round(
    (results.filter((r) => r.pass).length / results.length) * 100
  )

  return (
    <div className="snap-start min-h-[100vh] grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-center px-6 md:px-12 max-w-[1200px] mx-auto py-6">
      <div
        className="rounded-[28px] overflow-hidden shadow-2xl relative h-[calc(100vh-48px)] max-h-[900px]"
        style={{ background: scholarship.gradient }}
      >
        <div className="relative z-10 h-full overflow-y-auto native-panel-scroll">
          <div className="p-10 md:p-9 pb-32 text-white flex flex-col min-h-full">
          <div className="flex flex-wrap gap-2 mb-8">
            {scholarship.tags.map((t) => (
              <span
                key={t}
                className="bg-white/15 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-[20px] text-xs uppercase tracking-wider font-semibold"
              >
                {t}
              </span>
            ))}
          </div>

          <div className="text-amber-400 text-5xl md:text-[56px] font-extrabold mb-4 tracking-tight">
            {scholarship.amount}
          </div>

          <h2 className="text-2xl md:text-[28px] font-bold mb-2">
            {scholarship.title}
          </h2>
          <p className="text-[15px] opacity-90 mb-6">{scholarship.desc}</p>

          <div className="mb-6 pb-6 border-b border-white/10">
            <p className="text-[11px] uppercase tracking-[2px] opacity-70 mb-2">
              Full requirements
            </p>
            <p className="text-sm leading-relaxed opacity-90">
              {scholarship.requirements}
            </p>
          </div>

          <div className="mb-6">
            <p className="text-[11px] uppercase tracking-[2px] opacity-70 mb-2">
              Application deadline
            </p>
            <p className="text-lg font-medium">{scholarship.deadline}</p>
          </div>
          </div>

          <div className="sticky bottom-0 left-0 right-0 z-10 p-4 md:p-5 bg-gradient-to-t from-slate-950/95 via-slate-950/88 to-transparent backdrop-blur-xl border-t border-white/10">
            <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onToggleSave(scholarship.id)}
              className={cn(
                "h-14 sm:w-14 rounded-2xl flex items-center justify-center text-xl transition-all",
                isSaved
                  ? "bg-amber-400 border-amber-400 text-primary"
                  : "bg-white/15 backdrop-blur-md border border-white/20 text-white hover:bg-white/25 hover:scale-105"
              )}
            >
              <Bookmark
                className={cn("w-5 h-5", isSaved && "fill-current")}
              />
            </button>
            <button
              onClick={() => onShare(scholarship.title)}
              className="h-14 sm:w-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white flex items-center justify-center text-xl hover:bg-white/25 hover:scale-105 transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
            <button
              onClick={() => onApply(scholarship.id, scholarship.link)}
              className={cn(
                "flex-1 py-4 px-8 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2",
                isApplied
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "bg-white text-primary hover:bg-amber-400 hover:scale-[1.02]"
              )}
            >
              {isApplied ? (
                <>
                  <span className="w-4 h-4 rounded-full bg-white/30" />
                  Applied
                </>
              ) : (
                "Apply Now"
              )}
            </button>
            </div>
          </div>
        </div>
      </div>

      <MatchPanel scholarship={scholarship} results={results} score={score} />
    </div>
  )
}
