# Polymarket Trading Research

## Overview

Research conducted on 2026-02-03 analyzing Polymarket arbitrage opportunities and reverse-engineering successful trader strategies.

---

## Repository Analysis

### polymarket-trading-bot (this repo)

**Purpose**: Executes simple YES+NO arbitrage trades

| Aspect        | Details                                            |
| ------------- | -------------------------------------------------- |
| Lines of code | ~10,000                                            |
| Strategy      | Single-condition arbitrage (YES + NO < $1)         |
| Execution     | Real-time WebSocket (1500 markets)                 |
| Risk mgmt     | Execution locks, balance tracking, auto-redemption |
| Status        | Production ready                                   |

### polymarket-arbitrage-bot (sibling repo)

**Purpose**: Detects arbitrage opportunities (no execution)

| Aspect        | Details                                                    |
| ------------- | ---------------------------------------------------------- |
| Lines of code | ~960                                                       |
| Strategies    | Single-condition, NegRisk (29x efficiency), Whale tracking |
| Execution     | None (alerts only)                                         |
| Data source   | IMDEA research ($39.59M documented)                        |

### Gap Analysis

| Strategy         | Historical Profit | trading-bot | arbitrage-bot |
| ---------------- | ----------------- | ----------- | ------------- |
| Single-condition | $10.58M           | Executes    | Detects       |
| NegRisk          | $28.99M           | Missing     | Detects       |
| Whale tracking   | Included          | Missing     | Detects       |

**Opportunity**: Merge NegRisk detection into trading-bot executor for 3.7x larger opportunity pool.

---

## Academic Foundation

### Key Papers

1. **arxiv:1606.02825** - "Arbitrage-Free Combinatorial Market Making via Integer Programming"
   - Frank-Wolfe algorithm for Bregman projection
   - IP/ILP oracle for constraint solving
   - Tested on NCAA Tournament (2^63 outcome space)

2. **arxiv:2508.03474** - "Unravelling the Probabilistic Forest: Arbitrage in Prediction Markets"
   - Analyzed 86M Polymarket trades
   - Documented $39.59M arbitrage extraction (Apr 2024 - Apr 2025)
   - Two types: Market Rebalancing + Combinatorial Arbitrage

### Algorithm Overview: Frank-Wolfe + ILP

```
Purpose: Find optimal trades across correlated multi-outcome markets

Loop:
  1. Compute gradient (which direction is profitable?)
  2. Call ILP oracle (find best simple trade in that direction)
  3. Blend with current portfolio
  4. Repeat until converged

Why it works:
- Convex optimization guarantees convergence
- ILP handles discrete constraints (can't buy 0.5 shares)
- Handles exponentially large outcome spaces efficiently
```

**When to use**: Correlated markets (same event/league) with logical dependencies.

**Not needed for**: Simple YES+NO arbitrage on independent markets.

---

## MrSparklySimpsons Analysis

### Profile Summary

| Metric          | Value                                      |
| --------------- | ------------------------------------------ |
| Wallet          | 0xd0b4c4c020abdc88ad9a884f999f3d8cff8ffed6 |
| Total Profit    | ~$1.5M                                     |
| Trading Volume  | $71.5M                                     |
| Markets Traded  | 812                                        |
| Account Created | October 2025                               |

### Initial Hypothesis: Arbitrage Bot

Based on Twitter claims and volume patterns, initially hypothesized sophisticated Frank-Wolfe/ILP arbitrage.

### Actual Finding: Directional Sports Betting

**API Analysis** (data-api.polymarket.com/activity):

```
Total trades:    978
Buy vs Sell:     977 BUYS, 1 SELL
Trade volume:    $1.6M
Redeem volume:   $2.26M
Implied profit:  ~40%
```

**This is NOT arbitrage.** Arbitrage would show:

- Equal buys on both sides of same market
- ~2-3% profit margins
- High sell activity (closing positions)

**This IS directional betting with predictive edge:**

- 977 buys, 1 sell = taking directional risk
- 40% profit = far exceeds arbitrage margins
- Team-specific large bets = conviction plays

### Betting Patterns

| Outcome        | Volume | Avg Price | Type                   |
| -------------- | ------ | --------- | ---------------------- |
| "No" (spreads) | $643k  | 0.67      | Favorites cover spread |
| Lightning      | $335k  | 0.67      | NHL team pick          |
| Senators       | $132k  | 0.53      | NHL team pick          |
| Maple Leafs    | $130k  | 0.52      | NHL team pick          |
| Timberwolves   | $108k  | 0.72      | NBA favorite           |
| "Yes" (props)  | $73k   | 0.34      | Underdog/longshot      |
| Over/Under     | $93k   | 0.49-0.53 | Totals betting         |

### Sports Distribution

```
NHL:     341 trades (35%)
NBA:     261 trades (27%)
Soccer:  306 trades (31%) - SPL, Turkish, Eredivisie, Argentine
Other:   70 trades (7%) - Tennis, CS2, etc.
```

### Strategy Interpretation

MrSparklySimpsons likely uses:

1. **Sports prediction model** - ML/statistical model for game outcomes
2. **Edge detection** - Identifies where Polymarket odds differ from true probability
3. **Bankroll management** - Kelly criterion or similar for position sizing
4. **Automated execution** - Bot places bets when edge detected

**Expected Value Formula:**

```
If market price = $0.52 (implies 52% win probability)
If model predicts = 60% win probability

EV = (0.60 × $1.00) - $0.52 = $0.08 (15% edge per dollar)
```

### Multi-Market Correlation (Within Same Game)

Found instances of betting multiple props within same game:

```
NHL Toronto vs Calgary:
- Maple Leafs win: $130k @ 0.52
- Under 6.5 goals: $2k @ 0.53

NBA New Orleans vs Charlotte:
- Hornets win: $129 @ 0.50
- Over total: $21k @ 0.49
```

This suggests understanding of game correlations (e.g., defensive team wins + low scoring game).

---

## Arbitrage Strategies Explained

### 1. Single-Condition Arbitrage

```
When: YES price + NO price < $1.00
Action: Buy both
Profit: Guaranteed (one must win, pays $1)

Example:
  YES = $0.48
  NO  = $0.49
  Total = $0.97
  Profit = $0.03 (3.1%)
```

**Historical extraction**: $10.58M across 7,051 conditions

### 2. NegRisk Rebalancing (Multi-Outcome)

```
When: Sum of all outcome prices < $1.00 (or > $1.00)
Action: Buy (or sell) all outcomes proportionally
Profit: Guaranteed

Example (4-way market):
  Candidate A = $0.35
  Candidate B = $0.32
  Candidate C = $0.20
  Candidate D = $0.10
  Total = $0.97
  Profit = $0.03 per set

Capital efficiency: 29x better than single-condition
```

**Historical extraction**: $28.99M across 662 markets

### 3. Combinatorial Arbitrage

```
When: Logically connected markets have inconsistent prices
Action: Trade across multiple markets to lock in profit

Example:
  "Trump wins" = 55%
  "GOP wins Senate" = 60%
  "Trump + GOP Senate" = 40%  <- Should be ≤ 55%

  If joint probability is mispriced, arbitrage exists
```

**Requires**: Frank-Wolfe/ILP optimization to find optimal trades

### 4. Whale Tracking (Signal-Based)

```
When: Large traders (>$5k) show directional imbalance
Action: Follow the smart money
Expected edge: 61-68% accuracy at T+15 to T+60 minutes
```

**Not risk-free** - correlation-based, not guaranteed profit

---

## Technical Implementation Options

### Current Stack (Python)

```
Scanner:  asyncio + websockets (1500 markets)
Executor: aiohttp + web3.py (EIP-712 signing)
Database: aiosqlite
```

### Proposed Stack (Bun/TypeScript)

```
Scanner:  Native WebSocket
Executor: viem (faster EIP-712)
Database: bun:sqlite (native)
Optimizer: highs-js (WASM ILP solver)
```

**Advantages of Bun**:

- 4x faster startup
- Native TypeScript
- viem superior to web3.py for signing
- Native SQLite bindings

### Frank-Wolfe Implementation Feasibility

| Component      | Python         | TypeScript          |
| -------------- | -------------- | ------------------- |
| Linear algebra | numpy          | mathjs, ml-matrix   |
| Frank-Wolfe    | scipy / manual | Manual (~100 lines) |
| ILP solver     | cvxpy, PuLP    | highs-js (WASM)     |

**Estimated effort**: 3-4 weeks for full TypeScript implementation

---

## Market Timing

### Opportunity Window

| Timeline        | Spread Levels | Opportunity        |
| --------------- | ------------- | ------------------ |
| Now (Month 0-6) | 10-15 cents   | Maximum extraction |
| Month 6-12      | 3-5 cents     | 50-70% degradation |
| Month 12-18     | 0.5-2 cents   | Retail extinct     |

**Driver**: ICE's $2B investment in Polymarket (Oct 2025) signals institutional entry.

### Research-Backed Performance

**Top arbitrage performer** (IMDEA study):

- Total profit: $2,009,631.76
- Transactions: 4,049 (12 months)
- Average per trade: $496
- Frequency: 11+ trades/day

---

## Key Insights

### What Works

1. **NegRisk > Single-condition**: 29x capital efficiency, 73% of profits
2. **Speed matters**: Opportunities exist for seconds
3. **Automation required**: Manual trading can't compete
4. **Sports prediction models**: Can generate 40%+ returns (MrSparklySimpsons)

### What Doesn't Work

1. **Random market selection**: Frank-Wolfe needs correlated markets
2. **Manual execution**: Too slow for arbitrage
3. **Small capital**: Need $50k+ for meaningful returns
4. **US-based trading**: Geo-restricted (need EU VPS)

### Open Questions

1. What prediction model does MrSparklySimpsons use?
2. Is the 40% return sustainable or a hot streak?
3. How much of their edge is model vs execution speed?
4. Are they using any hedging we didn't detect?

---

## Prediction Model Analysis

### The Math Behind 40% Returns

```
Average buy price: ~0.57 (from MrSparklySimpsons data)
Break-even win rate: 57%
Actual win rate needed for 40% profit: ~70-75%

Edge = Actual win rate - Implied win rate
Edge = 70% - 57% = 13% edge per bet
```

This is a **massive edge**. Professional sports bettors typically target 2-5% edge.

### Why Polymarket Is Beatable

| Factor            | Vegas                  | Polymarket             |
| ----------------- | ---------------------- | ---------------------- |
| Liquidity         | $100M+ per game        | $10k-500k              |
| Bettors           | Sharps + syndicates    | Retail + crypto degens |
| Line accuracy     | 97-99% efficient       | Unknown, likely less   |
| Information speed | Instant injury updates | Delayed                |
| Arbitrage         | Heavily monitored      | Less competition       |

**Key insight**: You don't need to beat Vegas. You need to beat Polymarket's crowd.

### Model Types

#### 1. Vegas Line Comparison (Easiest)

```python
def find_edge(polymarket_price, vegas_line):
    vegas_implied = convert_to_probability(vegas_line)
    poly_implied = polymarket_price

    edge = vegas_implied - poly_implied

    if edge > 0.03:  # 3%+ edge
        return BET_YES
    elif edge < -0.03:
        return BET_NO
```

**Why it works**: Vegas lines are set by professionals with billions at stake. Polymarket prices are set by retail. When they diverge, trust Vegas.

**Expected edge**: 3-8% on mispriced markets

#### 2. ELO Rating System

```python
def expected_score(rating_a, rating_b):
    return 1 / (1 + 10 ** ((rating_b - rating_a) / 400))

def update_elo(winner_rating, loser_rating, k=32):
    expected = expected_score(winner_rating, loser_rating)
    winner_new = winner_rating + k * (1 - expected)
    loser_new = loser_rating + k * (0 - expected)
    return winner_new, loser_new
```

**Enhancements**:

- Home court adjustment (+3-4% for home team)
- Recent form (weight last 10 games more)
- Head-to-head history
- Rest days / back-to-back games

**Expected edge**: 2-5% if well-calibrated

#### 3. Feature-Based ML Model

```python
features = {
    # Team strength
    'elo_rating': float,
    'offensive_rating': float,
    'defensive_rating': float,
    'net_rating': float,

    # Recent form
    'last_10_wins': int,
    'last_10_point_diff': float,
    'win_streak': int,

    # Situational
    'is_home': bool,
    'rest_days': int,
    'travel_distance': float,
    'back_to_back': bool,

    # Injuries
    'injured_player_war': float,

    # Historical
    'h2h_record': float,
    'vs_division': float,

    # Market
    'vegas_line': float,
    'line_movement': float,
    'polymarket_price': float,
}

model = XGBoost(objective='binary:logistic')
prediction = model.predict_proba(features)
```

**Expected edge**: 5-10% with good features and training data

#### 4. Sharp Money Tracking

```python
def track_line_movement(market_id):
    history = get_price_history(market_id)

    # Sharp money moves lines early
    early_move = history[0:30min].price_change

    # Retail money comes late
    late_move = history[-60min:].price_change

    # If early and late disagree, follow early (sharps)
    if early_move > 0.02 and late_move < -0.01:
        return FADE_LATE_MONEY
```

**Expected edge**: 3-7% on high-volume markets

### Likely MrSparklySimpsons Stack

```
┌─────────────────────────────────────────────────┐
│         MrSparklySimpsons Stack                 │
├─────────────────────────────────────────────────┤
│  1. DATA INGESTION                              │
│     - Vegas lines (Pinnacle, Bookmaker)         │
│     - Team stats (NBA API, NHL API)             │
│     - Injury reports (Twitter, official)        │
│     - Polymarket prices                         │
│                                                 │
│  2. EDGE DETECTION                              │
│     - Compare Polymarket vs Vegas implied       │
│     - Flag when gap > 3%                        │
│     - Boost confidence with model agreement     │
│                                                 │
│  3. POSITION SIZING (Kelly Criterion)           │
│     - edge = model_prob - market_prob           │
│     - kelly = edge / (1 - market_prob)          │
│     - bet_size = bankroll * kelly * 0.25        │
│                                                 │
│  4. EXECUTION                                   │
│     - Automated when edge detected              │
│     - Split large orders to reduce slippage     │
│     - Hold until resolution                     │
└─────────────────────────────────────────────────┘
```

### Kelly Criterion (Position Sizing)

```python
def kelly_bet(win_prob, market_price):
    """
    Kelly Criterion: Optimal bet size for long-term growth
    """
    odds = 1 / market_price
    kelly = (win_prob * odds - 1) / (odds - 1)
    return kelly * 0.25  # 25% of full Kelly (safer)

# Example: Lightning bet
model_prob = 0.75      # Model says 75% to win
market_price = 0.67    # Market says 67%
bankroll = 500000

kelly = kelly_bet(0.75, 0.67)  # ~0.24
bet_size = bankroll * kelly * 0.25  # ~$30k per bet
```

### Is 40% Sustainable?

| Scenario                               | Likelihood                       |
| -------------------------------------- | -------------------------------- |
| Exceptional model + inefficient market | Possible (early mover advantage) |
| Hot streak / variance                  | Likely contributor               |
| Polymarket significantly inefficient   | Probable                         |
| Inside information                     | Can't rule out                   |

**Reality check**:

- 40% over 3 months could be 20% edge + 20% variance
- Sharpe ratio of ~2-3 (very good but not impossible)
- As Polymarket matures, edge will compress

### Model Complexity vs Expected Edge

| Model Type       | Complexity | Expected Edge | Build Time |
| ---------------- | ---------- | ------------- | ---------- |
| Vegas comparison | Low        | 3-8%          | 1 week     |
| ELO system       | Medium     | 2-5%          | 2 weeks    |
| ML model         | High       | 5-10%         | 4-8 weeks  |
| Full stack       | Very High  | 10-15%        | 8-12 weeks |

### Data Sources for Prediction Bot

```
Vegas Lines:
- Pinnacle API (sharpest book)
- OddsAPI ($50/mo aggregator)
- Bovada/BetOnline (US-facing)

Team Statistics:
- NBA: stats.nba.com (free)
- NHL: api.nhle.com (free)
- Soccer: football-data.org (free tier)

Injuries/News:
- Twitter API (real-time)
- RotoWire (subscription)
- ESPN injury reports

Polymarket:
- CLOB API (free, real-time)
- data-api.polymarket.com (activity)
```

### Minimum Viable Prediction Bot

```typescript
// 1. Get Vegas lines
const vegasLine = await fetchPinnacle(gameId);

// 2. Get Polymarket price
const polyPrice = await fetchPolymarket(marketId);

// 3. Calculate edge
const vegasImplied = 1 / (1 + 10 ** (-vegasLine / 400));
const edge = vegasImplied - polyPrice;

// 4. If edge > 3%, bet
if (edge > 0.03) {
  const kellyFraction = edge / (1 - polyPrice);
  const betSize = bankroll * kellyFraction * 0.25;
  await placeBet(marketId, "YES", betSize);
}
```

**The alpha isn't in model complexity - it's in Polymarket being inefficient vs Vegas.**

---

## Next Steps

### If Building Arbitrage Bot

1. Add NegRisk detection to trading-bot executor
2. Implement market correlation detection
3. Consider Bun/TypeScript rewrite for performance
4. Deploy on EU VPS

### If Building Prediction Bot

1. Research sports prediction models (ELO, ML, etc.)
2. Build backtesting framework against historical Polymarket odds
3. Implement Kelly criterion for position sizing
4. Start with paper trading to validate edge

### If Using Frank-Wolfe/ILP

1. Study arxiv:1606.02825 algorithm in detail
2. Implement in TypeScript with highs-js
3. Focus on election/political markets (more correlations)
4. Backtest on historical multi-outcome markets

---

## Data Sources

### APIs Used

```bash
# Activity data
curl 'https://data-api.polymarket.com/activity?user=ADDRESS&limit=100'

# Market data
curl 'https://clob.polymarket.com/markets'

# Orderbook
curl 'https://clob.polymarket.com/book?token_id=TOKEN_ID'

# Gamma API (backup)
curl 'https://gamma-api.polymarket.com/markets'
```

### Research Sources

- [IMDEA Networks: Arbitrage in Prediction Markets](https://arxiv.org/abs/2508.03474)
- [Combinatorial Market Making via ILP](https://arxiv.org/abs/1606.02825)
- [RuneSats GitHub](https://github.com/runesatsdev)
- [Polymarket Analytics](https://polymarketanalytics.com/traders)

---

_Last updated: 2026-02-03_
