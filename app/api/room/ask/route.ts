import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"

import { env } from "@/lib/env"
import {
  ASK_JSON_SCHEMA,
  AskRequestSchema,
  AskResponseSchema,
} from "@/lib/schemas/room-schema"

export const runtime = "nodejs"
export const maxDuration = 30

const ASK_SYSTEM_PROMPT = `You are simulating a small focus group of personas reacting to a follow-up question from a marketer.

You will receive: an idea, target audience, a list of personas (each with name, age, occupation, life context, prior gut reaction, and a color label), and the marketer's question.

For EACH persona in the list — in the order they appear — write a 1-2 sentence reply IN THEIR VOICE. Stay in character. Do not invent biographical facts not implied by their context. Personas should sometimes disagree with each other (the "red" persona is naturally skeptical, the "green" persona is naturally enthusiastic, the "yellow" persona is naturally pragmatic).

Output strict JSON only, in English.`

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

  const parsed = AskRequestSchema.safeParse(body)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return NextResponse.json(
      { error: firstIssue?.message ?? "Invalid input." },
      { status: 400 }
    )
  }
  const { question, idea, audience, personas } = parsed.data

  const personaBlock = personas
    .map(
      (p, i) =>
        `[${i + 1}] ${p.name} (age ${p.age}, ${p.occupation}, color=${p.color})
Context: ${p.context}
Prior gut reaction: "${p.gut_reaction}"
Scores so far — buy:${p.scores.buy} trust:${p.scores.trust} share:${p.scores.share}`
    )
    .join("\n\n")

  const userMessage = `IDEA: ${idea}
AUDIENCE: ${audience}

PERSONAS:
${personaBlock}

MARKETER'S FOLLOW-UP QUESTION:
${question}

Reply as each persona, in order. One short reply per persona.`

  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })

  let rawAsk = ""
  try {
    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userMessage,
      config: {
        systemInstruction: ASK_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseJsonSchema: ASK_JSON_SCHEMA,
        temperature: 0.75,
      },
    })
    rawAsk = result.text ?? ""
    if (!rawAsk) {
      return NextResponse.json(
        { error: "The room had nothing to say. Try rewording the question." },
        { status: 502 }
      )
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("THE ROOM ask-call error:", err)
    return NextResponse.json(
      { error: `Ask step failed: ${message}` },
      { status: 502 }
    )
  }

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(rawAsk)
  } catch {
    console.error("THE ROOM ask JSON parse failed. Raw text:", rawAsk)
    return NextResponse.json(
      {
        error:
          "The model returned malformed JSON. Please try again — it usually works on retry.",
      },
      { status: 502 }
    )
  }

  const validated = AskResponseSchema.safeParse(parsedJson)
  if (!validated.success) {
    const issues = validated.error.issues.slice(0, 5).map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }))
    console.error("THE ROOM ask schema mismatch:", {
      issues: validated.error.issues,
      rawPreview: rawAsk.slice(0, 600),
    })
    const summary = issues
      .map((i) => `${i.path || "(root)"}: ${i.message}`)
      .join("; ")
    return NextResponse.json(
      { error: `Unexpected reply shape. Likely cause: ${summary}.` },
      { status: 502 }
    )
  }

  return NextResponse.json(validated.data)
}
