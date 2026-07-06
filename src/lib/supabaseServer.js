import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Server-side client for Server Components / server code. Reads the session
// from cookies. In Next 16 `cookies()` is async, so this must be awaited.
export async function createSupabaseServer() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component where cookies can't be set —
            // safe to ignore; the proxy handles session refresh.
          }
        },
      },
    }
  )
}
