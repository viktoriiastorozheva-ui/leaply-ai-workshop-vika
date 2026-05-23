"use client"

import { useState } from "react"

import { AskTheRoom } from "@/components/the-room/ask-the-room"
import { CopyReportButton } from "@/components/the-room/copy-report-button"
import {
  PersonaCards,
  type PersonaOverride,
} from "@/components/the-room/persona-cards"
import { SearchSuggestions } from "@/components/the-room/search-suggestions"
import { SharperAngles } from "@/components/the-room/sharper-angles"
import { SignalCharts } from "@/components/the-room/signal-charts"
import { VerdictBar } from "@/components/the-room/verdict-bar"
import {
  VoiceFilterChips,
  type VoiceFilter,
} from "@/components/the-room/voice-filter"
import { VoicesGrid } from "@/components/the-room/voices-grid"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import type { RescoreResponse, RoomResponse } from "@/lib/schemas/room-schema"

const HIGHLIGHT_MS = 1800

type RescoreState = {
  angle: string
  overrides: Record<string, PersonaOverride>
}

export function RoomResults({
  result,
  idea,
  audience,
}: {
  result: RoomResponse
  idea: string
  audience: string
}) {
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null)
  const [voiceFilter, setVoiceFilter] = useState<VoiceFilter>("all")

  // Rescore state — which angle is being scored, and which overrides to show.
  const [activeRescore, setActiveRescore] = useState<RescoreState | null>(null)
  const [rescoringAngle, setRescoringAngle] = useState<string | null>(null)
  const [rescoreError, setRescoreError] = useState<string | null>(null)

  function jumpToVoice(voiceIndex: number) {
    const el = document.getElementById(`voice-${voiceIndex}`)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" })
    }
    setHighlightedIndex(voiceIndex)
    window.setTimeout(() => setHighlightedIndex(null), HIGHLIGHT_MS)
  }

  async function handleRescore(angle: string) {
    setRescoringAngle(angle)
    setRescoreError(null)
    try {
      const res = await fetch("/api/room/rescore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          original_idea: idea,
          audience,
          new_angle: angle,
          personas: result.personas,
        }),
      })
      const data: RescoreResponse | { error?: string } = await res.json()
      if (!res.ok || !("rescored" in data)) {
        setRescoreError(
          ("error" in data && data.error) ||
            "Re-score failed. Please try again."
        )
        return
      }
      const overrides: Record<string, PersonaOverride> = {}
      for (const r of data.rescored) {
        overrides[r.name] = {
          scores: r.new_scores,
          gut_reaction: r.new_gut_reaction,
          what_changed: r.what_changed,
        }
      }
      setActiveRescore({ angle, overrides })
      // Scroll personas section into view so the user sees the diff land.
      document
        .getElementById("personas-section")
        ?.scrollIntoView({ behavior: "smooth", block: "start" })
    } catch {
      setRescoreError(
        "Couldn't reach the server. Check your internet connection and try again."
      )
    } finally {
      setRescoringAngle(null)
    }
  }

  function clearRescore() {
    setActiveRescore(null)
    setRescoreError(null)
  }

  const filteredVoices =
    voiceFilter === "all"
      ? result.voices
      : result.voices.filter((v) => v.sentiment === voiceFilter)

  return (
    <div className="flex flex-col gap-12">
      <div className="flex items-start justify-between gap-3">
        <VerdictBar data={result.verdict} />
      </div>

      <section>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold sm:text-2xl">
              Voices from the internet
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Real quotes pulled from live web research. Click any to verify.
            </p>
          </div>
          <CopyReportButton result={result} idea={idea} audience={audience} />
        </div>
        <VoiceFilterChips
          voices={result.voices}
          value={voiceFilter}
          onChange={setVoiceFilter}
        />
        <VoicesGrid
          voices={filteredVoices}
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

      <section id="personas-section">
        <h2 className="text-xl font-semibold sm:text-2xl">The room reacts</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          3 composite voices, derived from the dominant audience segments.
        </p>
        {activeRescore && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm">
            <div>
              <span className="font-medium">Showing remixed scores for:</span>{" "}
              <span className="italic">
                &ldquo;{activeRescore.angle}&rdquo;
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearRescore}
            >
              ← Back to original
            </Button>
          </div>
        )}
        {rescoreError && !activeRescore && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{rescoreError}</AlertDescription>
          </Alert>
        )}
        <PersonaCards
          personas={result.personas}
          overrides={activeRescore?.overrides}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold sm:text-2xl">Sharper angles</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Reframed using your audience&apos;s actual language. Hit{" "}
          <span className="font-medium">Re-score the room</span> to test any
          angle against the same 3 personas.
        </p>
        <SharperAngles
          angles={result.sharper_angles}
          onJumpToVoice={jumpToVoice}
          onRescore={handleRescore}
          rescoringAngle={rescoringAngle}
          activeRescoreAngle={activeRescore?.angle ?? null}
        />
      </section>

      <AskTheRoom
        key={result.personas.map((p) => p.name).join("|")}
        personas={result.personas}
        idea={idea}
        audience={audience}
      />

      <SearchSuggestions data={result.groundingMetadata} />
    </div>
  )
}
