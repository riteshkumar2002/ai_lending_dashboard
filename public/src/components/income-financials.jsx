// IncomeFinancialsPanel — premium "Income & Financials" analytics card
// Receives: { label, subGroups, app }

(function () {
  const { useState, useEffect } = React;

  /* ── helpers ───────────────────────────────────────────────────── */
  function getVal(rows, name) {
    const row = (rows || []).find(r => r.name === name);
    return row?.value || null;
  }

  function stripMonthly(str) {
    return (str || "").replace(/\s*\/\s*month\b.*/i, "").trim();
  }

  function parseAmount(str) {
    if (!str) return 0;
    const digits = str.replace(/[₹,\s]/g, "").replace(/[^0-9.]/g, "");
    return parseFloat(digits) || 0;
  }

  function dbrColor(pct) {
    if (pct < 30) return "var(--c-green)";
    if (pct < 40) return "var(--accent)";
    if (pct < 50) return "var(--c-amber)";
    return "var(--c-red)";
  }
  function dbrLabel(pct) {
    if (pct < 30) return "Healthy";
    if (pct < 40) return "Moderate";
    if (pct < 50) return "Elevated";
    return "High Risk";
  }
  function dbrIcon(pct) {
    return pct >= 30 ? "!" : "✓";
  }

  function bankingColor(val, warnAt, redAt) {
    if (val <= 0)       return "var(--text-1)";
    if (val < warnAt)   return "var(--c-green)";
    if (val < redAt)    return "var(--c-amber)";
    return "var(--c-red)";
  }

  /* ── DBR radial gauge ──────────────────────────────────────────── */
  function DBRGauge({ pct }) {
    const [filled, setFilled] = useState(0);
    useEffect(() => {
      const t = setTimeout(() => setFilled(Math.min(100, Math.max(0, pct))), 120);
      return () => clearTimeout(t);
    }, [pct]);

    const clr   = dbrColor(pct);
    const lbl   = dbrLabel(pct);
    const icon  = dbrIcon(pct);
    const r     = 28;
    const cx    = 38; const cy = 38;
    const circ  = 2 * Math.PI * r;
    const offset = circ * (1 - filled / 100);

    return (
      <div className="if-gauge-wrap">
        <svg width="76" height="76" viewBox="0 0 76 76" style={{ display: "block" }}>
          {/* track */}
          <circle cx={cx} cy={cy} r={r} fill="none"
            stroke="var(--bg-3)" strokeWidth="6.5" />
          {/* progress */}
          <circle cx={cx} cy={cy} r={r} fill="none"
            stroke={clr} strokeWidth="6.5"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{
              transition: "stroke-dashoffset 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              filter: `drop-shadow(0 0 5px ${clr}80)`,
            }}
          />
          {/* percent */}
          <text x={cx} y={cy - 4} textAnchor="middle"
            fill="var(--text-1)" fontSize="13" fontWeight="700"
            fontFamily="'JetBrains Mono', monospace">
            {pct}%
          </text>
          {/* label */}
          <text x={cx} y={cy + 9} textAnchor="middle"
            fill={clr} fontSize="6.5" fontWeight="700" letterSpacing="0.08em">
            DBR/DTI
          </text>
        </svg>
        {/* risk badge */}
        <div className="if-risk-badge" style={{
          color: clr,
          background: `oklch(from ${clr === "var(--c-amber)" ? "#EAB308" : clr === "var(--c-red)" ? "#EF4444" : clr === "var(--c-green)" ? "#22C55E" : "#6366f1"} 0.5 0.2 0 / 0.12)`,
          border: `1px solid oklch(from ${clr === "var(--c-amber)" ? "#EAB308" : clr === "var(--c-red)" ? "#EF4444" : clr === "var(--c-green)" ? "#22C55E" : "#6366f1"} 0.5 0.2 0 / 0.30)`,
        }}>
          <span style={{ fontSize: 9, fontWeight: 800 }}>{icon}</span>
          {lbl}
        </div>
      </div>
    );
  }

  /* ── income chip ───────────────────────────────────────────────── */
  function IncomeChip({ label }) {
    return (
      <span className="if-income-chip">
        {label.replace(/_/g, " ")}
      </span>
    );
  }

  /* ── AMC vs EMI ────────────────────────────────────────────────── */
  function AmcVsEmi({ amc, emi, coverage }) {
    const coverageNum = parseFloat(coverage);
    const cvgColor = coverageNum >= 3 ? "var(--c-green)" : coverageNum >= 2 ? "var(--c-amber)" : "var(--c-red)";

    return (
      <div className="if-amc-section">
        <div className="if-amc-header">
          <span className="if-section-label" style={{ marginBottom: 0 }}>AMC vs Proposed EMI</span>
          <span className="if-coverage-badge" style={{
            color: cvgColor,
            background: "oklch(from var(--c-green) l c h / 0.10)",
            border: "1px solid oklch(from var(--c-green) l c h / 0.28)",
          }}>
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{ flexShrink: 0 }}>
              <path d="M1.5 4.8l1.8 1.8L7.5 2" stroke="currentColor" strokeWidth="1.6"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {coverageNum.toFixed(1)}x coverage
          </span>
        </div>

        <div className="if-amc-row">
          {/* AMC box */}
          <div className="if-amc-box">
            <div className="if-amc-box-label">Avg Monthly Credits</div>
            <div className="if-amc-box-value">{amc}</div>
          </div>

          {/* Arrow */}
          <div className="if-amc-arrow">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="var(--text-4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6"/>
            </svg>
          </div>

          {/* EMI box */}
          <div className="if-emi-box">
            <div className="if-emi-box-label">Proposed EMI</div>
            <div className="if-emi-box-value">{emi}</div>
          </div>
        </div>
      </div>
    );
  }

  /* ── banking metric ─────────────────────────────────────────────── */
  function BankMetric({ label, value, color, last }) {
    return (
      <>
        <div className="if-bank-metric">
          <div className="if-bank-metric-label">{label}</div>
          <div className="if-bank-metric-value" style={{ color }}>
            {value}
          </div>
        </div>
        {!last && <div className="if-bank-sep" />}
      </>
    );
  }

  /* ── KV row ────────────────────────────────────────────────────── */
  function KVRow({ label, value, highlight, mono, isLast }) {
    const valColor = highlight === "red"   ? "var(--c-red)"
                   : highlight === "amber" ? "var(--c-amber)"
                   : highlight === "green" ? "var(--c-green)"
                   : "var(--text-1)";
    return (
      <div className="if-kv-row"
        style={{ borderBottom: isLast ? "none" : "1px solid var(--bg-3)" }}>
        <span className="if-kv-label">{label}</span>
        <span className="if-kv-value" style={{
          color: valColor,
          fontFamily: mono ? "var(--font-mono)" : "inherit",
          fontWeight: highlight ? 600 : 500,
        }}>
          {value || "—"}
        </span>
      </div>
    );
  }

  /* ── main panel ─────────────────────────────────────────────────── */
  function IncomeFinancialsPanel({ label, subGroups, app }) {
    const [hovered, setHovered] = useState(false);

    const incomeRows = (subGroups || []).find(g => /income assessment/i.test(g.label))?.rows || [];
    const bankRows   = (subGroups || []).find(g => /banking/i.test(g.label))?.rows           || [];

    /* income values */
    const nmiRaw      = getVal(incomeRows, "Net Monthly Income (NMI)")         || "₹81,449 / month";
    const annualRaw   = getVal(incomeRows, "Total Eligible Income (Annual)")   || "₹9,77,389";
    const program     = getVal(incomeRows, "Income Program Applied")            || "CROSS_SELL_BT";
    const obligRaw    = getVal(incomeRows, "Total Monthly Obligation")          || "₹1,02,600 / month";
    const dbrRaw      = getVal(incomeRows, "DBR / DTI Ratio")                   || "42.0%";
    const finalEMIRaw = getVal(incomeRows, "Final EMI (Proposed)")              || "₹34,234";
    const multiplier  = getVal(incomeRows, "Income Multiplier Applied")         || "25x (SEP category)";

    /* banking values */
    const amcRaw      = getVal(bankRows, "Avg Monthly Credits (AMC)")          || "₹1,02,451 / month";
    const numAccounts = getVal(bankRows, "Number of Bank Accounts")             || "3";
    const chequeRet   = getVal(bankRows, "Cheque Returns (L6M)")               || "5";
    const bounces     = getVal(bankRows, "Bounce / NSF Count (L6M)")           || "2";

    /* cleaned display values */
    const nmiDisplay  = stripMonthly(nmiRaw);
    const amcDisplay  = stripMonthly(amcRaw);
    const obligDisp   = stripMonthly(obligRaw);

    /* derived */
    const dbrPct      = parseFloat(dbrRaw) || 42;
    const amcNum      = parseAmount(amcRaw);
    const emiNum      = parseAmount(finalEMIRaw);
    const coverageRatio = emiNum > 0 ? (amcNum / emiNum) : 3.0;

    const bouncesN  = parseInt(bounces)  || 0;
    const returnsN  = parseInt(chequeRet) || 0;
    const accountsN = parseInt(numAccounts) || 0;

    const obligColor = dbrPct >= 40 ? "red" : dbrPct >= 30 ? "amber" : "green";

    return (
      <div
        className="if-card"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          boxShadow: hovered
            ? "0 10px 36px oklch(0 0 0 / 0.22), 0 0 0 1px var(--bg-3-strong)"
            : "0 2px 14px oklch(0 0 0 / 0.10)",
          transform: hovered ? "translateY(-2px)" : "none",
        }}
      >
        {/* ── Header ───────────────────────────────────────── */}
        <div className="if-header">
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div className="if-icon-box">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="var(--accent)" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v2m0 8v2M9.17 9.17A3 3 0 0112 8a3 3 0 010 6 3 3 0 01-2.83-2"/>
              </svg>
            </div>
            <div>
              <div className="if-card-title">Income &amp; Financials</div>
              <div className="if-card-sub">Repayment Capacity · DBR · Banking Behaviour</div>
            </div>
          </div>
          <span className="if-section-badge">SECTION 03</span>
        </div>

        <div className="if-rule" />

        {/* ── Body ─────────────────────────────────────────── */}
        <div className="if-body">

          {/* ── Income + Gauge row ─────────────────────────── */}
          <div className="if-income-row">
            <div className="if-income-left">
              <div className="if-section-label">Net Monthly Income</div>
              <div className="if-income-amount">{nmiDisplay}</div>
              <div className="if-income-annual">
                <span className="if-annual-value">{annualRaw}</span>
                <span className="if-annual-label">&nbsp;annual</span>
              </div>
              <div className="if-chips">
                <IncomeChip label={program} />
              </div>
            </div>

            <DBRGauge pct={dbrPct} />
          </div>

          <div className="if-divider" />

          {/* ── AMC vs EMI ─────────────────────────────────── */}
          <AmcVsEmi
            amc={amcDisplay}
            emi={finalEMIRaw}
            coverage={coverageRatio.toFixed(1)}
          />

          <div className="if-divider" />

          {/* ── Banking metrics ─────────────────────────────── */}
          <div className="if-banking-section">
            <div className="if-section-label">Banking</div>
            <div className="if-bank-metrics-row">
              <BankMetric
                label="Bank Accounts"
                value={accountsN}
                color="var(--text-1)"
              />
              <BankMetric
                label="Bounces L6M"
                value={bouncesN}
                color={bankingColor(bouncesN, 3, 5)}
              />
              <BankMetric
                label="Cheque Returns"
                value={returnsN}
                color={bankingColor(returnsN, 3, 6)}
                last
              />
            </div>
          </div>

          <div className="if-divider" />

          {/* ── Obligations ─────────────────────────────────── */}
          <div className="if-obligations">
            <div className="if-section-label">Obligations</div>
            {[
              { label: "Total Monthly Obligation", value: obligDisp, highlight: obligColor },
              { label: "Income Multiplier Applied", value: multiplier },
              { label: "DBR / DTI Ratio",           value: dbrRaw,     highlight: obligColor },
              { label: "Final EMI (Proposed)",       value: finalEMIRaw, mono: true },
            ].map((r, i, arr) => (
              <KVRow key={i} {...r} isLast={i === arr.length - 1} />
            ))}
          </div>

        </div>
      </div>
    );
  }

  window.IncomeFinancialsPanel = IncomeFinancialsPanel;
})();
