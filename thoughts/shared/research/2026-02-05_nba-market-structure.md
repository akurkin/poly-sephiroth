# Polymarket NBA Market Structure Research

**Date:** 2026-02-05  
**Status:** Complete

## Key Findings

### 1. Market Types on Polymarket
Polymarket does **NOT** have daily NBA game markets (moneyline, spread, totals for individual games). Instead, they focus on:

- **Season-long prop markets**: Win totals (over/under), MVP, DPOY, etc.
- **Team achievement markets**: Championship winners, division winners, conference winners
- **Statistical leaders**: PPG leader, RPG leader, APG leader, 3PM leader, BPG leader, SPG leader
- **Individual player props**: Award predictions (MVP, ROY, COTY)

### 2. Current Active NBA Events (26 total)

**Championship-level:**
- `2026-nba-champion` - 30 markets (one per team)
- `nba-eastern-conference-champion-442` - 16 markets
- `nba-western-conference-champion-933` - 16 markets

**Individual Awards:**
- `nba-mvp-694` - 33 markets (one per player candidate)
- `nba-rookie-of-the-year-873` - 28 markets
- `nba-2025-26-coach-of-the-year` - 56 markets
- `nba-2025-26-defensive-player-of-the-year` - 56 markets
- `nba-2025-26-most-improved-player` - 56 markets
- `nba-2025-26-sixth-man-of-the-year` - 56 markets
- `nba-2025-26-clutch-player-of-the-year` - 56 markets

**Statistical Leaders:**
- `nba-2025-26-ppg-leader` - 70 markets (PPG)
- `nba-2025-26-rpg-leader` - 63 markets (RPG)
- `nba-2025-26-apg-leader` - 57 markets (APG)
- `nba-2025-26-3pm-leader` - 73 markets (3PM)
- `nba-2025-26-bpg-leader` - 64 markets (BPG)
- `nba-2025-26-spg-leader` - 69 markets (SPG)

**Team Achievements:**
- `nba-win-totals-over-or-under` - 30 markets (one per team, asks if team wins >X games)
- `nba-best-record-765` - 30 markets
- `nba-worst-record-846` - 30 markets
- Division winners (6 events, 5 markets each) - SE, SW, NW, Central, Atlantic, Pacific

### 3. Slug Patterns

**Event slug structure:**
```
[category]-[year?]-[qualifier]

Examples:
- nba-mvp-694
- nba-2025-26-ppg-leader
- 2026-nba-champion
- nba-win-totals-over-or-under
```

**Market slug structure (within events):**
```
will-the-[team/player]-[qualifier]-[year/season]

Examples:
- will-the-atlanta-hawks-win-more-than-47pt5-regular-season-games-in-202526
- will-the-oklahoma-city-thunder-win-the-2026-nba-finals
- will-trae-young-win-the-2025-2026-nba-mvp
```

### 4. Market Data Structure

Each event contains `markets[]` with:
```json
{
  "question": "Will the Oklahoma City Thunder win the 2026 NBA Finals?",
  "slug": "will-the-oklahoma-city-thunder-win-the-2026-nba-finals",
  "conditionId": "0x...",
  "outcomes": ["Yes", "No"],
  "outcomePrices": ["0.39", "0.61"],
  "bestAsk": 0.39,
  "bestBid": 0.38,
  "active": true,
  "closed": false,
  "volume": 150000
}
```

### 5. API Endpoints

| Endpoint | Use Case |
|----------|----------|
| `GET /events` (gamma-api) | List active events with markets |
| `GET /events?slug=...` | Get specific event details |
| `GET /markets` (clob) | Raw market data (condition IDs for trading) |

### 6. Volume and Liquidity

**Highest volume NBA events:**
1. NBA MVP: $21.2M
2. 2026 NBA Champion: $231M (but divided across 30 team markets = ~$7.7M avg)
3. NBA Win Totals: $1.0M+ across 30 teams
4. Statistical Leaders: $200-500k per stat leader event

**Note:** Historical NBA game markets exist in CLOB (from 2023) but are closed/inactive.

## Implications for Arbitrage Scanning

1. **No daily game arbitrage** - Polymarket doesn't offer daily game markets
2. **Prop market arbitrage** possible:
   - Cross-market opportunities (e.g., if OKC Thunder championship odds are inconsistent across different award/championship markets)
   - Correlated market exploits (e.g., if a player's MVP odds vs their team's championship odds are mispriced)
3. **Division/Conference/Championship hierarchy** can be checked for consistency:
   - If Team A's conference championship odds too high relative to championship odds
   - If division odds don't properly weight team strengths

## Next Steps

1. Map out all 26 NBA events and their markets
2. Build data model for season-long prop arbitrage
3. Create scanning logic to find inconsistent odds across related markets
4. Consider correlation arbitrage (e.g., MVP + team championship combinations)

## Unresolved Questions

- Are there any daily game markets we're missing in non-active filtered results?
- Do historical game markets still exist and could be useful as reference data?
- What's the typical margin on NBA props that would be worth trading?
