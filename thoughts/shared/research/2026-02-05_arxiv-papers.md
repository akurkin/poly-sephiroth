# Arxiv Papers for Polymarket Strategy

**Date:** 2026-02-05
**Goal:** Make money on Polymarket predictably with manageable risk

---

## Tier 1: Directly About What We're Building

### 1. Unravelling the Probabilistic Forest: Arbitrage in Prediction Markets
**IMDEA Networks, Aug 2025** — [arxiv.org/abs/2508.03474](https://arxiv.org/abs/2508.03474)

THE paper for the arb scanner. First large-scale analysis of arbitrage on Polymarket specifically.
- **$40M realized profit** over Apr 2024 – Apr 2025
- Two types: single-market rebalancing ($10.58M) + NegRisk combinatorial ($28.99M)
- Used **LLM + text embeddings (Linq-Embed-Mistral)** to extract logical dependencies between markets for combinatorial arb detection
- Key finding: **combinatorial arb has 62% failure rate** in execution — single-market arb is far more reliable
- Our arb scanner's NegRisk focus aligns perfectly with their findings (73% of profit from NegRisk)

### 2. Semantic Trading: Agentic AI for Clustering and Relationship Discovery in Prediction Markets
**IBM + Columbia, Dec 2025** — [arxiv.org/abs/2512.02436](https://arxiv.org/abs/2512.02436)

Directly applicable to finding cross-market edges on Polymarket.
- LLM agent reads market text, clusters into topical groups, finds correlated/anti-correlated pairs
- Agent-identified relationships → **~20% avg returns** over week-long horizons
- Profitable in Apr-Jun (24.8%, 8.7%, 47.5% ROI), negative in Jul (-12.3%)
- Could extend our approach beyond pure arb into **correlated mispricing** (e.g., MVP odds vs team championship odds — exactly what our NBA research identified as a next step)

### 3. Application of the Kelly Criterion to Prediction Markets
**Dec 2024** — [arxiv.org/abs/2412.14144](https://arxiv.org/abs/2412.14144)

Directly addresses bankroll management gap for sharp-line betting.
- Shows that **mean beliefs differ from prices** in prediction markets
- Uses KL-divergence to quantify how misjudging edge AND bet fraction impacts growth rate
- Practical framework for sizing sharp-line bets (the Countryside vs MrSparklySimpsons selectivity gap)

### 4. SoK: Market Microstructure for Decentralized Prediction Markets
**Oct 2025, updated Jan 2026** — [arxiv.org/abs/2510.15612](https://arxiv.org/abs/2510.15612)

Comprehensive survey of how prediction markets actually work under the hood.
- Covers Polymarket's shift from AMM to CLOB (relevant to understanding orderbook dynamics)
- History of DePMs from 2011, hundreds of proposals systematized
- Understanding market microstructure helps read orderbook depth better for both arb and sharp-line strategies

---

## Tier 2: ML Models for Sharp-Line Strategy

### 5. Machine Learning for Sports Betting: Should Model Selection Be Based on Accuracy or Calibration?
**2023, cited heavily in 2024-2025** — [arxiv.org/abs/2303.06021](https://arxiv.org/abs/2303.06021)

Critical insight for building own edge model.
- **Calibration-optimized model: +34.69% ROI. Accuracy-optimized: -35.17% ROI.**
- A worse model with better calibration beats a better model with worse calibration
- Directly relevant: if building own probability model beyond "use Pinnacle price", calibration > accuracy
- Tested on NBA data over multiple seasons

### 6. A Systematic Review of Machine Learning in Sports Betting
**Oct 2024** — [arxiv.org/abs/2410.21484](https://arxiv.org/abs/2410.21484)

Survey of all ML approaches for sports betting.
- Covers SVMs, random forests, neural nets, XGBoost applied to various sports
- Key techniques: rolling-form indicators, team-level metrics, shot-chart embeddings
- Maps the landscape of what models work for which sports

### 7. Not Feeling the Buzz: Correction Study of Mispricing and Inefficiency in Online Sportsbooks
**2023, v3 updated 2024** — [arxiv.org/abs/2306.01740](https://arxiv.org/abs/2306.01740)

Important skepticism paper.
- Previous claims of sports betting mispricing largely **didn't replicate** with clean data
- Only 1 profitable strategy survived replication, and it stopped working with new data (2020-2023)
- **Key takeaway**: pure model-based edges in traditional sportsbooks decay fast. But Polymarket is NOT a traditional sportsbook — it's a less efficient market, which is why sharp-line comparison works there

---

## Tier 3: Risk Management & Bet Sizing

### 8. Optimal Betting: Beyond the Long-Term Growth
**Mar 2025** — [arxiv.org/abs/2503.17927](https://arxiv.org/abs/2503.17927)

Rigorous treatment of fractional Kelly.
- Limiting variance is the key to quantifying risk across sequential bets
- **Estimation errors in Kelly → over-betting and ruin**
- Fractional Kelly with full info ≈ full Kelly with shrinkage estimators
- Countryside uses ~2-10% of bankroll, tbs8t ~3% flat — both are fractional Kelly practitioners

### 9. Sizing the Risk: Kelly, VIX, and Hybrid Approaches
**Aug 2025** — [arxiv.org/abs/2508.16598](https://arxiv.org/abs/2508.16598)

Fractional Kelly strategies in practice.
- Half-Kelly **reduces volatility more than it reduces expected growth** — great trade-off
- Hybrid sizing consistently balances return with drawdown control
- Practical confirmation that Countryside's selectivity is essentially smart position sizing

---

## Tier 4: LLM Trading Agents (Future Direction)

### 10. PredictionMarketBench: Backtesting Trading Agents on Prediction Markets
**Feb 2026** — [arxiv.org/abs/2602.00133](https://arxiv.org/abs/2602.00133)

Brand new benchmark for evaluating trading bots on prediction markets.
- Event-driven replay of historical LOB + trade data
- Baselines: GPT-4.1-nano agent and Bollinger Bands mean-reversion
- Could use this to **backtest arb scanner and sharp-line strategies** against historical data

### 11. Deep Limit Order Book Forecasting: A Microstructural Guide
**Mar 2024, updated 2025** — [arxiv.org/abs/2403.09267](https://arxiv.org/abs/2403.09267)

LOB prediction methods.
- Open-source LOBFrame for processing order book data
- Predictive models for mid-price changes
- Applicable for predicting short-term Polymarket price moves (e.g., will the arb window close in 5 seconds or 5 minutes?)

---

## Synthesis — What These Papers Mean for Our Strategy

**Current approach is well-validated by the literature:**
- IMDEA confirms NegRisk arb is where the money is ($29M of $40M)
- Sharp-line comparison is supported by the calibration paper — Polymarket is inefficient enough that Pinnacle as a reference works
- 4/7 analyzed accounts using sharp lines, all profitable — fits the pattern

**Biggest actionable insights:**

1. **Combinatorial arb is a trap** (62% failure rate) — focus on simple NegRisk sum-to-$1 is correct
2. **Calibration > accuracy** — if building own model, optimize for calibrated probabilities, not prediction accuracy
3. **Fractional Kelly (25-50%) is optimal** — half-Kelly reduces volatility more than it reduces growth. Countryside's 2-10% position sizing is essentially this
4. **Semantic clustering** (IBM paper) could extend edge — find correlated Polymarket markets where one moved but the other hasn't yet
5. **Edge will decay** — the mispricing replication paper warns that edges get arbitraged away. Move fast, don't assume today's gaps persist
