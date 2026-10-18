
import type { Metadata } from 'next'
import { Pool } from 'pg'
import { TabLinks } from '@/components/tab-links'

export const metadata: Metadata = {
  title: 'Explore ghosts',
  description: 'Browse real minted GhostWallet personalities.',
}

export const dynamic = 'force-dynamic'

type NFT = {
  mint_address: string
  owner_wallet: string
  name: string | null
  description: string | null
  image_url: string | null
  metadata_uri: string | null
  transaction_signature: string | null
  pet_type: string | null
  created_at: Date | string
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function getGallery(): Promise<NFT[]> {
  const result = await pool.query<NFT>(`
    SELECT
      mint_address,
      owner_wallet,
      name,
      description,
      image_url,
      metadata_uri,
      transaction_signature,
      pet_type,
      created_at
    FROM nft_gallery
    WHERE is_shared = TRUE
    ORDER BY created_at DESC
    LIMIT 100
  `)

  return result.rows
}

function shortenWallet(address: string) {
  return `${address.slice(0, 5)}...${address.slice(-5)}`
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>
}) {
  const sort =
    (await searchParams).sort === 'recent'
      ? 'recent'
      : 'trending'

  let items: NFT[] = []
  let error: string | null = null

  try {
    items = await getGallery()
  } catch (err) {
    console.error('Gallery database error:', err)
    error = 'Unable to load minted ghosts right now.'
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12">
      <header className="flex flex-col gap-3">
        <h1 className="text-balance text-5xl font-bold">
          The haunted gallery
        </h1>
        <p className="max-w-2xl leading-relaxed text-muted-foreground">
          Real ghosts minted on Solana. Every wallet has a story.
        </p>
      </header>

      <TabLinks
        label="Sort gallery"
        active={sort}
        tabs={[
          { id: 'trending', label: 'Funniest', href: '/explore' },
          { id: 'recent', label: 'Recent', href: '/explore?sort=recent' },
        ]}
      />

      {error ? (
        <p className="rounded-xl border p-6 text-muted-foreground">
          {error}
        </p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center">
          <h2 className="text-2xl font-bold">
            No ghosts have appeared yet 👻
          </h2>
          <p className="mt-2 text-muted-foreground">
            Mint your first GhostWallet NFT to haunt this gallery.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((nft) => (
            <li
              key={nft.mint_address}
              className="overflow-hidden rounded-2xl border bg-card"
            >
              {nft.image_url ? (
                <img
                  src={nft.image_url}
                  alt={nft.name || 'Ghost NFT'}
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center bg-muted text-7xl">
                  👻
                </div>
              )}

              <div className="flex flex-col gap-3 p-5">
                <h2 className="text-xl font-bold">
                  {nft.name || 'Unnamed Ghost'}
                </h2>

                {nft.pet_type && (
                  <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {nft.pet_type}
                  </span>
                )}

                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {nft.description || 'A mysterious wallet ghost.'}
                </p>

                <p className="text-xs text-muted-foreground">
                  Owner: {shortenWallet(nft.owner_wallet)}
                </p>

                <a
                  href={`https://explorer.solana.com/address/${encodeURIComponent(nft.mint_address)}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  View NFT on Solana ↗
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
