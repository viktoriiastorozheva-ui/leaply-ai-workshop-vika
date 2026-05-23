"use client"

import { useEffect, useState } from "react"

const LOADER_LINES = [
  "> Initializing reality check",
  "> Connecting to live web index",
  "> Scanning Reddit communities...",
  "> Found 47 relevant discussions",
  "> Analyzing Trustpilot reviews",
  "> Cross-referencing 12 review sources",
  "> Extracting audience language patterns",
  "> Detecting sentiment clusters",
  "> Building composite personas",
  "> Generating sharper angles",
  "> Compiling verdict",
] as const

const REVEAL_MS = 1800
const DOT_MS = 500

export function LiveSearchLoader() {
  // Number of lines fully revealed so far (1..LOADER_LINES.length).
  const [count, setCount] = useState(1)
  // Number of dots after the last line, once we're past the script.
  const [dots, setDots] = useState(0)

  useEffect(() => {
    if (count < LOADER_LINES.length) {
      const t = setTimeout(() => setCount((c) => c + 1), REVEAL_MS)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setDots((d) => (d + 1) % 4), DOT_MS)
    return () => clearTimeout(t)
  }, [count, dots])

  const allDone = count >= LOADER_LINES.length
  // Show the last 6 lines (window for compactness).
  const visible = LOADER_LINES.slice(0, count).slice(-6)

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 font-mono text-sm leading-relaxed text-emerald-400 shadow-inner">
      {visible.map((line, idx) => {
        const isLastVisible = idx === visible.length - 1
        const renderText =
          allDone && isLastVisible ? `${line}${".".repeat(dots)}` : line
        return (
          <div key={`${count}-${idx}`} className="flex items-baseline">
            <span>{renderText}</span>
            {isLastVisible && (
              <span
                aria-hidden
                className="ml-1 inline-block h-3 w-2 animate-pulse bg-emerald-400"
              />
            )}
          </div>
        )
      })}
      <div className="mt-3 text-[10px] tracking-wider text-emerald-500/60 uppercase">
        live web research in progress
      </div>
    </div>
  )
}
