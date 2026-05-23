"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { SharperAngle } from "@/lib/schemas/room-schema"

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Older browsers / insecure contexts — silently no-op.
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="shrink-0"
    >
      {copied ? "Copied!" : "📋 Copy"}
    </Button>
  )
}

export function SharperAngles({
  angles,
  onJumpToVoice,
  onRescore,
  rescoringAngle,
  activeRescoreAngle,
}: {
  angles: SharperAngle[]
  onJumpToVoice: (voiceIndex: number) => void
  onRescore?: (angle: string) => void
  // The angle currently being scored (loading state).
  rescoringAngle?: string | null
  // The angle whose rescore is currently being displayed (active state).
  activeRescoreAngle?: string | null
}) {
  return (
    <div className="flex flex-col gap-4">
      {angles.map((a, idx) => {
        const isLoading = rescoringAngle === a.angle
        const isActive = activeRescoreAngle === a.angle
        return (
          <Card
            key={idx}
            className={isActive ? "border-2 border-primary" : undefined}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                  {idx + 1}
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="flex-1 text-base leading-relaxed font-medium italic sm:text-lg">
                      &ldquo;{a.angle}&rdquo;
                    </p>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <CopyButton text={a.angle} />
                      {onRescore && (
                        <Button
                          type="button"
                          variant={isActive ? "default" : "secondary"}
                          size="sm"
                          onClick={() => onRescore(a.angle)}
                          disabled={isLoading}
                        >
                          {isLoading
                            ? "Scoring…"
                            : isActive
                              ? "✓ Re-scored"
                              : "Re-score the room"}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div>
                      <span className="font-medium">Borrows:</span>{" "}
                      <span className="italic">
                        &ldquo;{a.audience_language_borrowed}&rdquo;
                      </span>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => onJumpToVoice(a.inspired_by_voice_index)}
                        className="text-primary hover:underline"
                      >
                        ← Inspired by voice #{a.inspired_by_voice_index}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
