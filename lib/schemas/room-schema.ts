import { z } from "zod"

// ----- Inputs from the user (what the browser POSTs to /api/room) -----

export const RoomRequestSchema = z.object({
  idea: z
    .string()
    .min(5, "Please describe your idea (at least a few words).")
    .max(2000, "Idea is too long (max 2000 characters)."),
  audience: z
    .string()
    .min(3, "Please describe your target audience.")
    .max(2000, "Audience description is too long (max 2000 characters)."),
})

export type RoomRequest = z.infer<typeof RoomRequestSchema>

// ----- Enums -----

export const PersonaColor = z.enum(["green", "yellow", "red"])
export type PersonaColor = z.infer<typeof PersonaColor>

export const Sentiment = z.enum([
  "pain",
  "desire",
  "skepticism",
  "praise",
  "frustration",
])
export type Sentiment = z.infer<typeof Sentiment>

export const Frequency = z.enum(["very common", "common", "emerging", "rare"])
export type Frequency = z.infer<typeof Frequency>

export const TrendingVelocity = z.enum([
  "growing",
  "stable",
  "fading",
  "unclear",
])
export type TrendingVelocity = z.infer<typeof TrendingVelocity>

// ----- Model output blocks -----

export const RealityCheckSchema = z.object({
  verdict: z.string(),
  reality_score: z.number().int().min(1).max(10),
  trending_velocity: TrendingVelocity,
  summary: z.string(),
})
export type RealityCheck = z.infer<typeof RealityCheckSchema>

export const VoiceSchema = z.object({
  quote: z.string(),
  source_name: z.string(),
  source_url: z.string().optional().default(""),
  sentiment: Sentiment,
})
export type Voice = z.infer<typeof VoiceSchema>

export const PainPatternSchema = z.object({
  name: z.string(),
  description: z.string(),
  frequency: Frequency,
  sample_phrases: z.array(z.string()).min(1),
})
export type PainPattern = z.infer<typeof PainPatternSchema>

export const PersonaScoresSchema = z.object({
  buy: z.number().int().min(1).max(10),
  trust: z.number().int().min(1).max(10),
  share: z.number().int().min(1).max(10),
})
export type PersonaScores = z.infer<typeof PersonaScoresSchema>

export const PersonaSchema = z.object({
  name: z.string(),
  age: z.number().int(),
  occupation: z.string(),
  context: z.string(),
  gut_reaction: z.string(),
  scores: PersonaScoresSchema,
  what_would_make_me_click: z.string(),
  color: PersonaColor,
})
export type Persona = z.infer<typeof PersonaSchema>

export const IdeaVsRealitySchema = z.object({
  match_score: z.number().int().min(1).max(10),
  what_hits: z.array(z.string()).min(1),
  what_misses: z.array(z.string()).min(1),
})
export type IdeaVsReality = z.infer<typeof IdeaVsRealitySchema>

export const SharperAngleSchema = z.object({
  angle: z.string(),
  taps_into_pattern: z.string(),
  audience_language_used: z.string(),
})
export type SharperAngle = z.infer<typeof SharperAngleSchema>

// ----- Synthesis-call response (without groundingMetadata) -----

export const SynthesisResponseSchema = z.object({
  reality_check: RealityCheckSchema,
  voices: z.array(VoiceSchema).min(1),
  pain_patterns: z.array(PainPatternSchema).min(1),
  personas: z.array(PersonaSchema).length(3),
  idea_vs_reality: IdeaVsRealitySchema,
  sharper_angles: z.array(SharperAngleSchema).length(3),
})
export type SynthesisResponse = z.infer<typeof SynthesisResponseSchema>

// ----- Grounding metadata returned alongside the synthesis -----

export type GroundingChunk = {
  web?: { uri?: string; title?: string }
}

export type GroundingMetadata = {
  searchEntryPoint: string | null
  chunks: GroundingChunk[]
}

// ----- Final API response (synthesis + grounding) -----

export type RoomResponse = SynthesisResponse & {
  groundingMetadata: GroundingMetadata
}

// ----- JSON Schema for Gemini's structured-output mode (Call 2) -----

export const ROOM_JSON_SCHEMA = {
  type: "object",
  properties: {
    reality_check: {
      type: "object",
      properties: {
        verdict: {
          type: "string",
          description:
            "One sentence verdict on whether this pain is real and current",
        },
        reality_score: {
          type: "integer",
          description: "1-10, based on volume and recency of online discussion",
        },
        trending_velocity: {
          type: "string",
          enum: ["growing", "stable", "fading", "unclear"],
        },
        summary: {
          type: "string",
          description: "2 sentences on what the internet is currently saying",
        },
      },
      required: ["verdict", "reality_score", "trending_velocity", "summary"],
    },
    voices: {
      type: "array",
      description: "5-7 real quotes pulled from the research",
      items: {
        type: "object",
        properties: {
          quote: {
            type: "string",
            description: "Verbatim quote from a real person online",
          },
          source_name: {
            type: "string",
            description: "e.g. 'Reddit, r/wellness' or 'Trustpilot review'",
          },
          source_url: {
            type: "string",
            description:
              "Full URL if available from research, empty string if not",
          },
          sentiment: {
            type: "string",
            enum: ["pain", "desire", "skepticism", "praise", "frustration"],
          },
        },
        required: ["quote", "source_name", "sentiment"],
      },
    },
    pain_patterns: {
      type: "array",
      description: "3-5 recurring themes from the research",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Short label for the pattern" },
          description: {
            type: "string",
            description: "1-2 sentence explanation",
          },
          frequency: {
            type: "string",
            enum: ["very common", "common", "emerging", "rare"],
          },
          sample_phrases: {
            type: "array",
            items: { type: "string" },
            description: "2-3 real phrases users use to describe this",
          },
        },
        required: ["name", "description", "frequency", "sample_phrases"],
      },
    },
    personas: {
      type: "array",
      description:
        "Exactly 3 composite personas from dominant segments in the research",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "integer" },
          occupation: { type: "string" },
          context: {
            type: "string",
            description:
              "1-2 sentences on their life and prior experience with this category",
          },
          gut_reaction: {
            type: "string",
            description: "1-2 sentence reaction to the idea, in their voice",
          },
          scores: {
            type: "object",
            properties: {
              buy: { type: "integer" },
              trust: { type: "integer" },
              share: { type: "integer" },
            },
            required: ["buy", "trust", "share"],
          },
          what_would_make_me_click: {
            type: "string",
            description: "One sentence — what change would convert them",
          },
          color: { type: "string", enum: ["green", "yellow", "red"] },
        },
        required: [
          "name",
          "age",
          "occupation",
          "context",
          "gut_reaction",
          "scores",
          "what_would_make_me_click",
          "color",
        ],
      },
    },
    idea_vs_reality: {
      type: "object",
      properties: {
        match_score: {
          type: "integer",
          description:
            "1-10, how well the idea matches what real people are asking for",
        },
        what_hits: {
          type: "array",
          items: { type: "string" },
          description: "2-3 strengths",
        },
        what_misses: {
          type: "array",
          items: { type: "string" },
          description: "2-3 gaps",
        },
      },
      required: ["match_score", "what_hits", "what_misses"],
    },
    sharper_angles: {
      type: "array",
      description:
        "3 reframed hooks using real audience language from the research",
      items: {
        type: "object",
        properties: {
          angle: { type: "string", description: "The new hook/headline" },
          taps_into_pattern: {
            type: "string",
            description: "Which pain pattern this resonates with",
          },
          audience_language_used: {
            type: "string",
            description:
              "The actual phrase or feeling from research this borrows",
          },
        },
        required: ["angle", "taps_into_pattern", "audience_language_used"],
      },
    },
  },
  required: [
    "reality_check",
    "voices",
    "pain_patterns",
    "personas",
    "idea_vs_reality",
    "sharper_angles",
  ],
} as const
