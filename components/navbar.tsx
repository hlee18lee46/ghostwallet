'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Ghost } from 'lucide-react'
import { ConnectButton } from '@/components/wallet/connect-button'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/chat', label: 'Chat' },
  { href: '/my-ghost', label: 'My Ghost' },
]

export function Navbar() {
  const pathname = usePathname()
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Ghost className="size-5" />
          </span>
          GhostWallet
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href)
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground',
                  active && 'bg-muted text-foreground',
                )}
              >
                {l.label}
              </Link>
            )
          })}
        </nav>
        <ConnectButton />
      </div>
      <nav aria-label="Mobile" className="flex justify-around border-t px-2 py-1.5 md:hidden">
        {LINKS.map((l) => {
          const active = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href)
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground',
                active && 'bg-muted text-foreground',
              )}
            >
              {l.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
