import type { PersonalityResult, WalletMetrics } from '@/lib/types'
import { shortenAddress } from '@/lib/solana/address'

export function shareCardPath(metrics: WalletMetrics, p: PersonalityResult) {
  const params = new URLSearchParams({
    arch: p.archetypeId,
    score: String(p.degenScore),
    rarity: p.rarity,
    wallet: metrics.isDemo ? 'demo wallet' : shortenAddress(metrics.address),
    roast: p.roastOfTheDay,
  })
  if (metrics.isDemo) params.set('demo', '1')
  return `/api/og?${params.toString()}`
}

export function tweetText(p: PersonalityResult) {
  return `My wallet is a ${p.name} (Degen Score ${p.degenScore}/100). Boo said: "${p.roastOfTheDay}"`
}
