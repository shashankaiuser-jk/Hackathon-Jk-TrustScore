// ─────────────────────────────────────────────────────────────────────────────
// src/intelligence/predictionEngine.js
// Reasoning-based prediction of near-term outcomes (no ML training required)
// Returns: { nextEmiOutcome, liquidityTrend30d, liquidityTrend60d, riskTrajectory, confidence, reasoning }
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Predict near-term borrower outcomes using deterministic reasoning over
 * Digitap behavioral signals, repayment history, and financial parameters.
 *
 * Methodology: Signal-weighted scoring with trend momentum.
 * Each signal contributes to a composite stress score that maps to outcome buckets.
 */
function predictOutcomes(signals, loanParams, financialParams, contextualParams) {
  const s  = signals;
  const lp = loanParams       || {};
  const fp = financialParams  || {};
  const cp = contextualParams || {};

  // ── Step 1: Build stress score (0–100, higher = more stressed) ───────────
  let stressScore = 50; // baseline neutral

  // Repayment trajectory signals
  if (lp.onTimePaymentRatio < 0.6)   stressScore += 18;
  else if (lp.onTimePaymentRatio < 0.75) stressScore += 8;
  else if (lp.onTimePaymentRatio > 0.9)  stressScore -= 12;

  if (lp.missedPaymentCount >= 1)    stressScore += 20;
  if (lp.partialPaymentCount >= 3)   stressScore += 12;
  else if (lp.partialPaymentCount >= 1) stressScore += 6;
  if (lp.avgDelayDays >= 10)         stressScore += 10;
  if (lp.penaltyOccurrences >= 8)    stressScore += 8;

  // Digitap balance signals
  if (s.balanceStressLevel === 'critical')  stressScore += 20;
  else if (s.balanceStressLevel === 'elevated') stressScore += 10;
  else if (s.balanceStressLevel === 'normal')   stressScore -= 8;

  if (s.balanceTrend === 'declining')       stressScore += 12;
  if (s.balanceDropRate >= 40)              stressScore += 8;
  if (s.debitCreditImbalance === 'high_stress') stressScore += 15;
  else if (s.debitCreditImbalance === 'surplus') stressScore -= 10;

  // Cash flow momentum (30d vs 90d direction)
  if (s.velocitySignal === 'sharply_declining') stressScore += 15;
  else if (s.velocitySignal === 'declining')    stressScore += 7;
  else if (s.velocitySignal === 'increasing')   stressScore -= 8;

  if (s.inflowOutflowTrend < -0.05)         stressScore += 10;  // I/O ratio worsening
  if (s.inflowOutflowTrend > 0.05)          stressScore -= 6;   // I/O ratio improving

  // Collection pressure
  if (s.collectionCallsCount >= 3)           stressScore += 15;
  else if (s.collectionCallsCount >= 1)      stressScore += 7;
  if (s.emiBounced >= 1)                     stressScore += 18;
  if (s.emiPartial >= 2)                     stressScore += 10;

  // Multi-lender / debt load
  if (s.lenderCount >= 4)                    stressScore += 12;
  if (s.loanRepaymentExpenseShare >= 0.30)   stressScore += 12;
  if (s.newLoansTakenRecently >= 1)          stressScore += 8;

  // Financial fundamentals
  if (fp.salesGrowthRate <= -8)              stressScore += 12;
  else if (fp.salesGrowthRate >= 5)          stressScore -= 8;
  if (fp.debtToIncomeRatio >= 2)             stressScore += 10;
  else if (fp.debtToIncomeRatio <= 0.8)      stressScore -= 8;
  if (fp.balanceSheetStrength <= 40)         stressScore += 8;

  // Behavioral risk
  if (s.gamblingAppUsage)                    stressScore += 15;
  if (s.nightTimeTransactionRatio >= 0.2)    stressScore += 8;
  if (s.failedTransactionTrend === 'rapidly_increasing') stressScore += 10;

  // Industry
  if (cp.industryGrowthRate <= -2)           stressScore += 6;
  if (cp.sectorRiskIndex >= 70)              stressScore += 5;

  stressScore = Math.min(100, Math.max(0, stressScore));

  // ── Step 2: Predict next EMI outcome ────────────────────────────────────
  const nextEmiOutcome = predictNextEmi(stressScore, s, lp);

  // ── Step 3: Predict 30-day liquidity trend ───────────────────────────────
  const liquidityTrend30d = predictLiquidity(stressScore, s, fp, 30);

  // ── Step 4: Predict 60-day liquidity trend ───────────────────────────────
  const liquidityTrend60d = predictLiquidity(stressScore, s, fp, 60);

  // ── Step 5: Overall risk trajectory ─────────────────────────────────────
  const riskTrajectory = buildRiskTrajectory(stressScore, s, lp, fp);

  // ── Step 6: Confidence in prediction ─────────────────────────────────────
  // Higher data richness → higher confidence
  const dataPoints = [
    s.balanceTrend !== 'unknown',
    s.velocitySignal !== 'unknown',
    lp.onTimePaymentRatio !== undefined,
    fp.salesGrowthRate !== undefined,
    s.smsStressScore > 0,
    s.lenderCount > 0,
  ].filter(Boolean).length;
  const confidence = Math.min(0.92, 0.55 + dataPoints * 0.06);

  // ── Step 7: Narrative reasoning ─────────────────────────────────────────
  const reasoning = buildPredictionReasoning(stressScore, nextEmiOutcome, liquidityTrend30d, s, lp, fp);

  return {
    stressScore:    Math.round(stressScore),
    nextEmiOutcome,
    liquidityTrend30d,
    liquidityTrend60d,
    riskTrajectory,
    confidence:     parseFloat(confidence.toFixed(2)),
    reasoning,
  };
}

function predictNextEmi(stressScore, s, lp) {
  if (stressScore >= 80 || s.emiBounced >= 1) {
    return {
      outcome:     'missed_or_bounced',
      probability: Math.min(0.92, 0.55 + (stressScore - 70) * 0.015),
      rationale:   `NACH bounce history + balance at ₹${s.avgDailyBalance?.toLocaleString()} — insufficient cushion for full EMI debit. High probability of bounce or pre-bounce partial payment.`,
    };
  }
  if (stressScore >= 65 || (lp.partialPaymentCount >= 2 && s.balanceStressLevel === 'elevated')) {
    return {
      outcome:     'partial',
      probability: Math.min(0.80, 0.45 + (stressScore - 55) * 0.01),
      rationale:   `Pattern of ${lp.partialPaymentCount || 2} partial payments + declining balance trend — borrower likely to short the next EMI to manage competing obligations.`,
    };
  }
  if (stressScore >= 50) {
    return {
      outcome:     'delayed',
      probability: Math.min(0.70, 0.40 + (stressScore - 40) * 0.01),
      rationale:   `Moderate stress indicators — EMI likely to clear but with 5–15 day delay as borrower consolidates from multiple accounts.`,
    };
  }
  return {
    outcome:     'on_time',
    probability: Math.min(0.88, 0.60 + (50 - stressScore) * 0.01),
    rationale:   `Positive cash flow signals and manageable stress score — next EMI likely to clear on time.`,
  };
}

function predictLiquidity(stressScore, s, fp, days) {
  const multiplier = days === 60 ? 1.3 : 1.0; // 60d outlook carries more uncertainty
  const adjustedStress = Math.min(100, stressScore * multiplier);

  let direction, projection, drivers;

  if (adjustedStress >= 75) {
    direction  = 'deteriorating_sharply';
    projection = 'Net cash position likely turns negative. Emergency cash shortfall probable.';
    drivers    = [
      s.balanceTrend === 'declining' ? `Balance already declining at ${s.balanceDropRate.toFixed(0)}%/quarter` : 'Balance under stress',
      `I/O ratio ${s.inflowOutflowRatio.toFixed(2)} — structural deficit`,
      fp.salesGrowthRate <= -5 ? `Revenue declining ${Math.abs(fp.salesGrowthRate).toFixed(1)}%` : 'Revenue headwinds',
    ];
  } else if (adjustedStress >= 58) {
    direction  = 'deteriorating';
    projection = `Cash buffer likely to compress by 20–35% over ${days} days. Liquidity tight but not yet critical.`;
    drivers    = [
      `Loan repayment share ${(s.loanRepaymentExpenseShare * 100).toFixed(0)}% of outflows — high fixed obligation`,
      s.collectionCallsCount > 0 ? `${s.collectionCallsCount} active collection call(s)` : 'Moderate lender pressure',
    ];
  } else if (adjustedStress >= 42) {
    direction  = 'stable_with_risk';
    projection = `Liquidity holds over ${days} days but sensitive to any adverse event (EMI bounce, supplier dispute, emergency expense).`;
    drivers    = ['Near-balanced I/O', 'Some repayment stress visible but manageable'];
  } else {
    direction  = 'improving';
    projection = `Cash position expected to strengthen over ${days} days based on current trajectory.`;
    drivers    = ['Positive I/O ratio', 'Stable/growing transaction velocity', 'Low collection pressure'];
  }

  return { direction, projection, drivers, days };
}

function buildRiskTrajectory(stressScore, s, lp, fp) {
  const momentum = s.velocitySignal === 'sharply_declining' ? 'worsening_rapidly'
    : s.velocitySignal === 'declining' ? 'worsening'
    : s.balanceTrend === 'declining' ? 'worsening'
    : s.inflowOutflowTrend > 0.02 ? 'improving'
    : 'stable';

  const currentLevel = stressScore >= 75 ? 'critical'
    : stressScore >= 58 ? 'high'
    : stressScore >= 42 ? 'medium'
    : 'low';

  const trajectoryMap = {
    critical: { worsening_rapidly: 'default_imminent', worsening: 'default_probable', stable: 'critical_watch', improving: 'high' },
    high:     { worsening_rapidly: 'critical_imminent', worsening: 'critical', stable: 'high_watch', improving: 'medium' },
    medium:   { worsening_rapidly: 'high_watch', worsening: 'medium_to_high', stable: 'stable_medium', improving: 'low_medium' },
    low:      { worsening_rapidly: 'medium_watch', worsening: 'low_watch', stable: 'stable_low', improving: 'improving' },
  };

  return {
    currentLevel,
    momentum,
    projected30d: trajectoryMap[currentLevel]?.[momentum] || currentLevel,
    keyDrivers: buildTrajectoryDrivers(stressScore, s, lp, fp),
  };
}

function buildTrajectoryDrivers(stressScore, s, lp, fp) {
  const drivers = [];
  if (s.emiBounced >= 1)            drivers.push('NACH bounce — immediate trigger event already occurred');
  if (s.collectionCallsCount >= 3)  drivers.push('Active collections — lender in recovery mode');
  if (s.balanceTrend === 'declining') drivers.push('Balance trending downward — reducing payment capacity');
  if (fp.salesGrowthRate <= -5)     drivers.push(`Revenue declining ${Math.abs(fp.salesGrowthRate).toFixed(1)}% — income base eroding`);
  if (s.lenderCount >= 4)           drivers.push('Multi-lender exposure — cascading default risk');
  if (s.velocitySignal === 'sharply_declining') drivers.push('Transaction activity sharply down — business contraction signal');
  return drivers.slice(0, 4);
}

function buildPredictionReasoning(stressScore, nextEmi, liquidity30d, s, lp, fp) {
  return `Composite stress score of ${Math.round(stressScore)}/100 places this borrower in the '${liquidity30d.direction.replace(/_/g, ' ')}' liquidity trajectory. ` +
    `Next EMI prediction: ${nextEmi.outcome.replace(/_/g, ' ')} (probability ${(nextEmi.probability * 100).toFixed(0)}%) — ${nextEmi.rationale} ` +
    `30-day outlook: ${liquidity30d.projection} ` +
    `Key predictive signals driving this assessment: ${[
      s.balanceTrend === 'declining' ? `balance declining ${s.balanceDropRate.toFixed(0)}%` : null,
      lp.partialPaymentCount >= 2 ? `${lp.partialPaymentCount} prior partial EMIs` : null,
      s.collectionCallsCount >= 2 ? `${s.collectionCallsCount} collection calls` : null,
      fp.salesGrowthRate <= -5 ? `revenue −${Math.abs(fp.salesGrowthRate).toFixed(1)}%` : null,
    ].filter(Boolean).join(', ') || 'mixed signals'}.`;
}

module.exports = { predictOutcomes };
