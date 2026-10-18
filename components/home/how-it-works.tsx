import { ScanSearch, Share2, Sparkles } from 'lucide-react'

const STEPS = [
  {
    icon: ScanSearch,
    title: 'Paste an address',
    body: 'Any public Solana wallet. Boo reads up to the last 500 transactions — no signing, no permissions.',
  },
  {
    icon: Sparkles,
    title: 'Meet your ghost',
    body: 'Behavior becomes a personality, a Degen Score from 0–100, achievements, and a fresh AI roast.',
  },
  {
    icon: Share2,
    title: 'Share or mint it',
    body: 'Post your card to X, download it, or mint it as a collectible personality NFT.',
  },
]

export function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="border-y bg-card/40">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <h2 id="how-heading" className="mb-10 text-balance text-4xl font-bold md:text-5xl">
          Three steps to getting roasted
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex flex-col gap-4 rounded-3xl border bg-background p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <s.icon className="size-6" />
                </span>
                <span className="font-display text-sm font-semibold text-muted-foreground">Step {i + 1}</span>
              </div>
              <h3 className="text-2xl font-semibold">{s.title}</h3>
              <p className="leading-relaxed text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
