# Arbitrage Scanner - Implementation Plan

## Overview

CLI command `poly arb` that scans NegRisk events for arbitrage opportunities where sum of best asks across all outcomes < threshold.

## Related Research

- `thoughts/shared/research/2026-02-05_arbitrage-scanner.md` — full spec
- `thoughts/shared/research/2026-02-05_sharp-line-scanner.md` — Phase 2, out of scope

## Current State

```
src/
├── apps/cli/
│   ├── index.tsx              # meow CLI, routes "dump" command
│   └── commands/dump.tsx      # Ink component for dump
├── lib/
│   ├── polymarket-api.ts      # data-api + gamma-api (NOT clob)
│   ├── types.ts               # Activity, Position, GammaMarket, etc
│   ├── result.ts              # Result<T,E> discriminated union
│   ├── fs.ts                  # file output
│   └── use-cases/
│       ├── index.ts           # re-exports
│       ├── dump-account.ts    # orchestration w/ progress
│       └── compute-summary.ts # analytics
```

**What exists**: Gamma market fetch (by conditionId), rate-limited `apiFetch`, Result type, Ink CLI pattern.

**What's missing**: Gamma events endpoint, CLOB orderbook fetch, arb detection logic, `poly arb` command.

## Desired End State

```bash
$ poly arb
⠋ Fetching events (142 found, 23 with 4+ outcomes)
⠋ Fetching orderbooks (92/184 outcomes)

=== ARBITRAGE OPPORTUNITIES ===

🟢 super-bowl-lix-halftime-performers
   Sum of asks: $0.943 (42 outcomes)
   Profit margin: 5.7%
   Min depth: $2,340
   Top 5 cheapest:
     Kendrick Lamar    $0.35 ($4,200 avail)
     SZA               $0.12 ($1,800 avail)
     Post Malone       $0.08 ($890 avail)
     Lil Wayne         $0.06 ($2,340 avail)
     Drake             $0.05 ($560 avail)

🟢 2028-presidential-election-winner
   Sum of asks: $0.971 (128 outcomes)
   Profit margin: 2.9%
   Min depth: $500
   ...

Scanned 23 events (184 outcomes) in 22.4s
Found 2 opportunities
```

## Out of Scope

- `--watch` mode / WebSocket (v1.1)
- Binary YES/NO markets
- JSON file output
- SQLite cache
- Order execution
- Alert dedup

## Decisions

| Decision            | Choice                             | Rationale                         |
| ------------------- | ---------------------------------- | --------------------------------- |
| Min orderbook depth | $500                               | Filter noise from dust orders     |
| NegRisk detection   | Client-side filter by market count | Catches edge cases Gamma misses   |
| Rate limiter        | Shared global (existing)           | Simpler, arb scanner runs solo    |
| Cache               | In-memory only                     | One-shot doesn't need persistence |

---

## Phase 1: Types + CLOB API

### What This Accomplishes

Add types for Gamma events and CLOB orderbook responses. Add `fetchEvents` and `fetchOrderbook` to API layer.

### Changes

**File**: `src/lib/types.ts` — append new types

```typescript
// --- Gamma Event types (events endpoint) ---

export interface GammaEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  startDate: string;
  endDate: string;
  active: boolean;
  closed: boolean;
  liquidity: number;
  volume: number;
  volume24hr: number;
  negRisk: boolean;
  enableOrderBook: boolean;
  markets: GammaEventMarket[];
  commentCount: number;
}

export interface GammaEventMarket {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  outcomes: string; // JSON string: '["Yes","No"]'
  outcomePrices: string; // JSON string: '["0.48","0.52"]'
  clobTokenIds: string; // JSON string: '["123...","456..."]'
  volume: string;
  active: boolean;
  closed: boolean;
  negRisk: boolean;
  bestAsk: number | undefined;
  bestBid: number | undefined;
  orderPriceMinTickSize: number;
  orderMinSize: number;
}

// --- CLOB Orderbook types ---

export interface OrderLevel {
  price: string;
  size: string;
}

export interface CLOBOrderbook {
  market: string;
  asset_id: string;
  timestamp: string;
  hash: string;
  bids: OrderLevel[];
  asks: OrderLevel[];
}
```

**File**: `src/lib/polymarket-api.ts` — add CLOB_API constant and two new functions

Add `CLOB_API` constant after existing constants:

```typescript
const CLOB_API = "https://clob.polymarket.com";
```

Add `fetchEvents` function:

```typescript
export async function fetchEvents(
  onProgress?: ProgressFn,
): Promise<Result<GammaEvent[]>> {
  const all: GammaEvent[] = [];
  let offset = 0;

  while (true) {
    const result = await apiFetch<GammaEvent[]>(
      `${GAMMA_API}/events?closed=false&active=true&limit=${PAGE_SIZE}&offset=${offset}`,
    );
    if ("error" in result) return result;

    const page = result.data;
    if (page.length === 0) break;

    all.push(...page);
    onProgress?.(all.length, all.length + PAGE_SIZE);
    offset += PAGE_SIZE;
  }

  return ok(all);
}
```

Add `fetchOrderbook` function:

```typescript
export async function fetchOrderbook(
  tokenId: string,
): Promise<Result<CLOBOrderbook>> {
  return apiFetch<CLOBOrderbook>(`${CLOB_API}/book?token_id=${tokenId}`);
}
```

Update imports at top of polymarket-api.ts to include new types:

```typescript
import type {
  Activity,
  Position,
  Profile,
  GammaMarket,
  GammaEvent,
  CLOBOrderbook,
} from "./types.js";
```

### Verification

```bash
# Typecheck passes
bun run typecheck

# Quick smoke test — fetch events
bun -e '
import { fetchEvents } from "./src/lib/polymarket-api.js"
const r = await fetchEvents((c,t) => process.stderr.write(`\r${c}/${t}`))
if ("data" in r) console.log(`\nFetched ${r.data.length} events`)
else console.error(r.error)
'

# Quick smoke test — fetch orderbook
bun -e '
import { fetchOrderbook } from "./src/lib/polymarket-api.js"
const r = await fetchOrderbook("53135072462907880191400140706440867753044989936304433583131786753949599718775")
if ("data" in r) console.log(JSON.stringify(r.data.asks?.slice(0,3), null, 2))
else console.error(r.error)
'
```

---

## Phase 2: Arb Detection Use Case

### What This Accomplishes

Core business logic: filter events, fetch orderbooks, detect arbs.

### Changes

**File**: `src/lib/use-cases/scan-arb.ts` — new file

```typescript
import * as api from "../polymarket-api.js";
import { isErr } from "../result.js";
import type { GammaEvent, GammaEventMarket } from "../types.js";

export interface ScanArbInput {
  threshold: number; // default 0.98
  minOutcomes: number; // default 4
  minVolume: number; // default 10_000
  minDepth: number; // default 500
}

export interface OutcomePrice {
  question: string;
  tokenId: string;
  bestAsk: number | null; // null = no asks in book
  bestAskSize: number; // USD available at best ask
}

export interface ArbOpportunity {
  event: { id: string; title: string; slug: string };
  outcomes: OutcomePrice[];
  sumOfAsks: number;
  profitMargin: number; // 1 - sumOfAsks (before fees)
  minDepth: number; // smallest best ask size across outcomes
  outcomesWithNoAsks: number;
}

export type ScanStage = "events" | "orderbooks" | "done";

export interface ScanProgress {
  stage: ScanStage;
  message: string;
  current?: number;
  total?: number;
}

export class ScanError extends Error {
  constructor(
    public stage: ScanStage,
    message: string,
  ) {
    super(message);
    this.name = "ScanError";
  }
}

function parseJsonArray(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function filterEvents(
  events: GammaEvent[],
  minOutcomes: number,
  minVolume: number,
): GammaEvent[] {
  return events.filter((e) => {
    const activeMarkets = e.markets.filter((m) => m.active && !m.closed);
    return activeMarkets.length >= minOutcomes && e.volume >= minVolume;
  });
}

async function fetchEventOrderbooks(
  event: GammaEvent,
  onOutcome?: () => void,
): Promise<OutcomePrice[]> {
  const outcomes: OutcomePrice[] = [];

  for (const market of event.markets) {
    if (!market.active || market.closed) continue;

    const tokenIds = parseJsonArray(market.clobTokenIds);
    const outcomeNames = parseJsonArray(market.outcomes);
    // For NegRisk multi-outcome events, each market has 2 tokens (Yes/No)
    // We want the Yes token (index 0) — that's the one we'd buy
    const yesTokenId = tokenIds[0];
    if (!yesTokenId) continue;

    const result = await api.fetchOrderbook(yesTokenId);
    onOutcome?.();

    if (isErr(result) || result.data.asks.length === 0) {
      outcomes.push({
        question: market.question,
        tokenId: yesTokenId,
        bestAsk: null,
        bestAskSize: 0,
      });
      continue;
    }

    const bestAsk = result.data.asks[0];
    if (!bestAsk) {
      outcomes.push({
        question: market.question,
        tokenId: yesTokenId,
        bestAsk: null,
        bestAskSize: 0,
      });
      continue;
    }

    outcomes.push({
      question: market.question,
      tokenId: yesTokenId,
      bestAsk: parseFloat(bestAsk.price),
      bestAskSize: parseFloat(bestAsk.price) * parseFloat(bestAsk.size),
    });
  }

  return outcomes;
}

function detectArb(
  event: GammaEvent,
  outcomes: OutcomePrice[],
  threshold: number,
  minDepth: number,
): ArbOpportunity | null {
  const pricedOutcomes = outcomes.filter((o) => o.bestAsk !== null);
  const outcomesWithNoAsks = outcomes.length - pricedOutcomes.length;

  // Skip if too many outcomes have empty books
  if (pricedOutcomes.length < 2) return null;

  const sumOfAsks = pricedOutcomes.reduce(
    (sum, o) => sum + (o.bestAsk ?? 0),
    0,
  );
  const lowestDepth = Math.min(...pricedOutcomes.map((o) => o.bestAskSize));

  if (sumOfAsks >= threshold) return null;
  if (lowestDepth < minDepth) return null;

  return {
    event: { id: event.id, title: event.title, slug: event.slug },
    outcomes: outcomes.sort((a, b) => (b.bestAsk ?? 0) - (a.bestAsk ?? 0)),
    sumOfAsks,
    profitMargin: 1 - sumOfAsks,
    minDepth: lowestDepth,
    outcomesWithNoAsks,
  };
}

export async function scanArb(
  input: ScanArbInput,
  onProgress?: (p: ScanProgress) => void,
): Promise<ArbOpportunity[]> {
  const emit = onProgress ?? (() => {});

  // 1. Fetch all active events
  emit({ stage: "events", message: "Fetching events..." });
  const eventsResult = await api.fetchEvents((cur, tot) => {
    emit({
      stage: "events",
      message: "Fetching events...",
      current: cur,
      total: tot,
    });
  });
  if (isErr(eventsResult))
    throw new ScanError("events", eventsResult.error.message);

  // 2. Filter to multi-outcome events
  const filtered = filterEvents(
    eventsResult.data,
    input.minOutcomes,
    input.minVolume,
  );
  const totalOutcomes = filtered.reduce(
    (sum, e) => sum + e.markets.filter((m) => m.active && !m.closed).length,
    0,
  );
  emit({
    stage: "events",
    message: `${eventsResult.data.length} events, ${filtered.length} with ${input.minOutcomes}+ outcomes`,
  });

  // 3. Fetch orderbooks + detect arbs
  const opportunities: ArbOpportunity[] = [];
  let outcomesScanned = 0;

  for (const event of filtered) {
    const outcomes = await fetchEventOrderbooks(event, () => {
      outcomesScanned++;
      emit({
        stage: "orderbooks",
        message: "Fetching orderbooks...",
        current: outcomesScanned,
        total: totalOutcomes,
      });
    });

    const arb = detectArb(event, outcomes, input.threshold, input.minDepth);
    if (arb) opportunities.push(arb);
  }

  emit({
    stage: "done",
    message: `Scanned ${filtered.length} events (${totalOutcomes} outcomes)`,
  });
  return opportunities;
}
```

**File**: `src/lib/use-cases/index.ts` — add exports

```typescript
export { scanArb, ScanError } from "./scan-arb.js";
export type {
  ScanArbInput,
  ArbOpportunity,
  ScanProgress,
  ScanStage,
  OutcomePrice,
} from "./scan-arb.js";
```

### Verification

```bash
bun run typecheck

# Integration smoke test (fetches real data, takes ~30s)
bun -e '
import { scanArb } from "./src/lib/use-cases/index.js"
const opps = await scanArb(
  { threshold: 0.98, minOutcomes: 4, minVolume: 10_000, minDepth: 500 },
  p => process.stderr.write(`\r${p.stage}: ${p.current ?? ""}/${p.total ?? ""} ${p.message}`)
)
console.log("\n\nFound:", opps.length, "opportunities")
for (const o of opps) {
  console.log(`\n${o.event.title}: sum=$${o.sumOfAsks.toFixed(3)} margin=${(o.profitMargin*100).toFixed(1)}%`)
}
'
```

---

## Phase 3: CLI Command + Ink UI

### What This Accomplishes

Wire up `poly arb` command with flags and Ink output.

### Changes

**File**: `src/apps/cli/commands/arb.tsx` — new file

```typescript
import React, { useState, useEffect } from "react"
import { Box, Text } from "ink"
import Spinner from "ink-spinner"
import { scanArb, ScanError, type ScanProgress, type ArbOpportunity } from "../../../lib/use-cases/index.js"

interface Props {
  threshold: number
  minOutcomes: number
  minVolume: number
  minDepth: number
}

type State =
  | { status: "scanning"; progress: ScanProgress }
  | { status: "done"; opportunities: ArbOpportunity[]; elapsed: number }
  | { status: "error"; message: string; stage?: string }

export function ArbCommand({ threshold, minOutcomes, minVolume, minDepth }: Props) {
  const [state, setState] = useState<State>({
    status: "scanning",
    progress: { stage: "events", message: "Starting..." },
  })

  useEffect(() => {
    const start = Date.now()
    scanArb(
      { threshold, minOutcomes, minVolume, minDepth },
      p => setState({ status: "scanning", progress: p })
    )
      .then(opportunities =>
        setState({ status: "done", opportunities, elapsed: (Date.now() - start) / 1000 })
      )
      .catch(e => {
        const msg = e instanceof Error ? e.message : String(e)
        const stage = e instanceof ScanError ? e.stage : undefined
        setState({ status: "error", message: msg, stage })
      })
  }, [threshold, minOutcomes, minVolume, minDepth])

  if (state.status === "error") {
    return (
      <Box flexDirection="column">
        <Text color="red">Error: {state.message}</Text>
        {state.stage && <Text color="gray">Stage: {state.stage}</Text>}
      </Box>
    )
  }

  if (state.status === "scanning") {
    const { progress } = state
    const hasCount = progress.current !== undefined
    return (
      <Box>
        <Text color="green"><Spinner type="dots" /></Text>
        <Text> {progress.message}</Text>
        {hasCount && (
          <Text color="gray"> ({progress.current}/{progress.total})</Text>
        )}
      </Box>
    )
  }

  // Done
  const { opportunities, elapsed } = state
  return (
    <Box flexDirection="column">
      {opportunities.length === 0 ? (
        <Text color="yellow">No arbitrage opportunities found (threshold: {threshold})</Text>
      ) : (
        <>
          <Text bold color="green">=== ARBITRAGE OPPORTUNITIES ===</Text>
          <Text> </Text>
          {opportunities.map(opp => (
            <Box key={opp.event.id} flexDirection="column" marginBottom={1}>
              <Text bold color="green">
                {opp.event.slug}
              </Text>
              <Text>
                {"  "}Sum of asks: ${opp.sumOfAsks.toFixed(3)} ({opp.outcomes.length} outcomes
                {opp.outcomesWithNoAsks > 0 && `, ${opp.outcomesWithNoAsks} empty`})
              </Text>
              <Text>
                {"  "}Profit margin: {(opp.profitMargin * 100).toFixed(1)}%
              </Text>
              <Text>
                {"  "}Min depth: ${opp.minDepth.toFixed(0)}
              </Text>
              <Text color="gray">{"  "}Top outcomes:</Text>
              {opp.outcomes
                .filter(o => o.bestAsk !== null)
                .slice(0, 5)
                .map(o => (
                  <Text key={o.tokenId} color="gray">
                    {"    "}{o.question.slice(0, 40).padEnd(42)} ${o.bestAsk?.toFixed(3) ?? "N/A"} (${o.bestAskSize.toFixed(0)} avail)
                  </Text>
                ))}
            </Box>
          ))}
        </>
      )}
      <Text color="gray">Scanned in {elapsed.toFixed(1)}s | Threshold: {threshold}</Text>
    </Box>
  )
}
```

**File**: `src/apps/cli/index.tsx` — add arb command routing + flags

Full updated file:

```typescript
import meow from "meow"
import { render } from "ink"
import React from "react"
import { DumpCommand } from "./commands/dump.js"
import { ArbCommand } from "./commands/arb.js"

const cli = meow(
  `
  Usage
    $ poly dump <address>
    $ poly arb

  Commands
    dump <address>  Dump account data
    arb             Scan for arbitrage opportunities

  Options (dump)
    --days, -d          Days of history (default: 90)
    --output, -o        Output directory (default: ./data)

  Options (arb)
    --threshold, -t     Max sum of asks (default: 0.98)
    --min-outcomes, -m  Min outcomes per event (default: 4)
    --min-volume        Min event volume in USD (default: 10000)
    --min-depth         Min orderbook depth in USD (default: 500)

  Examples
    $ poly dump 0xd0b4...ed6 --days 30
    $ poly arb
    $ poly arb --threshold 0.95 --min-outcomes 6
`,
  {
    importMeta: import.meta,
    flags: {
      days: { type: "number", shortFlag: "d", default: 90 },
      output: { type: "string", shortFlag: "o", default: "./data" },
      threshold: { type: "number", shortFlag: "t", default: 0.98 },
      minOutcomes: { type: "number", shortFlag: "m", default: 4 },
      minVolume: { type: "number", default: 10_000 },
      minDepth: { type: "number", default: 500 },
    },
  }
)

const [command, target] = cli.input

if (command === "dump" && target) {
  render(<DumpCommand target={target} days={cli.flags.days} output={cli.flags.output} />)
} else if (command === "arb") {
  render(
    <ArbCommand
      threshold={cli.flags.threshold}
      minOutcomes={cli.flags.minOutcomes}
      minVolume={cli.flags.minVolume}
      minDepth={cli.flags.minDepth}
    />
  )
} else {
  cli.showHelp()
}
```

### Verification

```bash
bun run typecheck

# Run the scanner
poly arb

# With custom flags
poly arb --threshold 0.95

# With relaxed depth filter
poly arb --min-depth 100

# Help text shows arb command
poly --help
```

---

## Testing Strategy

### Manual Verification

```bash
# 1. Typecheck
bun run typecheck

# 2. Smoke test: API functions work
bun -e '
import { fetchEvents, fetchOrderbook } from "./src/lib/polymarket-api.js"
const r = await fetchEvents()
if ("data" in r) {
  console.log("Events:", r.data.length)
  const multi = r.data.filter(e => e.markets.filter(m => m.active && !m.closed).length >= 4)
  console.log("4+ outcomes:", multi.length)
}
'

# 3. Full scan
poly arb

# 4. Edge case: very high threshold (should find many)
poly arb --threshold 1.0

# 5. Edge case: very low threshold (should find none)
poly arb --threshold 0.5
```

### Spot Checks

- Verify sum calculation: pick one reported opportunity, manually fetch its orderbooks, confirm sum matches
- Verify filtering: confirm events with <4 outcomes are excluded
- Verify depth filter: confirm opportunities with <$500 at any ask are excluded
- Verify empty book handling: outcomes with no asks should be noted but not crash

## File Summary

```
src/
├── apps/cli/
│   ├── index.tsx               # MODIFIED: add arb command + flags
│   └── commands/
│       ├── dump.tsx            # unchanged
│       └── arb.tsx             # NEW: Ink component for arb scan
└── lib/
    ├── polymarket-api.ts       # MODIFIED: add fetchEvents, fetchOrderbook
    ├── types.ts                # MODIFIED: add GammaEvent, GammaEventMarket, CLOBOrderbook, OrderLevel
    ├── result.ts               # unchanged
    ├── fs.ts                   # unchanged
    └── use-cases/
        ├── index.ts            # MODIFIED: re-export scan-arb
        ├── scan-arb.ts         # NEW: core arb detection logic
        ├── dump-account.ts     # unchanged
        └── compute-summary.ts  # unchanged
```

**New files:** 2 (`scan-arb.ts`, `arb.tsx`)
**Modified files:** 3 (`types.ts`, `polymarket-api.ts`, `index.tsx`, `use-cases/index.ts`)

## Open Questions

- Gamma events endpoint: does `active=true` filter work or do we need to filter client-side? (will verify in Phase 1 smoke test)
- `bestAskSize` calculation: `price * size` gives USD value, but `size` might already be in USD depending on CLOB API semantics — need to verify with real data
- Rate limiting: with ~200 orderbook fetches at 100ms each, scan takes ~20s. Acceptable for v1?
