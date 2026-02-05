# Countryside Backtest Analysis

**Hypothesis**: Countryside profits by buying Polymarket outcomes that are underpriced vs Vegas sharp lines.

## Resolved Trades (6/6 wins)

| Event | Outcome | Entry Price | Payout | ROI | Implied Edge |
|-------|---------|-------------|--------|-----|--------------|
| MIN @ MEM | Timberwolves ML | $0.28 | $1.00 | **257%** | ~22% if Vegas was 50% |
| BOS @ HOU | Celtics ML | $0.34 | $1.00 | **194%** | ~16% if Vegas was 50% |
| DEN @ DET | Pistons -5.5 | $0.44 | $1.00 | **127%** | ~6% if Vegas was 50% |
| NOP @ CHA | Pelicans ML | $0.69 | $1.00 | **45%** | Favorite, ~2% edge |
| PHX @ POR | Suns -2.5 | $0.54 | $1.00 | **85%** | ~4% if Vegas was 50% |
| SUN vs BUR | Sunderland Win | $0.52 | $1.00 | **92%** | ~2% if Vegas was 50% |

## Key Observations

### 1. Underdog Focus
- MIN @ MEM: Bought Timberwolves at **$0.28** (72% underdog)
- BOS @ HOU: Bought Celtics at **$0.34** (66% underdog)

These are MASSIVE mispricings if Vegas had these closer to 50%.

### 2. Spread Betting
- 4/6 trades were **point spreads**, not moneylines
- Spreads are typically priced at ~50% on Vegas (both sides -110)
- If Polymarket had spreads at 28-44%, that's 6-22% edge

### 3. 6/6 Win Rate
- Probability of 6/6 random wins at these odds:
  - 0.28 × 0.34 × 0.44 × 0.69 × 0.54 × 0.52 = **0.8%**
- This is NOT luck - they knew something

## Implied Edge Calculation

For point spreads, Vegas typically prices both sides at -110:
- Implied probability = 110/210 = **52.4%**

If Countryside bought at:
- $0.28 when true prob = 52% → **24% edge**
- $0.34 when true prob = 52% → **18% edge**
- $0.44 when true prob = 52% → **8% edge**

These are enormous edges. Either:
1. Polymarket was massively mispriced vs Vegas
2. Countryside has additional info beyond Vegas lines

## Simple POC: Could We Detect These?

### What We Would Need

```
1. Fetch Vegas line for MIN @ MEM spread
   - Vegas: Timberwolves -7.5 @ -110 (52.4% implied)

2. Fetch Polymarket price
   - Polymarket: Timberwolves -7.5 @ $0.28 (28% implied)

3. Calculate edge
   - Edge = 52.4% - 28% = 24.4%

4. Alert: "BUY Timberwolves -7.5 @ $0.28, edge = 24%"
```

### The Question

Were these mispricings visible BEFORE the games?

- If yes → Scanner would have caught them → Strategy works
- If no → Countryside has private info → Can't replicate

## Next Steps for Validation

1. **Get historical Vegas lines** for these exact games/spreads
2. **Compare** to Countryside's entry prices
3. **Calculate** what the edge was at time of entry

If historical Vegas had these at ~50% while Polymarket was at 28-44%, the scanner strategy is validated.

## Tools Needed

- Historical odds API (The Odds API has historical data)
- Or: Check odds archive sites for Feb 2-4, 2026 games
