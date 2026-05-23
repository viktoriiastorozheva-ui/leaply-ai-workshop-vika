import type {
  Frequency,
  PersonaColor,
  Sentiment,
  TrendingVelocity,
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
  { class: string; label: string }
> = {
  pain: {
    class: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
    label: "Pain",
  },
  desire: {
    class:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
    label: "Desire",
  },
  skepticism: {
    class:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
    label: "Skepticism",
  },
  praise: {
    class: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
    label: "Praise",
  },
  frustration: {
    class:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
    label: "Frustration",
  },
}

export const frequencyStyles: Record<
  Frequency,
  { class: string; label: string }
> = {
  "very common": {
    class: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
    label: "Very common",
  },
  common: {
    class:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
    label: "Common",
  },
  emerging: {
    class: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
    label: "Emerging",
  },
  rare: {
    class: "bg-muted text-muted-foreground",
    label: "Rare",
  },
}

export const velocityStyles: Record<
  TrendingVelocity,
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
