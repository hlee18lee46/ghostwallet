
import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  chatWithBoo,
  type BooMessage,
} from '@/lib/backboard/chat'

export const runtime = 'nodejs'

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(3000),
})

const requestSchema = z.object({
  message: z.string().trim().min(1).max(1000),
  history: z.array(messageSchema).max(10).default([]),
})

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(
      await request.json(),
    )

    const result = await chatWithBoo(
      body.message,
      body.history as BooMessage[],
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Boo Chat] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid chat request' },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        error: 'Boo is temporarily unavailable',
        ...(process.env.NODE_ENV === 'development'
          ? {
              details:
                error instanceof Error
                  ? error.message
                  : 'Unknown error',
            }
          : {}),
      },
      { status: 500 },
    )
  }
}
