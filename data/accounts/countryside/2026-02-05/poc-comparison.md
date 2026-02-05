# Live POC: Vegas vs Polymarket Comparison

**Date**: 2026-02-05
**Market**: 2026 NBA Championship

## Raw Data

### Vegas Odds (from [Yahoo Sports](https://sports.yahoo.com/articles/2026-nba-championship-odds-thunder-150100421.html), [FOX Sports](https://www.foxsports.com/stories/nba/2025-2026-nba-championship-odds))

| Team | American Odds | Implied Prob |
|------|---------------|--------------|
| Thunder | +125 | 44.4% |
| Celtics | +1200 | 7.7% |
| Cavaliers | +2800 | 3.4% |
| Knicks | ~+3000 | ~3.2% |
| Rockets | ~+4000 | ~2.4% |

### Polymarket Prices (live)

| Team | Price | Implied Prob |
|------|-------|--------------|
| Thunder | $0.385 | 38.5% |
| Celtics | $0.063 | 6.3% |
| Cavaliers | $0.058 | 5.8% |
| Knicks | $0.055 | 5.5% |
| Rockets | $0.045 | 4.5% |

## Edge Calculation

```
Edge = Vegas Implied Prob - Polymarket Price
```

| Team | Vegas | Polymarket | Edge | Signal |
|------|-------|------------|------|--------|
| **Thunder** | 44.4% | 38.5% | **+5.9%** | 🟢 BUY (underpriced) |
| Celtics | 7.7% | 6.3% | +1.4% | Neutral |
| Cavaliers | 3.4% | 5.8% | -2.4% | 🔴 Avoid (overpriced) |
| Knicks | 3.2% | 5.5% | -2.3% | 🔴 Avoid (overpriced) |
| Rockets | 2.4% | 4.5% | -2.1% | 🔴 Avoid (overpriced) |

## Key Finding

**Thunder are 5.9% underpriced on Polymarket vs Vegas.**

- Vegas says Thunder have 44.4% chance
- Polymarket says 38.5% chance
- If Vegas is "true", buying Thunder at $0.385 has positive expected value

### Expected Value

```
EV = (Win Prob × Payout) - Cost
EV = (0.444 × $1.00) - $0.385
EV = $0.444 - $0.385
EV = +$0.059 per dollar bet (5.9% edge)
```

## Caveats

1. **Vegas vig**: Vegas odds include ~4-5% vig, so true prob slightly lower
2. **Polymarket fees**: ~1% on profits
3. **Time value**: Money locked until June 2026
4. **Line movement**: Both lines will move

## Validation

This POC shows:
1. ✅ We can get Vegas odds (even without API, from news)
2. ✅ We can get Polymarket prices (Gamma API)
3. ✅ We can calculate edges
4. ✅ Edges exist (5.9% on Thunder)

## Automation Path

To automate this:

```
1. The Odds API → Get NBA Championship futures (Pinnacle)
2. Polymarket API → Get 2026-nba-champion market
3. Match teams by name
4. Calculate edges
5. Alert when edge > 3%
```

Cost: $59/mo for The Odds API with Pinnacle included.
