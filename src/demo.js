// ─────────────────────────────────────────────────────────────────────────────
// src/demo.js  —  Full pipeline console demo  |  node src/demo.js
// ─────────────────────────────────────────────────────────────────────────────
const fs   = require('fs');
const path = require('path');

// Load .env
try {
  const env = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
  for (const line of env.split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
} catch (_) {}

const { scorePartner } = require('./engine');
const { mockPartnerRequest } = require('./data/mockData');

// ── Display helpers ────────────────────────────────────────────────────────
const W  = 68;
const HR = '═'.repeat(W);
const hr = '─'.repeat(W);

const RISK_COLOR  = { critical:'🔴', high:'🟠', medium:'🟡', low:'🟢', very_low:'🟢', very_high:'🔴' };
const GRADE_COLOR = { 'F':'🔴','D':'🔴','C':'🟠','B':'🟡','A':'🟢','AAA':'🟢','AA':'🟢','BBB':'🟡','BB':'🟡','CCC':'🔴' };

function bar(val, max, len = 32) {
  const filled = Math.round((val / max) * len);
  return '[' + '█'.repeat(Math.max(0,filled)) + '░'.repeat(Math.max(0,len-filled)) + ']';
}

function row(label, val, max, suffix = '') {
  const pct = `${val}${suffix}`.padStart(6);
  console.log(`  ${label.padEnd(30)} ${bar(val, max)} ${pct}`);
}

function section(title, color = '■') {
  console.log(`\n${HR}`);
  console.log(`  ${color}  ${title}`);
  console.log(hr);
}

// ── Main demo ──────────────────────────────────────────────────────────────
async function run() {
  console.log('\n' + HR);
  console.log('  ██████╗██████╗ ███████╗██████╗ ██╗████████╗   ██╗     ███████╗███╗  ██╗███████╗');
  console.log('  ██╔════╝██╔══██╗██╔════╝██╔══██╗██║╚══██╔══╝   ██║     ██╔════╝████╗ ██║██╔════╝');
  console.log('  ██║     ██████╔╝█████╗  ██║  ██║██║   ██║      ██║     █████╗  ██╔██╗██║███████╗');
  console.log('  ██║     ██╔══██╗██╔══╝  ██║  ██║██║   ██║      ██║     ██╔══╝  ██║╚████║╚════██║');
  console.log('  ╚██████╗██║  ██║███████╗██████╔╝██║   ██║      ███████╗███████╗██║ ╚███║███████║');
  console.log('            AI-Powered Credit Intelligence Engine  v2.0');
  console.log(HR);
  console.log('  Partner  :  CP-RAJESH-001');
  console.log('  Loans    :  LN-2023-001 (Electrical Goods) + LN-2024-087 (FMCG)');
  console.log(`  AI Key   :  ${process.env.ANTHROPIC_API_KEY ? '✓ Claude API active' : '⚡ Fallback reasoning (no key needed)'}`);
  console.log(HR);

  const t0 = Date.now();
  const result = await scorePartner(mockPartnerRequest);
  const ms = Date.now() - t0;

  // ══════════════════════════════════════════════════════════════════════
  section('CHANNEL PARTNER TRUST SCORE', '🏆');
  const cpIcon = GRADE_COLOR[result.grade] || '⚪';
  console.log(`\n  ${cpIcon}  Trust Score   : ${result.trustScore} / 850`);
  console.log(`  ${cpIcon}  Grade         : ${result.grade}`);
  console.log(`  ${RISK_COLOR[result.riskLevel]}  Risk Level    : ${result.riskLevel.toUpperCase()}`);
  console.log();
  row('  Loan Health      (60%)',  result.scoreBreakdown.loanHealthContribution,  510, '/510');
  row('  Financial Health (20%)',  result.scoreBreakdown.financialContribution,   170, '/170');
  row('  Behavioral       (12%)',  result.scoreBreakdown.behavioralContribution,  102, '/102');
  row('  Contextual        (8%)',  result.scoreBreakdown.contextualContribution,   68, '/68');

  // ══════════════════════════════════════════════════════════════════════
  section('INDIVIDUAL LOAN HEALTH SCORES', '🏦');
  for (const loan of result.loanScores) {
    const icon = GRADE_COLOR[loan.grade] || '⚪';
    console.log(`\n  ${icon}  ${loan.loanId}  —  ${loan.score}/100  (Grade ${loan.grade})`);
    console.log(`       Risk: ${RISK_COLOR[loan.riskLevel]} ${loan.riskLevel.toUpperCase()}`);
    row('       Score', loan.score, 100, '/100');
    const ws = loan.workflowSummary;
    console.log(`\n       Workflows : ${ws.total} total | ${ws.triggered} triggered | ${ws.highRisk} high-risk | ${ws.positive} positive`);
    console.log(`       Net Score Impact : ${ws.scoreImpact > 0 ? '+' : ''}${ws.scoreImpact.toFixed(1)} pts from workflows\n`);
    console.log('       Top Factors:');
    for (const f of loan.topFactors) {
      const fi = f.impact === 'positive' ? '✅' : f.impact === 'negative' ? '🔴' : '⚪';
      console.log(`         ${fi}  ${f.factor}`);
      console.log(`              ${f.description}`);
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  section('WORKFLOW BREAKDOWN — Loan 1 (Triggered Only)', '⚙️');
  const loan1 = result.loanScores[0];
  const triggered = loan1.workflowResults.filter(w => w.triggered);
  const bySignal = { high_risk:[], medium_risk:[], low_risk:[], positive:[] };
  for (const w of triggered) { if (bySignal[w.signal]) bySignal[w.signal].push(w); }

  const sigIcon = { high_risk:'🔴', medium_risk:'🟠', low_risk:'🟡', positive:'🟢' };
  for (const [sig, wfs] of Object.entries(bySignal)) {
    if (!wfs.length) continue;
    console.log(`\n  ${sigIcon[sig]}  ${sig.replace('_',' ').toUpperCase()} (${wfs.length})`);
    for (const w of wfs) {
      console.log(`     • [${w.workflowId}] ${w.name}`);
      console.log(`       → ${w.reason}`);
      if (w.scoreImpact !== 0)
        console.log(`       → Score impact: ${w.scoreImpact > 0 ? '+' : ''}${w.scoreImpact}`);
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  section('🦋  BUTTERFLY EFFECT TRIGGERS', '🦋');
  const allBF = result.loanScores.flatMap(l => l.butterflyTriggers);
  if (allBF.length === 0) {
    console.log('\n  No butterfly triggers detected.');
  } else {
    for (const b of allBF) {
      const sev = { critical:'🔴 CRITICAL', high:'🟠 HIGH', medium:'🟡 MEDIUM', low:'🟢 LOW' };
      console.log(`\n  ${sev[b.severity] || '⚪'} — ${b.trigger}`);
      if (b.chain && b.chain.length > 1) {
        console.log('  Cascade chain:');
        b.chain.forEach((step, i) => {
          const arrow = i === b.chain.length-1 ? '  └─►' : '  ├─►';
          console.log(`  ${arrow} ${step.trim()}`);
        });
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  section('💡  AHA MOMENTS (Non-Obvious Insights)', '💡');
  if (result.ahaMoments.length === 0) {
    console.log('\n  No Aha Moments surfaced for this partner.');
  } else {
    result.ahaMoments.forEach((aha, i) => {
      console.log(`\n  ${i+1}.  ${aha}`);
    });
  }

  // ══════════════════════════════════════════════════════════════════════
  section('🤖  TOP 3 AI INSIGHTS', '🤖');
  result.topInsights.forEach((ins, i) => {
    console.log(`\n  ${i+1}.  ${ins}`);
  });

  // ══════════════════════════════════════════════════════════════════════
  section('📋  CREDIT COMMITTEE REASONING', '📋');
  console.log();
  // Word-wrap at ~64 chars
  const words = result.fullReasoning.split(' ');
  let line = '  ';
  for (const word of words) {
    if ((line + word).length > 70) { console.log(line); line = '  '; }
    line += word + ' ';
  }
  if (line.trim()) console.log(line);

  // ══════════════════════════════════════════════════════════════════════
  section('AI REASONING — Per Loan', '🧠');
  for (const loan of result.loanScores) {
    console.log(`\n  ${loan.loanId} (${loan.score}/100):`);
    const rWords = loan.reasoning.split(' ');
    let rLine = '  ';
    for (const w of rWords) {
      if ((rLine + w).length > 70) { console.log(rLine); rLine = '  '; }
      rLine += w + ' ';
    }
    if (rLine.trim()) console.log(rLine);
  }

  // ══════════════════════════════════════════════════════════════════════
  console.log(`\n${HR}`);
  console.log(`  ✅  Pipeline complete in ${ms}ms`);
  console.log(`  Partner ${result.partnerId}  |  Trust Score ${result.trustScore}/850  |  Grade ${result.grade}  |  Risk ${result.riskLevel.toUpperCase()}`);
  console.log(`${HR}\n`);

  // Write JSON output for inspection
  const outPath = path.join(__dirname, '../output.json');
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`  📄  Full JSON saved to: output.json\n`);
}

run().catch(e => { console.error('Demo error:', e); process.exit(1); });
