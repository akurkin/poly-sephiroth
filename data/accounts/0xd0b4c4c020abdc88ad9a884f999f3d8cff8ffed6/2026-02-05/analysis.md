# MrSparklySimpsons Strategy Analysis

**Address:** 0xd0b4c4c020abdc88ad9a884f999f3d8cff8ffed6
**Period:** 3 days (2026-02-02 to 2026-02-05)

## Summary Stats

| Metric | Value |
|--------|-------|
| Total Trades | 1,907 |
| Total Volume | $884,938 |
| Est. Profit | $1,249,996 |
| Buy/Sell Ratio | 100% buy |
| Avg Trade Size | $464 |
| Trades/Day | ~700 |

## Strategy: Sports Arbitrage Bot

### What they're doing

1. **Comparing odds** - Polymarket vs traditional sportsbooks (Pinnacle, DraftKings)
2. **Buying mispriced outcomes** - When Polymarket offers better odds than sharp bookmakers
3. **High frequency** - ~700 trades/day, automated execution
4. **Focus on 50-55c prices** - Near coin-flip odds where mispricing is easier to spot
5. **Multi-sport coverage** - NBA, NHL, soccer leagues, UFC, tennis

### Trading Patterns

- **Buy only** - Pure accumulation, no selling
- **~1 min between trades** on same market (methodical accumulation)
- **Active hours:** 14:00-18:00 UTC (US sports prime time)
- **Price distribution:** 46% of volume at 0.50-0.55 prices

### Position Accumulation Examples

| Market | Trades | Duration | Shares | Spent | Price Range |
|--------|--------|----------|--------|-------|-------------|
| Damac Saudi Club - Yes | 238 | 13 min | 39,105 | $15,062 | 0.378-0.390 |
| Instituto AC Córdoba - No | 207 | 85 min | 34,334 | $23,327 | 0.678-0.680 |
| Pelicans (-4.5) Spread | 146 | 177 min | 103,317 | $53,725 | 0.520 |
| Senators vs Penguins | 144 | 99 min | 250,000 | $132,500 | 0.530 |
| Maple Leafs vs Flames | 106 | 158 min | 250,000 | $130,000 | 0.520 |

### Risk Profile

Current open positions show some big losses:
- Pelicans spread: -$53,725 (total loss)
- Predators: -$18,347 (total loss)

But overall strategy is highly profitable - most positions redeemed successfully.

## To Replicate

### Required Components

1. **Odds Feed** - Real-time data from sharp books (Pinnacle API, or scraping DraftKings/FanDuel)
2. **Polymarket Orderbook** - WebSocket feed for live prices
3. **Arbitrage Detector** - Compare implied probabilities, flag when Poly is mispriced by >2-3%
4. **Execution Engine** - Fast order placement via CLOB API
5. **Capital** - Need ~$100k+ to make meaningful money given thin margins

### Key Insights

- Accepts variance - takes big losses but wins more often
- Focuses on liquid sports markets (NBA, NHL, major soccer)
- Executes during peak liquidity hours
- Uses incremental accumulation to avoid moving price
