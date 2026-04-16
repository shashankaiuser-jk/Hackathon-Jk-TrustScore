// ─────────────────────────────────────────────────────────────────────────────
// src/ai/llmAgent.js  —  Anthropic API via native https (zero dependencies)
// ─────────────────────────────────────────────────────────────────────────────
const https = require('https');

function callAnthropic(messages, maxTokens = 500) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.ANTHROPIC_API_KEY || '';
    if (!apiKey) return reject(new Error('NO_API_KEY'));

    const body = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      messages,
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error.message));
          resolve(parsed.content[0].text);
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(25000, () => { req.destroy(); reject(new Error('TIMEOUT')); });
    req.write(body);
    req.end();
  });
}

// ── Loan Reasoning ────────────────────────────────────────────────────────
async function generateLoanReasoning(loanId, params, workflowResults, score) {
  const high = workflowResults.filter(w => w.signal === 'high_risk').slice(0, 3);
  const pos  = workflowResults.filter(w => w.signal === 'positive').slice(0, 2);

  const prompt = `You are a senior credit analyst at a fintech company. Loan health assessment just completed.

LOAN: ${loanId}  |  SCORE: ${score}/100

KEY PARAMETERS:
- On-time payments: ${(params.loan.onTimePaymentRatio*100).toFixed(0)}%  | Missed: ${params.loan.missedPaymentCount}  | Partial: ${params.loan.partialPaymentCount}
- Avg delay: ${params.loan.avgDelayDays.toFixed(1)} days  | Penalties: ${params.loan.penaltyOccurrences}
- GST sales trend: ${params.financial.salesGrowthRate.toFixed(1)}%  | DTI: ${params.financial.debtToIncomeRatio.toFixed(2)}x
- Balance sheet: ${params.financial.balanceSheetStrength}/100  | Active loans: ${params.financial.numberOfActiveLoans}
- Daily balance: ₹${params.behavioral.avgDailyBalance.toLocaleString()}  | I/O ratio: ${params.behavioral.inflowOutflowRatio.toFixed(2)}
- Expense spike: ${params.behavioral.suddenExpenseSpike?'YES':'No'}  | Industry growth: ${params.contextual.industryGrowthRate.toFixed(1)}%

HIGH-RISK SIGNALS:
${high.map(w => `• ${w.name}: ${w.reason}`).join('\n') || '• None'}

POSITIVE SIGNALS:
${pos.map(w => `• ${w.name}: ${w.reason}`).join('\n') || '• None'}

Write a crisp 3-sentence credit analyst reasoning:
1. Why this score? (cite the dominant risk/positive factor with numbers)
2. What is the most critical watch point?
3. Recommended action for the credit team.`;

  try {
    return await callAnthropic([{ role:'user', content: prompt }], 300);
  } catch(e) {
    return fallbackLoanReasoning(params, score, high);
  }
}

// ── Partner Insights ──────────────────────────────────────────────────────
async function generatePartnerInsights(partnerId, loanSummaries, params, trustScore) {
  const prompt = `You are a fintech credit intelligence analyst.

CHANNEL PARTNER: ${partnerId}  |  TRUST SCORE: ${trustScore}/850

LOAN PORTFOLIO:
${loanSummaries.map(l => `• ${l.loanId}: ${l.score}/100 (${l.riskLevel}) — ${l.topRisk}`).join('\n')}

PARTNER SIGNALS:
- Credit utilization: ${params.financial.creditUtilization}%  | Active loans: ${params.financial.numberOfActiveLoans}
- EPFO trend: ${params.financial.epfoEmployeeTrend}  | Legal cases: ${params.financial.legalCaseCount}
- Balance sheet: ${params.financial.balanceSheetStrength}/100  | DTI: ${params.financial.debtToIncomeRatio.toFixed(2)}x
- Industry growth: ${params.contextual.industryGrowthRate.toFixed(1)}%  | Peer score: ${params.contextual.peerPerformanceScore}/100
- I/O ratio: ${params.behavioral.inflowOutflowRatio.toFixed(2)}  | Expense spike: ${params.behavioral.suddenExpenseSpike?'YES':'No'}

Provide:
INSIGHTS:
1. [One specific, data-backed insight about the biggest risk]
2. [One insight about a hidden or non-obvious pattern]
3. [One forward-looking recommendation]

REASONING:
[3-4 sentence credit committee summary covering overall risk profile, key drivers, and recommended credit action]`;

  try {
    const text = await callAnthropic([{ role:'user', content: prompt }], 500);
    return parseInsights(text, params, trustScore, loanSummaries);
  } catch(e) {
    return fallbackInsights(params, trustScore, loanSummaries);
  }
}

function parseInsights(text, params, trustScore, loanSummaries) {
  const insM = text.match(/INSIGHTS:\s*([\s\S]*?)(?=REASONING:|$)/i);
  const resM = text.match(/REASONING:\s*([\s\S]*)$/i);

  const insightsRaw = insM ? insM[1] : '';
  const insights = insightsRaw
    .split('\n')
    .filter(l => /^\d+\./.test(l))
    .map(l => l.replace(/^\d+\.\s*/, '').trim())
    .filter(l => l.length > 0)
    .slice(0, 3);

  const fullReasoning = resM ? resM[1].trim() : text;

  if (insights.length < 3) return fallbackInsights(params, trustScore, loanSummaries);
  return { insights, fullReasoning };
}

// ── Fallbacks (no API key) ─────────────────────────────────────────────────
function fallbackLoanReasoning(params, score, highRisk) {
  const top = highRisk[0]?.name || 'Multi-factor financial stress';
  const grade = score >= 65 ? 'manageable' : score >= 45 ? 'elevated' : 'critical';
  return `Loan health score of ${score}/100 reflects ${grade} risk, primarily driven by ${top} — repayment discipline at ${(params.loan.onTimePaymentRatio*100).toFixed(0)}% on-time with ${params.loan.missedPaymentCount} missed and ${params.loan.partialPaymentCount} partial payment(s). ` +
    `GST sales trend of ${params.financial.salesGrowthRate.toFixed(1)}% combined with daily balance of ₹${params.behavioral.avgDailyBalance.toLocaleString()} ${params.behavioral.inflowOutflowRatio < 1 ? 'and negative inflow/outflow ratio signal near-term liquidity pressure' : 'indicate the borrower retains some operational capacity'}. ` +
    `Credit team should ${score < 45 ? 'initiate immediate borrower review and consider security top-up' : score < 65 ? 'flag for enhanced monitoring and 30-day check-in' : 'maintain standard monitoring cadence with quarterly review'}.`;
}

function fallbackInsights(params, trustScore, loanSummaries) {
  const insights = [
    `Trust score of ${trustScore}/850 is ${trustScore < 400 ? 'critically' : trustScore < 550 ? 'significantly' : 'moderately'} impacted by ${loanSummaries.filter(l => l.score < 50).length > 0 ? loanSummaries.filter(l => l.score < 50).length + ' distressed loan(s) with scores below 50' : 'concentrated debt obligations at DTI ' + params.financial.debtToIncomeRatio.toFixed(1) + 'x'}.`,
    `${params.contextual.industryGrowthRate < 0 ? 'Industry contraction of ' + Math.abs(params.contextual.industryGrowthRate).toFixed(1) + '% is a structural headwind, not a temporary blip — peer default rate of ' + params.contextual.peerPerformanceScore + '/100 confirms sector-wide stress' : 'EPFO ' + params.financial.epfoEmployeeTrend + ' trend combined with ' + (params.behavioral.suddenExpenseSpike ? 'a sudden expense spike' : 'stable expense patterns') + ' is the key non-obvious signal to watch'}.`,
    `Recommend ${trustScore < 400 ? 'credit review with collateral assessment and 15-day monitoring cadence' : trustScore < 550 ? 'enhanced due diligence, collect 3-month bank statements, and monthly check-in' : 'standard monitoring with next review in 90 days — watch GST filings and EMI consistency'}.`,
  ];
  const fullReasoning = `Channel partner ${partnerId(params)} carries ${params.financial.numberOfActiveLoans} active loan(s) with ${trustScore < 400 ? 'a high concentration of distress signals' : 'mixed risk indicators'}. ` +
    `Financial health is ${params.financial.balanceSheetStrength > 65 ? 'adequate' : 'under stress'} at balance sheet score ${params.financial.balanceSheetStrength}/100, against a ${params.contextual.sectorRiskIndex > 60 ? 'high-risk' : 'moderate'} industry backdrop (sector risk ${params.contextual.sectorRiskIndex}/100). ` +
    `Digitap behavioral data ${params.behavioral.suddenExpenseSpike ? 'flags a sudden expense event and' : 'shows'} ${params.behavioral.inflowOutflowRatio < 1 ? 'net cash outflows — a liquidity warning' : 'positive inflow/outflow balance of ' + params.behavioral.inflowOutflowRatio.toFixed(2)}. ` +
    `Overall classification: ${trustScore > 600 ? 'Acceptable risk — standard monitoring' : trustScore > 400 ? 'Elevated risk — enhanced due diligence required' : 'High risk — immediate credit review recommended'}.`;
  return { insights, fullReasoning };
}

function partnerId(params) { return 'this partner'; }

module.exports = { generateLoanReasoning, generatePartnerInsights };
