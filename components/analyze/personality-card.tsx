'use client'

import { motion } from 'motion/react'
import { Boo } from '@/components/boo'
import { shortenAddress } from '@/lib/solana/address'
import { COLOR_CLASSES, RARITY_COLOR } from '@/lib/theme'
import type { PersonalityResult, WalletMetrics } from '@/lib/types'
import { cn } from '@/lib/utils'

export function PersonalityCard({ metrics, personality: p }: { metrics: WalletMetrics; personality: PersonalityResult }) {
  const c = COLOR_CLASSES[p.color]
  const rarity = COLOR_CLASSES[RARITY_COLOR[p.rarity]]

  return (
    <article
      aria-labelledby="personality-name"
      className={cn('card-3d relative overflow-hidden rounded-[2rem] border-2 bg-card', c.border)}
    >
      <div className={cn('relative', c.soft)}>
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <span className={cn('rounded-full px-3 py-1 text-xs font-bold', rarity.bg)}>{p.rarity}</span>
          {metrics.isDemo && (
            <span className="rounded-full border border-muted-foreground/40 bg-background/60 px-3 py-1 text-xs font-bold text-muted-foreground">
              Demo
            </span>
          )}
        </div>
        <Boo expression={p.expression} priority className="mx-auto w-full max-w-80" />
      </div>

      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-muted-foreground">
            {metrics.isDemo ? 'Demo wallet' : shortenAddress(metrics.address, 6)} is a…
          </p>
          <h1 id="personality-name" className={cn('text-balance text-4xl font-bold md:text-5xl', c.text)}>
            {p.name}
          </h1>
          <p className="text-pretty leading-relaxed text-muted-foreground">{p.description}</p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-sm font-semibold text-muted-foreground">Degen Score</span>
            <span className="font-display text-3xl font-bold tabular-nums">
              {p.degenScore}
              <span className="text-base text-muted-foreground">/100</span>
            </span>
          </div>
          <div
            role="meter"
            aria-label="Degen score"
            aria-valuenow={p.degenScore}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-4 overflow-hidden rounded-full bg-muted"
          >
            <motion.div
              className={cn('h-full rounded-full', c.bg)}
              initial={{ width: 0 }}
              animate={{ width: `${p.degenScore}%` }}
              transition={{ delay: 0.4, duration: 1.1, ease: 'easeOut' }}
            />
          </div>
        </div>

        <ul className="flex flex-wrap gap-2" aria-label="Personality traits">
          {p.traits.map((t) => (
            <li key={t} className="rounded-full bg-muted px-3 py-1 text-sm font-semibold">
              {t}
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}
