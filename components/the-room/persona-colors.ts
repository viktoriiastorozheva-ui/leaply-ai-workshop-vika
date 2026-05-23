import type {
  PersonaColor,
  Sentiment,
  Trending,
} from "@/lib/schemas/room-schema"

// Static Tailwind class strings — written out in full so the v4 content scanner
// picks them up. Don't refactor into dynamic string interpolation.

export const personaColorStyles: Record<
  PersonaColor,
  {
    border: string
    badge: string
    label: string
  }
> = {
  green: {
    border: "border-l-4 border-l-emerald-500",
    badge:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
    label: "Enthusiast",
  },
  yellow: {
    border: "border-l-4 border-l-amber-500",
    badge:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
    label: "Neutral",
  },
  red: {
    border: "border-l-4 border-l-rose-500",
    badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
    label: "Skeptic",
  },
}

export const sentimentStyles: Record<
  Sentiment,
  { class: string; label: string; hex: string }
> = {
  pain: {
    class: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
    label: "Pain",
    hex: "#f43f5e", // rose-500
  },
  desire: {
    class:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
    label: "Desire",
    hex: "#10b981", // emerald-500
  },
  skepticism: {
    class:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
    label: "Skepticism",
    hex: "#f59e0b", // amber-500
  },
  praise: {
    class: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
    label: "Praise",
    hex: "#0ea5e9", // sky-500
  },
  frustration: {
    class:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
    label: "Frustration",
    hex: "#f97316", // orange-500
  },
}

export const velocityStyles: Record<
  Trending,
  { arrow: string; label: string; class: string }
> = {
  growing: {
    arrow: "↑",
    label: "Growing",
    class: "text-emerald-600 dark:text-emerald-400",
  },
  stable: {
    arrow: "→",
    label: "Stable",
    class: "text-sky-600 dark:text-sky-400",
  },
  fading: {
    arrow: "↓",
    label: "Fading",
    class: "text-rose-600 dark:text-rose-400",
  },
  unclear: {
    arrow: "?",
    label: "Unclear",
    class: "text-muted-foreground",
  },
}

export function scoreClass(value: number) {
  if (value >= 8)
    return "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100 font-semibold"
  if (value <= 4)
    return "bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-100 font-semibold"
  return "bg-muted text-foreground"
}

// Avatar palette — listed in full so Tailwind picks them up.
const AVATAR_COLORS = [
  "bg-rose-500 text-white",
  "bg-amber-500 text-white",
  "bg-emerald-500 text-white",
  "bg-sky-500 text-white",
  "bg-indigo-500 text-white",
  "bg-pink-500 text-white",
  "bg-orange-500 text-white",
  "bg-teal-500 text-white",
] as const

export function avatarColorClass(seed: string) {
  if (!seed) return AVATAR_COLORS[0]
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) & 0xffffffff
  }
  const idx = Math.abs(h) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

export function avatarInitial(username: string) {
  const cleaned = username.replace(/^@/, "").trim()
  return (cleaned[0] ?? "?").toUpperCase()
}
