import type { Coverage, DataSource, TopToken, WalletMetrics } from '@/lib/types'
import { isStable, isWrappedSol, tokenSymbol } from './tokens'

export type TxKind = 'swap' | 'nft_purchase' | 'nft_mint' | 'nft_sale' | 'transfer' | 'other'

export type TokenMovement = { mint: string; amount: number; direction: 'in' | 'out' }

/** Source-agnostic transaction shape every fetcher normalizes into. */
export type NormalizedTx = {
  signature: string
  timestamp: number | null
  failed: boolean
  feeLamports: number | null
  feePaidByWallet: boolean
  kind: TxKind | null
  solIn: number
  solOut: number
  tokens: TokenMovement[]
  description: string | null
}

type ComputeOptions = {
  address: string
  source: DataSource
  coverage: Coverage
  sampleLimit: number
  solPriceUsd: number | null
  solBalance: number | null
  hitSampleLimit: boolean
}

const DAY_MS = 86_400_000

function txUsdValue(tx: NormalizedTx, solPrice: number | null): number | null {
  let stableValue = 0
  for (const t of tx.tokens) if (isStable(t.mint)) stableValue = Math.max(stableValue, t.amount)

  const wsol = tx.tokens.filter((t) => isWrappedSol(t.mint)).reduce((m, t) => Math.max(m, t.amount), 0)
  const sol = Math.max(tx.solIn, tx.solOut, wsol)
  const solValue = solPrice != null ? sol * solPrice : null

  if (stableValue > 0) return Math.max(stableValue, solValue ?? 0)
  return solValue
}

function classifySwapDirection(tx: NormalizedTx): 'buy' | 'sell' | null {
  const risky = tx.tokens.filter((t) => !isStable(t.mint) && !isWrappedSol(t.mint))
  if (risky.some((t) => t.direction === 'in')) return 'buy'
  if (risky.some((t) => t.direction === 'out')) return 'sell'
  return null
}

export function computeMetrics(txs: NormalizedTx[], opts: ComputeOptions): WalletMetrics {
  const notes: string[] = []
  const timestamps = txs.map((t) => t.timestamp).filter((t): t is number => t != null)
  const enhanced = opts.coverage === 'enhanced'

  let swaps = 0
  let nftPurchases = 0
  let nftMints = 0
  let nftSales = 0
  let transfers = 0
  let buys = 0
  let sells = 0
  let failed = 0
  let feesLamports = 0
  let feesKnown = false
  let volume = 0
  let volumeKnown = false
  let largest: WalletMetrics['largestTransaction'] = null
  let largestScore = 0
  const tokenCounts = new Map<string, number>()

  for (const tx of txs) {
    if (tx.failed) failed++
    if (tx.feeLamports != null && tx.feePaidByWallet) {
      feesLamports += tx.feeLamports
      feesKnown = true
    }
    if (!enhanced || tx.failed) continue

    switch (tx.kind) {
      case 'swap': {
        swaps++
        const dir = classifySwapDirection(tx)
        if (dir === 'buy') buys++
        if (dir === 'sell') sells++
        break
      }
      case 'nft_purchase':
        nftPurchases++
        break
      case 'nft_mint':
        nftMints++
        break
      case 'nft_sale':
        nftSales++
        break
      case 'transfer':
        transfers++
        break
    }

    for (const t of tx.tokens) {
      if (isWrappedSol(t.mint)) continue
      tokenCounts.set(t.mint, (tokenCounts.get(t.mint) ?? 0) + 1)
    }

    const usd = txUsdValue(tx, opts.solPriceUsd)
    if (usd != null) {
      volume += usd
      volumeKnown = true
    }
    const sol = Math.max(tx.solIn, tx.solOut)
    const score = usd ?? sol
    if (score > largestScore) {
      largestScore = score
      largest = {
        signature: tx.signature,
        sol: sol || null,
        usd: usd != null ? Math.round(usd * 100) / 100 : null,
        description: tx.description,
      }
    }
  }

  const topTokens: TopToken[] = [...tokenCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([mint, count]) => ({ mint, symbol: tokenSymbol(mint), count }))

  const activeDays = new Set(timestamps.map((t) => Math.floor((t * 1000) / DAY_MS))).size
  const oldest = timestamps.length ? Math.min(...timestamps) : null
  const newest = timestamps.length ? Math.max(...timestamps) : null
  const walletAgeDays =
    oldest != null ? Math.max(0, Math.floor((Date.now() - oldest * 1000) / DAY_MS)) : null

  if (opts.hitSampleLimit) {
    notes.push(
      `Only the most recent ${opts.sampleLimit} transactions were analyzed; wallet age is a lower bound.`,
    )
  }
  if (!enhanced) {
    notes.push(
      'Basic mode: only signatures and timestamps were available, so swaps, NFTs and tokens are not counted. Add HELIUS_API_KEY for full parsing.',
    )
  }
  if (enhanced && volumeKnown) {
    notes.push(
      'USD volume is estimated from stablecoin amounts and the current SOL price, not historical prices.',
    )
  }
  if (enhanced && !volumeKnown) notes.push('USD volume unavailable: SOL price could not be fetched.')
  notes.push('Realized gains/losses are not shown — reliable cost basis is not available from this sample.')

  return {
    address: opts.address,
    source: opts.source,
    coverage: opts.coverage,
    isDemo: opts.source === 'demo',
    sampleSize: txs.length,
    sampleLimit: opts.sampleLimit,
    totalTransactions: txs.length,
    swaps,
    nftPurchases,
    nftMints,
    nftSales,
    distinctTokens: tokenCounts.size,
    buys,
    sells,
    transfers,
    failedTransactions: failed,
    feesPaidSol: feesKnown ? feesLamports / 1e9 : 0,
    estimatedVolumeUsd: enhanced && volumeKnown ? Math.round(volume) : null,
    largestTransaction: largest,
    topTokens,
    firstSeen: oldest != null ? new Date(oldest * 1000).toISOString() : null,
    lastSeen: newest != null ? new Date(newest * 1000).toISOString() : null,
    walletAgeDays,
    walletAgeIsLowerBound: opts.hitSampleLimit,
    activeDays,
    txPerActiveDay: activeDays ? Math.round((txs.length / activeDays) * 10) / 10 : 0,
    solBalance: opts.solBalance,
    realizedPnlUsd: null,
    notes,
    analyzedAt: new Date().toISOString(),
  }
}
