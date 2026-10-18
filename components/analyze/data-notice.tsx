import { Database } from 'lucide-react'
import { explorerUrl } from '@/lib/solana/address'
import type { WalletMetrics } from '@/lib/types'

const SOURCE_LABEL: Record<WalletMetrics['source'], string> = {
  helius: 'Helius enhanced transactions',
  rpc: 'Solana RPC (signatures + timestamps)',
  demo: 'Demo data — not a real wallet',
}

export function DataNotice({ metrics: m, reasons }: { metrics: WalletMetrics; reasons: string[] }) {
  return (
    <section aria-labelledby="data-heading" className="flex flex-col gap-3 rounded-3xl border border-dashed p-6 text-sm leading-relaxed">
      <h2 id="data-heading" className="flex items-center gap-2 font-sans text-base font-semibold">
        <Database className="size-4 text-accent" />
        How Boo decided
      </h2>
      <p className="text-muted-foreground">
        Source: <span className="font-semibold text-foreground">{SOURCE_LABEL[m.source]}</span> · analyzed{' '}
        {new Date(m.analyzedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
        {!m.isDemo && (
          <>
            {' · '}
            <a href={explorerUrl('address', m.address)} target="_blank" rel="noreferrer" className="text-accent hover:underline">
              View wallet
            </a>
          </>
        )}
      </p>
      {reasons.length > 0 && (
        <p className="text-muted-foreground">
          Signals: <span className="text-foreground">{reasons.join(' · ')}</span>
        </p>
      )}
      {m.notes.length > 0 && (
        <ul className="flex list-disc flex-col gap-1 pl-5 text-muted-foreground">
          {m.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
