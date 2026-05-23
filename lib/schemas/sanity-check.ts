import { z } from "zod"

export const SanityCheckSchema = z.object({
  coherent: z.boolean(),
  reason: z.string().min(1),
  suggested_fix: z.string().min(1),
})

export type SanityCheckResult = z.infer<typeof SanityCheckSchema>

// JSON schema for Gemini's responseJsonSchema config.
export const SANITY_CHECK_JSON_SCHEMA = {
  type: "object",
  properties: {
    coherent: { type: "boolean" },
    reason: { type: "string" },
    suggested_fix: { type: "string" },
  },
  required: ["coherent", "reason", "suggested_fix"],
}
