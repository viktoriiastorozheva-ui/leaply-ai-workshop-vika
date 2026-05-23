import { Card, CardContent } from "@/components/ui/card"
import type { Voice } from "@/lib/schemas/room-schema"

import { sentimentStyles } from "./persona-colors"

export function VoicesGrid({ voices }: { voices: Voice[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {voices.map((v, idx) => {
        const s = sentimentStyles[v.sentiment]
        return (
          <Card key={idx}>
            <CardContent className="flex h-full flex-col gap-4 p-5">
              <blockquote className="relative text-base leading-relaxed italic">
                <span
                  aria-hidden
                  className="absolute -top-2 -left-1 text-3xl leading-none text-muted-foreground/40"
                >
                  &ldquo;
                </span>
                <span className="ml-4">{v.quote}</span>
              </blockquote>

              <div className="mt-auto flex flex-wrap items-center gap-2 text-xs">
                <span className="font-medium text-muted-foreground">
                  {v.source_name}
                </span>
                <span className="text-muted-foreground/50">·</span>
                <span
                  className={`rounded-full px-2 py-0.5 font-medium ${s.class}`}
                >
                  {s.label}
                </span>
                {v.source_url ? (
                  <>
                    <span className="text-muted-foreground/50">·</span>
                    <a
                      href={v.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      ↗ View source
                    </a>
                  </>
                ) : null}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
