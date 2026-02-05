# Polymarket Strategy Research Tools

Tools to reverse-engineer trading strategies from Polymarket accounts by dumping raw data and using Claude Code to deduce patterns and strategies.

**User Story**: As a trader/researcher, I want to analyze any Polymarket account's trading history, so that I can understand their strategy and potentially replicate their edge.

---

## Background

We manually analyzed MrSparklySimpsons ($1.5M profit, $71M volume) using curl + jq. Found they're NOT doing arbitrage as Twitter claimed—they're running directional sports betting with ~40% returns.

The manual process worked but was tedious:
1. Curl the activity API with pagination
2. Parse with jq to find patterns
3. Group by event, outcome, side
4. Calculate statistics
5. Form hypotheses and test against data

We want to make this repeatable for any account.

---

## Part 1: CLI Tool (`poly`)

A Bun/TypeScript CLI that dumps all available data for a Polymarket account into JSON files.

### What It Does

Given an account address or username:
1. Fetches all trading activity (last 90 days default)
2. Fetches current open positions
3. Fetches account profile/stats
4. Fetches market details for all traded markets
5. Computes summary statistics
6. Saves everything to organized JSON files

### Acceptance Criteria

**Command:**
```bash
poly dump <address|username> [--days=90] [--output=./research/accounts]
```

**Output Structure:**
```
./research/accounts/
└── <account>/
    └── <YYYY-MM-DD>/              # Enables historical comparison
        ├── activity.json          # Raw trades and redeems
        ├── positions.json         # Open positions at dump time
        ├── profile.json           # Account stats
        ├── markets.json           # Market details
        ├── summary.json           # Pre-computed aggregates
        └── meta.json              # Dump metadata
```

**activity.json** contains:
- Every trade: type, side, outcome, size, price, timestamp, eventSlug
- Every redeem: size, timestamp, market

**summary.json** contains pre-computed stats:
- Total trades, volume, profit (redeem - trade volume)
- Buy/sell counts and ratio
- Breakdown by sport/category
- Breakdown by outcome (top 20)
- Both-sides trades (potential arbitrage signals)
- Large positions (>$10k)
- Time range, trades per day, avg trade size
- Open positions value

**meta.json** contains:
- Account address
- Dump timestamp
- Days of history fetched
- Record counts

**Behavior:**
- Creates new date folder each run (enables strategy evolution tracking)
- Handles pagination automatically (API returns 100 max)
- Rate limits to avoid API throttling
- Resolves usernames to addresses automatically
- Shows progress during fetch

**Location:** Separate repo at `../poly/`

---

## Part 2: Claude Code Skill (`polymarket-researcher`)

A skill that guides Claude through analyzing dumped data to deduce trading strategies.

### What It Does

Provides methodology for reverse-engineering strategies from raw data. Does NOT automate deduction—Claude reasons from the data.

### Acceptance Criteria

**Trigger:** User asks to analyze a Polymarket account (after running `poly dump`)

**Process:**

1. **Establish Facts** (read data, state observations)
   - Total trades, volume, profit
   - Buy/sell distribution
   - Time range, sports/categories

2. **Pattern Recognition** (look for anomalies)
   - Buy/sell ratio → directional vs market-neutral?
   - Both-sides trades → arbitrage signal?
   - Outcome concentration → conviction plays?
   - Position sizing → Kelly? Fixed? Random?
   - Timing → pre-game? live? post-event?
   - Same-event correlation → understanding game dynamics?

3. **Hypothesis Formation** (propose strategies)
   - "This looks like arbitrage because..."
   - "This looks like predictive modeling because..."
   - "This could be market making because..."

4. **Hypothesis Testing** (validate against data)
   - If arbitrage: prices sum to <$1? margins?
   - If predictive: win rate vs implied odds? consistent edge?
   - Calculate expected vs actual returns

5. **Strategy Synthesis** (conclude)
   - Most likely strategy + confidence level
   - Evidence summary
   - Estimated edge source
   - Replicability assessment

6. **Implementation Path** (actionable next steps)
   - Reference relevant research (IMDEA paper, arxiv)
   - Suggest model types if predictive
   - Cite papers where applicable
   - Concrete steps to replicate

**Key Principle:** Start with facts. Deduce from data. State uncertainty when present. Don't fit narratives.

**Location:** `~/.claude/skills/polymarket-researcher.md`

---

## Data Flow

```
User: "Analyze @SomeTrader"
        │
        ▼
Claude: poly dump SomeTrader
        │
        ▼
Files:  ./research/accounts/sometrader/2026-02-03/*.json
        │
        ▼
Claude: Reads files, applies skill methodology
        │
        ▼
Output: Strategy breakdown with evidence
```

---

## APIs Used

```
# Activity (paginated, 100 per page)
GET https://data-api.polymarket.com/activity?user=<address>&limit=100&offset=0

# Positions
GET https://data-api.polymarket.com/positions?user=<address>

# Profile
GET https://data-api.polymarket.com/profiles?addresses=<address>

# Market details
GET https://clob.polymarket.com/markets/<conditionId>
```

No authentication required. Rate limit ~10 req/sec.

---

## Risks & Unknowns

1. **API limits**: Unknown max history depth. May need to handle "no more data" gracefully.

2. **Resolution data**: Activity shows trades but not outcomes. To calculate actual win rate, need to match trades to market resolutions. Could add later.

3. **Vegas comparison**: Useful for edge estimation but requires external data source (OddsAPI, etc). Out of scope for v1.

4. **Large accounts**: Accounts with 10k+ trades may take time to dump. Should show progress.

5. **Username resolution**: API may not support all username formats. Fallback to requiring address.

---

## Out of Scope (v1)

- Automated strategy classification (Claude reasons, not code)
- Win rate calculation (requires resolution matching)
- Vegas odds integration
- Real-time monitoring
- Trade execution
- Comparing multiple accounts

---

## Success Criteria

1. Can dump any public Polymarket account in <2 minutes
2. Data is complete and readable by Claude
3. Skill guides Claude to produce strategy analysis similar to MrSparklySimpsons analysis we did manually
4. Historical dumps enable tracking strategy changes over time
