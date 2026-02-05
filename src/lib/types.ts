export interface Activity {
  proxyWallet: string
  timestamp: number
  conditionId: string
  type: string
  size: number
  usdcSize: number
  transactionHash: string
  price: number
  asset: string
  side: string
  outcomeIndex: number
  title: string
  slug: string
  icon: string
  eventSlug: string
  outcome: string
  name: string
  pseudonym: string
  bio: string
  profileImage: string
  profileImageOptimized: string
}

export interface Position {
  proxyWallet: string
  asset: string
  conditionId: string
  size: number
  avgPrice: number
  initialValue: number
  currentValue: number
  cashPnl: number
  percentPnl: number
  totalBought: number
  realizedPnl: number
  percentRealizedPnl: number
  curPrice: number
  redeemable: boolean
  mergeable: boolean
  title: string
  slug: string
  icon: string
  eventId: string
  eventSlug: string
  outcome: string
  outcomeIndex: number
  oppositeOutcome: string
  oppositeAsset: string
  endDate: string
  negativeRisk: boolean
}

export interface Profile {
  address: string
  name: string
  pseudonym: string
  bio: string
  profileImage: string
}

export interface GammaMarket {
  id: string
  question: string
  conditionId: string
  slug: string
  category: string
  outcomes: string
  outcomePrices: string
  volume: number
}

export interface Summary {
  totalTrades: number
  totalVolume: number
  estimatedProfit: number
  buyCount: number
  sellCount: number
  buyRatio: number
  avgTradeSize: number
  tradesPerDay: number
  timeRange: { start: string; end: string }
  categoryBreakdown: Array<{ category: string; trades: number; volume: number }>
  topOutcomes: Array<{ outcome: string; trades: number; volume: number }>
  bothSidesTrades: Array<{ event: string; trades: number }>
  largePositions: number
  openPositionsValue: number
}

export interface DumpMeta {
  address: string
  username: string | null
  dumpedAt: string
  days: number
  version: string
}
