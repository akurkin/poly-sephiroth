# FeatherLeather Strategy Analysis

**Address**: `0xd25c72ac0928385610611c8148803dc717334d20`
**Analyzed**: 2026-02-05

## Facts
- 612 trades over 5 days (122 trades/day)
- $2.4M volume, $2.16M estimated profit (**90% return**)
- **100% buy ratio** (zero sells)
- All European football: AC Milan 36%, FC Midtjylland 30%, Lorient 14%, Cagliari 11%, PSG 10%
- Position sizes: $300K-$900K per match
- All positions resolved profitably (5/5 wins)

## Patterns Observed

| Pattern | Implication |
|---------|-------------|
| 100% buy, 0% sell | Holds to resolution, never exits early |
| Single-sided per market | Pure directional conviction, no hedging |
| High-frequency accumulation | Sweeps orderbook to build max position |
| $300K-$900K positions | Extreme conviction + bankroll |
| European football only | Domain specialization |
| Pre-match entry prices (0.38-0.61) | Betting before match, not live trading |

## Hypothesis

**Predictive Sports Bettor**: Professional with superior model or information edge on European football. Identifies Polymarket mispricing vs true probability, then aggressively accumulates before resolution.

## Evidence
- 100% buy ratio = conviction betting, not arbitrage
- 90% return impossible for arb (which yields 2-5%)
- 5/5 correct predictions on large bets
- Willing to move price 3 cents while accumulating (indicates strong edge conviction)
- Lorient "No" at 0.49-0.50 = contrarian view, not naive favorite-betting

## Contradicting Evidence
None. Pattern is extremely consistent.

## Conclusion

| Attribute | Value |
|-----------|-------|
| **Strategy** | Predictive Sports Bettor |
| **Confidence** | High (95%) |
| **Edge Source** | Superior forecasting model or information advantage on European football |
| **Replicability** | Hard - requires genuine predictive edge |

## Key Trades

| Market | Side | Entry Price | Volume | Payout |
|--------|------|-------------|--------|--------|
| AC Milan | Yes | 0.38-0.41 | $926K | $2.33M |
| PSG | Yes | 0.60-0.61 | $640K | $1.06M |
| FC Midtjylland | Yes | ~0.50 | $295K | - |
| Cagliari | Yes | ~0.50 | $285K | - |
| Lorient | No | 0.49-0.50 | $256K | - |

## Takeaway

This is **NOT arbitrage**. The 90% return on $2.4M in 5 days comes from correctly predicting 5 consecutive European football matches with massive conviction bets. This is expert sports betting requiring genuine forecasting skill or information access.
