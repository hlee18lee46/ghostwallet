import 'server-only'
import type { NormalizedTx } from '../engine'

export function rpcUrl() {
  if (process.env.SOLANA_RPC_URL) return process.env.SOLANA_RPC_URL
  if (process.env.HELIUS_API_KEY)
    return `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
  return 'https://api.mainnet-beta.solana.com'
}

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(rpcUrl(), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: AbortSignal.timeout(10_000),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Solana RPC ${method} failed (${res.status})`)
  const json = (await res.json()) as { result?: T; error?: { message: string } }
  if (json.error) throw new Error(`Solana RPC ${method}: ${json.error.message}`)
  return json.result as T
}

type SignatureInfo = { signature: string; blockTime: number | null; err: unknown }

export async function fetchSignatures(address: string, maxTx: number) {
  const sigs = await rpc<SignatureInfo[]>('getSignaturesForAddress', [
    address,
    { limit: Math.min(maxTx, 1000) },
  ])
  const txs: NormalizedTx[] = sigs.map((s) => ({
    signature: s.signature,
    timestamp: s.blockTime,
    failed: s.err != null,
    feeLamports: null,
    feePaidByWallet: false,
    kind: null,
    solIn: 0,
    solOut: 0,
    tokens: [],
    description: null,
  }))
  return { txs, hitLimit: sigs.length >= maxTx }
}

export async function fetchSolBalance(address: string): Promise<number | null> {
  try {
    const result = await rpc<{ value: number }>('getBalance', [address])
    return result.value / 1e9
  } catch {
    return null
  }
}
