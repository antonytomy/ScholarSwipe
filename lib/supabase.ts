import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY

const supabaseSecretKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY

const createMissingEnvError = (clientType: 'public' | 'admin') => {
  const missingVars = [
    !supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL' : null,
    clientType === 'public' && !supabaseAnonKey ? 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY' : null,
    clientType === 'admin' && !supabaseSecretKey ? 'SUPABASE_SECRET_KEY' : null,
  ].filter(Boolean)

  return new Error(
    `Supabase is not configured. Missing ${missingVars.join(' and ')}. ` +
    `Add them to .env.local. Supported aliases: SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.`
  )
}

const createLazyClient = (clientType: 'public' | 'admin') => {
  let client: ReturnType<typeof createClient> | null = null

  const getClient = () => {
    if (client) return client

    if (!supabaseUrl) {
      throw createMissingEnvError(clientType)
    }

    if (clientType === 'public') {
      if (!supabaseAnonKey) {
        throw createMissingEnvError(clientType)
      }

      client = createClient(supabaseUrl, supabaseAnonKey)
      return client
    }

    if (!supabaseSecretKey) {
      throw createMissingEnvError(clientType)
    }

    client = createClient(
      supabaseUrl,
      supabaseSecretKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    return client
  }

  return new Proxy(
    {},
    {
      get(_target, prop) {
        const resolvedClient = getClient()
        return Reflect.get(resolvedClient, prop, resolvedClient)
      }
    }
  )
}

export const supabase = createLazyClient('public') as ReturnType<typeof createClient>

// For server-side operations that need elevated permissions
// Only available on server-side, not in browser
export const supabaseAdmin = typeof window === 'undefined'
  ? createLazyClient('admin') as ReturnType<typeof createClient>
  : null
