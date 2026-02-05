# Daily Markets Scanner - Implementation Guide

## What Was Found

Polymarket has **50+ daily-resolution markets** totaling **$11.8M volume** across:
- **Crypto brackets**: ETH/BTC/XRP price levels (11+ outcomes each)
- **Sports/Esports**: NBA trades, LoL/Dota matches (up to 50 outcomes per event)
- **Events**: Earnings transcripts, elections (28+ outcomes)

## Why This Matters for Arbitrage

All multi-outcome markets should satisfy: **SUM(YES prices) ≈ $1.00**

When they don't → Profitable arbitrage exists.

## Quick Start: Build a Scanner

### 1. Fetch Market Data (Existing Skill)
Already have poly dump working. Extend to capture:
```bash
# Fetch active markets ending today
curl 'https://gamma-api.polymarket.com/events?closed=false&active=true&limit=100' \
  | jq '.[] | select(.endDate | startswith("2026-02-05"))'
```

### 2. Extract Orderbook Prices (New Skill)
```bash
# For each market, fetch CLOB orderbook
curl 'https://clob.polymarket.com/orderbook?token_id=<token_id>' \
  | jq '.bids[0], .asks[0]'
```

### 3. Calculate Arbitrage
```javascript
// For each market (e.g., 11 ETH price brackets):
const prices = [
  { level: 2300, bid: 0.45, ask: 0.47 },
  { level: 2400, bid: 0.30, ask: 0.32 },
  // ...
];

const sumYes = prices.reduce((s, p) => s + p.bid, 0); // Buy side
const sumNo = prices.reduce((s, p) => s + (1 - p.ask), 0); // Sell side

if (sumYes < 0.98) {
  // Arbitrage: Buy all YES at bid prices, lock in margin
  return { opportunity: 'buy_bracket', margin: 1 - sumYes };
}
```

### 4. Alert on Violations
- **Threshold**: Sum deviates > 1-2% from $1.00
- **Action**: Alert to execute basket trade
- **Latency**: CLOB API response ~100ms, so only viable for size > slippage

## Code Integration Points

### Add to `src/lib/`:

**`clob-prices.ts`** - Fetch current orderbook
```typescript
export async function getOrderbookPrices(eventId: string): Promise<Market[]> {
  const markets = await gammaApi.getEventMarkets(eventId);
  const prices = await Promise.all(
    markets.map(m => clobApi.getOrderbook(m.tokenId))
  );
  return markets.map((m, i) => ({...m, ...prices[i]}));
}
```

**`arbitrage-scanner.ts`** - Detect violations
```typescript
export function detectBracketArbitrage(market: Market[]): Opportunity[] {
  const sumYes = market.reduce((s, m) => s + m.bestBid, 0);
  if (sumYes < 0.98) {
    return [{
      type: 'bracket',
      event: market[0].eventId,
      margin: 1 - sumYes,
      action: 'buy_all_yes',
      prices: market.map(m => ({ level: m.level, bid: m.bestBid }))
    }];
  }
  return [];
}
```

### Add to `src/apps/cli/`:

**React component** for live scanning
```typescript
import { useLiveMarkets } from '@lib/market-stream';

export function ArbitrageScanner() {
  const [opportunities, setOpportunities] = useState([]);
  
  useEffect(() => {
    const scan = setInterval(async () => {
      const markets = await getLatestDailyMarkets();
      const arbs = markets.flatMap(detectBracketArbitrage);
      setOpportunities(arbs);
    }, 5000); // Scan every 5 seconds
    return () => clearInterval(scan);
  }, []);
  
  return (
    <Box>
      <Text>Daily Arbitrage Opportunities</Text>
      {opportunities.map(opp => (
        <Text key={opp.event}>
          {opp.event}: {(opp.margin * 100).toFixed(2)}% profit
        </Text>
      ))}
    </Box>
  );
}
```

## Testing Strategy

1. **Unit**: Verify sum-to-1 calculation
   ```bash
   # Test with mock prices that should and shouldn't arbitrage
   bun test src/lib/arbitrage-scanner.test.ts
   ```

2. **Integration**: Compare scanner vs manual orderbook check
   ```bash
   # Pick one market, fetch orderbook manually, verify scanner detects it
   curl 'https://clob.polymarket.com/orderbook?token_id=...'
   ```

3. **Live**: Run scanner on top 5 daily markets for 1 hour
   - Track false positives (sum violations due to lag)
   - Measure latency: Fetch → Calculate → Alert
   - Estimate execution cost vs margin

## Execution Considerations

- **Minimum position**: $1k-5k to justify execution cost
- **Slippage**: Assume 0.5% on CLOB market orders
- **Latency**: CLOB API ~100ms, execution 500ms-1s
- **Profitability**: Need margin > slippage (0.5%) + execution cost (0.2%)
  → Only trades with **1%+ margin** worth executing

## Files Generated

- `/thoughts/shared/research/2026-02-05_daily-markets-research.md` - Full analysis
- `/thoughts/shared/research/2026-02-05_daily-markets-data.json` - Market list
- `/thoughts/shared/research/DAILY_MARKETS_QUICK_SUMMARY.txt` - Reference

