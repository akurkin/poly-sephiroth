# Polymarket Daily Frequency Markets - Research Summary

**Date:** 2026-02-05  
**API:** Gamma API query for events ending 2026-02-05  
**Total Events:** 50 with daily resolution  
**Total Volume:** $11.8M  

---

## Executive Summary

Polymarket has **substantial daily-frequency markets** across three main categories:

1. **Crypto Price Brackets** - Daily BTC/ETH/XRP price levels
2. **Sports/Esports** - Daily match outcomes and game stats
3. **Events/Announcements** - Daily occurrences (earnings calls, elections, etc.)

The highest volume market today is **"Where will Giannis be traded?"** at $3.47M with 32 outcome markets.

---

## 1. CRYPTO PRICE BRACKETS (Daily)

| Market | Volume | Outcome Markets | Strategy |
|--------|--------|-----------------|----------|
| Bitcoin Up or Down on Feb 5? | $1.52M | 1 | Binary: BTC closes higher/lower than open |
| Ethereum above $2,300-2,600 | $1.46M | 11 | Bracket: Which price level will ETH reach? |
| XRP above $1.80-2.10 | $454k | 11 | Bracket: Which XRP price level? |
| XRP Up or Down on Feb 5? | $35k | 1 | Binary: XRP direction |

### Market Structure
- **Multiple outcomes per event**: Ethereum has 11 separate "above X" markets
  - $2,300 / $2,400 / $2,500 / $2,600 / etc.
  - Allows position across price levels
- **Resolution**: End-of-day price feeds from major exchanges
- **Liquidity**: High volume means tight spreads for entry/exit

### Arbitrage Potential
- Price brackets create natural arbitrage: YES at $2,500 + NO at $2,500 should = $1.00
- Conditional on actual price distribution matching orderbook prices
- Daily resolution means quick feedback loop for strategy refinement

---

## 2. SPORTS & ESPORTS (Daily Match/Game Events)

### NBA Trading Markets (Highest Volume)
| Market | Volume | Outcomes | Notes |
|--------|--------|----------|-------|
| Where will Giannis be traded? | $3.47M | 32 teams | Giannis trade deadline today (implied) |
| NBA players traded this season | $1.54M | 14 players | Binary: will X player be traded? |

**Market Structure:**
- 32 separate markets for each potential team destination
- YES odds should sum to ~$1.00 across all teams
- Perfect for sharp traders who can predict team destinations before news

### Esports (League of Legends, Dota 2)
| Event | Volume | Outcomes |
|-------|--------|----------|
| LoL: NiP vs ThunderTalk (BO3) | $751k | 50 markets |
| LoL: SoftBank Hawks vs GAM (BO3) | $365k | 8 markets |
| Dota 2: OG vs Natus Vincere (BO1) | $302k | 23 markets |
| Dota 2: Natus Vincere vs Team Yandex | $149k | 24 markets |

**Market Types:**
- Match winner (binary)
- Game winners (BO3 = up to 3 games)
- First Blood (in-game event)
- Total Kills Over/Under (in-game stat prediction)

**Timing:** Matches resolve within hours of game completion

---

## 3. EVENT/ANNOUNCEMENT MARKETS

| Event | Volume | Outcomes | Resolution |
|-------|--------|----------|-----------|
| NJ-11 Special Election Primary | $44k | 28 | Democratic Primary winner |
| Amazon Earnings Call | $21k | 14 | What will Amazon say? (text prediction) |
| Reddit Earnings Call | $4k | 10 | What will Reddit say? (text prediction) |
| Microchip Tech Earnings Call | $2k | 8 | What will Microchip say? (text prediction) |
| Trump Announcement Feb 5 | $2k | 22 | What will Trump say? (text prediction) |

**Unique Aspect:** "What will X say?" markets are **text prediction markets**
- Outcomes are predefined phrases/topics
- Example: "Will Amazon mention AWS expansion?" (YES/NO)
- Require real-time parsing of earnings transcripts or official announcements

---

## Trading Strategy Implications

### 1. Crypto Bracket Arbitrage
```
If ETH price brackets exist at: $2,400, $2,500, $2,600
Your probability model predicts: 40%, 35%, 25%
Implied prices from market: might be 50%, 30%, 20%

Arbitrage: Sell the $2,400 contract, buy the $2,500 + $2,600
```

### 2. Sports Event Prediction
- **Giannis trade**: If you know trade destination before market does, free money
- **Earnings calls**: Sentiment analysis on earnings transcripts before market prices in

### 3. Esports Live Betting
- **In-game markets** resolve within minutes (First Blood, Kill streaks)
- Requires: Live game tracking + speed to beat other traders
- Low latency = edge

### 4. Multi-Outcome Consolidation
All these markets follow a principle: **YES prices across all outcomes should sum to ~$1.00**

If they don't, profitable arbitrage exists (buy/sell baskets of YES contracts)

---

## Data Quality Notes

### API Response Characteristics
- Gamma API returns `endDate` in ISO format (2026-02-05T00:00:00Z)
- `volume` field = total trading volume in dollars
- `markets` array = all outcome markets for the event
- Each market has `question` field (the specific prediction)

### Limitations Identified
- API `closed=false` + `active=true` filters show only live markets
- No historical daily market data visible (API appears to return only current/upcoming)
- Past resolved markets may be archived in different endpoint

---

## Recommended Next Steps

1. **Fetch full orderbook data** for top 5 daily markets
   - Check current bid/ask spreads
   - Verify YES prices sum to ~$1.00
   - Identify immediate arbitrage opportunities

2. **Build price bracket scanner**
   - For crypto markets: extract all price levels
   - Calculate cross-outcome arbitrage (sum to $1.00)
   - Alert on mispricing > 1-2%

3. **Sports event intelligence**
   - Scrape real-time trade rumors for Giannis
   - Monitor Shams Charania / Adrian Wojnarowski feeds
   - Correlate with price movements

4. **Esports live tracking**
   - Connect to game APIs (if available) for First Blood markets
   - Build latency-optimized oracle for in-game events
   - Test execution speed vs market fill rates

---

## Summary: Daily Market Characteristics

| Characteristic | Value | Implication |
|---|---|---|
| **Daily frequency** | 50+ events/day | High volume, predictable cadence |
| **Volume concentration** | $3.47M in single event | Sufficient liquidity for $10k+ positions |
| **Outcome diversity** | 1-50 markets per event | Arbitrage across outcomes common |
| **Resolution speed** | Hours (sports) to EOD (crypto) | Quick feedback for model refinement |
| **Market types** | Price brackets, binary, text | Multiple arbitrage vectors |

**Verdict:** Daily markets are **ideal for systematic trading** - high volume, clear resolution criteria, frequent opportunities.

