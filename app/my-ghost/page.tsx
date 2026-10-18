import type { Metadata } from 'next'
import { MyGhost } from '@/components/my-ghost'

export const metadata: Metadata = {
  title: 'My Ghost',
  description: 'Connect your Solana wallet to meet the ghost that lives inside it.',
}

export default function MyGhostPage() {
  return <MyGhost />
}
