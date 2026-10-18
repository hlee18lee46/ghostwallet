'use client'

import Link from 'next/link'
import { useState } from 'react'
import useSWR from 'swr'
import { Boo } from '@/components/boo'
import type { AnalysisResponse } from '@/lib/analysis/service'
import type { DemoPersonaId } from '@/lib/types'
import { Results } from './results'
import { ScanningScreen } from './scanning-screen'

export type AnalyzeTarget = { address: string } | { demo: DemoPersonaId }

async function analyze([, target, variant]: [string, AnalyzeTarget, number]): Promise<AnalysisResponse> {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...target, variant }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error ?? 'Something spooky happened. Please try again.')
  return json
}

export function AnalyzeView({ target }: { target: AnalyzeTarget }) {
  const [variant, setVariant] = useState(0)
  const { data, error, isLoading, isValidating, mutate } = useSWR(['analyze', target, variant] as const, analyze, {
    keepPreviousData: true,
  })

  if (!data && isLoading) return <ScanningScreen isDemo={'demo' in target} />

  if (!data && error) {
    return (
      <section className="mx-auto flex max-w-xl flex-col items-center gap-5 px-4 py-20 text-center">
        <Boo expression="crying" className="w-44" />
        <h1 className="text-balance text-4xl font-bold">Boo got lost in the blockchain</h1>
        <p role="alert" className="leading-relaxed text-muted-foreground">
          {error.message}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => mutate()}
            className="btn-3d h-12 rounded-2xl bg-primary px-6 font-semibold text-primary-foreground"
          >
            Try again
          </button>
          <Link href="/" className="flex h-12 items-center rounded-2xl border px-6 font-semibold hover:bg-muted">
            Back home
          </Link>
        </div>
      </section>
    )
  }

  if (!data) return null

  return (
    <Results
      data={data}
      rerolling={isValidating}
      rerollError={error?.message ?? null}
      onRoastAgain={() => setVariant((v) => (v + 1) % 100)}
    />
  )
}
