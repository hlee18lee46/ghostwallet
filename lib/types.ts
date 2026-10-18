export type DataSource = 'helius' | 'rpc' | 'demo'

/** "enhanced" = parsed swaps/NFTs/tokens available; "basic" = signatures + timestamps only. */
export type Coverage = 'enhanced' | 'basic'

export type TopToken = { mint: string; symbol: string; count: number }

export type LargestTransaction = {
  signature: string | null
  sol: number | null
  usd: number | null
  description: string | null
}

export type WalletMetrics = {
  address: string
  source: DataSource
  coverage: Coverage
  isDemo: boolean
  sampleSize: number
  sampleLimit: number
  totalTransactions: number
  swaps: number
  nftPurchases: number
  nftMints: number
  nftSales: number
  distinctTokens: number
  buys: number
  sells: number
  transfers: number
  failedTransactions: number
  feesPaidSol: number
  estimatedVolumeUsd: number | null
  largestTransaction: LargestTransaction | null
  topTokens: TopToken[]
  firstSeen: string | null
  lastSeen: string | null
  walletAgeDays: number | null
  walletAgeIsLowerBound: boolean
  activeDays: number
  txPerActiveDay: number
  solBalance: number | null
  /** Realized PnL requires full cost-basis history; we never fabricate it. */
  realizedPnlUsd: number | null
  notes: string[]
  analyzedAt: string
}

export type ArchetypeId =
  | 'diamond-hands'
  | 'paper-hands'
  | 'degen-goblin'
  | 'nft-hoarder'
  | 'whale-wannabe'
  | 'gas-fee-victim'
  | 'ghost-town'
  | 'speedrunner'

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary'

export type Expression = 'happy' | 'shocked' | 'angry' | 'laughing' | 'crying'

export type ThemeColor = 'primary' | 'secondary' | 'accent' | 'success' | 'warning'

export type Achievement = { id: string; title: string; description: string }

export type PersonalityResult = {
  archetypeId: ArchetypeId
  name: string
  description: string
  degenScore: number
  personalityScore: number
  rarity: Rarity
  color: ThemeColor
  expression: Expression
  traits: string[]
  roasts: string[]
  roastOfTheDay: string
  shareQuote: string
  achievements: Achievement[]
  roastSource: 'ai' | 'template'
  reasons: string[]
}

export type DemoPersonaId = 'degen' | 'diamond' | 'hoarder'

export type GalleryItem = {
  id: string
  walletShort: string
  archetypeId: ArchetypeId
  degenScore: number
  rarity: Rarity
  roast: string
  laughs: number
  mintedAt: string
  explorerUrl: string | null
  isDemo: boolean
}

export type LeaderboardCategory = 'degen' | 'active' | 'collector' | 'chaotic'

export type LeaderboardEntry = {
  rank: number
  walletShort: string
  archetypeId: ArchetypeId
  value: number
  valueLabel: string
  isDemo: boolean
}
