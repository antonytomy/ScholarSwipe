"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, LogOut } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const { user, loading, signOut } = useAuth()

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

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
              alt="ScholarSwipe - The Best Scholarship Match"
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
              {(!isClient || loading || !user) ? "Try Swiping" : "Go to Swipe"}
            </Link>
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-3 min-w-[300px] justify-end">
            {!isClient || loading ? (
              <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : user ? (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                >
                  <Link href="/saved">Saved</Link>
                </Button>
                <Button
                  asChild
                  className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30"
                >
                  <Link href="/swipe">Swipe</Link>
                </Button>
                <Button
                  onClick={signOut}
                  variant="outline"
                  size="sm"
                  className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all duration-300"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
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
              {(!isClient || loading || !user) ? "Try Swiping" : "Go to Swipe"}
            </Link>
            
            {/* Mobile Authentication Buttons */}
            <div className="pt-3 space-y-2">
              {!isClient || loading ? (
                <div className="flex justify-center py-2">
                  <div className="w-6 h-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : user ? (
                <>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  >
                    <Link href="/saved">Saved</Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300"
                  >
                    <Link href="/swipe">Swipe</Link>
                  </Button>
                  <Button
                    onClick={signOut}
                    variant="outline"
                    size="sm"
                    className="w-full hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all duration-300"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
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
