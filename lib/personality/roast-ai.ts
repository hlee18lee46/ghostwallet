import 'server-only'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import type { PersonalityResult, WalletMetrics } from '@/lib/types'

const MODEL = 'openai/gpt-5.4-mini'

const roastSchema = z.object({
  roasts: z.array(z.string().min(8).max(160)).length(3),
  shareQuote: z.string().min(8).max(100),
})

const INSTRUCTIONS = `You are Boo, a cute, mischievous ghost who roasts Solana wallets.
Rules:
- Funny, playful, light-hearted. Never cruel, never insulting the person's identity, appearance, or intelligence in a hurtful way.
- No profanity, no slurs, no sexual content, no financial advice, no shilling tokens.
- Each roast is ONE sentence, max 140 characters, and must reference at least one of the provided numbers.
- Only use the numbers given. Never invent amounts, profits, losses, or token names.
- The shareQuote is a short first-person line the user would post (max 90 characters).`

/** Only numeric facts and known symbols reach the model — no free-text from chain data. */
function factsFor(m: WalletMetrics, p: PersonalityResult) {
  return {
    archetype: p.name,
    degenScore: p.degenScore,
    coverage: m.coverage,
    transactionsSampled: m.sampleSize,
    swaps: m.coverage === 'enhanced' ? m.swaps : 'unknown',
    buys: m.coverage === 'enhanced' ? m.buys : 'unknown',
    sells: m.coverage === 'enhanced' ? m.sells : 'unknown',
    nftBuysAndMints: m.coverage === 'enhanced' ? m.nftPurchases + m.nftMints : 'unknown',
    distinctTokens: m.coverage === 'enhanced' ? m.distinctTokens : 'unknown',
    topTokenSymbols: m.topTokens.map((t) => t.symbol).filter((s) => /^[A-Za-z0-9]{2,10}$/.test(s)),
    failedTransactions: m.failedTransactions,
    feesPaidSol: Number(m.feesPaidSol.toFixed(5)),
    estimatedVolumeUsd: m.estimatedVolumeUsd ?? 'unknown',
    walletAgeDays: m.walletAgeDays == null ? 'unknown' : `${m.walletAgeDays}${m.walletAgeIsLowerBound ? '+' : ''}`,
    activeDays: m.activeDays,
    txPerActiveDay: m.txPerActiveDay,
  }
}

export async function enhanceWithAiRoasts(
  m: WalletMetrics,
  p: PersonalityResult,
  seed = 0,
): Promise<PersonalityResult> {
  try {
    const { output } = await generateText({
      model: MODEL,
      instructions: INSTRUCTIONS,
      output: Output.object({ schema: roastSchema }),
      prompt: `Roast this wallet (variation #${seed}). Facts:\n${JSON.stringify(factsFor(m, p), null, 2)}`,
      abortSignal: AbortSignal.timeout(12_000),
    })
    return {
      ...p,
      roasts: output.roasts,
      roastOfTheDay: output.roasts[0],
      shareQuote: output.shareQuote,
      roastSource: 'ai',
    }
  } catch (error) {
    console.error('[roast] AI roast failed, using templates:', error instanceof Error ? error.message : error)
    return p
  }
}
