"use client"

import type { Sentiment, Voice } from "@/lib/schemas/room-schema"

import { sentimentStyles } from "./persona-colors"

export type VoiceFilter = Sentiment | "all"

const ORDER: Sentiment[] = [
  "pain",
  "desire",
  "skepticism",
  "praise",
  "frustration",
]

export function VoiceFilterChips({
  voices,
  value,
  onChange,
}: {
  voices: Voice[]
  value: VoiceFilter
  onChange: (next: VoiceFilter) => void
}) {
  // Build counts per sentiment from the actual voices array (not the
  // sentiment_breakdown, so the chip count matches what we'll render).
  const counts = ORDER.reduce<Record<Sentiment, number>>(
    (acc, k) => ({ ...acc, [k]: 0 }),
    {
      pain: 0,
      desire: 0,
      skepticism: 0,
      praise: 0,
      frustration: 0,
    }
  )
  for (const v of voices) counts[v.sentiment] += 1
  const total = voices.length

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Chip
        active={value === "all"}
        onClick={() => onChange("all")}
        baseClass="bg-foreground/10 text-foreground"
        activeClass="bg-foreground text-background"
        label={`All (${total})`}
      />
      {ORDER.map((s) => {
        const count = counts[s]
        if (count === 0) return null
        const style = sentimentStyles[s]
        return (
          <Chip
            key={s}
            active={value === s}
            onClick={() => onChange(s)}
            baseClass={style.class}
            activeClass="ring-2 ring-foreground/40"
            label={`${style.label} (${count})`}
          />
        )
      })}
    </div>
  )
}

function Chip({
  active,
  onClick,
  baseClass,
  activeClass,
  label,
}: {
  active: boolean
  onClick: () => void
  baseClass: string
  activeClass: string
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition ${baseClass} ${
        active ? activeClass : "opacity-70 hover:opacity-100"
      }`}
    >
      {label}
    </button>
  )
}
