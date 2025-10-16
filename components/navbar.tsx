"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
              width={200}
              height={60}
              className="h-12 w-auto"
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
            <a href="/#about" className="text-foreground hover:text-primary transition-colors font-medium">
              About
            </a>
            <Link href="/swipe" className="text-foreground hover:text-primary transition-colors font-medium">
              Try Swiping
            </Link>
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-3">
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
            <a href="/#about" className="block py-2 text-foreground hover:text-primary transition-colors font-medium">
              About
            </a>
            <Link href="/swipe" className="block py-2 text-foreground hover:text-primary transition-colors font-medium">
              Try Swiping
            </Link>
            <div className="pt-3 space-y-2">
              <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/signup">Get Started Free</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
