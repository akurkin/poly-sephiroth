# fkblg Strategy Analysis

## Facts
| Metric | Value |
|--------|-------|
| Trades | 928 (2.5 days) |
| Volume | $556K |
| Est. P&L | **-$36K** (-6.5%) |
| Buy Ratio | **99.8%** (926 buys, 2 sells) |
| Trades/Day | 375 |
| Categories | LoL 75%, NBA 16%, CS2 8% |

## Patterns
- **99.8% buys, only 2 sells**: Never exits, holds to resolution
- **Both-sides on 10 events**: Bought BOTH outcomes (e.g., LGD AND OMG)
- **76% trades <60s apart**: Automated/rapid execution
- **Live match trading**: All events dated Feb 2-4, trading during games
- **Price chasing**: Bought OMG at $0.16, then at $0.99 when winning

## Hypothesis
**Failed Live Odds Chaser**

Gambles on live esports/NBA, buys one side, then buys the OTHER side as match progresses. Not hedging (no sells) - just chasing momentum both ways.

**Example (LGD vs OMG):**
1. Bought OMG @ 0.16
2. Bought OMG @ 0.99 (winning)
3. Switched to LGD @ 0.54 as match shifted
4. Result: Paid >$1 combined for $1 payout

## Conclusion
| | |
|-|-|
| **Strategy** | Emotional live gambler with pseudo-hedging |
| **Confidence** | High (90%) |
| **Edge Source** | **None. Negative edge.** |
| **Replicability** | Do not replicate |

## Warning
This account is **subsidizing market makers**. Buying both sides at different times without selling = paying spread twice. Guaranteed loss over time. The -6.5% return is worse than random chance.
