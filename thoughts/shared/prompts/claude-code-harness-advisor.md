# Claude Code Harness Advisor Prompt

Use this prompt to analyze a repo and get recommendations for optimal Claude Code configuration.

---

## Prompt

```
You are a Claude Code configuration expert. Analyze my project and recommend an optimal harness setup that will make me dramatically more productive.

## Context to Analyze

1. **Codebase** - Read key files to understand:
   - Domain/problem space
   - Tech stack (language, frameworks, runtime)
   - Architecture patterns in use
   - Existing tooling/scripts
   - Code style and conventions

2. **Documentation** - Read any:
   - README, RESEARCH.md, plans, specs
   - thoughts/, docs/, .claude/ directories
   - Existing CLAUDE.md or skills

3. **My Working Style** - Infer from docs and code:
   - What workflows do I repeat?
   - What patterns do I follow?
   - What mistakes might I make?
   - What domain knowledge is needed?

4. **Related Projects** - Check sibling directories for:
   - Shared patterns
   - Related tools
   - Cross-project workflows

## Deliverables

### 1. Skills

For each recommended skill:
- **Name**: skill-name
- **Purpose**: 1 sentence
- **Triggers**: When to invoke (keywords, file patterns)
- **Workflow**: Step-by-step process the skill guides
- **Domain Knowledge**: Key facts, APIs, patterns to embed
- **Tools Needed**: MCP servers, CLI tools, APIs
- **Example Prompts**: 3-5 example user requests that trigger it

Prioritize skills for:
- Repetitive multi-step workflows
- Domain-specific analysis requiring specialized knowledge
- Code generation following project conventions
- Quality gates (testing, linting, reviewing)

### 2. Sub-Agents

For each recommended sub-agent configuration:
- **Name**: agent-name
- **Type**: Explore | Plan | Bash | general-purpose
- **Purpose**: What it specializes in
- **When to Spawn**: Conditions that trigger spawning
- **Prompt Template**: How to instruct it
- **Model**: haiku (fast/cheap) vs sonnet (complex) vs opus (critical)

Prioritize sub-agents for:
- Parallel exploration tasks
- Independent verification/testing
- Background processing

### 3. CLAUDE.md Updates

Recommend additions to project or global CLAUDE.md:
- Project-specific conventions
- Domain terminology
- Anti-patterns to avoid
- File organization rules
- Commit message format
- Testing requirements

### 4. Settings & MCP Servers

- **MCP Servers**: Which servers would help (browser, database, API clients)
- **Hooks**: Pre/post command hooks for quality gates
- **Permissions**: What to auto-allow for smoother workflow

### 5. Workflow Automations

Describe end-to-end workflows I'd use frequently:
```
User: "analyze @SomeTrader"
→ poly dump command runs
→ skill reads output files
→ produces strategy analysis
→ optionally creates follow-up tasks
```

## Format

Output as a single markdown document with:
1. Executive Summary (3 bullets max)
2. Detailed recommendations per category above
3. Priority order (what to implement first)
4. Implementation notes (gotchas, dependencies)

Be extremely concrete - provide actual file contents, prompts, configurations I can copy-paste.
```

---

## Example Usage

After cloning a new repo or starting a new project phase:

```bash
claude "Read my codebase and documentation, then give me Claude Code harness recommendations using the prompt in thoughts/shared/prompts/claude-code-harness-advisor.md"
```

Or paste the prompt above directly.

---

## What This Produces

The advisor will output recommendations like:

### Skills Example
```markdown
**polymarket-researcher**
- Purpose: Reverse-engineer trading strategies from dumped account data
- Triggers: "analyze account", "what strategy", "trading patterns"
- Workflow:
  1. Read summary.json → state facts (trades, volume, profit)
  2. Read activity.json → identify patterns (buy/sell ratio, timing)
  3. Form hypotheses → arbitrage? predictive? market-making?
  4. Test against data → calculate expected vs actual
  5. Synthesize → strategy + confidence + replicability
- Domain: Polymarket APIs, arbitrage types, Kelly criterion, ELO models
```

### Sub-Agent Example
```markdown
**vegas-odds-fetcher**
- Type: general-purpose
- Purpose: Fetch and compare Vegas lines to Polymarket prices
- When: User asks about edge detection or mispricing
- Model: haiku (simple API calls)
- Prompt: "Fetch Vegas lines for {event} from OddsAPI and compare to Polymarket price {price}. Calculate edge."
```

### CLAUDE.md Example
```markdown
## Polymarket Domain

### API Endpoints
- data-api.polymarket.com - activity, positions, profiles
- gamma-api.polymarket.com - market metadata
- clob.polymarket.com - orderbook, real-time prices

### Strategy Types
- Single-condition arbitrage: YES + NO < $1
- NegRisk: Sum of multi-outcome < $1
- Directional: Predictive edge on outcomes
- Whale tracking: Follow large traders

### Key Metrics
- Buy ratio >95% → directional betting
- Both-sides trades → potential arbitrage
- 40%+ returns → likely predictive model, not arbitrage
```

---

## Iteration

After implementing recommendations:
1. Use them for a few sessions
2. Note friction points
3. Re-run advisor with learnings
4. Refine skills/agents based on actual usage
