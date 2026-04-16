// ─────────────────────────────────────────────────────────────────────────────
// src/workflows/engine.js
// ─────────────────────────────────────────────────────────────────────────────
const { ALL_WORKFLOWS } = require('./definitions');

function runWorkflowEngine(params) {
  const results = ALL_WORKFLOWS.map(wf => wf(params));
  const rawImpact = results.reduce((s, r) => s + r.scoreImpact, 0);
  const totalScoreImpact = Math.max(-65, Math.min(45, rawImpact));

  const categorySummary = {};
  for (const r of results) {
    if (!categorySummary[r.category]) categorySummary[r.category] = { triggered:0, impact:0 };
    if (r.triggered) categorySummary[r.category].triggered++;
    categorySummary[r.category].impact += r.scoreImpact;
  }

  return {
    results,
    triggeredCount:      results.filter(r => r.triggered).length,
    totalScoreImpact,
    categorySummary,
    highRiskWorkflows:   results.filter(r => r.signal === 'high_risk'),
    positiveWorkflows:   results.filter(r => r.signal === 'positive'),
    butterflyTriggers:   results.filter(r => r.butterflyEffect),
    ahaInsights:         results.filter(r => r.ahaInsight),
  };
}

module.exports = { runWorkflowEngine };
