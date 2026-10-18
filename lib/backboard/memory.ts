
import 'server-only'

import { createHash } from 'node:crypto'
import type {
  PersonalityResult,
  WalletMetrics,
} from '@/lib/types'

const BASE_URL = 'https://app.backboard.io/api'
const TIMEOUT_MS = 10_000
const MAX_HISTORY = 20

export type WalletMemorySnapshot = {
  walletKey: string
  analyzedAt: string
  archetypeId: PersonalityResult['archetypeId']
  personality: string
  degenScore: number
  personalityScore: number
  coverage: WalletMetrics['coverage']
  totalTransactions: number
  sampleSize: number
  swaps: number | null
  failedTransactions: number
  activeDays: number
  feesPaidSol: number
}

export type SavedWalletMemory = {
  memoryId: string
  snapshot: WalletMemorySnapshot
}

type BackboardMemory = {
  id: string
  content: string
  metadata?: Record<string, unknown> | null
  score?: number
}

type MemorySearchResponse = {
  memories?: BackboardMemory[]
}

type MemoryListResponse = {
  memories?: BackboardMemory[]
  total_count?: number
}

type AddMemoryResponse = {
  memory_id?: string
  id?: string
}

function getConfig() {
  const apiKey = process.env.BACKBOARD_API_KEY
  const assistantId = process.env.BACKBOARD_ASSISTANT_ID

  if (!apiKey) {
    throw new Error('BACKBOARD_API_KEY is missing')
  }

  if (!assistantId) {
    throw new Error(
      'BACKBOARD_ASSISTANT_ID is missing',
    )
  }

  return { apiKey, assistantId }
}

/**
 * Hash the wallet address to create a stable
 * lookup key without storing the raw address.
 *
 * This is a pseudonymous identifier, not a
 * secret or an authentication mechanism.
 */
export function walletMemoryKey(
  address: string,
): string {
  const normalized = address.trim()

  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(normalized)) {
    throw new Error('Invalid Solana wallet address')
  }

  return createHash('sha256')
    .update(`ghostwallet:v1:${normalized}`)
    .digest('hex')
}

/**
 * Small typed wrapper around Backboard's
 * Memory REST API.
 */
async function backboardRequest<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    body?: unknown
  } = {},
): Promise<T> {
  const { apiKey } = getConfig()

  const response = await fetch(
    `${BASE_URL}${path}`,
    {
      method: options.method ?? 'GET',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      ...(options.body !== undefined
        ? {
            body: JSON.stringify(options.body),
          }
        : {}),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    },
  )

  if (!response.ok) {
    const errorBody = await response.text()

    console.error('[Backboard] Request failed:', {
      status: response.status,
      path,
      body: errorBody.slice(0, 400),
    })

    throw new Error(
      `Backboard API HTTP ${response.status}`,
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()

  if (!text.trim()) {
    return undefined as T
  }

  return JSON.parse(text) as T
}

/**
 * Convert current analysis into a compact
 * historical snapshot.
 *
 * Do not save private keys, balances,
 * full transaction histories, or user secrets.
 */
export function createWalletSnapshot(
  address: string,
  metrics: WalletMetrics,
  personality: PersonalityResult,
  analyzedAt = new Date().toISOString(),
): WalletMemorySnapshot {
  const date = new Date(analyzedAt)

  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid analysis timestamp')
  }

  const enhanced = metrics.coverage === 'enhanced'

  return {
    walletKey: walletMemoryKey(address),
    analyzedAt: date.toISOString(),

    archetypeId: personality.archetypeId,
    personality: personality.name,

    degenScore: personality.degenScore,
    personalityScore:
      personality.personalityScore,

    coverage: metrics.coverage,

    totalTransactions:
      metrics.totalTransactions,

    sampleSize: metrics.sampleSize,

    swaps: enhanced
      ? metrics.swaps
      : null,

    failedTransactions:
      metrics.failedTransactions,

    activeDays: metrics.activeDays,

    feesPaidSol: Number(
      metrics.feesPaidSol.toFixed(6),
    ),
  }
}

/**
 * The snapshot is stored as JSON inside
 * a Backboard memory.
 *
 * Prefixing the content helps distinguish
 * GhostWallet memories from other data.
 */
function serializeSnapshot(
  snapshot: WalletMemorySnapshot,
): string {
  return [
    'GHOSTWALLET_ANALYSIS_V1',
    JSON.stringify(snapshot),
  ].join('\n')
}

function parseMemory(
  memory: BackboardMemory,
): SavedWalletMemory | null {
  const prefix = 'GHOSTWALLET_ANALYSIS_V1\n'

  if (!memory.content.startsWith(prefix)) {
    return null
  }

  try {
    const raw = JSON.parse(
      memory.content.slice(prefix.length),
    ) as Partial<WalletMemorySnapshot>

    if (
      typeof raw.walletKey !== 'string' ||
      typeof raw.analyzedAt !== 'string' ||
      typeof raw.archetypeId !== 'string' ||
      typeof raw.personality !== 'string' ||
      typeof raw.degenScore !== 'number' ||
      typeof raw.personalityScore !== 'number' ||
      typeof raw.totalTransactions !== 'number' ||
      typeof raw.sampleSize !== 'number' ||
      typeof raw.activeDays !== 'number' ||
      typeof raw.failedTransactions !== 'number' ||
      typeof raw.feesPaidSol !== 'number' ||
      !(
        raw.coverage === 'enhanced' ||
        raw.coverage === 'basic'
      )
    ) {
      return null
    }

    if (
      Number.isNaN(
        new Date(raw.analyzedAt).getTime(),
      )
    ) {
      return null
    }

    return {
      memoryId: memory.id,
      snapshot: raw as WalletMemorySnapshot,
    }
  } catch {
    return null
  }
}

/**
 * Search memories relevant to one wallet.
 *
 * Backboard's semantic search is useful
 * for recall, but it is not an exact-match
 * database query.
 *
 * Always filter by walletKey after retrieval.
 */
export async function searchWalletMemories(
  address: string,
  limit = 10,
): Promise<SavedWalletMemory[]> {
  const { assistantId } = getConfig()

  const key = walletMemoryKey(address)

  const result =
    await backboardRequest<MemorySearchResponse>(
      `/assistants/${encodeURIComponent(assistantId)}/memories/search`,
      {
        method: 'POST',
        body: {
          query:
            `GHOSTWALLET_ANALYSIS_V1 walletKey ${key}`,
          limit: Math.min(
            Math.max(limit * 3, 10),
            100,
          ),
        },
      },
    )

  const matches = (result.memories ?? [])
    .map(parseMemory)
    .filter(
      (item): item is SavedWalletMemory =>
        item !== null &&
        item.snapshot.walletKey === key,
    )

  return matches
    .sort(
      (a, b) =>
        Date.parse(b.snapshot.analyzedAt) -
        Date.parse(a.snapshot.analyzedAt),
    )
    .slice(0, limit)
}

/**
 * Exact wallet history lookup.
 *
 * Lists Backboard memories and filters
 * the wallet key locally.
 *
 * This is more reliable than semantic search
 * when exact previous-analysis records matter.
 *
 * Suitable for a small hackathon prototype.
 * For large-scale production, keep an indexed
 * snapshot history in a conventional database.
 */
export async function listWalletMemories(
  address: string,
  limit = MAX_HISTORY,
): Promise<SavedWalletMemory[]> {
  const { assistantId } = getConfig()
  const key = walletMemoryKey(address)

  const matches: SavedWalletMemory[] = []

  let page = 1
  const pageSize = 100
  const maxPages = 20

  while (page <= maxPages) {
    const result =
      await backboardRequest<MemoryListResponse>(
        `/assistants/${encodeURIComponent(assistantId)}/memories?page=${page}&page_size=${pageSize}`,
      )

    const memories = result.memories ?? []

    for (const memory of memories) {
      const parsed = parseMemory(memory)

      if (
        parsed &&
        parsed.snapshot.walletKey === key
      ) {
        matches.push(parsed)
      }
    }

    if (memories.length < pageSize) {
      break
    }

    page++
  }

  return matches
    .sort(
      (a, b) =>
        Date.parse(b.snapshot.analyzedAt) -
        Date.parse(a.snapshot.analyzedAt),
    )
    .slice(0, limit)
}

/**
 * Retrieve the most recent saved analysis.
 */
export async function getLatestWalletMemory(
  address: string,
): Promise<SavedWalletMemory | null> {
  const history = await listWalletMemories(
    address,
    1,
  )

  return history[0] ?? null
}

/**
 * Save an analysis to Backboard.
 *
 * When the same wallet has an analysis
 * with the exact same timestamp, reuse
 * the existing record.
 *
 * Different analysis timestamps create
 * separate historical snapshots.
 */
export async function saveWalletMemory(
  address: string,
  metrics: WalletMetrics,
  personality: PersonalityResult,
  analyzedAt = new Date().toISOString(),
): Promise<SavedWalletMemory> {
  const { assistantId } = getConfig()

  const snapshot = createWalletSnapshot(
    address,
    metrics,
    personality,
    analyzedAt,
  )

  const existing = await listWalletMemories(
    address,
    MAX_HISTORY,
  )

  const duplicate = existing.find(
    item =>
      item.snapshot.analyzedAt ===
      snapshot.analyzedAt,
  )

  if (duplicate) {
    return duplicate
  }

  const result =
    await backboardRequest<AddMemoryResponse>(
      `/assistants/${encodeURIComponent(assistantId)}/memories`,
      {
        method: 'POST',
        body: {
          content: serializeSnapshot(snapshot),
          metadata: {
            application: 'GhostWallet',
            type: 'wallet-analysis',
            version: 1,
            walletKey: snapshot.walletKey,
            analyzedAt: snapshot.analyzedAt,
            archetypeId: snapshot.archetypeId,
          },
        },
      },
    )

  const memoryId =
    result?.memory_id ?? result?.id

  if (!memoryId) {
    throw new Error(
      'Backboard did not return a memory ID',
    )
  }

  console.log('[Backboard] Wallet memory saved:', {
    memoryId,
    archetype: snapshot.archetypeId,
    degenScore: snapshot.degenScore,
  })

  return {
    memoryId,
    snapshot,
  }
}

/**
 * Delete a saved wallet memory.
 *
 * Call this only after authorizing the
 * requesting user to manage that wallet.
 */
export async function deleteWalletMemory(
  memoryId: string,
): Promise<void> {
  const { assistantId } = getConfig()

  await backboardRequest<void>(
    `/assistants/${encodeURIComponent(assistantId)}/memories/${encodeURIComponent(memoryId)}`,
    {
      method: 'DELETE',
    },
  )
}

/**
 * Prepare a compact history object that
 * Vultr can use to generate Boo's
 * "I remember you!" reaction.
 */
export function buildMemoryComparison(
  previous: SavedWalletMemory | null,
  current: PersonalityResult,
) {
  if (!previous) {
    return {
      returningWallet: false,
      previousPersonality: null,
      previousDegenScore: null,
      currentPersonality: current.name,
      currentDegenScore: current.degenScore,
      degenScoreChange: null,
      personalityChanged: false,
    }
  }

  return {
    returningWallet: true,

    previousPersonality:
      previous.snapshot.personality,

    previousDegenScore:
      previous.snapshot.degenScore,

    previousAnalyzedAt:
      previous.snapshot.analyzedAt,

    currentPersonality:
      current.name,

    currentDegenScore:
      current.degenScore,

    degenScoreChange:
      current.degenScore -
      previous.snapshot.degenScore,

    personalityChanged:
      previous.snapshot.archetypeId !==
      current.archetypeId,
  }
}
