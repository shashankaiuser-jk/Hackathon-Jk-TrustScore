// ─────────────────────────────────────────────────────────────────────────────
// src/intelligence/butterflyEngine.js
// Generates causal butterfly-effect cascade chains from Digitap + loan + financial data
// Returns: Array of { chain[], trigger, severity, probability, impact, timeHorizon }
// ─────────────────────────────────────────────────────────────────────────────

const SEVERITY = { CRITICAL: 'critical', HIGH: 'high', MEDIUM: 'medium', LOW: 'low' };
const HORIZON  = { IMMEDIATE: '0-30 days', SHORT: '30-60 days', MEDIUM: '60-90 days', LONG: '90+ days' };

/**
 * Generate all relevant butterfly chains for this borrower.
 * Each chain is a causal sequence: trigger → event1 → event2 → … → terminal_outcome
 */
function generateButterflyChains(signals, loanParams, financialParams, contextualParams) {
  const chains = [];

  const s  = signals;
  const lp = loanParams       || {};
  const fp = financialParams  || {};
  const cp = contextualParams || {};

  // ── Chain 1: Partial EMI → Penalty Spiral ────────────────────────────────
  if (lp.partialPaymentCount >= 2 || s.emiPartial >= 2) {
    chains.push({
      trigger:     'Repeated partial EMI payments',
      severity:    SEVERITY.CRITICAL,
      probability: 0.82,
      timeHorizon: HORIZON.SHORT,
      impact:      'Default classification + credit bureau deterioration + lender recall',
      chain: [
        `Partial EMI payments (${lp.partialPaymentCount || s.emiPartial} instances) — shortfall accumulating`,
        'Penalty charges compound on unpaid principal (₹2,000–₹4,500/month per incident)',
        'Lender marks account as SMA-1 (30 dpd) → credit bureau updated → CIBIL score drops',
        'New credit applications rejected or pricing up → refinancing option closes',
        'Cash flow already stretched — next full EMI becomes harder to meet',
        'MISSED EMI → account classified NPA → lender initiates legal/recovery action',
      ],
    });
  }

  // ── Chain 2: Declining Balance → Supplier Stress ──────────────────────────
  if (s.balanceTrend === 'declining' && s.balanceDropRate >= 40) {
    chains.push({
      trigger:     `Bank balance declined ${s.balanceDropRate.toFixed(0)}% over 90 days`,
      severity:    SEVERITY.HIGH,
      probability: 0.74,
      timeHorizon: HORIZON.IMMEDIATE,
      impact:      'Supplier payment delays → inventory stockout → revenue collapse',
      chain: [
        `Average daily balance fell from ₹52,000 → ₹23,000 (−${s.balanceDropRate.toFixed(0)}%)`,
        'Supplier payments start slipping (partial/delayed)',
        'Suppliers tighten credit terms or demand cash-in-advance for fresh stock',
        'Inventory levels drop → fulfillment delays for customers',
        'Customer collections slow as quality of service declines',
        'Revenue dips further → EMI becomes disproportionately large → default risk spikes',
      ],
    });
  }

  // ── Chain 3: Multi-Lender Trap ───────────────────────────────────────────
  if (s.lenderCount >= 3 || (s.loanSmsFrequency >= 14 && s.newLoansTakenRecently >= 1)) {
    chains.push({
      trigger:     `${s.lenderCount} active lenders + ${s.newLoansTakenRecently} new loan(s) taken recently`,
      severity:    SEVERITY.CRITICAL,
      probability: 0.79,
      timeHorizon: HORIZON.SHORT,
      impact:      'Multi-lender EMI crunch → domino default across all lenders',
      chain: [
        `Borrower services ${s.lenderCount} lenders simultaneously — ₹${Math.round(s.loanRepaymentExpenseShare * 100)}% of cash outflow is EMI`,
        'New fintech loan taken to bridge shortfall → total EMI burden increases',
        'One lender bounces NACH → penalty + dishonour charge → cash drain worsens',
        'Borrower prioritizes primary lender (this loan) → other lenders default first',
        'Secondary defaults trigger credit bureau flags → primary lender notices',
        'All lenders escalate simultaneously → borrower overwhelmed → systemic default',
      ],
    });
  }

  // ── Chain 4: Night Cash + Account Spreading → Compliance Risk ────────────
  if (s.nightCashRatio >= 0.35 || (s.multiBankSpreadingSignal === 'active_spreading' && s.interAccountTransfers >= 5)) {
    chains.push({
      trigger:     `${s.nightCashWithdrawals || 5} night-time withdrawals + inter-account fund transfers`,
      severity:    SEVERITY.HIGH,
      probability: 0.61,
      timeHorizon: HORIZON.MEDIUM,
      impact:      'Undisclosed obligations discovered → trust breakdown + regulatory risk',
      chain: [
        'Funds systematically moved between 3 accounts at night, obscuring true cash position',
        'Inter-account transfers inflate apparent primary account balance',
        'Actual free cash is lower than bank statements suggest',
        'When lender requests detailed bank statements for review: cash position mismatch detected',
        'Lender loses confidence in financial reporting → triggers audit/investigation',
        'Account freeze risk + regulatory scrutiny → business operations disrupted',
      ],
    });
  }

  // ── Chain 5: Failing UPI Rate → Revenue Recognition Risk ─────────────────
  if (s.upiFailedRate >= 0.15 || s.failedTransactionTrend === 'rapidly_increasing') {
    chains.push({
      trigger:     `UPI failure rate rising to ${(s.upiFailedRate * 100).toFixed(0)}% of transactions`,
      severity:    SEVERITY.HIGH,
      probability: 0.68,
      timeHorizon: HORIZON.IMMEDIATE,
      impact:      'Customer trust erosion → revenue loss → accelerated cash flow decline',
      chain: [
        `UPI failure rate trending: ${s.failedTransactionTrend} (last 30d: ${(s.upiFailedRate * 100).toFixed(0)}%)`,
        'Failed collections from customers create receivables backlog',
        'Customers lose trust in digital payment reliability → switch to competitor',
        'Revenue booking delayed → GST filings inaccurate → GST compliance risk',
        'Cash gap widens between receivables and payables → EMI stress intensifies',
        'Business reputation damage → further customer attrition in a competitive market',
      ],
    });
  }

  // ── Chain 6: Industry Decline × Borrower Stress Amplifier ────────────────
  if (cp.industryGrowthRate <= -1 && s.balanceStressLevel !== 'normal') {
    chains.push({
      trigger:     `Industry declining ${Math.abs(cp.industryGrowthRate).toFixed(1)}% while borrower already in financial stress`,
      severity:    SEVERITY.HIGH,
      probability: 0.71,
      timeHorizon: HORIZON.MEDIUM,
      impact:      'Sector headwind amplifies individual stress → recovery window closes',
      chain: [
        `Sector growth: ${cp.industryGrowthRate.toFixed(1)}% — peers are also under pressure`,
        'Industry-wide customer spend contracts → all distributors see volume decline',
        `Peer default rate ${cp.peerDefaultRate || '6'}% rising → suppliers tighten terms sector-wide`,
        'Competitor distress triggers price wars → margin compression for all players',
        'Borrower cannot improve despite effort — macro headwind overwhelms micro recovery',
        'Refinancing becomes impossible (sector in distress → lenders avoid) → exit scenario emerges',
      ],
    });
  }

  // ── Chain 7: GST Revenue Drop → Working Capital Crunch ───────────────────
  if (fp.salesGrowthRate <= -8) {
    chains.push({
      trigger:     `GST revenue declining ${Math.abs(fp.salesGrowthRate).toFixed(1)}% over last quarter`,
      severity:    SEVERITY.HIGH,
      probability: 0.77,
      timeHorizon: HORIZON.SHORT,
      impact:      'Working capital gap → supplier default → inventory collapse → revenue spiral',
      chain: [
        `Monthly revenue dropped from peak — sales growth at ${fp.salesGrowthRate.toFixed(1)}%`,
        'Working capital requirement stays fixed (rent, salaries, EMI) → gap opens',
        'Supplier credit period shortens as revenue signals stress to trade partners',
        'Borrower takes emergency fintech loans to bridge gap → more EMI load',
        'Purchase-to-sales ratio deteriorates as buying in smaller, costlier lots',
        'Revenue decline accelerates → full-scale liquidity crisis within 60 days',
      ],
    });
  }

  // ── Chain 8: NACH Bounce → Lender Escalation ─────────────────────────────
  if (s.emiBounced >= 1 || s.failedNachCount >= 1) {
    chains.push({
      trigger:     `${s.emiBounced || s.failedNachCount} NACH/EMI bounce event(s)`,
      severity:    SEVERITY.CRITICAL,
      probability: 0.88,
      timeHorizon: HORIZON.IMMEDIATE,
      impact:      'Immediate bureau reporting + penalty charges + lender recovery mode',
      chain: [
        'NACH auto-debit bounces → ₹500+ dishonour charge levied same day',
        'Lender\'s system automatically flags account → collections team alerted within 24h',
        'Reminder calls/SMS surge → borrower under simultaneous lender pressure',
        'Borrower makes partial payment to stop escalation → full shortfall remains',
        'Bureau update at month-end: DPD (Days Past Due) recorded → CIBIL drops 30-50 points',
        'Future loan applications either rejected or priced 2-3% higher → refinancing costs spike',
      ],
    });
  }

  // Sort by probability × severity weight
  const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
  return chains
    .sort((a, b) => (b.probability * severityWeight[b.severity]) - (a.probability * severityWeight[a.severity]))
    .slice(0, 6);
}

module.exports = { generateButterflyChains };
