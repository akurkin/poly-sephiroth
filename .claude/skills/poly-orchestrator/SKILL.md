---
name: poly-orchestrator
description: |
  Orchestrates sub-agents for Polymarket research and analysis tasks.
  Use when tasks require isolated contexts, parallel execution, or background processing.
  Triggers: "scan markets", "batch analyze", "monitor", "compare accounts", "run in background"
---

# poly-orchestrator

Coordinate sub-agents for Polymarket workflows. Keeps main thread clean, enables parallelism.

## Core Principle

**Never do heavy analysis in main thread.** Spawn agents for:
- File reading and analysis
- API calls and data fetching
- Pattern recognition and research
- Anything that consumes significant context

Main thread only:
- Validates inputs
- Spawns appropriate agents
- Aggregates results
- **Saves analysis to SUMMARY.md**
- Presents to user

---

## Agent Catalog

### Analysis Agents

**account-analyzer**
```yaml
type: general-purpose
model: sonnet
purpose: Full strategy analysis of dumped account
prompt: |
  Analyze Polymarket account at {data_path}.

  Read files: meta.json, summary.json, profile.json, activity.json

  Workflow:
  1. State facts (trades, volume, profit, buy ratio)
  2. Identify patterns (timing, concentration, margins)
  3. Form hypothesis (arbitrage/predictive/market-maker)
  4. Test against data
  5. Conclude with strategy, confidence, edge source

  Use Strategy Fingerprints:
  - Arbitrageur: ~50% buy ratio, both-sides trades, 2-5% margins
  - Predictive: >90% buy ratio, category focus, 20-50% returns
  - Market Maker: ~50% buy/sell, spread capture, high frequency
```

**quick-stats**
```yaml
type: general-purpose
model: haiku
purpose: Fast metrics extraction
prompt: |
  Read {data_path}/summary.json.
  Report: trades, volume, profit, return %, buy ratio, top categories.
  Concise output only.
```

**account-comparator**
```yaml
type: general-purpose
model: sonnet
purpose: Compare multiple accounts
prompt: |
  Compare accounts:
  {account_list}

  For each: strategy type, key metrics, category focus.
  Then: similarities, differences, performance ranking.
```

### Data Agents

**data-fetcher**
```yaml
type: Bash
model: haiku
purpose: Dump fresh account data
prompt: |
  Run: poly dump {target} --days {days} --output ./data
  Report success and output path.
```

**market-price-fetcher**
```yaml
type: Bash
model: haiku
purpose: Get current market prices
prompt: |
  Fetch prices for market {slug}:
  curl -s "https://gamma-api.polymarket.com/markets?slug={slug}" | head -100
  curl -s "https://clob.polymarket.com/book?token_id={token_id}" | head -50
```

**arb-scanner**
```yaml
type: general-purpose
model: haiku
purpose: Scan markets for arbitrage
prompt: |
  Scan these markets for arbitrage:
  {market_ids}

  For each:
  1. Fetch orderbook from CLOB
  2. Get best ask prices for all outcomes
  3. Check if sum < 0.99 (arb exists)

  Use 100ms delay between requests.
  Report any opportunities with profit margin.
```

### Research Agents

**codebase-explorer**
```yaml
type: Explore
model: sonnet
purpose: Find relevant code and docs
prompt: |
  Find code related to {topic}.
  Check: RESEARCH.md, src/, existing implementations.
  Return: file paths, key functions, relevant excerpts.
```

**background-researcher**
```yaml
type: general-purpose
model: sonnet
run_in_background: true
purpose: Deep research that takes time
prompt: |
  Research {topic} thoroughly.

  Check all relevant files:
  - RESEARCH.md
  - thoughts/ directory
  - src/ implementations
  - .claude/skills/ for domain knowledge

  Produce comprehensive report with:
  - Key findings
  - Code references
  - Open questions
  - Recommended next steps
```

---

## Orchestration Patterns

### Single Account Analysis

```
Input: "analyze @trader"

1. Check if data exists:
   ls data/accounts/*trader* or data/accounts/0x...

2. If no data, spawn data-fetcher:
   Task(Bash): poly dump trader --days 30

3. Spawn account-analyzer:
   Task(general-purpose, sonnet): [full analysis prompt]

4. Present results to user
```

### Multi-Account Comparison

```
Input: "compare trader1, trader2, trader3"

1. Spawn 3 account-analyzer agents IN PARALLEL:
   Task(general-purpose): analyze trader1
   Task(general-purpose): analyze trader2
   Task(general-purpose): analyze trader3

2. Wait for all to complete

3. Spawn account-comparator with all results:
   Task(general-purpose): compare analyses

4. Present unified comparison
```

### Market Scanning

```
Input: "scan for arbitrage opportunities"

1. Spawn data-fetcher to get market list:
   Task(Bash): curl gamma-api/markets?active=true

2. Split into batches of 20 markets

3. Spawn arb-scanner for each batch IN PARALLEL:
   Task(general-purpose, haiku): scan batch 1
   Task(general-purpose, haiku): scan batch 2
   ...

4. Aggregate opportunities

5. Present sorted by profit margin
```

### Background Monitoring

```
Input: "monitor this account for new trades"

1. Spawn background agent:
   Task(general-purpose, run_in_background: true):
   - Fetch current activity count
   - Sleep 5 minutes
   - Fetch again
   - If new trades, analyze and report
   - Repeat

2. Return immediately with output_file path

3. User can check progress anytime
```

---

## Spawning Best Practices

### DO Spawn Agents For:
- Reading multiple files
- Any API calls
- Pattern analysis
- Comparing data
- Background tasks
- Anything > 2 steps

### DON'T Spawn Agents For:
- Single file reads (use Read directly)
- Simple questions about data you already have
- Confirming user intent
- Presenting already-computed results

### Model Selection:
- **haiku**: Simple fetches, quick stats, scanning
- **sonnet**: Analysis, comparisons, research
- **opus**: Critical decisions, complex reasoning (rare)

### Parallel vs Sequential:
- **Parallel**: Independent data fetches, multi-account analysis
- **Sequential**: When step N depends on step N-1

---

## Error Handling

```
If agent fails:
1. Check error message
2. If rate limit: wait and retry
3. If data not found: inform user, suggest poly dump
4. If API error: fall back to cached data if available
5. Always report what succeeded before failure
```

---

## Integration with Other Skills

This skill works with:
- **polymarket-researcher**: Spawn for strategy analysis
- **polymarket-dev**: Reference for API patterns
- **Explore agent**: For codebase research

Typical flow:
```
User request
    │
    ▼
poly-orchestrator (decides what to spawn)
    │
    ├──► polymarket-researcher prompts (for analysis)
    ├──► polymarket-dev knowledge (for API calls)
    └──► Explore agent (for code research)
```
