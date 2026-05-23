import type { Verdict } from "@/lib/schemas/room-schema"

import { velocityStyles } from "./persona-colors"

export function VerdictBar({ data }: { data: Verdict }) {
  const v = velocityStyles[data.trending]

  return (
    <section className="aurora relative overflow-hidden rounded-3xl border border-primary/20 bg-card/60 p-6 backdrop-blur sm:p-10">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
        {/* Reality score — oversized italic serif, the page's centerpiece */}
        <div className="flex shrink-0 flex-col items-start lg:items-center">
          <div className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
            reality
          </div>
          <div className="flex items-baseline">
            <span className="glow-primary font-heading text-[7rem] leading-[0.85] font-normal text-primary italic sm:text-[9rem]">
              {data.reality_score}
            </span>
            <span className="font-mono text-2xl text-muted-foreground tabular-nums">
              /10
            </span>
          </div>
          <div
            className={`mt-2 flex items-center gap-1.5 text-sm font-semibold ${v.class}`}
          >
            <span className="text-lg leading-none">{v.arrow}</span>
            <span className="tracking-wide uppercase">{v.label}</span>
          </div>
        </div>

        {/* Headline + summary */}
        <div className="flex-1 lg:border-l lg:border-primary/15 lg:pl-8">
          <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-medium tracking-[0.2em] text-primary uppercase">
            <span className="size-1 rounded-full bg-primary" />
            verdict
          </div>
          <h2 className="font-heading text-2xl leading-[1.1] font-normal sm:text-4xl">
            {data.headline}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {data.summary}
          </p>
        </div>
      </div>
    </section>
  )
}
