"use client"

import { Suspense } from "react"
import SwipeInterface from "@/components/swipe-interface"

export default function SwipePage() {
  return (
    <Suspense fallback={
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #e2e8f0", borderTop: "3px solid #213e99", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      </div>
    }>
      <SwipeInterface />
    </Suspense>
  )
}
