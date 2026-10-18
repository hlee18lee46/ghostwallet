import { PublicKey } from '@solana/web3.js'

const BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

export function isValidSolanaAddress(value: string): boolean {
  const trimmed = value.trim()
  if (!BASE58_RE.test(trimmed)) return false
  try {
    return new PublicKey(trimmed).toBytes().length === 32
  } catch {
    return false
  }
}

export function shortenAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 3) return address
  return `${address.slice(0, chars)}…${address.slice(-chars)}`
}

export function explorerUrl(
  kind: 'address' | 'tx',
  value: string,
  cluster: 'devnet' | 'mainnet-beta' = 'mainnet-beta',
) {
  const suffix = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`
  return `https://explorer.solana.com/${kind}/${value}${suffix}`
}
