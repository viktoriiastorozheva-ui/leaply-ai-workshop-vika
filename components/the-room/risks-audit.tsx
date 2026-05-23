"use client"

import { useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type {
  RiskCategory,
  RiskItem,
  RiskOverall,
  RisksResponse,
  Verdict,
  Voice,
} from "@/lib/schemas/room-schema"

const CATEGORY_LABEL: Record<RiskCategory, string> = {
  legal: "Legal",
  "audience-harm": "Audience harm",
  credibility: "Credibility",
  "brand-safety": "Brand safety",
  cultural: "Cultural",
  other: "Other",
}

const OVERALL_STYLE: Record<RiskOverall, { label: string; class: string }> = {
  clear: {
    label: "Clear to ship",
    class:
      "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-100 dark:border-emerald-700",
  },
  "minor-concerns": {
    label: "Minor concerns",
    class:
      "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/40 dark:text-amber-100 dark:border-amber-700",
  },
  "major-concerns": {
    label: "Major concerns — rethink",
    class:
      "bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-900/40 dark:text-rose-100 dark:border-rose-700",
  },
}

function severityStyle(value: number) {
  if (value >= 5)
    return "bg-rose-200 text-rose-900 dark:bg-rose-900/60 dark:text-rose-100"
  if (value >= 3)
    return "bg-orange-200 text-orange-900 dark:bg-orange-900/60 dark:text-orange-100"
  return "bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100"
}

export function RisksAudit({
  idea,
  audience,
  verdict,
  voices,
}: {
  idea: string
  audience: string
  verdict: Verdict
  voices: Voice[]
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<RisksResponse | null>(null)

  async function handleRun() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/room/risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea,
          audience,
          verdict: { headline: verdict.headline, summary: verdict.summary },
          voices: voices.map((v) => ({
            quote: v.quote,
            sentiment: v.sentiment,
          })),
        }),
      })
      const payload: RisksResponse | { error?: string } = await res.json()
      if (!res.ok || !("overall" in payload)) {
        setError(
          ("error" in payload && payload.error) ||
            "Couldn't audit risks. Please try again."
        )
        return
      }
      setData(payload)
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
            Risks & red flags
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A second-opinion audit — legal, audience harm, credibility, brand
            safety, cultural. Honest. Empty if nothing to flag.
          </p>
        </div>
        <Button
          type="button"
          onClick={handleRun}
          disabled={loading}
          variant={data ? "outline" : "default"}
          size="sm"
        >
          {loading ? "Auditing…" : data ? "↻ Re-audit" : "🚨 Check for risks"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && !data && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
          <span>
            Reviewing the idea against legal, ethical, and brand-safety lenses…
          </span>
        </div>
      )}

      {data && <RisksContent data={data} />}
    </section>
  )
}

function RisksContent({ data }: { data: RisksResponse }) {
  const overall = OVERALL_STYLE[data.overall]
  return (
    <div className="flex flex-col gap-4">
      <div
        className={`flex flex-wrap items-center gap-3 rounded-xl border p-4 ${overall.class}`}
      >
        <span className="rounded-full bg-white/40 px-3 py-1 text-xs font-semibold tracking-wider uppercase dark:bg-black/30">
          {overall.label}
        </span>
        <p className="flex-1 text-sm leading-relaxed">{data.overall_summary}</p>
      </div>

      {data.risks.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No specific risks flagged. Looks shippable as written.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {data.risks
            .slice()
            .sort((a, b) => b.severity - a.severity)
            .map((r, idx) => (
              <RiskCard key={idx} risk={r} />
            ))}
        </div>
      )}
    </div>
  )
}

function RiskCard({ risk }: { risk: RiskItem }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${severityStyle(
              risk.severity
            )}`}
          >
            Severity {risk.severity}/5
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
            {CATEGORY_LABEL[risk.category]}
          </span>
        </div>
        <p className="text-sm leading-relaxed">
          <span className="font-medium">Issue:</span> {risk.issue}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Mitigation:</span>{" "}
          {risk.mitigation}
        </p>
      </CardContent>
    </Card>
  )
}
