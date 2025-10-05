import { createClient } from '@supabase/supabase-js';
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';

export function getServerSupabaseClient(cookies) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error('Missing Supabase env vars');

  return createServerClient(url, anonKey, {
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
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error('Missing Supabase service role env vars');
  return createClient(url, serviceKey);
}
