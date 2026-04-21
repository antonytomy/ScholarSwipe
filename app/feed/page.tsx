import { redirect } from "next/navigation"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Discover | ScholarSwipe",
  description:
    "Swipe through scholarships matched to your profile. TikTok-style discovery for your education funding.",
}

export default function FeedPage() {
  redirect("/swipe")
}
