import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { ARCHETYPES } from '@/lib/personality/archetypes'
import { HEX, RARITY_COLOR } from '@/lib/theme'
import type { ArchetypeId, Expression, Rarity } from '@/lib/types'

const RARITIES: Rarity[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']
const booCache = new Map<Expression, string>()

async function booDataUrl(expression: Expression) {
  const cached = booCache.get(expression)
  if (cached) return cached
  const buf = await readFile(join(process.cwd(), 'public', 'boo', `${expression}.png`))
  const url = `data:image/png;base64,${buf.toString('base64')}`
  booCache.set(expression, url)
  return url
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const archParam = searchParams.get('arch') as ArchetypeId | null
  const archetype = (archParam && ARCHETYPES[archParam]) || ARCHETYPES['degen-goblin']
  const score = Math.max(0, Math.min(100, Number(searchParams.get('score')) || 0))
  const rarityParam = searchParams.get('rarity') as Rarity | null
  const rarity = rarityParam && RARITIES.includes(rarityParam) ? rarityParam : archetype.baseRarity
  const wallet = (searchParams.get('wallet') ?? '').slice(0, 16)
  const roast = (searchParams.get('roast') ?? archetype.shareQuote).slice(0, 160)
  const isDemo = searchParams.get('demo') === '1'

  const color = HEX[archetype.color]
  const rarityColor = HEX[RARITY_COLOR[rarity]]
  const boo = await booDataUrl(archetype.expression)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(135deg, #0b0b16 0%, #1f1446 60%, #0b0b16 100%)',
          color: '#f3f1ff',
          padding: 56,
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flex: 1,
            borderRadius: 40,
            background: '#17172b',
            border: `3px solid ${color}55`,
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', width: 420, alignItems: 'center', justifyContent: 'center', background: `${color}22` }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- satori requires <img> */}
            <img src={boo} width={640} height={349} style={{ objectFit: 'cover', width: 420, height: 520 }} alt="" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 44, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 12, fontSize: 22, fontWeight: 700 }}>
                <div style={{ display: 'flex', padding: '6px 16px', borderRadius: 999, background: rarityColor, color: '#0b0b16' }}>
                  {rarity}
                </div>
                {isDemo && (
                  <div style={{ display: 'flex', padding: '6px 16px', borderRadius: 999, border: '2px solid #a9a6c9', color: '#a9a6c9' }}>
                    Demo
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, color, lineHeight: 1 }}>{archetype.name}</div>
              <div style={{ display: 'flex', fontSize: 30, lineHeight: 1.35, color: '#f3f1ff' }}>{`"${roast}"`}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', fontSize: 22, color: '#a9a6c9' }}>Degen Score</div>
                <div style={{ display: 'flex', fontSize: 88, fontWeight: 800, lineHeight: 1 }}>{score}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: 24, color: '#a9a6c9' }}>
                <div style={{ display: 'flex' }}>{wallet}</div>
                <div style={{ display: 'flex', fontWeight: 700, color: '#f3f1ff' }}>ghostwallet</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
