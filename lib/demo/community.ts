import type { ArchetypeId, GalleryItem, LeaderboardCategory, LeaderboardEntry, Rarity } from '@/lib/types'

type Seed = [string, ArchetypeId, number, Rarity, string, number, string]

const SEEDS: Seed[] = [
  ['7xKp…Q2mf', 'degen-goblin', 94, 'Legendary', 'Swapped 412 times across 88 tokens and still found a way to be down bad.', 1284, '2026-10-16'],
  ['3nVb…aL9w', 'nft-hoarder', 71, 'Rare', 'Your wallet is a museum nobody visits.', 911, '2026-10-15'],
  ['9qRt…Zx4c', 'speedrunner', 89, 'Epic', 'Are you a person or a cron job?', 860, '2026-10-17'],
  ['Hd2s…mN7e', 'paper-hands', 52, 'Uncommon', "You don't take profits, you take flight.", 742, '2026-10-14'],
  ['Bf8u…yT1k', 'diamond-hands', 18, 'Epic', 'You live in the dip. You have decorated it.', 655, '2026-10-12'],
  ['Kc5m…pW3r', 'gas-fee-victim', 63, 'Common', 'You paid to be told no. Repeatedly.', 590, '2026-10-17'],
  ['Ep4z…Lq8d', 'whale-wannabe', 47, 'Uncommon', 'A dolphin with a very ambitious LinkedIn.', 512, '2026-10-13'],
  ['Wn6a…Rj2v', 'ghost-town', 4, 'Common', 'Boo has haunted busier attics.', 433, '2026-10-11'],
  ['Mt1x…Vb5s', 'degen-goblin', 86, 'Rare', 'Your portfolio is a zoo with no zookeeper.', 401, '2026-10-16'],
  ['Zr9c…Ga6h', 'nft-hoarder', 66, 'Epic', 'You see a mint button the way moths see a lamp.', 377, '2026-10-10'],
  ['Pq3d…Hk0n', 'speedrunner', 97, 'Legendary', 'Higher TPS than most chains. Not a compliment.', 344, '2026-10-17'],
  ['Ux7f…Cs4t', 'diamond-hands', 22, 'Rare', 'Patience or amnesia? Boo cannot tell.', 290, '2026-10-09'],
]

export const DEMO_GALLERY: GalleryItem[] = SEEDS.map(([w, a, s, r, roast, laughs, date], i) => ({
  id: `demo-${i}`,
  walletShort: w,
  archetypeId: a,
  degenScore: s,
  rarity: r,
  roast,
  laughs,
  mintedAt: `${date}T12:00:00.000Z`,
  explorerUrl: null,
  isDemo: true,
}))

const VALUES: Record<LeaderboardCategory, (g: GalleryItem, i: number) => [number, string]> = {
  degen: (g) => [g.degenScore, `${g.degenScore} degen`],
  active: (g, i) => {
    const v = Math.round(g.degenScore * 9.3 + (i % 4) * 37)
    return [v, `${v.toLocaleString('en-US')} tx`]
  },
  collector: (g, i) => {
    const v = g.archetypeId === 'nft-hoarder' ? 140 - i * 3 : Math.round(g.degenScore / 3)
    return [v, `${v} NFTs`]
  },
  chaotic: (g) => {
    const v = Math.round(g.degenScore * 0.6 + g.laughs / 40)
    return [v, `${v} chaos`]
  },
}

export function demoLeaderboard(category: LeaderboardCategory): LeaderboardEntry[] {
  return DEMO_GALLERY.map((g, i) => {
    const [value, valueLabel] = VALUES[category](g, i)
    return { walletShort: g.walletShort, archetypeId: g.archetypeId, value, valueLabel, isDemo: true, rank: 0 }
  })
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
    .map((e, i) => ({ ...e, rank: i + 1 }))
}
