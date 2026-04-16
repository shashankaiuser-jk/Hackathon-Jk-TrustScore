// ─────────────────────────────────────────────────────────────────────────────
// src/intelligence/digitapInterpreter.js
// Converts raw Digitap JSON → structured behavioral signal map
// Works with both real Digitap JSON (rich) and flat mockData (legacy)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Interpret raw Digitap data into a rich behavioral signal object.
 * Handles two input shapes:
 *   - Rich Digitap JSON (bankAccounts, transactions, smsSignals, appUsageSignals …)
 *   - Flat legacy mock (avgDailyBalance, transactionVelocity, … direct fields)
 *
 * Returns a normalized { signals, thinFileMode } object consumed by all engines.
 */
function interpretDigitap(digitapData) {
  if (!digitapData) return { signals: buildEmptySignals(), thinFileMode: true };

  // Detect which shape we received
  const isRich = !!(digitapData.bankAccounts || digitapData.velocityTrends || digitapData.smsSignals);
  return isRich
    ? interpretRichDigitap(digitapData)
    : interpretFlatDigitap(digitapData);
}

// ── Rich Digitap Interpretation ───────────────────────────────────────────

function interpretRichDigitap(d) {
  const vt  = d.velocityTrends    || {};
  const bs  = d.balanceStress     || {};
  const cw  = d.cashWithdrawals   || {};
  const mb  = d.multiBankBehavior || {};
  const cc  = d.creditCardSignals || {};
  const sms = d.smsSignals        || {};
  const app = d.appUsageSignals   || {};
  const upi = d.upiAnalysis       || {};
  const ft  = d.failedTransactions|| {};
  const ep  = d.expensePatterns   || {};
  const ds  = d.derivedSignals    || {};
  const accs= d.bankAccounts      || [];
  const txns= d.transactions      || [];

  // 1. Transaction velocity trends (30d vs 90d)
  const velocity30d = vt.last30Days?.transactionCount || ds.transactionVelocity30d || 0;
  const velocity90d = vt.last90Days?.transactionCount || ds.transactionVelocity90d || 0;
  const velocityDailyAvg90 = velocity90d / 90;
  const velocityDailyAvg30 = velocity30d / 30;
  const velocityTrend = velocityDailyAvg90 > 0
    ? ((velocityDailyAvg30 - velocityDailyAvg90) / velocityDailyAvg90) * 100
    : 0;
  const velocitySignal = velocityTrend < -20 ? 'sharply_declining'
    : velocityTrend < -5  ? 'declining'
    : velocityTrend > 15  ? 'increasing'
    : 'stable';

  // 2. Debit/Credit imbalance
  const io30 = vt.last30Days?.inflowOutflowRatio || ds.inflowOutflowRatio30d || 1;
  const io90 = vt.last90Days?.inflowOutflowRatio || ds.inflowOutflowRatio90d || 1;
  const ioTrend = io30 - io90; // negative = worsening
  const debitCreditImbalance = io30 < 0.95 ? 'high_stress'
    : io30 < 1.0  ? 'mild_stress'
    : io30 < 1.1  ? 'balanced'
    : 'surplus';

  // 3. Bank account count + multi-bank patterns
  const bankAccountCount = mb.totalActiveAccounts || accs.length || ds.multiBankSpreading ? 3 : 1;
  const interAccountTransfers = mb.interAccountTransfers || 0;
  const multiBankSpreadingSignal = bankAccountCount >= 3 && interAccountTransfers >= 4
    ? 'active_spreading'
    : bankAccountCount >= 2
    ? 'moderate_spreading'
    : 'single_bank';

  // 4. Minimum balance dips / negative balances
  const minBalanceDips = bs.minBalanceDipCount || 0;
  const criticalDays   = bs.criticalDays || 0;
  const balanceTrend   = bs.eodBalanceTrend || 'stable';
  const balanceDropRate= Math.abs(bs.balanceDropRate || 0);
  const balanceStressLevel = minBalanceDips >= 6 || criticalDays >= 4
    ? 'critical'
    : minBalanceDips >= 3
    ? 'elevated'
    : 'normal';

  // 5. Inflow/Outflow consistency
  const netSurplusMonths = accs.flatMap(a => a.monthlyStats || []).filter(m => m.totalCredits >= m.totalDebits).length;
  const totalMonths      = accs.flatMap(a => a.monthlyStats || []).length;
  const ioConsistency    = totalMonths > 0 ? netSurplusMonths / totalMonths : 0.5;
  const ioConsistencySignal = ioConsistency >= 0.75 ? 'consistent_surplus'
    : ioConsistency >= 0.5  ? 'mixed'
    : 'persistent_deficit';

  // 6. Large / unusual transactions
  const largeDebitTxns = txns.filter(t => t.type === 'debit' && t.amount >= 50000).length;
  const bouncedTxns    = txns.filter(t => t.bounced === true).length;
  const failedNach     = ft.failedNachCount || 0;
  const failedTxnRate  = ft.failedTransactionRate || 0;
  const failedTxnTrend = (ft.failedRateTrend || []).length >= 2
    ? (ft.failedRateTrend.at(-1) - ft.failedRateTrend[0]) > 2 ? 'rapidly_increasing' : 'stable'
    : 'unknown';

  // 7. Credit card stress
  const ccStress = cc.minimumPaymentOnly >= 1 || cc.creditCardInquiries >= 2
    ? 'stressed'
    : cc.creditCardBillPayments >= 2
    ? 'active'
    : 'low';

  // 8. EMI-related SMS patterns
  const loanSmsPerMonth = sms.loanSmsPerMonth
    ? sms.loanSmsPerMonth.reduce((a, b) => a + b, 0) / sms.loanSmsPerMonth.length
    : sms.totalLoanRelatedSms ? sms.totalLoanRelatedSms / 3 : 0;
  const collectionCalls = sms.smsBreakdown?.collectionCalls || sms.collectionCallsLast30Days || 0;
  const missedPaymentAlerts = sms.smsBreakdown?.missedPaymentAlerts || 0;
  const penaltyNotices = sms.smsBreakdown?.penaltyNotices || 0;
  const lenderCount    = (sms.lenderNames || []).length;
  const smsStressScore = Math.min(100,
    (loanSmsPerMonth > 15 ? 30 : loanSmsPerMonth > 8 ? 15 : 5) +
    collectionCalls * 10 +
    missedPaymentAlerts * 8 +
    penaltyNotices * 6 +
    (lenderCount > 3 ? 15 : lenderCount > 2 ? 8 : 0));

  // 9. App usage patterns (loan apps, gambling, trading)
  const loanAppsCount      = app.loanAppsCount || 0;
  const loanAppDependency  = app.loanAppUsageFrequency === 'high' || loanAppsCount >= 4
    ? 'high' : loanAppsCount >= 2 ? 'medium' : 'low';
  const gamblingDetected   = app.gamblingAppsDetected === true;
  const debtSearchBehavior = (app.emiCalculatorSearches || 0) >= 8
    || (app.debtConsolidationSearches || 0) >= 2;
  const creditCheckFrequency = app.creditScoreChecks || 0;
  const financialStressApps  = app.financialStressAppBehavior === true;

  // 10. Night-time transaction ratio
  const nightTxns = txns.filter(t => {
    const h = t.hour !== undefined ? t.hour : -1;
    return h >= 22 || h <= 3;
  }).length;
  const nightTimeRatio = txns.length > 0 ? nightTxns / txns.length : ds.nightTransactionRatio || 0;

  // 11. UPI trends
  const upiFailedRateLast = (() => {
    const rates = Object.values(upi.upiFailedRate || {});
    return rates.length > 0 ? rates[rates.length - 1] : 0;
  })();
  const upiTrend = upi.upiInflowTrend || (ds.inflowOutflowRatio30d < ds.inflowOutflowRatio90d ? 'decreasing' : 'stable');

  // 12. Expense patterns
  const loanRepaymentShare = ep.loanRepaymentExpenseShare || ep.categoryBreakdown?.loan_repayment || 0;
  const cashWithdrawalShare= ep.cashWithdrawalExpenseShare || ep.categoryBreakdown?.cash_withdrawal || 0;
  const expenseSpikeDetected = ep.suddenExpenseSpike === true;

  // 13. Avg daily balance (across all accounts)
  const avgDailyBalanceAll = (() => {
    const allMonths = accs.flatMap(a => a.monthlyStats || []);
    if (!allMonths.length) return ds.avgDailyBalance90d || 33000;
    return allMonths.reduce((s, m) => s + m.avgDailyBalance, 0) / allMonths.length;
  })();

  // 14. EMI bounce/partial counts
  const emiBounced = ft.failedNachCount || ds.emiBouncedLast90Days || 0;
  const emiPartial = txns.filter(t => t.partialAmount !== undefined).length || ds.emiPartialLast90Days || 0;

  // 15. New loans taken recently
  const newLoansTaken = sms.newLoanOfferAcceptances || ds.newLoansTakenLast90Days || 0;

  const signals = {
    // Transaction behavior
    transactionVelocity:     velocityDailyAvg90 * 30,  // normalized to monthly
    velocityTrend30vs90:     velocityTrend,
    velocitySignal,

    // Inflow/Outflow
    inflowOutflowRatio:      io30,
    inflowOutflowTrend:      ioTrend,
    debitCreditImbalance,
    ioConsistency,
    ioConsistencySignal,

    // Balance
    avgDailyBalance:         avgDailyBalanceAll,
    minBalanceDips,
    criticalLowDays:         criticalDays,
    balanceTrend,
    balanceDropRate,
    balanceStressLevel,

    // Multi-bank
    bankAccountCount,
    interAccountTransfers,
    multiBankSpreadingSignal,
    primaryBankConcentration: mb.primaryBankConcentration || 0.7,

    // Transactions
    largeDebitFrequency:     largeDebitTxns,
    bouncedTransactions:     bouncedTxns,
    failedNachCount:         failedNach,
    failedTransactionRate:   failedTxnRate,
    failedTransactionTrend:  failedTxnTrend,

    // Cash
    cashWithdrawalCount:     cw.totalWithdrawals || 0,
    nightCashWithdrawals:    cw.nightTimeWithdrawals || 0,
    nightCashRatio:          cw.nightWithdrawalRatio || 0,
    cashWithdrawalTrend:     cw.frequencyTrend || 'stable',
    cashWithdrawalShare,

    // Night-time
    nightTimeTransactionRatio: nightTimeRatio,

    // Credit cards
    creditCardStress:        ccStress,
    creditCardInquiries:     cc.creditCardInquiries || 0,
    minimumPaymentOnly:      cc.minimumPaymentOnly || 0,

    // UPI
    upiTransactionTrend:     upiTrend,
    upiFailedRate:           upiFailedRateLast,
    upiFailedRateTrend:      'increasing',

    // SMS
    loanSmsFrequency:        loanSmsPerMonth,
    collectionCallsCount:    collectionCalls,
    missedPaymentAlerts,
    penaltyNoticesCount:     penaltyNotices,
    lenderCount,
    smsStressScore,
    repaymentSmsSignals:     sms.smsBreakdown?.repaymentConfirmations || sms.repaymentSmsSignals || 0,

    // App usage
    loanAppsCount,
    loanAppDependency,
    gamblingAppUsage:        gamblingDetected,
    financialStressApps,
    debtSearchBehavior,
    creditCheckFrequency,

    // Expense structure
    loanRepaymentExpenseShare: loanRepaymentShare,
    expenseSpikeDetected,
    unusualExpenseCategories: ep.unusualExpenseCategories || [],

    // EMI stress
    emiBounced,
    emiPartial,
    newLoansTakenRecently:   newLoansTaken,
    loanRepaymentPressure:   ds.loanRepaymentPressure || 'medium',

    // Derived
    suddenExpenseSpike:      expenseSpikeDetected,
    expenseCategorization: {
      inventory:       ep.categoryBreakdown?.supplier_payment || 0.38,
      operations:      ep.categoryBreakdown?.operating_expense || 0.09,
      personal:        ep.categoryBreakdown?.personal_expense || 0.07,
      loan_repayment:  loanRepaymentShare,
    },
  };

  return { signals, thinFileMode: false };
}

// ── Flat / Legacy Digitap Interpretation ─────────────────────────────────

function interpretFlatDigitap(d) {
  const io = d.inflowOutflowRatio || 1;
  const signals = {
    transactionVelocity:     d.transactionVelocity || 10,
    velocityTrend30vs90:     0,
    velocitySignal:          d.upiTransactionTrend === 'decreasing' ? 'declining' : 'stable',

    inflowOutflowRatio:      io,
    inflowOutflowTrend:      0,
    debitCreditImbalance:    io < 0.95 ? 'high_stress' : io < 1.0 ? 'mild_stress' : 'balanced',
    ioConsistency:           io > 1 ? 0.7 : 0.4,
    ioConsistencySignal:     io > 1 ? 'consistent_surplus' : 'persistent_deficit',

    avgDailyBalance:         d.avgDailyBalance || 50000,
    minBalanceDips:          d.avgDailyBalance < 20000 ? 5 : 2,
    criticalLowDays:         d.avgDailyBalance < 10000 ? 3 : 0,
    balanceTrend:            'stable',
    balanceDropRate:         0,
    balanceStressLevel:      d.avgDailyBalance < 20000 ? 'elevated' : 'normal',

    bankAccountCount:        d.bankAccountCount || 1,
    interAccountTransfers:   0,
    multiBankSpreadingSignal: (d.bankAccountCount || 1) >= 3 ? 'active_spreading' : 'single_bank',
    primaryBankConcentration: 1.0,

    largeDebitFrequency:     d.largeDebitFrequency || 0,
    bouncedTransactions:     0,
    failedNachCount:         0,
    failedTransactionRate:   d.failedTransactionRate || 0,
    failedTransactionTrend:  'stable',

    cashWithdrawalCount:     d.cashWithdrawalFrequency || 0,
    nightCashWithdrawals:    Math.round((d.cashWithdrawalFrequency || 0) * (d.nightTimeTransactionRatio || 0.1)),
    nightCashRatio:          d.nightTimeTransactionRatio || 0,
    cashWithdrawalTrend:     'stable',
    cashWithdrawalShare:     0.1,

    nightTimeTransactionRatio: d.nightTimeTransactionRatio || 0,

    creditCardStress:        'low',
    creditCardInquiries:     0,
    minimumPaymentOnly:      0,

    upiTransactionTrend:     d.upiTransactionTrend || 'stable',
    upiFailedRate:           (d.failedTransactionRate || 0) / 100,
    upiFailedRateTrend:      'stable',

    loanSmsFrequency:        d.loanSmsFrequency || 5,
    collectionCallsCount:    0,
    missedPaymentAlerts:     0,
    penaltyNoticesCount:     0,
    lenderCount:             1,
    smsStressScore:          Math.min(100, (d.loanSmsFrequency || 5) * 3),
    repaymentSmsSignals:     d.repaymentSmsSignals || 0,

    loanAppsCount:           d.financeAppUsage === 'high' ? 3 : d.financeAppUsage === 'medium' ? 2 : 1,
    loanAppDependency:       d.financeAppUsage || 'low',
    gamblingAppUsage:        d.gamblingAppUsage === true,
    financialStressApps:     d.financeAppUsage === 'high',
    debtSearchBehavior:      false,
    creditCheckFrequency:    0,

    loanRepaymentExpenseShare: d.expenseCategories?.loan_repayment / 100 || 0.12,
    expenseSpikeDetected:    d.suddenExpenseSpike === true,
    unusualExpenseCategories:[],

    emiBounced:              0,
    emiPartial:              0,
    newLoansTakenRecently:   0,
    loanRepaymentPressure:   d.loanSmsFrequency > 12 ? 'high' : 'medium',

    suddenExpenseSpike:      d.suddenExpenseSpike === true,
    expenseCategorization:   d.expenseCategories || { inventory:50, operations:20, personal:15, loan_repayment:15 },
  };

  return { signals, thinFileMode: false };
}

// ── Empty signals (pure thin-file borrower) ──────────────────────────────

function buildEmptySignals() {
  return {
    transactionVelocity: 0, velocityTrend30vs90: 0, velocitySignal: 'unknown',
    inflowOutflowRatio: 1, inflowOutflowTrend: 0, debitCreditImbalance: 'unknown',
    ioConsistency: 0.5, ioConsistencySignal: 'unknown',
    avgDailyBalance: 0, minBalanceDips: 0, criticalLowDays: 0,
    balanceTrend: 'unknown', balanceDropRate: 0, balanceStressLevel: 'unknown',
    bankAccountCount: 0, interAccountTransfers: 0, multiBankSpreadingSignal: 'unknown',
    primaryBankConcentration: 1,
    largeDebitFrequency: 0, bouncedTransactions: 0, failedNachCount: 0,
    failedTransactionRate: 0, failedTransactionTrend: 'unknown',
    cashWithdrawalCount: 0, nightCashWithdrawals: 0, nightCashRatio: 0,
    cashWithdrawalTrend: 'unknown', cashWithdrawalShare: 0,
    nightTimeTransactionRatio: 0,
    creditCardStress: 'unknown', creditCardInquiries: 0, minimumPaymentOnly: 0,
    upiTransactionTrend: 'unknown', upiFailedRate: 0, upiFailedRateTrend: 'unknown',
    loanSmsFrequency: 0, collectionCallsCount: 0, missedPaymentAlerts: 0,
    penaltyNoticesCount: 0, lenderCount: 0, smsStressScore: 0, repaymentSmsSignals: 0,
    loanAppsCount: 0, loanAppDependency: 'unknown', gamblingAppUsage: false,
    financialStressApps: false, debtSearchBehavior: false, creditCheckFrequency: 0,
    loanRepaymentExpenseShare: 0, expenseSpikeDetected: false, unusualExpenseCategories: [],
    emiBounced: 0, emiPartial: 0, newLoansTakenRecently: 0, loanRepaymentPressure: 'unknown',
    suddenExpenseSpike: false, expenseCategorization: {},
  };
}

module.exports = { interpretDigitap };
