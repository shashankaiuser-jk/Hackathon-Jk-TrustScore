// ─────────────────────────────────────────────────────────────────────────────
// src/data/mockData.js  —  Realistic mock: 2 loans for CP-RAJESH-001
// ─────────────────────────────────────────────────────────────────────────────

// ── LOAN 1: Stressed (Electrical Goods Distributor) ───────────────────────
const loan1 = {
  loan: {
    loanId: 'LN-2023-001',
    partnerId: 'CP-RAJESH-001',
    loanAmount: 2500000,
    disbursedDate: '2023-06-15',
    tenureMonths: 24,
    monthsElapsed: 18,
    emiAmount: 120000,
    outstandingPrincipal: 820000,
    interestRate: 14.5,
    loanType: 'working_capital',
  },
  repaymentHistory: [
    { month:'2023-07', dueAmount:120000, paidAmount:120000, dueDate:'2023-07-05', paidDate:'2023-07-04', status:'on_time',  delayDays:0,  penaltyCharged:0 },
    { month:'2023-08', dueAmount:120000, paidAmount:120000, dueDate:'2023-08-05', paidDate:'2023-08-05', status:'on_time',  delayDays:0,  penaltyCharged:0 },
    { month:'2023-09', dueAmount:120000, paidAmount:120000, dueDate:'2023-09-05', paidDate:'2023-09-07', status:'delayed',  delayDays:2,  penaltyCharged:500 },
    { month:'2023-10', dueAmount:120000, paidAmount:120000, dueDate:'2023-10-05', paidDate:'2023-10-05', status:'on_time',  delayDays:0,  penaltyCharged:0 },
    { month:'2023-11', dueAmount:120000, paidAmount:120000, dueDate:'2023-11-05', paidDate:'2023-11-10', status:'delayed',  delayDays:5,  penaltyCharged:1200 },
    { month:'2023-12', dueAmount:120000, paidAmount:90000,  dueDate:'2023-12-05', paidDate:'2023-12-12', status:'partial',  delayDays:7,  penaltyCharged:2000 },
    { month:'2024-01', dueAmount:120000, paidAmount:120000, dueDate:'2024-01-05', paidDate:'2024-01-14', status:'delayed',  delayDays:9,  penaltyCharged:2200 },
    { month:'2024-02', dueAmount:120000, paidAmount:60000,  dueDate:'2024-02-05', paidDate:'2024-02-18', status:'partial',  delayDays:13, penaltyCharged:3000 },
    { month:'2024-03', dueAmount:120000, paidAmount:0,      dueDate:'2024-03-05', paidDate:'',           status:'missed',   delayDays:30, penaltyCharged:4500 },
    { month:'2024-04', dueAmount:120000, paidAmount:85000,  dueDate:'2024-04-05', paidDate:'2024-04-22', status:'partial',  delayDays:17, penaltyCharged:3500 },
    { month:'2024-05', dueAmount:120000, paidAmount:120000, dueDate:'2024-05-05', paidDate:'2024-05-15', status:'delayed',  delayDays:10, penaltyCharged:2400 },
    { month:'2024-06', dueAmount:120000, paidAmount:120000, dueDate:'2024-06-05', paidDate:'2024-06-08', status:'delayed',  delayDays:3,  penaltyCharged:700 },
    { month:'2024-07', dueAmount:120000, paidAmount:120000, dueDate:'2024-07-05', paidDate:'2024-07-05', status:'on_time',  delayDays:0,  penaltyCharged:0 },
    { month:'2024-08', dueAmount:120000, paidAmount:120000, dueDate:'2024-08-05', paidDate:'2024-08-05', status:'on_time',  delayDays:0,  penaltyCharged:0 },
    { month:'2024-09', dueAmount:120000, paidAmount:100000, dueDate:'2024-09-05', paidDate:'2024-09-11', status:'partial',  delayDays:6,  penaltyCharged:1500 },
    { month:'2024-10', dueAmount:120000, paidAmount:120000, dueDate:'2024-10-05', paidDate:'2024-10-05', status:'on_time',  delayDays:0,  penaltyCharged:0 },
    { month:'2024-11', dueAmount:120000, paidAmount:120000, dueDate:'2024-11-05', paidDate:'2024-11-06', status:'on_time',  delayDays:1,  penaltyCharged:0 },
    { month:'2024-12', dueAmount:120000, paidAmount:120000, dueDate:'2024-12-05', paidDate:'2024-12-05', status:'on_time',  delayDays:0,  penaltyCharged:0 },
  ],
  credCheck: {
    cibilScore: 672, creditUtilization: 78, activeLoanCount: 3,
    recentInquiries: 4, dpd30: 3, dpd60: 2, dpd90: 1,
    gstMonthlyRevenue: [820000,790000,810000,750000,720000,680000,710000,730000,695000,700000,720000,740000],
    gstFilingDelays: 3, purchaseToSalesRatio: 0.72, inputOutputMismatch: 8.5,
    annualRevenue: 8800000, netProfitMargin: 6.2, debtToIncomeRatio: 1.8,
    balanceSheetStrength: 52, legalCaseCount: 1, epfoEmployeeCount: 24,
    epfoTrend: 'declining', directorRiskFlag: false, relatedPartyTransactions: 12,
    industryCode: 'ELEC_DIST', peerAverageCibil: 698, peerDefaultRate: 6.2,
  },
  digitap: {
    avgDailyBalance: 45000, transactionVelocity: 8.2, inflowOutflowRatio: 0.91,
    largeDebitFrequency: 6, cashWithdrawalFrequency: 9, failedTransactionRate: 4.5,
    upiTransactionTrend: 'decreasing', bankAccountCount: 3,
    loanSmsFrequency: 14, repaymentSmsSignals: 4,
    financeAppUsage: 'high', gamblingAppUsage: false,
    nightTimeTransactionRatio: 0.18, suddenExpenseSpike: true,
    expenseCategories: { inventory:55, operations:18, personal:15, loan_repayment:12 },
  },
  industry: {
    industryName: 'Electrical Goods Distribution', industryCode: 'ELEC_DIST',
    growthRate: -2.1, sectorRiskIndex: 68, governmentPolicyImpact: 'neutral',
    commodityPriceImpact: 'high', seasonalityImpact: 'medium',
    localityBusinessDensity: 'high', supplierConcentration: 62,
    customerConcentration: 48, marketVolatilityIndex: 72, peerPerformanceScore: 54,
  },
};

// ── LOAN 2: Healthier (FMCG Distributor) ──────────────────────────────────
const loan2 = {
  loan: {
    loanId: 'LN-2024-087',
    partnerId: 'CP-RAJESH-001',
    loanAmount: 1500000,
    disbursedDate: '2024-02-01',
    tenureMonths: 18,
    monthsElapsed: 10,
    emiAmount: 95000,
    outstandingPrincipal: 620000,
    interestRate: 13.0,
    loanType: 'working_capital',
  },
  repaymentHistory: [
    { month:'2024-03', dueAmount:95000, paidAmount:95000, dueDate:'2024-03-05', paidDate:'2024-03-04', status:'on_time', delayDays:0, penaltyCharged:0 },
    { month:'2024-04', dueAmount:95000, paidAmount:95000, dueDate:'2024-04-05', paidDate:'2024-04-05', status:'on_time', delayDays:0, penaltyCharged:0 },
    { month:'2024-05', dueAmount:95000, paidAmount:95000, dueDate:'2024-05-05', paidDate:'2024-05-03', status:'on_time', delayDays:0, penaltyCharged:0 },
    { month:'2024-06', dueAmount:95000, paidAmount:95000, dueDate:'2024-06-05', paidDate:'2024-06-07', status:'delayed', delayDays:2, penaltyCharged:400 },
    { month:'2024-07', dueAmount:95000, paidAmount:95000, dueDate:'2024-07-05', paidDate:'2024-07-05', status:'on_time', delayDays:0, penaltyCharged:0 },
    { month:'2024-08', dueAmount:95000, paidAmount:80000, dueDate:'2024-08-05', paidDate:'2024-08-09', status:'partial', delayDays:4, penaltyCharged:900 },
    { month:'2024-09', dueAmount:95000, paidAmount:95000, dueDate:'2024-09-05', paidDate:'2024-09-05', status:'on_time', delayDays:0, penaltyCharged:0 },
    { month:'2024-10', dueAmount:95000, paidAmount:95000, dueDate:'2024-10-05', paidDate:'2024-10-04', status:'on_time', delayDays:0, penaltyCharged:0 },
    { month:'2024-11', dueAmount:95000, paidAmount:95000, dueDate:'2024-11-05', paidDate:'2024-11-05', status:'on_time', delayDays:0, penaltyCharged:0 },
    { month:'2024-12', dueAmount:95000, paidAmount:95000, dueDate:'2024-12-05', paidDate:'2024-12-04', status:'on_time', delayDays:0, penaltyCharged:0 },
  ],
  credCheck: {
    cibilScore: 712, creditUtilization: 55, activeLoanCount: 2,
    recentInquiries: 1, dpd30: 1, dpd60: 0, dpd90: 0,
    gstMonthlyRevenue: [1100000,1150000,1080000,1200000,1180000,1220000,1190000,1240000,1260000,1280000,1300000,1320000],
    gstFilingDelays: 1, purchaseToSalesRatio: 0.68, inputOutputMismatch: 3.2,
    annualRevenue: 14400000, netProfitMargin: 8.4, debtToIncomeRatio: 1.1,
    balanceSheetStrength: 71, legalCaseCount: 0, epfoEmployeeCount: 38,
    epfoTrend: 'growing', directorRiskFlag: false, relatedPartyTransactions: 6,
    industryCode: 'FMCG_DIST', peerAverageCibil: 710, peerDefaultRate: 3.1,
  },
  digitap: {
    avgDailyBalance: 120000, transactionVelocity: 15.4, inflowOutflowRatio: 1.12,
    largeDebitFrequency: 3, cashWithdrawalFrequency: 4, failedTransactionRate: 1.2,
    upiTransactionTrend: 'increasing', bankAccountCount: 2,
    loanSmsFrequency: 6, repaymentSmsSignals: 9,
    financeAppUsage: 'medium', gamblingAppUsage: false,
    nightTimeTransactionRatio: 0.07, suddenExpenseSpike: false,
    expenseCategories: { inventory:65, operations:14, personal:10, loan_repayment:11 },
  },
  industry: {
    industryName: 'FMCG Distribution', industryCode: 'FMCG_DIST',
    growthRate: 7.8, sectorRiskIndex: 32, governmentPolicyImpact: 'positive',
    commodityPriceImpact: 'low', seasonalityImpact: 'low',
    localityBusinessDensity: 'high', supplierConcentration: 38,
    customerConcentration: 29, marketVolatilityIndex: 28, peerPerformanceScore: 76,
  },
};

const mockPartnerRequest = {
  partnerId: 'CP-RAJESH-001',
  loans: [loan1, loan2],
};

module.exports = { loan1, loan2, mockPartnerRequest };
