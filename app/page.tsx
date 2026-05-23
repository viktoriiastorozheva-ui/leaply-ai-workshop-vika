"use client"

import { useState } from "react"

import { LiveSearchLoader } from "@/components/the-room/live-search-loader"
import { RoomResults } from "@/components/the-room/room-results"
import {
  emitRunsChanged,
  RunsHistory,
} from "@/components/the-room/runs-history"
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

export default function Page() {
  const [idea, setIdea] = useState("")
  const [audience, setAudience] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
        setError(data?.error ?? "Something went wrong. Please try again.")
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
      setError(
        "Couldn't reach the server. Check your internet connection and try again."
      )
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
      <header className="mb-10 sm:mb-14">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              THE ROOM
            </h1>
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">
              Reality check for marketing ideas, grounded in real internet
              signal.
            </p>
          </div>
          <div className="shrink-0">
            <RunsHistory onRestore={handleRestore} />
          </div>
        </div>
      </header>

      <Card className="mb-10">
        <CardHeader>
          <CardTitle>Your idea</CardTitle>
          <CardDescription>
            Describe what you want to test, then who it&apos;s for. Hit{" "}
            <span className="font-medium">Run the room</span> — we&apos;ll
            search the live web for real voices and synthesize the verdict.
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
              className="self-start"
            >
              {loading ? "Running…" : "Run the room"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading && (
        <div className="my-10">
          <LiveSearchLoader />
        </div>
      )}

      {error && !loading && (
        <Alert variant="destructive" className="mb-10">
          <AlertDescription>{error}</AlertDescription>
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
