---
name: polymarket-researcher
description: |
  Reverse-engineer trading strategies from Polymarket account data. Use when:
  - User asks to analyze an account's trading patterns
  - User wants to understand what strategy a trader is using
  - After running `poly dump` to fetch account data
  - Questions about arbitrage vs directional vs market-making
  Triggers: "analyze account", "what strategy", "trading patterns", "look at trades"
---

# polymarket-researcher

Analyze Polymarket account data to deduce trading strategies.

## Triggers
- "analyze account", "what strategy", "trading patterns"
- "look at [username]'s trades"
- After running `poly dump`

## Prerequisites
- Account data dumped via `poly dump <address>`
- Files exist in `data/accounts/<address>/<date>/`

---

## Sub-Agent Orchestration

**IMPORTANT**: All research and analysis MUST happen in isolated sub-agent contexts to keep main thread clean.

### Execution Model

```
User: "analyze @SomeTrader"
         │
         ▼
Main Thread: Validate data exists, spawn analysis agent
         │
         ▼
Sub-Agent: Read files, analyze patterns, produce report
         │
         ▼
Main Thread: Receive summary, SAVE to SUMMARY.md, present to user
```

### Persisting Results

**ALWAYS save analysis to `data/accounts/<username>/SUMMARY.md`**

This allows:
- Quick reference without reprocessing
- Historical tracking of strategy changes
- Comparison across accounts

After analysis completes:
1. Write full analysis to `data/accounts/<username>/SUMMARY.md`
2. Overwrite if exists (latest analysis wins)
3. Use markdown format matching Output Format section

### When to Spawn Agents

| Task | Agent Type | Model | Prompt Key Points |
|------|-----------|-------|-------------------|
| Full account analysis | `general-purpose` | sonnet | Read all JSONs, follow 6-step workflow |
| Quick stats check | `general-purpose` | haiku | Read summary.json only, report key metrics |
| Compare two accounts | `general-purpose` | sonnet | Read both, identify strategy differences |
| Deep activity analysis | `general-purpose` | sonnet | Parse activity.json, find patterns |
| Fetch fresh data | `Bash` | haiku | Run `poly dump` command |
| Research background | `Explore` | sonnet | Check RESEARCH.md, find related code |

### Agent Prompts

**Full Analysis Agent:**
```
Analyze Polymarket account data at: {data_path}

Read these files in order:
1. meta.json - understand dump parameters
2. summary.json - get key metrics
3. profile.json - account context
4. activity.json - detailed trade data (if needed for patterns)

Follow this workflow:
1. FACTS: State observations without interpretation
2. PATTERNS: Identify signals (buy ratio, margins, timing, concentration)
3. HYPOTHESIS: Propose likely strategy with reasoning
4. TEST: Validate hypothesis against the data
5. SYNTHESIZE: Conclude with strategy, confidence, edge source

Use the Strategy Fingerprints to match patterns:
- Arbitrageur: ~50% buy ratio, both-sides trades, 2-5% margins
- Predictive: >90% buy ratio, category focus, 20-50% returns
- Market Maker: ~50% buy/sell, spread capture, high frequency

Output structured analysis per the Output Format section.

IMPORTANT: After analysis, save the full report to {account_dir}/SUMMARY.md
```

**Quick Stats Agent:**
```
Read {data_path}/summary.json and report:
- Total trades and volume
- Estimated profit and return %
- Buy/sell ratio
- Top 3 categories
- Trades per day

Keep response concise, just the numbers.
```

**Comparison Agent:**
```
Compare two Polymarket accounts:
- Account A: {path_a}
- Account B: {path_b}

For each, extract:
- Strategy type (arb/predictive/market-maker)
- Key metrics (volume, profit, buy ratio)
- Category focus

Then compare:
- Strategy similarities/differences
- Performance comparison
- Edge source differences
```

**Data Fetch Agent:**
```
Dump fresh Polymarket data for {target}.

Run: poly dump {target} --days {days} --output ./data

Report:
- Success/failure
- Output path
- Trade count and volume from result
```

### Parallel Analysis

For multiple accounts, spawn agents in parallel:

```
User: "compare these 3 traders"
→ Spawn 3 analysis agents simultaneously (one per account)
→ Wait for all to complete
→ Spawn comparison agent with all 3 results
→ Present unified comparison
```

### Background Research

For deep dives that take time:

```
User: "do a thorough analysis of this whale"
→ Spawn agent with run_in_background: true
→ Tell user analysis is running
→ Check output_file when done
→ Present findings
```

---

## Workflow

### 1. Establish Facts
Read files in order:
1. `meta.json` - dump params
2. `summary.json` - key metrics
3. `profile.json` - account context

State observations without interpretation:
- X trades over Y days
- $Z volume, $W estimated profit
- N% buy ratio
- Top categories: ...

### 2. Pattern Recognition
Read `activity.json` and look for:

| Signal | Indicates |
|--------|-----------|
| Buy ratio >95% | Directional betting |
| Equal buys both sides same event | Arbitrage |
| Both-sides trades | Hedging or arb |
| 2-3% margins | Classic arbitrage |
| 30%+ returns | Predictive edge |
| Same-event multi-prop bets | Correlation plays |
| Clustered timestamps | Bot execution |

### 3. Hypothesis Formation
Based on patterns, propose:
- "This looks like X because Y"
- State confidence level
- Note contradicting evidence

Common strategies:
1. **Single-condition arbitrage**: YES + NO < $1
2. **NegRisk arbitrage**: Multi-outcome sum < $1
3. **Directional prediction**: Model-based edge
4. **Vegas comparison**: Polymarket vs sportsbook mispricing
5. **Whale following**: Copy large traders

### 4. Hypothesis Testing
Calculate:
- If arbitrage: Do prices sum to <$1? What margins?
- If predictive: Implied win rate vs actual?
- Expected return vs actual return

### 5. Strategy Synthesis
Output:
- Most likely strategy + confidence
- Evidence summary (3-5 bullets)
- Edge source estimate
- Replicability assessment (easy/medium/hard)

### 6. Implementation Path (optional)
If user wants to replicate:
- Reference RESEARCH.md sections
- Cite relevant papers (arxiv:1606.02825, arxiv:2508.03474)
- Suggest concrete next steps

---

## Domain Knowledge

### API Endpoints
- `data-api.polymarket.com/activity` - trades, redeems
- `data-api.polymarket.com/positions` - open positions
- `gamma-api.polymarket.com/markets` - market metadata

### Arbitrage Types (from IMDEA research)
| Type | Historical Profit | Mechanism |
|------|------------------|-----------|
| Single-condition | $10.58M | YES + NO < $1 |
| NegRisk | $28.99M | Multi-outcome sum < $1 |
| Combinatorial | Variable | Correlated market mispricing |

### Key Metrics
- Buy ratio: >95% = directional, ~50% = market-neutral
- Profit margin: 2-3% = arbitrage, 30%+ = predictive
- Trades/day: >100 = bot, <10 = manual
- Large positions: >$10k suggests conviction

### Red Flags (NOT arbitrage)
- Near-100% buy ratio with minimal sells
- 30%+ returns (arb is 2-3%)
- Team-specific large bets
- Single-sided positions

### Strategy Fingerprints

**Arbitrageur**
- ~50% buy ratio
- Both-sides trades on same events
- 2-5% profit margins
- High trade frequency
- Small position sizes

**Predictive Model**
- >90% buy ratio
- Category concentration (sports, politics)
- 20-50% returns
- Conviction sizing (large single bets)
- Hold to resolution

**Market Maker**
- ~50% buy/sell
- Spread capture (buy low, sell high)
- 5-15% returns
- High frequency
- Short hold times

**Whale Follower**
- Trades clustered after large moves
- Mimics known profitable addresses
- Variable returns
- Reactive timing

---

## Output Format

```markdown
## [Username] Strategy Analysis

### Facts
- [X] trades over [Y] days ([Z] trades/day)
- $[V] volume, $[P] estimated profit ([R]% return)
- [B]% buy ratio
- Categories: [top 3 with %]

### Patterns Observed
- [Pattern 1]: [what it suggests]
- [Pattern 2]: [what it suggests]
- [Anomaly if any]

### Hypothesis
**[Strategy Name]**: [1-2 sentence description]

### Evidence
- [Supporting point 1]
- [Supporting point 2]
- [Supporting point 3]

### Contradicting Evidence
- [Any signals that don't fit, or "None"]

### Conclusion
- **Strategy**: [name]
- **Confidence**: [High/Medium/Low] ([%])
- **Edge Source**: [where alpha comes from]
- **Replicability**: [Easy/Medium/Hard] - [why]

### Next Steps (if requested)
1. [Concrete action]
2. [Concrete action]
```

---

## Example Analysis

### MrSparklySimpsons

#### Facts
- 978 trades over 3 days (326 trades/day)
- $1.6M volume, $660k estimated profit (41% return)
- 99.9% buy ratio (977 buys, 1 sell)
- Categories: NHL 35%, Soccer 31%, NBA 27%

#### Patterns Observed
- Near-100% buy ratio: NOT market-neutral
- 41% return: Far exceeds arbitrage margins (2-3%)
- Team-specific concentration: Lightning $335k, Senators $132k
- Sports focus: Domain expertise signal
- High velocity: Bot-assisted execution

#### Hypothesis
**Directional Sports Prediction**: Using statistical model to identify mispriced Polymarket odds vs true probability, likely comparing to Vegas lines.

#### Evidence
- Buy ratio eliminates arbitrage/market-making
- Profit margin eliminates arbitrage (would be 2-3%)
- Sports concentration suggests domain model
- Large single-team bets suggest conviction from edge
- Consistent profitability suggests systematic approach

#### Contradicting Evidence
- None significant

#### Conclusion
- **Strategy**: Predictive sports model with automated execution
- **Confidence**: High (90%)
- **Edge Source**: Polymarket inefficiency vs Vegas/model
- **Replicability**: Medium - requires building prediction model

#### Next Steps
1. Build Vegas line comparison (see RESEARCH.md "Vegas Line Comparison")
2. Start with simple edge detection: Polymarket price vs Vegas implied
3. Paper trade to validate before capital deployment
