import type { Achievement, ArchetypeId, PersonalityResult, Rarity, WalletMetrics } from '@/lib/types'
import { ARCHETYPES, RARITY_ORDER } from './archetypes'

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v))
const ratio = (a: number, b: number) => (b > 0 ? a / b : 0)

/** 0–100, weighted toward chaotic, high-frequency, many-token behavior. */
export function computeDegenScore(m: WalletMetrics): number {
  const failedRatio = ratio(m.failedTransactions, m.sampleSize)
  const activity = Math.min(m.txPerActiveDay / 20, 1)

  if (m.coverage === 'basic') {
    return Math.round(clamp(55 * activity + 25 * Math.min(failedRatio / 0.15, 1) + 20 * Math.min(m.sampleSize / 500, 1)))
  }

  const swapRate = ratio(m.swaps, m.sampleSize)
  const tokenSpread = Math.min(m.distinctTokens / 40, 1)
  const nftActivity = Math.min((m.nftPurchases + m.nftMints) / 30, 1)
  return Math.round(
    clamp(
      28 * activity +
        27 * Math.min(swapRate / 0.6, 1) +
        20 * tokenSpread +
        15 * nftActivity +
        10 * Math.min(failedRatio / 0.15, 1),
    ),
  )
}

type Match = { id: ArchetypeId; strength: number; reasons: string[] }

function match(m: WalletMetrics): Match {
  const daysSinceLast = m.lastSeen ? (Date.now() - new Date(m.lastSeen).getTime()) / 86_400_000 : Infinity
  const failedRatio = ratio(m.failedTransactions, m.sampleSize)
  const nftTotal = m.nftPurchases + m.nftMints
  const enhanced = m.coverage === 'enhanced'

  if (m.totalTransactions < 10 || (daysSinceLast > 90 && m.totalTransactions < 50)) {
    return {
      id: 'ghost-town',
      strength: clamp(100 - m.totalTransactions * 4),
      reasons: [
        `${m.totalTransactions} transactions found`,
        Number.isFinite(daysSinceLast) ? `${Math.round(daysSinceLast)} days since last activity` : 'No recent activity',
      ],
    }
  }

  if (enhanced && nftTotal >= 15 && ratio(nftTotal, m.sampleSize) >= 0.2) {
    return {
      id: 'nft-hoarder',
      strength: clamp(50 + nftTotal),
      reasons: [`${nftTotal} NFT buys + mints`, `${Math.round(ratio(nftTotal, m.sampleSize) * 100)}% of sampled activity is NFTs`],
    }
  }

  if (m.txPerActiveDay >= 25) {
    return {
      id: 'speedrunner',
      strength: clamp(40 + m.txPerActiveDay),
      reasons: [`${m.txPerActiveDay} transactions per active day`],
    }
  }

  if (enhanced && m.swaps >= 20 && m.distinctTokens >= 12) {
    return {
      id: 'degen-goblin',
      strength: clamp(40 + m.distinctTokens + m.swaps / 5),
      reasons: [`${m.swaps} swaps`, `${m.distinctTokens} distinct tokens touched`],
    }
  }

  if (enhanced && m.swaps >= 10 && m.sells > m.buys * 1.5) {
    return {
      id: 'paper-hands',
      strength: clamp(40 + ratio(m.sells, m.buys || 1) * 15),
      reasons: [`${m.sells} sells vs ${m.buys} buys`],
    }
  }

  if (enhanced && m.swaps >= 10 && m.estimatedVolumeUsd != null && m.estimatedVolumeUsd / m.swaps < 60) {
    return {
      id: 'whale-wannabe',
      strength: clamp(90 - m.estimatedVolumeUsd / m.swaps),
      reasons: [`${m.swaps} swaps`, `~$${Math.round(m.estimatedVolumeUsd / m.swaps)} average swap size (estimated)`],
    }
  }

  if (failedRatio >= 0.08 && m.failedTransactions >= 5) {
    return {
      id: 'gas-fee-victim',
      strength: clamp(40 + failedRatio * 300),
      reasons: [`${m.failedTransactions} failed transactions (${Math.round(failedRatio * 100)}%)`],
    }
  }

  if ((m.walletAgeDays ?? 0) >= 180 && m.txPerActiveDay < 4 && m.sells <= m.buys) {
    return {
      id: 'diamond-hands',
      strength: clamp(40 + (m.walletAgeDays ?? 0) / 10),
      reasons: [`${m.walletAgeDays}${m.walletAgeIsLowerBound ? '+' : ''} days on-chain`, `${m.txPerActiveDay} tx per active day`],
    }
  }

  if (m.txPerActiveDay >= 8) {
    return { id: 'gas-fee-victim', strength: clamp(30 + m.txPerActiveDay * 2), reasons: [`${m.txPerActiveDay} tx per active day`] }
  }

  return {
    id: 'diamond-hands',
    strength: 45,
    reasons: ['Low, steady activity', `${m.activeDays} active days in sample`],
  }
}

function rarityFor(base: Rarity, strength: number, degen: number): Rarity {
  let idx = RARITY_ORDER.indexOf(base)
  if (strength >= 90) idx++
  if (degen >= 92) idx++
  return RARITY_ORDER[Math.min(idx, RARITY_ORDER.length - 1)]
}

export function computeAchievements(m: WalletMetrics): Achievement[] {
  const all: (Achievement & { earned: boolean })[] = [
    { id: 'swap-til-drop', title: "Swap 'Til You Drop", description: `${m.swaps} swaps in the sample`, earned: m.swaps >= 50 },
    { id: 'token-tourist', title: 'Token Tourist', description: `Touched ${m.distinctTokens} tokens`, earned: m.distinctTokens >= 25 },
    { id: 'failed-successfully', title: 'Failed Successfully', description: `${m.failedTransactions} failed transactions`, earned: m.failedTransactions >= 5 },
    { id: 'jpeg-enjoyer', title: 'JPEG Enjoyer', description: `${m.nftPurchases + m.nftMints} NFT buys/mints`, earned: m.nftPurchases + m.nftMints >= 10 },
    { id: 'og-spirit', title: 'OG Spirit', description: `${m.walletAgeDays ?? 0}${m.walletAgeIsLowerBound ? '+' : ''} days on-chain`, earned: (m.walletAgeDays ?? 0) >= 365 },
    { id: 'fee-philanthropist', title: 'Fee Philanthropist', description: `${m.feesPaidSol.toFixed(4)} SOL paid in fees`, earned: m.feesPaidSol >= 0.05 },
    { id: 'touch-grass', title: 'Touch Grass Pending', description: `Active on ${m.activeDays} days`, earned: m.activeDays >= 60 },
    { id: 'barely-haunting', title: 'Barely Haunting', description: `Only ${m.totalTransactions} transactions`, earned: m.totalTransactions < 20 },
  ]
  return all.filter((a) => a.earned).slice(0, 4).map(({ earned: _earned, ...a }) => a)
}

/** Deterministic: same metrics always yield the same archetype, scores and template roasts. */
export function classifyWallet(m: WalletMetrics, variant = 0): PersonalityResult {
  const { id, strength, reasons } = match(m)
  const arch = ARCHETYPES[id]
  const degenScore = computeDegenScore(m)
  const roasts = arch.roasts.map((fn) => fn(m))
  const rotated = roasts.map((_, i) => roasts[(i + variant) % roasts.length])

  return {
    archetypeId: id,
    name: arch.name,
    description: arch.description,
    degenScore,
    personalityScore: Math.round(strength),
    rarity: rarityFor(arch.baseRarity, strength, degenScore),
    color: arch.color,
    expression: arch.expression,
    traits: arch.traits,
    roasts: rotated,
    roastOfTheDay: rotated[0],
    shareQuote: arch.shareQuote,
    achievements: computeAchievements(m),
    roastSource: 'template',
    reasons,
  }
}
