// portfolio.jsx — Senior Underwriter · Portfolio Risk Monitor
// Exported: window.PortfolioView

(function () {

  /* ── Aggregate KPIs (portfolio-level synthetic) ─────────────── */
  const PORTFOLIO_KPI = {
    avgCibil: 731,
    warnings: { total: 18, high: 5, medium: 13 },
    retailNpa: 1.8,
    smeCollection: 96.4,
  };

  const CIBIL_BANDS = [
    { label: "< 600",   count: 8,  pct: 5,  color: "var(--c-red)" },
    { label: "600–700", count: 42, pct: 28, color: "var(--c-amber)" },
    { label: "700–750", count: 58, pct: 38, color: "var(--accent)" },
    { label: "750–800", count: 32, pct: 21, color: "oklch(0.60 0.12 200)" },
    { label: "800+",    count: 11, pct: 8,  color: "var(--c-green)" },
  ];

  const COLLECT_SEGS = [
    { label: "Auto-Serve",  pct: 32, count: 48, desc: "Risk score < 300", color: "var(--c-green)" },
    { label: "Light Touch", pct: 41, count: 62, desc: "Score 300–500",    color: "oklch(0.60 0.12 200)" },
    { label: "High Touch",  pct: 21, count: 32, desc: "Score 500–700",    color: "var(--c-amber)" },
    { label: "Legal",       pct: 6,  count: 9,  desc: "Score > 700",      color: "var(--c-red)" },
  ];

  /* ── Derive early-warning rows from APPLICATIONS data ───────── */
  function buildWarnings() {
    return (window.APPLICATIONS || [])
      .filter(a => a.flags.length > 0)
      .map(a => {
        const sev = a.risk >= 0.55 ? "High" : a.risk >= 0.28 ? "Medium" : "Low";
        const act = a.risk >= 0.55 ? "Visit" : a.risk >= 0.28 ? "Call RM" : a.risk >= 0.18 ? "Soft Call" : "Monitor";
        return { ...a, severity: sev, action: act, signal: a.flags[0] };
      })
      .sort((a, b) => b.risk - a.risk);
  }

  /* ── Small helper components ────────────────────────────────── */
  function SeverityBadge({ level }) {
    const map = {
      High:   { color: "var(--c-red)",   bg: "oklch(from var(--c-red)   l c h / 0.12)", border: "oklch(from var(--c-red)   l c h / 0.30)" },
      Medium: { color: "var(--c-amber)", bg: "oklch(from var(--c-amber) l c h / 0.12)", border: "oklch(from var(--c-amber) l c h / 0.30)" },
      Low:    { color: "var(--c-green)", bg: "oklch(from var(--c-green) l c h / 0.12)", border: "oklch(from var(--c-green) l c h / 0.30)" },
    };
    const s = map[level] || map.Low;
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 999, border: `1px solid ${s.border}`, background: s.bg, color: s.color, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.color, display: "inline-block", flexShrink: 0 }} />
        {level}
      </span>
    );
  }

  function ActionBtn({ label }) {
    const map = {
      "Monitor":   { bg: "var(--bg-2)",                                    color: "var(--text-2)", border: "var(--bg-3)" },
      "Soft Call": { bg: "oklch(from var(--accent)   l c h / 0.10)",       color: "var(--accent)", border: "oklch(from var(--accent)   l c h / 0.30)" },
      "Call RM":   { bg: "oklch(from var(--c-amber) l c h / 0.10)",        color: "var(--c-amber)", border: "oklch(from var(--c-amber) l c h / 0.30)" },
      "Visit":     { bg: "oklch(from var(--c-red)   l c h / 0.10)",        color: "var(--c-red)",   border: "oklch(from var(--c-red)   l c h / 0.30)" },
    };
    const s = map[label] || map["Monitor"];
    return (
      <button style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: "var(--r-sm)", padding: "4px 11px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", transition: "opacity 0.1s" }}
        onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
        onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
        {label}
      </button>
    );
  }

  /* ── Segmented horizontal bar ───────────────────────────────── */
  function SegBar({ segments }) {
    return (
      <div style={{ display: "flex", height: 30, borderRadius: "var(--r-md)", overflow: "hidden", gap: 2 }}>
        {segments.map(s => (
          <div key={s.label} title={`${s.label}: ${s.count} (${s.pct}%)`}
            style={{ flex: s.pct, background: s.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {s.pct >= 10 && (
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--bg-1)", fontFamily: "var(--font-mono)", lineHeight: 1 }}>
                {s.pct}%
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  /* ── Main view ──────────────────────────────────────────────── */
  function PortfolioView() {
    const warnings = buildWarnings();

    return (
      <main className="port-pane">

        {/* Page header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--accent)", fontWeight: 600 }}>Senior Underwriter</div>
            <h1 style={{ margin: "3px 0 2px", fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-1)", lineHeight: 1.2 }}>
              Portfolio Risk Monitor
            </h1>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>
              Live view · Updated Apr 27, 2026 09:14 IST · 151 active accounts
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0, paddingTop: 4 }}>
            <button className="ing-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              Export
            </button>
            <button className="ing-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6h16M4 12h10M4 18h6" />
              </svg>
              Filter
            </button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="port-kpi-strip">
          <div className="port-kpi">
            <div className="port-kpi-l">Avg CIBIL Score</div>
            <div className="port-kpi-v">{PORTFOLIO_KPI.avgCibil}</div>
            <div className="port-kpi-sub">Portfolio average · 151 accounts</div>
          </div>
          <div className="port-kpi">
            <div className="port-kpi-l">Early Warnings</div>
            <div className="port-kpi-v" style={{ color: "var(--c-amber)" }}>{PORTFOLIO_KPI.warnings.total}</div>
            <div className="port-kpi-sub">{PORTFOLIO_KPI.warnings.high} High · {PORTFOLIO_KPI.warnings.medium} Medium</div>
          </div>
          <div className="port-kpi">
            <div className="port-kpi-l">Retail NPA Rate</div>
            <div className="port-kpi-v" style={{ color: "var(--c-green)" }}>{PORTFOLIO_KPI.retailNpa}%</div>
            <div className="port-kpi-sub" style={{ color: "var(--c-green)" }}>↓ vs 2.1% prior month</div>
          </div>
          <div className="port-kpi">
            <div className="port-kpi-l">SME Collection Rate</div>
            <div className="port-kpi-v" style={{ color: "var(--c-green)" }}>{PORTFOLIO_KPI.smeCollection}%</div>
            <div className="port-kpi-sub">Target 95.0% · On track</div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="port-two-col">

          {/* Left: charts */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* CIBIL distribution */}
            <div className="port-card">
              <div className="port-card-head">
                <div className="port-card-title">CIBIL Score Distribution</div>
                <div className="port-card-eyebrow">151 accounts</div>
              </div>
              <SegBar segments={CIBIL_BANDS} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {CIBIL_BANDS.map(b => (
                  <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: b.color, display: "inline-block", flexShrink: 0 }} />
                    <span style={{ flex: 1, color: "var(--text-2)" }}>{b.label}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--text-1)", minWidth: 24, textAlign: "right" }}>{b.count}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)", minWidth: 30, textAlign: "right" }}>{b.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Collection segmentation */}
            <div className="port-card">
              <div className="port-card-head">
                <div className="port-card-title">Collection Score Segmentation</div>
                <div className="port-card-eyebrow">Active delinquencies</div>
              </div>
              <SegBar segments={COLLECT_SEGS} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {COLLECT_SEGS.map(s => (
                  <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, display: "inline-block", flexShrink: 0 }} />
                    <span style={{ flex: 1, color: "var(--text-1)", fontWeight: 500 }}>{s.label}</span>
                    <span style={{ color: "var(--text-3)", fontSize: 10.5 }}>{s.desc}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--text-1)", minWidth: 24, textAlign: "right" }}>{s.count}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)", minWidth: 30, textAlign: "right" }}>{s.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Early warning table */}
          <div className="port-card port-card-scroll">
            <div className="port-card-head">
              <div className="port-card-title">Early Warning Signals</div>
              <div className="port-card-eyebrow">{warnings.length} flagged in queue</div>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Borrower", "CIBIL", "Severity", "Signal", "Product", "Action"].map(h => (
                      <th key={h} style={{ textAlign: "left", fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-3)", fontWeight: 500, padding: "0 8px 10px", borderBottom: "1px solid var(--bg-3)", whiteSpace: "nowrap", position: "sticky", top: 0, background: "var(--bg-1)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {warnings.map((a, idx) => (
                    <tr key={a.id} style={{ borderBottom: idx < warnings.length - 1 ? "1px solid var(--bg-3)" : "none", transition: "background 0.08s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--bg-2)"}
                      onMouseLeave={e => e.currentTarget.style.background = ""}>
                      <td style={{ padding: "10px 8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--accent-faint)", color: "var(--accent-strong)", display: "grid", placeItems: "center", fontSize: 10.5, fontWeight: 700, flexShrink: 0, letterSpacing: "-0.02em" }}>
                            {a.initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--text-1)", fontSize: 12.5, lineHeight: 1.2 }}>{a.name}</div>
                            <div style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{a.id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "10px 8px", fontFamily: "var(--font-mono)", fontFeatureSettings: '"tnum"', fontWeight: 600, color: "var(--text-1)", fontSize: 13 }}>
                        {a.score}
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        <SeverityBadge level={a.severity} />
                      </td>
                      <td style={{ padding: "10px 8px", color: "var(--text-2)", fontSize: 11.5, maxWidth: 160 }}>
                        {a.signal}
                      </td>
                      <td style={{ padding: "10px 8px", color: "var(--text-3)", fontSize: 11, whiteSpace: "nowrap" }}>
                        {a.product}
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        <ActionBtn label={a.action} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    );
  }

  window.PortfolioView = PortfolioView;
})();
