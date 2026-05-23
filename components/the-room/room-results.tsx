import { IdeaVsReality } from "@/components/the-room/idea-vs-reality"
import { PainPatterns } from "@/components/the-room/pain-patterns"
import { PersonaCards } from "@/components/the-room/persona-cards"
import { RealityCheckBanner } from "@/components/the-room/reality-check-banner"
import { SearchSuggestions } from "@/components/the-room/search-suggestions"
import { SharperAngles } from "@/components/the-room/sharper-angles"
import { VoicesGrid } from "@/components/the-room/voices-grid"
import type { RoomResponse } from "@/lib/schemas/room-schema"

export function RoomResults({ result }: { result: RoomResponse }) {
  return (
    <div className="flex flex-col gap-12">
      <RealityCheckBanner data={result.reality_check} />

      <section>
        <h2 className="text-xl font-semibold sm:text-2xl">
          Voices from the Internet
        </h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Real quotes pulled from current online discussions.
        </p>
        <VoicesGrid voices={result.voices} />
      </section>

      <section>
        <h2 className="text-xl font-semibold sm:text-2xl">Pain Patterns</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          What keeps coming up — and the words people use.
        </p>
        <PainPatterns patterns={result.pain_patterns} />
      </section>

      <section>
        <h2 className="text-xl font-semibold sm:text-2xl">The Room Reacts</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Three composite voices from the dominant audience segments.
        </p>
        <PersonaCards personas={result.personas} />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold sm:text-2xl">
          Your Idea vs Reality
        </h2>
        <IdeaVsReality data={result.idea_vs_reality} />
      </section>

      <section>
        <h2 className="text-xl font-semibold sm:text-2xl">Sharper Angles</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Reframes using your audience&apos;s actual words.
        </p>
        <SharperAngles angles={result.sharper_angles} />
      </section>

      <SearchSuggestions data={result.groundingMetadata} />
    </div>
  )
}
