# poly-sephiroth

Polymarket account data dumping and strategy analysis.

## Tech Stack
- Runtime: Bun (native TS, fast startup)
- CLI: Meow (args) + Ink (React terminal UI)
- Types: Strict, no `any`, no assertions

## Commands
```bash
poly dump <address> [--days 90]   # dump account data
polyd <addresses...>              # daemon mode, refresh 6h
```

## Directory Structure
```
src/lib/           # core logic (API, types, fs)
src/lib/use-cases/ # orchestration
src/apps/cli/      # CLI entry + React components
data/accounts/     # dumped data: <address>/<date>/*.json
```

## Domain Terms
- **Activity**: Trade or redeem event
- **NegRisk**: Multi-outcome market (prices should sum to $1)
- **Condition ID**: Unique market identifier
- **Token ID**: Unique outcome identifier (Yes/No token)
- **CLOB**: Central Limit Order Book

## APIs
| Endpoint | Purpose |
|----------|---------|
| data-api.polymarket.com | activity, positions, profiles |
| gamma-api.polymarket.com | market metadata, events |
| clob.polymarket.com | orderbook, prices, trading |

---

## Sub-Agent Strategy

Use sub-agents to keep main context clean and parallelize work.

### When to Spawn Agents

| Task | Agent Type | Model | Why |
|------|-----------|-------|-----|
| Explore codebase | `Explore` | sonnet | Find files, understand structure |
| Plan implementation | `Plan` | sonnet | Design before coding |
| Fetch market data | `Bash` | haiku | Simple curl/API calls |
| Analyze account data | `general-purpose` | sonnet | Multi-file reading, complex reasoning |
| Scan for arbitrage | `general-purpose` | haiku | Parallel market scanning |
| Deep strategy research | `general-purpose` | sonnet | Isolated analysis, large context |

### Agent Prompt Templates

**Market Data Fetch:**
```
Fetch current prices for market {slug} from Polymarket.
Use curl to hit gamma-api and clob endpoints.
Return: outcomes, prices, volume, liquidity.
```

**Account Analysis:**
```
Analyze Polymarket account data in {data_path}.
Read all JSON files (summary.json, activity.json, positions.json).
Follow polymarket-researcher skill workflow:
1. State facts from data
2. Identify patterns
3. Form hypothesis
4. Test against data
5. Synthesize strategy conclusion
Output structured analysis with confidence level.
```

**Arbitrage Scan:**
```
Scan for arbitrage opportunities.
For each market in {market_list}:
1. Fetch orderbook from CLOB API
2. Check if YES + NO best asks < 0.99
3. Report any opportunities with profit margin
Use 100ms delay between requests.
```

**Parallel Research:**
```
Research {topic} related to Polymarket trading.
Check RESEARCH.md for existing findings.
Search codebase for related implementations.
Return: key findings, code references, open questions.
```

### Spawning Pattern

```
# Good - isolate heavy analysis
User: "analyze MrSparklySimpsons"
→ Spawn general-purpose agent with analysis prompt
→ Agent reads data files, produces report
→ Main thread receives summary

# Good - parallel fetches
User: "check prices on these 5 markets"
→ Spawn 5 Bash agents in parallel
→ Each fetches one market
→ Main thread aggregates results

# Bad - don't spawn for simple tasks
User: "what's in summary.json?"
→ Just read the file directly
```

### Background Agents

For long-running tasks, use `run_in_background: true`:
```
- Continuous market monitoring
- Large account data dumps
- Batch analysis of multiple accounts
```

Check output with `Read` on the output_file path.
