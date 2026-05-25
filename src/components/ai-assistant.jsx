// AI Credit Analyst
// AISummaryCard  — colorful insight card shown below composite breakdown
// AIAnalystDrawer — slide-in chat panel opened on card click
// Props: { app } — full LAP application object

(function () {
  const { useState, useEffect, useRef } = React;

  /* ── helpers ──────────────────────────────────────────────────── */
  function fmt(n) {
    if (!n) return "—";
    if (n >= 10000000) return "₹" + (n / 10000000).toFixed(2).replace(/\.?0+$/, "") + " Cr";
    if (n >= 100000)   return "₹" + Math.round(n / 100000) + "L";
    return "₹" + n.toLocaleString("en-IN");
  }
  function matchesAny(q, kws) { return kws.some(k => q.includes(k)); }

  /* ── verdict colour from score / tone ────────────────────────── */
  function verdictColor(score, tone) {
    if (tone === "good" || score >= 85) return "var(--c-green)";
    if (tone === "bad"  || score < 60)  return "var(--c-red)";
    return "var(--c-amber)";
  }
  function riskLabel(score) {
    if (score >= 85) return "LOW RISK";
    if (score >= 75) return "MODERATE";
    if (score >= 65) return "MOD-HIGH";
    return "HIGH RISK";
  }

  /* ══════════════════════════════════════════════════════════════
     SUMMARY CARD
  ══════════════════════════════════════════════════════════════ */
  function AISummaryCard({ app, onOpenDrawer }) {
    const sc    = app.scorecard   || {};
    const docs  = app.documents   || {};
    const flags = app.flags       || [];
    const score = sc.score || app.compositeScore || 0;
    const vCol  = verdictColor(score, sc.decisionTone);
    const cats  = sc.categories   || [];

    const missingDocs = (docs.groups || [])
      .flatMap(g => (g.items || []).filter(i => i.status === "Missing"));
    const missingCount = missingDocs.length;

    const dbr    = Math.round((app.dbr  || 0) * 100);
    const ltv    = Math.round((app.ltv  || 0) * 100);
    const cibil  = app.cibilScore || 0;

    const cibilOk  = cibil >= 750;
    const dbrOk    = dbr   <= 40;
    const ltvOk    = ltv   <= 60;

    /* key findings — data-driven */
    const findings = [];
    if (cibil < 750) findings.push({ type: "warn", text: `CIBIL ${cibil} — deviation band, NCM sign-off required` });
    const bureauCat = cats.find(c => c.id === "bureau");
    if (bureauCat && bureauCat.items) {
      const dpd = bureauCat.items.find(i => i.label && i.label.includes("DPD"));
      if (dpd && dpd.pct < 100) findings.push({ type: "warn", text: "Max DPD 5 days in last 12M — zero preferred" });
      const cc = bureauCat.items.find(i => i.label && i.label.includes("CC"));
      if (cc && cc.pct < 100) findings.push({ type: "warn", text: "CC / KCC overdue ₹35K — verify closure before disbursement" });
    }
    if (dbr > 40) findings.push({ type: "warn", text: `DBR ${dbr}% — elevated; policy threshold 55%` });
    const stabCat = cats.find(c => c.id === "stability");
    if (stabCat && stabCat.pct >= 80) findings.push({ type: "good", text: `${app.employment || "Strong business vintage"} — key positive factor` });
    if (missingCount > 0) findings.push({ type: "doc", text: `${missingCount} document${missingCount > 1 ? "s" : ""} pending — legal search on critical path` });
    const kycCat = cats.find(c => c.id === "kyc");
    if (kycCat && kycCat.pct === 100) findings.push({ type: "good", text: "KYC & fraud checks fully cleared — PAN verified, no Hunter match" });

    /* score bar segments */
    const barPct = Math.min(100, score);

    return (
      <div className="ais-card" data-testid="ai-assistant" onClick={onOpenDrawer}>

        {/* ── Top label row ── */}
        <div className="ais-label-row">
          <div className="ais-label-left">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
              <circle cx="9" cy="12" r="1" fill="var(--accent)"/>
              <circle cx="12" cy="12" r="1" fill="var(--accent)"/>
              <circle cx="15" cy="12" r="1" fill="var(--accent)"/>
            </svg>
            <span className="ais-label-text">AI CREDIT SUMMARY</span>
          </div>
          <div className="ais-label-right">
            <span className="ais-badge">BETA</span>
            <span className="ais-open-hint">Click to ask AI →</span>
          </div>
        </div>

        {/* ── Verdict banner ── */}
        <div className="ais-verdict-row" style={{ borderColor: `oklch(from ${vCol} l c h / 0.35)`, background: `oklch(from ${vCol} l c h / 0.07)` }}>
          <div className="ais-verdict-left">
            <span className="ais-verdict-label" style={{ color: vCol }}>
              {sc.decisionLabel || (score >= 60 ? "APPROVE via NSTP" : "DECLINE")}
            </span>
            <span className="ais-risk-chip" style={{ color: vCol, borderColor: `oklch(from ${vCol} l c h / 0.4)`, background: `oklch(from ${vCol} l c h / 0.12)` }}>
              {riskLabel(score)}
            </span>
          </div>
          <div className="ais-score-display">
            <span className="ais-score-num" style={{ color: vCol }}>{score}</span>
            <span className="ais-score-denom">/100</span>
          </div>
        </div>

        {/* ── Score bar ── */}
        <div className="ais-bar-wrap">
          <div className="ais-bar-track">
            <div className="ais-bar-fill" style={{ width: barPct + "%", background: `linear-gradient(90deg, ${vCol}, oklch(from ${vCol} calc(l + 0.1) c h))` }} />
          </div>
          <span className="ais-bar-label" style={{ color: vCol }}>Band {score >= 90 ? "90–100" : score >= 80 ? "80–89" : score >= 70 ? "70–79" : score >= 60 ? "60–69" : "<60"}</span>
        </div>

        {/* ── Metric chips ── */}
        <div className="ais-metrics">
          {[
            { label: "CIBIL SCORE", value: cibil, ok: cibilOk, warn: !cibilOk, sub: cibilOk ? "Good band" : "Deviation" },
            { label: "DBR / DTI",   value: dbr + "%", ok: dbrOk, warn: !dbrOk,   sub: dbrOk ? "Comfortable" : "Elevated" },
            { label: "LTV RATIO",   value: ltv + "%", ok: ltvOk, warn: !ltvOk,   sub: ltvOk ? "Conservative" : "Moderate" },
          ].map((m, i) => {
            const mc = m.ok ? "var(--c-green)" : "var(--c-amber)";
            return (
              <div key={i} className="ais-metric" style={{ borderColor: `oklch(from ${mc} l c h / 0.28)`, background: `oklch(from ${mc} l c h / 0.07)` }}>
                <span className="ais-metric-label">{m.label}</span>
                <span className="ais-metric-value" style={{ color: mc }}>{m.value}</span>
                <span className="ais-metric-sub" style={{ color: mc }}>{m.ok ? "✓" : "⚠"} {m.sub}</span>
              </div>
            );
          })}
        </div>

        {/* ── Key findings ── */}
        <div className="ais-findings">
          <span className="ais-findings-label">KEY FINDINGS</span>
          {findings.slice(0, 5).map((f, i) => {
            const fc = f.type === "good" ? "var(--c-green)" : f.type === "doc" ? "var(--accent)" : "var(--c-amber)";
            const icon = f.type === "good" ? "✓" : f.type === "doc" ? "📄" : "⚠";
            return (
              <div key={i} className="ais-finding-row">
                <span className="ais-finding-icon" style={{ color: fc }}>{icon}</span>
                <span className="ais-finding-text" style={{ color: f.type === "good" ? "var(--text-2)" : "var(--text-1)" }}>{f.text}</span>
              </div>
            );
          })}
        </div>

        {/* ── CTA ── */}
        <div className="ais-cta-row">
          <div className="ais-cta-btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
              <circle cx="9" cy="12" r="1" fill="currentColor"/>
              <circle cx="12" cy="12" r="1" fill="currentColor"/>
              <circle cx="15" cy="12" r="1" fill="currentColor"/>
            </svg>
            Ask AI Analyst
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════
     RESPONSE GENERATORS
  ══════════════════════════════════════════════════════════════ */
  function genWelcome(app) {
    const sc = app.scorecard || {};
    const score = sc.score || app.compositeScore || 0;
    return `Hi! I'm your AI Credit Analyst for **${app.name}'s** application.\n\nComposite score is **${score}/100** — ${sc.decisionLabel || "decision pending"}. I have full visibility into the bureau data, income assessment, property details, documents, and all policy deviations.\n\nWhat would you like to dig into?`;
  }
  function genScoreExplanation(app) {
    const sc = app.scorecard || {};
    const cats = sc.categories || [];
    const score = sc.score || app.compositeScore || 0;
    const weak   = cats.filter(c => c.pct < 75).sort((a, b) => a.pct - b.pct);
    const strong = cats.filter(c => c.pct >= 80);
    return `**Score: ${score}/100 — ${score >= 80 ? "Good" : score >= 70 ? "Moderate" : "Below average"}**\n\n**What's dragging the score down:**\n${weak.map(c => `  • ${c.label}: ${c.achieved}/${c.maxPts} (${c.pct}%)`).join("\n") || "  None — all categories strong."}\n\n**What's holding it up:**\n${strong.map(c => `  • ${c.label}: ${c.achieved}/${c.maxPts} (${c.pct}%) ✓`).join("\n") || "  No category above 80%."}\n\n**NSTP trigger:** ${(app.flags || []).join(", ") || "None"}\n\nThe biggest improvement lever is the CIBIL bureau score — if it crosses 700, the NSTP requirement drops and the composite score would climb roughly 8–10 points.`;
  }
  function genDocumentStatus(app) {
    const docs = app.documents || {};
    const s = docs.summary || {};
    const missing = (docs.groups || []).flatMap(g => (g.items || []).filter(i => i.status === "Missing").map(i => `  • **[${g.label}]** ${i.name}${i.remarks ? "\n    ↳ " + i.remarks : ""}`));
    const conditional = (docs.groups || []).flatMap(g => (g.items || []).filter(i => i.status === "Conditional").map(i => `  • [${g.label}] ${i.name}`));
    return `**Document Completion: ${s.completionPct || 0}%** (${s.received || 0}/${s.required || 0} required docs received)\n\n**Missing (${missing.length}):**\n${missing.length ? missing.join("\n") : "  ✓ None missing."}\n\n**Conditional (${conditional.length}):**\n${conditional.length ? conditional.join("\n") : "  None."}\n\n**Critical path:** The legal search report is the longest-lead item — currently at 307 days processing. Disbursement cannot proceed until title is cleared.`;
  }
  function genBureauAnalysis(app) {
    const sc = app.scorecard || {};
    const cat = (sc.categories || []).find(c => c.id === "bureau") || {};
    return `**Bureau Analysis — CIBIL ${app.cibilScore}**\n\n**Score category:** ${cat.achieved || "—"}/${cat.maxPts || 25} (${cat.pct || 0}%)\n\n**CIBIL ${app.cibilScore}** falls in the 650–700 deviation band. Policy requires 700+ for clean approval; this triggers Rule APPLICANT_CIBIL_002 → NCM NSTP L_4.\n\n**Associated issues:**\n  • Max DPD last 12M: 5 days (preferred: 0)\n  • CC / KCC overdue: ₹35,000 (preferred: zero)\n  • CMR rank: 9 (HUF entity — higher risk tier)\n\n**What's good:**\n  • Enquiry count last 6M: only 1 — not credit hungry\n  • No derogatory or written-off accounts\n  • No suit filed / wilful default\n\n**Recommended action:** Obtain CC overdue closure certificate. Post-clearance, the effective bureau score impression improves significantly.`;
  }
  function genIncomeAnalysis(app) {
    const sc = app.scorecard || {};
    const cat = (sc.categories || []).find(c => c.id === "income") || {};
    const dbr = Math.round((app.dbr || 0) * 100);
    return `**Income & Repayment Analysis**\n\n**Income score:** ${cat.achieved || "—"}/${cat.maxPts || 25} (${cat.pct || 0}%)\n**DBR / DTI: ${dbr}%** — ${dbr <= 40 ? "✓ comfortable" : dbr <= 55 ? "⚠ elevated but within 55% policy cap" : "✗ exceeds policy"}\n\n**Income breakdown:**\n  • NMI: ₹81,449/month (SEP — ITR / P&L basis)\n  • Final EMI: ₹34,234/month\n  • Total obligations: ₹1,02,600/month\n  • Avg monthly bank credits: ₹1,02,451 (3.0× EMI ✓)\n\n**Key concern:** Turnover dipped 28% YoY (₹2.65 Cr → ₹1.90 Cr). Policy flags dips > 20%. Applicant should provide a written explanation — if one-off (post-COVID recovery, restructuring), a credit note is typically acceptable.\n\n**Positive:** 13.98-year business vintage far exceeds the 3-year minimum for SEP segment.`;
  }
  function genPropertyAnalysis(app) {
    const sc = app.scorecard || {};
    const cat = (sc.categories || []).find(c => c.id === "property") || {};
    const ltv = Math.round((app.ltv || 0) * 100);
    return `**Property & Collateral Analysis**\n\n**Property score:** ${cat.achieved || "—"}/${cat.maxPts || 20} (${cat.pct || 0}%)\n**LTV: ${ltv}%** — ${ltv <= 60 ? "✓ conservative" : ltv <= 70 ? "⚠ moderate — within 70% policy cap" : "✗ exceeds policy"}\n\n**Property details:**\n  • Type: Residential (Rented-out / Investment)\n  • Market value: ${fmt(Math.round(app.amount / (app.ltv || 0.65)))}\n  • Loan amount: ${fmt(app.amount)}\n  • Tier: C (Tier-2 city) — small score penalty vs Tier A/B\n\n**Status of reports:**\n  • Valuation: Received (476-day processing — verify if still current)\n  • Legal search: **PENDING** — 307 days, assigned to panel advocate\n\n**Risk:** Disbursement is legally blocked until legal search clears. Escalate to panel advocate immediately — this is the single biggest disbursement blocker.`;
  }
  function genDecisionAnalysis(app) {
    const sc = app.scorecard || {};
    const score = sc.score || app.compositeScore || 0;
    const flags = app.flags || [];
    const docs = app.documents || {};
    const missingCount = (docs.summary || {}).missing || 0;
    return `**Decision: ${sc.decisionLabel || (score >= 60 ? "APPROVE via NSTP" : "DECLINE")}**\n\n**Score:** ${score}/100  |  **Risk:** ${score >= 85 ? "LOW-MODERATE" : score >= 75 ? "MODERATE" : "HIGH"}\n\n**NSTP Authority:** ${score >= 80 ? "L_4 — National Credit Manager (NCM)" : score >= 70 ? "L_4 — National Credit Manager (NCM)" : "L_6 — Credit Committee"}\n\n**Pre-disbursement checklist:**\n${flags.map(f => `  ☐ Resolve: ${f}`).join("\n")}\n  ☐ Clear legal search report (critical blocker)\n  ☐ CC overdue ₹35K — obtain NOC from card issuer\n  ${missingCount > 0 ? `☐ Collect ${missingCount} missing document(s)` : "✓ All required documents received"}\n  ☐ NCM sign-off recorded in system\n  ☐ Applicant explanation for 28% turnover dip\n\n**Bottom line:** Application is approvable — all deviations are manageable with standard conditions. No knockout violations.`;
  }
  function genRiskAnalysis(app) {
    const flags = app.flags || [];
    const score = app.compositeScore || 0;
    const cats  = (app.scorecard || {}).categories || [];
    const weak  = cats.filter(c => c.pct < 70);
    return `**Risk Profile — ${score >= 80 ? "LOW-MODERATE" : score >= 70 ? "MODERATE" : "MODERATE-HIGH"}**\n\n**Active flags (${flags.length}):**\n${flags.length ? flags.map(f => "  ⚠ " + f).join("\n") : "  None."}\n\n**Below-threshold dimensions (${weak.length}):**\n${weak.map(c => `  • ${c.label}: ${c.pct}%`).join("\n") || "  All dimensions above 70%."}\n\n**Risk breakdown:**\n  • Credit risk: CIBIL 684 + DPD + CC overdue — manageable with conditions\n  • Income risk: 28% turnover dip — needs written explanation\n  • Legal/title risk: Search pending — **highest current risk**\n  • Fraud risk: Hunter negative, PAN verified — **low**\n\n**Mitigants:**\n  • 14-year SEP vintage — proven track record\n  • Residential property — strong marketability\n  • Low enquiry count — not credit-stressed`;
  }
  function genDefault(app) {
    return `I have full context on **${app.name}'s** application. Here's what I can help with:\n\n  • **Score** — Why ${app.compositeScore}/100 and what drives each dimension\n  • **Bureau** — CIBIL deviation, DPD, overdue analysis\n  • **Income** — DBR, turnover dip, repayment capacity\n  • **Documents** — Missing items and what's blocking disbursement\n  • **Property** — LTV, legal search status, valuation\n  • **Decision** — Pre-disbursement checklist and conditions\n  • **Risks** — All flags, deviations and mitigants\n\nJust ask — or pick a suggested question below.`;
  }
  function getDummyResponse(q, app) {
    const lq = q.toLowerCase();
    if (matchesAny(lq, ["summary","overview","tell","about","summarize"])) return genWelcome(app);
    if (matchesAny(lq, ["score","why","reason","low","composite","breakdown","band"])) return genScoreExplanation(app);
    if (matchesAny(lq, ["document","missing","pending","doc","paper"])) return genDocumentStatus(app);
    if (matchesAny(lq, ["bureau","cibil","credit","dpd","overdue","enquir","cmr"])) return genBureauAnalysis(app);
    if (matchesAny(lq, ["income","dbr","dti","repayment","salary","earning","turnover","cashflow","nmi"])) return genIncomeAnalysis(app);
    if (matchesAny(lq, ["property","ltv","collateral","legal","valuation","title","tier"])) return genPropertyAnalysis(app);
    if (matchesAny(lq, ["decision","approve","recommend","action","nstp","disburse","checklist","next"])) return genDecisionAnalysis(app);
    if (matchesAny(lq, ["risk","flag","deviation","concern","danger","worry"])) return genRiskAnalysis(app);
    return genDefault(app);
  }

  /* ══════════════════════════════════════════════════════════════
     RICH TEXT RENDERER
  ══════════════════════════════════════════════════════════════ */
  function RichText({ text }) {
    return (
      <span>
        {(text || "").split("\n").map((line, li, arr) => {
          const parts = line.split(/\*\*([^*]+)\*\*/g);
          return (
            <React.Fragment key={li}>
              {parts.map((p, pi) => pi % 2 === 1 ? <strong key={pi}>{p}</strong> : p)}
              {li < arr.length - 1 && <br />}
            </React.Fragment>
          );
        })}
      </span>
    );
  }

  /* ══════════════════════════════════════════════════════════════
     THINKING DOTS
  ══════════════════════════════════════════════════════════════ */
  function ThinkingDots() {
    return (
      <div className="aid-thinking">
        <div className="aid-avatar"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><circle cx="9" cy="12" r="1" fill="var(--accent)"/><circle cx="12" cy="12" r="1" fill="var(--accent)"/><circle cx="15" cy="12" r="1" fill="var(--accent)"/></svg></div>
        <div className="aid-bubble aid-bubble-thinking"><div className="aid-dots"><div className="aid-dot"/><div className="aid-dot"/><div className="aid-dot"/></div></div>
      </div>
    );
  }

  const SUGGESTIONS = [
    "Why is the score 75?",
    "What documents are missing?",
    "Explain the CIBIL deviation",
    "What's the income assessment?",
    "What are the key risks?",
    "What action is needed next?",
  ];

  /* ══════════════════════════════════════════════════════════════
     AI ANALYST DRAWER
  ══════════════════════════════════════════════════════════════ */
  function AIAnalystDrawer({ app, open, onClose, panelMode = false }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput]       = useState("");
    const [thinking, setThinking] = useState(false);
    const bottomRef = useRef(null);
    const inputRef  = useRef(null);

    /* seed welcome message when drawer first opens */
    useEffect(() => {
      if (!open || !app || messages.length > 0) return;
      setThinking(true);
      const t = setTimeout(() => {
        setMessages([{ role: "assistant", text: genWelcome(app) }]);
        setThinking(false);
      }, 700);
      return () => clearTimeout(t);
    }, [open]);

    useEffect(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, thinking]);

    /* close on Escape */
    useEffect(() => {
      if (!open) return;
      const handler = e => { if (e.key === "Escape") onClose(); };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }, [open]);

    function send(text) {
      const t = (text || input).trim();
      if (!t || thinking) return;
      setMessages(prev => [...prev, { role: "user", text: t }]);
      setInput("");
      setThinking(true);
      setTimeout(() => {
        setMessages(prev => [...prev, { role: "assistant", text: getDummyResponse(t, app) }]);
        setThinking(false);
        setTimeout(() => inputRef.current?.focus(), 60);
      }, 600 + Math.random() * 700);
    }

    if (!app) return null;

    return (
      <>
        {/* Backdrop — only in floating drawer mode */}
        {!panelMode && (
          <div
            className={"aid-backdrop" + (open ? " aid-backdrop-open" : "")}
            onClick={onClose}
          />
        )}

        {/* Drawer panel */}
        <div className={"aid-drawer" + (open ? " aid-drawer-open" : "") + (panelMode ? " aid-drawer-panel" : "")}>

          {/* Header */}
          <div className="aid-header">
            <div className="aid-header-left">
              <div className="aid-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                  <circle cx="9" cy="12" r="1" fill="var(--accent)"/>
                  <circle cx="12" cy="12" r="1" fill="var(--accent)"/>
                  <circle cx="15" cy="12" r="1" fill="var(--accent)"/>
                </svg>
              </div>
              <div>
                <div className="aid-title">AI Credit Analyst</div>
                <div className="aid-subtitle">{app.name} · {app.id}</div>
              </div>
            </div>
            <div className="aid-header-right">
              <span className="ai-badge">BETA</span>
              <button className="aid-close-btn" onClick={onClose} title="Close (Esc)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="aid-messages" data-testid="ai-messages">
            {messages.map((msg, i) => (
              <div key={i} className={"aid-msg aid-msg-" + msg.role}>
                {msg.role === "assistant" && (
                  <div className="aid-avatar">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                      <circle cx="9" cy="12" r="1" fill="var(--accent)"/><circle cx="12" cy="12" r="1" fill="var(--accent)"/><circle cx="15" cy="12" r="1" fill="var(--accent)"/>
                    </svg>
                  </div>
                )}
                <div
                  className="aid-bubble"
                  data-testid={msg.role === "assistant" ? "ai-response" : "ai-user-msg"}
                >
                  <RichText text={msg.text} />
                </div>
              </div>
            ))}
            {thinking && <ThinkingDots />}
            <div ref={bottomRef} />
          </div>

          {/* Suggested chips */}
          {messages.length <= 1 && !thinking && (
            <div className="aid-suggestions">
              {SUGGESTIONS.map((q, i) => (
                <button key={i} className="aid-chip" onClick={() => send(q)} data-testid="ai-chip">{q}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="aid-input-row">
            <input
              ref={inputRef}
              className="aid-input"
              data-testid="ai-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Ask about score, risks, documents, decision…"
              disabled={thinking}
            />
            <button
              className="aid-send-btn"
              data-testid="ai-send"
              onClick={() => send()}
              disabled={thinking || !input.trim()}
            >
              Send
            </button>
          </div>
        </div>
      </>
    );
  }

  /* ══════════════════════════════════════════════════════════════
     ROOT COMPONENT
  ══════════════════════════════════════════════════════════════ */
  function AIAssistant({ app }) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    if (!app) return null;
    return (
      <>
        <AISummaryCard app={app} onOpenDrawer={() => setDrawerOpen(true)} />
        <AIAnalystDrawer app={app} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </>
    );
  }

  /* Panel-mode wrapper — renders the chat drawer inline (no backdrop, no fixed position) */
  function AIAnalystPanel({ app, onClose }) {
    if (!app) return null;
    return <AIAnalystDrawer app={app} open={true} onClose={onClose || (() => {})} panelMode={true} />;
  }

  window.AIAssistant      = AIAssistant;
  window.AIAnalystPanel   = AIAnalystPanel;
})();
