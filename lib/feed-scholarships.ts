/**
 * Demo scholarship data for the TikTok-style feed.
 * Migrated from demo2/script.js with proper TypeScript typing.
 */

import type { FeedScholarship } from "./feed-types"

export const feedScholarships: FeedScholarship[] = [
  {
    id: 1,
    title: "Future Engineers Grant",
    amount: "$12,500",
    link: "https://www.nsf.gov/funding/education.jsp",
    desc: "Supporting the next wave of technical innovators in the STEM sector.",
    tags: ["STEM", "Full-Time", "Renewable"],
    gradient: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
    pitch: "Your Engineering background makes you a strong candidate for this multi-year technical grant.",
    requirements:
      "Must be enrolled full-time in an ABET-accredited engineering program with a minimum 3.0 GPA. Demonstrate leadership in technical projects or research.",
    deadline: "March 31, 2026",
    reqs: { gpa: 3.0, major: "Engineering", year: "Undergrad", location: "USA" },
  },
  {
    id: 2,
    title: "Global Tech Innovators",
    amount: "$8,000",
    link: "https://www.ieee.org/membership/students/scholarships.html",
    desc: "For students demonstrating exceptional promise in software and systems.",
    tags: ["Software", "Innovation"],
    gradient: "linear-gradient(135deg, #312e81 0%, #4338ca 100%)",
    pitch: "This scholarship targets STEM students with high academic standing like yourself.",
    requirements:
      "Open to students pursuing software engineering, computer science, or related fields. Minimum 3.5 GPA required with demonstrated innovation through projects or research.",
    deadline: "April 20, 2026",
    reqs: { gpa: 3.5, major: "Engineering", year: "Undergrad", location: "Global" },
  },
  {
    id: 3,
    title: "Keystone State STEM",
    amount: "$5,000",
    link: "https://www.pheaa.org/funding-opportunities/state-grant-program/",
    desc: "Exclusively for technical students pursuing degrees within Pennsylvania.",
    tags: ["Regional", "One-Time"],
    gradient: "linear-gradient(135deg, #064e3b 0%, #10b981 100%)",
    pitch: "As a student based in Pennsylvania, you meet the primary residency criteria for this award.",
    requirements:
      "Must be a Pennsylvania resident enrolled in a STEM program at an accredited PA institution. Minimum 3.2 GPA and demonstrated financial need required.",
    deadline: "March 15, 2026",
    reqs: { gpa: 3.2, major: "Engineering", year: "Undergrad", location: "PA" },
  },
  {
    id: 4,
    title: "'Outstanding Undergraduate' Essay Scholarship",
    amount: "$1,000",
    link: "https://scholarships360.org/scholarships/search/outstanding-undergraduate-college-scholarship/",
    desc: "With the $1,000 \"Outstanding Undergraduate\" Essay Scholarship, we aim to help out a lucky undergraduate student who is passionate about their higher education journey and actively looking for ways to fund it.",
    tags: ["Diversity", "Leadership"],
    gradient: "linear-gradient(135deg, #701a75 0%, #d946ef 100%)",
    pitch: "Your profile aligns with the leadership and academic excellence required for this grant.",
    requirements:
      "High School Seniors & College Students + U.S. Citizens, Permanent Residents",
    deadline: "November 30, 2026",
    reqs: {
      gpa: 3.4,
      major: "Any",
      year: "Highschool/Undergrad",
      location: "USA",
    },
  },
]
