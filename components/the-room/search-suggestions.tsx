import type { GroundingMetadata } from "@/lib/schemas/room-schema"

// Renders the Google Search Suggestions block.
// Required by the Gemini API Terms of Service when using the googleSearch tool —
// the rendered HTML comes directly from Google (searchEntryPoint.renderedContent)
// and must be displayed verbatim, hence dangerouslySetInnerHTML.
export function SearchSuggestions({ data }: { data: GroundingMetadata }) {
  if (!data.searchEntryPoint && data.chunkCount === 0) return null

  return (
    <section className="border-t pt-8">
      <h2 className="mb-2 text-base font-semibold">
        Search context (powered by Google Search)
      </h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Grounded in {data.chunkCount} live web source
        {data.chunkCount === 1 ? "" : "s"}.
      </p>

      {data.searchEntryPoint && (
        <div
          className="search-entry-point [&_a]:text-primary [&_a]:underline"
          // Google-provided pre-rendered HTML — must be displayed verbatim per Gemini API ToS.
          dangerouslySetInnerHTML={{
            __html: data.searchEntryPoint,
          }}
        />
      )}
    </section>
  )
}
