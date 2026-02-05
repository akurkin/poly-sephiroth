# Sharp Line Comparison Scanner

Compare Vegas/Pinnacle odds to Polymarket prices to find mispriced sports outcomes - the dominant profitable strategy across all accounts we analyzed.

**User Story**: As a trader, I want to automatically detect when Polymarket sports prices diverge from sharp bookmaker lines, so that I can bet on mispriced outcomes before the market corrects.

## Background

### Why This Strategy?

Analysis of 7 Polymarket accounts revealed:

| Account | Strategy | Lifetime ROI | Volume | Sports Focus | Win Rate |
|---------|----------|-------------|--------|-------------|----------|
| **Countryside** | Sharp line NBA | +6% | $28M | NBA | 6/6 (100%) |
| **FeatherLeather** | Predictive football | +90% | $2.4M | Euro football | 5/5 (100%) |
| **tbs8t** | Sharp line NBA | +6% | $3.2M | NBA | 7/13 (54%) |
| **MrSparklySimpsons** | Multi-sport sharp lines | -13% (3-day)* | $885K | NHL/NBA/Soccer/UFC | 12/24 (50%) |
| gmanas | Live model (no benchmark) | -7% | $1.2M | NHL/NBA/Esports | Unknown |
| fkblg | Emotional live gambling | -6.5% | $556K | LoL/NBA/CS2 | Losing |
| Flipadelphia | Geopolitical thesis | -45% | $1.9M | Iran politics | Losing |

*MrSparklySimpsons has massive older redemptions ($1.38M from 11 wins) suggesting long-term profitability despite short-term variance.

**4 of 7 accounts use sharp line comparison. All profitable accounts use external price benchmarks.** All 3 losing accounts don't.

### Key Insights from Account Analysis

**What winners share:**
- 100% buy ratio (hold to resolution, never sell)
- External price reference (Vegas/Pinnacle lines)
- Algorithmic execution (order splitting, 100+ trades/day)
- Sports focus (not politics/geopolitics)
- Pre-match only (no live trading)

**What losers share:**
- No external benchmark (pure prediction or emotion)
- Live trading / thesis betting
- Both-sides buying without selling (paying spread twice)

**Critical finding**: Countryside and tbs8t are **different entities** despite identical profiles (both joined Feb 2 2026, both NBA-only, both ~6% ROI). They took **opposite sides** on the same games (NOP @ CHA, NOP @ MIL), confirming they're independent sharp bettors who discovered Polymarket's soft NBA lines around the same time.

### Profitability Reality Check

| Metric | Countryside | tbs8t | MrSparklySimpsons |
|--------|-------------|-------|-------------------|
| Win rate | 100% (6/6) | 54% (7/13) | 50% (12/24) |
| Biggest win | +$383K (MIN spread) | +257% (MEM ML) | +$120K (TOR ML) |
| Biggest loss | None visible | -$100K+ | -$158K (AC Milan) |
| Selectivity | High | Medium | Low |
| Position sizing | Variable ($26K-$471K) | Flat ~$100K | Variable ($4K-$158K) |
| Entry prices | 0.28-0.69 | 0.28-0.57 | 0.29-0.72 |

**Key takeaway**: Higher selectivity = better results. Countryside is most selective (fewer bets, higher confidence) and has the best visible record. MrSparklySimpsons bets most broadly and has highest variance.

### Price Zone Analysis (Across All Sharp Accounts)

Most volume clusters in the **$0.50-0.55 "coin flip zone"** where:
- Vegas typically prices spreads/totals at ~50-50
- Polymarket often misprices by 3-8%
- Liquidity is deepest
- Edge is most systematic

Underdogs ($0.25-0.35) show the highest per-bet ROI when they hit but require more selectivity.

### How It Works

```
Sharp Book (Pinnacle)          Polymarket
Lakers ML: -150 (60%)    vs    Lakers Yes: $0.52 (52%)

Edge = 60% - 52% = 8% mispricing → BUY Lakers Yes
```

Sharp books like Pinnacle have efficient prices from professional bettors. Polymarket crowds are less sophisticated. When prices diverge significantly, bet the sharp line.

### IMPORTANT: This is NOT Cross-Venue Arbitrage

```
┌─────────────────────────────────────────────────────────────────┐
│  You ONLY bet on Polymarket. Vegas/Pinnacle is just a          │
│  REFERENCE for "true probability" - you never bet there.       │
└─────────────────────────────────────────────────────────────────┘
```

**Common misconception**: "Do I bet Thunder on Polymarket AND bet against Thunder on Pinnacle?"

**Answer: NO.**

| Strategy                      | How It Works                                             | Risk Profile                     |
| ----------------------------- | -------------------------------------------------------- | -------------------------------- |
| Pure Arbitrage                | Bet YES + NO on same market                              | Zero risk, guaranteed profit     |
| Cross-Venue Arb               | Bet both sides on different venues                       | Zero risk, guaranteed profit     |
| **Sharp Line Betting (this)** | Bet ONE side on Polymarket where it's mispriced vs Vegas | **You can lose individual bets** |

### Why Not Hedge on Pinnacle?

1. Pinnacle odds are already efficient (no edge there)
2. You'd pay vig (~4-5%) on both sides
3. Net result: guaranteed small LOSS

### The Actual Strategy

```
1. READ Pinnacle: Thunder +125 → 44.4% implied probability
2. READ Polymarket: Thunder @ $0.385 → 38.5% implied
3. DETECT edge: 44.4% - 38.5% = 5.9%
4. BUY Thunder on Polymarket ONLY at $0.385
5. HOLD until NBA Finals (June 2026)
6. OUTCOME:
   - Thunder win → you get $1.00 (profit $0.615)
   - Thunder lose → you get $0.00 (loss $0.385)
```

### Expected Value Math

If Vegas is "true probability":

```
EV = (P(win) × Payout) - Cost
EV = (0.444 × $1.00) - $0.385
EV = +$0.059 per dollar (5.9% edge)
```

Over many bets, you profit ~5.9% on average. But each individual bet either wins big or loses everything. This is why Countryside has some losing positions despite overall profitability.

### Why This Works

- Vegas/Pinnacle lines are set by sharp bettors with models + money at stake
- Polymarket is retail-heavy, slower to update, less sophisticated
- The "edge" is the gap between sharp price and Polymarket price
- You're not arbitraging - you're making **informed directional bets**

## Vegas/Sharp Line API Options

### Provider Comparison

| Provider | Price | Pinnacle? | Trial | Reliability | Best For |
|----------|-------|-----------|-------|-------------|----------|
| [The Odds API](https://the-odds-api.com/) | $59/mo | ✅ (paid tier) | Free tier (500 credits) | ⭐⭐ Indie | Starting out |
| [SportsGameOdds](https://sportsgameodds.com/) | $99-499/mo | ✅ | Free tier | ⭐⭐⭐ Solid | WebSocket needs |
| [SportsDataIO](https://sportsdata.io/live-odds-api) | Custom | ❌ (US books only) | ✅ Free trial | ⭐⭐⭐ Solid | US-focused |
| [BetStamp Pro](https://betstamp.com/pro) | $347/mo | ✅ | ✅ **14-day free** | ⭐⭐⭐⭐ Pro | **Recommended** |
| [OddsJam](https://oddsjam.com/odds-api) | ~$500+/mo | ✅ | ✅ 7-day free | ⭐⭐⭐⭐ Pro | Arb traders |
| [Unabated](https://unabated.com/get-unabated-api) | $3,000/mo | ✅ + Circa | ✅ Free trial | ⭐⭐⭐⭐⭐ Sharp | Sharp bettors |

### The Odds API (Budget Option)

| Tier     | Price      | Credits/mo  | Best For       |
| -------- | ---------- | ----------- | -------------- |
| Free     | $0         | 500         | POC/testing    |
| 20K      | $30/mo     | 20,000      | Starting out   |
| **100K** | **$59/mo** | **100,000** | Production     |
| 5M       | $119/mo    | 5,000,000   | High volume    |

- ✅ Simple REST API, good docs
- ✅ DraftKings, FanDuel, BetMGM included
- ⚠️ **Pinnacle requires paid tier** (not on free)
- ⚠️ **Historical odds require paid tier**
- ⭐⭐ Reliability: Indie project, adequate for starting

### BetStamp Pro (Recommended for Serious Use)

| Tier  | Price    | Features                        |
|-------|----------|---------------------------------|
| Main  | $347/mo  | Pre-game ML, spreads, totals    |
| Props | Contact  | + Player props, derivatives     |
| Live  | Contact  | + Live betting, all leagues     |

- ✅ **14-day free trial**
- ✅ 150+ sportsbooks including Pinnacle
- ✅ Built-in "true line" (vig-removed consensus)
- ✅ Built-in edge detection
- ✅ 5+ years historical data
- ✅ "Trusted by professional betting syndicates"
- ⭐⭐⭐⭐ Reliability: Professional grade

### Unabated (Premium Sharp Option)

- $3,000/mo (personal use)
- ✅ Pinnacle + Circa (sharpest books)
- ✅ Proprietary "Unabated Line" (vig-free)
- ✅ No rate limits, WebSocket
- ✅ Free trial available (schedule call)
- ⭐⭐⭐⭐⭐ Reliability: Industry standard for sharps

### Direct Pinnacle API

- ❌ **Closed to public since July 2025**
- Email api@pinnacle.com for access
- Only for "high value bettors & commercial partnerships"

### Recommendation Path

1. **POC/Validation**: The Odds API free tier (DraftKings as proxy for Pinnacle)
2. **Serious Use**: BetStamp Pro @ $347/mo (14-day trial first)
3. **Scale**: Unabated @ $3,000/mo (if profitable)

## Acceptance Criteria

### Core Flow

1. **Fetch sharp lines** from The Odds API (Pinnacle + others)
2. **Fetch Polymarket prices** from CLOB orderbook
3. **Match markets** by team/event (fuzzy matching needed)
4. **Calculate edge** = Sharp implied prob - Polymarket price
5. **Alert** when edge > threshold (e.g., 5%)

### Market Matching

This is the hard part. Need to match:

- "Los Angeles Lakers" (Pinnacle) → "lakers-vs-celtics" (Polymarket)
- "Spread -4.5" (Pinnacle) → "Lakers (-4.5)" (Polymarket)

Approaches:

- Team name normalization (fuzzy matching)
- Date + sport + teams tuple matching
- Manual mapping table for edge cases

### Edge Calculation

```
# Convert American odds to implied probability
def american_to_prob(odds):
    if odds > 0:
        return 100 / (odds + 100)
    else:
        return abs(odds) / (abs(odds) + 100)

# Example: Lakers -150
pinnacle_prob = american_to_prob(-150)  # = 60%
polymarket_price = 0.52                  # = 52%
edge = pinnacle_prob - polymarket_price  # = 8%

if edge > threshold:
    alert("BUY Lakers Yes @ $0.52, sharp line = 60%")
```

### Alert Output

```
=== EDGE FOUND ===
Sport: NBA
Event: Lakers vs Celtics (Feb 6, 2026)
Market: Lakers Moneyline

Pinnacle:     -150 (60.0%)
Polymarket:   $0.52 (52.0%)
Edge:         8.0%

Polymarket liquidity: $12,450 available @ $0.52
Action: BUY Lakers Yes

Timestamp: 2026-02-06T14:32:15Z
```

### CLI Interface

```bash
# One-shot scan
poly lines

# Continuous monitoring
poly lines --watch

# Filter by sport
poly lines --watch --sport nba

# Minimum edge threshold (default 5%)
poly lines --watch --min-edge 3

# Output to file
poly lines --watch --output edges.json
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Sharp Line Scanner                          │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  The Odds API   │  │  Polymarket     │  │  Market Matcher │
│  (Sharp Lines)  │  │  CLOB API       │  │  (Fuzzy Match)  │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SQLite Cache                                │
│  - sharp_lines (book, sport, event, team, odds, timestamp)     │
│  - poly_prices (slug, outcome, price, size, timestamp)         │
│  - matches (sharp_id, poly_id, match_confidence)               │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Edge Calculator                             │
│  - Convert odds to implied probability                          │
│  - Calculate edge = sharp_prob - poly_price                     │
│  - Filter by threshold                                          │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Alert Emitter                               │
│  - Console output                                               │
│  - JSON file                                                    │
│  - Future: Telegram, Discord, auto-execution                    │
└─────────────────────────────────────────────────────────────────┘
```

### Components

1. **SharpLinesFetcher** - Pulls odds from The Odds API
   - Handles auth, rate limits
   - Normalizes to common format
   - Caches to avoid redundant calls

2. **PolymarketFetcher** - Pulls prices from CLOB
   - Reuse from existing arb scanner
   - WebSocket for real-time updates

3. **MarketMatcher** - Links sharp lines to Polymarket markets
   - Team name normalization
   - Sport/date/type matching
   - Confidence scoring
   - Manual override table

4. **EdgeCalculator** - Finds profitable opportunities
   - Odds conversion (American → probability)
   - Edge = sharp - poly
   - Liquidity checking

5. **AlertEmitter** - Outputs opportunities
   - Real-time console
   - JSON logging
   - Future: Telegram/Discord

### Data Flow

```
Every 60 seconds (or WebSocket update):

1. Fetch Pinnacle odds for NBA/NFL/NHL/Soccer
2. Fetch Polymarket sports markets
3. Match markets (cache matches for speed)
4. For each matched pair:
   - Calculate edge
   - If edge > 5%:
     - Check Polymarket liquidity
     - Emit alert
5. Log all edges to SQLite for analysis
```

## Scope

### In Scope (v1)

- The Odds API integration (Pinnacle primary)
- Polymarket CLOB integration (reuse existing code)
- NBA, NFL, NHL moneylines
- Basic team name matching
- Edge calculation and alerting
- SQLite caching

### Out of Scope (v2+)

- Automatic order execution
- Spread/totals matching (more complex)
- Player props
- Live in-game odds
- Multiple sharp book comparison
- Kelly criterion position sizing
- Telegram/Discord alerts

## Realistic Expectations

### Update Frequency

- The Odds API: Updates every 1-5 minutes
- Polymarket: Real-time via WebSocket
- **Bottleneck is sharp line freshness**, not Polymarket

### Edge Decay

- Edges exist because Polymarket is slower to update than Vegas
- Typical edge window: 5-30 minutes
- By the time sharp line updates → Polymarket usually follows
- Need to act fast once edge detected

### Expected Results

Based on 7 analyzed accounts (4 using this strategy):

| Account | ROI | Volume | Approach |
|---------|-----|--------|----------|
| Countryside | +6% | $28M | Highly selective NBA |
| tbs8t | +6% | $3.2M | Moderately selective NBA |
| FeatherLeather | +90% | $2.4M | Highly selective Euro football |
| MrSparklySimpsons | -13% (3-day) / +long-term | $885K | Broad multi-sport |

**Corrected MrSparklySimpsons data**: Previous "+141%" was misleading -- included $1.38M in redemptions from older trades. Actual 3-day window was -13%. However, older redemptions ($500K Bruins, $458K Celta) show long-term profitability.

**Win rates are ~50-54%** at coinflip prices. Edge is thin (1-5% per bet), realized over hundreds of bets. Higher selectivity (Countryside, FeatherLeather) produces better results than broad coverage (MrSparklySimpsons).

Realistic for us:
- 5-20 edges detected per day
- 3-5% average edge per trade
- **50-55% win rate** (NOT 90%+)
- Need $50K+ capital to survive variance
- ROI ~5-10% if selective, breakeven if overbetting

## Risk Profile

**This strategy involves real risk. You can and will lose money on individual bets.**

| Aspect           | Pure Arbitrage          | Sharp Line Betting (this)   |
| ---------------- | ----------------------- | --------------------------- |
| Risk per trade   | Zero                    | **Full loss possible**      |
| Expected outcome | Guaranteed small profit | +EV over many bets          |
| Variance         | None                    | **High**                    |
| Capital at risk  | Locked briefly          | **Locked until resolution** |
| Losing streaks   | Impossible              | **Expected and normal**     |

### Real-World Variance (From Analyzed Accounts)

MrSparklySimpsons 3-day window shows what variance looks like:
- 12 wins, 12 losses (50% win rate)
- Biggest win: +$120K (Maple Leafs ML)
- Biggest loss: -$158K (AC Milan No)
- Net: **-$118K in 3 days** despite using correct strategy

Countryside same period:
- 6 wins, 0 losses visible
- But more selective (fewer, higher-confidence bets)

**Selectivity is the difference between +6% and -13%.** Betting every edge you find leads to overbetting. Filtering for highest-confidence edges is critical.

### Bankroll Guidelines (From Account Data)

| Account | Typical Position | % of Apparent Bankroll |
|---------|-----------------|----------------------|
| Countryside | $100K-$471K | 2-10% |
| tbs8t | ~$100K flat | ~3% |
| MrSparklySimpsons | $4K-$158K | Variable (risky) |

**Bankroll management is critical.** Never bet more than you can afford to lose on any single outcome.

### Kelly Criterion (Future)

Optimal bet sizing for +EV bets:

```
Kelly % = (bp - q) / b
Where:
  b = odds received (payout/cost - 1)
  p = probability of winning (Vegas implied)
  q = probability of losing (1 - p)
```

For Thunder example:

- b = ($1.00 / $0.385) - 1 = 1.60
- p = 0.444, q = 0.556
- Kelly = (1.60 × 0.444 - 0.556) / 1.60 = 9.6% of bankroll

Most practitioners use fractional Kelly (25-50%) to reduce variance.

## Risks & Unknowns

### Critical

- **Market matching accuracy**: How reliably can we match "Los Angeles Lakers" to "lakers-vs-warriors-2026-02-06"? Need to test extensively.

- **Edge freshness**: The Odds API updates every 1-5 min. If Pinnacle moves and we don't see it for 3 min, our "edge" may already be gone.

- **Polymarket liquidity**: Edge means nothing if only $500 available at that price.

### Important

- **The Odds API reliability**: 99.9% uptime claimed, but need to handle outages gracefully.

- **Sports coverage gaps**: Does Polymarket have markets for all games The Odds API covers? Need to audit overlap.

- **Spread/totals complexity**: Moneylines are easy to match. Spreads like "Lakers -4.5" vs "Lakers (-4.5) Spread" need more careful parsing.

### Nice to Resolve

- Should we compare to multiple sharp books (Pinnacle + Circa) or just Pinnacle?
- What's the minimum edge worth trading? 3%? 5%? 10%?
- How do we handle line moves mid-trade (execution risk)?

## Implementation Phases

### Phase 1: Proof of Concept (1-2 days)

- The Odds API account setup
- Fetch NBA moneylines from Pinnacle
- Fetch NBA markets from Polymarket
- Manual market matching (hardcoded)
- Console output of edges

### Phase 2: Automation (2-3 days)

- Fuzzy team name matching
- SQLite caching
- Continuous monitoring mode
- JSON output

### Phase 3: Production (1-2 days)

- WebSocket integration
- Error handling / reconnects
- Edge logging and analytics
- Multiple sports (NFL, NHL, Soccer)

## Cost Summary

| Item                   | Monthly Cost |
| ---------------------- | ------------ |
| The Odds API (100K)    | $59          |
| Polymarket API         | Free         |
| Infrastructure (local) | $0           |
| **Total**              | **$59/mo**   |

Compare to Unabated ($3,000/mo) - start cheap, upgrade if profitable.

## POC Validation (2026-02-05)

### Live Test: The Odds API + Polymarket Scanner

We built and ran a live scanner comparing DraftKings odds (via The Odds API free tier) to Polymarket prices.

**Script**: `data/accounts/countryside/2026-02-05/poc-live-comparison.ts`

```bash
bun run poc-live-comparison.ts
```

### Results: NBA Championship Futures

| Team | Vegas (DK) | Polymarket | Edge | Signal |
|------|------------|------------|------|--------|
| **Denver Nuggets** | 17.4% | 11.5% | **+5.9%** | 🟢 BUY |
| **Minnesota Timberwolves** | 7.7% | 4.3% | **+3.4%** | 🟢 BUY |
| **Oklahoma City Thunder** | 41.7% | 38.5% | **+3.2%** | 🟢 BUY |
| Cleveland Cavaliers | 8.3% | 5.8% | +2.5% | ⚪ |
| New York Knicks | 7.1% | 5.5% | +1.6% | ⚪ |
| Detroit Pistons | 5.9% | 5.7% | +0.2% | ⚪ |
| Boston Celtics | 6.3% | 6.2% | +0.1% | ⚪ |

**3 BUY signals detected** with edges > 3%.

### Results: Tonight's NBA Games

Scanner fetched 8 games with moneyline odds:
- Brooklyn Nets @ Orlando Magic
- Washington Wizards @ Detroit Pistons
- Utah Jazz @ Atlanta Hawks
- Chicago Bulls @ Toronto Raptors
- Charlotte Hornets @ Houston Rockets
- San Antonio Spurs @ Dallas Mavericks
- Golden State Warriors @ Phoenix Suns
- Philadelphia 76ers @ Los Angeles Lakers

(Daily game markets on Polymarket had already resolved)

### Validation Summary

| Test | Status |
|------|--------|
| API authentication | ✅ Works |
| Fetch Vegas odds | ✅ DraftKings, FanDuel, BetMGM, BetRivers |
| Fetch Polymarket prices | ✅ Works |
| Team name matching | ✅ Works |
| Edge calculation | ✅ Found 3 opportunities |
| Historical odds | ❌ Requires paid tier |
| Pinnacle odds | ❌ Requires paid tier |

**Conclusion**: POC validated. Scanner finds real edges. Upgrade to paid tier for Pinnacle + historical data.

### Backtest: Resolved Trades Across Accounts

**Countryside** (6/6 wins):

| Event | Entry | Result | ROI |
|-------|-------|--------|-----|
| MIN @ MEM spread | $0.28 | Win | 257% |
| BOS @ HOU spread | $0.34 | Win | 194% |
| DEN @ DET spread | $0.44 | Win | 127% |
| PHX @ POR spread | $0.54 | Win | 85% |
| NOP @ CHA ML | $0.69 | Win | 45% |
| SUN vs BUR | $0.52 | Win | 92% |

**tbs8t** (7/13 wins, 54%):
- Biggest win: Grizzlies ML @ $0.28 → +257%
- Biggest win: Celtics ML @ $0.30 → +235%
- Several $100K losses on spread/favorite bets
- Same games as Countryside but sometimes OPPOSITE sides (NOP @ CHA)
- Confirms independent operators finding same edges

**MrSparklySimpsons** (12/24, 50%):
- Top wins: Maple Leafs +$120K, Senators +$117K, Nuggets O/U +$52K
- Top losses: AC Milan No -$158K, Timberwolves -$108K, Pelicans O/U -$61K
- "Both-sides" trades are correlated multi-market bets, NOT hedging (e.g., Bologna Yes + AC Milan No = same directional view; both lost = -$192K)

**Cross-account validation**: Countryside and tbs8t traded the same NBA games in the same 3-day window. Countryside was more selective and went 6/6. tbs8t bet more aggressively and went 7/13. Both are profitable long-term, but selectivity matters enormously.

**Conclusion**: Strategy is validated across multiple independent accounts. Edges exist. Higher selectivity = better outcomes.

## Sources

- [The Odds API](https://the-odds-api.com/) - Primary sharp lines source
- [SportsGameOdds](https://sportsgameodds.com/) - Alternative API
- [Unabated API](https://unabated.com/get-unabated-api) - Premium option
- [Pinnacle API Docs](https://github.com/pinnacleapi/pinnacleapi-documentation) - Direct access (closed)
- [Polymarket CLOB WebSocket](https://docs.polymarket.com/developers/CLOB/websocket/wss-overview) - Real-time prices
- [Betfair Developer Portal](https://developer.betfair.com/) - Exchange API (free)
