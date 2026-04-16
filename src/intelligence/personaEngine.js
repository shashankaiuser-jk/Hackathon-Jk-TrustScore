// ─────────────────────────────────────────────────────────────────────────────
// src/intelligence/personaEngine.js
// Classifies borrower into 1 of 6 personas using real Digitap + loan signals
// Returns: { persona, confidence, reasoning, dominantSignals }
// ─────────────────────────────────────────────────────────────────────────────

const PERSONAS = {
  STABLE_OPERATOR:        'Stable Operator',
  GROWTH_AGGRESSIVE:      'Growth Aggressive',
  LIQUIDITY_STRESSED:     'Liquidity Stressed',
  OVERLEVERAGED:          'Overleveraged',
  RISKY_BEHAVIOR:         'Risky Behavior',
  THIN_FILE_HIGH_POTENTIAL: 'Thin-File High Potential',
};

/**
 * Score each persona dimension using real Digitap behavioral signals.
 * Higher dimension score = stronger evidence for that persona.
 */
function scorePersonaDimensions(signals, loanParams, financialParams, thinFileMode) {
  const s = signals;

  // ── Stable Operator ───────────────────────────────────────────────────────
  // Evidence: positive I/O ratio, stable/growing balance, low failed txns,
  //           consistent GST, low loan SMS, single primary bank
  let stableScore = 0;
  if (s.inflowOutflowRatio >= 1.05)                                stableScore += 25;
  else if (s.inflowOutflowRatio >= 1.0)                            stableScore += 12;
  if (s.ioConsistencySignal === 'consistent_surplus')              stableScore += 20;
  if (s.balanceStressLevel === 'normal')                           stableScore += 15;
  if (s.failedTransactionRate <= 2)                                stableScore += 15;
  if (s.loanSmsFrequency <= 6)                                     stableScore += 10;
  if (s.smsStressScore <= 25)                                      stableScore += 10;
  if (loanParams && loanParams.onTimePaymentRatio >= 0.8)          stableScore += 15;
  if (loanParams && loanParams.missedPaymentCount === 0)           stableScore += 10;
  if (s.gamblingAppUsage === false && !s.financialStressApps)      stableScore += 10;
  if (financialParams && financialParams.salesGrowthRate >= 0)     stableScore += 10;

  // ── Growth Aggressive ─────────────────────────────────────────────────────
  // Evidence: rising transaction velocity, multiple bank accounts, high loan
  //           app usage, new loans taken, increasing UPI, short tenure on loans
  let growthScore = 0;
  if (s.velocitySignal === 'increasing')                           growthScore += 25;
  if (s.bankAccountCount >= 3)                                     growthScore += 15;
  if (s.loanAppsCount >= 3)                                        growthScore += 20;
  if (s.newLoansTakenRecently >= 1)                                growthScore += 20;
  if (s.upiTransactionTrend === 'increasing')                      growthScore += 10;
  if (s.loanRepaymentExpenseShare >= 0.25)                         growthScore += 15;
  if (financialParams && financialParams.salesGrowthRate >= 5)     growthScore += 15;
  if (financialParams && financialParams.numberOfActiveLoans >= 3) growthScore += 15;
  if (s.creditCheckFrequency >= 3)                                 growthScore += 10;
  if (s.debtSearchBehavior)                                        growthScore += 10;

  // ── Liquidity Stressed ────────────────────────────────────────────────────
  // Evidence: I/O ratio < 1, balance dips, declining velocity, partial EMIs,
  //           cash withdrawal spike, collection SMS
  let liquidityScore = 0;
  if (s.debitCreditImbalance === 'high_stress')                    liquidityScore += 30;
  else if (s.debitCreditImbalance === 'mild_stress')               liquidityScore += 15;
  if (s.balanceStressLevel === 'critical')                         liquidityScore += 30;
  else if (s.balanceStressLevel === 'elevated')                    liquidityScore += 15;
  if (s.minBalanceDips >= 5)                                       liquidityScore += 20;
  if (s.emiPartial >= 2)                                           liquidityScore += 15;
  if (s.cashWithdrawalTrend === 'increasing')                      liquidityScore += 10;
  if (s.velocitySignal === 'declining')                            liquidityScore += 10;
  if (s.collectionCallsCount >= 2)                                 liquidityScore += 15;
  if (s.balanceTrend === 'declining')                              liquidityScore += 15;
  if (loanParams && loanParams.partialPaymentCount >= 2)           liquidityScore += 15;

  // ── Overleveraged ─────────────────────────────────────────────────────────
  // Evidence: high loan SMS frequency, multi-lender, loan repayment > 25% of
  //           outflows, missed EMI, high DTI, new loans + existing stress
  let overleveragedScore = 0;
  if (s.lenderCount >= 4)                                          overleveragedScore += 30;
  else if (s.lenderCount >= 3)                                     overleveragedScore += 15;
  if (s.loanSmsFrequency >= 14)                                    overleveragedScore += 25;
  if (s.loanRepaymentExpenseShare >= 0.28)                         overleveragedScore += 25;
  if (s.loanRepaymentPressure === 'high')                          overleveragedScore += 15;
  if (loanParams && loanParams.missedPaymentCount >= 1)            overleveragedScore += 20;
  if (financialParams && financialParams.debtToIncomeRatio >= 1.5) overleveragedScore += 20;
  if (financialParams && financialParams.numberOfActiveLoans >= 3) overleveragedScore += 15;
  if (s.newLoansTakenRecently >= 1 && s.emiBounced >= 1)          overleveragedScore += 20;
  if (s.smsStressScore >= 60)                                      overleveragedScore += 15;

  // ── Risky Behavior ────────────────────────────────────────────────────────
  // Evidence: night-time transactions, gambling apps, cash withdrawal pattern,
  //           account spreading, bounced EMI, failed txn trend worsening
  let riskyScore = 0;
  if (s.gamblingAppUsage === true)                                  riskyScore += 40;
  if (s.nightTimeTransactionRatio >= 0.2)                          riskyScore += 25;
  else if (s.nightTimeTransactionRatio >= 0.12)                    riskyScore += 12;
  if (s.nightCashRatio >= 0.4)                                     riskyScore += 20;
  if (s.multiBankSpreadingSignal === 'active_spreading' && s.emiBounced >= 1) riskyScore += 20;
  if (s.failedTransactionTrend === 'rapidly_increasing')           riskyScore += 20;
  if (s.emiBounced >= 1)                                           riskyScore += 15;
  if (s.cashWithdrawalShare >= 0.15)                               riskyScore += 10;
  if (s.interAccountTransfers >= 5)                                riskyScore += 10;
  if (loanParams && loanParams.penaltyOccurrences >= 8)            riskyScore += 15;

  // ── Thin-File High Potential ──────────────────────────────────────────────
  // Evidence: no bureau data, but positive Digitap signals, growing UPI,
  //           stable balance, low SMS stress, small but consistent business
  let thinFileScore = 0;
  if (thinFileMode)                                                 thinFileScore += 40;
  if (s.inflowOutflowRatio >= 1.0)                                 thinFileScore += 20;
  if (s.failedTransactionRate <= 3)                                thinFileScore += 15;
  if (s.upiTransactionTrend === 'increasing' || s.upiTransactionTrend === 'stable') thinFileScore += 10;
  if (s.loanSmsFrequency <= 8)                                     thinFileScore += 10;
  if (s.gamblingAppUsage === false)                                 thinFileScore += 10;
  if (loanParams && loanParams.onTimePaymentRatio >= 0.75)         thinFileScore += 15;

  return {
    [PERSONAS.STABLE_OPERATOR]:         stableScore,
    [PERSONAS.GROWTH_AGGRESSIVE]:       growthScore,
    [PERSONAS.LIQUIDITY_STRESSED]:      liquidityScore,
    [PERSONAS.OVERLEVERAGED]:           overleveragedScore,
    [PERSONAS.RISKY_BEHAVIOR]:          riskyScore,
    [PERSONAS.THIN_FILE_HIGH_POTENTIAL]: thinFileScore,
  };
}

function classifyPersona(signals, loanParams, financialParams, thinFileMode) {
  const scores = scorePersonaDimensions(signals, loanParams, financialParams, thinFileMode);

  // Find top two personas
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topPersona, topScore]  = ranked[0];
  const [, secondScore]         = ranked[1] || [null, 0];
  const totalPossible           = 200; // rough max per persona

  // Confidence: how dominant is the top persona over the second
  const margin      = topScore - secondScore;
  const confidence  = Math.min(0.97, Math.max(0.35,
    (topScore / totalPossible) * 0.6 + (margin / totalPossible) * 0.4
  ));

  // Collect dominant signals for reasoning
  const dominantSignals = buildDominantSignals(topPersona, signals, loanParams, financialParams);

  // Build reasoning
  const reasoning = buildPersonaReasoning(topPersona, signals, loanParams, financialParams, dominantSignals);

  return {
    persona:         topPersona,
    confidence:      parseFloat(confidence.toFixed(2)),
    reasoning,
    dominantSignals,
    allScores:       Object.fromEntries(ranked.map(([k, v]) => [k, v])),
    secondPersona:   ranked[1]?.[0] || null,
  };
}

function buildDominantSignals(persona, s, lp, fp) {
  const map = {
    [PERSONAS.STABLE_OPERATOR]: [
      `I/O ratio ${s.inflowOutflowRatio.toFixed(2)} — net positive cash flow`,
      `Failed txn rate ${s.failedTransactionRate}% — low operational stress`,
      lp ? `${(lp.onTimePaymentRatio*100).toFixed(0)}% on-time EMI payments` : null,
      `SMS stress score ${s.smsStressScore}/100 — low lender pressure`,
    ],
    [PERSONAS.GROWTH_AGGRESSIVE]: [
      `${s.loanAppsCount} active loan apps — aggressive capital seeking`,
      `${s.bankAccountCount} bank accounts — multi-bank expansion`,
      `${s.newLoansTakenRecently} new loan(s) taken in last 90 days`,
      fp ? `Sales growth ${fp.salesGrowthRate.toFixed(1)}% — revenue expansion` : null,
    ],
    [PERSONAS.LIQUIDITY_STRESSED]: [
      `I/O ratio ${s.inflowOutflowRatio.toFixed(2)} — outflows exceed inflows`,
      `${s.minBalanceDips} min-balance dip events — cash crunch pattern`,
      `${s.collectionCallsCount} collection call(s) — lender follow-up active`,
      lp ? `${lp.partialPaymentCount} partial EMI(s) — unable to pay full amount` : null,
    ],
    [PERSONAS.OVERLEVERAGED]: [
      `${s.lenderCount} active lenders — multi-debt structure`,
      `Loan repayment: ${(s.loanRepaymentExpenseShare * 100).toFixed(0)}% of total outflows`,
      `Loan SMS frequency: ${s.loanSmsFrequency.toFixed(1)}/month — heavy reminder load`,
      fp ? `DTI ${fp.debtToIncomeRatio.toFixed(2)}x — debt exceeds income capacity` : null,
    ],
    [PERSONAS.RISKY_BEHAVIOR]: [
      `Night txn ratio ${(s.nightTimeTransactionRatio * 100).toFixed(0)}% — unusual timing pattern`,
      s.gamblingAppUsage ? 'Gambling app detected — behavioral red flag' : `Night cash ratio ${(s.nightCashRatio * 100).toFixed(0)}% — unexplained cash movement`,
      `${s.emiBounced} bounced EMI(s) — NACH failure under stress`,
      `Failed txn trend: ${s.failedTransactionTrend}`,
    ],
    [PERSONAS.THIN_FILE_HIGH_POTENTIAL]: [
      'No bureau/CIBIL data — thin-file borrower',
      `I/O ratio ${s.inflowOutflowRatio.toFixed(2)} — behavioral evidence of sustainability`,
      `UPI trend: ${s.upiTransactionTrend} — digital payment adoption`,
      lp ? `${(lp.onTimePaymentRatio * 100).toFixed(0)}% repayment consistency` : null,
    ],
  };
  return (map[persona] || []).filter(Boolean);
}

function buildPersonaReasoning(persona, s, lp, fp, dominantSignals) {
  const signalText = dominantSignals.slice(0, 3).join('; ');

  const templates = {
    [PERSONAS.STABLE_OPERATOR]:
      `Borrower exhibits consistent operational cash flow and disciplined financial behavior. ${signalText}. Low behavioral stress indicators suggest a reliable borrower who manages working capital predictably.`,

    [PERSONAS.GROWTH_AGGRESSIVE]:
      `Borrower is actively expanding — taking on new debt and credit instruments to fuel growth. ${signalText}. The risk: growth velocity may outpace repayment capacity if revenue doesn't scale proportionally.`,

    [PERSONAS.LIQUIDITY_STRESSED]:
      `Borrower is under active cash flow pressure with deteriorating balance patterns. ${signalText}. The stress appears operational rather than structural — a short-term liquidity crunch with escalation risk if unaddressed.`,

    [PERSONAS.OVERLEVERAGED]:
      `Borrower is servicing debt from multiple lenders, creating a systemic repayment burden. ${signalText}. The concentration of debt obligations relative to income is the primary risk — one lender calling in a loan can trigger cascading defaults.`,

    [PERSONAS.RISKY_BEHAVIOR]:
      `Borrower exhibits behavioral patterns associated with financial distress and opaque fund movement. ${signalText}. Night-time transactions and multi-account cash movement are strong indicators of concealment or untracked obligations.`,

    [PERSONAS.THIN_FILE_HIGH_POTENTIAL]:
      `Borrower lacks traditional credit history but Digitap behavioral signals indicate operational sustainability. ${signalText}. Standard credit scoring undervalues this borrower — behavioral scoring is the primary reliable signal here.`,
  };

  return templates[persona] || `Borrower classified as ${persona} based on ${signalText}.`;
}

module.exports = { classifyPersona, PERSONAS };
