# MrSparklySimpsons Strategy Analysis

## Facts
| Metric | Value |
|--------|-------|
| Trades | 978 (3 days) |
| Volume | $1.6M |
| Est. P&L | **+$660K** (+41%) |
| Buy Ratio | 99.9% (977 buys, 1 sell) |
| Trades/Day | 326 |
| Categories | NHL 35%, Soccer 31%, NBA 27% |

## Patterns
- Near-100% buy ratio: NOT market-neutral
- 41% return: Far exceeds arbitrage margins (2-3%)
- Team-specific concentration: Lightning $335k, Senators $132k
- Sports focus: Domain expertise signal
- High velocity: Bot-assisted execution

## Hypothesis
**Directional Sports Prediction**: Using statistical model to identify mispriced Polymarket odds vs true probability, likely comparing to Vegas lines.

## Evidence
- Buy ratio eliminates arbitrage/market-making
- Profit margin eliminates arbitrage (would be 2-3%)
- Sports concentration suggests domain model
- Large single-team bets suggest conviction from edge
- Consistent profitability suggests systematic approach

## Conclusion
| | |
|-|-|
| **Strategy** | Predictive sports model with automated execution |
| **Confidence** | High (90%) |
| **Edge Source** | Polymarket inefficiency vs Vegas/model |
| **Replicability** | Medium - requires building prediction model |

## Next Steps
1. Build Vegas line comparison (see RESEARCH.md "Vegas Line Comparison")
2. Start with simple edge detection: Polymarket price vs Vegas implied
3. Paper trade to validate before capital deployment
