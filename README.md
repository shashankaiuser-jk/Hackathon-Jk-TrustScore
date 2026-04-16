# CreditLens AI — Credit Intelligence Engine v2.0

> AI-Powered, Loan-Level Risk Intelligence with Agentic Workflow Reasoning & Butterfly Effect Detection

---

## ⚡ Quick Start (60 seconds)

```bash
# 1. Clone / unzip the project
cd creditlens-ai

# 2. Set your API key (optional — works without it)
cp .env.example .env
# Edit .env → add: ANTHROPIC_API_KEY=sk-ant-...

# 3a. Run console demo (no server needed)
node src/demo.js

# 3b. OR start the full server + UI
node src/index.js
# Then open: http://localhost:3000
```

**Zero npm installs required.** Pure Node.js built-ins only.

---

## 🏗 Architecture

```
creditlens-ai/
├── src/
│   ├── index.js              ← HTTP server (built-in Node http)
│   ├── demo.js               ← Console demo runner
│   ├── engine.js             ← 5-step pipeline orchestrator
│   ├── data/
│   │   └── mockData.js       ← 2 loans × 18-month repayment history
│   ├── extractors/
│   │   └── index.js          ← 40-50 parameter extraction (4 categories)
│   ├── workflows/
│   │   ├── definitions.js    ← 35 agentic workflows (8 categories)
│   │   └── engine.js         ← Workflow runner + impact aggregation
│   ├── scoring/
│   │   └── index.js          ← Loan (0-100) + Partner (0-850) scoring
│   ├── ai/
│   │   └── llmAgent.js       ← Claude API via native https + fallback
│   └── api/
│       └── routes.js         ← 6 REST endpoint handlers
└── public/
    └── index.html            ← Single-file dashboard UI (zero build)
```

---

## 🔄 The 5-Step Pipeline

```
RAW DATA  →  EXTRACT PARAMS  →  RUN 35 WORKFLOWS  →  SCORE  →  LLM REASONING
(mock JSON)   (40-50 params)    (agentic paths)     (0-100)   (explainability)
```

1. **Data Aggregation** — Loan details, CredCheck (GST/MCA/CIBIL), Digitap (bank/SMS/app), Industry
2. **Parameter Extraction** — AI extracts financial, behavioral, loan-specific, contextual params
3. **Workflow Generation** — 35 dynamic reasoning paths execute in parallel
4. **Loan Health Score** — Synthesized from workflow outputs + parameter weights (0–100)
5. **Explainability** — LLM generates "why this score", butterfly effects, Aha Moments

---

## 📊 Parameters (40+)

| Category | Count | Examples |
|----------|-------|---------|
| Loan-specific | 12 | on-time ratio, missed EMIs, penalty count, tenure progress |
| Financial | 15 | GST trend, balance sheet strength, DTI, EPFO, legal cases |
| Behavioral | 15 | inflow/outflow ratio, SMS signals, app usage, night txns |
| Contextual | 10 | industry growth, peer default rate, policy impact, volatility |

---

## ⚙️ Workflows (35)

| Category | Count | Key Examples |
|----------|-------|-------------|
| Repayment | 6 | Partial → GST → Liability Chain; Missed EMI → Multi-Loan Stress |
| Financial | 6 | Sales Drop vs Peers; Overleverage Detection; Balance Sheet Cushion |
| Behavioral | 5 | Expense Spike → Liquidity; Multi-Account Fund Rotation; Gambling Flag |
| Multi-Loan | 3 | Portfolio Contagion; Overlap Stress Test; Debt Coverage Ratio |
| Contextual | 3 | Industry Decline; Peer Default Spread; Policy + Commodity |
| Butterfly | 4 | 90-Day Liquidity Chain; New Liability Chain; Supplier Concentration |
| Combined | 4 | GST Drop + Expenses; Good Repayment + Bad Industry (Resilient Op) |
| Advanced | 4 | Recovery Signal; Early Warning; Behavioral Stability; Governance Flag |

---

## 🎯 Scoring

### Loan Health Score (0–100)
```
Base Score     = f(repayment × 0.35 + financial × 0.35 + behavioral × 0.20) + 10
Workflow Delta = sum(all workflow scoreImpacts), capped ±65
Final Score    = clamp(Base + Delta, 0, 100)
```

| Score | Grade | Risk |
|-------|-------|------|
| 80–100 | A | Low |
| 65–79 | B | Medium |
| 50–64 | C | Medium |
| 35–49 | D | High |
| 0–34 | F | Critical |

### Channel Partner Trust Score (0–850)
```
Loan Health     60%  →  0–510 pts  (worst loan penalty applied)
Financial       20%  →  0–170 pts
Behavioral      12%  →  0–102 pts
Contextual       8%  →  0–68 pts
```

---

## 🌐 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Service info |
| GET | `/api/health` | Health check + endpoint list |
| GET | `/api/demo` | Full pipeline on mock data |
| GET | `/api/explain/:loanId` | Drill-down for LN-2023-001 or LN-2024-087 |
| GET | `/api/mock-data` | View mock input JSON |
| POST | `/api/loan/score` | Score any loan (send LoanScoreRequest body) |
| POST | `/api/partner/score` | Score channel partner (send PartnerScoreRequest body) |

---

## 📋 Sample API Call

```bash
# Full demo
curl http://localhost:3000/api/demo

# Explain a specific loan
curl http://localhost:3000/api/explain/LN-2023-001

# Score any loan
curl -X POST http://localhost:3000/api/loan/score \
  -H "Content-Type: application/json" \
  -d @src/data/mockData.js  # (adapt to JSON)
```

---

## 🤖 LLM Integration

- Uses **Anthropic Claude** (`claude-sonnet-4-20250514`) via native `https` (no SDK needed)
- Set `ANTHROPIC_API_KEY` in `.env` to activate
- **Works without API key** — rule-based fallback generates data-driven reasoning from workflow outputs
- Generates:
  - Per-loan analyst reasoning (3 sentences)
  - Partner-level Top 3 Insights
  - Credit committee summary paragraph

---

## 🦋 Butterfly Effect Detection

The system detects small signals with large cascading impact:

```
Partial EMI (×4)
  → Penalty accumulation (₹10,000+)
  → GST revenue decline (-10.7%)
  → Liability chain stress
  → Cascading default risk
```

Each trigger includes:
- **Severity** (critical / high / medium / low)
- **Cascade chain** (step-by-step impact path)
- **Aha Moments** (non-obvious cross-signal insights)

---

## ⚠️ Hackathon Notes

- All data is **mock** — no real integrations
- Scoring weights are **configurable** in `src/scoring/index.js`
- Workflow definitions are **extensible** — add new ones in `src/workflows/definitions.js`
- To add a real LLM call to every workflow instead of scoring only, extend `src/ai/llmAgent.js`

---

## 📄 License

MIT — Built for hackathon / demo purposes.
