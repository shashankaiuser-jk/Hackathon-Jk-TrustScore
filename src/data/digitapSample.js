// ─────────────────────────────────────────────────────────────────────────────
// src/data/digitapSample.js  —  Real-structure Digitap data for LN-2023-001
// Mirrors actual Digitap API response: bank accounts, transactions, SMS, apps
// ─────────────────────────────────────────────────────────────────────────────

const digitapRealData = {
  requestId: 'DTP-REQ-20241215-001',
  borrowerId: 'BRW-RAJESH-001',
  analysisWindow: { fromDate: '2024-09-15', toDate: '2024-12-15', days: 91 },

  // ── Bank Accounts ─────────────────────────────────────────────────────────
  bankAccounts: [
    {
      accountId: 'ACC-001',
      bank: 'HDFC Bank',
      accountType: 'current',
      accountNumber: 'XXXX1234',
      ifsc: 'HDFC0001234',
      isPrimary: true,
      openedDate: '2019-03-12',
      linkedLoans: ['LN-2023-001'],
      monthlyStats: [
        { month: '2024-09', openingBalance: 82000, closingBalance: 41000, totalCredits: 395000, totalDebits: 436000, avgDailyBalance: 52000, minBalance: 8200,  maxBalance: 125000, transactionCount: 68 },
        { month: '2024-10', openingBalance: 41000, closingBalance: 68000, totalCredits: 512000, totalDebits: 485000, avgDailyBalance: 55000, minBalance: 12000, maxBalance: 148000, transactionCount: 72 },
        { month: '2024-11', openingBalance: 68000, closingBalance: 29000, totalCredits: 341000, totalDebits: 380000, avgDailyBalance: 44000, minBalance: 5100,  maxBalance: 98000,  transactionCount: 61 },
        { month: '2024-12', openingBalance: 29000, closingBalance: 18000, totalCredits: 280000, totalDebits: 291000, avgDailyBalance: 23000, minBalance: 1800,  maxBalance: 87000,  transactionCount: 54 },
      ],
    },
    {
      accountId: 'ACC-002',
      bank: 'Axis Bank',
      accountType: 'savings',
      accountNumber: 'XXXX5678',
      ifsc: 'UTIB0002345',
      isPrimary: false,
      openedDate: '2021-07-20',
      linkedLoans: [],
      monthlyStats: [
        { month: '2024-09', openingBalance: 18000, closingBalance: 9000,  totalCredits: 95000,  totalDebits: 104000, avgDailyBalance: 13500, minBalance: 2100, maxBalance: 42000, transactionCount: 29 },
        { month: '2024-10', openingBalance: 9000,  closingBalance: 14000, totalCredits: 88000,  totalDebits: 83000,  avgDailyBalance: 11000, minBalance: 3200, maxBalance: 38000, transactionCount: 31 },
        { month: '2024-11', openingBalance: 14000, closingBalance: 6000,  totalCredits: 72000,  totalDebits: 80000,  avgDailyBalance: 9500,  minBalance: 1200, maxBalance: 31000, transactionCount: 24 },
        { month: '2024-12', openingBalance: 6000,  closingBalance: 3200,  totalCredits: 51000,  totalDebits: 53800,  avgDailyBalance: 4800,  minBalance: 800,  maxBalance: 22000, transactionCount: 19 },
      ],
    },
    {
      accountId: 'ACC-003',
      bank: 'Kotak Mahindra Bank',
      accountType: 'current',
      accountNumber: 'XXXX9012',
      ifsc: 'KKBK0003456',
      isPrimary: false,
      openedDate: '2022-11-05',
      linkedLoans: [],
      monthlyStats: [
        { month: '2024-09', openingBalance: 5000,  closingBalance: 3200,  totalCredits: 62000,  totalDebits: 63800,  avgDailyBalance: 4200,  minBalance: 500,  maxBalance: 19000, transactionCount: 18 },
        { month: '2024-10', openingBalance: 3200,  closingBalance: 8100,  totalCredits: 78000,  totalDebits: 73100,  avgDailyBalance: 5800,  minBalance: 900,  maxBalance: 24000, transactionCount: 22 },
        { month: '2024-11', openingBalance: 8100,  closingBalance: 2400,  totalCredits: 45000,  totalDebits: 50700,  avgDailyBalance: 3900,  minBalance: 200,  maxBalance: 16000, transactionCount: 15 },
        { month: '2024-12', openingBalance: 2400,  closingBalance: 1100,  totalCredits: 32000,  totalDebits: 33300,  avgDailyBalance: 1900,  minBalance: 0,    maxBalance: 12000, transactionCount: 11 },
      ],
    },
  ],

  // ── Transaction Detail (sample of key transactions) ───────────────────────
  transactions: [
    // Sep — still operational, reasonable flow
    { date: '2024-09-02', accountId: 'ACC-001', type: 'credit', amount: 280000, category: 'business_inflow',     description: 'NEFT CR-CUSTOMER PAYMENT ELEC GOODS', mode: 'neft' },
    { date: '2024-09-05', accountId: 'ACC-001', type: 'debit',  amount: 120000, category: 'loan_repayment',      description: 'EMI-HDFC LOAN LN-2023-001 AUTO DEBIT',mode: 'nach' },
    { date: '2024-09-07', accountId: 'ACC-001', type: 'debit',  amount: 95000,  category: 'supplier_payment',    description: 'RTGS DR-ABC ELECTRICAL SUPPLIERS', mode: 'rtgs' },
    { date: '2024-09-10', accountId: 'ACC-001', type: 'debit',  amount: 45000,  category: 'cash_withdrawal',     description: 'ATM WDL CASH', mode: 'atm' },
    { date: '2024-09-12', accountId: 'ACC-001', type: 'credit', amount: 115000, category: 'business_inflow',     description: 'UPI CR-RETAILER PAYMENT', mode: 'upi' },
    { date: '2024-09-18', accountId: 'ACC-001', type: 'debit',  amount: 38000,  category: 'operating_expense',   description: 'NEFT DR-RENT PAYMENT WAREHOUSE', mode: 'neft' },
    { date: '2024-09-22', accountId: 'ACC-002', type: 'debit',  amount: 52000,  category: 'inter_account',       description: 'IMPS TR TO ACC-003', mode: 'imps' },
    { date: '2024-09-25', accountId: 'ACC-001', type: 'debit',  amount: 28000,  category: 'personal_expense',    description: 'UPI DR-MEDICAL HOSPITAL PAYMENT', mode: 'upi' },
    { date: '2024-09-28', accountId: 'ACC-001', type: 'debit',  amount: 25000,  category: 'cash_withdrawal',     description: 'ATM WDL CASH 11:45PM', mode: 'atm', hour: 23 },
    // Oct — business picking up but EMI stress starting
    { date: '2024-10-03', accountId: 'ACC-001', type: 'credit', amount: 320000, category: 'business_inflow',     description: 'NEFT CR-BULK ORDER PAYMENT', mode: 'neft' },
    { date: '2024-10-05', accountId: 'ACC-001', type: 'debit',  amount: 120000, category: 'loan_repayment',      description: 'EMI-HDFC LOAN LN-2023-001 AUTO DEBIT',mode: 'nach' },
    { date: '2024-10-05', accountId: 'ACC-001', type: 'debit',  amount: 42000,  category: 'loan_repayment',      description: 'EMI-KOTAK LOAN AUTO DEBIT', mode: 'nach' },
    { date: '2024-10-08', accountId: 'ACC-001', type: 'debit',  amount: 110000, category: 'supplier_payment',    description: 'RTGS DR-SUPPLIERS PAYMENT OCT STOCK', mode: 'rtgs' },
    { date: '2024-10-15', accountId: 'ACC-001', type: 'debit',  amount: 55000,  category: 'cash_withdrawal',     description: 'ATM WDL CASH', mode: 'atm' },
    { date: '2024-10-19', accountId: 'ACC-001', type: 'credit', amount: 192000, category: 'business_inflow',     description: 'UPI CR-CUSTOMER COLLECTION', mode: 'upi' },
    { date: '2024-10-22', accountId: 'ACC-001', type: 'debit',  amount: 85000,  category: 'loan_repayment',      description: 'IMPS PERSONAL LOAN REPAYMENT FINTECH APP', mode: 'imps' },
    { date: '2024-10-25', accountId: 'ACC-001', type: 'debit',  amount: 32000,  category: 'personal_expense',    description: 'UPI DR-CREDIT CARD BILL PAYMENT', mode: 'upi' },
    { date: '2024-10-29', accountId: 'ACC-001', type: 'debit',  amount: 40000,  category: 'cash_withdrawal',     description: 'ATM WDL CASH 12:15AM', mode: 'atm', hour: 0 },
    // Nov — deterioration visible
    { date: '2024-11-04', accountId: 'ACC-001', type: 'credit', amount: 195000, category: 'business_inflow',     description: 'NEFT CR-CUSTOMER PAYMENT (REDUCED)', mode: 'neft' },
    { date: '2024-11-05', accountId: 'ACC-001', type: 'debit',  amount: 120000, category: 'loan_repayment',      description: 'EMI-HDFC LOAN LN-2023-001 PARTIAL 85000', mode: 'nach', partialAmount: 85000 },
    { date: '2024-11-08', accountId: 'ACC-001', type: 'debit',  amount: 75000,  category: 'supplier_payment',    description: 'NEFT DR-SUPPLIER PART PAYMENT', mode: 'neft' },
    { date: '2024-11-11', accountId: 'ACC-001', type: 'debit',  amount: 38000,  category: 'cash_withdrawal',     description: 'ATM WDL CASH 10:30PM', mode: 'atm', hour: 22 },
    { date: '2024-11-14', accountId: 'ACC-001', type: 'credit', amount: 146000, category: 'business_inflow',     description: 'UPI CR-RETAILER COLLECTION', mode: 'upi' },
    { date: '2024-11-18', accountId: 'ACC-002', type: 'credit', amount: 72000,  category: 'inter_account',       description: 'IMPS TR FROM ACC-003 (CONSOLIDATION)', mode: 'imps' },
    { date: '2024-11-20', accountId: 'ACC-001', type: 'debit',  amount: 65000,  category: 'loan_repayment',      description: 'IMPS LOAN APP REPAYMENT FINTECHAPP2', mode: 'imps' },
    { date: '2024-11-25', accountId: 'ACC-001', type: 'debit',  amount: 22000,  category: 'cash_withdrawal',     description: 'ATM WDL CASH 11:00PM', mode: 'atm', hour: 23 },
    { date: '2024-11-28', accountId: 'ACC-001', type: 'debit',  amount: 18000,  category: 'failed_retry',        description: 'FAILED NACH RETRY PENALTY FEE', mode: 'nach', failed: true },
    // Dec — critical stress
    { date: '2024-12-01', accountId: 'ACC-001', type: 'credit', amount: 142000, category: 'business_inflow',     description: 'NEFT CR-CUSTOMER PARTIAL PAYMENT', mode: 'neft' },
    { date: '2024-12-05', accountId: 'ACC-001', type: 'debit',  amount: 120000, category: 'loan_repayment',      description: 'EMI-HDFC LOAN LN-2023-001 BOUNCE RETRY', mode: 'nach', bounced: true },
    { date: '2024-12-05', accountId: 'ACC-001', type: 'debit',  amount: 500,    category: 'penalty',             description: 'BOUNCE CHARGE EMI DISHONOUR', mode: 'charge' },
    { date: '2024-12-08', accountId: 'ACC-001', type: 'debit',  amount: 62000,  category: 'supplier_payment',    description: 'NEFT DR-URGENT SUPPLIER PAYMENT', mode: 'neft' },
    { date: '2024-12-10', accountId: 'ACC-001', type: 'debit',  amount: 30000,  category: 'cash_withdrawal',     description: 'ATM WDL CASH 11:45PM', mode: 'atm', hour: 23 },
    { date: '2024-12-12', accountId: 'ACC-001', type: 'credit', amount: 138000, category: 'business_inflow',     description: 'IMPS CR-EMERGENCY COLLECTION', mode: 'imps' },
    { date: '2024-12-14', accountId: 'ACC-001', type: 'debit',  amount: 55000,  category: 'loan_repayment',      description: 'IMPS LOAN REPAYMENT NAVI APP', mode: 'imps' },
    { date: '2024-12-15', accountId: 'ACC-001', type: 'debit',  amount: 28000,  category: 'personal_expense',    description: 'UPI DR-HOUSEHOLD EXPENSE SPIKE', mode: 'upi' },
  ],

  // ── Inflow/Outflow 30d vs 90d Comparison ─────────────────────────────────
  velocityTrends: {
    last30Days: {
      totalInflow: 280000, totalOutflow: 291000,
      avgDailyInflow: 9333, avgDailyOutflow: 9700,
      transactionCount: 54, inflowOutflowRatio: 0.962,
    },
    last60Days: {
      totalInflow: 621000, totalOutflow: 671000,
      avgDailyInflow: 10350, avgDailyOutflow: 11183,
      transactionCount: 115, inflowOutflowRatio: 0.925,
    },
    last90Days: {
      totalInflow: 1015000, totalOutflow: 1055000,
      avgDailyInflow: 11278, avgDailyOutflow: 11722,
      transactionCount: 177, inflowOutflowRatio: 0.962,
    },
    velocityChange30vs90: -17.2,  // % change in daily inflow rate 30d vs 90d average
    debitCreditGap: -40000,        // net deficit over 90 days across all accounts
  },

  // ── Balance Stress Signals ────────────────────────────────────────────────
  balanceStress: {
    minBalanceDipCount: 8,           // times balance < ₹5000 across all accounts
    negativeSurplusCount: 3,         // months with outflow > inflow
    eodBalanceTrend: 'declining',    // end-of-day balance trend over 90d
    avgEodBalance: { sep: 52000, oct: 55000, nov: 44000, dec: 23000 },
    balanceDropRate: -55.8,          // % drop from Sep to Dec
    criticalDays: 6,                 // days with balance < ₹2000
  },

  // ── Cash Withdrawal Analysis ──────────────────────────────────────────────
  cashWithdrawals: {
    totalWithdrawals: 9,
    totalAmount: 335000,
    nightTimeWithdrawals: 5,         // between 10pm–3am
    avgWithdrawalAmount: 37222,
    largeWithdrawals: 3,             // > ₹40,000
    frequencyTrend: 'increasing',
    nightWithdrawalRatio: 0.556,
  },

  // ── Multi-Bank Usage Patterns ─────────────────────────────────────────────
  multiBankBehavior: {
    totalActiveAccounts: 3,
    primaryBankConcentration: 0.72,  // % of total txn volume through primary
    interAccountTransfers: 6,         // fund shuffling across accounts
    newAccountOpenedLast6Months: 1,  // Kotak opened Nov 2022 (within earlier window)
    multiBankLoanRepayments: 2,      // EMI debits from multiple banks
    accountConsolidationSignal: true, // funds being merged from other accounts
  },

  // ── Credit Card Stress ─────────────────────────────────────────────────────
  creditCardSignals: {
    creditCardBillPayments: 3,
    avgCreditCardBillAmount: 32000,
    creditCardUtilizationSignal: 'high',
    missedCreditCardPayment: 0,
    minimumPaymentOnly: 1,           // paid only minimum due once
    creditCardInquiries: 2,          // credit card new applications
  },

  // ── SMS Analysis ──────────────────────────────────────────────────────────
  smsSignals: {
    totalLoanRelatedSms: 47,
    analysisWindow: 90,
    smsBreakdown: {
      emiReminders: 18,
      missedPaymentAlerts: 4,
      penaltyNotices: 5,
      loanApprovalOffers: 8,
      repaymentConfirmations: 7,
      collectionCalls: 5,
    },
    lenderNames: ['HDFC Bank', 'Kotak Mahindra', 'MoneyTap', 'Navi', 'KreditBee'],
    emiReminderFrequency: 'high',
    collectionCallsLast30Days: 3,
    newLoanOfferAcceptances: 1,       // accepted 1 new fintech loan in last 90d
    loanSmsPerMonth: [14, 17, 16],    // Sep, Oct, Nov monthly SMS counts
    repaymentSmsSignals: 4,
    stressEscalationTrend: 'worsening',
  },

  // ── App Usage Patterns ────────────────────────────────────────────────────
  appUsageSignals: {
    financeAppsInstalled: ['HDFC NetBanking', 'Kotak 811', 'MoneyTap', 'KreditBee', 'Navi', 'CRED', 'BankBazaar'],
    loanAppsCount: 4,                 // MoneyTap, KreditBee, Navi, BankBazaar
    loanAppUsageFrequency: 'high',    // daily active use of 2+ loan apps
    gamblingAppsDetected: false,
    tradingAppsInstalled: ['Groww'],
    tradingAppActivity: 'low',        // minimal trading activity
    upiAppsUsed: ['GPay', 'PhonePe', 'BHIM'],
    emiCalculatorSearches: 12,        // browser searches for "EMI calculator", "loan refinance"
    creditScoreChecks: 4,             // CIBIL/Experian app checks in 90 days
    debtConsolidationSearches: 3,
    financialStressAppBehavior: true, // pattern: using multiple apps to manage debt
  },

  // ── UPI Transaction Trends ────────────────────────────────────────────────
  upiAnalysis: {
    totalUpiTransactions: { sep: 28, oct: 32, nov: 25, dec: 18 },
    upiInflowTrend: 'decreasing',
    upiOutflowTrend: 'stable',
    upiFailedTransactions: { sep: 2, oct: 3, nov: 4, dec: 5 },
    upiFailedRate: { sep: 0.071, oct: 0.094, nov: 0.16, dec: 0.278 },  // rising failure rate
    largeUpiTransactions: 7,         // UPI transactions > ₹20,000
  },

  // ── Failed/Bounce Transactions ────────────────────────────────────────────
  failedTransactions: {
    totalFailed: 14,
    totalBounced: 2,
    failedNachCount: 1,
    failedUpiCount: 9,
    returnedCheques: 0,
    penaltiesFromBounce: 500,
    failedTransactionRate: 4.5,      // % of total transactions
    trendLast30Days: 'increasing',
    failedRateTrend: [1.2, 2.8, 4.1, 6.5], // monthly trend Sep-Dec
  },

  // ── Expense Pattern Analysis ──────────────────────────────────────────────
  expensePatterns: {
    categoryBreakdown: {
      supplier_payment: 0.38,
      loan_repayment: 0.29,      // unusually high loan repayment share
      cash_withdrawal: 0.15,
      operating_expense: 0.09,
      personal_expense: 0.07,
      penalty_charges: 0.02,
    },
    loanRepaymentExpenseShare: 0.29,  // >25% is a stress signal
    cashWithdrawalExpenseShare: 0.15,
    unusualExpenseCategories: ['penalty_charges', 'failed_retry'],
    suddenExpenseSpike: true,
    expenseSpikeMonth: '2024-12',
    expenseSpikeAmount: 55000,        // sudden household expense spike in Dec
  },

  // ── Derived Summary Signals (pre-computed for intelligence layer) ─────────
  derivedSignals: {
    transactionVelocity30d: 54,
    transactionVelocity90d: 177,
    velocityDrop30vs90: -38.8,        // % fewer transactions in last 30d vs daily avg of 90d

    avgDailyBalance90d: 33000,
    avgDailyBalance30d: 23000,
    balanceTrend: 'declining',

    inflowOutflowRatio30d: 0.962,
    inflowOutflowRatio90d: 0.962,
    ioRatioTrend: 'deteriorating',    // moved from 1.08 in Jul to 0.96 in Dec

    multiBankSpreading: true,         // active use of 3 banks
    loanRepaymentPressure: 'high',    // >25% of outflows to loan repayments
    nightTransactionRatio: 0.226,     // 5 of 22 significant transactions are night-time
    cashWithdrawalTrend: 'increasing',

    creditCardStress: 'medium',
    loanAppDependency: 'high',        // using 4 loan apps actively

    emiBouncedLast90Days: 1,
    emiPartialLast90Days: 2,
    collectionCallsLast30Days: 3,
    newLoansTakenLast90Days: 1,

    thinFileBorrower: false,          // has bureau data
    cibilAvailable: true,
  },
};

module.exports = { digitapRealData };
