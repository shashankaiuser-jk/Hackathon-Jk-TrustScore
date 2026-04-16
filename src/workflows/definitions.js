// ─────────────────────────────────────────────────────────────────────────────
// src/workflows/definitions.js  —  35 Agentic Scoring Workflows
// Each workflow = reasoning path + parameter combo + risk hypothesis
// ─────────────────────────────────────────────────────────────────────────────

// Builder helper — wraps each workflow fn with error handling
function wf(id, name, category, fn) {
  return function(params) {
    try {
      const r = fn(params);
      return {
        workflowId: id, name, category,
        signal:      r.signal,
        scoreImpact: r.impact,
        confidence:  r.confidence,
        triggered:   r.signal !== 'neutral',
        reason:      r.reason,
        butterflyEffect: r.butterfly || null,
        ahaInsight:      r.aha     || null,
      };
    } catch(e) {
      return { workflowId:id, name, category, signal:'neutral',
               scoreImpact:0, confidence:0, triggered:false,
               reason:'Workflow evaluation error: ' + e.message };
    }
  };
}

const neutral = (reason) => ({ signal:'neutral', impact:0, confidence:0.3, reason });

// ═══════════════════ CATEGORY 1: REPAYMENT (6) ════════════════════════════

const WF_R01 = wf('WF-R01','Partial Payment → GST → Liability Chain','repayment', ({loan,financial}) => {
  if (loan.partialPaymentCount < 2) return neutral('Partial payment count too low to trigger.');
  const gstDown = financial.salesGrowthRate < -5;
  const highDTI = financial.debtToIncomeRatio > 1.5;
  if (!gstDown && !highDTI) return neutral('No GST/liability amplifier present.');
  return {
    signal:'high_risk', impact:-14, confidence:0.88,
    reason:`${loan.partialPaymentCount} partial payments + GST trend ${financial.salesGrowthRate.toFixed(1)}% + DTI ${financial.debtToIncomeRatio.toFixed(2)}x — compounding liquidity squeeze.`,
    butterfly:'Partial EMIs → penalty accumulation → GST revenue decline → liability chain → cascading default risk.',
  };
});

const WF_R02 = wf('WF-R02','Delay Frequency → Cash Flow → Expense Pressure','repayment', ({loan,financial,behavioral}) => {
  if (loan.delayFrequency <= 0.30) return neutral(`Delay frequency ${(loan.delayFrequency*100).toFixed(0)}% within range.`);
  const cfPressure = financial.cashFlowVolatility > 80000;
  const spike      = behavioral.suddenExpenseSpike;
  const sig        = (cfPressure && spike) ? 'high_risk' : 'medium_risk';
  return {
    signal:sig, impact: sig==='high_risk' ? -12 : -7, confidence:0.82,
    reason:`Delay freq ${(loan.delayFrequency*100).toFixed(0)}%, CF volatility ₹${Math.round(financial.cashFlowVolatility).toLocaleString()}, expense spike: ${spike?'YES':'no'}.`,
    butterfly: spike ? 'Cash outflows exceed inflows → delayed repayments → penalty loop → credit score erosion.' : null,
  };
});

const WF_R03 = wf('WF-R03','Missed EMI → SMS Pattern → Multi-Loan Stress','repayment', ({loan,behavioral,financial}) => {
  if (loan.missedPaymentCount < 1) return neutral('No missed EMIs.');
  const smsStress = behavioral.loanSmsFrequency > 10;
  const multiLoan = financial.numberOfActiveLoans >= 3;
  return {
    signal:'high_risk', impact: (multiLoan&&smsStress) ? -18 : -12, confidence:0.92,
    reason:`${loan.missedPaymentCount} missed EMI(s). SMS loan freq: ${behavioral.loanSmsFrequency}/mo. Active loans: ${financial.numberOfActiveLoans}.`,
    butterfly:'Missed EMI → lender escalation → borrower stress → partial payments elsewhere → systemic portfolio risk.',
  };
});

const WF_R04 = wf('WF-R04','Frequent Delays → Industry Slowdown Correlation','repayment', ({loan,contextual}) => {
  if (!(loan.delayFrequency > 0.25 && loan.avgDelayDays > 7 && contextual.industryGrowthRate < 0))
    return neutral('Delay-industry correlation not significant.');
  return {
    signal:'high_risk', impact:-11, confidence:0.79,
    reason:`Systematic delays (avg ${loan.avgDelayDays.toFixed(0)} days) correlate with industry decline ${contextual.industryGrowthRate.toFixed(1)}% — structural, not one-off.`,
    butterfly:'Industry contraction → revenue shortfall → systematic delays → sustained default trajectory.',
  };
});

const WF_R05 = wf('WF-R05','Recovery Signal: Improving Payment Trend','repayment', ({loan}) => {
  if (loan.missedPaymentCount===0 && loan.onTimePaymentRatio>0.75 && loan.avgDelayDays<5)
    return { signal:'positive', impact:+10, confidence:0.84,
      reason:`Strong discipline: ${(loan.onTimePaymentRatio*100).toFixed(0)}% on-time, avg delay ${loan.avgDelayDays.toFixed(1)}d, zero missed.` };
  return neutral('Repayment trend not fully healthy.');
});

const WF_R06 = wf('WF-R06','Penalty Escalation → Behavioral Anomaly','repayment', ({loan,behavioral}) => {
  if (loan.penaltyOccurrences < 4) return neutral(`${loan.penaltyOccurrences} penalties — acceptable.`);
  const night = behavioral.nightTimeTransactionRatio > 0.15;
  return {
    signal: night ? 'high_risk' : 'medium_risk', impact: night ? -9 : -5, confidence:0.73,
    reason:`${loan.penaltyOccurrences} penalty occurrences.${night?' Night txn ratio '+behavioral.nightTimeTransactionRatio.toFixed(2)+' — unusual fund movement pattern.':''}`,
    aha: night ? 'Penalty-heavy + night transactions = behavioural stress pattern linked to financial distress.' : null,
  };
});

// ═══════════════════ CATEGORY 2: FINANCIAL (6) ════════════════════════════

const WF_F01 = wf('WF-F01','Sales Drop vs Peer Trend','financial', ({financial,contextual}) => {
  if (financial.salesGrowthRate >= -3)
    return { signal:'positive', impact:+6, confidence:0.72, reason:`Sales at ${financial.salesGrowthRate.toFixed(1)}% — healthy trend.` };
  if (contextual.peerPerformanceScore > 60)
    return { signal:'high_risk', impact:-13, confidence:0.88,
      reason:`Sales ${financial.salesGrowthRate.toFixed(1)}% while peers score ${contextual.peerPerformanceScore}/100 — borrower-specific underperformance.`,
      aha:'Underperforming peers during expansion = operational/mgmt risk, not market-wide downturn.' };
  return { signal:'medium_risk', impact:-7, confidence:0.70,
    reason:`Sales ${financial.salesGrowthRate.toFixed(1)}% + weak peer performance ${contextual.peerPerformanceScore}/100 — market-wide pressure.` };
});

const WF_F02 = wf('WF-F02','High Purchase Ratio → Inventory Stress','financial', ({financial}) => {
  if (financial.purchaseVsSalesRatio <= 0.75) return neutral('P/S ratio normal.');
  const iom = financial.inputOutputMismatch > 7;
  return {
    signal: iom ? 'high_risk' : 'medium_risk', impact: iom ? -10 : -5, confidence:0.76,
    reason:`P/S ratio ${financial.purchaseVsSalesRatio.toFixed(2)}, IOM mismatch ${financial.inputOutputMismatch}% — possible inventory pile-up or GST irregularity.`,
    butterfly:'Inventory build + cash mismatch → slower collections → delayed EMIs.',
  };
});

const WF_F03 = wf('WF-F03','Cash Flow Volatility → Repayment Capacity','financial', ({financial,loan}) => {
  const hv = financial.cashFlowVolatility > 80000;
  const hd = financial.debtToIncomeRatio > 1.5;
  if (!hv && !hd) return { signal:'neutral', impact:+3, confidence:0.6, reason:'Cash flow stable, DTI manageable.' };
  if (hv && hd) return {
    signal:'high_risk', impact:-12, confidence:0.85,
    reason:`CF volatility ₹${Math.round(financial.cashFlowVolatility).toLocaleString()} + DTI ${financial.debtToIncomeRatio.toFixed(2)}x. Outstanding: ₹${loan.outstandingPrincipal.toLocaleString()}.`,
    butterfly:'Volatile CF + high debt → any revenue shock = immediate missed EMI.',
  };
  return { signal:'medium_risk', impact:-6, confidence:0.68,
    reason: hv ? `High CF volatility ₹${Math.round(financial.cashFlowVolatility).toLocaleString()}` : `High DTI ${financial.debtToIncomeRatio.toFixed(2)}x` };
});

const WF_F04 = wf('WF-F04','Credit Utilization + Active Loans → Overleverage','financial', ({financial}) => {
  const flags = [financial.creditUtilization>70, financial.numberOfActiveLoans>=3, financial.recentLoanInquiries>=3].filter(Boolean).length;
  if (flags < 2) return neutral('Credit leverage acceptable.');
  return {
    signal: flags===3 ? 'high_risk' : 'medium_risk', impact: flags===3 ? -15 : -8, confidence:0.87,
    reason:`Overleverage: util ${financial.creditUtilization}%, ${financial.numberOfActiveLoans} active loans, ${financial.recentLoanInquiries} recent inquiries.`,
    butterfly:'Debt-seeking under leverage → new obligations → cascading default on existing loans.',
  };
});

const WF_F05 = wf('WF-F05','Balance Sheet Strength → Risk Cushion','financial', ({financial}) => {
  if (financial.balanceSheetStrength > 65 && financial.profitMarginTrend==='improving')
    return { signal:'positive', impact:+12, confidence:0.84, reason:`BS ${financial.balanceSheetStrength}/100 + improving margins — strong repayment cushion.` };
  if (financial.balanceSheetStrength < 40)
    return { signal:'high_risk', impact:-10, confidence:0.81, reason:`Weak BS ${financial.balanceSheetStrength}/100 — limited shock absorption.` };
  return neutral(`Moderate BS ${financial.balanceSheetStrength}/100.`);
});

const WF_F06 = wf('WF-F06','EPFO Decline → Business Contraction Signal','financial', ({financial}) => {
  if (financial.epfoEmployeeTrend==='declining')
    return { signal:'medium_risk', impact:-7, confidence:0.74,
      reason:'EPFO headcount declining — business contraction or stress-driven workforce reduction.',
      aha:'EPFO data leads financial statement changes by 2-3 quarters. Headcount drop = earliest financial distress signal.' };
  if (financial.epfoEmployeeTrend==='growing')
    return { signal:'positive', impact:+5, confidence:0.72, reason:'Growing employee base — business expansion signal.' };
  return neutral('Stable EPFO employment.');
});

// ═══════════════════ CATEGORY 3: BEHAVIORAL (5) ═══════════════════════════

const WF_B01 = wf('WF-B01','Sudden Expense Spike → Liquidity Risk','behavioral', ({behavioral,loan}) => {
  if (!behavioral.suddenExpenseSpike) return neutral('No expense spike.');
  const lowBal  = behavioral.avgDailyBalance < 60000;
  const lowFlow = behavioral.inflowOutflowRatio < 1.0;
  return {
    signal: (lowBal&&lowFlow) ? 'high_risk' : 'medium_risk',
    impact: (lowBal&&lowFlow) ? -13 : -7, confidence:0.86,
    reason:`Expense spike. Balance: ₹${behavioral.avgDailyBalance.toLocaleString()}, I/O ratio: ${behavioral.inflowOutflowRatio.toFixed(2)}.`,
    butterfly:'Unexpected expense → balance depletion → EMI shortfall → missed payment → credit event.',
  };
});

const WF_B02 = wf('WF-B02','Multiple Bank Accounts → Fund Rotation Check','behavioral', ({behavioral}) => {
  if (behavioral.bankAccountCount < 3) return neutral('Normal account structure.');
  const cashHeavy = behavioral.cashWithdrawalFrequency > 7;
  return {
    signal: cashHeavy ? 'high_risk' : 'medium_risk', impact: cashHeavy ? -11 : -5, confidence:0.78,
    reason:`${behavioral.bankAccountCount} accounts + ${behavioral.cashWithdrawalFrequency} cash withdrawals/mo.`,
    aha:'Multi-account + high cash withdrawal = known pattern for masking real liquidity from lenders.',
  };
});

const WF_B03 = wf('WF-B03','Gambling App Usage → Behavioral Risk Flag','behavioral', ({behavioral}) => {
  if (!behavioral.gamblingAppUsage) return neutral('No risky app usage.');
  return {
    signal:'high_risk', impact:-15, confidence:0.90,
    reason:'Gambling app usage detected — unpredictable large cash outflows.',
    butterfly:'Gambling → irregular large debits → depleted balance → EMI failure.',
  };
});

const WF_B04 = wf('WF-B04','Inflow/Outflow Imbalance → Cash Crunch','behavioral', ({behavioral,loan}) => {
  if (behavioral.inflowOutflowRatio >= 0.95)
    return { signal:'positive', impact:+6, confidence:0.72, reason:`Healthy I/O ratio ${behavioral.inflowOutflowRatio.toFixed(2)}.` };
  const lowBal = behavioral.avgDailyBalance < loan.outstandingPrincipal * 0.08;
  return {
    signal: lowBal ? 'high_risk' : 'medium_risk', impact: lowBal ? -12 : -6, confidence:0.82,
    reason:`I/O ratio ${behavioral.inflowOutflowRatio.toFixed(2)} — spending > income. Balance ₹${behavioral.avgDailyBalance.toLocaleString()} vs outstanding ₹${loan.outstandingPrincipal.toLocaleString()}.`,
    butterfly:'Net outflows → shrinking liquidity → EMI failure risk in 30-60 days.',
  };
});

const WF_B05 = wf('WF-B05','UPI Growth + Finance App → Digital Health','behavioral', ({behavioral}) => {
  const pos = [behavioral.upiTransactionTrend==='increasing', behavioral.financeAppUsage==='high', behavioral.failedTransactionRate<2].filter(Boolean).length;
  if (pos >= 2) return { signal:'positive', impact:+8, confidence:0.76, reason:'Growing UPI + strong finance app + low failures — strong digital financial hygiene.' };
  if (behavioral.failedTransactionRate > 4) return { signal:'medium_risk', impact:-6, confidence:0.74, reason:`Failed txn rate ${behavioral.failedTransactionRate}% — liquidity friction signal.` };
  return neutral('Neutral digital behaviour.');
});

// ═══════════════════ CATEGORY 4: MULTI-LOAN (3) ════════════════════════════

const WF_M01 = wf('WF-M01','Single Bad Loan → Portfolio Contagion','multi_loan', ({loan,financial}) => {
  if (!(( loan.missedPaymentCount>=1 || loan.partialPaymentCount>=3) && financial.numberOfActiveLoans>=2))
    return neutral('No portfolio contagion risk.');
  return {
    signal:'high_risk', impact:-14, confidence:0.88,
    reason:`This loan's distress (${loan.missedPaymentCount} missed, ${loan.partialPaymentCount} partial) across ${financial.numberOfActiveLoans} active loans = portfolio-level risk.`,
    butterfly:'One distressed loan → lender confidence drop → credit line restriction → all loans affected → borrower liquidity crisis.',
  };
});

const WF_M02 = wf('WF-M02','Loan Overlap → Liquidity Pressure Sim','multi_loan', ({financial,behavioral,loan}) => {
  if (!(financial.numberOfActiveLoans>=3 && financial.creditUtilization>65)) return neutral('Loan overlap manageable.');
  const emi = loan.emiAmount || (loan.outstandingPrincipal * 0.05);
  const monthBuf = emi > 0 ? (behavioral.avgDailyBalance * 30) / emi : 99;
  return {
    signal: monthBuf < 2 ? 'high_risk' : 'medium_risk', impact: monthBuf < 2 ? -13 : -7, confidence:0.81,
    reason:`${financial.numberOfActiveLoans} active loans, ${financial.creditUtilization}% utilization. Monthly buffer: ${monthBuf.toFixed(1)}x EMI.`,
    butterfly:'Overlapping obligations → any CF disruption = simultaneous multi-loan default.',
  };
});

const WF_M03 = wf('WF-M03','Debt Stress Test: Total Obligation vs Revenue','multi_loan', ({financial}) => {
  const annualDebt = financial.debtToIncomeRatio * financial.gstMonthlySales * 12;
  const cov = (financial.gstMonthlySales * 12) / annualDebt;
  if (cov > 2) return { signal:'positive', impact:+7, confidence:0.78, reason:`Coverage ratio ${cov.toFixed(1)}x — strong obligation capacity.` };
  if (cov < 1.2) return { signal:'high_risk', impact:-14, confidence:0.86,
    reason:`Coverage ratio only ${cov.toFixed(1)}x — obligations near revenue ceiling.`,
    butterfly:'Near-zero coverage → any revenue dip = immediate default across all obligations.' };
  return { signal:'medium_risk', impact:-5, confidence:0.65, reason:`Moderate coverage ${cov.toFixed(1)}x.` };
});

// ═══════════════════ CATEGORY 5: CONTEXTUAL (3) ════════════════════════════

const WF_C01 = wf('WF-C01','Industry Decline → Adjusted Risk Ceiling','contextual', ({contextual}) => {
  if (contextual.industryGrowthRate < -1 && contextual.sectorRiskIndex > 60)
    return { signal:'high_risk', impact:-10, confidence:0.82,
      reason:`Industry growth ${contextual.industryGrowthRate.toFixed(1)}%, sector risk ${contextual.sectorRiskIndex}/100 — structural headwinds.`,
      butterfly:'Industry contraction → sector-wide credit tightening → peer defaults → lender risk aversion.' };
  if (contextual.industryGrowthRate > 5)
    return { signal:'positive', impact:+8, confidence:0.78, reason:`Strong industry tailwind at ${contextual.industryGrowthRate.toFixed(1)}%.` };
  return neutral('Industry performance neutral.');
});

const WF_C02 = wf('WF-C02','Peer Defaults → Systemic Risk Spread','contextual', ({contextual}) => {
  if (contextual.peerPerformanceScore >= 55) return neutral('Peer performance healthy.');
  const volatile = contextual.marketVolatilityIndex > 65;
  return {
    signal: volatile ? 'high_risk' : 'medium_risk', impact: volatile ? -9 : -5, confidence:0.76,
    reason:`Peer score ${contextual.peerPerformanceScore}/100, market volatility ${contextual.marketVolatilityIndex}/100 — systemic stress in borrower's network.`,
    butterfly:'Peer defaults → supply chain disruption → inventory build → cash flow stress.',
  };
});

const WF_C03 = wf('WF-C03','Government Policy + Commodity Impact','contextual', ({contextual}) => {
  if (contextual.governmentPolicyImpact==='positive' && contextual.commodityPriceImpact!=='high')
    return { signal:'positive', impact:+7, confidence:0.74, reason:'Favourable policy + manageable commodity prices — regulatory tailwind.' };
  if (contextual.governmentPolicyImpact!=='positive' && contextual.commodityPriceImpact==='high')
    return { signal:'medium_risk', impact:-8, confidence:0.72,
      reason:'Neutral/negative policy + high commodity impact — margin compression risk.',
      butterfly:'Rising input costs → margin squeeze → working capital shortage → delayed repayments.' };
  return neutral('Mixed policy/commodity environment.');
});

// ═══════════════════ CATEGORY 6: BUTTERFLY EFFECT (4) ═════════════════════

const WF_BE01 = wf('WF-BE01','Partial EMI → 90-Day Liquidity Stress Chain','butterfly', ({loan,behavioral}) => {
  if (loan.partialPaymentCount < 2) return neutral('Insufficient partials to trigger butterfly.');
  const emi = loan.emiAmount || (loan.outstandingPrincipal * 0.05);
  const monthlyBurn = emi * 0.04;
  const bufDays = monthlyBurn > 0 ? (behavioral.avgDailyBalance / monthlyBurn) * 30 : 999;
  return {
    signal: bufDays < 45 ? 'high_risk' : 'medium_risk', impact: bufDays < 45 ? -16 : -9, confidence:0.87,
    reason:`${loan.partialPaymentCount} partials + ~${Math.round(bufDays)} days liquidity buffer at current burn rate.`,
    butterfly:`Partial EMIs → penalties ₹${(loan.partialPaymentCount*2500).toLocaleString()} → credit score drop → lender review → line called → acute crisis.`,
  };
});

const WF_BE02 = wf('WF-BE02','Expense Spike → Repayment Failure Cascade','butterfly', ({behavioral,loan}) => {
  if (!behavioral.suddenExpenseSpike) return neutral('No expense spike.');
  const cov = (behavioral.avgDailyBalance * 30) / loan.emiAmount;
  return {
    signal: cov < 1.5 ? 'high_risk' : 'medium_risk', impact: cov < 1.5 ? -14 : -7, confidence:0.84,
    reason:`Expense spike. EMI coverage: ${cov.toFixed(1)}x (${cov < 1.5 ? 'CRITICAL' : 'WARNING'}).`,
    butterfly:`Expense spike → balance ₹${behavioral.avgDailyBalance.toLocaleString()} → EMI ₹${loan.emiAmount.toLocaleString()} → ${cov < 1.5 ? 'INSUFFICIENT BUFFER' : 'thin buffer'} → partial/missed payment.`,
  };
});

const WF_BE03 = wf('WF-BE03','New Loan Liability Chain','butterfly', ({financial,loan}) => {
  if (!(financial.recentLoanInquiries>=3 && loan.delayFrequency>0.25)) return neutral('No new liability chain risk.');
  return {
    signal:'high_risk', impact:-12, confidence:0.83,
    reason:`${financial.recentLoanInquiries} recent inquiries while current loan has ${(loan.delayFrequency*100).toFixed(0)}% delay rate — debt-seeking under stress.`,
    butterfly:'Credit-seeking under stress → new loan → increased obligation → existing loan defaults → compounding insolvency.',
    aha:'Borrowers seeking new credit while existing loans are stressed have 3x higher default probability within 6 months.',
  };
});

const WF_BE04 = wf('WF-BE04','Supplier Concentration → Revenue Disruption','butterfly', ({contextual,financial}) => {
  const sRisk = contextual.supplierConcentration > 55;
  const cRisk = contextual.customerConcentration > 45;
  if (!sRisk && !cRisk) return neutral('Supply/customer chain diversified.');
  return {
    signal: (sRisk&&cRisk) ? 'high_risk' : 'medium_risk',
    impact: (sRisk&&cRisk&&financial.salesGrowthRate<0) ? -11 : -5, confidence:0.77,
    reason:`Supplier conc: ${contextual.supplierConcentration}%, Customer conc: ${contextual.customerConcentration}% — single-point-of-failure risk.`,
    butterfly:'Concentrated supply/demand → any disruption = immediate revenue shock → cash collapse → loan default.',
  };
});

// ═══════════════════ CATEGORY 7: COMBINED INTELLIGENCE (4) ════════════════

const WF_CI01 = wf('WF-CI01','GST Drop + High Expenses = Double Stress','combined', ({financial,behavioral}) => {
  if (!(financial.salesGrowthRate < -5 && (behavioral.suddenExpenseSpike || behavioral.largeDebitFrequency>5)))
    return neutral('No combined GST-expense signal.');
  return {
    signal:'high_risk', impact:-16, confidence:0.91,
    reason:`Double stress: GST declining ${financial.salesGrowthRate.toFixed(1)}% + elevated expenses — income contracting while costs expand.`,
    butterfly:'Revenue compression + cost expansion = negative working capital → repayment failure.',
    aha:'GST decline + expense spike combo is 5x more predictive of default than either signal alone.',
  };
});

const WF_CI02 = wf('WF-CI02','Good Repayment + Bad Industry = Resilient Operator','combined', ({loan,contextual}) => {
  if (loan.onTimePaymentRatio > 0.75 && loan.missedPaymentCount===0 && contextual.industryGrowthRate < 0)
    return { signal:'low_risk', impact:+3, confidence:0.76,
      reason:`${(loan.onTimePaymentRatio*100).toFixed(0)}% on-time despite industry at ${contextual.industryGrowthRate.toFixed(1)}% — resilient operator.`,
      aha:'Outperforming industry during downturn suggests competitive moat or superior management — upgrade signal.' };
  return neutral('Repayment-industry combo neutral.');
});

const WF_CI03 = wf('WF-CI03','Poor Repayment + Strong Growth = Diversion Anomaly','combined', ({loan,financial}) => {
  if (!((loan.onTimePaymentRatio<0.6||loan.missedPaymentCount>=1) && financial.salesGrowthRate>8))
    return neutral('No diversion anomaly detected.');
  return {
    signal:'medium_risk', impact:-8, confidence:0.83,
    reason:`ANOMALY: Poor repayment despite ${financial.salesGrowthRate.toFixed(1)}% sales growth — funds may be diverted.`,
    aha:'Growing revenue + poor EMI repayment = classic fund diversion signal. Financial statements may not reflect true cash position.',
  };
});

const WF_CI04 = wf('WF-CI04','High Inflow + No Repayment = Misuse Signal','combined', ({behavioral,loan}) => {
  if (!(behavioral.inflowOutflowRatio>1.1 && behavioral.avgDailyBalance>100000 && (loan.onTimePaymentRatio<0.65||loan.missedPaymentCount>=1)))
    return neutral('No misuse pattern.');
  return {
    signal:'high_risk', impact:-18, confidence:0.90,
    reason:`CRITICAL: Strong inflows (ratio ${behavioral.inflowOutflowRatio.toFixed(2)}, bal ₹${behavioral.avgDailyBalance.toLocaleString()}) with poor repayment — deliberate fund diversion.`,
    aha:'Cash available but EMIs missed = highest-risk signal. Likely routing loan funds to alternate use.',
  };
});

// ═══════════════════ CATEGORY 8: ADVANCED TREND (4) ═══════════════════════

const WF_A01 = wf('WF-A01','Overall Trend Improving → Recovery Signal','advanced', ({loan,financial,behavioral}) => {
  const sigs = [loan.onTimePaymentRatio>0.8, financial.salesGrowthRate>3, behavioral.avgDailyBalance>80000].filter(Boolean).length;
  if (sigs >= 2) return { signal:'positive', impact:+9, confidence:0.80,
    reason:`Recovery trend: ${sigs}/3 positive signals — repayment, revenue, balance all moving right.` };
  return neutral('Insufficient recovery signals.');
});

const WF_A02 = wf('WF-A02','Trend Worsening → Early Warning Trigger','advanced', ({loan,financial,behavioral}) => {
  const warns = [loan.delayFrequency>0.4, financial.salesGrowthRate < -3, (behavioral.avgDailyBalance<50000&&behavioral.inflowOutflowRatio<1)].filter(Boolean).length;
  if (warns >= 2) return {
    signal:'high_risk', impact:-13, confidence:0.86,
    reason:`Multi-dimensional deterioration: ${warns}/3 warning signals. Pre-default trajectory pattern.`,
    butterfly:'Converging deterioration → accelerating credit risk → recommend immediate borrower engagement.',
  };
  return neutral('No convergent worsening trend.');
});

const WF_A03 = wf('WF-A03','Behavioral Stability → Trust Amplifier','advanced', ({behavioral,loan}) => {
  const stable = behavioral.inflowOutflowRatio>=1.0 && behavioral.inflowOutflowRatio<=1.3;
  const lowFail = behavioral.failedTransactionRate < 2;
  const goodPay = loan.onTimePaymentRatio > 0.8;
  if (stable && lowFail && goodPay)
    return { signal:'positive', impact:+8, confidence:0.82, reason:'Stable CF + low failures + strong repayment — trust-amplifying pattern.' };
  if (behavioral.failedTransactionRate > 5 || behavioral.inflowOutflowRatio < 0.85)
    return { signal:'medium_risk', impact:-7, confidence:0.75,
      reason:`Instability: ${behavioral.failedTransactionRate}% failed txns, I/O ratio ${behavioral.inflowOutflowRatio.toFixed(2)}.` };
  return neutral('Behaviour within normal range.');
});

const WF_A04 = wf('WF-A04','Legal + Director Risk → Governance Flag','advanced', ({financial}) => {
  if (financial.legalCaseCount === 0 && !financial.directorRiskSignals)
    return { signal:'positive', impact:+4, confidence:0.72, reason:'Clean governance — no legal cases or director concerns.' };
  const both = financial.legalCaseCount >= 1 && financial.directorRiskSignals;
  return {
    signal: both ? 'high_risk' : 'medium_risk', impact: both ? -14 : -7, confidence:0.85,
    reason:`Governance risk: ${financial.legalCaseCount} legal case(s)${financial.directorRiskSignals?', director flag raised':''}.`,
    aha:'Legal + director risk flags have 4x correlation with default within 12 months.',
  };
});

// ── Export all 35 workflows ───────────────────────────────────────────────
const ALL_WORKFLOWS = [
  WF_R01,WF_R02,WF_R03,WF_R04,WF_R05,WF_R06,
  WF_F01,WF_F02,WF_F03,WF_F04,WF_F05,WF_F06,
  WF_B01,WF_B02,WF_B03,WF_B04,WF_B05,
  WF_M01,WF_M02,WF_M03,
  WF_C01,WF_C02,WF_C03,
  WF_BE01,WF_BE02,WF_BE03,WF_BE04,
  WF_CI01,WF_CI02,WF_CI03,WF_CI04,
  WF_A01,WF_A02,WF_A03,WF_A04,
];

module.exports = { ALL_WORKFLOWS };
