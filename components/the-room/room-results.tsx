"use client"

import { useState } from "react"

import { PersonaCards } from "@/components/the-room/persona-cards"
import { SearchSuggestions } from "@/components/the-room/search-suggestions"
import { SharperAngles } from "@/components/the-room/sharper-angles"
import { SignalCharts } from "@/components/the-room/signal-charts"
import { VerdictBar } from "@/components/the-room/verdict-bar"
import { VoicesGrid } from "@/components/the-room/voices-grid"
import type { RoomResponse } from "@/lib/schemas/room-schema"

const HIGHLIGHT_MS = 1800

export function RoomResults({ result }: { result: RoomResponse }) {
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null)

  function jumpToVoice(voiceIndex: number) {
    const el = document.getElementById(`voice-${voiceIndex}`)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" })
    }
    setHighlightedIndex(voiceIndex)
    window.setTimeout(() => setHighlightedIndex(null), HIGHLIGHT_MS)
  }

  return (
    <div className="flex flex-col gap-12">
      <VerdictBar data={result.verdict} />

      <section>
        <h2 className="text-xl font-semibold sm:text-2xl">
          Voices from the internet
        </h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Real quotes pulled from live web research. Click any to verify.
        </p>
        <VoicesGrid
          voices={result.voices}
          highlightedIndex={highlightedIndex}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold sm:text-2xl">
          The signal breakdown
        </h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          How the voices split across sentiment and source.
        </p>
        <SignalCharts
          sentiment={result.sentiment_breakdown}
          source={result.source_breakdown}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold sm:text-2xl">The room reacts</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          3 composite voices, derived from the dominant audience segments.
        </p>
        <PersonaCards personas={result.personas} />
      </section>

      <section>
        <h2 className="text-xl font-semibold sm:text-2xl">Sharper angles</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Reframed using your audience&apos;s actual language.
        </p>
        <SharperAngles
          angles={result.sharper_angles}
          onJumpToVoice={jumpToVoice}
        />
      </section>

      <SearchSuggestions data={result.groundingMetadata} />
    </div>
  )
}
