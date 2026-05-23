"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type {
  SentimentBreakdown,
  SourceBreakdownItem,
} from "@/lib/schemas/room-schema"

import { sentimentStyles } from "./persona-colors"

const sentimentChartConfig: ChartConfig = {
  pain: { label: "Pain", color: sentimentStyles.pain.hex },
  desire: { label: "Desire", color: sentimentStyles.desire.hex },
  skepticism: { label: "Skepticism", color: sentimentStyles.skepticism.hex },
  praise: { label: "Praise", color: sentimentStyles.praise.hex },
  frustration: {
    label: "Frustration",
    color: sentimentStyles.frustration.hex,
  },
}

const sourceChartConfig: ChartConfig = {
  count: { label: "Count", color: "var(--primary)" },
}

function buildSentimentData(s: SentimentBreakdown) {
  return (["pain", "desire", "skepticism", "praise", "frustration"] as const)
    .map((key) => ({
      key,
      label: sentimentStyles[key].label,
      value: s[key],
      fill: sentimentStyles[key].hex,
    }))
    .filter((d) => d.value > 0)
}

export function SignalCharts({
  sentiment,
  source,
}: {
  sentiment: SentimentBreakdown
  source: SourceBreakdownItem[]
}) {
  const sentimentData = buildSentimentData(sentiment)
  const sourceData = [...source]
    .sort((a, b) => b.count - a.count)
    .map((d) => ({ source_type: d.source_type, count: d.count }))

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="rounded-xl border p-5">
        <h3 className="mb-1 text-base font-semibold">Sentiment mix</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Share of voices by emotional signal.
        </p>
        {sentimentData.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No sentiment signal returned.
          </p>
        ) : (
          <ChartContainer
            config={sentimentChartConfig}
            className="mx-auto aspect-square max-h-[260px]"
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={sentimentData}
                dataKey="value"
                nameKey="label"
                innerRadius={48}
                outerRadius={92}
                strokeWidth={2}
                paddingAngle={2}
              >
                {sentimentData.map((d) => (
                  <Cell key={d.key} fill={d.fill} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="label" />} />
            </PieChart>
          </ChartContainer>
        )}
      </div>

      <div className="rounded-xl border p-5">
        <h3 className="mb-1 text-base font-semibold">Sources</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Where the voices came from, sorted by volume.
        </p>
        {sourceData.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No source distribution returned.
          </p>
        ) : (
          <ChartContainer
            config={sourceChartConfig}
            className="max-h-[260px] w-full"
          >
            <BarChart
              data={sourceData}
              layout="vertical"
              margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" hide />
              <YAxis
                dataKey="source_type"
                type="category"
                width={90}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={[0, 4, 4, 0]}
              >
                <LabelList
                  dataKey="count"
                  position="right"
                  className="fill-foreground text-xs"
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </div>
    </div>
  )
}
