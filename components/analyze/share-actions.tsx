'use client'

import { Check, Download, Link2 } from 'lucide-react'
import { useState } from 'react'
import { shareCardPath, tweetText } from '@/lib/share'
import type { PersonalityResult, WalletMetrics } from '@/lib/types'

function XLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-current">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

export function ShareActions({ metrics, personality }: { metrics: WalletMetrics; personality: PersonalityResult }) {
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  function pageUrl() {
    const q = metrics.isDemo ? `demo=${new URLSearchParams(window.location.search).get('demo')}` : `address=${metrics.address}`
    return `${window.location.origin}/analyze?${q}`
  }

  async function copyLink() {
    await navigator.clipboard.writeText(pageUrl())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareOnX() {
    const url = new URL('https://x.com/intent/post')
    url.searchParams.set('text', tweetText(personality))
    url.searchParams.set('url', pageUrl())
    window.open(url.toString(), '_blank', 'noopener,noreferrer')
  }

  async function download() {
    setDownloading(true)
    try {
      const res = await fetch(shareCardPath(metrics, personality))
      const blob = await res.blob()
      const href = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = href
      a.download = `ghostwallet-${personality.archetypeId}.png`
      a.click()
      URL.revokeObjectURL(href)
    } finally {
      setDownloading(false)
    }
  }

  const btn =
    'flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border bg-card px-4 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-60'

  return (
    <div className="flex gap-2">
      <button type="button" onClick={shareOnX} className={btn}>
        <XLogo />
        Share
      </button>
      <button type="button" onClick={copyLink} className={btn} aria-live="polite">
        {copied ? <Check className="size-4 text-success" /> : <Link2 className="size-4" />}
        {copied ? 'Copied' : 'Copy link'}
      </button>
      <button type="button" onClick={download} disabled={downloading} className={btn}>
        <Download className="size-4" />
        {downloading ? 'Saving…' : 'PNG'}
      </button>
    </div>
  )
}
