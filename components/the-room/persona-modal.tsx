"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import type {
  Persona,
  PersonaColor,
  Sentiment,
  Voice,
} from "@/lib/schemas/room-schema"

import {
  avatarColorClass,
  avatarInitial,
  personaColorStyles,
  sentimentStyles,
} from "./persona-colors"

// Heuristic: each persona color tends to align with certain sentiments. We
// score every voice by how well it matches the persona's color archetype and
// pick the top 3. Crude but effective for "voices like this one would resonate
// with this persona."
const COLOR_PREFERENCES: Record<PersonaColor, Sentiment[]> = {
  green: ["desire", "praise", "frustration"],
  yellow: ["frustration", "pain", "skepticism"],
  red: ["skepticism", "pain", "frustration"],
}

function alignmentScore(persona: Persona, voice: Voice) {
  const prefs = COLOR_PREFERENCES[persona.color]
  const idx = prefs.indexOf(voice.sentiment)
  if (idx === -1) return 0
  return prefs.length - idx // higher = better
}

function pickAlignedVoices(persona: Persona, voices: Voice[], n = 3) {
  return [...voices]
    .map((v) => ({ v, score: alignmentScore(persona, v) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.v)
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const tone =
    value >= 8
      ? "text-emerald-700 dark:text-emerald-300"
      : value <= 4
        ? "text-rose-700 dark:text-rose-300"
        : "text-foreground"
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium tracking-wider text-muted-foreground uppercase">
          {label}
        </span>
        <span className={`font-semibold ${tone}`}>{value}/10</span>
      </div>
      <Progress value={value * 10} className="h-2" />
    </div>
  )
}

function MiniVoiceCard({ voice }: { voice: Voice }) {
  const s = sentimentStyles[voice.sentiment]
  const card = (
    <Card>
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-center gap-2 text-xs">
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColorClass(
              voice.username
            )}`}
            aria-hidden
          >
            {avatarInitial(voice.username)}
          </div>
          <span className="truncate font-medium">@{voice.username}</span>
          <span className="truncate text-muted-foreground/70">
            · {voice.source_name}
          </span>
          <span
            className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${s.class}`}
          >
            {s.label}
          </span>
        </div>
        <blockquote className="text-sm leading-relaxed italic">
          &ldquo;{voice.quote}&rdquo;
        </blockquote>
        {voice.source_verified && voice.source_url && (
          <div className="text-xs font-medium text-primary">
            ✓ verified source ↗
          </div>
        )}
      </CardContent>
    </Card>
  )
  if (voice.source_verified && voice.source_url) {
    return (
      <a
        href={voice.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        {card}
      </a>
    )
  }
  return card
}

export function PersonaModal({
  persona,
  voices,
  open,
  onClose,
}: {
  persona: Persona | null
  voices: Voice[]
  open: boolean
  onClose: () => void
}) {
  if (!persona) return null
  const style = personaColorStyles[persona.color]
  const aligned = pickAlignedVoices(persona, voices, 3)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 pr-6">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold ${avatarColorClass(
                persona.name
              )}`}
              aria-hidden
            >
              {avatarInitial(persona.name)}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl leading-tight">
                {persona.name}
                <span className="ml-1 text-base font-normal text-muted-foreground">
                  · {persona.age}
                </span>
              </DialogTitle>
              <DialogDescription className="text-sm">
                {persona.occupation}
              </DialogDescription>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${style.badge}`}
            >
              {style.label}
            </span>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-5 pt-2">
          <p className="text-sm leading-relaxed">{persona.context}</p>

          <div>
            <div className="mb-1 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
              Gut reaction
            </div>
            <p className="text-sm leading-relaxed italic">
              &ldquo;{persona.gut_reaction}&rdquo;
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border p-4">
            <ScoreBar label="Buy" value={persona.scores.buy} />
            <ScoreBar label="Trust" value={persona.scores.trust} />
            <ScoreBar label="Share" value={persona.scores.share} />
          </div>

          <div>
            <h3 className="mb-1 text-sm font-semibold">
              Voices this persona aligns with
            </h3>
            <p className="mb-3 text-xs text-muted-foreground">
              From the live research — quotes whose tone matches{" "}
              {persona.name.split(" ")[0]}
              &apos;s profile.
            </p>
            {aligned.length === 0 ? (
              <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                No strongly-aligned voices in this run.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {aligned.map((v) => (
                  <MiniVoiceCard key={v.voice_index} voice={v} />
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
