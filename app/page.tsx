"use client"

import { useState } from "react"

import { RoomResults } from "@/components/the-room/room-results"
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

      setResult(data as RoomResponse)
    } catch {
      setError(
        "Couldn't reach the server. Check your internet connection and try again."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
      <header className="mb-10 text-center sm:mb-14">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          THE ROOM
        </h1>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          Reality check for marketing ideas, grounded in real internet signal.
        </p>
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
        <div className="my-10 flex flex-col items-center justify-center gap-3 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
          <p className="text-sm text-muted-foreground">
            The room is researching the internet… (this takes 30–60s)
          </p>
        </div>
      )}

      {error && !loading && (
        <Alert variant="destructive" className="mb-10">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && !loading && <RoomResults result={result} />}

      <footer className="mt-16 text-center text-xs text-muted-foreground">
        Powered by Gemini · Built with Next.js
      </footer>
    </main>
  )
}
