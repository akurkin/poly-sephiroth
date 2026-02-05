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

## References

- **TypeScript schemas**: See [references/response_schemas.md](references/response_schemas.md) for full interface definitions
- **Latest docs**: Use WebFetch on https://docs.polymarket.com/llms.txt for complete API index
- **SDK source**: https://github.com/Polymarket/clob-client
