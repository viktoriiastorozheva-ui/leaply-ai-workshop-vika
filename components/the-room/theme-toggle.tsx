"use client"

import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

// "Have we hydrated on the client yet?" — using useSyncExternalStore instead
// of useState + useEffect avoids the React "setState in effect" lint trap.
// The subscribe is a no-op (we don't actually subscribe to anything), so the
// snapshot stays "true" forever on the client and "false" during SSR.
const emptySubscribe = () => () => {}
const clientSnapshot = () => true
const serverSnapshot = () => false

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    emptySubscribe,
    clientSnapshot,
    serverSnapshot
  )

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" disabled aria-label="Toggle theme">
        <span aria-hidden>○</span>
      </Button>
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span aria-hidden>{isDark ? "☀" : "🌙"}</span>
    </Button>
  )
}
