import type { Metadata } from 'next'
import { AnalyzeView } from '@/components/analyze/analyze-view'
import { Boo } from '@/components/boo'
import { WalletInput } from '@/components/home/wallet-input'
import { isDemoPersona } from '@/lib/demo/personas'
import { isValidSolanaAddress } from '@/lib/solana/address'

export const metadata: Metadata = {
  title: 'Wallet analysis',
  description: 'See what personality lives inside a Solana wallet — and what Boo thinks of it.',
}

export default async function AnalyzePage({
  searchParams,
}: {
  searchParams: Promise<{ address?: string; demo?: string }>
}) {
  const { address, demo } = await searchParams

  if (demo && isDemoPersona(demo)) return <AnalyzeView target={{ demo }} />
  if (address && isValidSolanaAddress(address)) return <AnalyzeView target={{ address: address.trim() }} />

  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-20 text-center">
      <Boo expression="shocked" className="w-44" />
      <h1 className="text-balance text-4xl font-bold">
        {address ? "Boo can't read that address" : 'Which wallet should Boo haunt?'}
      </h1>
      <p className="leading-relaxed text-muted-foreground">
        {address
          ? 'Solana addresses are 32–44 base58 characters. Double-check it and try again.'
          : 'Paste a public Solana address to get started.'}
      </p>
      <WalletInput />
    </section>
  )
}
