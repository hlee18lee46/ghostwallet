'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { ArrowRight, Wallet } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { isValidSolanaAddress } from '@/lib/solana/address'

export function WalletInput() {
  const router = useRouter()
  const { publicKey } = useWallet()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit(address: string) {
    const trimmed = address.trim()
    if (!isValidSolanaAddress(trimmed)) {
      setError("That doesn't look like a Solana address. They're 32–44 characters of base58.")
      return
    }
    setError(null)
    router.push(`/analyze?address=${encodeURIComponent(trimmed)}`)
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit(value)
        }}
        className="card-3d flex flex-col gap-2 rounded-3xl border bg-card p-2 sm:flex-row"
      >
        <label htmlFor="wallet-address" className="sr-only">
          Solana wallet address
        </label>
        <input
          id="wallet-address"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            if (error) setError(null)
          }}
          placeholder="Paste any Solana wallet address"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'wallet-error' : undefined}
          className="h-14 min-w-0 flex-1 rounded-2xl bg-transparent px-4 text-base outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="btn-3d flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-6 font-display text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Analyze My Wallet
          <ArrowRight className="size-5" />
        </button>
      </form>
      {error && (
        <p id="wallet-error" role="alert" className="px-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {publicKey && (
        <button
          type="button"
          onClick={() => submit(publicKey.toBase58())}
          className="inline-flex items-center gap-2 self-start px-2 text-sm font-semibold text-accent hover:underline"
        >
          <Wallet className="size-4" />
          Use my connected wallet
        </button>
      )}
    </div>
  )
}
