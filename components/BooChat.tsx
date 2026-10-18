
'use client'

import { useEffect, useState } from 'react'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export default function BooChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [threadId, setThreadId] = useState<string>()
  const [assistantId, setAssistantId] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const savedThread = sessionStorage.getItem('boo-thread')
    const savedAssistant = sessionStorage.getItem('boo-assistant')

    if (savedThread) setThreadId(savedThread)
    if (savedAssistant) setAssistantId(savedAssistant)

    try {
      const saved = sessionStorage.getItem('boo-messages')
      if (saved) setMessages(JSON.parse(saved))
    } catch {
      sessionStorage.removeItem('boo-messages')
    }
  }, [])

  async function sendMessage() {
    const text = input.trim()

    if (!text || loading) return

    const nextMessages: Message[] = [
      ...messages,
      { role: 'user', content: text },
    ]

    setMessages(nextMessages)
    setInput('')
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/boo/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
body: JSON.stringify({
  message: text,
  history: messages.slice(-10),
}),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || 'Unable to contact Boo',
        )
      }

      const updated: Message[] = [
        ...nextMessages,
        { role: 'assistant', content: data.reply },
      ]

      setMessages(updated)
      setThreadId(data.threadId)
      setAssistantId(data.assistantId ?? undefined)

      sessionStorage.setItem(
        'boo-messages',
        JSON.stringify(updated),
      )
      sessionStorage.setItem(
        'boo-thread',
        data.threadId,
      )

      if (data.assistantId) {
        sessionStorage.setItem(
          'boo-assistant',
          data.assistantId,
        )
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong',
      )

      // Keep the unsent message in the input
      // so the user can retry.
      setMessages(messages)
      setInput(text)
    } finally {
      setLoading(false)
    }
  }

  function newChat() {
    setMessages([])
    setThreadId(undefined)
    setAssistantId(undefined)
    setError('')
    sessionStorage.removeItem('boo-thread')
    sessionStorage.removeItem('boo-assistant')
    sessionStorage.removeItem('boo-messages')
  }

  return (
    <div className="mx-auto flex h-[75vh] max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
      <header className="flex items-center justify-between border-b border-slate-100 bg-blue-600 p-5 text-white">
        <div>
          <h2 className="text-xl font-bold">
            👻 Chat with Boo
          </h2>
          <p className="text-sm text-blue-100">
            Your friendly ghost companion
          </p>
        </div>

        <button
          onClick={newChat}
          className="rounded-xl bg-white/20 px-3 py-2 text-sm hover:bg-white/30"
        >
          New Chat
        </button>
      </header>

      <main className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.length === 0 && (
          <div className="py-16 text-center">
            <div className="mb-4 text-6xl">👻</div>
            <h3 className="text-xl font-bold text-slate-800">
              Boo is here!
            </h3>
<p className="mt-2 text-slate-500">
  Your friendly GhostWallet guide.
  Ask me how GhostWallet works, what the
  ghost personalities mean, or how to mint NFTs!
</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user'
                ? 'justify-end'
                : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="mb-1 font-bold text-blue-600">
                  👻 Boo
                </div>
              )}

              <p className="whitespace-pre-wrap">
                {message.content}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <p className="text-sm text-slate-400">
            👻 Boo is thinking...
          </p>
        )}
      </main>

      {error && (
        <p className="px-5 text-sm text-red-500">
          {error}
        </p>
      )}

      <footer className="flex gap-3 border-t border-slate-100 p-4">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void sendMessage()
            }
          }}
          placeholder="Ask Boo anything..."
          maxLength={1000}
          className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500"
        />

        <button
          onClick={() => void sendMessage()}
          disabled={loading || !input.trim()}
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          Send
        </button>
      </footer>
    </div>
  )
}
