import type { Verdict } from "@/lib/schemas/room-schema"

import { velocityStyles } from "./persona-colors"

export function VerdictBar({ data }: { data: Verdict }) {
  const v = velocityStyles[data.trending]

  return (
    <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        {/* Reality score */}
        <div className="flex shrink-0 items-baseline gap-1">
          <span className="text-6xl leading-none font-bold sm:text-7xl">
            {data.reality_score}
          </span>
          <span className="text-2xl font-normal text-muted-foreground">
            /10
          </span>
        </div>

        {/* Trending */}
        <div
          className={`flex shrink-0 items-center gap-2 text-base font-semibold ${v.class}`}
        >
          <span className="text-2xl leading-none">{v.arrow}</span>
          <span>{v.label}</span>
        </div>

        {/* Headline + summary */}
        <div className="flex-1 lg:border-l lg:pl-6">
          <div className="mb-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Reality check
          </div>
          <h2 className="text-xl leading-tight font-bold sm:text-2xl">
            {data.headline}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {data.summary}
          </p>
        </div>
      </div>
    </section>
  )
}
