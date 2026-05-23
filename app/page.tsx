"use client"

import { useState } from "react"

import { LiveSearchLoader } from "@/components/the-room/live-search-loader"
import { RoomResults } from "@/components/the-room/room-results"
import {
  emitRunsChanged,
  RunsHistory,
} from "@/components/the-room/runs-history"
import { ThemeToggle } from "@/components/the-room/theme-toggle"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { saveRun, type SavedRun } from "@/lib/runs-storage"
import type { RoomResponse } from "@/lib/schemas/room-schema"

const IDEA_PLACEHOLDER =
  'New Instagram ad — woman notices sock marks on her ankles, voiceover says "Your body is asking for help. Take the 3-min lymph test."'
const AUDIENCE_PLACEHOLDER = "Women 30-45 with bloating and tiredness"

type ErrorState =
  | { kind: "generic"; message: string }
  | { kind: "sanity_check"; message: string; suggested_fix: string }
  | null

export default function Page() {
  const [idea, setIdea] = useState("")
  const [audience, setAudience] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ErrorState>(null)
  const [result, setResult] = useState<RoomResponse | null>(null)
  // Snapshot the idea + audience that produced the current result, so that
  // follow-up "Ask the room" calls use the exact same context even if the
  // user edits the form afterwards.
  const [submittedIdea, setSubmittedIdea] = useState("")
  const [submittedAudience, setSubmittedAudience] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch("/api/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, audience }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data?.kind === "sanity_check" && data?.suggested_fix) {
          setError({
            kind: "sanity_check",
            message: data.error ?? "That pairing doesn't quite add up.",
            suggested_fix: data.suggested_fix,
          })
        } else {
          setError({
            kind: "generic",
            message: data?.error ?? "Something went wrong. Please try again.",
          })
        }
        return
      }

      const room = data as RoomResponse
      setResult(room)
      setSubmittedIdea(idea)
      setSubmittedAudience(audience)
      // Persist to localStorage so the user can come back to this run later.
      saveRun({ idea, audience, result: room })
      emitRunsChanged()
    } catch {
      setError({
        kind: "generic",
        message:
          "Couldn't reach the server. Check your internet connection and try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  function handleRestore(run: SavedRun) {
    setResult(run.result)
    setSubmittedIdea(run.idea)
    setSubmittedAudience(run.audience)
    setIdea(run.idea)
    setAudience(run.audience)
    setError(null)
    // Smooth-scroll to the results so the user sees the change.
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }, 0)
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
      <header className="aurora mb-10 sm:mb-14">
        <div className="relative flex items-start justify-between gap-3 py-8 sm:py-14">
          <div className="flex-1 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/70 px-3 py-1 text-[11px] font-medium tracking-wider text-primary uppercase backdrop-blur">
              <span className="size-1.5 animate-pulse rounded-full bg-primary" />
              live reality check
            </div>
            <h1 className="font-heading text-5xl leading-[0.95] font-normal tracking-tight sm:text-7xl">
              The <span className="glow-primary text-primary italic">Room</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Drop in an idea. We&apos;ll search the live web for{" "}
              <span className="font-heading text-foreground italic">
                real voices
              </span>{" "}
              and tell you what your audience actually thinks.
            </p>
          </div>
          <div className="absolute top-0 right-0 flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <RunsHistory onRestore={handleRestore} />
          </div>
        </div>
      </header>

      <Card className="mb-10 border-primary/15 shadow-[0_8px_40px_-20px_color-mix(in_oklch,var(--primary)_45%,transparent)]">
        <CardHeader>
          <CardTitle className="font-heading text-2xl font-normal">
            Your <span className="text-primary italic">idea</span>
          </CardTitle>
          <CardDescription>
            Describe what you want to test, then who it&apos;s for. Hit{" "}
            <span className="font-medium text-foreground">Run the room</span> —
            we&apos;ll search the live web for real voices and synthesize the
            verdict.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid gap-2">
              <Label htmlFor="idea">Your idea</Label>
              <Textarea
                id="idea"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder={IDEA_PLACEHOLDER}
                rows={5}
                maxLength={2000}
                disabled={loading}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="audience">Target audience (1 sentence)</Label>
              <Input
                id="audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder={AUDIENCE_PLACEHOLDER}
                maxLength={2000}
                disabled={loading}
                required
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={loading || !idea.trim() || !audience.trim()}
              className="self-start shadow-[0_8px_30px_-8px_color-mix(in_oklch,var(--primary)_70%,transparent)] transition-shadow hover:shadow-[0_12px_40px_-8px_color-mix(in_oklch,var(--primary)_80%,transparent)]"
            >
              {loading ? "Running…" : "Run the room →"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading && (
        <div className="my-10">
          <LiveSearchLoader />
        </div>
      )}

      {error && !loading && error.kind === "sanity_check" && (
        <Alert className="mb-10 border-primary/30 bg-primary/5">
          <AlertDescription className="flex flex-col gap-2 text-foreground">
            <div className="flex items-center gap-2 text-[10px] font-medium tracking-[0.2em] text-primary uppercase">
              <span className="size-1 rounded-full bg-primary" />
              The room paused
            </div>
            <div className="font-heading text-xl leading-snug font-normal italic">
              {error.message}
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Try this:</span>{" "}
              {error.suggested_fix}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {error && !loading && error.kind === "generic" && (
        <Alert variant="destructive" className="mb-10">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {result && !loading && (
        <RoomResults
          result={result}
          idea={submittedIdea}
          audience={submittedAudience}
        />
      )}

      <footer className="mt-16 text-center text-xs text-muted-foreground">
        Powered by Gemini · Built with Next.js
      </footer>
    </main>
  )
}
