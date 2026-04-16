// ─────────────────────────────────────────────────────────────────────────────
// src/api/routes.js  —  Route handlers (framework-agnostic)
// ─────────────────────────────────────────────────────────────────────────────
const { scoreLoan, scorePartner } = require('../engine');
const { mockPartnerRequest, loan1, loan2 } = require('../data/mockData');

const MOCK_MAP = {
  'LN-2023-001': loan1,
  'LN-2024-087': loan2,
};

// ── Route table: method + path → handler(body) → response ─────────────────
const routes = {};
function register(method, path, fn) {
  routes[`${method}:${path}`] = fn;
}

// POST /api/loan/score
register('POST', '/api/loan/score', async (body) => {
  if (!body.loan || !body.repaymentHistory)
    return { status: 400, data: { success:false, error:'Missing required fields: loan, repaymentHistory' } };
  const result = await scoreLoan(body);
  return { status: 200, data: { success:true, data: result } };
});

// POST /api/partner/score
register('POST', '/api/partner/score', async (body) => {
  if (!body.partnerId || !Array.isArray(body.loans))
    return { status: 400, data: { success:false, error:'Missing required fields: partnerId, loans[]' } };
  const result = await scorePartner(body);
  return { status: 200, data: { success:true, data: result } };
});

// GET /api/demo
register('GET', '/api/demo', async () => {
  const result = await scorePartner(mockPartnerRequest);
  return { status: 200, data: { success:true, data: result } };
});

// GET /api/explain/:loanId  (handled specially below)
async function explainLoan(loanId) {
  const req = MOCK_MAP[loanId];
  if (!req) return { status: 404, data: { success:false, error:`Loan ${loanId} not found` } };
  const result = await scoreLoan(req);
  return {
    status: 200,
    data: {
      success: true,
      data: {
        loanId:            result.loanId,
        score:             result.score,
        grade:             result.grade,
        riskLevel:         result.riskLevel,
        reasoning:         result.reasoning,
        topFactors:        result.topFactors,
        butterflyTriggers: result.butterflyTriggers,
        workflowSummary:   result.workflowSummary,
        triggeredWorkflows: result.workflowResults.filter(w => w.triggered),
        ahaInsights:       result.workflowResults.filter(w => w.ahaInsight).map(w => w.ahaInsight),
      },
    },
  };
}

// GET /api/mock-data
register('GET', '/api/mock-data', async () => ({
  status: 200,
  data: { success:true, data: { description:'CreditLens AI Mock Data', partner: mockPartnerRequest } },
}));

// GET /api/health
register('GET', '/api/health', async () => ({
  status: 200,
  data: {
    status: 'ok',
    service: 'CreditLens AI v2.0',
    workflows: 35,
    endpoints: [
      'POST /api/loan/score',
      'POST /api/partner/score',
      'GET  /api/demo',
      'GET  /api/explain/:loanId',
      'GET  /api/mock-data',
      'GET  /api/health',
    ],
    timestamp: new Date().toISOString(),
  },
}));

// ── Router ─────────────────────────────────────────────────────────────────
async function handleRequest(method, url, body) {
  // Explain route with param
  const explainMatch = url.match(/^\/api\/explain\/(.+)$/);
  if (explainMatch) return explainLoan(explainMatch[1]);

  const key = `${method}:${url}`;
  const handler = routes[key];
  if (!handler) return { status: 404, data: { success:false, error:`Not found: ${method} ${url}` } };

  try {
    return await handler(body);
  } catch (e) {
    console.error(`[Routes] Error: ${e.message}`);
    return { status: 500, data: { success:false, error: e.message } };
  }
}

module.exports = { handleRequest };
