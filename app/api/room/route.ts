import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"

import { env } from "@/lib/env"
import {
  ROOM_JSON_SCHEMA,
  RoomRequestSchema,
  SynthesisResponseSchema,
  type GroundingChunk,
  type GroundingMetadata,
} from "@/lib/schemas/room-schema"

export const runtime = "nodejs"
// Two sequential Gemini calls (research + synthesis) can take 30–60s.
// Vercel Hobby allows up to 60s on the Node.js runtime.
export const maxDuration = 60

// All output must be English regardless of input language — locked in the prompt.
const SYNTHESIS_SYSTEM_PROMPT = `You are THE ROOM — a research-grounded marketing reality check tool.

You will receive: (1) a user's idea, (2) target audience, (3) RESEARCH NOTES from real internet sources about this topic.

Your job: synthesize the research into a structured analysis. EVERYTHING you output must be grounded in the research provided — do not invent quotes, do not fabricate sources. If research is thin in an area, say so honestly.

Generate THREE persona cards that are COMPOSITE PORTRAITS of the real voices found in the research. They should feel like real people from the dominant segments visible in the data — not invented archetypes. Each persona gives ONE punchy reaction (1-2 sentences max) and scores. No long conversations.

One persona must map to color "green" (enthusiastic), one to "yellow" (neutral), one to "red" (skeptical). Make the three personas distinctly different in life stage, sophistication, and attitude toward the category.

OUTPUT LANGUAGE: ENGLISH ONLY. All fields, quotes, names — English. If a research quote was originally in another language, translate it to English and append "(translated)" inside the source_name.

Output strict JSON matching the provided schema.`

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
  let groundingMetadata: GroundingMetadata = {
    searchEntryPoint: null,
    chunks: [],
  }

  try {
    const research = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Research the following for a marketing reality check.

IDEA: ${idea}
TARGET AUDIENCE: ${audience}

Find what real people are saying online about this problem space. Search Reddit, forums, review sites, articles, social media discussions. Extract:

1. Real quotes from real users (verbatim, with source URLs)
2. Recurring pain patterns and the language people use to describe them
3. Evidence whether this need is real, trending, or niche right now
4. What angles are already saturated vs underserved

Be comprehensive. Search broadly. Return rich research notes with sources cited.`,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
      },
    })

    researchText = research.text ?? ""

    // The new SDK exposes grounding info under candidates[0].groundingMetadata.
    // Type signatures vary slightly between SDK versions, so we read defensively.
    const candidate = research.candidates?.[0] as
      | {
          groundingMetadata?: {
            searchEntryPoint?: { renderedContent?: string }
            groundingChunks?: GroundingChunk[]
          }
        }
      | undefined

    const gm = candidate?.groundingMetadata
    groundingMetadata = {
      searchEntryPoint: gm?.searchEntryPoint?.renderedContent ?? null,
      chunks: gm?.groundingChunks ?? [],
    }

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

  // ===== Call 2: SYNTHESIS — strict JSON, no tools =====
  let rawSynthesis = ""
  try {
    const synthesis = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `IDEA: ${idea}
AUDIENCE: ${audience}

RESEARCH NOTES:
${researchText}

Synthesize into the structured analysis.`,
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
        {
          error: "The synthesis step returned no text. Please try again.",
        },
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

  return NextResponse.json({ ...validated.data, groundingMetadata })
}
