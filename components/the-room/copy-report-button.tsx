"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { buildReportMarkdown } from "@/lib/report-markdown"
import type { RoomResponse } from "@/lib/schemas/room-schema"

export function CopyReportButton({
  result,
  idea,
  audience,
}: {
  result: RoomResponse
  idea: string
  audience: string
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const text = buildReportMarkdown({ result, idea, audience })
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
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
      {copied ? "Copied!" : "📋 Copy as report"}
    </Button>
  )
}
