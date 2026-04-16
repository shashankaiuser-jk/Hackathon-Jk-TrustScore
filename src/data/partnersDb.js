// ─────────────────────────────────────────────────────────────────────────────
// src/data/partnersDb.js  —  In-memory DB: 10 channel partners with diverse loans
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Each partner has:
 *  - partnerId, name, email, phone, joinedDate
 *  - kycStatus, credCheckStatus
 *  - loans[] — each loan has full CredCheck + Digitap + repaymentHistory
 *
 * Data is designed for VISIBLE variation across partners:
 *   Himanshu  → Excellent (FMCG, consistent payments)
 *   Rajat     → Stressed  (Electronics, lots of delays)
 *   Ashutosh  → Good      (Pharma, minor blips)
 *   Utsav     → High Risk (Chemicals, GST issues)
 *   Shruti    → Watch     (Textiles, partial payments)
 *   Arjun     → Excellent (Agri, clean record)
 *   Vivek     → Critical  (Auto parts, missed EMIs)
 *   Neha      → Good      (Consumer goods)
 *   Suresh    → Watch     (Infrastructure, cashflow tight)
 *   Aaditya   → Excellent (IT Services, premium borrower)
 */

// ── Helpers ──────────────────────────────────────────────────────────────────
const mkRepayment = (months, pattern) =>
  months.map((m, i) => {
    const p = pattern[i % pattern.length];
    return {
      month: m,
      dueAmount: p.due,
      paidAmount: p.paid,
      dueDate: `${m}-05`,
      paidDate: p.paid > 0 ? `${m}-${p.paidDay < 10 ? '0'+p.paidDay : p.paidDay}` : '',
      status: p.status,
      delayDays: p.delay || 0,
      penaltyCharged: p.penalty || 0,
    };
  });

const MONTHS_24 = [
  '2024-01','2024-02','2024-03','2024-04','2024-05','2024-06',
  '2024-07','2024-08','2024-09','2024-10','2024-11','2024-12',
  '2025-01','2025-02','2025-03',
];

const MONTHS_12 = [
  '2024-04','2024-05','2024-06','2024-07','2024-08','2024-09',
  '2024-10','2024-11','2024-12','2025-01','2025-02','2025-03',
];

// ── PATTERN templates ─────────────────────────────────────────────────────────
const PAT_CLEAN   = { due:100000, paid:100000, paidDay:4, status:'on_time', delay:0, penalty:0 };
const PAT_SLIGHT  = { due:100000, paid:100000, paidDay:8, status:'delayed', delay:3, penalty:400 };
const PAT_PARTIAL = { due:100000, paid:70000,  paidDay:14, status:'partial', delay:9, penalty:1500 };
const PAT_MISSED  = { due:100000, paid:0,      paidDay:0,  status:'missed', delay:30, penalty:4000 };

// ── PARTNER 1: Himanshu — Excellent FMCG ─────────────────────────────────────
const himanshuLoan1 = {
  loan: { loanId:'LN-HIM-001', partnerId:'CP-HIMANSHU-001', loanAmount:2000000, disbursedDate:'2024-01-10',
          tenureMonths:18, monthsElapsed:14, emiAmount:130000, outstandingPrincipal:520000,
          interestRate:12.5, loanType:'working_capital' },
  repaymentHistory: mkRepayment(MONTHS_12, [PAT_CLEAN,PAT_CLEAN,PAT_CLEAN,PAT_SLIGHT,PAT_CLEAN,PAT_CLEAN,
                                              PAT_CLEAN,PAT_CLEAN,PAT_CLEAN,PAT_SLIGHT,PAT_CLEAN,PAT_CLEAN]),
  credCheck: { cibilScore:758, creditUtilization:38, activeLoanCount:2, recentInquiries:1, dpd30:0, dpd60:0, dpd90:0,
    gstMonthlyRevenue:[1400000,1450000,1380000,1500000,1480000,1520000,1490000,1540000,1560000,1580000,1600000,1620000],
    gstFilingDelays:0, purchaseToSalesRatio:0.62, inputOutputMismatch:1.8,
    annualRevenue:18200000, netProfitMargin:10.4, debtToIncomeRatio:0.8,
    balanceSheetStrength:82, legalCaseCount:0, epfoEmployeeCount:55, epfoTrend:'growing',
    directorRiskFlag:false, relatedPartyTransactions:4, industryCode:'FMCG_DIST',
    peerAverageCibil:710, peerDefaultRate:2.8 },
  digitap: { avgDailyBalance:210000, transactionVelocity:18.2, inflowOutflowRatio:1.22,
    largeDebitFrequency:2, cashWithdrawalFrequency:2, failedTransactionRate:0.4,
    upiTransactionTrend:'increasing', bankAccountCount:2, loanSmsFrequency:4, repaymentSmsSignals:12,
    financeAppUsage:'low', gamblingAppUsage:false, nightTimeTransactionRatio:0.04,
    suddenExpenseSpike:false, expenseCategories:{inventory:68, operations:15, personal:8, loan_repayment:9} },
  industry: { industryName:'FMCG Distribution', industryCode:'FMCG_DIST', growthRate:8.2, sectorRiskIndex:28,
    governmentPolicyImpact:'positive', commodityPriceImpact:'low', seasonalityImpact:'low',
    localityBusinessDensity:'high', supplierConcentration:32, customerConcentration:24,
    marketVolatilityIndex:22, peerPerformanceScore:82 },
};

const himanshuLoan2 = {
  loan: { loanId:'LN-HIM-002', partnerId:'CP-HIMANSHU-001', loanAmount:800000, disbursedDate:'2024-08-01',
          tenureMonths:12, monthsElapsed:7, emiAmount:72000, outstandingPrincipal:360000,
          interestRate:11.5, loanType:'term_loan' },
  repaymentHistory: mkRepayment(['2024-09','2024-10','2024-11','2024-12','2025-01','2025-02','2025-03'],
    [PAT_CLEAN,PAT_CLEAN,PAT_CLEAN,PAT_CLEAN,PAT_CLEAN,PAT_SLIGHT,PAT_CLEAN]),
  credCheck: { ...himanshuLoan1.credCheck, cibilScore:762 },
  digitap: { ...himanshuLoan1.digitap, avgDailyBalance:195000 },
  industry: himanshuLoan1.industry,
};

// ── PARTNER 2: Rajat — Stressed Electronics ───────────────────────────────────
const rajatLoan1 = {
  loan: { loanId:'LN-RAJ-001', partnerId:'CP-RAJAT-002', loanAmount:2500000, disbursedDate:'2023-06-15',
          tenureMonths:24, monthsElapsed:18, emiAmount:120000, outstandingPrincipal:820000,
          interestRate:14.5, loanType:'working_capital' },
  repaymentHistory: mkRepayment(MONTHS_12,
    [PAT_CLEAN,PAT_CLEAN,PAT_SLIGHT,PAT_CLEAN,PAT_PARTIAL,PAT_MISSED,PAT_PARTIAL,PAT_SLIGHT,PAT_CLEAN,PAT_PARTIAL,PAT_SLIGHT,PAT_CLEAN]),
  credCheck: { cibilScore:672, creditUtilization:78, activeLoanCount:3, recentInquiries:4, dpd30:3, dpd60:2, dpd90:1,
    gstMonthlyRevenue:[820000,790000,810000,750000,720000,680000,710000,730000,695000,700000,720000,740000],
    gstFilingDelays:3, purchaseToSalesRatio:0.72, inputOutputMismatch:8.5,
    annualRevenue:8800000, netProfitMargin:6.2, debtToIncomeRatio:1.8,
    balanceSheetStrength:52, legalCaseCount:1, epfoEmployeeCount:24, epfoTrend:'declining',
    directorRiskFlag:false, relatedPartyTransactions:12, industryCode:'ELEC_DIST',
    peerAverageCibil:698, peerDefaultRate:6.2 },
  digitap: { avgDailyBalance:33000, transactionVelocity:8.2, inflowOutflowRatio:0.96,
    largeDebitFrequency:6, cashWithdrawalFrequency:9, failedTransactionRate:4.5,
    upiTransactionTrend:'decreasing', bankAccountCount:3, loanSmsFrequency:15.7, repaymentSmsSignals:4,
    financeAppUsage:'high', gamblingAppUsage:false, nightTimeTransactionRatio:0.23,
    suddenExpenseSpike:true, expenseCategories:{inventory:38, operations:9, personal:7, loan_repayment:29},
    velocityTrends:{ last30Days:{totalInflow:280000,totalOutflow:291000,transactionCount:54,inflowOutflowRatio:0.962},
      last90Days:{totalInflow:1015000,totalOutflow:1055000,transactionCount:177,inflowOutflowRatio:0.962},
      velocityChange30vs90:-17.2, debitCreditGap:-40000 },
    balanceStress:{ minBalanceDipCount:8, negativeSurplusCount:3, eodBalanceTrend:'declining',
      balanceDropRate:-55.8, criticalDays:6 },
    derivedSignals:{ loanRepaymentPressure:'high', cashWithdrawalTrend:'increasing',
      emiBouncedLast90Days:1, collectionCallsLast30Days:3 } },
  industry: { industryName:'Electrical Goods Distribution', industryCode:'ELEC_DIST',
    growthRate:-2.1, sectorRiskIndex:68, governmentPolicyImpact:'neutral', commodityPriceImpact:'high',
    seasonalityImpact:'medium', localityBusinessDensity:'high', supplierConcentration:62,
    customerConcentration:48, marketVolatilityIndex:72, peerPerformanceScore:54 },
};

// ── PARTNER 3: Ashutosh — Good Pharma ─────────────────────────────────────────
const ashutoshLoan1 = {
  loan: { loanId:'LN-ASH-001', partnerId:'CP-ASHUTOSH-003', loanAmount:1800000, disbursedDate:'2024-02-01',
          tenureMonths:18, monthsElapsed:13, emiAmount:110000, outstandingPrincipal:550000,
          interestRate:12.8, loanType:'working_capital' },
  repaymentHistory: mkRepayment(MONTHS_12,
    [PAT_CLEAN,PAT_SLIGHT,PAT_CLEAN,PAT_CLEAN,PAT_CLEAN,PAT_SLIGHT,PAT_CLEAN,PAT_CLEAN,PAT_PARTIAL,PAT_SLIGHT,PAT_CLEAN,PAT_CLEAN]),
  credCheck: { cibilScore:718, creditUtilization:52, activeLoanCount:2, recentInquiries:2, dpd30:1, dpd60:0, dpd90:0,
    gstMonthlyRevenue:[1050000,1080000,1020000,1100000,1090000,1130000,1110000,1150000,1170000,1190000,1210000,1230000],
    gstFilingDelays:1, purchaseToSalesRatio:0.66, inputOutputMismatch:2.9,
    annualRevenue:13200000, netProfitMargin:9.1, debtToIncomeRatio:1.0,
    balanceSheetStrength:74, legalCaseCount:0, epfoEmployeeCount:40, epfoTrend:'stable',
    directorRiskFlag:false, relatedPartyTransactions:5, industryCode:'PHARMA_DIST',
    peerAverageCibil:715, peerDefaultRate:2.5 },
  digitap: { avgDailyBalance:145000, transactionVelocity:14.8, inflowOutflowRatio:1.14,
    largeDebitFrequency:3, cashWithdrawalFrequency:3, failedTransactionRate:0.9,
    upiTransactionTrend:'stable', bankAccountCount:2, loanSmsFrequency:6, repaymentSmsSignals:10,
    financeAppUsage:'low', gamblingAppUsage:false, nightTimeTransactionRatio:0.06,
    suddenExpenseSpike:false, expenseCategories:{inventory:60, operations:16, personal:9, loan_repayment:15} },
  industry: { industryName:'Pharmaceutical Distribution', industryCode:'PHARMA_DIST',
    growthRate:9.5, sectorRiskIndex:22, governmentPolicyImpact:'positive', commodityPriceImpact:'medium',
    seasonalityImpact:'low', localityBusinessDensity:'medium', supplierConcentration:40,
    customerConcentration:32, marketVolatilityIndex:25, peerPerformanceScore:78 },
};

// ── PARTNER 4: Utsav — High Risk Chemicals ───────────────────────────────────
const utsavLoan1 = {
  loan: { loanId:'LN-UTS-001', partnerId:'CP-UTSAV-004', loanAmount:3000000, disbursedDate:'2023-03-01',
          tenureMonths:24, monthsElapsed:20, emiAmount:145000, outstandingPrincipal:970000,
          interestRate:15.8, loanType:'working_capital' },
  repaymentHistory: mkRepayment(MONTHS_12,
    [PAT_PARTIAL,PAT_MISSED,PAT_PARTIAL,PAT_SLIGHT,PAT_MISSED,PAT_PARTIAL,PAT_CLEAN,PAT_PARTIAL,PAT_MISSED,PAT_PARTIAL,PAT_SLIGHT,PAT_PARTIAL]),
  credCheck: { cibilScore:598, creditUtilization:91, activeLoanCount:4, recentInquiries:7, dpd30:5, dpd60:4, dpd90:2,
    gstMonthlyRevenue:[680000,640000,600000,570000,540000,510000,490000,480000,460000,440000,420000,400000],
    gstFilingDelays:5, purchaseToSalesRatio:0.84, inputOutputMismatch:14.2,
    annualRevenue:6400000, netProfitMargin:3.8, debtToIncomeRatio:2.9,
    balanceSheetStrength:38, legalCaseCount:2, epfoEmployeeCount:18, epfoTrend:'declining',
    directorRiskFlag:true, relatedPartyTransactions:18, industryCode:'CHEM_DIST',
    peerAverageCibil:680, peerDefaultRate:9.8 },
  digitap: { avgDailyBalance:18000, transactionVelocity:5.6, inflowOutflowRatio:0.88,
    largeDebitFrequency:9, cashWithdrawalFrequency:12, failedTransactionRate:7.2,
    upiTransactionTrend:'decreasing', bankAccountCount:4, loanSmsFrequency:22, repaymentSmsSignals:2,
    financeAppUsage:'high', gamblingAppUsage:true, nightTimeTransactionRatio:0.38,
    suddenExpenseSpike:true, expenseCategories:{inventory:28, operations:8, personal:12, loan_repayment:42} },
  industry: { industryName:'Chemical Distribution', industryCode:'CHEM_DIST',
    growthRate:-4.2, sectorRiskIndex:80, governmentPolicyImpact:'negative', commodityPriceImpact:'very_high',
    seasonalityImpact:'high', localityBusinessDensity:'medium', supplierConcentration:78,
    customerConcentration:65, marketVolatilityIndex:85, peerPerformanceScore:38 },
};

// ── PARTNER 5: Shruti — Watch Textiles ───────────────────────────────────────
const shrutiLoan1 = {
  loan: { loanId:'LN-SHR-001', partnerId:'CP-SHRUTI-005', loanAmount:1500000, disbursedDate:'2024-01-15',
          tenureMonths:18, monthsElapsed:13, emiAmount:92000, outstandingPrincipal:460000,
          interestRate:13.5, loanType:'working_capital' },
  repaymentHistory: mkRepayment(MONTHS_12,
    [PAT_CLEAN,PAT_CLEAN,PAT_SLIGHT,PAT_PARTIAL,PAT_CLEAN,PAT_SLIGHT,PAT_PARTIAL,PAT_CLEAN,PAT_SLIGHT,PAT_CLEAN,PAT_PARTIAL,PAT_SLIGHT]),
  credCheck: { cibilScore:688, creditUtilization:64, activeLoanCount:2, recentInquiries:3, dpd30:2, dpd60:1, dpd90:0,
    gstMonthlyRevenue:[920000,900000,880000,860000,870000,890000,910000,930000,940000,920000,910000,900000],
    gstFilingDelays:2, purchaseToSalesRatio:0.70, inputOutputMismatch:5.4,
    annualRevenue:10800000, netProfitMargin:7.0, debtToIncomeRatio:1.4,
    balanceSheetStrength:61, legalCaseCount:0, epfoEmployeeCount:30, epfoTrend:'stable',
    directorRiskFlag:false, relatedPartyTransactions:8, industryCode:'TEXT_DIST',
    peerAverageCibil:695, peerDefaultRate:5.0 },
  digitap: { avgDailyBalance:58000, transactionVelocity:11.4, inflowOutflowRatio:1.02,
    largeDebitFrequency:5, cashWithdrawalFrequency:6, failedTransactionRate:2.8,
    upiTransactionTrend:'stable', bankAccountCount:2, loanSmsFrequency:10, repaymentSmsSignals:6,
    financeAppUsage:'medium', gamblingAppUsage:false, nightTimeTransactionRatio:0.14,
    suddenExpenseSpike:false, expenseCategories:{inventory:52, operations:12, personal:9, loan_repayment:22} },
  industry: { industryName:'Textiles Distribution', industryCode:'TEXT_DIST',
    growthRate:1.4, sectorRiskIndex:52, governmentPolicyImpact:'neutral', commodityPriceImpact:'medium',
    seasonalityImpact:'high', localityBusinessDensity:'high', supplierConcentration:50,
    customerConcentration:42, marketVolatilityIndex:55, peerPerformanceScore:62 },
};

const shrutiLoan2 = {
  loan: { loanId:'LN-SHR-002', partnerId:'CP-SHRUTI-005', loanAmount:600000, disbursedDate:'2024-09-01',
          tenureMonths:12, monthsElapsed:6, emiAmount:55000, outstandingPrincipal:300000,
          interestRate:13.0, loanType:'term_loan' },
  repaymentHistory: mkRepayment(['2024-10','2024-11','2024-12','2025-01','2025-02','2025-03'],
    [PAT_CLEAN,PAT_SLIGHT,PAT_CLEAN,PAT_PARTIAL,PAT_SLIGHT,PAT_CLEAN]),
  credCheck: { ...shrutiLoan1.credCheck, cibilScore:692 },
  digitap: { ...shrutiLoan1.digitap, avgDailyBalance:52000 },
  industry: shrutiLoan1.industry,
};

// ── PARTNER 6: Arjun — Excellent Agri ────────────────────────────────────────
const arjunLoan1 = {
  loan: { loanId:'LN-ARJ-001', partnerId:'CP-ARJUN-006', loanAmount:1200000, disbursedDate:'2024-03-01',
          tenureMonths:12, monthsElapsed:12, emiAmount:105000, outstandingPrincipal:105000,
          interestRate:11.0, loanType:'working_capital' },
  repaymentHistory: mkRepayment(['2024-04','2024-05','2024-06','2024-07','2024-08','2024-09',
                                  '2024-10','2024-11','2024-12','2025-01','2025-02','2025-03'],
    [PAT_CLEAN,PAT_CLEAN,PAT_CLEAN,PAT_CLEAN,PAT_CLEAN,PAT_SLIGHT,PAT_CLEAN,PAT_CLEAN,PAT_CLEAN,PAT_CLEAN,PAT_CLEAN,PAT_CLEAN]),
  credCheck: { cibilScore:776, creditUtilization:28, activeLoanCount:1, recentInquiries:1, dpd30:0, dpd60:0, dpd90:0,
    gstMonthlyRevenue:[1600000,1650000,1580000,1700000,1680000,1720000,1690000,1740000,1760000,1780000,1800000,1820000],
    gstFilingDelays:0, purchaseToSalesRatio:0.58, inputOutputMismatch:1.2,
    annualRevenue:20400000, netProfitMargin:12.2, debtToIncomeRatio:0.6,
    balanceSheetStrength:88, legalCaseCount:0, epfoEmployeeCount:62, epfoTrend:'growing',
    directorRiskFlag:false, relatedPartyTransactions:2, industryCode:'AGRI_DIST',
    peerAverageCibil:720, peerDefaultRate:2.0 },
  digitap: { avgDailyBalance:280000, transactionVelocity:20.4, inflowOutflowRatio:1.32,
    largeDebitFrequency:2, cashWithdrawalFrequency:1, failedTransactionRate:0.2,
    upiTransactionTrend:'increasing', bankAccountCount:1, loanSmsFrequency:2, repaymentSmsSignals:14,
    financeAppUsage:'low', gamblingAppUsage:false, nightTimeTransactionRatio:0.03,
    suddenExpenseSpike:false, expenseCategories:{inventory:72, operations:14, personal:5, loan_repayment:9} },
  industry: { industryName:'Agricultural Inputs Distribution', industryCode:'AGRI_DIST',
    growthRate:10.8, sectorRiskIndex:20, governmentPolicyImpact:'very_positive', commodityPriceImpact:'low',
    seasonalityImpact:'medium', localityBusinessDensity:'medium', supplierConcentration:28,
    customerConcentration:20, marketVolatilityIndex:18, peerPerformanceScore:88 },
};

// ── PARTNER 7: Vivek — Critical Auto Parts ───────────────────────────────────
const vivekLoan1 = {
  loan: { loanId:'LN-VIV-001', partnerId:'CP-VIVEK-007', loanAmount:2800000, disbursedDate:'2023-01-01',
          tenureMonths:24, monthsElapsed:22, emiAmount:135000, outstandingPrincipal:1100000,
          interestRate:16.5, loanType:'working_capital' },
  repaymentHistory: mkRepayment(MONTHS_12,
    [PAT_MISSED,PAT_PARTIAL,PAT_MISSED,PAT_PARTIAL,PAT_MISSED,PAT_PARTIAL,PAT_PARTIAL,PAT_MISSED,PAT_PARTIAL,PAT_SLIGHT,PAT_PARTIAL,PAT_MISSED]),
  credCheck: { cibilScore:552, creditUtilization:96, activeLoanCount:5, recentInquiries:9, dpd30:6, dpd60:5, dpd90:4,
    gstMonthlyRevenue:[560000,520000,490000,460000,430000,400000,380000,360000,340000,320000,300000,280000],
    gstFilingDelays:6, purchaseToSalesRatio:0.91, inputOutputMismatch:18.4,
    annualRevenue:4800000, netProfitMargin:2.1, debtToIncomeRatio:4.2,
    balanceSheetStrength:22, legalCaseCount:3, epfoEmployeeCount:12, epfoTrend:'rapidly_declining',
    directorRiskFlag:true, relatedPartyTransactions:22, industryCode:'AUTO_DIST',
    peerAverageCibil:672, peerDefaultRate:12.8 },
  digitap: { avgDailyBalance:8000, transactionVelocity:3.8, inflowOutflowRatio:0.78,
    largeDebitFrequency:11, cashWithdrawalFrequency:14, failedTransactionRate:9.8,
    upiTransactionTrend:'sharply_decreasing', bankAccountCount:5, loanSmsFrequency:28, repaymentSmsSignals:1,
    financeAppUsage:'high', gamblingAppUsage:true, nightTimeTransactionRatio:0.45,
    suddenExpenseSpike:true, expenseCategories:{inventory:20, operations:7, personal:16, loan_repayment:52} },
  industry: { industryName:'Auto Parts Distribution', industryCode:'AUTO_DIST',
    growthRate:-7.1, sectorRiskIndex:88, governmentPolicyImpact:'negative', commodityPriceImpact:'very_high',
    seasonalityImpact:'medium', localityBusinessDensity:'medium', supplierConcentration:82,
    customerConcentration:74, marketVolatilityIndex:90, peerPerformanceScore:28 },
};

// ── PARTNER 8: Neha — Good Consumer Goods ────────────────────────────────────
const nehaLoan1 = {
  loan: { loanId:'LN-NEH-001', partnerId:'CP-NEHA-008', loanAmount:1000000, disbursedDate:'2024-04-01',
          tenureMonths:12, monthsElapsed:11, emiAmount:88000, outstandingPrincipal:88000,
          interestRate:12.0, loanType:'working_capital' },
  repaymentHistory: mkRepayment(['2024-05','2024-06','2024-07','2024-08','2024-09','2024-10',
                                  '2024-11','2024-12','2025-01','2025-02','2025-03'],
    [PAT_CLEAN,PAT_CLEAN,PAT_SLIGHT,PAT_CLEAN,PAT_CLEAN,PAT_SLIGHT,PAT_PARTIAL,PAT_CLEAN,PAT_CLEAN,PAT_SLIGHT,PAT_CLEAN]),
  credCheck: { cibilScore:722, creditUtilization:48, activeLoanCount:2, recentInquiries:2, dpd30:1, dpd60:0, dpd90:0,
    gstMonthlyRevenue:[1100000,1120000,1090000,1140000,1130000,1160000,1140000,1180000,1200000,1220000,1240000,1260000],
    gstFilingDelays:1, purchaseToSalesRatio:0.65, inputOutputMismatch:2.6,
    annualRevenue:14200000, netProfitMargin:8.8, debtToIncomeRatio:0.9,
    balanceSheetStrength:76, legalCaseCount:0, epfoEmployeeCount:44, epfoTrend:'growing',
    directorRiskFlag:false, relatedPartyTransactions:5, industryCode:'CONS_DIST',
    peerAverageCibil:712, peerDefaultRate:2.9 },
  digitap: { avgDailyBalance:168000, transactionVelocity:16.2, inflowOutflowRatio:1.18,
    largeDebitFrequency:3, cashWithdrawalFrequency:3, failedTransactionRate:0.7,
    upiTransactionTrend:'increasing', bankAccountCount:2, loanSmsFrequency:5, repaymentSmsSignals:11,
    financeAppUsage:'low', gamblingAppUsage:false, nightTimeTransactionRatio:0.05,
    suddenExpenseSpike:false, expenseCategories:{inventory:65, operations:16, personal:8, loan_repayment:11} },
  industry: { industryName:'Consumer Goods Distribution', industryCode:'CONS_DIST',
    growthRate:7.2, sectorRiskIndex:30, governmentPolicyImpact:'positive', commodityPriceImpact:'low',
    seasonalityImpact:'medium', localityBusinessDensity:'high', supplierConcentration:35,
    customerConcentration:28, marketVolatilityIndex:26, peerPerformanceScore:80 },
};

// ── PARTNER 9: Suresh — Watch Infrastructure ─────────────────────────────────
const sureshLoan1 = {
  loan: { loanId:'LN-SUR-001', partnerId:'CP-SURESH-009', loanAmount:4000000, disbursedDate:'2023-08-01',
          tenureMonths:30, monthsElapsed:19, emiAmount:160000, outstandingPrincipal:1760000,
          interestRate:14.0, loanType:'project_finance' },
  repaymentHistory: mkRepayment(MONTHS_12,
    [PAT_CLEAN,PAT_PARTIAL,PAT_SLIGHT,PAT_CLEAN,PAT_SLIGHT,PAT_PARTIAL,PAT_SLIGHT,PAT_CLEAN,PAT_PARTIAL,PAT_SLIGHT,PAT_CLEAN,PAT_SLIGHT]),
  credCheck: { cibilScore:674, creditUtilization:72, activeLoanCount:3, recentInquiries:4, dpd30:2, dpd60:1, dpd90:0,
    gstMonthlyRevenue:[1800000,1750000,1700000,1680000,1720000,1760000,1780000,1800000,1820000,1840000,1860000,1880000],
    gstFilingDelays:2, purchaseToSalesRatio:0.74, inputOutputMismatch:6.8,
    annualRevenue:21600000, netProfitMargin:5.8, debtToIncomeRatio:1.6,
    balanceSheetStrength:58, legalCaseCount:1, epfoEmployeeCount:85, epfoTrend:'stable',
    directorRiskFlag:false, relatedPartyTransactions:10, industryCode:'INFRA_DIST',
    peerAverageCibil:690, peerDefaultRate:6.8 },
  digitap: { avgDailyBalance:62000, transactionVelocity:12.8, inflowOutflowRatio:1.04,
    largeDebitFrequency:7, cashWithdrawalFrequency:5, failedTransactionRate:3.2,
    upiTransactionTrend:'stable', bankAccountCount:3, loanSmsFrequency:12, repaymentSmsSignals:7,
    financeAppUsage:'medium', gamblingAppUsage:false, nightTimeTransactionRatio:0.16,
    suddenExpenseSpike:false, expenseCategories:{inventory:48, operations:20, personal:8, loan_repayment:24} },
  industry: { industryName:'Infrastructure Materials', industryCode:'INFRA_DIST',
    growthRate:3.5, sectorRiskIndex:48, governmentPolicyImpact:'positive', commodityPriceImpact:'high',
    seasonalityImpact:'medium', localityBusinessDensity:'low', supplierConcentration:58,
    customerConcentration:52, marketVolatilityIndex:50, peerPerformanceScore:65 },
};

// ── PARTNER 10: Aaditya — Excellent IT Services ───────────────────────────────
const aadityaLoan1 = {
  loan: { loanId:'LN-AAD-001', partnerId:'CP-AADITYA-010', loanAmount:1500000, disbursedDate:'2024-06-01',
          tenureMonths:12, monthsElapsed:9, emiAmount:132000, outstandingPrincipal:396000,
          interestRate:10.5, loanType:'working_capital' },
  repaymentHistory: mkRepayment(['2024-07','2024-08','2024-09','2024-10','2024-11','2024-12','2025-01','2025-02','2025-03'],
    [PAT_CLEAN,PAT_CLEAN,PAT_CLEAN,PAT_CLEAN,PAT_CLEAN,PAT_CLEAN,PAT_CLEAN,PAT_SLIGHT,PAT_CLEAN]),
  credCheck: { cibilScore:798, creditUtilization:22, activeLoanCount:1, recentInquiries:0, dpd30:0, dpd60:0, dpd90:0,
    gstMonthlyRevenue:[2200000,2250000,2180000,2300000,2280000,2320000,2290000,2340000,2360000,2380000,2400000,2420000],
    gstFilingDelays:0, purchaseToSalesRatio:0.52, inputOutputMismatch:0.8,
    annualRevenue:28200000, netProfitMargin:14.8, debtToIncomeRatio:0.4,
    balanceSheetStrength:94, legalCaseCount:0, epfoEmployeeCount:120, epfoTrend:'rapidly_growing',
    directorRiskFlag:false, relatedPartyTransactions:1, industryCode:'IT_SERV',
    peerAverageCibil:730, peerDefaultRate:1.2 },
  digitap: { avgDailyBalance:480000, transactionVelocity:24.8, inflowOutflowRatio:1.48,
    largeDebitFrequency:1, cashWithdrawalFrequency:1, failedTransactionRate:0.1,
    upiTransactionTrend:'strongly_increasing', bankAccountCount:2, loanSmsFrequency:1, repaymentSmsSignals:16,
    financeAppUsage:'low', gamblingAppUsage:false, nightTimeTransactionRatio:0.02,
    suddenExpenseSpike:false, expenseCategories:{inventory:30, operations:40, personal:6, loan_repayment:8} },
  industry: { industryName:'IT Services & Distribution', industryCode:'IT_SERV',
    growthRate:18.4, sectorRiskIndex:15, governmentPolicyImpact:'very_positive', commodityPriceImpact:'very_low',
    seasonalityImpact:'low', localityBusinessDensity:'high', supplierConcentration:20,
    customerConcentration:18, marketVolatilityIndex:15, peerPerformanceScore:92 },
};

// ── Master partners array ──────────────────────────────────────────────────────
const partners = [
  { partnerId:'CP-HIMANSHU-001', name:'Himanshu', email:'himanshu@creditlens.ai', phone:'9812345601',
    company:'Himanshu FMCG Distributors Pvt Ltd', joinedDate:'2024-01-05', kycStatus:'completed',
    credCheckStatus:'completed', loans:[himanshuLoan1, himanshuLoan2] },
  { partnerId:'CP-RAJAT-002', name:'Rajat', email:'rajat@creditlens.ai', phone:'9812345602',
    company:'Rajat Electronics & Traders', joinedDate:'2023-06-10', kycStatus:'completed',
    credCheckStatus:'completed', loans:[rajatLoan1] },
  { partnerId:'CP-ASHUTOSH-003', name:'Ashutosh', email:'ashutosh@creditlens.ai', phone:'9812345603',
    company:'Ashutosh Pharma Distribution', joinedDate:'2024-01-28', kycStatus:'completed',
    credCheckStatus:'completed', loans:[ashutoshLoan1] },
  { partnerId:'CP-UTSAV-004', name:'Utsav', email:'utsav@creditlens.ai', phone:'9461360575',
    company:'Utsav Chemicals Pvt Ltd', joinedDate:'2023-02-25', kycStatus:'in_process',
    credCheckStatus:'pending', loans:[utsavLoan1] },
  { partnerId:'CP-SHRUTI-005', name:'Shruti', email:'shruti.shrivastava9697@gmail.com', phone:'9625549142',
    company:'Shruti Textiles & Fabric House', joinedDate:'2024-01-12', kycStatus:'completed',
    credCheckStatus:'completed', loans:[shrutiLoan1, shrutiLoan2] },
  { partnerId:'CP-ARJUN-006', name:'Arjun', email:'arjun@creditlens.ai', phone:'9812345606',
    company:'Arjun Agri Inputs Ltd', joinedDate:'2024-02-20', kycStatus:'completed',
    credCheckStatus:'completed', loans:[arjunLoan1] },
  { partnerId:'CP-VIVEK-007', name:'Vivek', email:'vivek@creditlens.ai', phone:'9812345607',
    company:'Vivek Auto Parts Wholesaler', joinedDate:'2023-01-05', kycStatus:'completed',
    credCheckStatus:'in_review', loans:[vivekLoan1] },
  { partnerId:'CP-NEHA-008', name:'Neha', email:'nehapatel@jai-kisan.com', phone:'9101922295',
    company:'Neha Patel Enterprises', joinedDate:'2024-03-09', kycStatus:'completed',
    credCheckStatus:'completed', loans:[nehaLoan1] },
  { partnerId:'CP-SURESH-009', name:'Suresh', email:'sureshverma@jai-kisan.com', phone:'9231787199',
    company:'Suresh Verma Infrastructure', joinedDate:'2023-07-30', kycStatus:'completed',
    credCheckStatus:'completed', loans:[sureshLoan1] },
  { partnerId:'CP-AADITYA-010', name:'Aaditya', email:'aaditya@creditlens.ai', phone:'8439447500',
    company:'Aaditya Industries IT Services', joinedDate:'2024-05-28', kycStatus:'completed',
    credCheckStatus:'completed', loans:[aadityaLoan1] },
];

// ── Utility ───────────────────────────────────────────────────────────────────
const getPartner   = (id) => partners.find(p => p.partnerId === id) || null;
const getPartnerByName = (name) => partners.find(p => p.name.toLowerCase() === name.toLowerCase()) || null;
const getAllLoans   = () => partners.flatMap(p =>
    p.loans.map(l => ({ ...l, partnerName: p.name, partnerCompany: p.company })));
const getLoan      = (id) => getAllLoans().find(l => l.loan.loanId === id) || null;

module.exports = { partners, getPartner, getPartnerByName, getAllLoans, getLoan };
