"use client"

import { useState, useSyncExternalStore } from "react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { RoomResponse } from "@/lib/schemas/room-schema"
import {
  clearAllRuns,
  deleteRun,
  formatRelativeTime,
  listRuns,
  type SavedRun,
} from "@/lib/runs-storage"

// Tiny event channel so other components (the form) can ask the sidebar to
// refresh after they've saved a new run. Cheap, no zustand needed for this.
const RUNS_CHANGED_EVENT = "the-room/runs-changed"

export function emitRunsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(RUNS_CHANGED_EVENT))
  }
}

// Module-level caches so useSyncExternalStore's getSnapshot/getServerSnapshot
// return stable references between renders — required for the hook to avoid
// infinite loops. We refresh the client cache only when an actual change
// event fires. The server snapshot is a frozen empty array, also stable.
let cachedRuns: SavedRun[] = []
let cacheInitialized = false
const EMPTY_RUNS: SavedRun[] = Object.freeze([]) as unknown as SavedRun[]

function getSnapshot(): SavedRun[] {
  if (!cacheInitialized && typeof window !== "undefined") {
    cachedRuns = listRuns()
    cacheInitialized = true
  }
  return cachedRuns
}

function getServerSnapshot(): SavedRun[] {
  return EMPTY_RUNS
}

function subscribe(callback: () => void) {
  function refresh() {
    cachedRuns = listRuns()
    callback()
  }
  window.addEventListener(RUNS_CHANGED_EVENT, refresh)
  window.addEventListener("storage", refresh)
  return () => {
    window.removeEventListener(RUNS_CHANGED_EVENT, refresh)
    window.removeEventListener("storage", refresh)
  }
}

function useRuns() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function RunsHistory({
  onRestore,
}: {
  onRestore: (run: SavedRun) => void
}) {
  const [open, setOpen] = useState(false)
  const runs = useRuns()

  function handleRestore(run: SavedRun) {
    onRestore(run)
    setOpen(false)
  }

  function handleDelete(id: string) {
    deleteRun(id)
    emitRunsChanged()
  }

  function handleClearAll() {
    clearAllRuns()
    emitRunsChanged()
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          📚 History
          {runs.length > 0 && (
            <span className="ml-2 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              {runs.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-4 overflow-y-auto sm:max-w-md">
        <SheetHeader className="space-y-1">
          <SheetTitle>Saved runs</SheetTitle>
          <SheetDescription>
            Every successful Run is stored in your browser. Click to restore.
          </SheetDescription>
        </SheetHeader>

        {runs.length === 0 ? (
          <p className="mx-4 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No saved runs yet. Hit{" "}
            <span className="font-medium">Run the room</span> to get started.
          </p>
        ) : (
          <>
            <div className="flex justify-end px-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
              >
                Clear all
              </Button>
            </div>
            <ul className="flex flex-col gap-3 px-4 pb-4">
              {runs.map((r) => (
                <RunEntry
                  key={r.id}
                  run={r}
                  onRestore={() => handleRestore(r)}
                  onDelete={() => handleDelete(r.id)}
                />
              ))}
            </ul>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function RunEntry({
  run,
  onRestore,
  onDelete,
}: {
  run: SavedRun
  onRestore: () => void
  onDelete: () => void
}) {
  const score = (run.result as RoomResponse).verdict.reality_score
  const trending = (run.result as RoomResponse).verdict.trending
  const trendArrow =
    trending === "growing"
      ? "↑"
      : trending === "fading"
        ? "↓"
        : trending === "stable"
          ? "→"
          : "?"
  const truncatedIdea =
    run.idea.length > 90 ? run.idea.slice(0, 90).trimEnd() + "…" : run.idea
  return (
    <li className="group rounded-xl border p-3 transition hover:border-primary/40">
      <button
        type="button"
        onClick={onRestore}
        className="flex w-full flex-col items-start gap-2 text-left"
      >
        <div className="flex w-full items-center gap-2">
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            {score}/10 {trendArrow}
          </span>
          <span className="ml-auto text-[10px] text-muted-foreground">
            {formatRelativeTime(run.savedAt)}
          </span>
        </div>
        <p className="text-sm leading-snug">{truncatedIdea}</p>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {run.audience}
        </p>
      </button>
      <div className="mt-2 flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
        >
          Delete
        </Button>
      </div>
    </li>
  )
}
