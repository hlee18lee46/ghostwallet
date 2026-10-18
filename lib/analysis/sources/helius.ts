import 'server-only'
import type { NormalizedTx, TxKind } from '../engine'

type HeliusTx = {
  signature: string
  timestamp?: number
  type?: string
  fee?: number
  feePayer?: string
  description?: string
  transactionError?: unknown
  nativeTransfers?: { fromUserAccount?: string; toUserAccount?: string; amount?: number }[]
  tokenTransfers?: {
    fromUserAccount?: string
    toUserAccount?: string
    mint?: string
    tokenAmount?: number
  }[]
  events?: { nft?: { buyer?: string; seller?: string; type?: string } }
}

const PAGE_SIZE = 100

function mapKind(tx: HeliusTx, address: string): TxKind {
  const type = tx.type ?? ''
  if (type === 'SWAP' || type.startsWith('SWAP')) return 'swap'
  if (type === 'NFT_MINT' || type === 'COMPRESSED_NFT_MINT') return 'nft_mint'
  if (type === 'NFT_SALE' || type === 'NFT_GLOBAL_BID_FILLED' || type === 'NFT_BID') {
    const nft = tx.events?.nft
    if (nft?.buyer === address) return 'nft_purchase'
    if (nft?.seller === address) return 'nft_sale'
    return 'other'
  }
  if (type === 'TRANSFER') return 'transfer'
  return 'other'
}

function normalize(tx: HeliusTx, address: string): NormalizedTx {
  let solIn = 0
  let solOut = 0
  for (const n of tx.nativeTransfers ?? []) {
    const amt = (n.amount ?? 0) / 1e9
    if (n.toUserAccount === address) solIn += amt
    if (n.fromUserAccount === address) solOut += amt
  }

  const tokens: NormalizedTx['tokens'] = []
  for (const t of tx.tokenTransfers ?? []) {
    if (!t.mint || !t.tokenAmount) continue
    if (t.toUserAccount === address) tokens.push({ mint: t.mint, amount: t.tokenAmount, direction: 'in' })
    else if (t.fromUserAccount === address)
      tokens.push({ mint: t.mint, amount: t.tokenAmount, direction: 'out' })
  }

  return {
    signature: tx.signature,
    timestamp: tx.timestamp ?? null,
    failed: Boolean(tx.transactionError),
    feeLamports: tx.fee ?? null,
    feePaidByWallet: tx.feePayer === address,
    kind: mapKind(tx, address),
    solIn,
    solOut,
    tokens,
    description: tx.description || null,
  }
}

export async function fetchHeliusTransactions(address: string, apiKey: string, maxTx: number) {
  const out: NormalizedTx[] = []
  let before: string | undefined
  let hitLimit = false

  while (out.length < maxTx) {
    const url = new URL(`https://api.helius.xyz/v0/addresses/${address}/transactions`)
    url.searchParams.set('api-key', apiKey)
    url.searchParams.set('limit', String(PAGE_SIZE))
    if (before) url.searchParams.set('before', before)

    const res = await fetch(url, { signal: AbortSignal.timeout(10_000), cache: 'no-store' })
    if (!res.ok) {
      if (out.length > 0) break
      throw new Error(`Helius request failed (${res.status})`)
    }
    const page = (await res.json()) as HeliusTx[]
    if (!Array.isArray(page) || page.length === 0) break

    for (const tx of page) out.push(normalize(tx, address))
    before = page[page.length - 1].signature
    if (page.length < PAGE_SIZE) break
    if (out.length >= maxTx) hitLimit = true
  }

  return { txs: out.slice(0, maxTx), hitLimit }
}
