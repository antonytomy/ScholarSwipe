import { createClient } from '@supabase/supabase-js';
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';

export function getServerSupabaseClient(cookies) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY;
  if (!url || !publishableKey) throw new Error('Missing Supabase env vars');

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(cookies?.get?.("cookie") || '');
      },
      setAll(cookiesToSet) {
        const setCookie = cookiesToSet.map((c) => serializeCookieHeader(c.name, c.value, c.options));
        // The caller (route handler) should append these headers to the response
        return setCookie;
      },
    },
  });
}

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_ADMIN_KEY; // fallback alias if used
  if (!url || !secretKey) throw new Error('Missing Supabase service role env vars');
  return createClient(url, secretKey);
}
