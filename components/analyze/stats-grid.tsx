import { explorerUrl } from '@/lib/solana/address'
import type { WalletMetrics } from '@/lib/types'

const num = (v: number) => v.toLocaleString('en-US')
const usd = (v: number) =>
  v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: v >= 1000 ? 0 : 2 })

type Stat = { label: string; value: string | null; hint?: string }

export function StatsGrid({ metrics: m }: { metrics: WalletMetrics }) {
  const enhanced = m.coverage === 'enhanced'
  const needsEnhanced = 'Needs enhanced data'

  const stats: Stat[] = [
    {
      label: 'Transactions analyzed',
      value: num(m.sampleSize),
      hint: m.sampleSize >= m.sampleLimit ? `Most recent ${num(m.sampleLimit)}` : undefined,
    },
    {
      label: 'Wallet age',
      value: m.walletAgeDays == null ? null : `${m.walletAgeIsLowerBound ? '≥ ' : ''}${num(m.walletAgeDays)} days`,
    },
    { label: 'Active days', value: num(m.activeDays), hint: `${m.txPerActiveDay} tx / active day` },
    { label: 'SOL balance', value: m.solBalance == null ? null : `${m.solBalance.toFixed(3)} SOL` },
    { label: 'Fees paid', value: `${m.feesPaidSol.toFixed(4)} SOL` },
    { label: 'Failed transactions', value: num(m.failedTransactions) },
    { label: 'Swaps', value: enhanced ? num(m.swaps) : null, hint: enhanced ? `${m.buys} buys · ${m.sells} sells` : needsEnhanced },
    {
      label: 'NFT activity',
      value: enhanced ? num(m.nftPurchases + m.nftMints) : null,
      hint: enhanced ? `${m.nftPurchases} bought · ${m.nftMints} minted · ${m.nftSales} sold` : needsEnhanced,
    },
    { label: 'Tokens touched', value: enhanced ? num(m.distinctTokens) : null, hint: enhanced ? undefined : needsEnhanced },
    {
      label: 'Est. swap volume',
      value: m.estimatedVolumeUsd == null ? null : usd(m.estimatedVolumeUsd),
      hint: m.estimatedVolumeUsd == null ? 'Only stablecoin legs are priced' : 'Stablecoin legs only',
    },
    {
      label: 'Realized PnL',
      value: m.realizedPnlUsd == null ? null : usd(m.realizedPnlUsd),
      hint: m.realizedPnlUsd == null ? 'Needs full cost-basis history' : undefined,
    },
  ]

  return (
    <section aria-labelledby="stats-heading" className="card-3d flex flex-col gap-5 rounded-3xl border bg-card p-6 md:p-8">
      <h2 id="stats-heading" className="text-2xl font-semibold">
        The receipts
      </h2>
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-1 rounded-2xl bg-muted/50 p-4">
            <dt className="text-sm text-muted-foreground">{s.label}</dt>
            <dd className={s.value ? 'font-display text-2xl font-semibold tabular-nums' : 'font-display text-2xl text-muted-foreground'}>
              {s.value ?? '—'}
            </dd>
            {s.hint && <dd className="text-xs leading-relaxed text-muted-foreground">{s.hint}</dd>}
          </div>
        ))}
      </dl>

      {(m.topTokens.length > 0 || m.largestTransaction) && (
        <div className="grid gap-3 md:grid-cols-2">
          {m.topTokens.length > 0 && (
            <div className="flex flex-col gap-2 rounded-2xl border p-4">
              <h3 className="font-semibold">Most-touched tokens</h3>
              <ol className="flex flex-col gap-1.5">
                {m.topTokens.map((t) => (
                  <li key={t.mint} className="flex items-center justify-between gap-2 text-sm">
                    <a
                      href={explorerUrl('address', t.mint)}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate font-semibold hover:text-accent hover:underline"
                    >
                      {t.symbol}
                    </a>
                    <span className="shrink-0 text-muted-foreground tabular-nums">{t.count}×</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {m.largestTransaction && (
            <div className="flex flex-col gap-2 rounded-2xl border p-4">
              <h3 className="font-semibold">Biggest move</h3>
              <p className="font-display text-2xl font-semibold">
                {m.largestTransaction.usd != null
                  ? usd(m.largestTransaction.usd)
                  : m.largestTransaction.sol != null
                    ? `${m.largestTransaction.sol.toFixed(2)} SOL`
                    : '—'}
              </p>
              {m.largestTransaction.description && (
                <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{m.largestTransaction.description}</p>
              )}
              {m.largestTransaction.signature && (
                <a
                  href={explorerUrl('tx', m.largestTransaction.signature)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-accent hover:underline"
                >
                  View on Explorer
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
