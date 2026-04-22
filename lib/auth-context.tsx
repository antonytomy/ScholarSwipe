"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

// Prevent unhandled rejections with non-Error values (e.g. Event) from breaking Next.js coerceError
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    if (reason != null && !(reason instanceof Error) && typeof reason?.message !== 'string') {
      event.preventDefault()
      console.error('Unhandled rejection (non-Error):', reason)
    }
  })
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
})

const clearAuthStorage = () => {
  if (typeof window === 'undefined') return

  const appStorageKeys = [
    'scholarship-session-history',
    'scholarship-liked-ids',
    'scholarship-swiped-ids',
    'scholarships_session_cache',
    'saved_ids_cache',
    'applied_ids_cache',
    'saved_scholarships_cache',
    'applied_scholarships_cache',
    'completed_ids_cache',
    'completed_scholarships_cache',
    'scholarswipe-auth-token',
  ]

  appStorageKeys.forEach((key) => {
    window.localStorage.removeItem(key)
    window.sessionStorage.removeItem(key)
  })

  for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
    const key = window.localStorage.key(index)
    if (key?.startsWith('sb-') && key.endsWith('-auth-token')) {
      window.localStorage.removeItem(key)
    }
  }

  for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
    const key = window.sessionStorage.key(index)
    if (key?.startsWith('sb-') && key.endsWith('-auth-token')) {
      window.sessionStorage.removeItem(key)
    }
  }
}

const logSupabaseAuthError = (label: string, error: unknown) => {
  console.error(label, {
    error,
    payload:
      error && typeof error === 'object'
        ? {
            name: 'name' in error ? (error as { name?: unknown }).name : undefined,
            message: 'message' in error ? (error as { message?: unknown }).message : undefined,
            status: 'status' in error ? (error as { status?: unknown }).status : undefined,
            code: 'code' in error ? (error as { code?: unknown }).code : undefined,
            details: 'details' in error ? (error as { details?: unknown }).details : undefined,
            hint: 'hint' in error ? (error as { hint?: unknown }).hint : undefined,
          }
        : String(error),
  })
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          logSupabaseAuthError('Supabase getSession failed:', error)
        }
        setUser(session?.user ?? null)
        setSession(session)
      } catch (error) {
        logSupabaseAuthError('Error getting session:', error)
        setUser(null)
        setSession(null)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession().catch((err) => {
      console.error('Error getting initial session:', err)
      setUser(null)
      setSession(null)
      setLoading(false)
    })

    // Listen for auth changes (use sync callback to avoid unhandled rejections)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        try {
          console.log('Supabase auth state changed:', {
            event,
            userId: session?.user?.id ?? null,
          })
          setUser(session?.user ?? null)
          setSession(session)
        } catch (error) {
          logSupabaseAuthError('Auth state change handling failed:', error)
        } finally {
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    clearAuthStorage()
    setUser(null)
    setSession(null)

    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) {
      logSupabaseAuthError('Supabase sign out failed:', error)
    }

    clearAuthStorage()
    setUser(null)
    setSession(null)
  }

  const value = {
    user,
    session,
    loading,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
