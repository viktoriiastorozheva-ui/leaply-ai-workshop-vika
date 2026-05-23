import type { GroundingMetadata } from "@/lib/schemas/room-schema"

// Renders the Google Search Suggestions block.
// Required by the Gemini API Terms of Service when using the googleSearch tool —
// the rendered HTML comes directly from Google (searchEntryPoint.renderedContent)
// and must be displayed verbatim, hence dangerouslySetInnerHTML.
export function SearchSuggestions({ data }: { data: GroundingMetadata }) {
  const hasSearchEntry = Boolean(data.searchEntryPoint)
  const hasChunks = data.chunks.length > 0

  if (!hasSearchEntry && !hasChunks) return null

  return (
    <section className="border-t pt-8">
      <h2 className="mb-2 text-base font-semibold">
        Search context (powered by Google Search)
      </h2>
      <p className="mb-4 text-xs text-muted-foreground">
        The reality check was grounded in the search results below.
      </p>

      {hasSearchEntry && (
        <div
          className="search-entry-point mb-4 [&_a]:text-primary [&_a]:underline"
          // Google-provided pre-rendered HTML — must be displayed verbatim per Gemini API ToS.
          dangerouslySetInnerHTML={{ __html: data.searchEntryPoint as string }}
        />
      )}

      {hasChunks && (
        <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
          {data.chunks.map((chunk, idx) => {
            const uri = chunk.web?.uri
            const title = chunk.web?.title ?? uri
            if (!uri) return null
            return (
              <li key={idx}>
                <a
                  href={uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary hover:underline"
                >
                  ↗ {title}
                </a>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
