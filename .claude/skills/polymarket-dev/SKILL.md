---
name: polymarket-dev
description: |
  Expert Polymarket developer for Node.js/TypeScript/Bun. Use when:
  - Questions about Polymarket API (CLOB, Gamma, Data API, WebSocket)
  - Building trading bots or market data fetchers
  - Understanding order placement, authentication, signing
  - Analyzing account activity, positions, market data
  - Integrating @polymarket/clob-client SDK
  - Polymarket technical architecture questions
  Triggers: "polymarket api", "clob client", "gamma api", "trading bot", "order placement", "market data"
---

# Polymarket Development Expert

Expert guidance for Polymarket integration using Node.js/TypeScript/Bun.

## API Architecture

| API | Base URL | Purpose |
|-----|----------|---------|
| Gamma | `https://gamma-api.polymarket.com` | Market discovery, events, metadata |
| CLOB | `https://clob.polymarket.com` | Orderbooks, prices, trading |
| Data | `https://data-api.polymarket.com` | User positions, activity, portfolios |
| WebSocket | `wss://ws-subscriptions-clob.polymarket.com` | Real-time updates |

## Quick Reference

### Gamma API (No Auth)

```ts
// Events (contains markets)
GET /events?limit=100&offset=0&closed=false

// Markets directly
GET /markets?limit=100&closed=false

// Single market by slug
GET /markets?slug=will-trump-win
```

**Key fields in market response:**
- `conditionId` - unique market identifier
- `clobTokenIds` - JSON array of token IDs for CLOB trading
- `outcomes` - JSON array like `["Yes", "No"]`
- `outcomePrices` - current prices

### CLOB API (Some endpoints require auth)

```ts
// Orderbook (no auth)
GET /book?token_id=<TOKEN_ID>
// Response: { bids: [{price, size}], asks: [{price, size}] }

// Price (no auth)
GET /price?token_id=<TOKEN_ID>&side=buy
// Response: { price: "0.55" }

// Markets list (no auth)
GET /markets
// Response: { data: [{ condition_id, tokens: [{token_id, outcome, price}] }] }

// Trading requires auth (see SDK section)
```

### Data API (No Auth)

```ts
// User activity (trades, redeems)
GET /activity?user=<ADDRESS>&limit=100&offset=0

// User positions
GET /positions?user=<ADDRESS>

// Profile lookup by username
GET /profiles?usernames=<USERNAME>

// Profile lookup by address
GET /profiles?addresses=<ADDRESS>
```

## SDK Setup (@polymarket/clob-client)

```bash
npm install @polymarket/clob-client ethers
```

```ts
import { ClobClient, Side, OrderType } from "@polymarket/clob-client"
import { Wallet } from "ethers"

const host = "https://clob.polymarket.com"
const chainId = 137 // Polygon

// 1. Create signer from private key
const signer = new Wallet(process.env.PRIVATE_KEY)

// 2. Get or create API credentials
const tempClient = new ClobClient(host, chainId, signer)
const creds = await tempClient.deriveApiKey() // or createApiKey()

// 3. Initialize full client
// signatureType: 0 = browser wallet, 1 = Magic/email
const client = new ClobClient(
  host,
  chainId,
  signer,
  creds,
  1, // signatureType
  process.env.FUNDER_ADDRESS // your Polymarket deposit address
)
```

## Order Placement

```ts
// Get market params from Gamma API first
const market = await fetch("https://gamma-api.polymarket.com/markets?slug=your-slug")
  .then(r => r.json())
  .then(m => m[0])

const tokenIds = JSON.parse(market.clobTokenIds)
const yesTokenId = tokenIds[0]

// Place order
await client.createAndPostOrder({
  tokenID: yesTokenId,
  price: 0.55,
  size: 100,
  side: Side.BUY,
  orderType: OrderType.GTC,
  tickSize: "0.01", // from market.minimumTickSize
  negRisk: false,   // from market.negRisk
})
```

## Common Patterns

### Fetch All Activity (Paginated)

```ts
async function fetchAllActivity(address: string, days: number) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  const all = []
  let offset = 0

  while (true) {
    const url = `https://data-api.polymarket.com/activity?user=${address}&limit=100&offset=${offset}`
    const page = await fetch(url).then(r => r.json())
    if (!page.length) break

    const inRange = page.filter(a => new Date(a.timestamp).getTime() >= cutoff)
    all.push(...inRange)
    if (inRange.length < page.length) break

    offset += 100
    await sleep(100) // rate limit
  }
  return all
}
```

### Resolve Username to Address

```ts
async function resolveAddress(target: string): Promise<string> {
  if (target.startsWith("0x")) return target
  const res = await fetch(
    `https://data-api.polymarket.com/profiles?usernames=${target}`
  )
  const profiles = await res.json()
  if (!profiles.length) throw new Error(`User not found: ${target}`)
  return profiles[0].address
}
```

### Get Live Market Price

```ts
async function getMarketPrice(conditionId: string) {
  // Get market from Gamma for token IDs
  const market = await fetch(
    `https://gamma-api.polymarket.com/markets?conditionId=${conditionId}`
  ).then(r => r.json()).then(m => m[0])

  const tokenIds = JSON.parse(market.clobTokenIds)

  // Get prices from CLOB
  const prices = await Promise.all(
    tokenIds.map(async (id, i) => {
      const res = await fetch(
        `https://clob.polymarket.com/price?token_id=${id}&side=buy`
      )
      const { price } = await res.json()
      return { outcome: JSON.parse(market.outcomes)[i], price }
    })
  )
  return prices
}
```

## Key Concepts

**Token ID**: Each outcome (Yes/No) has a unique token ID. Use `clobTokenIds` from Gamma market response.

**Condition ID**: Unique market identifier. Same across all APIs.

**Neg Risk**: Some markets use negative risk model. Check `negRisk` field before trading.

**Tick Size**: Minimum price increment. Usually 0.01 or 0.001. From `minimumTickSize`.

**Funder Address**: Your Polymarket profile address where USDC is deposited.

## Rate Limits

~10 requests/sec across all APIs. Add 100ms delay between requests for safety.

---

## WebSocket Real-Time Updates

```ts
const WS_URL = "wss://ws-subscriptions-clob.polymarket.com/ws/market"

// Subscribe to price updates
const ws = new WebSocket(WS_URL)

ws.onopen = () => {
  // Subscribe to specific market
  ws.send(JSON.stringify({
    type: "subscribe",
    channel: "market",
    markets: [conditionId],
  }))
}

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  // data.type: "price_change" | "trade" | "book_update"
  // data.market: conditionId
  // data.price: current price
  // data.timestamp: ISO string
}

// Subscribe to all markets (high volume)
ws.send(JSON.stringify({
  type: "subscribe",
  channel: "market",
  markets: [], // empty = all markets
}))
```

**Channel types:**
- `market` - price changes, trades
- `user` - your order fills, position changes (requires auth)

---

## NegRisk Multi-Outcome Markets

NegRisk markets have multiple outcomes where sum of prices should = $1.

```ts
// Detect NegRisk market
const isNegRisk = market.negRisk === true

// Get all outcomes
const outcomes = JSON.parse(market.outcomes) // ["Trump", "Biden", "Other"]
const tokenIds = JSON.parse(market.clobTokenIds) // [id1, id2, id3]

// Fetch all prices
const prices = await Promise.all(
  tokenIds.map(id =>
    fetch(`https://clob.polymarket.com/price?token_id=${id}&side=buy`)
      .then(r => r.json())
      .then(d => parseFloat(d.price))
  )
)

const sum = prices.reduce((a, b) => a + b, 0)
// If sum < 1.0, arbitrage exists (buy all outcomes)
// If sum > 1.0, arbitrage exists (sell all outcomes)
```

**NegRisk order placement:**
```ts
await client.createAndPostOrder({
  tokenID: tokenId,
  price: 0.35,
  size: 100,
  side: Side.BUY,
  negRisk: true, // MUST be true for NegRisk markets
  tickSize: market.minimumTickSize,
})
```

---

## Arbitrage Detection

### Single-Condition Arbitrage (YES + NO < $1)

```ts
async function detectSingleConditionArb(conditionId: string) {
  const market = await fetch(
    `https://gamma-api.polymarket.com/markets?conditionId=${conditionId}`
  ).then(r => r.json()).then(m => m[0])

  const tokenIds = JSON.parse(market.clobTokenIds)

  // Get best ask (buy price) for each outcome
  const [yesBook, noBook] = await Promise.all(
    tokenIds.map(id =>
      fetch(`https://clob.polymarket.com/book?token_id=${id}`)
        .then(r => r.json())
    )
  )

  const yesBestAsk = parseFloat(yesBook.asks[0]?.price ?? "1")
  const noBestAsk = parseFloat(noBook.asks[0]?.price ?? "1")
  const total = yesBestAsk + noBestAsk

  if (total < 0.99) { // Account for fees
    return {
      arb: true,
      profit: 1 - total,
      yesPrice: yesBestAsk,
      noPrice: noBestAsk,
    }
  }
  return { arb: false }
}
```

### NegRisk Arbitrage (Multi-Outcome Sum < $1)

```ts
async function detectNegRiskArb(conditionId: string) {
  const market = await fetch(
    `https://gamma-api.polymarket.com/markets?conditionId=${conditionId}`
  ).then(r => r.json()).then(m => m[0])

  if (!market.negRisk) return { arb: false }

  const tokenIds = JSON.parse(market.clobTokenIds)
  const outcomes = JSON.parse(market.outcomes)

  const books = await Promise.all(
    tokenIds.map(id =>
      fetch(`https://clob.polymarket.com/book?token_id=${id}`)
        .then(r => r.json())
    )
  )

  const bestAsks = books.map(b => parseFloat(b.asks[0]?.price ?? "1"))
  const total = bestAsks.reduce((a, b) => a + b, 0)

  if (total < 0.99) {
    return {
      arb: true,
      profit: 1 - total,
      prices: outcomes.map((o, i) => ({ outcome: o, price: bestAsks[i] })),
    }
  }
  return { arb: false }
}
```

### Historical Context (IMDEA Research)
| Type | Historical Profit | Mechanism |
|------|------------------|-----------|
| Single-condition | $10.58M | YES + NO < $1 |
| NegRisk | $28.99M | Multi-outcome sum < $1 (29x capital efficiency) |
| Combinatorial | Variable | Correlated market mispricing |

---

## Query Parameters

### Gamma API Filters

```ts
// Filter by category
GET /markets?category=sports&closed=false

// Filter by active status
GET /markets?active=true&archived=false

// Search by text
GET /events?_q=trump

// Pagination
GET /markets?limit=100&offset=200

// Sort
GET /markets?_sort=volume&_order=desc
```

### Data API Filters

```ts
// Activity by date range
GET /activity?user=X&startDate=2026-01-01&endDate=2026-02-01

// Activity by type
GET /activity?user=X&type=trade  // or "redeem"

// Positions with market data
GET /positions?user=X&includeMarket=true
```

---

## Redemption Flow

After market resolves, redeem winning positions:

```ts
// 1. Check if position is redeemable
const positions = await fetch(
  `https://data-api.polymarket.com/positions?user=${address}`
).then(r => r.json())

const redeemable = positions.filter(p => p.redeemable === true)

// 2. Redeem via SDK
for (const position of redeemable) {
  await client.redeemPositions({
    conditionId: position.conditionId,
  })
}
```

**Auto-redemption**: Polymarket auto-redeems winning positions after ~24h, but manual is faster.

---

## Error Handling

### Common Errors

```ts
// 400 - Bad request (invalid params)
// 401 - Unauthorized (invalid/expired API key)
// 403 - Forbidden (geo-blocked, US IP)
// 404 - Market not found
// 429 - Rate limited
// 500 - Server error

async function safeFetch<T>(url: string): Promise<Result<T>> {
  try {
    const res = await fetch(url)

    if (res.status === 429) {
      // Rate limited - wait and retry
      await sleep(1000)
      return safeFetch(url)
    }

    if (res.status === 403) {
      return { error: new Error("Geo-blocked: Use non-US IP") }
    }

    if (!res.ok) {
      return { error: new Error(`HTTP ${res.status}: ${url}`) }
    }

    return { data: await res.json() }
  } catch (e) {
    return { error: e instanceof Error ? e : new Error(String(e)) }
  }
}
```

### SDK Errors

```ts
try {
  await client.createAndPostOrder(order)
} catch (e) {
  if (e.message.includes("insufficient balance")) {
    // Need more USDC in funder address
  }
  if (e.message.includes("minimum order size")) {
    // Order too small (usually $15 min)
  }
  if (e.message.includes("price out of range")) {
    // Price must be 0.01-0.99
  }
  if (e.message.includes("invalid signature")) {
    // API key/secret mismatch or expired
  }
}
```

---

## Common Gotchas

### 1. JSON String Fields
```ts
// WRONG - these are strings, not arrays
const outcomes = market.outcomes // '["Yes", "No"]'

// RIGHT - parse them
const outcomes = JSON.parse(market.outcomes) // ["Yes", "No"]
const tokenIds = JSON.parse(market.clobTokenIds)
const prices = JSON.parse(market.outcomePrices)
```

### 2. Token ID vs Condition ID
```ts
// conditionId - identifies the MARKET (same across APIs)
// tokenId - identifies a specific OUTCOME (Yes/No token)

// To trade, you need tokenId, not conditionId
const tokenIds = JSON.parse(market.clobTokenIds)
const yesTokenId = tokenIds[0]
const noTokenId = tokenIds[1]
```

### 3. Price String vs Number
```ts
// CLOB API returns prices as strings
const { price } = await fetch(`/price?token_id=${id}`).then(r => r.json())
// price = "0.55" (string)

// Convert before math
const numPrice = parseFloat(price)
```

### 4. NegRisk Flag Required
```ts
// WRONG - will fail on NegRisk markets
await client.createAndPostOrder({ ...order, negRisk: false })

// RIGHT - check market first
const negRisk = market.negRisk ?? false
await client.createAndPostOrder({ ...order, negRisk })
```

### 5. Pagination Max 100
```ts
// API returns max 100 per page
// Large accounts need multiple requests
let offset = 0
while (true) {
  const page = await fetch(`/activity?user=${addr}&limit=100&offset=${offset}`)
  if (page.length === 0) break
  offset += 100
  await sleep(100) // rate limit
}
```

### 6. Geo-Restrictions
```ts
// US IPs are blocked from trading
// Reading data works, but order placement fails with 403
// Solution: Use EU/non-US VPS for trading bots
```

### 7. Activity `size` Field
```ts
// size in activity is shares, not USD
// Calculate USD value:
const usdValue = activity.size * activity.price

// Some records have usdcSize, but not all
const usd = activity.usdcSize ?? (activity.size * activity.price)
```

### 8. Username Resolution Failures
```ts
// Not all usernames resolve - some accounts have no username
// Always support direct address input
async function resolveAddress(target: string): Promise<string> {
  if (target.startsWith("0x") && target.length === 42) {
    return target // Already an address
  }
  // Try username lookup...
}
```

---

## References

- **TypeScript schemas**: See [references/response_schemas.md](references/response_schemas.md) for full interface definitions
- **Latest docs**: Use WebFetch on https://docs.polymarket.com/llms.txt for complete API index
- **SDK source**: https://github.com/Polymarket/clob-client
- **Arbitrage research**: arxiv:2508.03474 (IMDEA $39.59M study)
- **Combinatorial algorithms**: arxiv:1606.02825 (Frank-Wolfe/ILP)
