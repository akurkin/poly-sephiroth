# Arbitrage Scanner

Scan Polymarket markets for arbitrage opportunities where buying all outcomes costs less than $1 (guaranteed profit).

**User Story**: As a trader, I want to automatically find arbitrage opportunities across Polymarket, so that I can profit from pricing inefficiencies without manual monitoring.

## Background

Arbitrage on Polymarket occurs when:

- **Single-condition**: YES + NO best asks sum to < $1 (buy both, redeem for $1)
- **NegRisk multi-outcome**: All outcome best asks sum to < $1 (buy all, one wins for $1)

Historical profit from IMDEA research: $10.58M (single) + $28.99M (NegRisk) = **$39.57M total**.

### Critical: Use CLOB Orderbook Prices

**Gamma API `outcomePrices` ≠ actual executable prices**

- Gamma prices: mid-market or last traded (indicative only)
- CLOB orderbook: actual limit orders you can execute against
- Must use `GET /book?token_id=X` to get real best ask prices
- Wide spreads common on illiquid markets (bids $0.01, asks $0.99)

## Market Selection

### Initial Focus: NegRisk 4+ Outcomes

For v1, focus exclusively on **NegRisk events with 4+ outcomes**:
- 73% of historical arb profits came from NegRisk
- More outcomes = more chances for sum ≠ $1
- Examples: elections, awards, championships, "who will X" markets

**Current opportunities (Feb 2026):**
- Presidential Election 2028 (128 outcomes)
- Super Bowl halftime performers (42 outcomes)
- NFL awards markets (25-68 outcomes each)
- NBA/NHL championships (30+ outcomes)

### Priority Tiers

**Tier 1 - Highest opportunity**

- NegRisk events with 4+ outcomes AND volume >$100k
- Live sports during games (rapid price moves)
- Breaking news affecting multi-outcome markets

**Tier 2 - Secondary**

- NegRisk events with 4+ outcomes (any volume)
- High-volume YES/NO markets (>$100k)

**Tier 3 - Skip for v1**

- Simple YES/NO markets <$100k volume
- Markets with max price >95%
- Illiquid markets (wide spreads)

### Filtering Logic

```
v1 Filter (NegRisk focus):
  - event.negRisk == true AND
  - event.markets.length >= 4 AND
  - event.volume > $10k

Future expansion:
  - Add high-volume YES/NO markets
  - Add live sports detection
```

## Acceptance Criteria

### Scanner Behavior

- Fetches active NegRisk events from Gamma API (events endpoint, not markets)
- Filters to events with 4+ outcomes
- For each outcome, fetches **CLOB orderbook** (not Gamma prices)
- Uses **best ask price** from orderbook (actual executable price)
- Calculates sum of best asks across all outcomes in event
- Identifies opportunities where sum < threshold (default 0.98, accounting for ~1% fees + spread)
- Respects rate limits (100ms delay between requests)

### Output

- Displays opportunities as they're found
- Shows: market slug, outcome prices, total cost, profit margin %
- Optionally outputs to JSON file for downstream use

### CLI Interface

```bash
# One-shot scan (bootstrap, check, exit)
poly arb

# Continuous monitoring (foreground, Ctrl+C to stop)
poly arb --watch

# With options
poly arb --watch --threshold 0.98 --output arb.json

# Minimum outcomes per event (default: 4)
poly arb --watch --min-outcomes 6

# Filter by minimum volume
poly arb --watch --min-volume 50000

# Include simple YES/NO markets (disabled by default in v1)
poly arb --watch --include-binary
```

### Modes

- **One-shot** (default): Bootstrap cache, check for arbs, exit
- **Watch** (`--watch`): Bootstrap + WebSocket real-time monitoring (foreground process)

## Scope

### In Scope

- Single-condition arbitrage (YES/NO markets)
- NegRisk arbitrage (multi-outcome markets)
- Hybrid approach: REST bootstrap + WebSocket real-time
- Rate limiting to avoid API blocks
- Basic terminal output

### Out of Scope (Future)

- Automatic order execution
- Profit calculation with exact fees
- Telegram/Discord alerts
- Position sizing recommendations
- Combinatorial arbitrage (Frank-Wolfe + ILP for logically related markets)

## Technical Approach

### Runtime

- **Foreground CLI**: Runs in terminal, Ctrl+C to stop (use tmux/screen for persistence)
- **No daemon mode** for v1 - keeps it simple to debug and monitor

### Dependencies

- **Bun native fetch** for REST APIs (Gamma, CLOB)
- **Bun native WebSocket** for real-time updates
- **bun:sqlite** for price cache (persistent, queryable)
- **No external packages** - all Bun built-ins
- clob-client reserved for future order execution feature

### Market Subscription

- ~25,000 total active markets on Polymarket
- After filtering (volume >$10k, etc.): ~1,000-2,000 markets
- Subscribe to **filtered list only** (not all markets)
- Reduces noise and message volume significantly

### Architecture: Hybrid (REST bootstrap + WebSocket real-time)

```
STARTUP PHASE (REST)
┌─────────┐    GET /markets     ┌─────────┐
│  CLI    │ ──────────────────► │  Gamma  │
└────┬────┘                     └─────────┘
     │
     │    GET /book (each)      ┌─────────┐
     └─────────────────────────►│  CLOB   │
                                └─────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  SQLite cache (bun:sqlite)              │
│  data/arb-cache.db                      │
│  - markets, outcomes, prices tables     │
└─────────────────────────────────────────┘

REAL-TIME PHASE (WebSocket)
┌─────────┐                      ┌─────────┐
│  CLI    │◄────────────────────►│   WS    │
└────┬────┘  subscribe: filtered │  Server │
     │                           └─────────┘
     │
     │  On price_change:
     │    1. Update SQLite
     │    2. Check arb condition
     │    3. Alert if sum < threshold
     ▼
```

### Why Hybrid?

| Approach   | Latency       | Catches arbs?         |
| ---------- | ------------- | --------------------- |
| REST only  | 50+ sec/cycle | ~5% (too slow)        |
| WS only    | ~50ms         | Missing initial state |
| **Hybrid** | ~50ms         | ~80% (best)           |

### Components

1. **MarketCache** - SQLite price store (`bun:sqlite`)
   - Tables: `markets`, `outcomes`, `prices`
   - Persistent across restarts (warm cache)
   - Updated by both REST (bootstrap) and WS (real-time)
   - Queryable for analytics/debugging

2. **ArbDetector** - Checks cache for opportunities
   - Single-condition: `yes + no < threshold`
   - NegRisk: `sum(all outcomes) < threshold`
   - Called on every cache update
   - Can also run as SQL query for batch detection

3. **WebSocketManager** - Handles connection lifecycle (Bun native WebSocket)
   - Auto-reconnect on disconnect
   - Resubscribe on reconnect
   - Heartbeat/ping handling

4. **AlertEmitter** - Outputs found opportunities
   - Console output (default)
   - JSON file (--output flag)
   - Future: Telegram/Discord

### WebSocket Details

```
URL: wss://ws-subscriptions-clob.polymarket.com/ws/market

Subscribe message (filtered list, not all):
{
  "type": "subscribe",
  "channel": "market",
  "markets": ["<conditionId1>", "<conditionId2>", ...]  // ~1-2k filtered markets
}

Price update event:
{
  "type": "price_change",
  "market": "<condition_id>",
  "price": "0.55",
  "timestamp": "2026-02-05T..."
}
```

### Flow

```
1. CLI starts
2. Fetch all active markets (Gamma API)
3. Filter by selection criteria
4. Fetch orderbooks for filtered markets (CLOB API)
5. Populate cache, check for existing arbs
6. Connect WebSocket, subscribe to filtered markets
7. On each price update:
   a. Update cache
   b. Run arb check
   c. If arb found → alert
8. Handle reconnects gracefully
```

## Realistic Expectations

### Arb Frequency

From IMDEA research: $39.57M extracted over 12 months = ~$108k/day average across ALL arbitrageurs.

**What to expect:**
- Individual arbs last seconds to minutes
- Most caught by faster bots in <1 second
- Scanner is a "fishing net" - sometimes catches fish, often doesn't
- Expect 0-10 catchable opportunities per day
- Best times: live sports, breaking news, market launches

### Best Timing (Feb 2026)

- **Super Bowl week (Feb 5-9)**: High activity, many multi-outcome markets
- **NFL awards (Feb 7-11)**: 68+ outcome markets resolving
- **Evening US hours**: Live NBA/NHL games create price volatility

### Success Metrics

For v1, consider it working if:
- Successfully connects to WebSocket
- Detects price changes in real-time
- Correctly calculates outcome sums
- Alerts when sum < threshold (even if arb already gone)

Actual profitable execution = future v2 with order placement.

## Designs

N/A - CLI output only

## Risks & Unknowns

- ~~**Latency**: By the time we detect arb, it may be gone. How stale is acceptable?~~ → Resolved: WebSocket gives ~50ms latency
- **Liquidity**: Best ask might have tiny size. Should we check depth?
- **Fees**: Polymarket takes ~1% on profits. Threshold should account for this.
- **API limits**: How many markets can we scan before rate limiting? Need to test.
- ~~**Market selection**: Scan all markets or filter by volume/liquidity?~~ → Resolved: Filter by volume >$10k, prioritize NegRisk + sports
- **WS reconnect**: How to handle disconnects without missing arbs? Need exponential backoff + state resync.
- **WS message format**: Need to verify exact payload structure from real connection.
