"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { Voice } from "@/lib/schemas/room-schema"

import {
  avatarColorClass,
  avatarInitial,
  sentimentStyles,
} from "./persona-colors"

function VoiceCardInner({
  v,
  highlighted,
}: {
  v: Voice
  highlighted: boolean
}) {
  const s = sentimentStyles[v.sentiment]
  const initial = avatarInitial(v.username)
  const avatarColor = avatarColorClass(v.username)

  return (
    <Card
      id={`voice-${v.voice_index}`}
      className={`scroll-mt-24 transition-all duration-300 ${
        highlighted
          ? "scale-[1.02] shadow-lg ring-2 ring-primary ring-offset-2 ring-offset-background"
          : ""
      } ${
        v.source_verified && v.source_url
          ? "cursor-pointer hover:scale-[1.02] hover:shadow-md"
          : ""
      }`}
    >
      <CardContent className="flex h-full flex-col gap-4 p-5">
        {/* Top: avatar + meta */}
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarColor}`}
            aria-hidden
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1 text-xs">
            <div className="truncate font-medium">@{v.username}</div>
            <div className="truncate text-muted-foreground">
              {v.source_name} · {v.date_relative}
            </div>
          </div>
          <div className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
            #{v.voice_index}
          </div>
        </div>

        {/* Quote */}
        <blockquote className="relative text-base leading-relaxed italic">
          <span
            aria-hidden
            className="absolute -top-2 -left-1 text-3xl leading-none text-muted-foreground/40"
          >
            &ldquo;
          </span>
          <span className="ml-4">{v.quote}</span>
        </blockquote>

        {/* Footer: sentiment + verified */}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className={`rounded-full px-2 py-0.5 font-medium ${s.class}`}>
            {s.label}
          </span>
          {v.source_verified && v.source_url ? (
            <span className="font-medium text-primary">
              ✓ verified source ↗
            </span>
          ) : (
            <span className="font-medium text-muted-foreground/60">
              unverified
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function VoicesGrid({
  voices,
  highlightedIndex,
}: {
  voices: Voice[]
  highlightedIndex: number | null
}) {
  if (voices.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No voices in this sentiment.
      </p>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {voices.map((v) => {
        const highlighted = highlightedIndex === v.voice_index
        const inner = <VoiceCardInner v={v} highlighted={highlighted} />
        if (v.source_verified && v.source_url) {
          return (
            <a
              key={v.voice_index}
              href={v.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {inner}
            </a>
          )
        }
        return <div key={v.voice_index}>{inner}</div>
      })}
    </div>
  )
}
