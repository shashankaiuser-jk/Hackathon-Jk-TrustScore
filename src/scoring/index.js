// ─────────────────────────────────────────────────────────────────────────────
// src/scoring/index.js
// ─────────────────────────────────────────────────────────────────────────────

function loanGrade(s) { return s>=80?'A':s>=65?'B':s>=50?'C':s>=35?'D':'F'; }
function loanRisk(s)  { return s>=75?'low':s>=55?'medium':s>=35?'high':'critical'; }
function cpGrade(s)   { return s>=780?'AAA':s>=720?'AA':s>=660?'A':s>=580?'BBB':s>=500?'BB':s>=400?'B':s>=300?'CCC':'D'; }
function cpRisk(s)    { return s>=720?'very_low':s>=600?'low':s>=480?'medium':s>=360?'high':'very_high'; }

function computeBaseScore({ loan, financial, behavioral }) {
  const repay =
    loan.onTimePaymentRatio * 40 +
    Math.max(0, 10 - loan.avgDelayDays * 0.5) +
    Math.max(0, 10 - loan.missedPaymentCount * 5) +
    Math.max(0, 10 - loan.partialPaymentCount * 2);

  const fin =
    (financial.balanceSheetStrength * 0.3) +
    Math.max(0, Math.min(20, (1 - financial.creditUtilization / 100) * 20)) +
    (financial.gstFilingConsistency * 15) +
    Math.max(0, 15 - financial.debtToIncomeRatio * 5);

  const beh =
    Math.max(0, 15 - behavioral.failedTransactionRate * 1.5) +
    (behavioral.inflowOutflowRatio > 1 ? 10 : behavioral.inflowOutflowRatio * 8) +
    (behavioral.gamblingAppUsage ? 0 : 10) +
    (behavioral.suddenExpenseSpike ? 0 : 5);

  return Math.min(100, Math.max(0, repay)) * 0.35
       + Math.min(100, Math.max(0, fin))   * 0.35
       + Math.min(100, Math.max(0, beh))   * 0.20
       + 10;
}

function buildTopFactors(params, engine) {
  const { loan, financial, behavioral, contextual } = params;
  return [
    {
      factor: 'Repayment Behavior',
      impact: loan.onTimePaymentRatio > 0.75 ? 'positive' : loan.onTimePaymentRatio > 0.5 ? 'neutral' : 'negative',
      weight: Math.round(loan.onTimePaymentRatio * 100) / 100,
      description: `${(loan.onTimePaymentRatio*100).toFixed(0)}% on-time, ${loan.missedPaymentCount} missed, ${loan.partialPaymentCount} partial EMIs.`,
    },
    {
      factor: 'Financial Health',
      impact: financial.balanceSheetStrength > 65 ? 'positive' : financial.balanceSheetStrength > 45 ? 'neutral' : 'negative',
      weight: financial.balanceSheetStrength / 100,
      description: `BS ${financial.balanceSheetStrength}/100, DTI ${financial.debtToIncomeRatio.toFixed(1)}x, GST trend ${financial.salesGrowthRate.toFixed(1)}%.`,
    },
    {
      factor: 'Behavioral Signals',
      impact: behavioral.inflowOutflowRatio > 1 && !behavioral.suddenExpenseSpike ? 'positive' : 'negative',
      weight: behavioral.inflowOutflowRatio,
      description: `I/O ratio ${behavioral.inflowOutflowRatio.toFixed(2)}, balance ₹${behavioral.avgDailyBalance.toLocaleString()}, spike: ${behavioral.suddenExpenseSpike?'YES':'no'}.`,
    },
    {
      factor: 'Industry Context',
      impact: contextual.industryGrowthRate > 2 ? 'positive' : contextual.industryGrowthRate < -1 ? 'negative' : 'neutral',
      weight: parseFloat((Math.abs(contextual.industryGrowthRate) / 10).toFixed(2)),
      description: `Industry growth ${contextual.industryGrowthRate.toFixed(1)}%, sector risk ${contextual.sectorRiskIndex}/100.`,
    },
    ...(engine.highRiskWorkflows.length > 0 ? [{
      factor: 'High-Risk Workflows Triggered',
      impact: 'negative',
      weight: parseFloat((engine.highRiskWorkflows.length / engine.results.length).toFixed(2)),
      description: `${engine.highRiskWorkflows.length} high-risk workflows: ${engine.highRiskWorkflows.slice(0,2).map(w=>w.name).join(', ')}.`,
    }] : []),
  ].slice(0, 5);
}

function computeLoanHealthScore(loanId, params, engineOutput, reasoning) {
  const base = computeBaseScore(params);
  const score = Math.round(Math.max(0, Math.min(100, base + engineOutput.totalScoreImpact)));

  const topFactors = buildTopFactors(params, engineOutput);

  const butterflyTriggers = engineOutput.butterflyTriggers.slice(0, 5).map(w => ({
    trigger: w.name,
    severity: w.signal === 'high_risk' ? 'critical' : w.signal === 'medium_risk' ? 'high' : 'medium',
    chain: (w.butterflyEffect || '').split(' → '),
    potentialImpact: w.reason,
  }));

  return {
    loanId, score,
    grade:            loanGrade(score),
    riskLevel:        loanRisk(score),
    workflowResults:  engineOutput.results,
    parameters:       params,
    topFactors,
    butterflyTriggers,
    reasoning,
    workflowSummary: {
      total:     engineOutput.results.length,
      triggered: engineOutput.triggeredCount,
      highRisk:  engineOutput.highRiskWorkflows.length,
      positive:  engineOutput.positiveWorkflows.length,
      scoreImpact: engineOutput.totalScoreImpact,
    },
    timestamp: new Date().toISOString(),
  };
}

function computeChannelPartnerScore(partnerId, loanScores, insights, fullReasoning) {
  if (!loanScores.length) return { partnerId, trustScore:0, grade:'D', riskLevel:'very_high', loanScores:[], topInsights:insights, fullReasoning, timestamp: new Date().toISOString() };

  const sorted   = [...loanScores].sort((a,b) => a.score - b.score);
  const worst    = sorted[0].score;
  const avgScore = loanScores.reduce((s,l) => s+l.score, 0) / loanScores.length;
  const penalty  = worst < 35 ? 0.70 : worst < 50 ? 0.85 : 1.0;
  const wLoan    = (avgScore * 0.6 + worst * 0.4) * penalty;

  const variance = loanScores.reduce((s,l) => s + (l.score - avgScore)**2, 0) / loanScores.length;
  const instab   = Math.sqrt(variance) > 15 ? 5 : 0;
  const loanContrib = Math.max(0, (wLoan / 100) * 510 - instab);

  const fin = loanScores[0].parameters.financial;
  const finContrib = Math.min(170, Math.max(0,
    (fin.balanceSheetStrength / 100) * 60 +
    Math.max(0, 40 - fin.debtToIncomeRatio * 12) +
    fin.gstFilingConsistency * 40 +
    (fin.profitMarginTrend === 'improving' ? 30 : fin.profitMarginTrend === 'stable' ? 15 : 0)));

  const beh = loanScores[0].parameters.behavioral;
  const behContrib = Math.min(102, Math.max(0,
    Math.min(40, beh.inflowOutflowRatio * 30) +
    (beh.gamblingAppUsage ? 0 : 20) +
    (beh.suddenExpenseSpike ? 0 : 20) +
    Math.max(0, 22 - beh.failedTransactionRate * 2)));

  const ctx = loanScores[0].parameters.contextual;
  const ctxContrib = Math.min(68, Math.max(0,
    Math.min(30, Math.max(0, ctx.industryGrowthRate * 2 + 20)) +
    (ctx.governmentPolicyImpact === 'positive' ? 20 : ctx.governmentPolicyImpact === 'neutral' ? 10 : 0) +
    Math.max(0, 18 - (ctx.sectorRiskIndex / 100) * 18)));

  const trustScore = Math.round(Math.max(0, Math.min(850, loanContrib + finContrib + behContrib + ctxContrib)));

  const allButterfly = loanScores.flatMap(l => l.butterflyTriggers);
  const seen = new Set();
  const uniqueButterfly = allButterfly.filter(b => { if (seen.has(b.trigger)) return false; seen.add(b.trigger); return true; }).slice(0, 5);

  const ahaMoments = loanScores.flatMap(l => l.workflowResults).filter(w => w.ahaInsight).map(w => w.ahaInsight).slice(0, 3);

  return {
    partnerId, trustScore,
    grade:    cpGrade(trustScore),
    riskLevel: cpRisk(trustScore),
    loanScores,
    scoreBreakdown: {
      loanHealthContribution:  Math.round(loanContrib),
      financialContribution:   Math.round(finContrib),
      behavioralContribution:  Math.round(behContrib),
      contextualContribution:  Math.round(ctxContrib),
      weights: { loanHealth:0.60, financial:0.20, behavioral:0.12, contextual:0.08 },
    },
    topInsights:      insights.slice(0, 3),
    butterflyEffects: uniqueButterfly,
    ahaMoments,
    fullReasoning,
    timestamp: new Date().toISOString(),
  };
}

module.exports = { computeLoanHealthScore, computeChannelPartnerScore };
