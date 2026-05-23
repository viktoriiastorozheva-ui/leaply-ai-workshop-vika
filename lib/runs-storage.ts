import type { RoomResponse } from "@/lib/schemas/room-schema"

// Saved-runs storage. Everything is best-effort: localStorage might be full,
// disabled, or unavailable (SSR). On any failure we return empty/no-op.

const KEY = "the-room/runs/v1"
const MAX_RUNS = 20

export type SavedRun = {
  id: string
  savedAt: number // ms epoch
  idea: string
  audience: string
  result: RoomResponse
}

function isClient() {
  return typeof window !== "undefined" && !!window.localStorage
}

export function listRuns(): SavedRun[] {
  if (!isClient()) return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    // Lightly sanity-check shape — drop anything missing the essentials.
    return parsed.filter(
      (r): r is SavedRun =>
        !!r &&
        typeof r === "object" &&
        typeof (r as SavedRun).id === "string" &&
        typeof (r as SavedRun).savedAt === "number" &&
        typeof (r as SavedRun).idea === "string" &&
        typeof (r as SavedRun).audience === "string" &&
        !!(r as SavedRun).result
    )
  } catch {
    return []
  }
}

function writeRuns(runs: SavedRun[]) {
  if (!isClient()) return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(runs.slice(0, MAX_RUNS)))
  } catch {
    // Quota exceeded or storage disabled — silently no-op. Worst case the
    // user just doesn't get history, but the live run still works.
  }
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function saveRun(input: {
  idea: string
  audience: string
  result: RoomResponse
}): SavedRun {
  const run: SavedRun = {
    id: makeId(),
    savedAt: Date.now(),
    idea: input.idea,
    audience: input.audience,
    result: input.result,
  }
  const existing = listRuns()
  // Avoid back-to-back duplicates of the same idea + audience.
  const filtered = existing.filter(
    (r) => !(r.idea === run.idea && r.audience === run.audience)
  )
  writeRuns([run, ...filtered])
  return run
}

export function deleteRun(id: string) {
  writeRuns(listRuns().filter((r) => r.id !== id))
}

export function clearAllRuns() {
  if (!isClient()) return
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    /* no-op */
  }
}

export function formatRelativeTime(ms: number) {
  const now = Date.now()
  const diff = Math.max(0, now - ms)
  const sec = Math.round(diff / 1000)
  if (sec < 60) return "just now"
  const min = Math.round(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.round(hr / 24)
  if (day < 30) return `${day}d ago`
  const mo = Math.round(day / 30)
  return `${mo}mo ago`
}
