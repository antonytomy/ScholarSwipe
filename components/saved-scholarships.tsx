"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Filter, X, Heart, SortAsc } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import SavedScholarshipCard from "@/components/saved-scholarship-card"
import EmptyState from "@/components/empty-state"
import { useAuth } from "@/lib/auth-context"
import { demoScholarships } from "@/lib/demo-scholarships"

interface SavedScholarship {
  id: string
  saved_at: string
  scholarship: {
    id: string
    title: string
    organization?: string
    amount?: number
    deadline?: string
    description?: string
    application_url?: string
    categories: string[]
    requirements: string[]
    winProbability?: number
    matchReasons?: string[]
  }
}

export default function SavedScholarships() {
  const [savedScholarships, setSavedScholarships] = useState<SavedScholarship[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<"saved" | "deadline" | "amount">("saved")
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const { user, loading: authLoading } = useAuth()

  // Fetch saved scholarships or use demo data
  useEffect(() => {
    if (authLoading) return
    
    if (user) {
      // Authenticated user - fetch real saved scholarships
      fetchSavedScholarships()
    } else {
      // Non-authenticated user - show demo saved scholarships
      const demoSaved = demoScholarships.slice(0, 3).map((scholarship, index) => ({
        id: `demo-saved-${index}`,
        saved_at: new Date(Date.now() - index * 86400000).toISOString(), // Recent dates
        scholarship: {
          ...scholarship,
          categories: scholarship.tags,
          requirements: []
        }
      }))
      setSavedScholarships(demoSaved)
      setIsLoading(false)
    }
  }, [user, authLoading])

  const fetchSavedScholarships = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get auth token from Supabase
      const { data: { session } } = await import('@/lib/supabase').then(m => m.supabase.auth.getSession())
      
      if (!session) {
        setError('Please log in to view your saved scholarships')
        return
      }

      const response = await fetch('/api/saved', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch saved scholarships')
      }

      const data = await response.json()
      setSavedScholarships(data)
      
    } catch (error) {
      console.error('Error fetching saved scholarships:', error)
      setError('Failed to load saved scholarships. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Get all unique tags from saved scholarships
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    savedScholarships.forEach(item => {
      item.scholarship.categories?.forEach(tag => tags.add(tag))
    })
    return Array.from(tags)
  }, [savedScholarships])

  // Filter and sort scholarships
  const filteredScholarships = useMemo(() => {
    let filtered = savedScholarships

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.scholarship.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.scholarship.organization && item.scholarship.organization.toLowerCase().includes(searchQuery.toLowerCase())) ||
          item.scholarship.categories.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter((item) => 
        selectedTags.some((tag) => item.scholarship.categories.includes(tag))
      )
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "saved":
          return new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime()
        case "deadline":
          if (!a.scholarship.deadline || !b.scholarship.deadline) return 0
          return new Date(a.scholarship.deadline).getTime() - new Date(b.scholarship.deadline).getTime()
        case "amount":
          const amountA = a.scholarship.amount || 0
          const amountB = b.scholarship.amount || 0
          return amountB - amountA
        default:
          return 0
      }
    })

    return filtered
  }, [savedScholarships, searchQuery, selectedTags, sortBy])

  const handleRemove = async (scholarshipId: string) => {
    setRemovingId(scholarshipId)
    
    // For non-authenticated users, just remove from local demo data
    if (!user) {
      setSavedScholarships(prev => prev.filter(item => item.scholarship.id !== scholarshipId))
      setRemovingId(null)
      return
    }
    
    try {
      // Get auth token from Supabase
      const { data: { session } } = await import('@/lib/supabase').then(m => m.supabase.auth.getSession())
      
      if (!session) {
        console.error('No active session')
        return
      }

      // Remove from saved (update action to 'passed')
      const response = await fetch('/api/swipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          scholarship_id: scholarshipId,
          action: 'passed'
        })
      })

      if (response.ok) {
        // Remove from local state
        setSavedScholarships(prev => prev.filter(item => item.scholarship.id !== scholarshipId))
      }
    } catch (error) {
      console.error('Error removing scholarship:', error)
    } finally {
      setRemovingId(null)
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedTags([])
  }

  // Transform data for the card component
  const transformedScholarships = filteredScholarships.map(item => ({
    id: item.scholarship.id,
    title: item.scholarship.title,
    organization: item.scholarship.organization || 'Unknown Organization',
    amount: item.scholarship.amount || 0,
    deadline: item.scholarship.deadline || '',
    applicationUrl: item.scholarship.application_url || '',
    winProbability: item.scholarship.winProbability || 0.3, // Use actual AI data or fallback
    tags: item.scholarship.categories || [],
    description: item.scholarship.description || '',
    savedAt: item.saved_at,
    matchReasons: item.scholarship.matchReasons || [], // Include match reasons
  }))

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
                {allTags.map((tag, i) => (
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
        ) : error ? (
          // Error state
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-lg text-red-600 mb-4">{error}</p>
            <Button onClick={fetchSavedScholarships} className="bg-gradient-to-r from-primary to-secondary">
              Try Again
            </Button>
          </div>
        ) : transformedScholarships.length === 0 ? (
          <EmptyState hasFilters={searchQuery !== "" || selectedTags.length > 0} onClearFilters={clearFilters} />
        ) : (
          // Masonry grid
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {transformedScholarships.map((scholarship, i) => (
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