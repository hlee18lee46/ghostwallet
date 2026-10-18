import { NextResponse } from 'next/server'
import { demoLeaderboard } from '@/lib/demo/community'
import type { LeaderboardCategory } from '@/lib/types'

const CATEGORIES: LeaderboardCategory[] = ['degen', 'active', 'collector', 'chaotic']

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get('category')
  const category = CATEGORIES.includes(raw as LeaderboardCategory) ? (raw as LeaderboardCategory) : 'degen'
  return NextResponse.json({ category, entries: demoLeaderboard(category), isDemo: true })
}
