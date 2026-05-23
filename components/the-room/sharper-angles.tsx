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
}: {
  angles: SharperAngle[]
  onJumpToVoice: (voiceIndex: number) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      {angles.map((a, idx) => (
        <Card key={idx}>
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                {idx + 1}
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-base leading-relaxed font-medium italic sm:text-lg">
                    &ldquo;{a.angle}&rdquo;
                  </p>
                  <CopyButton text={a.angle} />
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
      ))}
    </div>
  )
}
