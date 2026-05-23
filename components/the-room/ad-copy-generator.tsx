"use client"

import { useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type {
  AdCopyResponse,
  AdVariant,
  Persona,
  SharperAngle,
  Verdict,
} from "@/lib/schemas/room-schema"

export function AdCopyGenerator({
  idea,
  audience,
  verdict,
  personas,
  sharperAngles,
}: {
  idea: string
  audience: string
  verdict: Verdict
  personas: Persona[]
  sharperAngles: SharperAngle[]
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [variants, setVariants] = useState<AdVariant[] | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/room/adcopy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea,
          audience,
          verdict: { headline: verdict.headline, summary: verdict.summary },
          personas,
          sharper_angles: sharperAngles,
        }),
      })
      const data: AdCopyResponse | { error?: string } = await res.json()
      if (!res.ok || !("variants" in data)) {
        setError(
          ("error" in data && data.error) ||
            "Couldn't generate ad copy. Please try again."
        )
        return
      }
      setVariants(data.variants)
    } catch {
      setError(
        "Couldn't reach the server. Check your internet connection and try again."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold sm:text-2xl">
            Ready-to-paste ad copy
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Three platform variants written by Gemini using the audience
            language above — paste straight into Ads Manager.
          </p>
        </div>
        <Button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          size="sm"
        >
          {loading
            ? "Writing…"
            : variants
              ? "↻ Regenerate"
              : "✨ Generate ad copy"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && !variants && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
          <span>Drafting headlines, body copy, and CTAs…</span>
        </div>
      )}

      {variants && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {variants.map((v, idx) => (
            <VariantCard key={idx} variant={v} />
          ))}
        </div>
      )}
    </section>
  )
}

function VariantCard({ variant }: { variant: AdVariant }) {
  const [copied, setCopied] = useState(false)

  async function copyAll() {
    const block = `${variant.platform}

Headline: ${variant.headline}

${variant.body}

CTA: ${variant.cta}`
    try {
      await navigator.clipboard.writeText(block)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* no-op */
    }
  }

  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex h-full flex-col gap-3 p-5">
        <div className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
          {variant.platform}
        </div>
        <h3 className="text-base leading-snug font-semibold">
          {variant.headline}
        </h3>
        <p className="text-sm leading-relaxed whitespace-pre-line">
          {variant.body}
        </p>
        <div className="inline-block self-start rounded-md bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
          {variant.cta}
        </div>
        <div className="mt-auto border-t pt-3 text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium">Why it works:</span>{" "}
          {variant.why_it_works}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={copyAll}
          className="w-full"
        >
          {copied ? "Copied!" : "📋 Copy this variant"}
        </Button>
      </CardContent>
    </Card>
  )
}
