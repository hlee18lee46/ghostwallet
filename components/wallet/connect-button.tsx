'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import { ExternalLink, LogOut, Wallet } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { shortenAddress } from '@/lib/solana/address'
import { cn } from '@/lib/utils'

export function ConnectButton({ className }: { className?: string }) {
  const { wallets, select, publicKey, disconnect, connecting, wallet } = useWallet()
  const [open, setOpen] = useState(false)

  const installed = wallets.filter(
    (w) => w.readyState === WalletReadyState.Installed || w.readyState === WalletReadyState.Loadable,
  )

  if (publicKey) {
    const address = publicKey.toBase58()
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <Link
          href="/my-ghost"
          className="flex h-10 items-center gap-2 rounded-full border bg-muted px-4 text-sm font-semibold transition-colors hover:bg-muted/70"
        >
          <span className="size-2 rounded-full bg-success" aria-hidden />
          {shortenAddress(address)}
        </Link>
        <button
          type="button"
          onClick={() => disconnect()}
          aria-label="Disconnect wallet"
          className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'btn-3d flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90',
          className,
        )}
      >
        <Wallet className="size-4" />
        {connecting ? 'Connecting…' : 'Connect'}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <div className="flex flex-col gap-1.5">
            <DialogTitle>Connect a wallet</DialogTitle>
            <DialogDescription>
              Boo only reads your public address. Connecting never asks for a signature or moves funds.
            </DialogDescription>
          </div>

          {installed.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {installed.map((w) => (
                <li key={w.adapter.name}>
                  <button
                    type="button"
                    onClick={() => {
                      select(w.adapter.name)
                      setOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-2xl border bg-muted/50 p-3 text-left font-semibold transition-colors hover:border-primary/50 hover:bg-muted',
                      wallet?.adapter.name === w.adapter.name && 'border-primary',
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- wallet icons are data URIs */}
                    <img src={w.adapter.icon || '/placeholder.svg'} alt="" className="size-8 rounded-lg" />
                    {w.adapter.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col gap-3 rounded-2xl border bg-muted/40 p-4 text-sm leading-relaxed">
              <p>No Solana wallet detected in this browser. Install one, then refresh:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  ['Phantom', 'https://phantom.com/download'],
                  ['Solflare', 'https://solflare.com/download'],
                  ['Backpack', 'https://backpack.app/download'],
                ].map(([name, href]) => (
                  <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-semibold hover:bg-muted"
                  >
                    {name}
                    <ExternalLink className="size-3.5" />
                  </a>
                ))}
              </div>
              <p className="text-muted-foreground">
                {"Or skip it entirely — you can paste any public address on the home page."}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
