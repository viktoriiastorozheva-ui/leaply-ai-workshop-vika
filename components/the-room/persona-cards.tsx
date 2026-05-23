import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Persona } from "@/lib/schemas/room-schema"

import { personaColorStyles, scoreClass } from "./persona-colors"

function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className={`inline-flex h-9 w-12 items-center justify-center rounded-md text-sm ${scoreClass(
          value
        )}`}
      >
        {value}
      </span>
      <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
        {label}
      </span>
    </div>
  )
}

export function PersonaCards({ personas }: { personas: Persona[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {personas.map((p) => {
        const style = personaColorStyles[p.color]
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
                  Gut reaction
                </div>
                <p className="leading-relaxed italic">
                  &ldquo;{p.gut_reaction}&rdquo;
                </p>
              </div>

              <div className="flex items-center justify-around border-t pt-3">
                <ScorePill label="Buy" value={p.scores.buy} />
                <ScorePill label="Trust" value={p.scores.trust} />
                <ScorePill label="Share" value={p.scores.share} />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
