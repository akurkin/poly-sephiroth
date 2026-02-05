import type { Activity, Position, Summary } from "../types.js"

function groupBy<T>(items: T[], key: (t: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {}
  for (const item of items) {
    const k = key(item)
    ;(result[k] ??= []).push(item)
  }
  return result
}

export function computeSummary(activity: Activity[], positions: Position[]): Summary {
  const trades = activity.filter(a => a.type === "TRADE")
  const redeems = activity.filter(a => a.type === "REDEEM")
  const buys = trades.filter(t => t.side === "BUY")
  const sells = trades.filter(t => t.side === "SELL")

  const totalVolume = trades.reduce((s, t) => s + t.usdcSize, 0)
  const redeemValue = redeems.reduce((s, r) => s + r.usdcSize, 0)

  const byEvent = groupBy(trades, t => t.eventSlug)
  const bothSidesTrades = Object.entries(byEvent)
    .filter(([, ts]) => new Set(ts.map(t => t.outcome)).size > 1)
    .map(([event, ts]) => ({ event, trades: ts.length }))

  const bySlug = groupBy(trades, t => t.slug)
  const categoryBreakdown = Object.entries(bySlug)
    .map(([category, ts]) => ({
      category,
      trades: ts.length,
      volume: ts.reduce((s, t) => s + t.usdcSize, 0),
    }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 20)

  const byOutcome = groupBy(trades, t => `${t.title} - ${t.outcome}`)
  const topOutcomes = Object.entries(byOutcome)
    .map(([outcome, ts]) => ({
      outcome,
      trades: ts.length,
      volume: ts.reduce((s, t) => s + t.usdcSize, 0),
    }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 20)

  const timestamps = trades.map(t => t.timestamp * 1000)
  const minTs = timestamps.length ? Math.min(...timestamps) : Date.now()
  const maxTs = timestamps.length ? Math.max(...timestamps) : Date.now()
  const dayCount = Math.max(1, (maxTs - minTs) / (24 * 60 * 60 * 1000))

  return {
    totalTrades: trades.length,
    totalVolume,
    estimatedProfit: redeemValue - totalVolume,
    buyCount: buys.length,
    sellCount: sells.length,
    buyRatio: trades.length ? buys.length / trades.length : 0,
    avgTradeSize: trades.length ? totalVolume / trades.length : 0,
    tradesPerDay: trades.length / dayCount,
    timeRange: { start: new Date(minTs).toISOString(), end: new Date(maxTs).toISOString() },
    categoryBreakdown,
    topOutcomes,
    bothSidesTrades,
    largePositions: positions.filter(p => p.currentValue > 10000).length,
    openPositionsValue: positions.reduce((s, p) => s + p.currentValue, 0),
  }
}
