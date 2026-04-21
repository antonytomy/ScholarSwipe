"use client"

import { useState, useCallback, useEffect } from "react"
import type { FeedScholarship, UserProfileData } from "@/lib/feed-types"
import { feedScholarships } from "@/lib/feed-scholarships"

const defaultUserData: UserProfileData = {
  major: "Engineering",
  gpa: 3.8,
  year: "Undergrad",
  location: "PA",
}

export function useScholarSwipeFeed() {
  const [scholarships] = useState<FeedScholarship[]>(feedScholarships)
  const [saved, setSaved] = useState<number[]>([])
  const [applied, setApplied] = useState<number[]>([])
  const [activeTab, setActiveTab] = useState<"discover" | "saved" | "applied">(
    "discover"
  )
  const [darkMode, setDarkMode] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [navHintVisible, setNavHintVisible] = useState(true)
  const [hasScrolled, setHasScrolled] = useState(false)

  const userData = defaultUserData

  const toggleSave = useCallback((id: number) => {
    setSaved((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }, [])

  const removeApplied = useCallback((id: number) => {
    setApplied((prev) => prev.filter((x) => x !== id))
  }, [])

  const shareScholarship = useCallback((title: string) => {
    navigator.clipboard.writeText(`Apply for ${title} on ScholarSwipe!`)
    setToastMessage("Shared to clipboard!")
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2000)
  }, [])

  const applyScholarship = useCallback((id: number, link: string) => {
    setApplied((prev) => (prev.includes(id) ? prev : [...prev, id]))
    window.open(link, "_blank")
  }, [])

  const scrollToNext = useCallback(() => {
    const container = document.getElementById("feedContainer")
    if (container) {
      container.scrollBy({ top: window.innerHeight, behavior: "smooth" })
      if (!hasScrolled) {
        setNavHintVisible(false)
        setTimeout(() => setHasScrolled(true), 800)
      }
    }
  }, [hasScrolled])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return
      // Don't intercept when user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) return
      e.preventDefault()
      scrollToNext()
    }
    document.addEventListener("keydown", handleKeyDown, { passive: false })
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [scrollToNext])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])

  const savedScholarships = scholarships.filter((s) => saved.includes(s.id))
  const appliedScholarships = scholarships.filter((s) => applied.includes(s.id))

  return {
    scholarships,
    saved,
    applied,
    savedScholarships,
    appliedScholarships,
    activeTab,
    setActiveTab,
    darkMode,
    setDarkMode: () => setDarkMode((d) => !d),
    userData,
    toggleSave,
    removeApplied,
    shareScholarship,
    applyScholarship,
    toastVisible,
    toastMessage,
    navHintVisible,
  }
}
