import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Browser-side client. Uses cookies (via @supabase/ssr) so the logged-in
// session is shared with the server (proxy + server components).
export const supabase = createBrowserClient(supabaseUrl, supabaseKey)
