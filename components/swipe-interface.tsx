"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { GraduationCap, Sparkles, X, Heart, ArrowUp, ArrowDown } from "lucide-react"
import SwipeCard from "@/components/swipe-card"
import SwipeStats from "@/components/swipe-stats"
import { Scholarship } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { demoScholarships } from "@/lib/demo-scholarships"

export default function SwipeInterface() {
  const [scholarships, setScholarships] = useState<(Scholarship & {
    winProbability: number
    tags: string[]
    matchReasons: string[]
  })[]>(demoScholarships)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [savedCount, setSavedCount] = useState(0)
  const [passedCount, setPassedCount] = useState(0)
  const [likedCount, setLikedCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [sessionSwipedIds, setSessionSwipedIds] = useState<Set<string>>(new Set())
  const [sessionHistory, setSessionHistory] = useState<string[]>([]) // Track order of viewed scholarships
  const [likedScholarships, setLikedScholarships] = useState<Set<string>>(new Set()) // Track liked scholarships
  const [sessionScholarships, setSessionScholarships] = useState<any[]>([]) // Store all scholarships seen in session
  const [navigationStack, setNavigationStack] = useState<any[]>([]) // Simple stack for navigation
  const [sessionLoaded, setSessionLoaded] = useState(false) // Prevent unnecessary re-fetching when session is loaded
  const [isNavigating, setIsNavigating] = useState(false) // Prevent conflicts during navigation
  const [isRestoringSession, setIsRestoringSession] = useState(false) // Prevent fetchScholarships during session restoration
  const [sessionRestored, setSessionRestored] = useState(false) // Track if session has been fully restored
  const [sessionRestorationInProgress, setSessionRestorationInProgress] = useState(false) // Prevent multiple restorations
  const [fetchBlocked, setFetchBlocked] = useState(false) // Global fetch blocker
  const [sessionState, setSessionState] = useState<'loading' | 'restoring' | 'restored' | 'fresh'>('loading') // Session state machine
  const [isSessionReady, setIsSessionReady] = useState(false) // Prevent rendering until session is ready
  const [aiProcessing, setAiProcessing] = useState(false) // Track AI processing state
  const { user, session, loading: authLoading } = useAuth()

  // Load session from database on mount
  useEffect(() => {
    console.log('🔄 Session restoration trigger check:', {
      user: !!user,
      session: !!session,
      sessionLoaded,
      sessionState,
      sessionRestorationInProgress
    })
    
    if (user && session && !sessionLoaded && (sessionState === 'loading' || sessionState === 'restoring') && !sessionRestorationInProgress) {
      console.log('🔄 Starting session restoration...')
      setSessionState('restoring')
      setSessionRestorationInProgress(true)
      loadSessionFromDatabase()
    } else if (!user && !authLoading) {
      // For non-authenticated users, use localStorage but only if not already reset
      console.log('🔄 Loading demo session from localStorage...')
      const savedHistory = localStorage.getItem('scholarship-session-history')
      const savedLiked = localStorage.getItem('scholarship-liked-ids')
      const savedSwiped = localStorage.getItem('scholarship-swiped-ids')
      
      if (savedHistory) {
        setSessionHistory(JSON.parse(savedHistory))
      }
      if (savedLiked) {
        setLikedScholarships(new Set(JSON.parse(savedLiked)))
      }
      if (savedSwiped) {
        setSessionSwipedIds(new Set(JSON.parse(savedSwiped)))
      }
    }
  }, [user, session, sessionLoaded, authLoading])

  // Monitor session restoration completion
  useEffect(() => {
    console.log('🔍 Session restoration monitor:', {
      sessionRestored,
      scholarshipsLength: scholarships.length,
      currentIndex,
      isSessionReady,
      sessionState
    })
    
    if (sessionRestored && scholarships.length > 0 && currentIndex >= 0) {
      console.log('🎯 Session restoration verified - state is ready')
      console.log('Current index:', currentIndex)
      console.log('Scholarships length:', scholarships.length)
      console.log('Navigation stack length:', navigationStack.length)
      console.log('✅ Session restoration successful - ready to display')
      
      // Additional verification
      const currentScholarship = scholarships[currentIndex]
      if (currentScholarship) {
        console.log('✅ Current scholarship:', currentScholarship.title)
      }
    }
    // Removed error condition to prevent false positives during normal loading
  }, [sessionRestored, scholarships.length, currentIndex, navigationStack.length, scholarships, isLoading, sessionState, user, sessionRestorationInProgress, sessionLoaded])

  // Monitor scholarships state changes
  useEffect(() => {
    console.log('🎯 Scholarships state changed:', {
      length: scholarships.length,
      currentIndex,
      user: !!user,
      sessionState,
      isLoading
    })
    if (scholarships.length > 0) {
      console.log('🎯 First scholarship:', scholarships[0]?.title)
    }
  }, [scholarships, currentIndex, user, sessionState, isLoading])

  const loadSessionFromDatabase = async () => {
    try {
      // Prevent multiple restorations
      if (sessionRestorationInProgress || sessionRestored) {
        console.log('🚫 Session restoration already in progress or completed, skipping')
        return
      }
      
      // Set global fetch blocker and state machine
      setFetchBlocked(true)
      setIsRestoringSession(true)
      setSessionState('restoring')
      const response = await fetch('/api/sessions', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const sessionData = data.session_data || {}
        
        setSessionHistory(sessionData.history || [])
        console.log('Restored history:', sessionData.history || [])
        setLikedScholarships(new Set(sessionData.liked || []))
        setSessionSwipedIds(new Set(sessionData.swiped || []))
        
        // Restore counters and current index
        setCurrentIndex(sessionData.currentIndex || 0)
        setSavedCount(sessionData.savedCount || 0)
        setPassedCount(sessionData.passedCount || 0)
        setLikedCount(sessionData.likedCount || 0)
        
        // Restore session restored flag
        setSessionRestored(sessionData.sessionRestored || false)
        
        console.log('Restored session state:', {
          currentIndex: sessionData.currentIndex || 0,
          savedCount: sessionData.savedCount || 0,
          passedCount: sessionData.passedCount || 0,
          likedCount: sessionData.likedCount || 0
        })
        
            // Restore session scholarships if available
            if (sessionData.sessionScholarships && sessionData.sessionScholarships.length > 0) {
              // Check if these are demo scholarships (they have IDs starting with "demo-")
              const isDemoData = sessionData.sessionScholarships.some((scholarship: any) => 
                scholarship.id && scholarship.id.startsWith('demo-')
              )
              
              if (isDemoData) {
                console.log('🚫 Found demo scholarships in session data - clearing for authenticated user')
                // Clear demo data and fetch real scholarships
                setSessionScholarships([])
                setScholarships([])
                setSessionRestored(false)
                setSessionState('loading')
                setIsLoading(true)
                setSessionLoaded(true) // Mark session as loaded since we're handling it
                setIsSessionReady(false) // Mark as not ready until real data loads
                setIsRestoringSession(false)
                setSessionRestorationInProgress(false)
                setSessionState('fresh') // Set to fresh state since we're fetching new data
                console.log('🔄 Will fetch real scholarships for authenticated user')
                // Fetch real scholarships immediately
                fetchScholarships(0, true)
                return // Exit early to fetch real scholarships
              }
              
              console.log('Restoring real session scholarships:', sessionData.sessionScholarships.length)
              console.log('Session scholarships data:', sessionData.sessionScholarships)
              setSessionScholarships(sessionData.sessionScholarships)
              
              // Restore navigation stack
              if (sessionData.navigationStack && sessionData.navigationStack.length > 0) {
                setNavigationStack(sessionData.navigationStack)
                console.log('Restored navigation stack:', sessionData.navigationStack.length)
              }
              
              // Mark session as fully restored FIRST to prevent fetchScholarships from overriding
              setSessionRestored(true)
              setSessionState('restored') // Set state machine to restored
              setIsSessionReady(true) // Mark session as ready
              setIsLoading(false) // Stop loading since session is restored
              
              // Use session scholarships as the main display array
              setScholarships(sessionData.sessionScholarships)
              setCurrentIndex(sessionData.currentIndex || 0)
              
              console.log('✅ Session fully restored - scholarships set to:', sessionData.sessionScholarships.length)
              console.log('✅ Current index set to:', sessionData.currentIndex || 0)
              
              // Force a re-render to ensure the correct scholarship is displayed
              setTimeout(() => {
                console.log('🔄 Forcing re-render with correct state')
                // Trigger a state update to ensure React re-renders
                setCurrentIndex(prev => prev)
              }, 100)
              
              // Make sure we're at the right scholarship
              const currentScholarship = sessionData.sessionScholarships[sessionData.currentIndex || 0]
              if (currentScholarship) {
                console.log('Current scholarship after restore:', currentScholarship.title)
                console.log('Current index after restore:', sessionData.currentIndex || 0)
                console.log('Current scholarship ID:', currentScholarship.id)
                console.log('Display array length after restore:', scholarships.length)
                
                // Force a re-render to ensure the correct scholarship is displayed
                setTimeout(() => {
                  console.log('Forcing re-render with correct state')
                }, 100)
              }
              
              // Set session loaded to true to prevent re-fetching
              setSessionLoaded(true)
              
              // Clear the restoration flag immediately - let useEffect handle the verification
              setIsRestoringSession(false)
              setSessionRestorationInProgress(false)
              // Keep fetch blocked since session is restored
            } else {
              console.log('No session scholarships found, fetching new ones')
              setSessionLoaded(true)
              setIsSessionReady(true) // Mark session as ready even if no data
              setSessionState('fresh') // Set state to fresh
              setIsLoading(false) // Stop loading since we're fetching fresh data
              setSessionRestored(true) // Mark as restored
              setIsRestoringSession(false)
              setSessionRestorationInProgress(false)
              // Fetch new scholarships since there's no session data
              fetchScholarships(0, true)
            }
      }
    } catch (error) {
      console.error('Error loading session from database:', error)
      setIsRestoringSession(false)
      setSessionRestorationInProgress(false)
      setFetchBlocked(false) // Unblock fetch on error
      setIsLoading(false) // Stop loading on error
    }
  }

  const saveSessionToDatabase = async () => {
    if (!user || !session) return
    
    try {
      const sessionData = {
        history: sessionHistory,
        liked: [...likedScholarships],
        swiped: [...sessionSwipedIds],
        currentIndex,
        savedCount,
        passedCount,
        likedCount,
        sessionScholarships: sessionScholarships.length > 0 && !sessionScholarships.some(s => s.id?.startsWith('demo-')) ? sessionScholarships : 
                           scholarships.length > 0 && !scholarships.some(s => s.id?.startsWith('demo-')) ? scholarships : [],
        navigationStack: navigationStack,
        sessionRestored: sessionRestored
      }
      
      console.log('Saving session data:', {
        historyLength: sessionHistory.length,
        currentIndex,
        scholarshipsCount: sessionData.sessionScholarships.length
      })

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ session_data: sessionData })
      })

      if (!response.ok) {
        console.warn('Session save failed, but continuing...')
      }
    } catch (error) {
      console.error('Error saving session to database:', error)
    }
  }

  // Save session to database whenever it changes (for authenticated users)
  useEffect(() => {
    if (user && session && sessionLoaded && !isNavigating) {
      // Debounce the save to prevent too many API calls
      const timeoutId = setTimeout(() => {
        saveSessionToDatabase()
      }, 1000) // Wait 1 second before saving
      
      return () => clearTimeout(timeoutId)
    } else if (!user) {
      // For non-authenticated users, use localStorage
      localStorage.setItem('scholarship-session-history', JSON.stringify(sessionHistory))
      localStorage.setItem('scholarship-liked-ids', JSON.stringify([...likedScholarships]))
      localStorage.setItem('scholarship-swiped-ids', JSON.stringify([...sessionSwipedIds]))
    }
  }, [sessionHistory, likedScholarships, sessionSwipedIds, currentIndex, savedCount, passedCount, likedCount, sessionLoaded, isNavigating])

  // Fetch scholarships from API or use demo data
  useEffect(() => {
    console.log('Auth state changed:', { user: !!user, session: !!session, authLoading })
    
    if (authLoading) return
    
    if (user && session) {
      // Authenticated user - NEVER call fetchScholarships directly
      // Session restoration will handle loading scholarships
      console.log('User is authenticated, session restoration will handle loading')
      
      // Clear any demo data that might be in state
      if (scholarships.some(s => s.id?.startsWith('demo-'))) {
        console.log('🧹 Clearing demo data for authenticated user')
        setScholarships([])
        setSessionScholarships([])
      }
    } else if (!user || !session) {
      // Non-authenticated user OR logged out - ALWAYS reset to demo mode
      console.log('User logged out or not authenticated, immediately resetting to demo mode')
      
      // Clear all user-specific state immediately
      setScholarships(demoScholarships)
      setSessionScholarships(demoScholarships) // Use demo scholarships as session scholarships too
      setSessionHistory([])
      setNavigationStack([])
      setCurrentIndex(0)
      setSavedCount(0)
      setPassedCount(0)
      setLikedCount(0)
      setSessionLoaded(true) // Mark as loaded for demo mode
      setSessionRestored(true) // Mark as restored for demo mode
      setSessionRestorationInProgress(false)
      setIsRestoringSession(false)
      setSessionState('restored') // Set to restored state for demo mode
      setIsSessionReady(true)
      setIsLoading(false)
      
      console.log('✅ Immediate reset to demo mode complete')
    }
  }, [user, session, authLoading])

  // Clear demo data when user logs in
  useEffect(() => {
    if (user && !authLoading) {
      console.log('🧹 User logged in - clearing demo data from localStorage')
      // Clear any demo data from localStorage
      localStorage.removeItem('scholarship-session-history')
      localStorage.removeItem('scholarship-liked-ids')
      localStorage.removeItem('scholarship-swiped-ids')
    }
  }, [user, authLoading])

  // Immediate cleanup when user logs out
  useEffect(() => {
    if (!user && !authLoading) {
      console.log('🚨 User logged out - immediate cleanup')
      // Force immediate reset to demo mode
      setScholarships(demoScholarships)
      setSessionScholarships(demoScholarships) // Use demo scholarships as session scholarships
      setSessionHistory([])
      setNavigationStack([])
      setCurrentIndex(0)
      setSavedCount(0)
      setPassedCount(0)
      setLikedCount(0)
      setSessionLoaded(true) // Mark as loaded for demo mode
      setSessionRestored(true) // Mark as restored for demo mode
      setSessionRestorationInProgress(false)
      setIsRestoringSession(false)
      setSessionState('restored') // Set to restored state for demo mode
      setIsSessionReady(true)
      setIsLoading(false)
    }
  }, [user, authLoading])

  const fetchScholarships = async (offset = 0, forceRefresh = false) => {
    // COMPLETE BLOCK - Only allow fetch if explicitly fresh and no data exists
    if (!forceRefresh && (sessionScholarships.length > 0 || scholarships.length > 0 || sessionRestored || sessionState === 'restored' || isSessionReady)) {
      console.log('🚫 COMPLETE BLOCK - Fetch completely disabled')
      console.log('sessionScholarships.length:', sessionScholarships.length, 'scholarships.length:', scholarships.length, 'sessionRestored:', sessionRestored, 'sessionState:', sessionState, 'isSessionReady:', isSessionReady)
      console.log('forceRefresh:', forceRefresh, '- COMPLETELY BLOCKED')
      setIsLoading(false)
      return
    }
    
    try {
      console.log('🔍 FETCH ATTEMPT - offset:', offset, 'forceRefresh:', forceRefresh, 'sessionState:', sessionState, 'isRestoringSession:', isRestoringSession, 'sessionRestored:', sessionRestored, 'sessionRestorationInProgress:', sessionRestorationInProgress, 'fetchBlocked:', fetchBlocked)
      
      // Redundant check removed - already blocked above
      
      // GLOBAL FETCH BLOCKER - Don't fetch if blocked (unless forceRefresh is true)
      if (fetchBlocked && !forceRefresh) {
        console.log('🚫 BLOCKED - Global fetch blocker active')
        console.log('fetchBlocked:', fetchBlocked, 'forceRefresh:', forceRefresh, '- BLOCKED')
        setIsLoading(false)
        return
      }
      
      // AGGRESSIVE BLOCKING - Don't fetch if ANY session restoration is happening (unless forceRefresh is true)
      if ((isRestoringSession || sessionRestored || sessionRestorationInProgress) && !forceRefresh) {
        console.log('🚫 BLOCKED - Session restoration in progress or already restored')
        console.log('Flags:', { isRestoringSession, sessionRestored, sessionRestorationInProgress })
        console.log('Current scholarships length:', scholarships.length)
        console.log('forceRefresh:', forceRefresh, '- BLOCKED by session restoration')
        setIsLoading(false)
        return
      }
      
      // ULTRA-AGGRESSIVE BLOCKING - Don't fetch if we have ANY data (unless forceRefresh is true)
      if ((sessionScholarships.length > 0 || scholarships.length > 0) && !forceRefresh) {
        console.log('🚫 ULTRA-AGGRESSIVE BLOCK - Data already exists')
        console.log('sessionScholarships.length:', sessionScholarships.length, 'scholarships.length:', scholarships.length, 'forceRefresh:', forceRefresh, '- ULTRA-AGGRESSIVELY BLOCKED')
        setIsLoading(false)
        return
      }
      
      
      
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/scholarships?offset=${offset}&limit=20&userId=${user?.id || ''}`)
      
      console.log('API response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error response:', errorText)
        throw new Error('Failed to fetch scholarships')
      }
      
      const data = await response.json()
      console.log('Fetched scholarships:', data.scholarships?.length || 0, 'scholarships')
      
      // Check if AI processing is happening
      const hasAiProcessed = data.scholarships?.some((s: any) => s.aiProcessed === true)
      const hasAiFailed = data.scholarships?.some((s: any) => s.aiProcessed === false)
      const hasAiReasons = data.scholarships?.some((s: any) => s.matchReasons && s.matchReasons.length > 0)
      
      if (hasAiProcessed || hasAiReasons) {
        console.log('✅ AI matching completed for this batch')
        setAiProcessing(false)
      } else if (hasAiFailed) {
        console.log('⚠️ AI matching failed, using fallback data')
        setAiProcessing(false)
      } else {
        console.log('🤖 AI matching in progress...')
        setAiProcessing(true)
        
        // Auto-hide AI processing indicator after 3 seconds to prevent it from staying forever
        setTimeout(() => {
          setAiProcessing(false)
        }, 3000)
      }
      
      // Transform API data to match component expectations
      const transformedScholarships = (data.scholarships || data).map((scholarship: any) => ({
        ...scholarship,
        winProbability: scholarship.winProbability || Math.random(), // Use AI-generated win probability
        tags: scholarship.tags || [],
        matchReasons: scholarship.matchReasons || [
          "Profile matches scholarship criteria",
          "Strong academic performance",
          "Extracurricular activities align with requirements"
        ]
      }))
      
      // Filter out scholarships already swiped in current session
      const sessionFilteredScholarships = transformedScholarships.filter(
        (scholarship: any) => !sessionSwipedIds.has(scholarship.id)
      )
      
      console.log('Transformed scholarships:', transformedScholarships.length)
      console.log('Session filtered scholarships:', sessionFilteredScholarships.length)
      
      if (offset === 0) {
        // Initial load - replace all scholarships
        console.log('🎯 Setting scholarships for initial load:', sessionFilteredScholarships.length)
        setScholarships(sessionFilteredScholarships)
        setSessionScholarships(sessionFilteredScholarships)
        // Initialize navigation stack with the first scholarship if we're starting fresh
        if (navigationStack.length === 0) {
          setNavigationStack(sessionFilteredScholarships.slice(0, 1))
        }
      } else {
        // Append new scholarships
        const newScholarships = [...scholarships, ...sessionFilteredScholarships]
        console.log('🎯 Appending scholarships:', newScholarships.length)
        setScholarships(newScholarships)
        setSessionScholarships(newScholarships)
        // Don't add to navigation stack here - it should only be managed by navigation actions
      }
      
    } catch (error) {
      console.error('Error fetching scholarships:', error)
      setError('Failed to load scholarships. Please try again.')
    } finally {
      setIsLoading(false)
      // Mark session as ready when scholarships are loaded
      setIsSessionReady(true)
      setSessionRestored(true)
      setSessionState('restored')
      console.log('✅ Session ready - scholarships loaded')
      console.log('🎯 Final scholarships state after fetch:', scholarships.length)
    }
  }

  const saveSwipeAction = async (scholarshipId: string, action: 'saved' | 'passed' | 'liked', scholarship?: any) => {
    // Only save actions for authenticated users
    if (!user || !session) return
    
    try {
      // Get the current scholarship data to include AI matching info
      const currentScholarship = scholarship || scholarships.find(s => s.id === scholarshipId)
      
      console.log('🔄 Saving swipe with AI data:', {
        scholarshipId,
        action,
        winProbability: currentScholarship?.winProbability,
        matchReasons: currentScholarship?.matchReasons
      })

      const response = await fetch('/api/swipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          scholarship_id: scholarshipId,
          action,
          winProbability: currentScholarship?.winProbability,
          matchReasons: currentScholarship?.matchReasons
        })
      })

      if (!response.ok) {
        console.error('Failed to save swipe action')
      }
    } catch (error) {
      console.error('Error saving swipe action:', error)
    }
  }

  const handleSwipe = (direction: 'left' | 'right') => {
    if (currentIndex >= scholarships.length || isAnimating) return

    const currentScholarship = scholarships[currentIndex]
    const action = direction === 'right' ? 'saved' : 'passed'
    
    // Track in session
    setSessionSwipedIds(prev => new Set([...prev, currentScholarship.id]))
    
    // Track as liked if saved
    if (direction === 'right') {
      setLikedScholarships(prev => new Set([...prev, currentScholarship.id]))
    }
    
    // Add to navigation stack
    setNavigationStack(prev => [...prev, currentScholarship])
    
    // Add to session history for "Previously Viewed" badges
    setSessionHistory(prev => [...prev, currentScholarship.id])
    
    // Save the action
    saveSwipeAction(currentScholarship.id, action, currentScholarship)
    
    // Update counts
    if (direction === 'right') {
      setSavedCount(prev => {
        const newCount = prev + 1
        console.log('💾 Saved count updated:', newCount)
        return newCount
      })
    } else {
      setPassedCount(prev => {
        const newCount = prev + 1
        console.log('❌ Passed count updated:', newCount)
        return newCount
      })
    }

    // Move to next scholarship
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
    }, 300)
  }

  const handleLike = () => {
    if (currentIndex >= scholarships.length || isAnimating) return

    const currentScholarship = scholarships[currentIndex]
    
    // For demo mode, just update counts and move to next
    if (!user) {
      console.log('❤️ Demo mode: Liking scholarship')
      setSavedCount(prev => prev + 1)
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1)
      }, 1000)
      return
    }
    
    // For authenticated users, use full logic
    // Track in session
    setSessionSwipedIds(prev => new Set([...prev, currentScholarship.id]))
    
    // Track as liked
    setLikedScholarships(prev => new Set([...prev, currentScholarship.id]))
    
    // Add to navigation stack
    setNavigationStack(prev => [...prev, currentScholarship])
    
    // Add to session history for "Previously Viewed" badges
    setSessionHistory(prev => [...prev, currentScholarship.id])
    
    // Save the action (same as handleSave)
    saveSwipeAction(currentScholarship.id, 'saved', currentScholarship)
    
    // Update count (same as handleSave)
    setSavedCount(prev => prev + 1)

    // Move to next scholarship after delay
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
    }, 1000)
  }

  const handleNext = () => {
    if (isAnimating) return
    
    const currentScholarship = scholarships[currentIndex]
    
    // For demo mode, use simple navigation with tracking
    if (!user) {
      console.log('⬇️ Demo mode: Moving to next scholarship')
      
      // Track current scholarship as passed
      if (currentScholarship) {
        setSessionSwipedIds(prev => new Set([...prev, currentScholarship.id]))
        setSessionHistory(prev => [...prev, currentScholarship.id])
        setPassedCount(prev => {
          const newCount = prev + 1
          console.log('⬇️ Demo mode - Passed count updated:', newCount)
          return newCount
        })
      }
      
      setCurrentIndex(prev => prev + 1)
      return
    }
    
    // For authenticated users, use full navigation logic
    if (currentScholarship && !sessionSwipedIds.has(currentScholarship.id)) {
      console.log('⬇️ Adding to navigation stack:', currentScholarship.title, 'at index:', currentIndex)
      
      // Add current scholarship to navigation stack
      setNavigationStack(prev => [...prev, currentScholarship])
      
      // Add to session history for "Previously Viewed" badges
      setSessionHistory(prev => [...prev, currentScholarship.id])
      
      // Track as passed (since they're moving to next without saving)
      setSessionSwipedIds(prev => new Set([...prev, currentScholarship.id]))
      setPassedCount(prev => {
        const newCount = prev + 1
        console.log('⬇️ Passed count updated:', newCount)
        return newCount
      })
      
      // Save the action as passed
      saveSwipeAction(currentScholarship.id, 'passed', currentScholarship)
    }
    
    // Move to next scholarship
    setCurrentIndex(prev => prev + 1)
    
    // If we're at the end, fetch more scholarships (only for authenticated users)
    if (currentIndex >= scholarships.length - 1) {
      console.log('⬇️ At end of scholarships, fetching more...')
      fetchScholarships(scholarships.length)
    }
  }

  const handlePrevious = () => {
    if (isAnimating || isNavigating) {
      console.log('🔙 Cannot go back - isAnimating:', isAnimating, 'isNavigating:', isNavigating)
      return
    }
    
    // For demo mode, use simple index-based navigation
    if (!user) {
      if (currentIndex > 0) {
        console.log('🔙 Demo mode: Going to previous scholarship')
        setIsAnimating(true)
        setCurrentIndex(prev => prev - 1)
        setTimeout(() => setIsAnimating(false), 300)
      }
      return
    }
    
    // For authenticated users, use navigation stack
    if (navigationStack.length === 0) {
      console.log('🔙 Cannot go back - no navigation history')
      return
    }
    
    console.log('🔙 NEW NAVIGATION: Starting from currentIndex:', currentIndex, 'stackLength:', navigationStack.length)
    
    setIsAnimating(true)
    setIsNavigating(true)
    
    // Pop the last item from the navigation stack
    const previousScholarship = navigationStack[navigationStack.length - 1]
    setNavigationStack(prev => prev.slice(0, -1))
    
    console.log('🔙 Going to:', previousScholarship.title)
    
    // Find the scholarship in the current scholarships array
    const scholarshipIndex = scholarships.findIndex(s => s.id === previousScholarship.id)
    if (scholarshipIndex !== -1) {
      console.log('🔙 Found in current array at index:', scholarshipIndex)
      setCurrentIndex(scholarshipIndex)
    } else {
      console.log('🔙 Not found in current array, adding to front')
      // Add to front of scholarships array
      setScholarships(prev => [previousScholarship, ...prev])
      setCurrentIndex(0)
    }
    
    // Reset animation after a short delay
    setTimeout(() => {
      console.log('🔙 Navigation complete, resetting flags')
      setIsAnimating(false)
      setIsNavigating(false)
    }, 300)
  }

  const handleSave = () => {
    if (currentIndex >= scholarships.length || isAnimating) return

    const currentScholarship = scholarships[currentIndex]
    
    // Save the action
    saveSwipeAction(currentScholarship.id, 'saved', currentScholarship)
    
    // Update count
    setSavedCount(prev => prev + 1)

    // Move to next scholarship
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
    }, 300)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (isAnimating) return
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        handlePrevious()
        break
      case 'ArrowDown':
        e.preventDefault()
        handleNext()
        break
      case ' ':
        e.preventDefault()
        handleLike()
        break
    }
  }

  // Loading state
  if (isLoading || !isSessionReady) {
    return (
      <div className="min-h-screen px-4 py-8 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center animate-spin">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <p className="text-lg text-muted-foreground">
            {isLoading ? 'Loading scholarships...' : 'Restoring session...'}
          </p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen px-4 py-8 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-lg text-red-600">{error}</p>
          <Button 
            onClick={() => fetchScholarships()}
            className="bg-gradient-to-r from-primary to-secondary"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Show friendly message when user runs out of suggested scholarships
      console.log('Current state:', { currentIndex, scholarshipsLength: scholarships.length, isLoading })
      
      // Only show "out of scholarships" if we've actually gone through all available ones
      if (currentIndex >= scholarships.length && scholarships.length > 0) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-primary via-secondary to-primary flex items-center justify-center relative overflow-hidden pt-20 pb-8">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-secondary/60 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/60 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/40 rounded-full blur-3xl animate-pulse delay-500" />
          <div className="absolute top-1/6 right-1/6 w-48 h-48 bg-primary/50 rounded-full blur-2xl animate-pulse delay-300" />
          <div className="absolute bottom-1/6 left-1/6 w-56 h-56 bg-secondary/50 rounded-full blur-2xl animate-pulse delay-700" />
        </div>

        <div className="relative z-10 text-center space-y-8 max-w-md mx-auto px-6">
          {/* Content container with proper background */}
          <div className="relative bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
          {/* Celebration icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl animate-pulse" />
            <div className="relative w-32 h-32 mx-auto bg-gradient-to-br from-secondary to-primary rounded-full flex items-center justify-center shadow-2xl">
              <GraduationCap className="w-16 h-16 text-white" />
            </div>
          </div>

          {/* Main message */}
          <div className="space-y-4 mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight drop-shadow-2xl">
              Amazing Work! 🎉
            </h1>
            <p className="text-xl text-white leading-relaxed drop-shadow-lg">
              You've reviewed all your personalized scholarship suggestions! 
              Check back soon for new opportunities.
            </p>
          </div>

          {/* Stats summary */}
          <div className="bg-white/25 backdrop-blur-sm rounded-3xl p-6 space-y-4 border border-white/40 shadow-2xl">
            <h3 className="text-lg font-semibold text-white drop-shadow-md">Your Session Summary</h3>
              <div className="grid grid-cols-2 gap-8">
              <div className="text-center">
                  <div className="text-3xl font-bold text-secondary drop-shadow-md">{savedCount}</div>
                <div className="text-sm text-white/80">Saved</div>
              </div>
              <div className="text-center">
                  <div className="text-3xl font-bold text-white/70 drop-shadow-md">{passedCount}</div>
                <div className="text-sm text-white/80">Passed</div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
            <div className="space-y-4 mt-8">
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-secondary to-primary hover:from-secondary/90 hover:to-primary/90 text-white font-semibold py-4 rounded-2xl transition-all duration-300 hover:scale-105 shadow-2xl"
                onClick={async () => {
                setCurrentIndex(0)
                setSavedCount(0)
                setPassedCount(0)
                setLikedCount(0)
                  setSessionSwipedIds(new Set()) // Clear session tracking
                  setSessionHistory([]) // Clear history
                  setLikedScholarships(new Set()) // Clear liked scholarships
                    setSessionScholarships([]) // Clear session scholarships
                    setNavigationStack([]) // Clear navigation stack
                    setCurrentIndex(0) // Reset to beginning
                    setSessionRestored(false) // Allow fresh fetching
                    setSessionRestorationInProgress(false) // Allow fresh session loading
                    setFetchBlocked(false) // Allow fresh fetching
                    setSessionState('fresh') // Reset state machine to fresh
                  
                  // Clear localStorage
                  localStorage.removeItem('scholarship-session-history')
                  localStorage.removeItem('scholarship-liked-ids')
                  localStorage.removeItem('scholarship-swiped-ids')
                  
                  // Clear database session if authenticated
                  if (user && session) {
                    try {
                      await fetch('/api/sessions', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${session.access_token}`
                        },
                        body: JSON.stringify({ session_data: {} })
                      })
                    } catch (error) {
                      console.error('Error clearing database session:', error)
                    }
                  }
                  
                  fetchScholarships(0, true) // Force refresh to get new scholarships
              }}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Start Fresh Session
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full bg-white/25 border-white/40 text-white hover:bg-white/35 py-4 rounded-2xl backdrop-blur-sm shadow-lg"
              onClick={() => window.location.href = '/saved'}
            >
              View Saved Scholarships
            </Button>
            </div>
          </div>

          {/* Encouraging message */}
          <p className="text-sm text-white drop-shadow-md mb-8">
            New scholarships are added regularly. Keep checking back for fresh opportunities! ✨
          </p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen px-4 py-8 relative"
      onKeyDown={handleKeyPress}
      tabIndex={0}
    >
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float-slow" />
      </div>

      {/* Header */}
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Find Your Perfect Match
        </h1>
        <p className="text-lg text-muted-foreground">
          Swipe through scholarships matched to your profile
        </p>
      </div>

      {/* Demo Mode Notification */}
      {!user && (
        <div className="mb-6 mx-auto max-w-md">
          <div className="bg-gradient-to-r from-blue-500 to-yellow-500 text-white rounded-lg p-4 text-center shadow-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">Demo Mode</span>
            </div>
            <p className="text-sm opacity-90">
              You're viewing sample scholarships. Sign up to see personalized matches!
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mb-8">
        <SwipeStats saved={savedCount} passed={passedCount} />
      </div>

      {/* AI Processing Indicator */}
      {aiProcessing && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-primary/90 backdrop-blur-sm text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
            <span className="text-sm font-medium">AI is analyzing your matches...</span>
          </div>
        </div>
      )}

      {/* Card Stack */}
      <div className="relative mx-auto max-w-4xl" style={{ height: "calc(100vh - 250px)" }}>
        {/* Debug info */}
        <div className="text-center mb-4 text-sm text-gray-600">
          Debug: scholarships.length={scholarships.length}, currentIndex={currentIndex}, user={!!user}
        </div>
        {scholarships.slice(currentIndex, currentIndex + 3).map((scholarship, index) => (
          <SwipeCard
            key={scholarship.id}
            scholarship={scholarship}
            isTop={index === 0}
            stackPosition={index}
            onSwipe={handleSwipe}
            isLiked={likedScholarships.has(scholarship.id)}
            isViewedBefore={sessionHistory.includes(scholarship.id)}
          />
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-center gap-8 mt-4">
        <Button
          size="lg"
          variant="outline"
          className="w-16 h-16 rounded-full border-2 border-blue-500 text-blue-500 hover:bg-blue-50 hover:scale-110 transition-all duration-200 disabled:opacity-50"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          <ArrowUp className="w-6 h-6" />
        </Button>

        <Button
          size="lg"
          variant="outline"
          className="w-16 h-16 rounded-full border-2 border-green-500 text-green-500 hover:bg-green-50 hover:scale-110 transition-all duration-200 disabled:opacity-50"
          onClick={handleNext}
          disabled={currentIndex >= scholarships.length}
        >
          <ArrowDown className="w-6 h-6" />
        </Button>
      </div>

      {/* Keyboard hint */}
      <div className="text-center mt-6 text-sm text-muted-foreground">
        <p>↑ Previous • ↓ Next • Space to Like</p>
      </div>
    </div>
  )
}