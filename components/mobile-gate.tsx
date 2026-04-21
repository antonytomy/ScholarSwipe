"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Monitor, Smartphone } from "lucide-react"
import Image from "next/image"

// Routes that are allowed on mobile/tablet
const MOBILE_ALLOWED_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/about",
  "/contact",
  "/terms",
  "/privacy",
  "/auth",
]

export default function MobileGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isMobileBlocked, setIsMobileBlocked] = useState(false)

  useEffect(() => {
    const checkSize = () => {
      const isSmallScreen = window.innerWidth < 1024
      const isBlockedRoute = !MOBILE_ALLOWED_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(route + "/")
      )
      setIsMobileBlocked(isSmallScreen && isBlockedRoute)
    }

    checkSize()
    window.addEventListener("resize", checkSize)
    return () => window.removeEventListener("resize", checkSize)
  }, [pathname])

  if (isMobileBlocked) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          textAlign: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)",
          color: "white",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: 32 }}>
          <Image
            src="/logo.png"
            alt="ScholarSwipe"
            width={180}
            height={50}
            style={{ height: 40, width: "auto" }}
          />
        </div>

        {/* Device illustration */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          marginBottom: 36,
        }}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            opacity: 0.4,
          }}>
            <Smartphone size={48} strokeWidth={1.5} />
            <div style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#ef4444",
            }} />
          </div>

          <div style={{
            fontSize: 28,
            opacity: 0.3,
          }}>
            →
          </div>

          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}>
            <Monitor size={56} strokeWidth={1.5} color="#fbbf24" />
            <div style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#22c55e",
            }} />
          </div>
        </div>

        {/* Heading */}
        <h1 style={{
          fontSize: 26,
          fontWeight: 800,
          marginBottom: 16,
          letterSpacing: -0.5,
          lineHeight: 1.2,
        }}>
          Desktop Experience Only
        </h1>

        {/* Description */}
        <p style={{
          fontSize: 16,
          lineHeight: 1.6,
          maxWidth: 400,
          color: "rgba(255,255,255,0.7)",
          marginBottom: 32,
        }}>
          ScholarSwipe&apos;s full matching experience is designed for desktop browsers.
          Please switch to a laptop or desktop to access your scholarship dashboard.
        </p>

        {/* Pill */}
        <div style={{
          background: "rgba(251, 191, 24, 0.15)",
          border: "1px solid rgba(251, 191, 24, 0.3)",
          borderRadius: 24,
          padding: "12px 28px",
          fontSize: 13,
          fontWeight: 600,
          color: "#fbbf24",
          letterSpacing: 0.5,
        }}>
          📱 Mobile version coming soon
        </div>
      </div>
    )
  }

  return <>{children}</>
}
