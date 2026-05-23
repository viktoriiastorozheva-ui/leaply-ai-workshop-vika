import { Card, CardContent } from "@/components/ui/card"
import type { IdeaVsReality as IdeaVsRealityType } from "@/lib/schemas/room-schema"

export function IdeaVsReality({ data }: { data: IdeaVsRealityType }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-center gap-3 text-center">
        <div className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          Match score
        </div>
        <div className="text-4xl font-bold">
          {data.match_score}
          <span className="text-xl font-normal text-muted-foreground">/10</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-5">
            <h3 className="mb-3 text-base font-semibold text-emerald-700 dark:text-emerald-300">
              What hits ✓
            </h3>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
              {data.what_hits.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500">
          <CardContent className="p-5">
            <h3 className="mb-3 text-base font-semibold text-rose-700 dark:text-rose-300">
              What misses ✗
            </h3>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
              {data.what_misses.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
