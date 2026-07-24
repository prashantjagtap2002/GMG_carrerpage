import { createClient } from "@supabase/supabase-js"

/**
 * Lightweight Supabase client for the **browser**. Uses the public anon key —
 * safe to expose in the client bundle. This client is used ONLY for Realtime
 * subscriptions (WebSocket). All write operations still go through the
 * authenticated Netlify Functions which use the service_role key server-side.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
        realtime: {
          params: { eventsPerSecond: 10 },
        },
      })
    : null
