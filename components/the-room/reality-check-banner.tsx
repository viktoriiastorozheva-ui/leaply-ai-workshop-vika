import type { RealityCheck } from "@/lib/schemas/room-schema"

import { velocityStyles } from "./persona-colors"

export function RealityCheckBanner({ data }: { data: RealityCheck }) {
  const v = velocityStyles[data.trending_velocity]

  return (
    <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="mb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Reality check
          </div>
          <h2 className="text-2xl leading-tight font-bold sm:text-3xl">
            {data.verdict}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {data.summary}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-6 sm:flex-col sm:items-end sm:gap-2">
          <div className="text-right">
            <div className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Score
            </div>
            <div className="text-4xl font-bold sm:text-5xl">
              {data.reality_score}
              <span className="text-xl font-normal text-muted-foreground">
                /10
              </span>
            </div>
          </div>
          <div
            className={`flex items-center gap-1.5 text-sm font-medium ${v.class}`}
          >
            <span className="text-lg leading-none">{v.arrow}</span>
            <span>{v.label}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
