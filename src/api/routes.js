// ─────────────────────────────────────────────────────────────────────────────
// src/api/routes.js  —  Route handlers (framework-agnostic)
// ─────────────────────────────────────────────────────────────────────────────
const { scoreLoan, scorePartner } = require('../engine');
const { mockPartnerRequest, loan1, loan2 } = require('../data/mockData');
const db = require('../data/partnersDb');

const partnerScoreCache = new Map();
const loanScoreCache    = new Map();

// Pre-score exactly 6 partners for the demo
(async () => {
  console.log('[Init] Pre-scoring 6 specific partners for partial demo display...');
  for (let i = 0; i < 6; i++) {
    const p = db.partners[i];
    if (p) {
      try {
        const result = await scorePartner({ partnerId: p.partnerId, loans: p.loans });
        partnerScoreCache.set(p.partnerId, result);
        if (result.loanScores) {
          result.loanScores.forEach(ls => loanScoreCache.set(ls.loanId, ls));
        }
      } catch (e) {
        console.error(`[Init err] Failed to pre-score ${p.partnerId}:`, e.message);
      }
    }
  }
  console.log('[Init] Demo pre-scoring complete.');
})();

const routes = {};
function register(method, path, fn) { routes[`${method}:${path}`] = fn; }

// GET /api/channel-partners
register('GET', '/api/channel-partners', async () => {
  const list = db.partners.map(p => {
    const cached = partnerScoreCache.get(p.partnerId);
    return {
      partnerId: p.partnerId, name: p.name, company: p.company,
      email: p.email, phone: p.phone, joinedDate: p.joinedDate,
      kycStatus: p.kycStatus, credCheckStatus: p.credCheckStatus,
      loanCount: p.loans.length, loanIds: p.loans.map(l => l.loan.loanId),
      trustScore: cached ? cached.trustScore : estimateTrustScore(p),
      riskLevel:  cached ? cached.riskLevel  : estimateRisk(p),
      grade:      cached ? cached.grade      : estimateGrade(p),
      scored: !!cached,
    };
  });
  return { status: 200, data: { success: true, data: list } };
});

// GET /api/loans
register('GET', '/api/loans', async () => {
  const list = db.getAllLoans().map(l => {
    const cached = loanScoreCache.get(l.loan.loanId);
    return {
      loanId: l.loan.loanId, partnerId: l.loan.partnerId,
      partnerName: l.partnerName, partnerCompany: l.partnerCompany,
      loanAmount: l.loan.loanAmount, emiAmount: l.loan.emiAmount,
      loanType: l.loan.loanType, monthsElapsed: l.loan.monthsElapsed,
      tenureMonths: l.loan.tenureMonths, interestRate: l.loan.interestRate,
      outstandingPrincipal: l.loan.outstandingPrincipal,
      cibilScore: l.credCheck.cibilScore,
      avgDailyBalance: l.digitap.avgDailyBalance,
      score:     cached ? cached.score     : estimateLoanScore(l),
      grade:     cached ? cached.grade     : estimateLoanGrade(l),
      riskLevel: cached ? cached.riskLevel : estimateLoanRisk(l),
      scored: !!cached,
    };
  });
  return { status: 200, data: { success: true, data: list } };
});

async function getLoanById(loanId) {
  const l = db.getLoan(loanId);
  if (!l) return { status: 404, data: { success: false, error: `Loan ${loanId} not found` } };
  const cached = loanScoreCache.get(loanId);
  if (cached) return { status: 200, data: { success: true, data: { ...l, ...cached, scored: true } } };
  return { status: 200, data: { success: true, data: {
    loanId: l.loan.loanId, partnerId: l.loan.partnerId, partnerName: l.partnerName,
    loanDetails: l.loan,
    creditBasics: { cibilScore: l.credCheck.cibilScore, avgDailyBalance: l.digitap.avgDailyBalance },
    score: estimateLoanScore(l), grade: estimateLoanGrade(l), riskLevel: estimateLoanRisk(l),
    scored: false,
  } } };
}

// POST /api/loan/health-check
register('POST', '/api/loan/health-check', async (body) => {
  const { loanId } = body;
  if (!loanId) return { status: 400, data: { success: false, error: 'Missing loanId' } };
  const l = db.getLoan(loanId);
  if (!l) return { status: 404, data: { success: false, error: `Loan ${loanId} not found` } };
  const result = await scoreLoan(l);
  loanScoreCache.set(loanId, result);
  return { status: 200, data: { success: true, data: result } };
});

// POST /api/partner/health-check
register('POST', '/api/partner/health-check', async (body) => {
  const { partnerId } = body;
  if (!partnerId) return { status: 400, data: { success: false, error: 'Missing partnerId' } };
  const p = db.getPartner(partnerId);
  if (!p) return { status: 404, data: { success: false, error: `Partner ${partnerId} not found` } };
  const result = await scorePartner({ partnerId: p.partnerId, loans: p.loans });
  partnerScoreCache.set(partnerId, result);
  if (result.loanScores) result.loanScores.forEach(ls => loanScoreCache.set(ls.loanId, ls));
  return { status: 200, data: { success: true, data: result } };
});

// ── EXISTING ENDPOINTS (preserved) ──────────────────────────────────────────
const MOCK_MAP = { 'LN-2023-001': loan1, 'LN-2024-087': loan2 };

register('POST', '/api/loan/score', async (body) => {
  if (!body.loan || !body.repaymentHistory)
    return { status: 400, data: { success: false, error: 'Missing required fields' } };
  const result = await scoreLoan(body);
  return { status: 200, data: { success: true, data: result } };
});

register('POST', '/api/partner/score', async (body) => {
  if (!body.partnerId || !Array.isArray(body.loans))
    return { status: 400, data: { success: false, error: 'Missing required fields' } };
  const result = await scorePartner(body);
  return { status: 200, data: { success: true, data: result } };
});

register('GET', '/api/demo', async () => {
  const result = await scorePartner(mockPartnerRequest);
  return { status: 200, data: { success: true, data: result } };
});

register('GET', '/api/mock-data', async () => ({
  status: 200,
  data: { success: true, data: { description: 'CreditLens AI Mock Data', partner: mockPartnerRequest } },
}));

register('GET', '/api/health', async () => ({
  status: 200, data: {
    status: 'ok', service: 'CreditLens AI v2.0',
    partners: db.partners.length, loans: db.getAllLoans().length, workflows: 35,
    endpoints: [
      'GET  /api/channel-partners', 'GET  /api/loans', 'GET  /api/loan/:id',
      'POST /api/loan/health-check', 'POST /api/partner/health-check',
      'POST /api/loan/score', 'POST /api/partner/score',
      'GET  /api/demo', 'GET  /api/explain/:loanId', 'GET  /api/mock-data', 'GET  /api/health',
    ],
    timestamp: new Date().toISOString(),
  },
}));

// ── Heuristic scorers ────────────────────────────────────────────────────────
function estimateLoanScore(loanObj) {
  const cc = loanObj.credCheck || {}, dt = loanObj.digitap || {};
  const rh = loanObj.repaymentHistory || [];
  let score = 65;
  if (cc.cibilScore) score += (cc.cibilScore - 650) * 0.08;
  if (dt.inflowOutflowRatio) score += (dt.inflowOutflowRatio - 1.0) * 20;
  score -= rh.filter(r => r.status === 'missed').length * 8;
  score -= rh.filter(r => r.status === 'partial').length * 3;
  if (dt.failedTransactionRate > 5) score -= 10;
  return Math.max(5, Math.min(98, Math.round(score)));
}
function estimateLoanGrade(l) {
  const s = estimateLoanScore(l);
  return s>=85?'A+':s>=75?'A':s>=65?'B+':s>=55?'B':s>=40?'C':'D';
}
function estimateLoanRisk(l) {
  const s = estimateLoanScore(l);
  return s>=80?'very_low':s>=65?'low':s>=50?'medium':s>=35?'high':'very_high';
}
function estimateTrustScore(partner) {
  if (!partner.loans.length) return 500;
  const scores = partner.loans.map(estimateLoanScore);
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 8.5);
}
function estimateRisk(partner) {
  const ts = estimateTrustScore(partner);
  return ts>=720?'very_low':ts>=580?'low':ts>=430?'medium':ts>=290?'high':'very_high';
}
function estimateGrade(partner) {
  const ts = estimateTrustScore(partner);
  return ts>=750?'A+':ts>=650?'A':ts>=550?'B+':ts>=450?'B':ts>=350?'C':'D';
}

// ── Router ────────────────────────────────────────────────────────────────
async function handleRequest(method, url, body) {
  const explainMatch = url.match(/^\/api\/explain\/(.+)$/);
  if (explainMatch) {
    const loanId = explainMatch[1];
    if (db.getLoan(loanId)) return getLoanById(loanId);
    const req = MOCK_MAP[loanId];
    if (!req) return { status: 404, data: { success: false, error: `Loan ${loanId} not found` } };
    const result = await scoreLoan(req);
    loanScoreCache.set(loanId, result);
    return { status: 200, data: { success: true, data: {
      loanId: result.loanId, score: result.score, grade: result.grade,
      riskLevel: result.riskLevel, reasoning: result.reasoning,
      topFactors: result.topFactors, butterflyTriggers: result.butterflyTriggers,
      workflowSummary: result.workflowSummary,
      triggeredWorkflows: result.workflowResults.filter(w => w.triggered),
      ahaInsights: result.workflowResults.filter(w => w.ahaInsight).map(w => w.ahaInsight),
    } } };
  }

  const loanByIdMatch = url.match(/^\/api\/loan\/([^/]+)$/);
  if (loanByIdMatch && method === 'GET') return getLoanById(loanByIdMatch[1]);

  const key = `${method}:${url}`;
  const handler = routes[key];
  if (!handler) return { status: 404, data: { success: false, error: `Not found: ${method} ${url}` } };
  try {
    return await handler(body);
  } catch (e) {
    console.error(`[Routes] Error: ${e.message}`);
    return { status: 500, data: { success: false, error: e.message } };
  }
}

module.exports = { handleRequest };
