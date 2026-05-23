import { GoogleGenAI } from "@google/genai"

import {
  SANITY_CHECK_JSON_SCHEMA,
  SanityCheckSchema,
  type SanityCheckResult,
} from "@/lib/schemas/sanity-check"

const SYSTEM_PROMPT = `You are the sanity gate for THE ROOM — a marketing reality-check tool.

You receive an IDEA and an AUDIENCE. Decide if they make any plausible sense together as a real marketing brief that a competent strategist would actually test. Be a bullshit detector, not a moralist.

Return JSON:
- coherent: true if a real marketer could plausibly run this test. false if the pair is logically impossible, internally contradictory, targets minors with adult products, or is obviously a joke / test / single character / gibberish.
- reason: one short sentence in plain English. When not coherent, name the actual mismatch (e.g. "Menopause typically affects women 45+, but the audience is 10-year-olds — those groups don't overlap.").
- suggested_fix: one concrete, actionable suggestion the user can paste back in. Phrase as a hint, not a command (e.g. "Try 'women 45-60 navigating perimenopause' as the audience.").

Examples of NOT coherent:
- Adult-only category + children/minors audience (menopause, mortgage, alcohol, dating apps + kids)
- Demographic contradiction ("men buying menopause cream", "vegans for steakhouses")
- Single character / gibberish for either field
- Empty thesis (just a category name like "Menopause" with no angle to test)
- Two unrelated halves stitched together (e.g. idea about gym shoes, audience about retirees in palliative care)

Be permissive otherwise — unusual is fine, just not impossible.`

export async function sanityCheck(args: {
  apiKey: string
  idea: string
  audience: string
}): Promise<SanityCheckResult | null> {
  const ai = new GoogleGenAI({ apiKey: args.apiKey })
  try {
    const res = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `IDEA: ${args.idea}\nAUDIENCE: ${args.audience}`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseJsonSchema: SANITY_CHECK_JSON_SCHEMA,
        temperature: 0.1,
      },
    })
    const text = res.text ?? ""
    if (!text) return null
    const parsed = SanityCheckSchema.safeParse(JSON.parse(text))
    if (!parsed.success) return null
    return parsed.data
  } catch (err) {
    // Fail-open: if the gate itself errors, let the request through.
    // Better to occasionally analyze garbage than to block real users
    // because of a transient API hiccup.
    console.error("Sanity check error:", err)
    return null
  }
}
