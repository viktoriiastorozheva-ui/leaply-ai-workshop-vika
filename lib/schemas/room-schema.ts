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

export const Trending = z.enum(["growing", "stable", "fading", "unclear"])
export type Trending = z.infer<typeof Trending>

// ----- Model output blocks -----

export const VerdictSchema = z.object({
  reality_score: z.number().int().min(1).max(10),
  trending: Trending,
  headline: z.string(),
  summary: z.string(),
})
export type Verdict = z.infer<typeof VerdictSchema>

export const VoiceSchema = z.object({
  voice_index: z.number().int().min(1),
  quote: z.string(),
  username: z.string(),
  source_name: z.string(),
  source_url: z.string(),
  source_verified: z.boolean(),
  sentiment: Sentiment,
  date_relative: z.string(),
})
export type Voice = z.infer<typeof VoiceSchema>

export const SentimentBreakdownSchema = z.object({
  pain: z.number().int().min(0),
  desire: z.number().int().min(0),
  skepticism: z.number().int().min(0),
  praise: z.number().int().min(0),
  frustration: z.number().int().min(0),
})
export type SentimentBreakdown = z.infer<typeof SentimentBreakdownSchema>

export const SourceBreakdownItemSchema = z.object({
  source_type: z.string(),
  count: z.number().int().min(0),
})
export type SourceBreakdownItem = z.infer<typeof SourceBreakdownItemSchema>

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
  color: PersonaColor,
})
export type Persona = z.infer<typeof PersonaSchema>

export const SharperAngleSchema = z.object({
  angle: z.string(),
  inspired_by_voice_index: z.number().int().min(1),
  audience_language_borrowed: z.string(),
})
export type SharperAngle = z.infer<typeof SharperAngleSchema>

// ----- Synthesis-call response (without groundingMetadata) -----

// Loosened on purpose. The model targets 6–8 voices, 3 personas, 3 sharper
// angles (and the prompt asks for those exact counts), but on thin inputs it
// sometimes returns fewer. We'd rather render 4 voices than reject the whole
// payload, so we accept reasonable ranges here and let the UI display what we
// actually got.
export const SynthesisResponseSchema = z.object({
  verdict: VerdictSchema,
  voices: z.array(VoiceSchema).min(1).max(12),
  sentiment_breakdown: SentimentBreakdownSchema,
  source_breakdown: z.array(SourceBreakdownItemSchema),
  personas: z.array(PersonaSchema).min(1).max(3),
  sharper_angles: z.array(SharperAngleSchema).min(1).max(5),
})
export type SynthesisResponse = z.infer<typeof SynthesisResponseSchema>

// ----- Grounding metadata returned alongside the synthesis -----

export type GroundingMetadata = {
  searchEntryPoint: string | null
  chunkCount: number
}

// ----- Final API response (synthesis + grounding) -----

export type RoomResponse = SynthesisResponse & {
  groundingMetadata: GroundingMetadata
}

// ----- Ask-the-room follow-up Q&A -----

export const AskRequestSchema = z.object({
  question: z
    .string()
    .min(3, "Question is too short.")
    .max(500, "Question is too long (max 500 characters)."),
  idea: z.string().max(2000),
  audience: z.string().max(2000),
  personas: z.array(PersonaSchema).min(1).max(3),
})
export type AskRequest = z.infer<typeof AskRequestSchema>

export const AskReplySchema = z.object({
  persona_name: z.string(),
  color: PersonaColor,
  reply: z.string(),
})
export type AskReply = z.infer<typeof AskReplySchema>

export const AskResponseSchema = z.object({
  replies: z.array(AskReplySchema).min(1),
})
export type AskResponse = z.infer<typeof AskResponseSchema>

export const ASK_JSON_SCHEMA = {
  type: "object",
  properties: {
    replies: {
      type: "array",
      description:
        "One in-character reply per persona, in the order they were provided.",
      items: {
        type: "object",
        properties: {
          persona_name: {
            type: "string",
            description:
              "Must exactly match the persona's name from the input.",
          },
          color: { type: "string", enum: ["green", "yellow", "red"] },
          reply: {
            type: "string",
            description:
              "1-2 sentence reaction in the persona's voice. Do not break character. Do not invent biographical facts not implied by their context.",
          },
        },
        required: ["persona_name", "color", "reply"],
      },
    },
  },
  required: ["replies"],
} as const

// ----- Risks & red flags audit -----

export const RiskCategory = z.enum([
  "legal",
  "audience-harm",
  "credibility",
  "brand-safety",
  "cultural",
  "other",
])
export type RiskCategory = z.infer<typeof RiskCategory>

export const RiskOverall = z.enum(["clear", "minor-concerns", "major-concerns"])
export type RiskOverall = z.infer<typeof RiskOverall>

export const RiskItemSchema = z.object({
  category: RiskCategory,
  severity: z.number().int().min(1).max(5),
  issue: z.string(),
  mitigation: z.string(),
})
export type RiskItem = z.infer<typeof RiskItemSchema>

export const RisksRequestSchema = z.object({
  idea: z.string().max(2000),
  audience: z.string().max(2000),
  verdict: z.object({
    headline: z.string(),
    summary: z.string(),
  }),
  voices: z
    .array(
      z.object({
        quote: z.string(),
        sentiment: Sentiment,
      })
    )
    .min(1)
    .max(12),
})
export type RisksRequest = z.infer<typeof RisksRequestSchema>

export const RisksResponseSchema = z.object({
  overall: RiskOverall,
  overall_summary: z.string(),
  risks: z.array(RiskItemSchema).min(0).max(8),
})
export type RisksResponse = z.infer<typeof RisksResponseSchema>

export const RISKS_JSON_SCHEMA = {
  type: "object",
  properties: {
    overall: {
      type: "string",
      enum: ["clear", "minor-concerns", "major-concerns"],
      description:
        "Overall risk verdict: clear (ship as-is), minor-concerns (a few small fixes recommended), major-concerns (rethink before shipping).",
    },
    overall_summary: {
      type: "string",
      description: "1-2 sentence summary tying the overall verdict together.",
    },
    risks: {
      type: "array",
      description:
        "0-8 concrete risk items. Empty array is valid if the idea is genuinely clean. Do not fabricate risks for the sake of filling the list.",
      items: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: [
              "legal",
              "audience-harm",
              "credibility",
              "brand-safety",
              "cultural",
              "other",
            ],
          },
          severity: {
            type: "integer",
            description:
              "Integer 1-5 inclusive. 1 = minor nit, 3 = worth fixing, 5 = blocker.",
          },
          issue: {
            type: "string",
            description: "What specifically is risky. Concrete and short.",
          },
          mitigation: {
            type: "string",
            description: "One sentence on how to address it.",
          },
        },
        required: ["category", "severity", "issue", "mitigation"],
      },
    },
  },
  required: ["overall", "overall_summary", "risks"],
} as const

// ----- Generate ad copy -----

export const AdCopyRequestSchema = z.object({
  idea: z.string().max(2000),
  audience: z.string().max(2000),
  verdict: z.object({
    headline: z.string(),
    summary: z.string(),
  }),
  personas: z.array(PersonaSchema).min(1).max(3),
  sharper_angles: z.array(SharperAngleSchema).min(1).max(5),
})
export type AdCopyRequest = z.infer<typeof AdCopyRequestSchema>

export const AdVariantSchema = z.object({
  platform: z.string(),
  headline: z.string(),
  body: z.string(),
  cta: z.string(),
  why_it_works: z.string(),
})
export type AdVariant = z.infer<typeof AdVariantSchema>

export const AdCopyResponseSchema = z.object({
  variants: z.array(AdVariantSchema).min(1).max(5),
})
export type AdCopyResponse = z.infer<typeof AdCopyResponseSchema>

export const ADCOPY_JSON_SCHEMA = {
  type: "object",
  properties: {
    variants: {
      type: "array",
      description: "3 ready-to-paste ad variants, one per platform/style.",
      items: {
        type: "object",
        properties: {
          platform: {
            type: "string",
            description:
              "e.g. 'Meta (Instagram/Facebook feed)', 'TikTok script', 'Google Search ad', 'LinkedIn sponsored post', 'Email subject + preview'.",
          },
          headline: {
            type: "string",
            description: "Punchy hook. Platform-appropriate length.",
          },
          body: {
            type: "string",
            description:
              "Main copy. Platform-appropriate length. Uses audience language from the research where possible.",
          },
          cta: {
            type: "string",
            description: "Short call-to-action button or line.",
          },
          why_it_works: {
            type: "string",
            description:
              "One sentence tying the copy back to a persona reaction or a verbatim phrase the audience uses.",
          },
        },
        required: ["platform", "headline", "body", "cta", "why_it_works"],
      },
    },
  },
  required: ["variants"],
} as const

// ----- Re-score with a new angle -----

export const RescoreRequestSchema = z.object({
  original_idea: z.string().max(2000),
  audience: z.string().max(2000),
  new_angle: z
    .string()
    .min(3, "Angle is too short.")
    .max(500, "Angle is too long (max 500 characters)."),
  personas: z.array(PersonaSchema).min(1).max(3),
})
export type RescoreRequest = z.infer<typeof RescoreRequestSchema>

export const RescoredPersonaSchema = z.object({
  name: z.string(),
  color: PersonaColor,
  new_scores: PersonaScoresSchema,
  new_gut_reaction: z.string(),
  what_changed: z.string(),
})
export type RescoredPersona = z.infer<typeof RescoredPersonaSchema>

export const RescoreResponseSchema = z.object({
  rescored: z.array(RescoredPersonaSchema).min(1),
})
export type RescoreResponse = z.infer<typeof RescoreResponseSchema>

export const RESCORE_JSON_SCHEMA = {
  type: "object",
  properties: {
    rescored: {
      type: "array",
      description:
        "One updated entry per persona, in the same order they were provided.",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description:
              "Must exactly match the persona's name from the input.",
          },
          color: { type: "string", enum: ["green", "yellow", "red"] },
          new_scores: {
            type: "object",
            properties: {
              buy: {
                type: "integer",
                description: "Integer between 1 and 10 inclusive.",
              },
              trust: {
                type: "integer",
                description: "Integer between 1 and 10 inclusive.",
              },
              share: {
                type: "integer",
                description: "Integer between 1 and 10 inclusive.",
              },
            },
            required: ["buy", "trust", "share"],
          },
          new_gut_reaction: {
            type: "string",
            description: "1-2 sentence reaction to the NEW angle, in voice.",
          },
          what_changed: {
            type: "string",
            description:
              "One sentence on what moved the scores up or down vs the original idea.",
          },
        },
        required: [
          "name",
          "color",
          "new_scores",
          "new_gut_reaction",
          "what_changed",
        ],
      },
    },
  },
  required: ["rescored"],
} as const

// ----- JSON Schema for Gemini's structured-output mode (Call 2) -----

export const ROOM_JSON_SCHEMA = {
  type: "object",
  properties: {
    verdict: {
      type: "object",
      properties: {
        reality_score: {
          type: "integer",
          description:
            "Integer between 1 and 10 inclusive. NOT a percentage, NOT 0–100. 1 = niche/fading discussion, 10 = very active and trending right now.",
        },
        trending: {
          type: "string",
          enum: ["growing", "stable", "fading", "unclear"],
        },
        headline: { type: "string" },
        summary: { type: "string" },
      },
      required: ["reality_score", "trending", "headline", "summary"],
    },
    voices: {
      type: "array",
      description: "6-8 real quotes from the research",
      items: {
        type: "object",
        properties: {
          voice_index: {
            type: "integer",
            description: "1-based index, e.g. 1, 2, 3...",
          },
          quote: { type: "string" },
          username: {
            type: "string",
            description:
              "Anonymized handle, e.g. 'reddit_user' or actual visible username if from research",
          },
          source_name: {
            type: "string",
            description: "e.g. 'Reddit · r/wellness' or 'Trustpilot'",
          },
          source_url: {
            type: "string",
            description:
              "MUST come from VALID SOURCE URLS list, or empty string",
          },
          source_verified: { type: "boolean" },
          sentiment: {
            type: "string",
            enum: ["pain", "desire", "skepticism", "praise", "frustration"],
          },
          date_relative: {
            type: "string",
            description: "e.g. '3 days ago', '2 months ago', or 'undated'",
          },
        },
        required: [
          "voice_index",
          "quote",
          "username",
          "source_name",
          "source_url",
          "source_verified",
          "sentiment",
          "date_relative",
        ],
      },
    },
    sentiment_breakdown: {
      type: "object",
      description: "Counts across all voices, must sum to total voices count",
      properties: {
        pain: { type: "integer" },
        desire: { type: "integer" },
        skepticism: { type: "integer" },
        praise: { type: "integer" },
        frustration: { type: "integer" },
      },
      required: ["pain", "desire", "skepticism", "praise", "frustration"],
    },
    source_breakdown: {
      type: "array",
      description: "Distribution of source types across voices",
      items: {
        type: "object",
        properties: {
          source_type: {
            type: "string",
            description:
              "e.g. 'Reddit', 'Trustpilot', 'Forums', 'Reviews', 'News'",
          },
          count: { type: "integer" },
        },
        required: ["source_type", "count"],
      },
    },
    personas: {
      type: "array",
      description: "Exactly 3 composite personas",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "integer" },
          occupation: { type: "string" },
          context: { type: "string" },
          gut_reaction: { type: "string" },
          scores: {
            type: "object",
            properties: {
              buy: {
                type: "integer",
                description: "Integer between 1 and 10 inclusive.",
              },
              trust: {
                type: "integer",
                description: "Integer between 1 and 10 inclusive.",
              },
              share: {
                type: "integer",
                description: "Integer between 1 and 10 inclusive.",
              },
            },
            required: ["buy", "trust", "share"],
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
          "color",
        ],
      },
    },
    sharper_angles: {
      type: "array",
      description: "Exactly 3 reframes",
      items: {
        type: "object",
        properties: {
          angle: { type: "string" },
          inspired_by_voice_index: {
            type: "integer",
            description: "Must match a voice_index from voices array",
          },
          audience_language_borrowed: {
            type: "string",
            description: "Exact phrase used from the inspiring quote",
          },
        },
        required: [
          "angle",
          "inspired_by_voice_index",
          "audience_language_borrowed",
        ],
      },
    },
  },
  required: [
    "verdict",
    "voices",
    "sentiment_breakdown",
    "source_breakdown",
    "personas",
    "sharper_angles",
  ],
} as const
