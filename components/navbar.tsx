"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, ChevronDown, UserCircle, Bookmark, Rocket, Settings, LogOut } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { user, loading, signOut } = useAuth()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "U"
  const swipeLabel = user ? "Swipe" : "Try Swiping"
  const handleSignOut = async () => {
    try {
      setIsDropdownOpen(false)
      setIsMobileMenuOpen(false)
      await signOut()
      window.location.href = "/"
    } catch (error) {
      console.error("Sign out failed:", error)
    }
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "glass-card-advanced shadow-lg" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center group cursor-pointer">
            <Image
              src="/logo.png"
              alt="Scholar Swipe - The Best Scholarship Match"
              width={220}
              height={70}
              className="h-14 w-auto drop-shadow-sm transition-transform group-hover:scale-[1.02]"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="/#features" className="text-foreground hover:text-primary transition-colors font-medium">
              Features
            </a>
            <a href="/#how-it-works" className="text-foreground hover:text-primary transition-colors font-medium">
              How It Works
            </a>
            <Link href="/about" className="text-foreground hover:text-primary transition-colors font-medium">
              About
            </Link>
            <Link href="/swipe" className="text-foreground hover:text-primary transition-colors font-medium">
              {swipeLabel}
            </Link>
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-3 min-w-[300px] justify-end">
            {loading ? (
              <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-muted transition-all duration-200 border border-transparent hover:border-border"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground text-sm font-bold shadow-md">
                    {userInitials}
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-card rounded-xl border border-border shadow-xl py-2 animate-fade-in-up z-50">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-semibold truncate">{user.email}</p>
                      <p className="text-xs text-muted-foreground">Logged in</p>
                    </div>

                    {/* Navigation links */}
                    <div className="py-1">
                      <Link
                        href="/swipe"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                      >
                        <Rocket className="w-4 h-4 text-primary" />
                        Discover
                      </Link>
                      <Link
                        href="/swipe?tab=saved"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                      >
                        <Bookmark className="w-4 h-4 text-amber-500" />
                        Saved
                      </Link>
                      <Link
                        href="/profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                      >
                        <UserCircle className="w-4 h-4 text-muted-foreground" />
                        Profile
                      </Link>
                    </div>

                    {/* Sign Out */}
                    <div className="border-t border-border pt-1">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm w-full text-left hover:bg-red-50 hover:text-red-600 transition-colors rounded-b-xl"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Button
                  asChild
                  className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30"
                >
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button
                  asChild
                  className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30"
                >
                  <Link href="/signup">Get Started Free</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pt-4 pb-2 space-y-3 animate-fade-in-up bg-white rounded-2xl mt-4 px-4 shadow-xl border border-border">
            <a
              href="/#features"
              className="block py-2 text-foreground hover:text-primary transition-colors font-medium"
            >
              Features
            </a>
            <a
              href="/#how-it-works"
              className="block py-2 text-foreground hover:text-primary transition-colors font-medium"
            >
              How It Works
            </a>
            <Link href="/about" className="block py-2 text-foreground hover:text-primary transition-colors font-medium">
              About
            </Link>
            <Link href="/swipe" className="block py-2 text-foreground hover:text-primary transition-colors font-medium">
              {swipeLabel}
            </Link>
            
            {/* Mobile Authentication Buttons */}
            <div className="pt-3 space-y-2">
              {loading ? (
                <div className="flex justify-center py-2">
                  <div className="w-6 h-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : user ? (
                <>
                  <div className="flex items-center gap-3 px-2 py-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground text-xs font-bold">
                      {userInitials}
                    </div>
                    <span className="text-sm font-medium truncate">{user.email}</span>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  >
                    <Link href="/swipe?tab=saved">Saved</Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300"
                  >
                    <Link href="/swipe">Swipe</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full"
                  >
                    <Link href="/profile">Profile</Link>
                  </Button>
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    size="sm"
                    className="w-full hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all duration-300"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href="/signup">Get Started Free</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
