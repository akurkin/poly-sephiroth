# tbs8t Strategy Analysis

**Address**: `0x4bd74aef0ee5f1ec0718890f55c15f047e28373e`
**Pseudonym**: Plush-Cash
**Analyzed**: 2026-02-05

## Facts

| Metric | Value |
|--------|-------|
| Lifetime Volume | $3.24M |
| Lifetime Profit | $199K (6.1% ROI) |
| Sample Records | 3,100 (API limit, partial) |
| Sample Trades | 3,090 buys, 0 sells |
| Sample Redeems | 10 |
| Sample Volume | $1.18M |
| Events Traded (sample) | 13 (all NBA) |
| Join Date | 2026-02-02 |
| Account Age | 3 days |

## Resolved Events

| Event | Pick | Entry Price | Invested | Redeemed | PnL | ROI | Result |
|-------|------|-------------|----------|----------|-----|-----|--------|
| MIN @ MEM 02-02 | Grizzlies | 0.28 | $99,921 | $356,862 | +$256,941 | 257% | **WON** |
| BOS @ HOU 02-04 | Celtics | 0.30 | $90,687 | $303,797 | +$213,110 | 235% | **WON** |
| MEM @ SAC 02-04 | Grizzlies | 0.46 | $88,849 | $192,464 | +$103,615 | 117% | **WON** |
| CLE @ LAC 02-04 | Cavaliers | 0.58 | $99,865 | $173,205 | +$73,340 | 73% | **WON** |
| DEN @ NYK 02-04 | Knicks | 0.64 | $99,999 | $156,869 | +$56,870 | 57% | **WON** |
| BOS @ DAL 02-03 | Celtics | 0.70 | $100,000 | $142,857 | +$42,857 | 43% | **WON** |
| NOP @ MIL 02-04 | Over | 0.51 | $37,397 | $72,679 | +$35,282 | 94% | **WON** |
| NOP @ CHA 02-02 | Pelicans | 0.30 | $71,378 | $0 | -$71,378 | -100% | LOST |
| PHI @ LAC 02-02 | Clippers | 0.49 | $99,999 | $0 | -$99,999 | -100% | LOST |
| NYK @ WAS 02-03 | Wizards | 0.17 | $99,999 | $0 | -$99,999 | -100% | LOST |
| ATL @ MIA 02-03 | Heat | 0.49 | $99,999 | $0 | -$99,999 | -100% | LOST |
| NOP @ MIL 02-04 | Pelicans | 0.65 | $99,999 | $0 | -$99,999 | -100% | LOST |
| OKC @ SAS 02-04 | Thunder | 0.23 | $82,834 | $0 | -$82,834 | -100% | LOST |

**Active**: CHA @ HOU 02-05 - Hornets @0.39 - $7,119 invested (still accumulating)

### P&L Summary (visible sample)

| | Amount |
|---|--------|
| Gross profit from 7 wins | +$782,044 |
| Gross loss from 6 losses | -$554,208 |
| **Net P&L (sample)** | **+$227,836** |
| Profile lifetime PnL | +$199,227 |
| Delta (unseen activity) | -$28,609 |

**Win rate**: 7/13 = 54% (but profitable due to asymmetric payoff on underdogs)

## Patterns

### 1. Fixed $100K Position Sizing
Nearly every event gets exactly ~$100K invested. Clear target:
- 10 events at $88K-$100K
- 1 at $137K (NOP-MIL: stacked moneyline + over)
- 1 at $71K (NOP-CHA: incomplete, ran out of liquidity at 0.30)
- 1 at $7K (CHA-HOU: actively accumulating at time of snapshot)

### 2. Mixed Execution Styles
Unlike Countryside (always algorithmic), tbs8t uses THREE modes:
- **Algorithmic drip**: 54-942 small trades over 15-186 min (NOP-CHA, BOS-HOU, NYK-WAS, etc.)
- **Hybrid**: Large opening block + smaller fills (BOS-DAL: $73K block then 167 fills, DEN-NYK: $75K block then 3 fills)
- **Single block trade**: One massive fill (ATL-MIA: $100K in 1 trade, MIN-MEM: $100K in 1 trade)

### 3. Trade Timing
- Trades happen ~5-8PM ET (pre-game / early game)
- Feb 4 games: entered 3 events within 4 minutes (22:09-22:13)
- Avg gap between algorithmic trades: 6-45 seconds
- Up to 10 simultaneous orders at same timestamp (bot execution)

### 4. Underdog Heavy
5/13 bets at odds below 0.45 (underdog territory):
- @0.17 Wizards (LOST), @0.23 Thunder (LOST), @0.28 Grizzlies (WON), @0.30 Pelicans (LOST), @0.30 Celtics (WON)
- Underdog win rate: 2/5 = 40%, but the 2 wins returned +$470K on $191K invested

### 5. Spread + Moneyline Stacking
Two events show correlated bets:
- NOP @ MIL: Pelicans moneyline ($100K) + Over ($37K)
- MEM @ SAC: Grizzlies moneyline ($89K) + tiny Over ($33)

### 6. Aggressive Timeline
Account created Feb 2 2026. Deployed $1.17M across 13 events in 3 days.

## Hypothesis

**Algorithmic sharp sports bettor exploiting soft Polymarket NBA lines, operating at a more aggressive scale and lower selectivity than Countryside.**

This is the same fundamental strategy as Countryside:
1. External sharp line or model identifies mispriced NBA outcomes
2. Buys at prices below true probability
3. Holds to resolution (no hedging, no selling)
4. Algorithmic order splitting to manage market impact
5. $100K flat position sizing per event

Key difference from Countryside: **tbs8t is less selective and takes more losing bets.** Countryside went 6/6 (100% visible win rate). tbs8t went 7/13 (54%). But both end up profitable because underdog payoffs are asymmetric.

## Evidence

### For "sharp line arbitrage" strategy:
- 100% buy ratio, 0 sells = high-conviction directional bets, no hedging
- Algorithmic execution with 6-45 second intervals = bot trading
- Up to 10 simultaneous orders = programmatic
- Underdog bias with asymmetric returns
- ~$100K flat position sizing = systematic risk management
- NBA-only focus = domain specialization
- Correlated ML + total stacking on same game

### For "same strategy as Countryside":
- Both joined Feb 2, 2026
- Both 100% buy, 0% sell
- Both NBA-only
- Both use algorithmic accumulation
- Both use ~$100K position targets
- Both profitable via underdog asymmetry
- Both bet on Celtics (BOS-HOU), Grizzlies (MIN-MEM, MEM-SAC)

### AGAINST "same entity as Countryside":
- **Opposite sides on 2 overlapping markets**:
  - NOP @ CHA: Countryside bet Hornets (WON), tbs8t bet Pelicans (LOST)
  - NOP @ MIL: Countryside bet Bucks, tbs8t bet Pelicans (LOST)
- **Different execution style**: Countryside always uses algorithmic drip (1000+ trades). tbs8t sometimes drops $100K in a single block trade
- **Different selectivity**: Countryside 100% win rate (6/6). tbs8t 54% (7/13)
- **Different scale**: Countryside $28M lifetime volume. tbs8t $3.2M
- **Overlapping but non-identical event selection**: Only 5 of 25 total unique events overlap
- **Different trading hours**: On BOS-HOU, Countryside traded 07:32-19:30, tbs8t traded 22:13-01:19 (no overlap)

## Countryside Comparison

| Attribute | Countryside | tbs8t |
|-----------|------------|-------|
| Join Date | Feb 2, 2026 | Feb 2, 2026 |
| Volume | $28M | $3.2M |
| Profit | $1.67M | $199K |
| ROI | 6% | 6.1% |
| Buy Ratio | 100% | 100% |
| Markets | NBA (+1 EPL) | NBA only |
| Visible Win Rate | 6/6 (100%) | 7/13 (54%) |
| Position Size | ~$100K | ~$100K |
| Execution | Always algorithmic | Mixed (algo + block) |
| NOP-CHA Side | Hornets (WON) | Pelicans (LOST) |
| NOP-MIL Side | Bucks | Pelicans (LOST) |
| Same Side Events | MIN-MEM, BOS-HOU, MEM-SAC | MIN-MEM, BOS-HOU, MEM-SAC |

**Verdict: DIFFERENT entities using the SAME strategy class.** They are both sharp sports bettors exploiting Polymarket NBA lines, likely using different models or line sources. The opposite-side bets on NOP-CHA and NOP-MIL definitively rule out being the same entity. The nearly identical ROI (6% vs 6.1%) and join date suggest they may have discovered the opportunity simultaneously or be part of the same ecosystem of sports bettors migrating to Polymarket.

## Conclusion

| Attribute | Value |
|-----------|-------|
| **Strategy** | Algorithmic Sharp NBA Betting |
| **Confidence** | High (90%) |
| **Edge Source** | Sharp line comparison or proprietary model |
| **Win Rate** | 54% (profitable via asymmetric underdog payoffs) |
| **Position Sizing** | Flat ~$100K per event |
| **Same as Countryside?** | No. Same strategy class, different entity |
| **Replicability** | Hard |

## Key Insight

tbs8t confirms the Polymarket NBA sharp betting ecosystem is multi-player. Multiple independent bettors are running the same strategy simultaneously, sometimes taking opposite sides. The fact that BOTH achieve ~6% ROI despite different picks suggests the edge comes from exploiting soft lines broadly, not from superior game prediction. The market is systematically mispriced, and anyone with access to sharp lines can profit -- even with a 54% win rate.

## Data Gaps

- Only 3,100 of estimated ~5,000+ total activities captured (API limit)
- Profile shows $3.24M volume but sample only covers $1.18M
- Missing ~$2M of trading history likely includes more events
- The -$28K gap between computed P&L ($228K) and profile P&L ($199K) suggests additional losses in unseen data
