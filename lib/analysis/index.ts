import 'server-only'
import type { WalletMetrics } from '@/lib/types'
import { computeMetrics } from './engine'
import { fetchHeliusTransactions } from './sources/helius'
import { fetchSignatures, fetchSolBalance } from './sources/rpc'
import { WSOL_MINT } from './tokens'

const ENHANCED_LIMIT = 300
const BASIC_LIMIT = 500

async function fetchSolPrice(): Promise<number | null> {
  try {
    const res = await fetch(`https://lite-api.jup.ag/price/v3?ids=${WSOL_MINT}`, {
      signal: AbortSignal.timeout(5_000),
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    const json = (await res.json()) as Record<string, { usdPrice?: number }>
    const price = json[WSOL_MINT]?.usdPrice
    return typeof price === 'number' && price > 0 ? price : null
  } catch {
    return null
  }
}

/** Fetches and analyzes a public wallet. Uses Helius when configured, plain RPC otherwise. */
export async function analyzeWallet(address: string): Promise<WalletMetrics> {
  const heliusKey = process.env.HELIUS_API_KEY

  if (heliusKey) {
    const [{ txs, hitLimit }, solPriceUsd, solBalance] = await Promise.all([
      fetchHeliusTransactions(address, heliusKey, ENHANCED_LIMIT),
      fetchSolPrice(),
      fetchSolBalance(address),
    ])
    return computeMetrics(txs, {
      address,
      source: 'helius',
      coverage: 'enhanced',
      sampleLimit: ENHANCED_LIMIT,
      solPriceUsd,
      solBalance,
      hitSampleLimit: hitLimit,
    })
  }

  const [{ txs, hitLimit }, solBalance] = await Promise.all([
    fetchSignatures(address, BASIC_LIMIT),
    fetchSolBalance(address),
  ])
  return computeMetrics(txs, {
    address,
    source: 'rpc',
    coverage: 'basic',
    sampleLimit: BASIC_LIMIT,
    solPriceUsd: null,
    solBalance,
    hitSampleLimit: hitLimit,
  })
}
