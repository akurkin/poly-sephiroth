# Polymarket API Response Schemas

Real response examples from live API calls (Feb 2026).

## Gamma API

### GET /events

```ts
interface GammaEvent {
  id: string
  ticker: string
  slug: string
  title: string
  description: string
  resolutionSource: string
  startDate: string // ISO date
  creationDate: string
  endDate: string
  image: string
  icon: string
  active: boolean
  closed: boolean
  archived: boolean
  new: boolean
  featured: boolean
  restricted: boolean
  liquidity: number
  volume: number
  openInterest: number
  category: string
  commentCount: number
  volume24hr: number
  volume1wk: number
  volume1mo: number
  volume1yr: number
  markets: GammaMarket[]
}
```

### GET /markets

```ts
interface GammaMarket {
  id: string
  question: string
  conditionId: string // key identifier
  slug: string
  resolutionSource: string
  endDate: string
  category: string
  liquidity: string
  startDate: string
  fee: string
  image: string
  icon: string
  description: string
  outcomes: string // JSON array: '["Yes", "No"]'
  outcomePrices: string // JSON array: '["0.55", "0.45"]'
  volume: string
  active: boolean
  closed: boolean
  archived: boolean
  restricted: boolean
  volumeNum: number
  liquidityNum: number
  volume24hr: number
  volume1wk: number
  volume1mo: number
  volume1yr: number
  clobTokenIds: string // JSON array of token IDs
  events: GammaEvent[] // parent events
}
```

## CLOB API

### GET /markets

```ts
interface ClobMarket {
  enable_order_book: boolean
  active: boolean
  closed: boolean
  archived: boolean
  accepting_orders: boolean
  accepting_order_timestamp: string | null
  minimum_order_size: number // e.g., 15
  minimum_tick_size: number // e.g., 0.01
  condition_id: string
  question_id: string
  question: string
  description: string
  market_slug: string
  end_date_iso: string
  game_start_time: string
  seconds_delay: number
  fpmm: string
  maker_base_fee: number
  taker_base_fee: number
  neg_risk: boolean
  neg_risk_market_id: string
  neg_risk_request_id: string
  icon: string
  image: string
  rewards: {
    rates: unknown
    min_size: number
    max_spread: number
  }
  is_50_50_outcome: boolean
  tokens: ClobToken[]
  tags: string[]
}

interface ClobToken {
  token_id: string // long numeric string
  outcome: string // "Yes" or "No" or custom
  price: number
  winner: boolean
}
```

### GET /book?token_id=X

```ts
interface OrderBook {
  market: string // condition_id
  asset_id: string // token_id
  timestamp: string
  hash: string
  bids: OrderBookLevel[]
  asks: OrderBookLevel[]
}

interface OrderBookLevel {
  price: string // "0.55"
  size: string // "1000.00"
}
```

### GET /price?token_id=X&side=buy

```ts
interface PriceResponse {
  price: string // "0.55"
}
```

## Data API

### GET /activity?user=X

```ts
interface Activity {
  id: string
  timestamp: string // ISO date
  type: "trade" | "redeem" | "deposit" | "withdraw"
  conditionId: string
  eventSlug: string
  outcome: string
  side: "buy" | "sell"
  size: number // in USDC
  price: number
  category: string
}
```

### GET /positions?user=X

```ts
interface Position {
  conditionId: string
  outcome: string
  size: number // shares
  avgPrice: number
  value: number // current value
  pnl: number
  eventSlug: string
  category: string
}
```

### GET /profiles?addresses=X or /profiles?usernames=X

```ts
interface Profile {
  address: string
  username: string
  bio: string
  avatar: string
  pnl: number
  volume: number
  positions: number
  tradesCount: number
}
```

## Notes

- `clobTokenIds` and `outcomes` in Gamma are JSON strings, need parsing
- Token IDs are very long numeric strings (76+ digits)
- Prices in CLOB are strings, convert to numbers
- All timestamps are ISO 8601 format
- Paginate with `limit` and `offset` params (default limit: 100)
