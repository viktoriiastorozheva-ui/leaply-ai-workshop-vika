import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"

import { env } from "@/lib/env"
import {
  RESCORE_JSON_SCHEMA,
  RescoreRequestSchema,
  RescoreResponseSchema,
} from "@/lib/schemas/room-schema"

export const runtime = "nodejs"
export const maxDuration = 30

const RESCORE_SYSTEM_PROMPT = `You are re-scoring a set of personas on a NEW marketing angle that's a reframed version of an original idea.

You will receive: the original idea, target audience, a list of personas (each with their context, prior gut reaction, and original Buy/Trust/Share scores), and the new angle being tested.

For EACH persona — in the order they appear — you must:
1. Re-score Buy / Trust / Share (integer 1–10 inclusive) FOR THE NEW ANGLE specifically. Move the numbers honestly based on whether the new framing speaks more or less to that persona's documented context and pain. Some scores will go up, some down, some stay the same. Do not artificially uplift every score.
2. Give a fresh 1-2 sentence gut reaction in their voice to the new angle.
3. In one short sentence, name what specifically moved their scores up or down vs the original.

Stay in character. Output strict JSON only, in English.`

function clamp(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min
  const r = Math.round(n)
  if (r < min) return min
  if (r > max) return max
  return r
}

function normalizeRescore(input: unknown): unknown {
  if (!input || typeof input !== "object") return input
  const o = input as Record<string, unknown>
  if (Array.isArray(o.rescored)) {
    for (const r of o.rescored) {
      if (r && typeof r === "object") {
        const row = r as Record<string, unknown>
        if (row.new_scores && typeof row.new_scores === "object") {
          const s = row.new_scores as Record<string, unknown>
          for (const k of ["buy", "trust", "share"] as const) {
            if (typeof s[k] === "number") s[k] = clamp(s[k] as number, 1, 10)
          }
        }
      }
    }
  }
  return o
}

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

  const parsed = RescoreRequestSchema.safeParse(body)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return NextResponse.json(
      { error: firstIssue?.message ?? "Invalid input." },
      { status: 400 }
    )
  }
  const { original_idea, audience, new_angle, personas } = parsed.data

  const personaBlock = personas
    .map(
      (p, i) =>
        `[${i + 1}] ${p.name} (age ${p.age}, ${p.occupation}, color=${p.color})
Context: ${p.context}
Prior gut reaction: "${p.gut_reaction}"
Original scores — buy:${p.scores.buy} trust:${p.scores.trust} share:${p.scores.share}`
    )
    .join("\n\n")

  const userMessage = `ORIGINAL IDEA: ${original_idea}
AUDIENCE: ${audience}

PERSONAS:
${personaBlock}

NEW ANGLE TO RE-SCORE AGAINST:
${new_angle}

Re-score each persona for this new angle.`

  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })

  let raw = ""
  try {
    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userMessage,
      config: {
        systemInstruction: RESCORE_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseJsonSchema: RESCORE_JSON_SCHEMA,
        temperature: 0.6,
        thinkingConfig: { thinkingBudget: 0 },
      },
    })
    raw = result.text ?? ""
    if (!raw) {
      return NextResponse.json(
        { error: "The room returned no scores. Please try again." },
        { status: 502 }
      )
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("THE ROOM rescore-call error:", err)
    return NextResponse.json(
      { error: `Rescore step failed: ${message}` },
      { status: 502 }
    )
  }

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(raw)
  } catch {
    console.error("THE ROOM rescore JSON parse failed. Raw text:", raw)
    return NextResponse.json(
      { error: "The model returned malformed JSON. Please try again." },
      { status: 502 }
    )
  }

  const normalized = normalizeRescore(parsedJson)
  const validated = RescoreResponseSchema.safeParse(normalized)
  if (!validated.success) {
    const summary = validated.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ")
    console.error("THE ROOM rescore schema mismatch:", validated.error.issues)
    return NextResponse.json(
      { error: `Unexpected rescore shape. Likely cause: ${summary}.` },
      { status: 502 }
    )
  }

  return NextResponse.json(validated.data)
}
