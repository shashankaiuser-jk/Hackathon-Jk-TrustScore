// ─────────────────────────────────────────────────────────────────────────────
// src/intelligence/recommendationEngine.js
// Produces actionable credit recommendations from all intelligence signals
// Returns: { decision, urgency, suggestedActions[], creditLimit, reasoning, flags }
// ─────────────────────────────────────────────────────────────────────────────

const DECISIONS = {
  APPROVE:  'approve',
  MONITOR:  'monitor',
  REDUCE:   'reduce_exposure',
  REJECT:   'reject',
};

const URGENCY = {
  IMMEDIATE: 'immediate',   // within 24–48 hours
  HIGH:      'high',        // within 7 days
  MEDIUM:    'medium',      // within 30 days
  LOW:       'low',         // standard monitoring
};

/**
 * Synthesize all intelligence signals into a credit recommendation.
 */
function generateRecommendation(signals, loanParams, financialParams, contextualParams,
                                  persona, prediction, contradictions, loanHealthScore, thinFileMode) {
  const s   = signals;
  const lp  = loanParams       || {};
  const fp  = financialParams  || {};
  const cp  = contextualParams || {};
  const ps  = prediction       || {};
  const ps_score = ps.stressScore || 50;

  // ── Step 1: Determine primary credit decision ────────────────────────────
  const decision = makeDecision(ps_score, loanHealthScore, s, lp, fp, persona?.persona);

  // ── Step 2: Determine urgency ────────────────────────────────────────────
  const urgency = determineUrgency(decision, ps_score, s, lp, ps);

  // ── Step 3: Build action plan ────────────────────────────────────────────
  const suggestedActions = buildActionPlan(decision, urgency, s, lp, fp, cp, ps, persona, thinFileMode);

  // ── Step 4: Credit limit guidance ───────────────────────────────────────
  const creditLimit = deriveCreditLimitGuidance(decision, lp, fp, ps_score);

  // ── Step 5: Risk flags ───────────────────────────────────────────────────
  const flags = buildRiskFlags(s, lp, fp, contradictions);

  // ── Step 6: Reasoning narrative ─────────────────────────────────────────
  const reasoning = buildRecommendationReasoning(decision, urgency, ps_score, loanHealthScore,
    persona, ps, s, lp, fp, thinFileMode);

  return {
    decision,
    urgency,
    suggestedActions,
    creditLimit,
    flags,
    reasoning,
    thinFileModeActive: thinFileMode,
    generatedAt: new Date().toISOString(),
  };
}

function makeDecision(stressScore, loanScore, s, lp, fp, persona) {
  // Hard rejections
  if (stressScore >= 82 || loanScore <= 20) return DECISIONS.REJECT;
  if (s.gamblingAppUsage === true && stressScore >= 65) return DECISIONS.REJECT;
  if (s.emiBounced >= 2) return DECISIONS.REJECT;

  // Strong reduce signals
  if (stressScore >= 68 || loanScore <= 35) return DECISIONS.REDUCE;
  if (s.emiBounced >= 1 && stressScore >= 58) return DECISIONS.REDUCE;
  if (s.lenderCount >= 5 && fp.debtToIncomeRatio >= 1.8) return DECISIONS.REDUCE;
  if (lp.missedPaymentCount >= 2 && s.balanceStressLevel === 'critical') return DECISIONS.REDUCE;

  // Monitor signals
  if (stressScore >= 52 || loanScore <= 55) return DECISIONS.MONITOR;
  if (persona === 'Overleveraged' && stressScore >= 45) return DECISIONS.MONITOR;
  if (persona === 'Liquidity Stressed') return DECISIONS.MONITOR;
  if (s.collectionCallsCount >= 2) return DECISIONS.MONITOR;
  if (s.minBalanceDips >= 4 || s.balanceTrend === 'declining') return DECISIONS.MONITOR;
  if (lp.partialPaymentCount >= 3) return DECISIONS.MONITOR;

  // Approve
  return DECISIONS.APPROVE;
}

function determineUrgency(decision, stressScore, s, lp, ps) {
  if (decision === DECISIONS.REJECT) return URGENCY.IMMEDIATE;
  if (decision === DECISIONS.REDUCE) {
    if (s.emiBounced >= 1 || s.collectionCallsCount >= 3) return URGENCY.IMMEDIATE;
    if (stressScore >= 70) return URGENCY.HIGH;
    return URGENCY.HIGH;
  }
  if (decision === DECISIONS.MONITOR) {
    if (ps?.nextEmiOutcome?.outcome === 'missed_or_bounced') return URGENCY.HIGH;
    if (stressScore >= 58 || s.balanceStressLevel === 'critical') return URGENCY.HIGH;
    return URGENCY.MEDIUM;
  }
  return URGENCY.LOW;
}

function buildActionPlan(decision, urgency, s, lp, fp, cp, ps, persona, thinFileMode) {
  const actions = [];

  // ── Decision-specific actions ────────────────────────────────────────────
  if (decision === DECISIONS.REJECT) {
    actions.push({
      action: 'Issue rejection notice within 24 hours',
      owner:  'Credit Officer',
      timeline: 'Immediate',
      priority: 'critical',
    });
    actions.push({
      action: 'Initiate security invocation assessment — evaluate collateral or personal guarantee',
      owner:  'Legal/Recovery Team',
      timeline: '48 hours',
      priority: 'critical',
    });
    actions.push({
      action: 'File NPA provisioning for this loan with risk committee',
      owner:  'Risk Committee',
      timeline: '7 days',
      priority: 'high',
    });
  }

  if (decision === DECISIONS.REDUCE) {
    actions.push({
      action: `Reduce credit exposure — cap outstanding at ${fp.debtToIncomeRatio >= 2 ? '50%' : '70%'} of current limit`,
      owner:  'Credit Manager',
      timeline: '7 days',
      priority: 'critical',
    });
    actions.push({
      action: 'Require fresh 3-month bank statements from all ${s.bankAccountCount} active accounts',
      owner:  'Relationship Manager',
      timeline: '7 days',
      priority: 'high',
    });
    if (s.emiBounced >= 1) {
      actions.push({
        action: 'Register with NACH again with updated mandate — verify sufficient balance',
        owner:  'Collections',
        timeline: '3 days',
        priority: 'critical',
      });
    }
    actions.push({
      action: `Conduct borrower call — understand multi-lender situation (${s.lenderCount} active lenders detected)`,
      owner:  'Relationship Manager',
      timeline: '48 hours',
      priority: 'high',
    });
  }

  if (decision === DECISIONS.MONITOR) {
    actions.push({
      action: 'Set enhanced monitoring cadence: weekly EMI status check + monthly full review',
      owner:  'Relationship Manager',
      timeline: 'Immediate',
      priority: 'high',
    });
    actions.push({
      action: 'Alert collection team: pre-EMI reminder call 3 days before next due date',
      owner:  'Collections',
      timeline: '3 days before next EMI',
      priority: 'high',
    });
    if (s.balanceStressLevel === 'critical' || s.balanceTrend === 'declining') {
      actions.push({
        action: 'Request latest bank statement (last 1 month) from primary account — verify balance before next EMI',
        owner:  'Credit Analyst',
        timeline: '7 days',
        priority: 'high',
      });
    }
  }

  if (decision === DECISIONS.APPROVE) {
    actions.push({
      action: 'Standard approval — maintain quarterly review cycle',
      owner:  'Relationship Manager',
      timeline: '30 days',
      priority: 'low',
    });
  }

  // ── Universal actions based on signals ───────────────────────────────────
  if (s.loanAppsCount >= 4) {
    actions.push({
      action: `Verify undisclosed fintech loans — ${s.loanAppsCount} loan apps detected; request self-declaration of all active obligations`,
      owner:  'Credit Analyst',
      timeline: '7 days',
      priority: 'high',
    });
  }

  if (s.nightCashRatio >= 0.35) {
    actions.push({
      action: 'Request explanation for night-time cash withdrawal pattern — potential undisclosed liabilities',
      owner:  'Credit Officer',
      timeline: '7 days',
      priority: 'medium',
    });
  }

  if (fp.salesGrowthRate <= -8) {
    actions.push({
      action: `GST revenue down ${Math.abs(fp.salesGrowthRate).toFixed(1)}% — request GST returns for last 3 months to verify current revenue`,
      owner:  'Credit Analyst',
      timeline: '7 days',
      priority: 'high',
    });
  }

  if (thinFileMode) {
    actions.push({
      action: 'Thin-file borrower: base approval on Digitap behavioral score — request 6-month bank statement for deeper analysis',
      owner:  'Credit Officer',
      timeline: '14 days',
      priority: 'medium',
    });
    actions.push({
      action: 'Offer smaller initial loan with 3-month performance window before full disbursement',
      owner:  'Credit Committee',
      timeline: '14 days',
      priority: 'medium',
    });
  }

  // Prediction-driven actions
  if (ps?.nextEmiOutcome?.outcome === 'missed_or_bounced' || ps?.nextEmiOutcome?.outcome === 'partial') {
    actions.push({
      action: `Pre-emptive call before next EMI due date — AI predicts ${ps.nextEmiOutcome.outcome.replace(/_/g, ' ')} with ${(ps.nextEmiOutcome.probability * 100).toFixed(0)}% probability`,
      owner:  'Collections',
      timeline: '3 days before EMI',
      priority: 'critical',
    });
  }

  return actions.slice(0, 7);
}

function deriveCreditLimitGuidance(decision, lp, fp, stressScore) {
  const currentEmi = lp.emiAmount || 0;
  const currentOutstanding = lp.outstandingPrincipal || 0;

  if (decision === DECISIONS.REJECT) {
    return {
      recommendation: 'no_new_credit',
      existingLimit:  'freeze_and_recall',
      rationale:      'Critical risk profile — no new credit extension. Initiate recovery process.',
    };
  }
  if (decision === DECISIONS.REDUCE) {
    const reducePct = stressScore >= 75 ? 0.5 : 0.7;
    return {
      recommendation:  'reduce',
      reduceTo:        Math.round(currentOutstanding * reducePct),
      reductionPercent: (1 - reducePct) * 100,
      rationale:       `High stress indicators — reduce exposure to ${(reducePct * 100).toFixed(0)}% of current outstanding.`,
    };
  }
  if (decision === DECISIONS.MONITOR) {
    return {
      recommendation: 'hold',
      existingLimit:  'maintain_no_increase',
      rationale:      'Do not increase credit. Maintain current exposure and monitor for 60 days before reassessment.',
    };
  }
  return {
    recommendation: 'maintain_or_review',
    existingLimit:  'eligible_for_standard_review',
    rationale:      'Borrower in good standing — eligible for standard credit limit review in next cycle.',
  };
}

function buildRiskFlags(s, lp, fp, contradictions) {
  const flags = [];
  if (s.gamblingAppUsage)          flags.push({ flag: 'GAMBLING_APP_DETECTED', severity: 'critical', source: 'app_usage' });
  if (s.emiBounced >= 1)           flags.push({ flag: 'EMI_BOUNCE_RECORDED', severity: 'critical', source: 'transaction' });
  if (lp.missedPaymentCount >= 1)  flags.push({ flag: 'MISSED_EMI', severity: 'critical', source: 'repayment_history' });
  if (s.lenderCount >= 4)          flags.push({ flag: 'MULTI_LENDER_OVEREXPOSURE', severity: 'high', source: 'sms_analysis' });
  if (s.nightCashRatio >= 0.4)     flags.push({ flag: 'NIGHT_CASH_PATTERN', severity: 'high', source: 'transaction' });
  if (s.balanceStressLevel === 'critical') flags.push({ flag: 'CRITICAL_BALANCE_STRESS', severity: 'critical', source: 'bank_analysis' });
  if (s.failedTransactionTrend === 'rapidly_increasing') flags.push({ flag: 'RISING_FAILED_TRANSACTIONS', severity: 'high', source: 'transaction' });
  if (s.loanAppsCount >= 4)        flags.push({ flag: 'HIGH_LOAN_APP_DEPENDENCY', severity: 'medium', source: 'app_usage' });
  if ((contradictions || []).some(c => c.severity === 'critical')) flags.push({ flag: 'CRITICAL_SIGNAL_CONTRADICTION', severity: 'high', source: 'intelligence' });
  if (s.multiBankSpreadingSignal === 'active_spreading' && s.interAccountTransfers >= 5) flags.push({ flag: 'ACTIVE_ACCOUNT_SPREADING', severity: 'medium', source: 'multi_bank' });
  return flags;
}

function buildRecommendationReasoning(decision, urgency, stressScore, loanScore, persona, ps, s, lp, fp, thinFileMode) {
  const decisionMap = {
    approve:          'APPROVE — borrower demonstrates manageable risk profile',
    monitor:          'MONITOR — elevated stress requires enhanced oversight',
    reduce_exposure:  'REDUCE EXPOSURE — material risk indicators require credit curtailment',
    reject:           'REJECT — critical risk signals indicate high default probability',
  };

  const thinFileNote = thinFileMode
    ? ' [THIN-FILE MODE: Bureau data absent — decision based primarily on Digitap behavioral signals]'
    : '';

  return `Credit Decision: ${decisionMap[decision]}${thinFileNote}. ` +
    `Composite stress score ${stressScore}/100 against loan health score ${loanScore}/100 — ` +
    `persona: ${persona?.persona || 'unclassified'} (confidence ${((persona?.confidence || 0.5) * 100).toFixed(0)}%). ` +
    `Next EMI prediction: ${ps?.nextEmiOutcome?.outcome?.replace(/_/g, ' ') || 'uncertain'} ` +
    `(${((ps?.nextEmiOutcome?.probability || 0.5) * 100).toFixed(0)}% probability). ` +
    `Urgency: ${urgency} — ${urgency === 'immediate' ? 'action required today' : urgency === 'high' ? 'action within 7 days' : urgency === 'medium' ? 'review within 30 days' : 'standard monitoring'}. ` +
    `Key risk drivers: ${[
      lp.missedPaymentCount >= 1 ? `${lp.missedPaymentCount} missed EMI(s)` : null,
      s.emiBounced >= 1 ? 'NACH bounce' : null,
      s.lenderCount >= 3 ? `${s.lenderCount} active lenders` : null,
      s.balanceStressLevel === 'critical' ? 'critical balance stress' : null,
      fp.salesGrowthRate <= -5 ? `revenue -${Math.abs(fp.salesGrowthRate).toFixed(1)}%` : null,
    ].filter(Boolean).join(', ') || 'mixed signals'}.`;
}

module.exports = { generateRecommendation, DECISIONS, URGENCY };
