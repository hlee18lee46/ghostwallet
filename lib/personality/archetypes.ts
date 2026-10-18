import type { ArchetypeId, Expression, Rarity, ThemeColor, WalletMetrics } from '@/lib/types'

type RoastTemplate = (m: WalletMetrics) => string

export type Archetype = {
  id: ArchetypeId
  name: string
  description: string
  color: ThemeColor
  expression: Expression
  baseRarity: Rarity
  traits: string[]
  roasts: RoastTemplate[]
  shareQuote: string
}

const n = (v: number) => v.toLocaleString('en-US')
const age = (m: WalletMetrics) =>
  m.walletAgeDays == null ? 'a while' : `${m.walletAgeIsLowerBound ? 'at least ' : ''}${n(m.walletAgeDays)} days`

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  'diamond-hands': {
    id: 'diamond-hands',
    name: 'Diamond Hands',
    description: 'Holds through anything. Possibly because the seed phrase is lost.',
    color: 'accent',
    expression: 'happy',
    baseRarity: 'Epic',
    traits: ['Unshakeable', 'Allergic to selling', 'Calm in a crash'],
    roasts: [
      (m) => `${age(m)} on-chain and only ${n(m.totalTransactions)} transactions. Patience or amnesia? Boo can't tell.`,
      (m) => `You were active on ${n(m.activeDays)} days. The other days you just stared at the chart and felt things.`,
      () => `You don't hold through the dip. You live in the dip. You've decorated it.`,
    ],
    shareQuote: 'Boo checked. I simply do not sell.',
  },
  'paper-hands': {
    id: 'paper-hands',
    name: 'Paper Hands',
    description: 'Sells at the first sign of a red candle. Or a cloud. Or a sound.',
    color: 'secondary',
    expression: 'crying',
    baseRarity: 'Uncommon',
    traits: ['Quick exits', 'Fear of red', 'Regret enjoyer'],
    roasts: [
      (m) => `${n(m.sells)} sells vs ${n(m.buys)} buys. You don't take profits, you take flight.`,
      (m) => `Across ${n(m.swaps)} swaps you hit the exit button more than the enter button. Very cardio.`,
      () => `Your hands aren't paper. Paper at least survives a light breeze.`,
    ],
    shareQuote: 'Boo says my hands are made of tissue paper.',
  },
  'degen-goblin': {
    id: 'degen-goblin',
    name: 'Degen Goblin',
    description: 'Buys anything with a frog on it. Research is a rumor.',
    color: 'success',
    expression: 'laughing',
    baseRarity: 'Rare',
    traits: ['Chaotic swapper', 'Token tourist', 'Zero due diligence'],
    roasts: [
      (m) => `You swapped ${n(m.swaps)} times across ${n(m.distinctTokens)} tokens and somehow diversified your losses.`,
      (m) =>
        m.topTokens[0]
          ? `${m.topTokens[0].symbol} showed up in ${n(m.topTokens[0].count)} of your transactions. Seek help. Or don't, Boo is entertained.`
          : `${n(m.distinctTokens)} different tokens. Your portfolio is a zoo with no zookeeper.`,
      (m) => `${n(m.txPerActiveDay)} transactions per active day. Your wallet has never known rest.`,
    ],
    shareQuote: 'I am a certified Degen Goblin and I have no regrets (lie).',
  },
  'nft-hoarder': {
    id: 'nft-hoarder',
    name: 'NFT Hoarder',
    description: 'Collects JPEGs the way dragons collect gold. Same sleeping habits too.',
    color: 'warning',
    expression: 'shocked',
    baseRarity: 'Rare',
    traits: ['JPEG collector', 'Floor-price watcher', 'Discord regular'],
    roasts: [
      (m) => `${n(m.nftPurchases + m.nftMints)} NFT buys and mints in the sample. Your wallet is a museum nobody visits.`,
      (m) => `${n(m.nftMints)} mints. You see a mint button the way moths see a lamp.`,
      () => `Your NFTs aren't an investment. They're a personality you can right-click.`,
    ],
    shareQuote: 'Boo found my JPEG collection and gasped.',
  },
  'whale-wannabe': {
    id: 'whale-wannabe',
    name: 'Whale Wannabe',
    description: 'Talks like a whale, trades like a shrimp in a trench coat.',
    color: 'accent',
    expression: 'laughing',
    baseRarity: 'Uncommon',
    traits: ['Big dreams', 'Small bags', 'Screenshot-ready'],
    roasts: [
      (m) =>
        m.estimatedVolumeUsd != null && m.swaps
          ? `${n(m.swaps)} swaps averaging about $${n(Math.round(m.estimatedVolumeUsd / m.swaps))}. A whale, if whales were sardines.`
          : `${n(m.swaps)} swaps and every one of them small enough to fit in a coin purse.`,
      () => `You're not a whale. You're a dolphin with a very ambitious LinkedIn.`,
      (m) => `${n(m.swaps)} trades and the market didn't flinch once.`,
    ],
    shareQuote: "Boo says I'm a whale. A very, very small whale.",
  },
  'gas-fee-victim': {
    id: 'gas-fee-victim',
    name: 'Gas Fee Victim',
    description: 'Transacts constantly for reasons no one, including you, understands.',
    color: 'warning',
    expression: 'angry',
    baseRarity: 'Common',
    traits: ['Click-happy', 'Retry specialist', 'Validator benefactor'],
    roasts: [
      (m) => `${n(m.failedTransactions)} failed transactions. You paid to be told no. Repeatedly.`,
      (m) =>
        m.feesPaidSol > 0
          ? `You've donated ${m.feesPaidSol.toFixed(4)} SOL in fees in this sample. Validators have your photo on their fridge.`
          : `${n(m.totalTransactions)} transactions. The validators thank you for your service.`,
      () => `On the cheapest chain alive you still found a way to overpay. Truly gifted.`,
    ],
    shareQuote: 'Boo says the validators should send me a thank-you card.',
  },
  'ghost-town': {
    id: 'ghost-town',
    name: 'Ghost Town',
    description: "So quiet even Boo got spooked. Tumbleweeds have more activity.",
    color: 'secondary',
    expression: 'shocked',
    baseRarity: 'Common',
    traits: ['Barely haunted', 'Mysterious', 'Possibly a burner'],
    roasts: [
      (m) => `${n(m.totalTransactions)} transactions. Boo has haunted busier attics.`,
      (m) =>
        m.lastSeen
          ? `Last seen ${new Date(m.lastSeen).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}. Are you okay? Blink twice.`
          : `No recent activity. Boo is the ghost here, not you.`,
      () => `This wallet is so empty it echoes.`,
    ],
    shareQuote: 'My wallet is so quiet a ghost moved in.',
  },
  speedrunner: {
    id: 'speedrunner',
    name: 'Solana Speedrunner',
    description: 'Lives on-chain. Treats block times like a personal best.',
    color: 'primary',
    expression: 'laughing',
    baseRarity: 'Epic',
    traits: ['Hyperactive', 'Bot-adjacent', 'Sleep is optional'],
    roasts: [
      (m) => `${n(m.txPerActiveDay)} transactions per active day. Are you a person or a cron job?`,
      (m) => `${n(m.totalTransactions)} transactions in ${n(m.activeDays)} active days. Touch grass any%.`,
      () => `Your wallet has a higher TPS than most chains. Not a compliment.`,
    ],
    shareQuote: 'Boo clocked my wallet at speedrun pace.',
  },
}

export const ARCHETYPE_LIST = Object.values(ARCHETYPES)

export const RARITY_ORDER: Rarity[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']
