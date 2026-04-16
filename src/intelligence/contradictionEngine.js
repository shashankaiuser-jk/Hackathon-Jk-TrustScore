// ─────────────────────────────────────────────────────────────────────────────
// src/intelligence/contradictionEngine.js
// Detects structured contradictions between behavioral, financial, and loan signals
// Returns: Array of { signalA, signalB, interpretation, severity, category }
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect contradictions between pairs of signals that should co-vary
 * but are moving in opposite directions — or are logically inconsistent.
 */
function detectContradictions(signals, loanParams, financialParams, contextualParams) {
  const contradictions = [];

  const add = (signalA, signalB, interpretation, severity, category) =>
    contradictions.push({ signalA, signalB, interpretation, severity, category });

  const s  = signals;
  const lp = loanParams       || {};
  const fp = financialParams  || {};
  const cp = contextualParams || {};

  // ── Category: Repayment vs. Cash Flow ────────────────────────────────────

  // 1. Increasing business inflows BUT increasing partial payments
  if (s.inflowOutflowRatio >= 0.98 && lp.partialPaymentCount >= 2) {
    add(
      `I/O ratio ${s.inflowOutflowRatio.toFixed(2)} (near-balanced cash flow)`,
      `${lp.partialPaymentCount} partial EMI payments`,
      'Borrower has near-neutral cash flow yet cannot pay full EMI amounts — suggests inflows are consumed by hidden obligations not visible in primary account (possibly inter-account fund masking or undisclosed liabilities).',
      'high',
      'repayment_vs_cashflow'
    );
  }

  // 2. On-time payments improving BUT balance deteriorating
  if (lp.onTimePaymentRatio >= 0.7 && s.balanceTrend === 'declining' && s.balanceDropRate >= 30) {
    add(
      `${(lp.onTimePaymentRatio * 100).toFixed(0)}% on-time payment ratio (appears healthy)`,
      `Balance dropped ${s.balanceDropRate.toFixed(0)}% over the analysis window`,
      'Surface repayment discipline masks underlying balance deterioration. Borrower is prioritizing EMI to avoid default flags while liquidity erodes — a precursor pattern to eventual EMI stress.',
      'high',
      'repayment_vs_balance'
    );
  }

  // 3. Regular EMI payments BUT rising collection call volume
  if (lp.onTimePaymentRatio >= 0.65 && s.collectionCallsCount >= 3) {
    add(
      `${(lp.onTimePaymentRatio * 100).toFixed(0)}% on-time payments (reported clean)`,
      `${s.collectionCallsCount} collection call(s) received in 30 days`,
      'Official repayment record shows compliance, but active collection calls suggest missed payments to OTHER lenders not reflected in this loan\'s history. Multi-lender pressure is invisible in single-loan view.',
      'high',
      'repayment_vs_collections'
    );
  }

  // ── Category: Revenue vs. Behavioral Signals ─────────────────────────────

  // 4. Positive/stable GST revenue BUT I/O ratio deteriorating
  if (fp.salesGrowthRate >= -2 && s.debitCreditImbalance === 'high_stress') {
    add(
      `GST sales trend ${fp.salesGrowthRate.toFixed(1)}% (near stable or growing)`,
      `I/O ratio ${s.inflowOutflowRatio.toFixed(2)} — bank outflows exceed inflows`,
      'Business revenue appears stable via GST but bank transactions show net cash drain. This divergence indicates either: (a) GST revenue not flowing to monitored accounts, (b) revenue being siphoned pre-bank, or (c) GST data lagging actual business decline.',
      'critical',
      'revenue_vs_cashflow'
    );
  }

  // 5. Low CIBIL (stressed) BUT strong transaction velocity / high UPI activity
  if (fp.creditUtilization >= 70 && s.velocitySignal === 'increasing') {
    add(
      `Credit utilization ${fp.creditUtilization}% (bureau stress indicator)`,
      `Transaction velocity is ${s.velocitySignal} (operational activity growing)`,
      'Bureau data shows financial stress while Digitap shows rising business activity. Contradicts the standard risk model — the borrower may be operationally healthy but overleveraged on credit instruments. Digitap signal is the more current, forward-looking indicator here.',
      'medium',
      'bureau_vs_digitap'
    );
  }

  // 6. Growing EPFO headcount BUT declining bank balance
  if (fp.epfoEmployeeTrend === 'growing' && s.balanceStressLevel === 'critical') {
    add(
      `EPFO headcount trend: growing (business appears to be expanding)`,
      `Bank balance in critical stress — ${s.minBalanceDips} min-balance dips`,
      'Hiring is growing while cash reserves are critically low. This pattern suggests the business is scaling faster than its working capital supports — a classic pre-distress indicator where payroll obligations may soon outpace cash availability.',
      'high',
      'operations_vs_liquidity'
    );
  }

  // ── Category: SMS/App Behavior vs. Reported Financial State ──────────────

  // 7. Rising loan app usage BUT stable reported loan count
  if (s.loanAppsCount >= 4 && fp.numberOfActiveLoans <= 3) {
    add(
      `${s.loanAppsCount} loan apps actively used (MoneyTap, KreditBee, Navi, etc.)`,
      `Only ${fp.numberOfActiveLoans} active loans in bureau data`,
      'High loan app dependency suggests active borrowing from fintech/NBFC lenders not yet reflected in bureau data (reporting lag is typically 30-60 days). Actual loan count likely higher than reported — creates a hidden leverage blind spot.',
      'high',
      'app_behavior_vs_bureau'
    );
  }

  // 8. High debt-search behavior BUT clean credit inquiries in bureau
  if (s.debtSearchBehavior && (fp.recentLoanInquiries || 0) <= 2) {
    add(
      `Active debt management searches (${12} EMI calculator and refinancing queries)`,
      `Only ${fp.recentLoanInquiries || 0} credit inquiries in bureau`,
      'Digital behavior shows intensive debt-related research (EMI calculators, refinancing searches, debt consolidation queries) while hard credit pulls are minimal. Borrower may be evaluating but not yet applying — or using soft-pull channels that don\'t appear in bureau.',
      'medium',
      'digital_behavior_vs_bureau'
    );
  }

  // ── Category: Cash Behavior vs. Stated Expenses ──────────────────────────

  // 9. High night-time cash withdrawals BUT no stated personal expense pressure
  if (s.nightCashRatio >= 0.35 && s.cashWithdrawalShare >= 0.12) {
    add(
      `${(s.nightCashRatio * 100).toFixed(0)}% of cash withdrawals are between 10PM–3AM`,
      `Cash withdrawals represent ${(s.cashWithdrawalShare * 100).toFixed(0)}% of total outflows`,
      'Significant night-time cash withdrawal pattern combined with high withdrawal volume suggests funds are being moved outside the formal financial system. This could indicate undisclosed obligations, informal lending to others, or operational expenses intentionally off-record.',
      'high',
      'cash_behavior'
    );
  }

  // 10. Loan repayment share > 28% BUT only 1-2 declared loans
  if (s.loanRepaymentExpenseShare >= 0.28 && fp.numberOfActiveLoans <= 2) {
    add(
      `${(s.loanRepaymentExpenseShare * 100).toFixed(0)}% of outflows going to loan repayments`,
      `Only ${fp.numberOfActiveLoans} loan(s) declared in bureau`,
      'Loan repayment outflows are disproportionately high for the declared loan count. The discrepancy implies undisclosed debt obligations — possibly informal lenders, family loans, or fintech credits not yet captured in bureau records.',
      'critical',
      'repayment_disclosure'
    );
  }

  // ── Category: Industry vs. Business Behavior ─────────────────────────────

  // 11. Industry growing BUT borrower's UPI/transaction declining
  if (cp.industryGrowthRate >= 3 && s.upiTransactionTrend === 'decreasing') {
    add(
      `Industry growth rate: ${cp.industryGrowthRate.toFixed(1)}% (sector is expanding)`,
      `UPI transaction trend: ${s.upiTransactionTrend} (borrower volume is shrinking)`,
      'The sector is growing but this specific borrower is losing transaction volume. This is a peer-divergence signal — the borrower is likely losing market share or customer base within a growing market, making their decline structural rather than sector-driven.',
      'high',
      'industry_vs_borrower'
    );
  }

  // 12. Recent improvement in on-time ratio BUT SMS stress score still rising
  if (lp.onTimePaymentRatio >= 0.75 && s.smsStressScore >= 50 && s.loanSmsFrequency >= 12) {
    add(
      `On-time payment ratio improved to ${(lp.onTimePaymentRatio * 100).toFixed(0)}%`,
      `SMS stress score ${s.smsStressScore}/100 with ${s.loanSmsFrequency.toFixed(0)} loan SMS/month`,
      'Recent payment improvement may be tactical rather than fundamental. High loan SMS volume suggests lenders are still in active follow-up mode — the borrower may be current on payments but under continuous pressure, indicating fragile compliance rather than genuine recovery.',
      'medium',
      'recovery_signal_vs_lender_pressure'
    );
  }

  // Deduplicate and limit
  const seen = new Set();
  return contradictions.filter(c => {
    const key = c.category;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 6);
}

module.exports = { detectContradictions };
