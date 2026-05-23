import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Persona, PersonaScores } from "@/lib/schemas/room-schema"

import { personaColorStyles, scoreClass } from "./persona-colors"

function ScorePill({
  label,
  value,
  original,
}: {
  label: string
  value: number
  original?: number
}) {
  const delta = typeof original === "number" ? value - original : null
  let deltaLabel: { text: string; cls: string } | null = null
  if (delta !== null && delta !== 0) {
    const sign = delta > 0 ? "+" : ""
    deltaLabel = {
      text: `${sign}${delta}`,
      cls:
        delta > 0
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-rose-600 dark:text-rose-400",
    }
  }
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-baseline gap-1">
        <span
          className={`inline-flex h-9 w-12 items-center justify-center rounded-md text-sm ${scoreClass(
            value
          )}`}
        >
          {value}
        </span>
        {deltaLabel && (
          <span className={`text-xs font-medium ${deltaLabel.cls}`}>
            {deltaLabel.text}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
        {label}
      </span>
    </div>
  )
}

export type PersonaOverride = {
  scores: PersonaScores
  gut_reaction: string
  what_changed: string
}

export function PersonaCards({
  personas,
  overrides,
}: {
  personas: Persona[]
  // Keyed by persona.name when rescore data exists.
  overrides?: Record<string, PersonaOverride>
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {personas.map((p) => {
        const style = personaColorStyles[p.color]
        const override = overrides?.[p.name]
        const scores = override?.scores ?? p.scores
        const reaction = override?.gut_reaction ?? p.gut_reaction
        return (
          <Card key={p.name} className={style.border}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base leading-tight">
                  {p.name}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    · {p.age}
                  </span>
                </CardTitle>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${style.badge}`}
                >
                  {style.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{p.occupation}</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-sm">
              <p className="leading-relaxed text-muted-foreground">
                {p.context}
              </p>

              <div>
                <div className="mb-1 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                  {override ? "Gut reaction (remixed)" : "Gut reaction"}
                </div>
                <p className="leading-relaxed italic">
                  &ldquo;{reaction}&rdquo;
                </p>
              </div>

              <div className="flex items-center justify-around border-t pt-3">
                <ScorePill
                  label="Buy"
                  value={scores.buy}
                  original={override ? p.scores.buy : undefined}
                />
                <ScorePill
                  label="Trust"
                  value={scores.trust}
                  original={override ? p.scores.trust : undefined}
                />
                <ScorePill
                  label="Share"
                  value={scores.share}
                  original={override ? p.scores.share : undefined}
                />
              </div>

              {override && (
                <p className="border-t pt-3 text-xs leading-relaxed text-muted-foreground">
                  <span className="font-medium">Why it moved:</span>{" "}
                  {override.what_changed}
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
