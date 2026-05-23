import { z } from "zod"

// Parse and validate environment variables once at startup.
// Add a field here whenever you reference a new process.env.X in code.
// Required vars use .min(1) / .url() etc; optional vars use .optional().
const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Example public var (safe to expose to the browser):
  // NEXT_PUBLIC_APP_URL: z.string().url(),

  // Server-only Gemini API key. Required at runtime when /api/room is hit.
  // Kept optional in the schema so that `next build` doesn't fail when the
  // var isn't set yet (e.g. CI). The route handler asserts presence at call time.
  GEMINI_API_KEY: z.string().min(1).optional(),
})

export const env = EnvSchema.parse(process.env)
export type Env = z.infer<typeof EnvSchema>
