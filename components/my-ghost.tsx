'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { AnalyzeView } from '@/components/analyze/analyze-view'
import { Boo } from '@/components/boo'
import { ConnectButton } from '@/components/wallet/connect-button'

export function MyGhost() {
  const { publicKey, connecting } = useWallet()

  if (publicKey) return <AnalyzeView key={publicKey.toBase58()} target={{ address: publicKey.toBase58() }} />

  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-20 text-center">
      <Boo expression="happy" float className="w-52" />
      <h1 className="text-balance text-4xl font-bold">Connect to meet your ghost</h1>
      <p className="leading-relaxed text-muted-foreground">
        Boo only reads public on-chain history. Connecting never asks you to sign a transaction.
      </p>
      <ConnectButton className="h-12 px-6" />
      {connecting && <p className="text-sm text-muted-foreground">Waiting for your wallet…</p>}
    </section>
  )
}
