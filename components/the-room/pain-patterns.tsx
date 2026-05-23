import { Card, CardContent } from "@/components/ui/card"
import type { PainPattern } from "@/lib/schemas/room-schema"

import { frequencyStyles } from "./persona-colors"

export function PainPatterns({ patterns }: { patterns: PainPattern[] }) {
  return (
    <div className="flex flex-col gap-4">
      {patterns.map((p, idx) => {
        const f = frequencyStyles[p.frequency]
        return (
          <Card key={idx}>
            <CardContent className="p-5">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold">{p.name}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${f.class}`}
                >
                  {f.label}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {p.description}
              </p>
              {p.sample_phrases.length > 0 && (
                <div className="mt-3">
                  <div className="mb-2 text-xs font-medium text-muted-foreground">
                    They say it like this:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {p.sample_phrases.map((phrase, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-muted px-3 py-1 text-xs text-foreground italic"
                      >
                        &ldquo;{phrase}&rdquo;
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
