import { Boo } from '@/components/boo'
import { ARCHETYPE_LIST } from '@/lib/personality/archetypes'
import { COLOR_CLASSES } from '@/lib/theme'
import { cn } from '@/lib/utils'

export function ArchetypeShowcase() {
  return (
    <section aria-labelledby="archetypes-heading" className="mx-auto max-w-6xl px-4 py-20">
      <div className="mb-10 flex flex-col gap-3">
        <h2 id="archetypes-heading" className="text-balance text-4xl font-bold md:text-5xl">
          Which ghost lives in your wallet?
        </h2>
        <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">
          Eight personalities, scored from real behavior — swap counts, NFT activity, fees, timing. No vibes, just
          receipts.
        </p>
      </div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ARCHETYPE_LIST.map((a) => {
          const c = COLOR_CLASSES[a.color]
          return (
            <li
              key={a.id}
              className="card-3d group flex flex-col gap-3 rounded-3xl border bg-card p-5 transition-transform hover:-translate-y-1"
            >
              <div className={cn('rounded-2xl', c.soft)}>
                <Boo expression={a.expression} decorative className="mx-auto w-32 transition-transform group-hover:scale-105" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <h3 className={cn('text-xl font-semibold', c.text)}>{a.name}</h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                  {a.baseRarity}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{a.description}</p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
