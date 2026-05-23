"use client"

import { useEffect, useRef, useState } from "react"
// Note: this component resets its conversation history when remounted.
// The parent provides a `key` derived from the personas list so a new
// analysis forces a fresh mount instead of leaking the previous chat.

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import type { AskReply, Persona } from "@/lib/schemas/room-schema"

import {
  avatarColorClass,
  avatarInitial,
  personaColorStyles,
} from "./persona-colors"

type Conversation = {
  id: number
  question: string
  replies: AskReply[]
}

const SUGGESTIONS = [
  "What if we drop the price by half?",
  "What would make the skeptic come around?",
  "Which angle would convert you fastest?",
  "What's the one thing you'd change first?",
] as const

export function AskTheRoom({
  personas,
  idea,
  audience,
}: {
  personas: Persona[]
  idea: string
  audience: string
}) {
  const [question, setQuestion] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const nextId = useRef(1)
  const endRef = useRef<HTMLDivElement | null>(null)

  // Auto-scroll to the newest message.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [conversations.length, loading])

  async function ask(rawQuestion: string) {
    const q = rawQuestion.trim()
    if (!q || loading) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/room/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, idea, audience, personas }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong. Please try again.")
        return
      }
      setConversations((prev) => [
        ...prev,
        { id: nextId.current++, question: q, replies: data.replies },
      ])
      setQuestion("")
    } catch {
      setError(
        "Couldn't reach the server. Check your internet connection and try again."
      )
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    void ask(question)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      void ask(question)
    }
  }

  return (
    <section>
      <h2 className="text-xl font-semibold sm:text-2xl">Ask the room</h2>
      <p className="mt-1 mb-4 text-sm text-muted-foreground">
        Follow-up questions for the 3 personas above. They stay in character —
        their replies are grounded in the same research.
      </p>

      {conversations.length > 0 && (
        <div className="mb-6 flex flex-col gap-6">
          {conversations.map((c) => (
            <ConversationBlock key={c.id} conversation={c} />
          ))}
        </div>
      )}

      {loading && <ThinkingIndicator />}

      {error && !loading && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-xl border bg-card p-4"
      >
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Ask anything — "What if we change the hook to X?" or "Which of you would buy first?"'
          rows={2}
          maxLength={500}
          disabled={loading}
          className="resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setQuestion(s)}
                disabled={loading}
                className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/70 disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
          <Button
            type="submit"
            disabled={loading || !question.trim()}
            size="sm"
          >
            {loading ? "Asking…" : "Ask the room"}
          </Button>
        </div>
        <div className="text-[10px] text-muted-foreground">
          Press ⌘/Ctrl + Enter to send.
        </div>
      </form>
      <div ref={endRef} />
    </section>
  )
}

function ConversationBlock({ conversation }: { conversation: Conversation }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-primary px-4 py-2 text-sm leading-relaxed text-primary-foreground">
        {conversation.question}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {conversation.replies.map((r, idx) => (
          <ReplyCard key={idx} reply={r} />
        ))}
      </div>
    </div>
  )
}

function ReplyCard({ reply }: { reply: AskReply }) {
  const style = personaColorStyles[reply.color]
  return (
    <Card className={style.border}>
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColorClass(
              reply.persona_name
            )}`}
            aria-hidden
          >
            {avatarInitial(reply.persona_name)}
          </div>
          <span className="truncate text-sm font-medium">
            {reply.persona_name}
          </span>
          <span
            className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium ${style.badge}`}
          >
            {style.label}
          </span>
        </div>
        <p className="text-sm leading-relaxed italic">
          &ldquo;{reply.reply}&rdquo;
        </p>
      </CardContent>
    </Card>
  )
}

function ThinkingIndicator() {
  return (
    <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
      <span>The room is thinking…</span>
    </div>
  )
}
