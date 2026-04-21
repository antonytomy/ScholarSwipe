/**
 * TypeScript interfaces for the TikTok-style scholarship feed (from demo2).
 * Supports gradient cards, match scores, eligibility checklists, and user actions.
 */

export interface FeedScholarshipReqs {
  gpa: number
  major: string
  year: string
  location: string
}

export interface FeedScholarship {
  id: number
  title: string
  amount: string
  link: string
  desc: string
  tags: string[]
  gradient: string
  pitch: string
  requirements: string
  deadline: string
  reqs: FeedScholarshipReqs
}

export interface UserProfileData {
  major: string
  gpa: number
  year: string
  location: string
}

export interface EligibilityResult {
  label: string
  pass: boolean
}
