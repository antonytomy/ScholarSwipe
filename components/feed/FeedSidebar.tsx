"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Rocket,
  Bookmark,
  CheckCircle2,
  Settings,
  Moon,
  Sun,
  UserCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface FeedSidebarProps {
  activeTab: "discover" | "saved" | "applied"
  onTabChange: (tab: "discover" | "saved" | "applied") => void
  savedCount: number
  appliedCount: number
  darkMode: boolean
  onDarkModeToggle: () => void
}

export function FeedSidebar({
  activeTab,
  onTabChange,
  savedCount,
  appliedCount,
  darkMode,
  onDarkModeToggle,
}: FeedSidebarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(e.target as Node)
      ) {
        setSettingsOpen(false)
      }
    }
    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [])

  return (
    <aside className="w-[260px] bg-card border-r border-border flex flex-col flex-shrink-0">
      <div className="p-8 pt-8 pb-6 border-b border-border">
        <Link href="/" className="block">
          <div className="relative w-full max-w-[200px] h-10">
            <Image
              src="/placeholder-logo.svg"
              alt="ScholarSwipe"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
        </Link>
      </div>

      <nav className="p-6 px-4 flex-1">
        <button
          onClick={() => onTabChange("discover")}
          className={cn(
            "w-full flex items-center gap-3 px-5 py-3 mb-2 rounded-[10px] text-[15px] transition-all",
            activeTab === "discover"
              ? "bg-primary text-primary-foreground"
              : "text-foreground hover:bg-muted"
          )}
        >
          <Rocket className="w-5 h-5 shrink-0" />
          Discover
        </button>

        <button
          onClick={() => onTabChange("saved")}
          className={cn(
            "w-full flex items-center gap-3 px-5 py-3 mb-2 rounded-[10px] text-[15px] transition-all relative",
            activeTab === "saved"
              ? "bg-primary text-primary-foreground"
              : "text-foreground hover:bg-muted"
          )}
        >
          <Bookmark className="w-5 h-5 shrink-0" />
          Saved
          {savedCount > 0 && (
            <span className="ml-auto bg-secondary text-primary px-2 py-0.5 rounded-xl text-xs font-semibold">
              {savedCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onTabChange("applied")}
          className={cn(
            "w-full flex items-center gap-3 px-5 py-3 mb-2 rounded-[10px] text-[15px] transition-all relative",
            activeTab === "applied"
              ? "bg-primary text-primary-foreground"
              : "text-foreground hover:bg-muted"
          )}
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          Applied
          {appliedCount > 0 && (
            <span className="ml-auto bg-emerald-500 text-white px-2 py-0.5 rounded-xl text-xs font-semibold">
              {appliedCount}
            </span>
          )}
        </button>
      </nav>

      <div
        ref={settingsRef}
        className="p-4 border-t border-border relative"
      >
        <button
          onClick={() => setSettingsOpen((o) => !o)}
          className="w-full flex items-center gap-3 px-5 py-3 rounded-[10px] text-[15px] text-foreground hover:bg-muted transition-all"
        >
          <Settings className="w-5 h-5 shrink-0" />
          Settings
        </button>

        <div
          className={cn(
            "absolute bottom-full left-4 right-4 bg-card border border-border rounded-[10px] shadow-xl p-2 transition-all duration-200",
            settingsOpen
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-2.5 pointer-events-none"
          )}
        >
          <button
            onClick={() => {
              onDarkModeToggle()
              setSettingsOpen(false)
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-foreground hover:bg-muted transition-all text-left"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 shrink-0" />
            ) : (
              <Moon className="w-5 h-5 shrink-0" />
            )}
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
          <Link
            href="/signup"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-foreground hover:bg-muted transition-all"
          >
            <UserCircle className="w-5 h-5 shrink-0" />
            View Profile
          </Link>
        </div>
      </div>
    </aside>
  )
}
