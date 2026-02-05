# Countryside Strategy Analysis

**Address**: `0xbddf61af533ff524d27154e589d2d7a81510c684`
**Analyzed**: 2026-02-05

## Facts

| Metric | Value |
|--------|-------|
| Lifetime Volume | $28.04M |
| Lifetime Profit | $1.67M (6% ROI) |
| Sample Trades | 3,091 buys, 0 sells |
| Sample Volume | $1.26M |
| Events Traded | 12 (11 NBA, 1 EPL) |
| Win Rate | 6/6 resolved (100%) |

## Trade Distribution

- 50% under $10 (order splitting)
- Multiple orders at identical timestamps (up to 16 at once)
- Algorithmic execution pattern

## Event Concentration

| Event | Trades | Volume | Avg Price | Result |
|-------|--------|--------|-----------|--------|
| MEM @ SAC | 1,067 | $471K | 0.50 | Pending |
| PHI @ GSW | 537 | $251K | 0.56 | Pending |
| BOS @ HOU | 276 | $110K | 0.34 | **+$143K** |
| NOP @ CHA | 241 | $27K | 0.69 | **+$68K** |
| DEN @ DET | 226 | $26K | 0.44 | **+$11K** |

## Resolved Events (6/6 Wins)

| Event | Entry | Invested | Redeemed | ROI |
|-------|-------|----------|----------|-----|
| MIN @ MEM | Underdog ~0.28 | $48K | $431K | **795%** |
| BOS @ HOU | Underdog ~0.34 | $110K | $253K | **130%** |
| NOP @ CHA | Favorite ~0.69 | $27K | $96K | **248%** |
| PHX @ POR | ~0.58 | $168K | $291K | **73%** |
| SUN vs BUR (EPL) | ~0.47 | $40K | $85K | **112%** |
| DEN @ DET | ~0.44 | $26K | $37K | **43%** |

## Patterns Observed

| Pattern | Implication |
|---------|-------------|
| 100% buy ratio | Holds to resolution, never hedges |
| 1000+ trades per game | Algorithmic order splitting |
| 16 orders at same timestamp | Bot execution |
| Underdog bias (7/12 events) | Contrarian edge |
| Spread + Moneyline stacking | Correlated bets on game outcome |
| Zero sells | High model confidence |

## Hypothesis

**Algorithmic Sharp Sports Betting / NBA Odds Arbitrage**

Sophisticated sports betting operation that:
1. Uses external sharp lines or proprietary model to identify mispriced NBA outcomes
2. Deploys algorithmic order splitting to minimize market impact
3. Focuses on underdogs where Polymarket lags true probability
4. Trades both moneylines and spreads to maximize edge extraction

## Evidence

- **100% win rate** on 6 resolved events (1.5% probability if random)
- **Highest ROI on underdogs**: Grizzlies 795%, Celtics 130%, Hornets 248%
- **Order execution**: 16 simultaneous orders = programmatic trading
- **Position sizing**: $471K on single game shows high conviction
- **Spread + ML stacking**: Rockets -6.5 AND Celtics ML on same game

## Contradicting Evidence

- One EPL match doesn't fit pure NBA specialization
- Web profile shows 308 trades vs 3,091 in data (different counting method)

## Conclusion

| Attribute | Value |
|-----------|-------|
| **Strategy** | Algorithmic Sharp Sports Betting |
| **Confidence** | High (85%) |
| **Edge Source** | Sharp line comparison or proprietary NBA model |
| **Replicability** | Hard |

## Key Insight

This is a **sports bettor using Polymarket as an alternative venue with softer lines**, not a prediction market native. The 100% win rate and underdog focus strongly suggest arbitrage between Polymarket and sharp sportsbooks, or a model that outperforms crowd pricing.

## Requirements to Replicate

- Access to sharp bookmaker lines (Pinnacle, Circa)
- Algorithmic trading infrastructure
- $500K+ capital
- NBA domain expertise
- Low-latency order execution
