"use client"

import { ChevronLeft, Bookmark } from "lucide-react"
import type { FeedScholarship } from "@/lib/feed-types"
import { cn } from "@/lib/utils"

interface SavedOverlayProps {
  isOpen: boolean
  onClose: () => void
  savedScholarships: FeedScholarship[]
  onRemove: (id: number) => void
  onApply: (id: number, link: string) => void
}

export function SavedOverlay({
  isOpen,
  onClose,
  savedScholarships,
  onRemove,
  onApply,
}: SavedOverlayProps) {
  return (
    <div
      className={cn(
        "fixed top-0 left-0 lg:left-[260px] right-0 bottom-0 bg-background z-[100] transition-transform duration-300 overflow-y-auto",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      <div className="p-8 md:p-10 border-b border-border bg-card sticky top-0 z-10">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-foreground text-[15px] mb-4 py-2"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Feed
        </button>
        <h2 className="text-2xl font-bold">Your Saved Scholarships</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-8 md:p-10">
        {savedScholarships.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
            <Bookmark className="w-16 h-16 mb-5 opacity-50" />
            <h3 className="text-xl font-semibold">No scholarships saved yet.</h3>
          </div>
        ) : (
          savedScholarships.map((s) => (
            <div
              key={s.id}
              className="bg-card border border-border rounded-2xl p-6 relative shadow-sm hover:shadow-md transition-shadow"
            >
              <button
                onClick={() => onRemove(s.id)}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors"
              >
                <span className="sr-only">Remove</span>
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <div className="text-2xl font-extrabold text-primary mb-2">
                {s.amount}
              </div>
              <h3 className="text-lg font-semibold mb-4">{s.title}</h3>
              <button
                onClick={() => onApply(s.id, s.link)}
                className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                Finish App
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
