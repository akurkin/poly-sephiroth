# poly CLI - Implementation Plan

Bun + Ink + Meow CLI for dumping Polymarket account data.

## Overview

Build CLI tool that dumps Polymarket account activity, positions, profile, and market data to JSON files. Uses Ink for terminal UI with progress spinner.

## Current State

- Greenfield project - no code exists
- Tech plan at `thoughts/shared/research/2026-02-03_poly_cli_technical_plan.md`
- API schemas at `.claude/skills/polymarket-dev/references/response_schemas.md`

## Desired End State

```bash
# Dump account data
./bin/poly dump MrSparklySimpsons --days 30

# Output structure
data/accounts/0x.../2026-02-03/
├── activity.json
├── positions.json
├── profile.json
├── markets.json
├── summary.json
└── meta.json
```

## Out of Scope

- Trading/order placement
- Real-time monitoring
- Database storage
- Web UI

---

## Phase 1: Project Setup

### Files

**package.json**
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
    "typecheck": "tsc --noEmit"
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

**tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "noUncheckedIndexedAccess": true,
    "lib": ["ESNext"],
    "types": ["bun-types"]
  },
  "include": ["src/**/*", "bin/*"]
}
```

**bin/poly**
```ts
#!/usr/bin/env bun
import "../src/apps/cli/index.tsx"
```

**bin/polyd**
```ts
#!/usr/bin/env bun
import "../src/apps/daemon/index.ts"
```

**data/.gitkeep** (empty)

### Verify
```bash
bun install && bun run typecheck
```

---

## Phase 2: Types & Utilities

### Files

**src/lib/types.ts** - Types from verified API schemas
```ts
export interface Activity {
  id: string
  timestamp: string
  type: "trade" | "redeem" | "deposit" | "withdraw"
  conditionId: string
  eventSlug: string
  outcome: string
  side: "buy" | "sell"
  size: number
  price: number
  category: string
}

export interface Position {
  conditionId: string
  outcome: string
  size: number
  avgPrice: number
  value: number
  pnl: number
  eventSlug: string
  category: string
}

export interface Profile {
  address: string
  username: string
  bio: string
  avatar: string
  pnl: number
  volume: number
  positions: number
  tradesCount: number
}

export interface GammaMarket {
  id: string
  question: string
  conditionId: string
  slug: string
  category: string
  outcomes: string
  outcomePrices: string
  volumeNum: number
}

export interface Summary {
  totalTrades: number
  totalVolume: number
  estimatedProfit: number
  buyCount: number
  sellCount: number
  buyRatio: number
  avgTradeSize: number
  tradesPerDay: number
  timeRange: { start: string; end: string }
  categoryBreakdown: Array<{ category: string; trades: number; volume: number }>
  topOutcomes: Array<{ outcome: string; trades: number; volume: number }>
  bothSidesTrades: Array<{ event: string; trades: number }>
  largePositions: number
  openPositionsValue: number
}

export interface DumpMeta {
  address: string
  username: string | null
  dumpedAt: string
  days: number
  version: string
}
```

**src/lib/result.ts**
```ts
export type Result<T, E = Error> = { data: T } | { error: E }

export const ok = <T>(data: T): Result<T, never> => ({ data })
export const err = <E>(error: E): Result<never, E> => ({ error })
export const isOk = <T, E>(r: Result<T, E>): r is { data: T } => "data" in r
export const isErr = <T, E>(r: Result<T, E>): r is { error: E } => "error" in r
```

**src/lib/fs.ts**
```ts
import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import type { Activity, Position, Profile, GammaMarket, Summary, DumpMeta } from "./types.js"

export interface DumpData {
  activity: Activity[]
  positions: Position[]
  profile: Profile
  markets: Record<string, GammaMarket>
  summary: Summary
}

export async function writeOutput(
  baseDir: string,
  address: string,
  data: DumpData,
  days: number
): Promise<string> {
  const dateStr = new Date().toISOString().split("T")[0]
  const outputDir = join(baseDir, "accounts", address.toLowerCase(), dateStr)

  await mkdir(outputDir, { recursive: true })

  const meta: DumpMeta = {
    address,
    username: data.profile.username || null,
    dumpedAt: new Date().toISOString(),
    days,
    version: "0.1.0",
  }

  await Promise.all([
    writeFile(join(outputDir, "activity.json"), JSON.stringify(data.activity, null, 2)),
    writeFile(join(outputDir, "positions.json"), JSON.stringify(data.positions, null, 2)),
    writeFile(join(outputDir, "profile.json"), JSON.stringify(data.profile, null, 2)),
    writeFile(join(outputDir, "markets.json"), JSON.stringify(data.markets, null, 2)),
    writeFile(join(outputDir, "summary.json"), JSON.stringify(data.summary, null, 2)),
    writeFile(join(outputDir, "meta.json"), JSON.stringify(meta, null, 2)),
  ])

  return outputDir
}
```

### Verify
```bash
bun run typecheck
```

---

## Phase 3: Polymarket API Client

### Files

**src/lib/polymarket-api.ts**
```ts
import type { Activity, Position, Profile, GammaMarket } from "./types.js"
import { ok, err, type Result } from "./result.js"

const DATA_API = "https://data-api.polymarket.com"
const GAMMA_API = "https://gamma-api.polymarket.com"
const PAGE_SIZE = 100
const RATE_LIMIT_MS = 100

let lastRequest = 0

async function apiFetch<T>(url: string): Promise<Result<T>> {
  const wait = Math.max(0, RATE_LIMIT_MS - (Date.now() - lastRequest))
  if (wait > 0) await new Promise(r => setTimeout(r, wait))
  lastRequest = Date.now()

  const res = await fetch(url)
  if (!res.ok) return err(new Error(`HTTP ${res.status}: ${url}`))
  return ok(await res.json() as T)
}

export async function resolveAddress(target: string): Promise<Result<string>> {
  if (target.startsWith("0x") && target.length === 42) return ok(target)

  const result = await apiFetch<Profile[]>(`${DATA_API}/profiles?usernames=${target}`)
  if ("error" in result) return result

  const profile = result.data[0]
  if (!profile) return err(new Error(`User not found: ${target}`))
  return ok(profile.address)
}

export type ProgressFn = (current: number, total: number) => void

export async function fetchActivity(
  address: string,
  days: number,
  onProgress?: ProgressFn
): Promise<Result<Activity[]>> {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  const all: Activity[] = []
  let offset = 0

  while (true) {
    const result = await apiFetch<Activity[]>(
      `${DATA_API}/activity?user=${address}&limit=${PAGE_SIZE}&offset=${offset}`
    )
    if ("error" in result) return result

    const page = result.data
    if (page.length === 0) break

    const inRange = page.filter(a => new Date(a.timestamp).getTime() >= cutoff)
    all.push(...inRange)
    onProgress?.(all.length, all.length + PAGE_SIZE)

    if (inRange.length < page.length) break
    offset += PAGE_SIZE
  }

  return ok(all)
}

export async function fetchPositions(address: string): Promise<Result<Position[]>> {
  return apiFetch<Position[]>(`${DATA_API}/positions?user=${address}`)
}

export async function fetchProfile(address: string): Promise<Result<Profile>> {
  const result = await apiFetch<Profile[]>(`${DATA_API}/profiles?addresses=${address}`)
  if ("error" in result) return result

  const profile = result.data[0]
  if (!profile) return err(new Error(`Profile not found: ${address}`))
  return ok(profile)
}

export async function fetchMarkets(
  conditionIds: string[],
  onProgress?: ProgressFn
): Promise<Result<Record<string, GammaMarket>>> {
  const markets: Record<string, GammaMarket> = {}
  const unique = [...new Set(conditionIds)]

  for (let i = 0; i < unique.length; i++) {
    const id = unique[i]
    if (!id) continue

    const result = await apiFetch<GammaMarket[]>(`${GAMMA_API}/markets?conditionId=${id}`)
    if ("data" in result && result.data[0]) {
      markets[id] = result.data[0]
    }
    onProgress?.(i + 1, unique.length)
  }

  return ok(markets)
}
```

### Verify
```bash
bun run typecheck
```

---

## Phase 4: Use-Cases

### Files

**src/lib/use-cases/compute-summary.ts**
```ts
import type { Activity, Position, Summary } from "../types.js"

function groupBy<T>(items: T[], key: (t: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {}
  for (const item of items) {
    const k = key(item)
    ;(result[k] ??= []).push(item)
  }
  return result
}

export function computeSummary(activity: Activity[], positions: Position[]): Summary {
  const trades = activity.filter(a => a.type === "trade")
  const redeems = activity.filter(a => a.type === "redeem")
  const buys = trades.filter(t => t.side === "buy")
  const sells = trades.filter(t => t.side === "sell")

  const totalVolume = trades.reduce((s, t) => s + t.size * t.price, 0)
  const redeemValue = redeems.reduce((s, r) => s + r.size, 0)

  const byEvent = groupBy(trades, t => t.eventSlug)
  const bothSidesTrades = Object.entries(byEvent)
    .filter(([, ts]) => new Set(ts.map(t => t.outcome)).size > 1)
    .map(([event, ts]) => ({ event, trades: ts.length }))

  const byCategory = groupBy(trades, t => t.category || "unknown")
  const categoryBreakdown = Object.entries(byCategory)
    .map(([category, ts]) => ({
      category,
      trades: ts.length,
      volume: ts.reduce((s, t) => s + t.size * t.price, 0),
    }))
    .sort((a, b) => b.volume - a.volume)

  const byOutcome = groupBy(trades, t => t.outcome)
  const topOutcomes = Object.entries(byOutcome)
    .map(([outcome, ts]) => ({
      outcome,
      trades: ts.length,
      volume: ts.reduce((s, t) => s + t.size * t.price, 0),
    }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 20)

  const timestamps = trades.map(t => new Date(t.timestamp).getTime())
  const minTs = timestamps.length ? Math.min(...timestamps) : Date.now()
  const maxTs = timestamps.length ? Math.max(...timestamps) : Date.now()
  const dayCount = Math.max(1, (maxTs - minTs) / (24 * 60 * 60 * 1000))

  return {
    totalTrades: trades.length,
    totalVolume,
    estimatedProfit: redeemValue - totalVolume,
    buyCount: buys.length,
    sellCount: sells.length,
    buyRatio: trades.length ? buys.length / trades.length : 0,
    avgTradeSize: trades.length ? totalVolume / trades.length : 0,
    tradesPerDay: trades.length / dayCount,
    timeRange: { start: new Date(minTs).toISOString(), end: new Date(maxTs).toISOString() },
    categoryBreakdown,
    topOutcomes,
    bothSidesTrades,
    largePositions: positions.filter(p => p.value > 10000).length,
    openPositionsValue: positions.reduce((s, p) => s + p.value, 0),
  }
}
```

**src/lib/use-cases/dump-account.ts**
```ts
import * as api from "../polymarket-api.js"
import { writeOutput } from "../fs.js"
import { computeSummary } from "./compute-summary.js"
import { isErr } from "../result.js"
import type { Summary } from "../types.js"

export interface DumpAccountInput {
  target: string
  days: number
  outputDir: string
}

export interface DumpAccountResult {
  outputPath: string
  address: string
  summary: Summary
}

export type DumpStage = "resolve" | "activity" | "positions" | "profile" | "markets" | "summary" | "writing"

export interface DumpProgress {
  stage: DumpStage
  message: string
  current?: number
  total?: number
}

export class DumpError extends Error {
  constructor(public stage: DumpStage, message: string) {
    super(message)
    this.name = "DumpError"
  }
}

export async function dumpAccount(
  input: DumpAccountInput,
  onProgress?: (p: DumpProgress) => void
): Promise<DumpAccountResult> {
  const emit = onProgress ?? (() => {})

  emit({ stage: "resolve", message: "Resolving address..." })
  const addrResult = await api.resolveAddress(input.target)
  if (isErr(addrResult)) throw new DumpError("resolve", addrResult.error.message)
  const address = addrResult.data

  emit({ stage: "activity", message: "Fetching activity..." })
  const actResult = await api.fetchActivity(address, input.days, (cur, tot) => {
    emit({ stage: "activity", message: "Fetching activity...", current: cur, total: tot })
  })
  if (isErr(actResult)) throw new DumpError("activity", actResult.error.message)

  emit({ stage: "positions", message: "Fetching positions..." })
  const posResult = await api.fetchPositions(address)
  if (isErr(posResult)) throw new DumpError("positions", posResult.error.message)

  emit({ stage: "profile", message: "Fetching profile..." })
  const profResult = await api.fetchProfile(address)
  if (isErr(profResult)) throw new DumpError("profile", profResult.error.message)

  emit({ stage: "markets", message: "Fetching markets..." })
  const conditionIds = [...new Set(actResult.data.map(a => a.conditionId))]
  const mktResult = await api.fetchMarkets(conditionIds, (cur, tot) => {
    emit({ stage: "markets", message: "Fetching markets...", current: cur, total: tot })
  })
  if (isErr(mktResult)) throw new DumpError("markets", mktResult.error.message)

  emit({ stage: "summary", message: "Computing summary..." })
  const summary = computeSummary(actResult.data, posResult.data)

  emit({ stage: "writing", message: "Writing files..." })
  const outputPath = await writeOutput(input.outputDir, address, {
    activity: actResult.data,
    positions: posResult.data,
    profile: profResult.data,
    markets: mktResult.data,
    summary,
  }, input.days)

  return { outputPath, address, summary }
}
```

**src/lib/use-cases/index.ts**
```ts
export { dumpAccount, DumpError } from "./dump-account.js"
export type { DumpAccountInput, DumpAccountResult, DumpProgress, DumpStage } from "./dump-account.js"
export { computeSummary } from "./compute-summary.js"
```

### Verify
```bash
bun run typecheck
```

---

## Phase 5: CLI with Ink/Meow

### Files

**src/apps/cli/index.tsx**
```tsx
import meow from "meow"
import { render } from "ink"
import React from "react"
import { DumpCommand } from "./commands/dump.js"

const cli = meow(`
  Usage
    $ poly dump <address|username>

  Options
    --days, -d    Days of history (default: 90)
    --output, -o  Output directory (default: ./data)

  Examples
    $ poly dump MrSparklySimpsons --days 30
`, {
  importMeta: import.meta,
  flags: {
    days: { type: "number", shortFlag: "d", default: 90 },
    output: { type: "string", shortFlag: "o", default: "./data" },
  },
})

const [command, target] = cli.input

if (command === "dump" && target) {
  render(<DumpCommand target={target} days={cli.flags.days} output={cli.flags.output} />)
} else {
  cli.showHelp()
}
```

**src/apps/cli/commands/dump.tsx**
```tsx
import React, { useState, useEffect } from "react"
import { Box, Text } from "ink"
import Spinner from "ink-spinner"
import { dumpAccount, DumpError, type DumpProgress, type DumpAccountResult } from "../../../lib/use-cases/index.js"

interface Props {
  target: string
  days: number
  output: string
}

type State =
  | { status: "loading"; progress: DumpProgress }
  | { status: "success"; result: DumpAccountResult }
  | { status: "error"; message: string; stage?: string }

const LABELS: Record<string, string> = {
  resolve: "Resolving address",
  activity: "Fetching activity",
  positions: "Fetching positions",
  profile: "Fetching profile",
  markets: "Fetching markets",
  summary: "Computing summary",
  writing: "Writing files",
}

export function DumpCommand({ target, days, output }: Props) {
  const [state, setState] = useState<State>({
    status: "loading",
    progress: { stage: "resolve", message: "Starting..." },
  })

  useEffect(() => {
    dumpAccount({ target, days, outputDir: output }, p => setState({ status: "loading", progress: p }))
      .then(result => setState({ status: "success", result }))
      .catch(e => {
        const msg = e instanceof Error ? e.message : String(e)
        const stage = e instanceof DumpError ? e.stage : undefined
        setState({ status: "error", message: msg, stage })
      })
  }, [target, days, output])

  if (state.status === "error") {
    return (
      <Box flexDirection="column">
        <Text color="red">Error: {state.message}</Text>
        {state.stage && <Text color="gray">Stage: {state.stage}</Text>}
      </Box>
    )
  }

  if (state.status === "success") {
    const { result } = state
    const { summary } = result
    return (
      <Box flexDirection="column">
        <Text color="green">✓ Saved to {result.outputPath}</Text>
        <Text>  Trades: {summary.totalTrades.toLocaleString()}</Text>
        <Text>  Volume: ${summary.totalVolume.toLocaleString()}</Text>
        <Text color={summary.estimatedProfit >= 0 ? "green" : "red"}>
          {"  "}Est. Profit: ${summary.estimatedProfit.toLocaleString()}
        </Text>
      </Box>
    )
  }

  const { progress } = state
  const label = LABELS[progress.stage] ?? progress.message
  const showCount = progress.current !== undefined

  return (
    <Box>
      <Text color="green"><Spinner type="dots" /></Text>
      <Text> {label}</Text>
      {showCount && <Text color="gray"> ({progress.current}/{progress.total})</Text>}
    </Box>
  )
}
```

**src/apps/daemon/index.ts**
```ts
import { dumpAccount } from "../../lib/use-cases/index.js"

const accounts = process.argv.slice(2)
if (accounts.length === 0) {
  console.error("Usage: polyd <address> [address...]")
  process.exit(1)
}

async function run() {
  for (const account of accounts) {
    console.log(`Dumping ${account}...`)
    try {
      const result = await dumpAccount(
        { target: account, days: 90, outputDir: "./data" },
        p => console.log(`  ${p.message}`)
      )
      console.log(`  Done: ${result.summary.totalTrades} trades`)
    } catch (e) {
      console.error(`  Failed:`, e instanceof Error ? e.message : e)
    }
  }
}

run()
setInterval(run, 6 * 60 * 60 * 1000)
```

### Verify
```bash
chmod +x bin/poly bin/polyd
bun run cli dump --help
bun run cli dump 0xd0b4c4c020abdc88ad9a884f999f3d8cff8ffed6 --days 7
```

---

## File Summary

```
poly-sephiroth/
├── package.json
├── tsconfig.json
├── bin/
│   ├── poly
│   └── polyd
├── src/
│   ├── apps/
│   │   ├── cli/
│   │   │   ├── index.tsx
│   │   │   └── commands/dump.tsx
│   │   └── daemon/index.ts
│   └── lib/
│       ├── use-cases/
│       │   ├── dump-account.ts
│       │   ├── compute-summary.ts
│       │   └── index.ts
│       ├── polymarket-api.ts
│       ├── result.ts
│       ├── fs.ts
│       └── types.ts
└── data/.gitkeep
```

**Total: 14 files**

---

## Verification

```bash
# Install deps
bun install

# Type check
bun run typecheck

# Test CLI help
bun run cli dump --help

# Integration test
bun run cli dump 0xd0b4c4c020abdc88ad9a884f999f3d8cff8ffed6 --days 7

# Check output
ls data/accounts/
```

## Open Questions

None - all resolved via tech plan and API schemas.
