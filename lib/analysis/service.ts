import 'server-only'
import type { DemoPersonaId, PersonalityResult, WalletMetrics } from '@/lib/types'
import { DEMO_PERSONAS } from '@/lib/demo/personas'
import { classifyWallet } from '@/lib/personality/classify'
import { enhanceWithAiRoasts } from '@/lib/personality/roast-ai'
import { analyzeWallet } from './index'

export type AnalysisResponse = { metrics: WalletMetrics; personality: PersonalityResult }

const TTL_MS = 10 * 60_000
const cache = new Map<string, { at: number; metrics: WalletMetrics }>()

async function getMetrics(address: string): Promise<WalletMetrics> {
  const hit = cache.get(address)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.metrics
  const metrics = await analyzeWallet(address)
  cache.set(address, { at: Date.now(), metrics })
  if (cache.size > 500) cache.delete(cache.keys().next().value as string)
  return metrics
}

export async function runAnalysis(
  target: { address: string } | { demo: DemoPersonaId },
  variant = 0,
): Promise<AnalysisResponse> {
  const metrics =
    'demo' in target
      ? { ...DEMO_PERSONAS[target.demo].metrics, analyzedAt: new Date().toISOString() }
      : await getMetrics(target.address)

  const base = classifyWallet(metrics, variant)
  const personality = await enhanceWithAiRoasts(metrics, base, variant)
  return { metrics, personality }
}
