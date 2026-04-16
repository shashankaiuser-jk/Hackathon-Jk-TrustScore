// ─────────────────────────────────────────────────────────────────────────────
// src/extractors/index.js  —  Extract all 40–50 parameters from raw data
// ─────────────────────────────────────────────────────────────────────────────

const avg    = (arr) => arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;
const clamp  = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const stdDev = (arr) => { const m = avg(arr); return Math.sqrt(avg(arr.map(x => (x-m)**2))); };

// ── 1. Loan Parameters (10) ───────────────────────────────────────────────
function extractLoanParameters(loan, history) {
  const total   = history.length;
  if (!total) return {
    onTimePaymentRatio:1, delayFrequency:0, avgDelayDays:0,
    partialPaymentCount:0, missedPaymentCount:0, loanTenureProgress:0,
    emiAmountConsistency:1, penaltyOccurrences:0,
    outstandingPrincipal: loan.outstandingPrincipal,
    loanUtilizationRatio: loan.outstandingPrincipal / loan.loanAmount,
  };

  const onTime   = history.filter(r => r.status === 'on_time').length;
  const delayed  = history.filter(r => r.status === 'delayed').length;
  const partial  = history.filter(r => r.status === 'partial').length;
  const missed   = history.filter(r => r.status === 'missed').length;
  const penCount = history.filter(r => r.penaltyCharged > 0).length;
  const delays   = history.filter(r => r.delayDays > 0).map(r => r.delayDays);
  const paid     = history.map(r => r.paidAmount);

  return {
    onTimePaymentRatio:   clamp(onTime / total, 0, 1),
    delayFrequency:       clamp(delayed / total, 0, 1),
    avgDelayDays:         avg(delays),
    partialPaymentCount:  partial,
    missedPaymentCount:   missed,
    loanTenureProgress:   clamp(loan.monthsElapsed / loan.tenureMonths, 0, 1),
    emiAmountConsistency: clamp(1 - stdDev(paid) / (loan.emiAmount || 1), 0, 1),
    penaltyOccurrences:   penCount,
    outstandingPrincipal: loan.outstandingPrincipal,
    loanUtilizationRatio: clamp(loan.outstandingPrincipal / loan.loanAmount, 0, 1),
    emiAmount:            loan.emiAmount,       // passed through for workflow calculations
    loanAmount:           loan.loanAmount,
  };
}

// ── 2. Financial Parameters (15) ─────────────────────────────────────────
function extractFinancialParameters(cc) {
  const rev     = cc.gstMonthlyRevenue;
  const recent  = avg(rev.slice(-3));
  const earlier = avg(rev.slice(0, 3));
  const growth  = earlier > 0 ? ((recent - earlier) / earlier) * 100 : 0;
  const filingC = clamp(1 - cc.gstFilingDelays / 12, 0, 1);
  const cfVol   = stdDev(rev);
  const margin  = cc.netProfitMargin > 8 ? 'improving' : cc.netProfitMargin < 5 ? 'declining' : 'stable';

  return {
    gstMonthlySales:       recent,
    gstFilingConsistency:  filingC,
    salesGrowthRate:       growth,
    purchaseVsSalesRatio:  cc.purchaseToSalesRatio,
    inputOutputMismatch:   cc.inputOutputMismatch,
    cashFlowVolatility:    cfVol,
    creditUtilization:     cc.creditUtilization,
    numberOfActiveLoans:   cc.activeLoanCount,
    recentLoanInquiries:   cc.recentInquiries,
    debtToIncomeRatio:     cc.debtToIncomeRatio,
    legalCaseCount:        cc.legalCaseCount,
    balanceSheetStrength:  cc.balanceSheetStrength,
    profitMarginTrend:     margin,
    epfoEmployeeTrend:     cc.epfoTrend,
    directorRiskSignals:   cc.directorRiskFlag,
  };
}

// ── 3. Behavioral Parameters (15) ────────────────────────────────────────
function extractBehavioralParameters(d) {
  return {
    transactionVelocity:       d.transactionVelocity,
    avgDailyBalance:           d.avgDailyBalance,
    inflowOutflowRatio:        d.inflowOutflowRatio,
    largeDebitFrequency:       d.largeDebitFrequency,
    loanSmsFrequency:          d.loanSmsFrequency,
    repaymentSmsSignals:       d.repaymentSmsSignals,
    financeAppUsage:           d.financeAppUsage,
    gamblingAppUsage:          d.gamblingAppUsage,
    expenseCategorization:     d.expenseCategories,
    cashWithdrawalFrequency:   d.cashWithdrawalFrequency,
    bankAccountCount:          d.bankAccountCount,
    upiTransactionTrend:       d.upiTransactionTrend,
    failedTransactionRate:     d.failedTransactionRate,
    nightTimeTransactionRatio: d.nightTimeTransactionRatio,
    suddenExpenseSpike:        d.suddenExpenseSpike,
  };
}

// ── 4. Contextual Parameters (10) ────────────────────────────────────────
function extractContextualParameters(ind) {
  return {
    industryGrowthRate:       ind.growthRate,
    peerPerformanceScore:     ind.peerPerformanceScore,
    localityBusinessDensity:  ind.localityBusinessDensity,
    sectorRiskIndex:          ind.sectorRiskIndex,
    governmentPolicyImpact:   ind.governmentPolicyImpact,
    commodityPriceImpact:     ind.commodityPriceImpact,
    seasonalityImpact:        ind.seasonalityImpact,
    supplierConcentration:    ind.supplierConcentration,
    customerConcentration:    ind.customerConcentration,
    marketVolatilityIndex:    ind.marketVolatilityIndex,
  };
}

// ── Master Extractor ──────────────────────────────────────────────────────
function extractAllParameters(loan, history, credCheck, digitap, industry) {
  return {
    loan:       extractLoanParameters(loan, history),
    financial:  extractFinancialParameters(credCheck),
    behavioral: extractBehavioralParameters(digitap),
    contextual: extractContextualParameters(industry),
  };
}

module.exports = { extractAllParameters };
