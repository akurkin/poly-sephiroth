# MrSparklySimpsons - Deep Analysis (2026-02-05)

**Address:** 0xd0b4c4c020abdc88ad9a884f999f3d8cff8ffed6
**Period analyzed:** 3 days (2026-02-02 to 2026-02-05)
**Previous analysis:** Called it "predictive sports model", estimated +$660K profit

## CRITICAL CORRECTION: "Estimated Profit" Was Misleading

The $1.25M "estimated profit" in summary.json conflates **redemptions from older trades** with spending in the 3-day window. Actual breakdown:

| Component | Amount |
|-----------|--------|
| Trades in window | $884,939 |
| Redemptions in window (ALL, including old) | $2,134,935 |
| Redemptions from trades IN this window | $756,697 |
| Redemptions from trades BEFORE this window | $1,378,238 |

The $1.25M figure = $2.13M total redeemed - $885K trades = misleading because $1.38M of those redemptions are payouts from positions opened before the dump window.

## Actual P&L (3-Day Window)

| Metric | Value |
|--------|-------|
| Resolved Wins | 12 markets, +$358,802 |
| Resolved Losses | 12 markets, -$476,898 |
| **Net Resolved P&L** | **-$118,096** |
| Win Rate | 50% (12W / 12L) |
| Open Positions | $10,221 current value ($10,144 cost) |
| ROI (this window) | **-13.3%** |

### Biggest Wins
| Market | Outcome | Avg Price | Spent | Redeemed | P&L |
|--------|---------|-----------|-------|----------|-----|
| Maple Leafs vs Flames | Leafs ML | 0.520 | $130K | $250K | +$120K |
| Senators vs Penguins | Senators | 0.530 | $132K | $250K | +$117K |
| Nuggets vs Knicks O/U 226.5 | Over | 0.510 | $54K | $107K | +$52K |
| Fenerbahce O/U 2.5 | Under | 0.500 | $20K | $40K | +$20K |
| NEOM SC win? | No | 0.438 | $14K | $33K | +$19K |

### Biggest Losses
| Market | Outcome | Avg Price | Spent | Redeemed | P&L |
|--------|---------|-----------|-------|----------|-----|
| AC Milan win? | No | 0.585 | $158K | $0 | -$158K |
| Timberwolves vs Grizzlies | Wolves | 0.720 | $108K | $0 | -$108K |
| Pelicans vs Hornets O/U 231.5 | Over | 0.490 | $61K | $0 | -$61K |
| Pelicans (-4.5) Spread | Pelicans | 0.520 | $54K | $0 | -$54K |
| Bologna win? | Yes | 0.292 | $34K | $0 | -$34K |

## Strategy Classification: REVISED

Previous call: "predictive sports model" with high confidence. **Partially correct but incomplete.**

### What Holds
- **Sharp line comparison**: Still the core strategy. Comparing Polymarket prices to Vegas/model implied probabilities.
- **Automated execution**: ~700 trades/day, 100% buy, methodical accumulation
- **Buy-only, no market-making**: Pure directional conviction

### What Changed
- **NOT consistently profitable**: This 3-day window was a net loser (-$118K). Older redemptions show big wins ($500K Bruins, $458K Celta de Vigo), but this window's trades lost money.
- **High variance**: The strategy is extremely boom-or-bust. Big concentrated bets on ~50c markets mean each position is close to a coin flip. A few big misses wipe out many small wins.
- **50% win rate**: Not the 60%+ you'd expect from a strong predictive edge. At these prices (avg ~0.50), you need >50% to break even, and the account is barely there.
- **Massive concentration risk**: Two positions (AC Milan No $158K, Timberwolves $108K) accounted for -$266K of losses.

### Revised Classification

| | |
|-|-|
| **Strategy** | Sharp line comparison + automated execution |
| **Confidence** | High (90%) that this is the method |
| **Edge** | Possibly thin or nonexistent in this window |
| **Overall profitability** | Likely positive long-term (older redemptions suggest huge wins), but with massive drawdowns |
| **Risk profile** | Extremely high variance. Can lose $100K+ in a single day. |

## Sport/League Breakdown

| League | Volume | Trades | Events | Notes |
|--------|--------|--------|--------|-------|
| NHL | $292,467 | 345 | 4 | Biggest edge historically (Bruins $500K win not in window) |
| NBA | $279,004 | 325 | 4 | Moneylines + spreads + totals |
| Serie A | $193,333 | 42 | 2 | Massive bet on AC Milan No ($158K loss) |
| Saudi Pro League | $49,870 | 475 | 5 | Many small bets, mostly lost |
| Argentina | $28,958 | 252 | 2 | Mixed results |
| Turkey | $20,000 | 63 | 1 | One bet, won (+$20K) |
| Scottish Prem | $11,160 | 276 | 3 | Small bets, mixed |
| Tennis | $6,135 | 82 | 4 | New - small positions, all still open |
| UFC | $4,010 | 47 | 1 | One position, still open |

**Key insight**: Not just US sports. Covers global soccer (Serie A, SPL, Argentine, Turkish, Scottish), Tennis, UFC, and even CS:GO esports (from older redemptions). This suggests access to a **multi-sport odds comparison feed**, not domain expertise in one league.

## Both-Sides Trade Analysis

The 3 "both-sides" events are **NOT hedging or arbitrage**. They are multiple correlated bets on the same game event:

### 1. Bologna vs AC Milan (Serie A, Feb 3)
- Bologna Yes: $34,491 at 0.299
- AC Milan No: $157,871 at 0.585
- **Interpretation**: Both bets profit if Milan loses/draws. This is DOUBLING DOWN, not hedging.
- **Outcome**: Milan won. Both lost. **-$192K combined loss.**

### 2. Maple Leafs vs Flames (NHL, Feb 2)
- Leafs ML: $130,000 at 0.520
- Under 6.5: $1,978 at 0.530
- **Interpretation**: Two independent bets on the same game. Different markets.
- **Outcome**: Leafs won, game went under. **Both won. +$122K combined.**

### 3. Pelicans vs Hornets (NBA, Feb 2)
- Over 231.5: $61,250 at 0.490
- Hornets -6.5 spread: $1,658 at 0.500
- **Interpretation**: Two independent bets. Spread tiny compared to total.
- **Outcome**: Under hit, Hornets covered. Over lost, spread won. **Net -$59K.**

**Conclusion**: The "both-sides" flag indicates multi-market betting on the same game, not hedging. When the model sees edge on multiple lines for the same game, it bets all of them.

## Entry Price Distribution

| Price Range | Volume | % of Total |
|-------------|--------|------------|
| 0.25-0.30 | $25,606 | 2.9% |
| 0.30-0.35 | $8,885 | 1.0% |
| 0.35-0.40 | $19,757 | 2.2% |
| 0.40-0.45 | $24,557 | 2.8% |
| 0.45-0.50 | $97,482 | 11.0% |
| **0.50-0.55** | **$409,506** | **46.3%** |
| 0.55-0.60 | $161,990 | 18.3% |
| 0.60-0.65 | $5,829 | 0.7% |
| 0.65-0.70 | $23,327 | 2.6% |
| 0.70-0.75 | $107,999 | 12.2% |

**64.6% of volume** is in the 0.50-0.60 range. This is the "coin flip zone" where Vegas-to-Polymarket mispricing is easiest to find (largest liquidity, smallest edge needed to exploit).

The 0.70-0.75 outlier ($108K) is the Timberwolves bet at 0.72 -- a heavier favorite, which lost.

## Current Open Positions

| Market | Outcome | Avg Price | Cost | Current Value | P&L |
|--------|---------|-----------|------|---------------|-----|
| Pelicans (-4.5) Spread | Pelicans | 0.520 | $53,725 | $0 (lost) | -$53,725 |
| Wild vs Predators | Predators | 0.460 | $18,347 | $0 (lost) | -$18,347 |
| Inter vs Torino O/U 2.5 | Under | 0.400 | $971 | $0 (lost) | -$971 |
| UFC: Bautista vs Oliveira | Oliveira | 0.399 | $4,010 | $4,073 | +$63 |
| Parry vs Bartunkova | Parry | 0.370 | $2,434 | $2,500 | +$66 |
| Griekspoor vs Busta | Busta | 0.440 | $1,724 | $1,665 | -$59 |
| Nardi vs Cobolli | Cobolli | 0.570 | $1,676 | $1,691 | +$15 |
| Volynets vs Parks | Volynets | 0.480 | $300 | $291 | -$9 |

3 positions already resolved as losses ($73K). 5 still live ($10.2K value, all tiny).

## Older Redemptions (Pre-Window Trades)

These show the account's broader track record -- $1.378M redeemed from 11 winning markets (vs 169 losing markets with $0 redeemed):

| Market | Redeemed |
|--------|----------|
| Bruins vs Lightning | $500,000 |
| RC Celta de Vigo win? | $458,554 |
| CS:GO FURIA vs TheMongolz | $169,030 |
| Magic vs Spurs | $88,907 |
| Al Fateh Saudi win? | $40,897 |
| Getafe CF win? | $29,079 |
| Spread: Knicks (-4.5) | $25,639 |
| Tennis: Tomljanovic vs Fernandez | $25,000 |
| Spread: Thunder (-6.5) | $19,870 |
| Spread: Pistons (-13.5) | $15,807 |
| Tennis: Seidel vs Bondar | $5,456 |

**169 older markets redeemed at $0** (losses) -- we don't know their cost basis, but this confirms an extremely high loss rate offset by massive wins on the hits.

## Synthesis

### Is this replicable via sharp-line comparison?

**Yes, but with major caveats:**

1. **The strategy works in aggregate** -- the $1.38M in older redemptions from just 11 wins shows that when it hits, it hits huge (single positions of $250K-$500K).

2. **But any given 3-day window can be deeply negative** -- this window lost $118K. The win rate is ~50%, and at near-coinflip prices, that means breakeven or slightly negative before hitting the rare huge wins.

3. **Capital requirements are extreme** -- single positions of $50-150K. Need $500K+ bankroll to survive drawdowns.

4. **The edge is in price discovery, not prediction** -- at 50% win rate, the edge is buying at 0.50-0.52 on events where true probability is 0.53-0.55. That's a 1-5% edge per bet, realized over hundreds of bets.

5. **Multi-sport coverage** -- not a "sports expert" but rather a systematic odds-comparison engine that works across NHL, NBA, soccer, tennis, UFC, even CS:GO. This is what our POC does.

### Key Differences from Our POC
- **Scale**: $885K in 3 days vs our POC testing much smaller
- **Concentration**: Willing to put $150K+ on a single outcome
- **Speed**: 700 trades/day, automated accumulation in 1-min intervals
- **Breadth**: Covers 9+ leagues/sports simultaneously
- **Risk tolerance**: Accepts -$100K days as cost of doing business

## Open Questions
- What's total account lifetime P&L? (need longer dump window)
- Where do the odds come from? Pinnacle? Own model? Multiple books?
- Why the huge concentration in Serie A (one $158K bet)?
- Is the 50% win rate in this window representative, or was this a bad stretch?
- Why tennis and UFC at such small sizes? Testing new leagues?
