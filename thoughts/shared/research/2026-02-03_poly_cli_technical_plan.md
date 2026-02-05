# poly CLI - Technical Plan

Bun + Ink + Meow CLI for dumping Polymarket account data.

---

## Stack

| Layer | Tech | Why |
|-------|------|-----|
| Runtime | Bun | Fast, native TS, built-in fetch |
| CLI parsing | Meow | Simple, declarative flags |
| UI | Ink | React-based, live updates for progress |
| HTTP | Built-in fetch | No deps needed |
| Daemon | Bun-native | No framework, just intervals |

---

## Architecture

Single package with clear folder boundaries. Extract to monorepo when needed.

```
../poly/
├── package.json
├── tsconfig.json
├── src/
│   ├── apps/                         # Runnable things
│   │   ├── cli/
│   │   │   ├── index.tsx             # Meow entry
│   │   │   ├── commands/
│   │   │   │   └── dump.tsx
│   │   │   └── components/
│   │   │       ├── Progress.tsx
│   │   │       └── Summary.tsx
│   │   │
│   │   └── daemon/
│   │       └── index.ts
│   │
│   └── lib/                          # Library code
│       ├── use-cases/
│       │   ├── dump-account.ts
│       │   ├── compute-summary.ts
│       │   └── index.ts
│       │
│       ├── polymarket-api.ts         # Polymarket API client
│       │
│       ├── result.ts                 # Result<T, E> type
│       ├── fs.ts                     # File utilities
│       └── types.ts                  # Shared types
│
├── data/                             # Output data (git-tracked)
│   └── accounts/
│       └── <address>/
│           └── <YYYY-MM-DD>/
│               ├── activity.json
│               ├── positions.json
│               ├── profile.json
│               ├── markets.json
│               ├── summary.json
│               └── meta.json
│
└── bin/
    ├── poly                          # CLI entry
    └── polyd                         # Daemon entry
```

**Key rules:**
1. `apps/` = runnable things (cli, daemon, future api)
2. `lib/` = library code (use-cases, polymarket client, utilities)
3. Apps are thin - they call use-cases
4. Barrel exports define public API

---

## Use-Cases

Use-cases = functions that do business things. They use the API client for data fetching.

### `src/lib/use-cases/dump-account.ts`

```ts
import * as polymarket from "../polymarket-api.js"
import { writeOutput } from "../fs.js"
import { computeSummary } from "./compute-summary.js"
import type { Activity, Position, Profile, Market, Summary } from "../types.js"

export interface DumpAccountInput {
  target: string        // address or username
  days: number
  outputDir: string
}

export interface DumpAccountResult {
  outputPath: string
  address: string
  summary: Summary
}

export interface DumpProgress {
  stage: "resolve" | "activity" | "positions" | "profile" | "markets" | "summary" | "writing"
  message: string
  current?: number
  total?: number
}

export async function dumpAccount(
  input: DumpAccountInput,
  onProgress?: (p: DumpProgress) => void
): Promise<DumpAccountResult> {
  const emit = onProgress ?? (() => {})

  // 1. Resolve username → address
  emit({ stage: "resolve", message: "Resolving address" })
  const address = await polymarket.resolveAddress(input.target)

  // 2. Fetch activity (paginated)
  emit({ stage: "activity", message: "Fetching activity" })
  const activity = await polymarket.fetchActivity(address, input.days, (cur, tot) => {
    emit({ stage: "activity", current: cur, total: tot })
  })

  // 3. Fetch positions
  emit({ stage: "positions", message: "Fetching positions" })
  const positions = await polymarket.fetchPositions(address)

  // 4. Fetch profile
  emit({ stage: "profile", message: "Fetching profile" })
  const profile = await polymarket.fetchProfile(address)

  // 5. Fetch market details
  emit({ stage: "markets", message: "Fetching markets" })
  const conditionIds = [...new Set(activity.map(a => a.conditionId))]
  const markets = await polymarket.fetchMarkets(conditionIds, (cur, tot) => {
    emit({ stage: "markets", current: cur, total: tot })
  })

  // 6. Compute summary
  emit({ stage: "summary", message: "Computing summary" })
  const summary = computeSummary(activity, positions)

  // 7. Write output
  emit({ stage: "writing", message: "Writing files" })
  const outputPath = await writeOutput(input.outputDir, address, {
    activity,
    positions,
    profile,
    markets,
    summary,
  })

  return { outputPath, summary, address }
}
```

---

### `src/lib/use-cases/compute-summary.ts`

```ts
import type { Activity, Position, Summary } from "../types.js"

export function computeSummary(activity: Activity[], positions: Position[]): Summary {
  const trades = activity.filter(a => a.type === "trade")
  const redeems = activity.filter(a => a.type === "redeem")

  const buys = trades.filter(t => t.side === "buy")
  const sells = trades.filter(t => t.side === "sell")

  const totalVolume = trades.reduce((sum, t) => sum + t.size * t.price, 0)
  const redeemValue = redeems.reduce((sum, r) => sum + r.size, 0)

  // Group by event for both-sides detection
  const byEvent = groupBy(trades, t => t.eventSlug)
  const bothSidesTrades = Object.entries(byEvent)
    .filter(([_, ts]) => new Set(ts.map(t => t.outcome)).size > 1)
    .map(([event, ts]) => ({ event, trades: ts.length }))

  // Category breakdown
  const byCategory = groupBy(trades, t => t.category ?? "unknown")
  const categoryBreakdown = Object.entries(byCategory)
    .map(([category, ts]) => ({
      category,
      trades: ts.length,
      volume: ts.reduce((sum, t) => sum + t.size * t.price, 0),
    }))
    .sort((a, b) => b.volume - a.volume)

  // Top outcomes
  const byOutcome = groupBy(trades, t => t.outcome)
  const topOutcomes = Object.entries(byOutcome)
    .map(([outcome, ts]) => ({
      outcome,
      trades: ts.length,
      volume: ts.reduce((sum, t) => sum + t.size * t.price, 0),
    }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 20)

  // Time stats
  const timestamps = trades.map(t => new Date(t.timestamp).getTime())
  const minTs = Math.min(...timestamps)
  const maxTs = Math.max(...timestamps)
  const dayCount = (maxTs - minTs) / (24 * 60 * 60 * 1000)

  return {
    totalTrades: trades.length,
    totalVolume,
    estimatedProfit: redeemValue - totalVolume,
    buyCount: buys.length,
    sellCount: sells.length,
    buyRatio: buys.length / trades.length,
    avgTradeSize: totalVolume / trades.length,
    tradesPerDay: trades.length / Math.max(1, dayCount),
    timeRange: {
      start: new Date(minTs).toISOString(),
      end: new Date(maxTs).toISOString(),
    },
    categoryBreakdown,
    topOutcomes,
    bothSidesTrades,
    largePositions: positions.filter(p => p.value > 10000).length,
    openPositionsValue: positions.reduce((sum, p) => sum + p.value, 0),
  }
}

function groupBy<T>(items: T[], key: (item: T) => string): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const k = key(item)
    ;(acc[k] ??= []).push(item)
    return acc
  }, {} as Record<string, T[]>)
}
```

---

### `src/lib/use-cases/index.ts`

```ts
export { dumpAccount, type DumpAccountInput, type DumpAccountResult, type DumpProgress } from "./dump-account.js"
export { computeSummary } from "./compute-summary.js"
```

---

## Polymarket API Client: `src/lib/polymarket-api.ts`

Single file with all Polymarket API functions.

```ts
import type { Activity, Position, Profile, Market } from "./types.js"

const BASE = "https://data-api.polymarket.com"
const PAGE_SIZE = 100
const RATE_LIMIT_MS = 100

let lastRequest = 0

async function apiFetch<T>(url: string): Promise<T> {
  const now = Date.now()
  const wait = Math.max(0, RATE_LIMIT_MS - (now - lastRequest))
  if (wait > 0) await sleep(wait)
  lastRequest = Date.now()

  const res = await fetch(url)
  if (!res.ok) throw new Error(`API ${res.status}: ${url}`)
  return res.json()
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// Resolve username to address (or return address if already valid)
export async function resolveAddress(target: string): Promise<string> {
  if (target.startsWith("0x")) return target
  const profiles = await apiFetch<Profile[]>(`${BASE}/profiles?usernames=${target}`)
  if (profiles.length === 0) throw new Error(`User not found: ${target}`)
  return profiles[0].address
}

// Fetch activity with pagination
export async function fetchActivity(
  address: string,
  days: number,
  onPage?: (current: number, total: number) => void
): Promise<Activity[]> {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  const all: Activity[] = []
  let offset = 0

  while (true) {
    const url = `${BASE}/activity?user=${address}&limit=${PAGE_SIZE}&offset=${offset}`
    const page = await apiFetch<Activity[]>(url)

    if (page.length === 0) break

    const inRange = page.filter(a => new Date(a.timestamp).getTime() >= cutoff)
    all.push(...inRange)

    if (inRange.length < page.length) break

    offset += PAGE_SIZE
    onPage?.(all.length, all.length + PAGE_SIZE)
  }

  onPage?.(all.length, all.length)
  return all
}

// Fetch current positions
export async function fetchPositions(address: string): Promise<Position[]> {
  return apiFetch<Position[]>(`${BASE}/positions?user=${address}`)
}

// Fetch profile
export async function fetchProfile(address: string): Promise<Profile> {
  const profiles = await apiFetch<Profile[]>(`${BASE}/profiles?addresses=${address}`)
  if (profiles.length === 0) throw new Error(`Profile not found: ${address}`)
  return profiles[0]
}

// Fetch market details
export async function fetchMarkets(
  conditionIds: string[],
  onItem?: (current: number, total: number) => void
): Promise<Record<string, Market>> {
  const markets: Record<string, Market> = {}

  for (let i = 0; i < conditionIds.length; i++) {
    const id = conditionIds[i]
    markets[id] = await apiFetch<Market>(`https://clob.polymarket.com/markets/${id}`)
    onItem?.(i + 1, conditionIds.length)
  }

  return markets
}
```

---

## Result Type: `src/lib/result.ts`

```ts
type Ok<T> = Readonly<{ tag: "Ok"; data: T }>
type Err<E> = Readonly<{ tag: "Err"; err: E }>

export type Result<T, E> = Ok<T> | Err<E>

export function ok<T>(data: T): Result<T, never> {
  return Object.freeze({ tag: "Ok", data })
}

export function err<E>(e: E): Result<never, E> {
  return Object.freeze({ tag: "Err", err: e })
}

export function isOk<T, E>(r: Result<T, E>): r is Ok<T> {
  return r.tag === "Ok"
}

export function isErr<T, E>(r: Result<T, E>): r is Err<E> {
  return r.tag === "Err"
}

export function unwrap<T, E>(r: Result<T, E>): T {
  if (r.tag === "Ok") return r.data
  throw r.err
}
```

---

## CLI Adapter: `src/apps/cli/commands/dump.tsx`

Thin wrapper - renders progress from use-case callback.

```tsx
import { useState, useEffect } from "react"
import { Box, Text } from "ink"
import Spinner from "ink-spinner"
import { dumpAccount, type DumpProgress, type DumpAccountResult } from "../../../lib/use-cases/index.js"

interface Props {
  target: string
  days: number
  output: string
}

export function DumpCommand({ target, days, output }: Props) {
  const [progress, setProgress] = useState<DumpProgress>({ stage: "resolve", message: "Starting" })
  const [result, setResult] = useState<DumpAccountResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    dumpAccount({ target, days, outputDir: output }, setProgress)
      .then(setResult)
      .catch(e => setError(e.message))
  }, [])

  if (error) return <Text color="red">Error: {error}</Text>

  if (result) {
    return (
      <Box flexDirection="column">
        <Text color="green">✓ Saved to {result.outputPath}</Text>
        <Text>  Trades: {result.summary.totalTrades}</Text>
        <Text>  Volume: ${result.summary.totalVolume.toLocaleString()}</Text>
      </Box>
    )
  }

  return (
    <Box>
      <Spinner type="dots" />
      <Text> {progress.message}</Text>
      {progress.total && <Text color="gray"> ({progress.current}/{progress.total})</Text>}
    </Box>
  )
}
```

---

## Daemon: `src/apps/daemon/index.ts`

Same use-case, different adapter.

```ts
import { dumpAccount } from "../../lib/use-cases/index.js"

interface Config {
  accounts: string[]
  intervalHours: number
  outputDir: string
}

export async function startDaemon(config: Config) {
  console.log(`Starting daemon: ${config.accounts.length} accounts`)

  await runAll(config)
  setInterval(() => runAll(config), config.intervalHours * 60 * 60 * 1000)
}

async function runAll(config: Config) {
  for (const account of config.accounts) {
    try {
      console.log(`Dumping ${account}`)
      const result = await dumpAccount(
        { target: account, days: 90, outputDir: config.outputDir },
        p => console.log(`  ${p.message}`)
      )
      console.log(`Done: ${result.summary.totalTrades} trades`)
    } catch (e) {
      console.error(`Failed: ${account}`, e)
    }
  }
}
```

---

## package.json

```json
{
  "name": "poly",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "poly": "./bin/poly",
    "polyd": "./bin/polyd"
  },
  "scripts": {
    "cli": "bun run src/apps/cli/index.tsx",
    "daemon": "bun run src/apps/daemon/index.ts",
    "test": "bun test"
  },
  "dependencies": {
    "ink": "^5.0.1",
    "ink-spinner": "^5.0.0",
    "meow": "^13.2.0",
    "react": "^18.3.1"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "@types/react": "^18.3.0",
    "typescript": "^5.0.0"
  }
}
```

---

## bin/poly

```ts
#!/usr/bin/env bun
import '../src/apps/cli/index.tsx'
```

## bin/polyd

```ts
#!/usr/bin/env bun
import '../src/apps/daemon/index.ts'
```

---

## Unresolved Questions

1. **Username resolution** - Does profile API return address when queried by username?
2. **Activity schema** - Exact field names (eventSlug vs slug, conditionId)?
3. **Market details endpoint** - CLOB vs data-api?
4. **Ink v5 + Bun compat** - Any issues?
