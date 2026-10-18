
import type {
  Achievement,
  ArchetypeId,
  PersonalityResult,
  Rarity,
  WalletMetrics,
} from '@/lib/types'

import { ARCHETYPES, RARITY_ORDER } from './archetypes'

const clamp = (v: number, lo = 0, hi = 100) =>
  Math.max(lo, Math.min(hi, Number.isFinite(v) ? v : 0))

const ratio = (a: number, b: number) =>
  b > 0 ? a / b : 0

const cap = (value: number, target: number) =>
  clamp(ratio(value, target), 0, 1)

export type ArchetypeCandidate = {
  id: ArchetypeId
  name: string
  score: number
  reasons: string[]
}

const ALL_ARCHETYPES: ArchetypeId[] = [
  'ghost-town',
  'nft-hoarder',
  'speedrunner',
  'degen-goblin',
  'paper-hands',
  'whale-wannabe',
  'gas-fee-victim',
  'diamond-hands',
]

/**
 * Degen Score: 0–100.
 *
 * This is a deterministic activity score, not an
 * estimate of profitability or investment skill.
 *
 * Basic RPC coverage has fewer observable signals.
 * Therefore its score is based on activity and
 * transaction failures rather than invented swap data.
 */
export function computeDegenScore(m: WalletMetrics): number {
  const failedRatio = ratio(
    m.failedTransactions,
    m.sampleSize,
  )

  const activity = cap(m.txPerActiveDay, 20)

  if (m.coverage !== 'enhanced') {
    const activityScore = 75 * activity

    const failureScore =
      25 * cap(failedRatio, 0.15)

    return Math.round(
      clamp(activityScore + failureScore),
    )
  }

  const swapRate = ratio(m.swaps, m.sampleSize)
  const tokenSpread = cap(m.distinctTokens, 40)

  const nftTotal =
    m.nftPurchases + m.nftMints

  const nftActivity = cap(nftTotal, 30)

  return Math.round(
    clamp(
      28 * activity +
      27 * cap(swapRate, 0.6) +
      20 * tokenSpread +
      15 * nftActivity +
      10 * cap(failedRatio, 0.15),
    ),
  )
}

/**
 * Score every archetype independently.
 *
 * Scores represent relative rule-match strength,
 * not statistical probabilities.
 */
export function rankWalletArchetypes(
  m: WalletMetrics,
): ArchetypeCandidate[] {
  const enhanced = m.coverage === 'enhanced'

  const failedRatio = ratio(
    m.failedTransactions,
    m.sampleSize,
  )

  const nftTotal =
    m.nftPurchases + m.nftMints

  const nftRatio = ratio(
    nftTotal,
    m.sampleSize,
  )

  const walletAge = m.walletAgeDays ?? 0

  const daysSinceLast = m.lastSeen
    ? Math.max(
        0,
        (Date.now() -
          new Date(m.lastSeen).getTime()) /
          86_400_000,
      )
    : null

  const candidates: ArchetypeCandidate[] = []

  function add(
    id: ArchetypeId,
    score: number,
    reasons: string[],
  ) {
    candidates.push({
      id,
      name: ARCHETYPES[id].name,
      score: Math.round(clamp(score)),
      reasons,
    })
  }

  // 1. Ghost Town
  const inactivity = daysSinceLast === null
    ? 0
    : cap(daysSinceLast, 90)

  const lowActivity = 1 - cap(
    m.totalTransactions,
    50,
  )

  add(
    'ghost-town',
    75 * lowActivity + 25 * inactivity,
    [
      `${m.totalTransactions} transactions found`,
      daysSinceLast === null
        ? 'Last activity unknown'
        : `${Math.round(daysSinceLast)} days since last activity`,
    ],
  )

  // 2. NFT Hoarder
  add(
    'nft-hoarder',
    enhanced
      ? 65 * cap(nftTotal, 15) +
        35 * cap(nftRatio, 0.2)
      : 0,
    enhanced
      ? [
          `${nftTotal} NFT buys + mints`,
          `${Math.round(nftRatio * 100)}% of sampled activity involves NFTs`,
        ]
      : ['NFT activity unavailable with basic RPC coverage'],
  )

  // 3. Speedrunner
  add(
    'speedrunner',
    100 * cap(m.txPerActiveDay, 25),
    [
      `${m.txPerActiveDay} transactions per active day`,
      `${m.activeDays} active days in sample`,
    ],
  )

  // 4. Degen Goblin
  add(
    'degen-goblin',
    enhanced
      ? 55 * cap(m.swaps, 20) +
        45 * cap(m.distinctTokens, 12)
      : 0,
    enhanced
      ? [
          `${m.swaps} swaps`,
          `${m.distinctTokens} distinct tokens touched`,
        ]
      : ['Swap and token diversity data unavailable'],
  )

  // 5. Paper Hands
  const sellRatio = ratio(
    m.sells,
    m.buys,
  )

  add(
    'paper-hands',
    enhanced && m.sells > 0
      ? 40 * cap(m.swaps, 10) +
        60 * cap(sellRatio, 1.5)
      : 0,
    enhanced
      ? [
          `${m.sells} sells vs ${m.buys} buys`,
          `${m.swaps} swaps`,
        ]
      : ['Buy and sell data unavailable'],
  )

  // 6. Whale Wannabe
  const averageSwapUsd =
    enhanced &&
    m.swaps > 0 &&
    m.estimatedVolumeUsd !== null
      ? m.estimatedVolumeUsd / m.swaps
      : null

  const smallSwapScore =
    averageSwapUsd === null
      ? 0
      : 1 - cap(averageSwapUsd, 60)

  add(
    'whale-wannabe',
    averageSwapUsd === null
      ? 0
      : 40 * cap(m.swaps, 10) +
        60 * smallSwapScore,
    averageSwapUsd === null
      ? ['Estimated USD swap volume unavailable']
      : [
          `${m.swaps} swaps`,
          `~$${Math.round(averageSwapUsd)} average swap size (estimated)`,
        ],
  )

  // 7. Gas Fee Victim
  // Requires actual failed transactions.
  add(
    'gas-fee-victim',
    m.failedTransactions === 0
      ? 0
      : 55 * cap(m.failedTransactions, 5) +
        45 * cap(failedRatio, 0.08),
    [
      `${m.failedTransactions} failed transactions`,
      `${Math.round(failedRatio * 100)}% failure rate in sample`,
      `${m.feesPaidSol.toFixed(5)} SOL paid in transaction fees`,
    ],
  )

  // 8. Diamond Hands
  // This is a behavioral proxy, not proof of holding.
  const ageScore = cap(walletAge, 180)
  const lowFrequency =
    1 - cap(m.txPerActiveDay, 4)

  const buySellBalance = enhanced
    ? m.buys > 0 && m.sells <= m.buys
      ? 1
      : 0
    : 0

  add(
    'diamond-hands',
    45 * ageScore +
      35 * lowFrequency +
      20 * buySellBalance,
    [
      `${walletAge}${m.walletAgeIsLowerBound ? '+' : ''} days on-chain`,
      `${m.txPerActiveDay} transactions per active day`,
      enhanced
        ? `${m.buys} buys vs ${m.sells} sells`
        : 'Holding behavior cannot be verified with basic RPC coverage',
    ],
  )

  // Penalize personality matches with little evidence.
  for (const candidate of candidates) {
    if (
      m.sampleSize === 0 &&
      candidate.id !== 'ghost-town'
    ) {
      candidate.score = 0
    }

    if (
      m.totalTransactions < 10 &&
      candidate.id !== 'ghost-town'
    ) {
      candidate.score = Math.min(
        candidate.score,
        25,
      )
    }

    if (
      !enhanced &&
      [
        'nft-hoarder',
        'degen-goblin',
        'paper-hands',
        'whale-wannabe',
      ].includes(candidate.id)
    ) {
      candidate.score = 0
    }
  }

  // Preserve Ghost Town for very small or empty samples.
  if (m.totalTransactions < 10) {
    const ghostTown = candidates.find(
      c => c.id === 'ghost-town',
    )

    if (ghostTown) {
      ghostTown.score = Math.max(
        ghostTown.score,
        80,
      )
    }
  }

  return candidates.sort(
    (a, b) =>
      b.score - a.score ||
      ALL_ARCHETYPES.indexOf(a.id) -
        ALL_ARCHETYPES.indexOf(b.id),
  )
}

function rarityFor(
  base: Rarity,
  strength: number,
  degen: number,
): Rarity {
  let idx = RARITY_ORDER.indexOf(base)

  if (idx < 0) idx = 0

  if (strength >= 90) idx++
  if (degen >= 92) idx++

  return RARITY_ORDER[
    Math.min(idx, RARITY_ORDER.length - 1)
  ]
}

export function computeAchievements(
  m: WalletMetrics,
): Achievement[] {
  const enhanced = m.coverage === 'enhanced'

  const all: (Achievement & {
    earned: boolean
  })[] = [
    {
      id: 'swap-til-drop',
      title: "Swap 'Til You Drop",
      description: `${m.swaps} swaps in the sample`,
      earned: enhanced && m.swaps >= 50,
    },
    {
      id: 'token-tourist',
      title: 'Token Tourist',
      description: `Touched ${m.distinctTokens} tokens`,
      earned:
        enhanced && m.distinctTokens >= 25,
    },
    {
      id: 'failed-successfully',
      title: 'Failed Successfully',
      description: `${m.failedTransactions} failed transactions`,
      earned: m.failedTransactions >= 5,
    },
    {
      id: 'jpeg-enjoyer',
      title: 'JPEG Enjoyer',
      description: `${m.nftPurchases + m.nftMints} NFT buys/mints`,
      earned:
        enhanced &&
        m.nftPurchases + m.nftMints >= 10,
    },
    {
      id: 'og-spirit',
      title: 'OG Spirit',
      description: `${m.walletAgeDays ?? 0}${m.walletAgeIsLowerBound ? '+' : ''} days on-chain`,
      earned: (m.walletAgeDays ?? 0) >= 365,
    },
    {
      id: 'fee-philanthropist',
      title: 'Fee Philanthropist',
      description: `${m.feesPaidSol.toFixed(4)} SOL paid in fees`,
      earned: m.feesPaidSol >= 0.05,
    },
    {
      id: 'touch-grass',
      title: 'Touch Grass Pending',
      description: `Active on ${m.activeDays} days`,
      earned: m.activeDays >= 60,
    },
    {
      id: 'barely-haunting',
      title: 'Barely Haunting',
      description: `Only ${m.totalTransactions} transactions`,
      earned: m.totalTransactions < 20,
    },
  ]

  return all
    .filter(a => a.earned)
    .slice(0, 4)
    .map(({ earned: _earned, ...achievement }) =>
      achievement,
    )
}

/**
 * Apply a selected archetype to wallet metrics.
 *
 * Can be used by:
 * - deterministic fallback classification
 * - Vultr AI-selected archetypes
 */
export function buildPersonality(
  m: WalletMetrics,
  id: ArchetypeId,
  strength: number,
  reasons: string[],
  variant = 0,
): PersonalityResult {
  const arch = ARCHETYPES[id]

  const degenScore = computeDegenScore(m)

  const roasts = arch.roasts.map(
    fn => fn(m),
  )

  const normalizedVariant =
    roasts.length > 0
      ? ((variant % roasts.length) +
          roasts.length) %
        roasts.length
      : 0

  const rotated = roasts.map(
    (_, i) =>
      roasts[
        (i + normalizedVariant) %
          roasts.length
      ],
  )

  return {
    archetypeId: id,
    name: arch.name,
    description: arch.description,
    degenScore,
    personalityScore: Math.round(
      clamp(strength),
    ),
    rarity: rarityFor(
      arch.baseRarity,
      strength,
      degenScore,
    ),
    color: arch.color,
    expression: arch.expression,
    traits: arch.traits,
    roasts: rotated,
    roastOfTheDay: rotated[0] ?? '',
    shareQuote: arch.shareQuote,
    achievements: computeAchievements(m),
    roastSource: 'template',
    reasons,
  }
}

/**
 * Deterministic fallback classifier.
 *
 * Vultr AI can override the selected archetype
 * through buildPersonality(), while scores and
 * achievements remain deterministic.
 */
export function classifyWallet(
  m: WalletMetrics,
  variant = 0,
): PersonalityResult {
  const candidates = rankWalletArchetypes(m)

  const winner = candidates[0]

  return buildPersonality(
    m,
    winner?.id ?? 'ghost-town',
    winner?.score ?? 0,
    winner?.reasons ?? [
      'Insufficient transaction data',
    ],
    variant,
  )
}
