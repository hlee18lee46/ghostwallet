import { Laugh } from 'lucide-react'
import { Boo } from '@/components/boo'
import { ARCHETYPES } from '@/lib/personality/archetypes'
import { COLOR_CLASSES, RARITY_COLOR } from '@/lib/theme'
import type { GalleryItem } from '@/lib/types'
import { cn } from '@/lib/utils'

export function GalleryCard({ item }: { item: GalleryItem }) {
  const a = ARCHETYPES[item.archetypeId]
  const c = COLOR_CLASSES[a.color]
  const rarity = COLOR_CLASSES[RARITY_COLOR[item.rarity]]

  return (
    <article className="card-3d flex h-full flex-col overflow-hidden rounded-3xl border bg-card transition-transform hover:-translate-y-1">
      <div className={cn('relative', c.soft)}>
        <span className={cn('absolute top-3 left-3 z-10 rounded-full px-2.5 py-0.5 text-xs font-bold', rarity.bg)}>
          {item.rarity}
        </span>
        <span className="absolute top-3 right-3 z-10 rounded-full bg-background/70 px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
          Demo
        </span>
        <Boo expression={a.expression} decorative className="mx-auto w-40" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className={cn('text-xl font-semibold', c.text)}>{a.name}</h2>
          <span className="font-display text-lg font-bold tabular-nums">{item.degenScore}</span>
        </div>
        <p className="flex-1 leading-relaxed">{`"${item.roast}"`}</p>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{item.walletShort}</span>
          <span className="flex items-center gap-1">
            <Laugh className="size-4" />
            <span className="tabular-nums">{item.laughs.toLocaleString('en-US')}</span>
            <span className="sr-only">laughs</span>
          </span>
        </div>
      </div>
    </article>
  )
}
