import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"

import { env } from "@/lib/env"
import {
  RISKS_JSON_SCHEMA,
  RisksRequestSchema,
  RisksResponseSchema,
} from "@/lib/schemas/room-schema"

export const runtime = "nodejs"
export const maxDuration = 30

const RISKS_SYSTEM_PROMPT = `You are a brand-safety, compliance, and audience-harm reviewer for marketing ideas.

You will receive: an idea, target audience, a verdict summary, and real audience voices/quotes from live web research.

Your job: identify any concrete risks in this idea that the marketer should know about BEFORE shipping. Consider:
- legal: false/misleading claims, medical claims without backing, financial claims without disclosure, copyright/trademark issues, GDPR/CCPA, age-restricted topics.
- audience-harm: triggering content for vulnerable groups, body-image harm, manipulation of insecurities, mental-health risks, treatment-of-illness implications.
- credibility: claims the research actively contradicts, things the personas already openly distrust, easy-to-debunk hooks.
- brand-safety: adjacent topics that platforms (Meta, TikTok, Google) routinely demonetize/ban; controversial framing.
- cultural: tone-deaf assumptions, stereotypes, language that lands very differently across markets.

Rules:
- Be CONCRETE. Cite the specific phrase in the idea or a specific voice quote that signals the risk.
- Severity 1 = minor nit (e.g. wording tweak), 3 = worth fixing, 5 = blocker (legal exposure / serious audience harm).
- DO NOT fabricate risks. If the idea is genuinely clean, return an empty risks array and overall="clear".
- Each mitigation is ONE concrete sentence the marketer can act on.
- Maximum 8 risks. Stop at the meaningful ones.

Output ENGLISH ONLY. Strict JSON.`

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

  const parsed = RisksRequestSchema.safeParse(body)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return NextResponse.json(
      { error: firstIssue?.message ?? "Invalid input." },
      { status: 400 }
    )
  }
  const { idea, audience, verdict, voices } = parsed.data

  const voicesBlock = voices
    .map((v, i) => `[${i + 1}] (${v.sentiment}) "${v.quote}"`)
    .join("\n")

  const userMessage = `IDEA: ${idea}
AUDIENCE: ${audience}

VERDICT
Headline: ${verdict.headline}
Summary: ${verdict.summary}

RESEARCH VOICES (verbatim from live web):
${voicesBlock}

Review this idea for risks.`

  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })

  let raw = ""
  try {
    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userMessage,
      config: {
        systemInstruction: RISKS_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseJsonSchema: RISKS_JSON_SCHEMA,
        temperature: 0.4,
        thinkingConfig: { thinkingBudget: 0 },
      },
    })
    raw = result.text ?? ""
    if (!raw) {
      return NextResponse.json(
        { error: "The reviewer returned no text. Please try again." },
        { status: 502 }
      )
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("THE ROOM risks-call error:", err)
    return NextResponse.json(
      { error: `Risks step failed: ${message}` },
      { status: 502 }
    )
  }

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(raw)
  } catch {
    console.error("THE ROOM risks JSON parse failed. Raw text:", raw)
    return NextResponse.json(
      { error: "The model returned malformed JSON. Please try again." },
      { status: 502 }
    )
  }

  // Clamp severity into [1,5] defensively before validation.
  if (
    parsedJson &&
    typeof parsedJson === "object" &&
    Array.isArray((parsedJson as { risks?: unknown }).risks)
  ) {
    const risks = (parsedJson as { risks: unknown[] }).risks
    for (const r of risks) {
      if (r && typeof r === "object") {
        const row = r as Record<string, unknown>
        if (typeof row.severity === "number") {
          const rounded = Math.round(row.severity)
          row.severity = Math.min(5, Math.max(1, rounded))
        }
      }
    }
  }

  const validated = RisksResponseSchema.safeParse(parsedJson)
  if (!validated.success) {
    const summary = validated.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ")
    console.error("THE ROOM risks schema mismatch:", validated.error.issues)
    return NextResponse.json(
      { error: `Unexpected risks shape. Likely cause: ${summary}.` },
      { status: 502 }
    )
  }

  return NextResponse.json(validated.data)
}
