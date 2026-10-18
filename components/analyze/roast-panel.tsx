'use client'

import { AnimatePresence, motion } from 'motion/react'
import { Flame, RefreshCw } from 'lucide-react'
import type { PersonalityResult } from '@/lib/types'
import { cn } from '@/lib/utils'

export function RoastPanel({
  personality: p,
  rerolling,
  rerollError,
  onRoastAgain,
}: {
  personality: PersonalityResult
  rerolling: boolean
  rerollError: string | null
  onRoastAgain: () => void
}) {
  const others = p.roasts.filter((r) => r !== p.roastOfTheDay)

  return (
    <section aria-labelledby="roast-heading" className="card-3d flex flex-col gap-5 rounded-3xl border bg-card p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="roast-heading" className="flex items-center gap-2 text-2xl font-semibold">
          <Flame className="size-6 text-warning" />
          Roast of the day
        </h2>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
          {p.roastSource === 'ai' ? 'Fresh from Boo (AI)' : "From Boo's notebook"}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.blockquote
          key={p.roastOfTheDay}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative rounded-3xl rounded-tl-md bg-primary p-6 font-display text-2xl leading-snug font-semibold text-pretty text-primary-foreground md:text-3xl"
        >
          {`"${p.roastOfTheDay}"`}
        </motion.blockquote>
      </AnimatePresence>

      {others.length > 0 && (
        <ul className="flex flex-col gap-2">
          {others.map((r) => (
            <li key={r} className="rounded-2xl border bg-muted/40 p-4 leading-relaxed">
              {r}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onRoastAgain}
          disabled={rerolling}
          className="btn-3d flex h-12 items-center justify-center gap-2 rounded-2xl bg-warning px-6 font-display text-lg font-semibold text-warning-foreground disabled:opacity-60"
        >
          <RefreshCw className={cn('size-5', rerolling && 'animate-spin')} />
          {rerolling ? 'Boo is thinking…' : 'Roast Me Again'}
        </button>
        {rerollError && (
          <p role="alert" className="text-sm text-destructive">
            {rerollError}
          </p>
        )}
      </div>
    </section>
  )
}
