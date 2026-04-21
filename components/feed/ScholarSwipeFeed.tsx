"use client"

import { useRef } from "react"
import { FeedSidebar } from "./FeedSidebar"
import { FeedCard } from "./FeedCard"
import { SavedOverlay } from "./SavedOverlay"
import { AppliedOverlay } from "./AppliedOverlay"
import { Toast } from "./Toast"
import { NavHint } from "./NavHint"
import { useScholarSwipeFeed } from "@/hooks/useScholarSwipeFeed"

export function ScholarSwipeFeed() {
  const feedRef = useRef<HTMLDivElement>(null)
  const {
    scholarships,
    saved,
    applied,
    savedScholarships,
    appliedScholarships,
    activeTab,
    setActiveTab,
    darkMode,
    setDarkMode,
    userData,
    toggleSave,
    removeApplied,
    shareScholarship,
    applyScholarship,
    toastVisible,
    toastMessage,
    navHintVisible,
  } = useScholarSwipeFeed()

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <FeedSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        savedCount={saved.length}
        appliedCount={applied.length}
        darkMode={darkMode}
        onDarkModeToggle={setDarkMode}
      />

      <Toast message={toastMessage} isVisible={toastVisible} />

      <main
        id="feedContainer"
        ref={feedRef}
        className="flex-1 overflow-y-auto snap-y snap-mandatory scroll-smooth"
      >
        {scholarships.map((s) => (
          <FeedCard
            key={s.id}
            scholarship={s}
            userData={userData}
            isSaved={saved.includes(s.id)}
            isApplied={applied.includes(s.id)}
            onToggleSave={toggleSave}
            onShare={shareScholarship}
            onApply={applyScholarship}
          />
        ))}
      </main>

      <SavedOverlay
        isOpen={activeTab === "saved"}
        onClose={() => setActiveTab("discover")}
        savedScholarships={savedScholarships}
        onRemove={toggleSave}
        onApply={applyScholarship}
      />

      <AppliedOverlay
        isOpen={activeTab === "applied"}
        onClose={() => setActiveTab("discover")}
        appliedScholarships={appliedScholarships}
        onRemove={removeApplied}
      />

      <NavHint isVisible={navHintVisible} />
    </div>
  )
}
