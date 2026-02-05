import * as api from "../polymarket-api.js"
import { isErr } from "../result.js"
import type { GammaEvent, GammaEventMarket } from "../types.js"

export interface ScanArbInput {
  threshold: number
  minOutcomes: number
  minVolume: number
  minDepth: number
}

export interface OutcomePrice {
  question: string
  tokenId: string
  bestAsk: number | null
  bestAskSize: number
}

export interface ArbOpportunity {
  event: { id: string; title: string; slug: string }
  outcomes: OutcomePrice[]
  sumOfAsks: number
  profitMargin: number
  minDepth: number
  outcomesWithNoAsks: number
}

export type ScanStage = "events" | "filtering" | "orderbooks" | "done"

export interface ScanProgress {
  stage: ScanStage
  message: string
  current?: number
  total?: number
}

export class ScanError extends Error {
  constructor(
    public stage: ScanStage,
    message: string
  ) {
    super(message)
    this.name = "ScanError"
  }
}

function parseJsonArray(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

function activeMarkets(event: GammaEvent): GammaEventMarket[] {
  return event.markets.filter(m => m.active && !m.closed)
}

function filterEvents(
  events: GammaEvent[],
  minOutcomes: number,
  minVolume: number
): GammaEvent[] {
  return events.filter(e =>
    activeMarkets(e).length >= minOutcomes && e.volume >= minVolume
  )
}

// Two-pass optimization: use Gamma's indicative bestAsk for quick pre-filter.
// Only events where gamma sum < generous threshold get CLOB verification.
// This reduces CLOB calls from ~11k to ~200 (18min → <1min).
const GAMMA_PRE_FILTER_MARGIN = 0.05

function preFilterByGammaPrice(
  events: GammaEvent[],
  threshold: number
): GammaEvent[] {
  const generousThreshold = threshold + GAMMA_PRE_FILTER_MARGIN
  return events.filter(e => {
    const gammaSum = activeMarkets(e).reduce((sum, m) => sum + (m.bestAsk ?? 1), 0)
    return gammaSum < generousThreshold
  })
}

async function fetchEventOrderbooks(
  event: GammaEvent,
  onOutcome?: () => void
): Promise<OutcomePrice[]> {
  const outcomes: OutcomePrice[] = []

  for (const market of activeMarkets(event)) {
    const tokenIds = parseJsonArray(market.clobTokenIds)
    // For NegRisk multi-outcome events, each market has 2 tokens (Yes/No)
    // We want the Yes token (index 0) — that's the one we'd buy
    const yesTokenId = tokenIds[0]
    if (!yesTokenId) continue

    const result = await api.fetchOrderbook(yesTokenId)
    onOutcome?.()

    if (isErr(result) || result.data.asks.length === 0) {
      outcomes.push({
        question: market.question,
        tokenId: yesTokenId,
        bestAsk: null,
        bestAskSize: 0,
      })
      continue
    }

    const bestAsk = result.data.asks[0]
    if (!bestAsk) {
      outcomes.push({
        question: market.question,
        tokenId: yesTokenId,
        bestAsk: null,
        bestAskSize: 0,
      })
      continue
    }

    outcomes.push({
      question: market.question,
      tokenId: yesTokenId,
      bestAsk: parseFloat(bestAsk.price),
      bestAskSize: parseFloat(bestAsk.price) * parseFloat(bestAsk.size),
    })
  }

  return outcomes
}

function detectArb(
  event: GammaEvent,
  outcomes: OutcomePrice[],
  threshold: number,
  minDepth: number
): ArbOpportunity | null {
  const pricedOutcomes = outcomes.filter(o => o.bestAsk !== null)
  const outcomesWithNoAsks = outcomes.length - pricedOutcomes.length

  if (pricedOutcomes.length < 2) return null

  const sumOfAsks = pricedOutcomes.reduce((sum, o) => sum + (o.bestAsk ?? 0), 0)
  const lowestDepth = Math.min(...pricedOutcomes.map(o => o.bestAskSize))

  if (sumOfAsks >= threshold) return null
  if (lowestDepth < minDepth) return null

  return {
    event: { id: event.id, title: event.title, slug: event.slug },
    outcomes: outcomes.toSorted((a, b) => (b.bestAsk ?? 0) - (a.bestAsk ?? 0)),
    sumOfAsks,
    profitMargin: 1 - sumOfAsks,
    minDepth: lowestDepth,
    outcomesWithNoAsks,
  }
}

export async function scanArb(
  input: ScanArbInput,
  onProgress?: (p: ScanProgress) => void
): Promise<ArbOpportunity[]> {
  const emit = onProgress ?? (() => {})

  // 1. Fetch all active events
  emit({ stage: "events", message: "Fetching events..." })
  const eventsResult = await api.fetchEvents((cur, tot) => {
    emit({ stage: "events", message: "Fetching events...", current: cur, total: tot })
  })
  if (isErr(eventsResult)) throw new ScanError("events", eventsResult.error.message)

  // 2. Filter by outcome count + volume
  const filtered = filterEvents(eventsResult.data, input.minOutcomes, input.minVolume)
  emit({
    stage: "filtering",
    message: `${eventsResult.data.length} events, ${filtered.length} with ${input.minOutcomes}+ outcomes`,
  })

  // 3. Pre-filter using Gamma's indicative bestAsk (fast, no CLOB calls)
  const candidates = preFilterByGammaPrice(filtered, input.threshold)
  const totalOutcomes = candidates.reduce((sum, e) => sum + activeMarkets(e).length, 0)
  emit({
    stage: "filtering",
    message: `${candidates.length} candidates after price pre-filter (${totalOutcomes} outcomes)`,
  })

  // 4. Fetch CLOB orderbooks only for candidates
  const opportunities: ArbOpportunity[] = []
  let outcomesScanned = 0

  for (const event of candidates) {
    const outcomes = await fetchEventOrderbooks(event, () => {
      outcomesScanned++
      emit({
        stage: "orderbooks",
        message: "Fetching orderbooks...",
        current: outcomesScanned,
        total: totalOutcomes,
      })
    })

    const arb = detectArb(event, outcomes, input.threshold, input.minDepth)
    if (arb) opportunities.push(arb)
  }

  emit({ stage: "done", message: `Scanned ${candidates.length} events (${totalOutcomes} outcomes)` })
  return opportunities
}
