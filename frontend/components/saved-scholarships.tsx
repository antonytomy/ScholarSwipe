"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Filter, X, Heart, SortAsc } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import SavedScholarshipCard from "@/components/saved-scholarship-card"
import EmptyState from "@/components/empty-state"

interface Scholarship {
  id: number
  title: string
  organization: string
  amount: number
  deadline: string
  winProbability: number
  tags: string[]
  description: string
  savedAt: string
}

const MOCK_SAVED_SCHOLARSHIPS: Scholarship[] = [
  {
    id: 1,
    title: "STEM Excellence Scholarship",
    organization: "National Science Foundation",
    amount: 5000,
    deadline: "2024-12-15",
    winProbability: 87,
    tags: ["STEM", "Undergraduate", "Merit-Based"],
    description:
      "Supporting outstanding students pursuing degrees in Science, Technology, Engineering, and Mathematics.",
    savedAt: "2024-01-15",
  },
  {
    id: 2,
    title: "Future Leaders Award",
    organization: "Leadership Institute",
    amount: 10000,
    deadline: "2024-11-30",
    winProbability: 92,
    tags: ["Leadership", "Community Service", "All Majors"],
    description: "Recognizing students who demonstrate exceptional leadership potential and community engagement.",
    savedAt: "2024-01-14",
  },
  {
    id: 3,
    title: "Women in Technology Grant",
    organization: "Tech Diversity Foundation",
    amount: 7500,
    deadline: "2024-12-01",
    winProbability: 78,
    tags: ["Women", "Technology", "Graduate"],
    description: "Empowering women pursuing careers in technology and computer science fields.",
    savedAt: "2024-01-13",
  },
  {
    id: 4,
    title: "First Generation College Student Award",
    organization: "Education Equity Fund",
    amount: 3000,
    deadline: "2024-11-20",
    winProbability: 85,
    tags: ["First Generation", "Need-Based", "Undergraduate"],
    description: "Supporting first-generation college students in achieving their educational dreams.",
    savedAt: "2024-01-12",
  },
  {
    id: 5,
    title: "Environmental Science Scholarship",
    organization: "Green Future Initiative",
    amount: 6000,
    deadline: "2024-12-10",
    winProbability: 81,
    tags: ["Environmental Science", "Sustainability", "Research"],
    description: "Funding students dedicated to environmental conservation and sustainable practices.",
    savedAt: "2024-01-11",
  },
  {
    id: 6,
    title: "Creative Arts Excellence Award",
    organization: "Arts Foundation",
    amount: 4500,
    deadline: "2024-11-25",
    winProbability: 73,
    tags: ["Arts", "Creative", "Portfolio Required"],
    description: "Celebrating artistic talent and creativity across all visual and performing arts disciplines.",
    savedAt: "2024-01-10",
  },
]

const ALL_TAGS = Array.from(new Set(MOCK_SAVED_SCHOLARSHIPS.flatMap((s) => s.tags)))

export default function SavedScholarships() {
  const [scholarships, setScholarships] = useState<Scholarship[]>(MOCK_SAVED_SCHOLARSHIPS)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<"saved" | "deadline" | "amount" | "probability">("saved")
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [removingId, setRemovingId] = useState<number | null>(null)

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  // Filter and sort scholarships
  const filteredScholarships = useMemo(() => {
    let filtered = scholarships

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter((s) => selectedTags.some((tag) => s.tags.includes(tag)))
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "saved":
          return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
        case "deadline":
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        case "amount":
          return b.amount - a.amount
        case "probability":
          return b.winProbability - a.winProbability
        default:
          return 0
      }
    })

    return filtered
  }, [scholarships, searchQuery, selectedTags, sortBy])

  const handleRemove = (id: number) => {
    setRemovingId(id)
    setTimeout(() => {
      setScholarships((prev) => prev.filter((s) => s.id !== id))
      setRemovingId(null)
    }, 500)
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedTags([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 pt-20">
      {/* Header */}
      <div className="sticky top-20 z-40 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-float">
                <Heart className="w-6 h-6 text-primary-foreground fill-current" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold">Saved Scholarships</h1>
                <p className="text-muted-foreground">
                  {filteredScholarships.length} scholarship{filteredScholarships.length !== 1 ? "s" : ""} saved
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 bg-transparent"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              Filters
              {(selectedTags.length > 0 || searchQuery) && (
                <span className="ml-1 px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs font-bold">
                  {selectedTags.length + (searchQuery ? 1 : 0)}
                </span>
              )}
            </Button>
          </div>

          {/* Search and Sort */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search scholarships..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-lg"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-12 px-4 pr-10 rounded-xl border border-border bg-background appearance-none cursor-pointer hover:border-primary transition-colors"
              >
                <option value="saved">Recently Saved</option>
                <option value="deadline">Deadline (Soonest)</option>
                <option value="amount">Amount (Highest)</option>
                <option value="probability">Win Probability (Highest)</option>
              </select>
              <SortAsc className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Filter Tags */}
          {showFilters && (
            <div className="mt-4 p-4 rounded-2xl bg-muted/50 animate-slide-up-fade">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">Filter by tags:</span>
                {selectedTags.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
                    <X className="w-4 h-4" />
                    Clear all
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {ALL_TAGS.map((tag, i) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-4 py-2 rounded-xl border transition-all duration-300 animate-scale-in ${
                      selectedTags.includes(tag)
                        ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105"
                        : "bg-background border-border hover:border-primary hover:scale-105"
                    }`}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          // Loading skeletons
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-96 rounded-3xl bg-muted/50 animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="p-6 space-y-4">
                  <div className="h-8 bg-muted rounded-xl w-3/4" />
                  <div className="h-4 bg-muted rounded-lg w-1/2" />
                  <div className="h-24 bg-muted rounded-xl" />
                  <div className="flex gap-2">
                    <div className="h-8 bg-muted rounded-lg w-20" />
                    <div className="h-8 bg-muted rounded-lg w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredScholarships.length === 0 ? (
          <EmptyState hasFilters={searchQuery !== "" || selectedTags.length > 0} onClearFilters={clearFilters} />
        ) : (
          // Masonry grid
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {filteredScholarships.map((scholarship, i) => (
              <div
                key={scholarship.id}
                className="break-inside-avoid animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <SavedScholarshipCard
                  scholarship={scholarship}
                  onRemove={handleRemove}
                  isRemoving={removingId === scholarship.id}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
