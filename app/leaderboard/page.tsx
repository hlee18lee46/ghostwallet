import type { Metadata } from 'next'
import { Boo } from '@/components/boo'
import { DemoBanner } from '@/components/demo-banner'
import { TabLinks } from '@/components/tab-links'
import { demoLeaderboard } from '@/lib/demo/community'
import { ARCHETYPES } from '@/lib/personality/archetypes'
import { COLOR_CLASSES } from '@/lib/theme'
import type { LeaderboardCategory } from '@/lib/types'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Leaderboard',
  description: 'The most degen, most active, and most chaotic wallet personalities on Solana.',
}

const CATEGORIES: { id: LeaderboardCategory; label: string }[] = [
  { id: 'degen', label: 'Most Degen' },
  { id: 'active', label: 'Most Active' },
  { id: 'collector', label: 'Top Collectors' },
  { id: 'chaotic', label: 'Most Chaotic' },
]

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const raw = (await searchParams).category
  const category = CATEGORIES.find((c) => c.id === raw)?.id ?? 'degen'
  const entries = demoLeaderboard(category)

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-12">
      <header className="flex flex-col gap-3">
        <h1 className="text-balance text-5xl font-bold">Hall of haunting</h1>
        <p className="leading-relaxed text-muted-foreground">Who is the most unhinged ghost on Solana this week?</p>
      </header>
      <DemoBanner>
        Sample rankings. The leaderboard will rank real analyzed wallets once result storage is connected.
      </DemoBanner>
      <TabLinks
        label="Leaderboard category"
        active={category}
        tabs={CATEGORIES.map((c) => ({ ...c, href: `/leaderboard?category=${c.id}` }))}
      />
      <ol className="flex flex-col gap-2">
        {entries.map((e) => {
          const a = ARCHETYPES[e.archetypeId]
          const c = COLOR_CLASSES[a.color]
          return (
            <li
              key={e.rank}
              className={cn(
                'flex items-center gap-4 rounded-2xl border bg-card p-3 pr-5',
                e.rank === 1 && 'card-3d border-warning/50',
              )}
            >
              <span
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-xl font-display text-lg font-bold tabular-nums',
                  e.rank <= 3 ? 'bg-warning text-warning-foreground' : 'bg-muted text-muted-foreground',
                )}
              >
                {e.rank}
              </span>
              <div className={cn('shrink-0 rounded-xl', c.soft)}>
                <Boo expression={a.expression} decorative className="w-14" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className={cn('truncate font-semibold', c.text)}>{a.name}</span>
                <span className="truncate text-sm text-muted-foreground">{e.walletShort}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-display text-xl font-bold tabular-nums">{e.value.toLocaleString('en-US')}</span>
                <span className="text-xs text-muted-foreground">{e.valueLabel}</span>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
