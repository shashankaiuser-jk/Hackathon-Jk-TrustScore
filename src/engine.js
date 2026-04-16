// ─────────────────────────────────────────────────────────────────────────────
// src/engine.js  —  Master orchestrator: 5-step pipeline
// ─────────────────────────────────────────────────────────────────────────────
const { extractAllParameters }               = require('./extractors');
const { runWorkflowEngine }                  = require('./workflows/engine');
const { computeLoanHealthScore,
        computeChannelPartnerScore }         = require('./scoring');
const { generateLoanReasoning,
        generatePartnerInsights }            = require('./ai/llmAgent');

async function scoreLoan(req) {
  const { loan, repaymentHistory, credCheck, digitap, industry } = req;
  console.log(`  [→] Loan ${loan.loanId}: extracting parameters...`);
  const params = extractAllParameters(loan, repaymentHistory, credCheck, digitap, industry);

  console.log(`  [→] Loan ${loan.loanId}: running ${35} workflows...`);
  const engine = runWorkflowEngine(params);
  console.log(`       ${engine.triggeredCount} triggered | ${engine.highRiskWorkflows.length} high-risk | ${engine.positiveWorkflows.length} positive | impact: ${engine.totalScoreImpact > 0 ? '+' : ''}${engine.totalScoreImpact.toFixed(1)}`);

  const tempScore = Math.round(Math.max(0, Math.min(100, computeBaseScore(params) + engine.totalScoreImpact)));
  console.log(`  [→] Loan ${loan.loanId}: generating AI reasoning...`);
  const reasoning = await generateLoanReasoning(loan.loanId, params, engine.results, tempScore);

  return computeLoanHealthScore(loan.loanId, params, engine, reasoning);
}

function computeBaseScore({ loan, financial, behavioral }) {
  const repay = loan.onTimePaymentRatio*40 + Math.max(0,10-loan.avgDelayDays*0.5) + Math.max(0,10-loan.missedPaymentCount*5) + Math.max(0,10-loan.partialPaymentCount*2);
  const fin   = financial.balanceSheetStrength*0.3 + Math.max(0,Math.min(20,(1-financial.creditUtilization/100)*20)) + financial.gstFilingConsistency*15 + Math.max(0,15-financial.debtToIncomeRatio*5);
  const beh   = Math.max(0,15-behavioral.failedTransactionRate*1.5) + (behavioral.inflowOutflowRatio>1?10:behavioral.inflowOutflowRatio*8) + (behavioral.gamblingAppUsage?0:10) + (behavioral.suddenExpenseSpike?0:5);
  return Math.min(100,Math.max(0,repay))*0.35 + Math.min(100,Math.max(0,fin))*0.35 + Math.min(100,Math.max(0,beh))*0.20 + 10;
}

async function scorePartner(req) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  CreditLens AI — Scoring Partner: ${req.partnerId}`);
  console.log(`  ${req.loans.length} active loan(s) to process`);
  console.log('═'.repeat(60));

  const loanScores = [];
  for (const loanReq of req.loans) {
    const score = await scoreLoan(loanReq);
    loanScores.push(score);
    console.log(`  ✓ ${score.loanId}: ${score.score}/100 (${score.grade}) — ${score.riskLevel}`);
  }

  // Compute a preliminary trust score for the LLM prompt
  const avgLoan = loanScores.reduce((s,l) => s + l.score, 0) / loanScores.length;
  const previewTrustScore = Math.round((avgLoan / 100) * 510);

  const loanSummaries = loanScores.map(l => ({
    loanId: l.loanId, score: l.score, riskLevel: l.riskLevel,
    topRisk: l.topFactors.find(f => f.impact==='negative')?.description || 'No critical risk',
  }));

  console.log(`\n  [→] Generating partner-level AI insights...`);
  const { insights, fullReasoning } = await generatePartnerInsights(
    req.partnerId, loanSummaries, loanScores[0].parameters, previewTrustScore
  );

  const result = computeChannelPartnerScore(req.partnerId, loanScores, insights, fullReasoning);
  console.log(`\n  ✓ Trust Score: ${result.trustScore}/850 (${result.grade}) — ${result.riskLevel}`);
  return result;
}

module.exports = { scoreLoan, scorePartner };
