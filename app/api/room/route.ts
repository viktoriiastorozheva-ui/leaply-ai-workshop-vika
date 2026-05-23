import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"

import { env } from "@/lib/env"
import {
  ROOM_JSON_SCHEMA,
  RoomRequestSchema,
  SynthesisResponseSchema,
  type GroundingMetadata,
} from "@/lib/schemas/room-schema"

export const runtime = "nodejs"
// Two sequential Gemini calls (research + synthesis) can take 30–60s.
// Vercel Hobby allows up to 60s on the Node.js runtime.
export const maxDuration = 60

const SYNTHESIS_SYSTEM_PROMPT = `You are THE ROOM — a research-grounded marketing reality check.

You receive: an idea, audience, research notes from a live web search, and a list of VALID SOURCE URLS.

Output ENGLISH ONLY. Strict JSON matching the provided schema.

RULES:
- For every "voice" entry, source_url must come from the VALID SOURCE URLS list provided in the user message, or be an empty string if no valid URL maps to that quote.
- NEVER invent URLs. NEVER fabricate Reddit threads. NEVER make up usernames.
- Generate 3 composite personas grounded in the research (the dominant segments visible in the data), with short context and a one-line gut reaction. No multi-message conversations.
- Sharper angles must each reference the voice_index they were inspired by.
- All sentiment, frequencies, scores must be honestly derived from the research, not invented.`

type ResearchChunk = {
  web?: { uri?: string; title?: string }
}

export async function POST(req: NextRequest) {
  if (!env.GEMINI_API_KEY) {
    return NextResponse.json(
      {
        error:
          "Server is not configured: GEMINI_API_KEY is missing. Set it in .env.local for local dev, or in the Vercel dashboard for production.",
      },
      { status: 500 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const parsed = RoomRequestSchema.safeParse(body)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return NextResponse.json(
      { error: firstIssue?.message ?? "Invalid input." },
      { status: 400 }
    )
  }
  const { idea, audience } = parsed.data

  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })

  // ===== Call 1: RESEARCH with Google Search grounding =====
  let researchText = ""
  let validSources: { index: number; url: string; title: string }[] = []
  let searchEntryPointHtml: string | null = null
  let chunkCount = 0

  try {
    const research = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are a marketing researcher. Conduct LIVE WEB RESEARCH for a marketing reality check.

IDEA: ${idea}
TARGET AUDIENCE: ${audience}

Search the live web — Reddit, Trustpilot, forum threads, review sites, news articles, social discussions. For this idea + audience, extract:

1. Verbatim quotes from real users (especially with pain, desire, skepticism, frustration signals)
2. Recurring language and phrasing the audience actually uses
3. Whether the discussion is growing, stable, or fading right now
4. Saturated angles vs underserved gaps in the existing conversation

Search broadly. Return rich research notes — include verbatim quotes and where they're from. The next step will synthesize this; be comprehensive.`,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
      },
    })

    researchText = research.text ?? ""

    const candidate = research.candidates?.[0] as
      | {
          groundingMetadata?: {
            searchEntryPoint?: { renderedContent?: string }
            groundingChunks?: ResearchChunk[]
          }
        }
      | undefined

    const gm = candidate?.groundingMetadata
    const groundingChunks = gm?.groundingChunks ?? []
    chunkCount = groundingChunks.length
    searchEntryPointHtml = gm?.searchEntryPoint?.renderedContent ?? null

    validSources = groundingChunks
      .map((chunk, i) => ({
        index: i + 1, // 1-based to match voice_index convention
        url: chunk?.web?.uri ?? "",
        title: chunk?.web?.title ?? "",
      }))
      .filter((s) => s.url)

    if (!researchText) {
      return NextResponse.json(
        {
          error:
            "The research step returned no text. The model may have refused or hit a quota. Please try again.",
        },
        { status: 502 }
      )
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("THE ROOM research-call error:", err)
    return NextResponse.json(
      { error: `Research step failed: ${message}` },
      { status: 502 }
    )
  }

  // ===== Call 2: SYNTHESIS — strict JSON, no tools, URL-constrained =====
  const validSourcesBlock =
    validSources.length > 0
      ? validSources
          .map((s) => `[${s.index}] ${s.title || "(untitled)"} — ${s.url}`)
          .join("\n")
      : "(no verified URLs were returned from the live search; leave every source_url empty and set source_verified to false)"

  const synthesisUserMessage = `IDEA: ${idea}
AUDIENCE: ${audience}

RESEARCH NOTES FROM LIVE WEB:
${researchText}

VALID SOURCE URLS (you may ONLY reference these — do NOT invent any other URLs):
${validSourcesBlock}

Synthesize the research into the structured output. For each voice's source_url field: pick from the VALID SOURCE URLS list above. If no valid URL exists for a quote you want to include, leave source_url as empty string and set source_verified to false. Otherwise set source_verified to true.

Output strict JSON only.`

  let rawSynthesis = ""
  try {
    const synthesis = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: synthesisUserMessage,
      config: {
        systemInstruction: SYNTHESIS_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseJsonSchema: ROOM_JSON_SCHEMA,
        temperature: 0.7,
      },
    })

    rawSynthesis = synthesis.text ?? ""

    if (!rawSynthesis) {
      return NextResponse.json(
        { error: "The synthesis step returned no text. Please try again." },
        { status: 502 }
      )
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("THE ROOM synthesis-call error:", err)
    return NextResponse.json(
      { error: `Synthesis step failed: ${message}` },
      { status: 502 }
    )
  }

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(rawSynthesis)
  } catch {
    console.error(
      "THE ROOM synthesis JSON parse failed. Raw text:",
      rawSynthesis
    )
    return NextResponse.json(
      {
        error:
          "The model returned malformed JSON. Please try again — it usually works on retry.",
      },
      { status: 502 }
    )
  }

  const validated = SynthesisResponseSchema.safeParse(parsedJson)
  if (!validated.success) {
    console.error(
      "THE ROOM synthesis schema mismatch:",
      validated.error.flatten()
    )
    return NextResponse.json(
      {
        error:
          "The model returned data in an unexpected shape. Please try again.",
      },
      { status: 502 }
    )
  }

  // Belt-and-suspenders: scrub any URL the model might have invented despite the
  // explicit instruction. If a voice's source_url isn't in our validSources, we
  // wipe it and force source_verified to false.
  const allowedUrls = new Set(validSources.map((s) => s.url))
  const cleaned = {
    ...validated.data,
    voices: validated.data.voices.map((v) => {
      if (v.source_url && !allowedUrls.has(v.source_url)) {
        return { ...v, source_url: "", source_verified: false }
      }
      // Also: if the model claimed verified but URL is empty, demote.
      if (!v.source_url && v.source_verified) {
        return { ...v, source_verified: false }
      }
      return v
    }),
  }

  const groundingMetadata: GroundingMetadata = {
    searchEntryPoint: searchEntryPointHtml,
    chunkCount,
  }

  return NextResponse.json({ ...cleaned, groundingMetadata })
}
