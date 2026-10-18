import Link from 'next/link'
import { Boo } from '@/components/boo'
import { DEMO_PERSONAS } from '@/lib/demo/personas'
import type { DemoPersonaId } from '@/lib/types'
import { WalletInput } from './wallet-input'

const DEMO_IDS = Object.keys(DEMO_PERSONAS) as DemoPersonaId[]

export function Hero() {
  return (
    <section className="hero-glow relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-12 pb-20 md:grid-cols-[1.15fr_1fr] md:pt-20 md:pb-28">
        <div className="flex flex-col gap-6">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-sm font-semibold text-secondary">
            <span className="size-2 rounded-full bg-accent" aria-hidden />
            Live on Solana mainnet
          </p>
          <h1 className="text-balance text-5xl leading-[1.05] font-bold md:text-7xl">
            {'Your wallet has a personality. '}
            <span className="text-secondary">{"And it's judging you."}</span>
          </h1>
          <p className="max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Paste any public Solana address. Boo reads the on-chain history, figures out what kind of trader lives there,
            and roasts it — gently. Then mint the result as a collectible.
          </p>
          <WalletInput />
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">No wallet handy? Try a demo:</span>
            {DEMO_IDS.map((id) => (
              <Link
                key={id}
                href={`/analyze?demo=${id}`}
                className="rounded-full border bg-card px-3 py-1.5 font-semibold transition-colors hover:border-primary/50 hover:bg-muted"
              >
                {DEMO_PERSONAS[id].label}
              </Link>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-sm md:max-w-none">
          <Boo expression="laughing" float priority className="w-full" />
          <div className="card-3d absolute right-0 bottom-6 max-w-56 rotate-2 rounded-2xl rounded-br-sm border bg-card p-4 text-sm leading-relaxed md:-right-4">
            <p className="font-semibold">{'"312 swaps in a week? Do you sleep, or just refresh Jupiter?"'}</p>
            <p className="mt-1 text-xs text-muted-foreground">— Boo, to a Degen Goblin</p>
          </div>
        </div>
      </div>
    </section>
  )
}
