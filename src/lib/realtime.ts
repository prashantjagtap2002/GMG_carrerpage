import { supabase } from "@/lib/supabase"
import type { RealtimeChannel } from "@supabase/supabase-js"

/**
 * Supabase Realtime subscription manager.
 *
 * Subscribes to Postgres changes on the tables that back the CRM and public
 * careers page. When any row is inserted, updated, or deleted the relevant
 * refresh callback fires so the UI updates instantly — no polling needed.
 *
 * The refresh callbacks are injected by the caller (crm-store) to avoid a
 * circular dependency.
 */

type RealtimeCallbacks = {
  onJobsChange: () => void
  onApplicationsChange: () => void
}

let channel: RealtimeChannel | null = null

/**
 * Start listening for real-time database changes.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export function startRealtime(callbacks: RealtimeCallbacks) {
  if (!supabase || channel) return

  // Debounce rapid-fire events (e.g. bulk inserts) so we don't hammer the
  // server with redundant refresh requests. Each table group gets its own
  // timer so a flurry of application inserts doesn't delay a jobs refresh.
  let jobsTimer: ReturnType<typeof setTimeout> | null = null
  let appsTimer: ReturnType<typeof setTimeout> | null = null

  function debouncedJobsRefresh() {
    if (jobsTimer) clearTimeout(jobsTimer)
    jobsTimer = setTimeout(() => {
      jobsTimer = null
      callbacks.onJobsChange()
    }, 300)
  }

  function debouncedAppsRefresh() {
    if (appsTimer) clearTimeout(appsTimer)
    appsTimer = setTimeout(() => {
      appsTimer = null
      callbacks.onApplicationsChange()
    }, 300)
  }

  channel = supabase
    .channel("crm-realtime")
    // --- Job-related tables ---
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "custom_jobs" },
      () => debouncedJobsRefresh(),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "job_overrides" },
      () => debouncedJobsRefresh(),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "hidden_jobs" },
      () => debouncedJobsRefresh(),
    )
    // --- Application-related tables ---
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "applications" },
      () => debouncedAppsRefresh(),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "notes" },
      () => debouncedAppsRefresh(),
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("[Realtime] ✓ Connected — listening for live updates")
      } else if (status === "CHANNEL_ERROR") {
        console.warn("[Realtime] Channel error — will auto-reconnect")
      } else if (status === "TIMED_OUT") {
        console.warn("[Realtime] Connection timed out — will auto-reconnect")
      }
    })
}

/**
 * Disconnect from Realtime. Called on cleanup / unmount.
 */
export function stopRealtime() {
  if (!supabase || !channel) return
  supabase.removeChannel(channel)
  channel = null
  console.log("[Realtime] Disconnected")
}
