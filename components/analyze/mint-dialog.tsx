
'use client'

import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { VersionedTransaction } from '@solana/web3.js'
import { ExternalLink, Gem, Info } from 'lucide-react'
import { useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ConnectButton } from '@/components/wallet/connect-button'
import { shareCardPath } from '@/lib/share'
import type { PersonalityResult, WalletMetrics } from '@/lib/types'

type MintStatus =
  | 'idle'
  | 'uploading'
  | 'preparing'
  | 'signing'
  | 'confirming'
  | 'saving'
  | 'success'
  | 'error'

async function postJSON(
  url: string,
  payload: Record<string, unknown>,
) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      typeof result.error === 'string'
        ? result.error
        : `Request failed (${response.status})`,
    )
  }

  return result
}

export function MintDialog({
  metrics,
  personality: p,
}: {
  metrics: WalletMetrics
  personality: PersonalityResult
}) {
  const { publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()

  const [status, setStatus] = useState<MintStatus>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [signature, setSignature] = useState<string | null>(null)
  const [assetAddress, setAssetAddress] = useState<string | null>(null)

  const attributes = [
    ['Personality', p.name],
    ['Rarity', p.rarity],
    ['Degen Score', String(p.degenScore)],
    ['Personality Score', String(p.personalityScore)],
    ['Achievements', String(p.achievements.length)],
  ]

  const busy = [
    'uploading',
    'preparing',
    'signing',
    'confirming',
    'saving',
  ].includes(status)

  const statusLabels: Record<MintStatus, string> = {
    idle: 'Confirm mint',
    uploading: 'Uploading metadata…',
    preparing: 'Preparing NFT…',
    signing: 'Approve in Phantom…',
    confirming: 'Confirming on Solana…',
    saving: 'Saving to gallery…',
    success: 'Minted successfully!',
    error: 'Try again',
  }

  async function mint() {
    if (!publicKey || busy || status === 'success') return

    setMessage(null)
    setSignature(null)
    setAssetAddress(null)

    let submittedSignature: string | null = null
    let transactionConfirmed = false

    try {
      // 1. Resolve the ghost image URL.
      const previewPath = shareCardPath(metrics, p)

      if (!previewPath) {
        throw new Error('Ghost image is unavailable.')
      }

setStatus('uploading')

// Upload the generated ghost image to IPFS.
const uploadedImage = await postJSON('/api/nft/image', {
  imagePath: previewPath,
})

if (typeof uploadedImage.imageUrl !== 'string') {
  throw new Error('Pinata did not return an image URL.')
}

const imageUrl = uploadedImage.imageUrl

      const nftName = `GhostWallet: ${p.name}`.slice(0, 32)

      const metadata = await postJSON('/api/nft/metadata', {
        name: nftName,
        description:
          `A ${p.rarity} GhostWallet personality NFT. ` +
          `Degen Score: ${p.degenScore}.`,
        image: imageUrl,
        attributes: attributes.map(([trait_type, value]) => ({
          trait_type,
          value,
        })),
      })

      if (typeof metadata.metadataUri !== 'string') {
        throw new Error('Metadata upload returned no URI.')
      }

      // 3. Prepare the partially signed Metaplex transaction.
      setStatus('preparing')

      const prepared = await postJSON('/api/nft/prepare', {
        walletAddress: publicKey.toBase58(),
        name: nftName,
        metadataUri: metadata.metadataUri,
      })

      if (
        typeof prepared.transaction !== 'string' ||
        typeof prepared.assetAddress !== 'string' ||
        typeof prepared.lastValidBlockHeight !== 'number'
      ) {
        throw new Error('Mint preparation returned invalid data.')
      }

      setAssetAddress(prepared.assetAddress)

      const bytes = Uint8Array.from(
        atob(prepared.transaction),
        (char) => char.charCodeAt(0),
      )

      const transaction = VersionedTransaction.deserialize(bytes)

      // 4. Phantom signs and submits the transaction.
      setStatus('signing')

      const txSignature = await sendTransaction(
        transaction,
        connection,
        {
          skipPreflight: false,
          maxRetries: 3,
        },
      )

      submittedSignature = txSignature
      setSignature(txSignature)

      // 5. Confirm the mint on Solana.
      setStatus('confirming')

      const confirmation = await connection.confirmTransaction(
        {
          signature: txSignature,
          blockhash: transaction.message.recentBlockhash,
          lastValidBlockHeight: prepared.lastValidBlockHeight,
        },
        'confirmed',
      )

      if (confirmation.value.err) {
        throw new Error('Solana mint transaction failed.')
      }

      transactionConfirmed = true

      // 6. Save the confirmed NFT in the existing gallery.
      setStatus('saving')

      await postJSON('/api/gallery', {
        mintAddress: prepared.assetAddress,
        ownerWallet: publicKey.toBase58(),
        transactionSignature: txSignature,
        name: nftName,
        description:
          `A ${p.rarity} GhostWallet personality NFT.`,
        imageUrl,
        metadataUri: metadata.metadataUri,
        personality: p.name,
        mood: p.rarity,
        degenScore: p.degenScore,
        isShared: true,
      })

      setStatus('success')
      setMessage('Your ghost NFT was minted and saved to the gallery!')
    } catch (error) {
      console.error('Ghost NFT mint error:', error)

      setStatus('error')

      const reason =
        error instanceof Error
          ? error.message
          : 'NFT minting failed.'

      if (transactionConfirmed) {
        setMessage(
          `Your NFT was minted, but saving it to the gallery failed. ` +
          `Do not mint again. ${reason}`,
        )
      } else if (submittedSignature) {
        setMessage(
          `Your transaction was submitted but its final status is ` +
          `not yet confirmed. Check Solana Explorer before retrying. ${reason}`,
        )
      } else {
        setMessage(reason)
      }
    }
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open && !busy && status !== 'success') {
          setStatus('idle')
          setMessage(null)
        }
      }}
    >
      <DialogTrigger className="btn-3d flex h-14 items-center justify-center gap-2 rounded-2xl bg-accent font-display text-lg font-semibold text-accent-foreground transition-colors hover:bg-accent/90">
        <Gem className="size-5" />
        Mint My Ghost
      </DialogTrigger>

      <DialogContent>
        <div className="flex flex-col gap-1.5 pr-8">
          <DialogTitle>Mint your Ghost</DialogTitle>
          <DialogDescription>
            A one-of-one personality collectible on Solana devnet.
          </DialogDescription>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={shareCardPath(metrics, p) || '/placeholder.svg'}
          alt={`NFT preview: ${p.name} with a Degen Score of ${p.degenScore}`}
          width={1200}
          height={630}
          className="aspect-[1200/630] w-full rounded-2xl border bg-muted"
        />

        <dl className="grid grid-cols-2 gap-2 text-sm">
          {attributes.map(([key, value]) => (
            <div
              key={key}
              className="rounded-xl bg-muted/50 px-3 py-2"
            >
              <dt className="text-xs text-muted-foreground">
                {key}
              </dt>
              <dd className="font-semibold">{value}</dd>
            </div>
          ))}
        </dl>

        {metrics.isDemo ? (
          <p className="flex gap-2 rounded-2xl border border-dashed p-4 text-sm leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            Demo wallets can be previewed but not minted.
          </p>
        ) : !publicKey ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Connect the wallet that should receive the NFT.
            </p>
            <ConnectButton className="h-12 justify-center" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={mint}
              disabled={busy || status === 'success'}
              className="btn-3d h-12 rounded-2xl bg-accent font-display text-lg font-semibold text-accent-foreground disabled:opacity-60"
            >
              {statusLabels[status]}
            </button>

            {message && (
              <p
                role={status === 'error' ? 'alert' : 'status'}
                className="flex gap-2 rounded-2xl bg-muted/60 p-3 text-sm leading-relaxed"
              >
                <Info className="mt-0.5 size-4 shrink-0" />
                {message}
              </p>
            )}

            {signature && (
              <a
                href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm underline"
              >
                View transaction
                <ExternalLink className="size-4" />
              </a>
            )}

            {assetAddress && (
              <a
                href={`https://explorer.solana.com/address/${assetAddress}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm underline"
              >
                View ghost NFT
                <ExternalLink className="size-4" />
              </a>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
