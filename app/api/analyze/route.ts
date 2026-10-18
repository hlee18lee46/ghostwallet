import { NextResponse } from 'next/server'
import { z } from 'zod'
import { runAnalysis } from '@/lib/analysis/service'
import { clientKey, rateLimit } from '@/lib/rate-limit'
import { isValidSolanaAddress } from '@/lib/solana/address'

export const maxDuration = 60

const bodySchema = z.union([
  z.object({ address: z.string().trim().min(32).max(44), variant: z.number().int().min(0).max(99).optional() }),
  z.object({ demo: z.enum(['degen', 'diamond', 'hoarder']), variant: z.number().int().min(0).max(99).optional() }),
])

export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request, 'analyze'), 12, 60_000)
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Boo needs a breather. Try again in ${limit.retryAfter}s.` },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    )
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Send a Solana wallet address or a demo persona.' }, { status: 400 })
  }

  const body = parsed.data
  if ('address' in body && !isValidSolanaAddress(body.address)) {
    return NextResponse.json({ error: "That doesn't look like a valid Solana address." }, { status: 400 })
  }

  try {
    const target = 'address' in body ? { address: body.address } : { demo: body.demo }
    const result = await runAnalysis(target, body.variant ?? 0)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[analyze] failed:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: 'Boo could not reach the Solana network right now. Please try again in a moment.' },
      { status: 502 },
    )
  }
}
