import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"

import { env } from "@/lib/env"
import {
  ADCOPY_JSON_SCHEMA,
  AdCopyRequestSchema,
  AdCopyResponseSchema,
} from "@/lib/schemas/room-schema"

export const runtime = "nodejs"
export const maxDuration = 30

const ADCOPY_SYSTEM_PROMPT = `You are a senior performance marketing copywriter.

You receive: an idea, target audience, a one-line verdict and summary, three personas (with their gut reactions), and three sharper angles already informed by real audience research.

Generate EXACTLY THREE ad copy variants, one per platform/style:
1. Meta (Instagram/Facebook feed) — visual hook + short body (2-3 lines) + clear CTA button text.
2. TikTok script intro — first 3 seconds of voiceover/on-screen text, hook + tension. Body is the next ~10s of dialogue.
3. Google Search ad — headline (max 30 chars), description (max 90 chars), CTA.

Rules:
- Use audience language from the research where possible — borrow verbatim phrases the personas would actually say.
- Ready to paste. No placeholders, no "[brand name]", no "[insert X]" — invent specific concrete copy.
- The "why_it_works" field is ONE sentence connecting the copy back to a specific persona reaction or audience phrase.
- English only.

Output strict JSON only.`

export async function POST(req: NextRequest) {
  if (!env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Server is not configured: GEMINI_API_KEY is missing." },
      { status: 500 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const parsed = AdCopyRequestSchema.safeParse(body)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return NextResponse.json(
      { error: firstIssue?.message ?? "Invalid input." },
      { status: 400 }
    )
  }
  const { idea, audience, verdict, personas, sharper_angles } = parsed.data

  const personaBlock = personas
    .map(
      (p) =>
        `- ${p.name} (${p.color}): "${p.gut_reaction}" — Buy:${p.scores.buy} Trust:${p.scores.trust} Share:${p.scores.share}`
    )
    .join("\n")

  const anglesBlock = sharper_angles
    .map(
      (a, i) =>
        `${i + 1}. "${a.angle}" — borrows: "${a.audience_language_borrowed}"`
    )
    .join("\n")

  const userMessage = `IDEA: ${idea}
AUDIENCE: ${audience}

VERDICT
Headline: ${verdict.headline}
Summary: ${verdict.summary}

PERSONA REACTIONS:
${personaBlock}

SHARPER ANGLES (already grounded in audience language):
${anglesBlock}

Write the three platform-specific ad variants.`

  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })

  let raw = ""
  try {
    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userMessage,
      config: {
        systemInstruction: ADCOPY_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseJsonSchema: ADCOPY_JSON_SCHEMA,
        temperature: 0.8,
        thinkingConfig: { thinkingBudget: 0 },
      },
    })
    raw = result.text ?? ""
    if (!raw) {
      return NextResponse.json(
        { error: "The copywriter returned no text. Please try again." },
        { status: 502 }
      )
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("THE ROOM adcopy-call error:", err)
    return NextResponse.json(
      { error: `Ad copy step failed: ${message}` },
      { status: 502 }
    )
  }

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(raw)
  } catch {
    console.error("THE ROOM adcopy JSON parse failed. Raw text:", raw)
    return NextResponse.json(
      { error: "The model returned malformed JSON. Please try again." },
      { status: 502 }
    )
  }

  const validated = AdCopyResponseSchema.safeParse(parsedJson)
  if (!validated.success) {
    const summary = validated.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ")
    console.error("THE ROOM adcopy schema mismatch:", validated.error.issues)
    return NextResponse.json(
      { error: `Unexpected ad copy shape. Likely cause: ${summary}.` },
      { status: 502 }
    )
  }

  return NextResponse.json(validated.data)
}
