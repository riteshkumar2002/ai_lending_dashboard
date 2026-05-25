// PropertyDetailsPanel — premium "Property Details" analytics card
// Receives: { label, subGroups, app }

(function () {
  const { useState, useEffect } = React;

  /* ── LTV thresholds ────────────────────────────────────────────── */
  function ltvMeta(pct) {
    if (pct < 50) return { label: "Strong",   hex: "#22C55E", icon: "✓" };
    if (pct <= 65) return { label: "Moderate", hex: "#EAB308", icon: "!" };
    return          { label: "High Risk",  hex: "#EF4444", icon: "✗" };
  }

  /* ── tier meta ─────────────────────────────────────────────────── */
  function tierMeta(tier) {
    if (/tier.?1|^A$/i.test(tier)) return { hex: "#22C55E", icon: null };
    if (/tier.?2|^B$/i.test(tier)) return { hex: "#EAB308", icon: "!" };
    return                                 { hex: "#EF4444", icon: "✗" };
  }

  /* ── property type color ───────────────────────────────────────── */
  function propTypeMeta(type) {
    if (/residential/i.test(type)) return { hex: "#22C55E" };
    if (/commercial/i.test(type))  return { hex: "#EAB308" };
    return                                { hex: "#94A3B8" };
  }

  function getVal(rows, name) {
    return (rows || []).find(r => r.name === name)?.value || null;
  }

  /* ── animated donut LTV gauge ─────────────────────────────────── */
  function LTVGauge({ pct }) {
    const [filled, setFilled] = useState(0);
    useEffect(() => {
      const t = setTimeout(() => setFilled(Math.min(100, Math.max(0, pct))), 120);
      return () => clearTimeout(t);
    }, [pct]);

    const meta  = ltvMeta(pct);
    const r     = 36;
    const cx    = 48; const cy = 48;
    const circ  = 2 * Math.PI * r;
    const offset = circ * (1 - filled / 100);

    return (
      <div className="pd-gauge-wrap">
        <svg width="96" height="96" viewBox="0 0 96 96" style={{ display: "block" }}>
          {/* track */}
          <circle cx={cx} cy={cy} r={r} fill="none"
            stroke="var(--bg-3)" strokeWidth="8" />
          {/* filled arc */}
          <circle cx={cx} cy={cy} r={r} fill="none"
            stroke={meta.hex} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{
              transition: "stroke-dashoffset 0.95s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              filter: `drop-shadow(0 0 6px ${meta.hex}55)`,
            }}
          />
          {/* pct text */}
          <text x={cx} y={cy - 5} textAnchor="middle"
            fill="var(--text-1)" fontSize="16" fontWeight="800"
            fontFamily="'JetBrains Mono', monospace" letterSpacing="-0.5">
            {pct}%
          </text>
          {/* LTV label */}
          <text x={cx} y={cy + 10} textAnchor="middle"
            fill="var(--text-4)" fontSize="8" fontWeight="700" letterSpacing="0.08em">
            LTV
          </text>
        </svg>
        {/* badge */}
        <div className="pd-ltv-badge" style={{
          color: meta.hex,
          background: `${meta.hex}1c`,
          border: `1px solid ${meta.hex}45`,
        }}>
          <span style={{ fontWeight: 800, fontSize: 10 }}>{meta.icon}</span>
          {meta.label}
        </div>
      </div>
    );
  }

  /* ── valuation card ────────────────────────────────────────────── */
  function ValCard({ sublabel, amount, accent }) {
    return (
      <div className="pd-val-card" style={accent ? {
        background: "oklch(from var(--accent) l c h / 0.08)",
        border: "1px solid oklch(from var(--accent) l c h / 0.28)",
      } : {
        background: "var(--bg-2)",
        border: "1px solid var(--bg-3)",
      }}>
        <div className="pd-val-sublabel" style={{ color: accent ? "var(--accent)" : "var(--text-4)" }}>
          {sublabel}
        </div>
        <div className="pd-val-amount" style={{ color: accent ? "var(--accent-strong)" : "var(--text-1)" }}>
          {amount}
        </div>
      </div>
    );
  }

  /* ── LTV progress bar ──────────────────────────────────────────── */
  function LTVBar({ pct }) {
    const [w, setW] = useState(0);
    useEffect(() => {
      const t = setTimeout(() => setW(Math.min(100, Math.max(0, pct))), 150);
      return () => clearTimeout(t);
    }, [pct]);

    const meta = ltvMeta(pct);

    return (
      <div className="pd-bar-section">
        <div className="pd-bar-header">
          <span className="pd-bar-label">LTV RATIO</span>
          <span className="pd-bar-value" style={{ color: meta.hex }}>
            {pct}% — {meta.label}
          </span>
        </div>
        <div className="pd-bar-track">
          <div className="pd-bar-fill" style={{
            width: `${w}%`,
            background: meta.hex,
            boxShadow: `0 0 8px ${meta.hex}55`,
            transition: "width 0.95s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          }} />
          {/* policy guideline at 65% */}
          <div className="pd-bar-marker" style={{ left: "65%" }} />
        </div>
        <div className="pd-bar-endpoints">
          <span>0%</span>
          <span className="pd-bar-guideline-label">Policy 65%</span>
          <span>100%</span>
        </div>
      </div>
    );
  }

  /* ── KV row ─────────────────────────────────────────────────────── */
  function KVRow({ label, value, highlight, mono, isLast }) {
    const valColor = highlight === "green" ? "var(--c-green)"
                   : highlight === "amber" ? "var(--c-amber)"
                   : highlight === "red"   ? "var(--c-red)"
                   : "var(--text-1)";
    return (
      <div className="pd-kv-row"
        style={{ borderBottom: isLast ? "none" : "1px solid var(--bg-3)" }}>
        <span className="pd-kv-label">{label}</span>
        <span className="pd-kv-value" style={{
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
  function PropertyDetailsPanel({ label, subGroups, app }) {
    const [hovered, setHovered] = useState(false);

    const rows = (subGroups || []).find(g => /property/i.test(g.label))?.rows || [];

    const propType    = getVal(rows, "Property Type")                      || "Residential";
    const propSubType = getVal(rows, "Property Sub-Type")                  || "Rented-out (Investment Property)";
    const tierRaw     = getVal(rows, "Tier Location")                      || "C (Tier 2 City)";
    const marketVal   = getVal(rows, "Min Market Value")                   || "₹57.4L";
    const loanAmt     = getVal(rows, "Loan Amount")                        || "₹37.3L";
    const ltvRaw      = getVal(rows, "LTV Ratio (Policy)")                 || "65%";
    const maxLoan     = getVal(rows, "Max Loan by LTV (₹57.4L × 65%)")    || getVal(rows, "Max Loan by LTV") || "₹37.3L";

    const ltvPct      = parseFloat(ltvRaw) || 65;
    const ltvM        = ltvMeta(ltvPct);
    const tierM       = tierMeta(tierRaw);
    const typeM       = propTypeMeta(propType);

    /* Tier display — strip leading "C " if present for cleaner chip */
    const tierDisplay = tierRaw.replace(/^[A-Za-z]\s+/, "").trim() || tierRaw;

    return (
      <div
        className="pd-card"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          boxShadow: hovered
            ? "0 10px 36px oklch(0 0 0 / 0.22), 0 0 0 1px var(--bg-3-strong)"
            : "0 2px 14px oklch(0 0 0 / 0.10)",
          transform: hovered ? "translateY(-2px)" : "none",
        }}
      >
        {/* ── Header ──────────────────────────────────────── */}
        <div className="pd-header">
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div className="pd-icon-box">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="var(--accent)" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div>
              <div className="pd-card-title">Property Details</div>
              <div className="pd-card-sub">Collateral · LTV · Valuation · Risk Tier</div>
            </div>
          </div>
          <span className="pd-section-badge">SECTION 05</span>
        </div>

        <div className="pd-rule" />

        {/* ── Body ────────────────────────────────────────── */}
        <div className="pd-body">

          {/* ── Classification chips + subtitle ─────────── */}
          <div className="pd-classify-section">
            <div className="pd-chips-row">
              {/* Property type chip */}
              <span className="pd-chip" style={{
                color: typeM.hex,
                background: `${typeM.hex}1c`,
                border: `1px solid ${typeM.hex}45`,
              }}>
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M1 4.5l1.4 1.4L7 2"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {propType}
              </span>
              {/* Tier chip */}
              <span className="pd-chip" style={{
                color: tierM.hex,
                background: `${tierM.hex}1c`,
                border: `1px solid ${tierM.hex}45`,
              }}>
                {tierM.icon && <span style={{ fontWeight: 800 }}>{tierM.icon}</span>}
                {tierRaw}
              </span>
            </div>
            <div className="pd-subtype-text">{propSubType}</div>
          </div>

          <div className="pd-divider" />

          {/* ── LTV gauge + valuation cards ─────────────── */}
          <div className="pd-main-row">
            <LTVGauge pct={ltvPct} />

            <div className="pd-val-col">
              <ValCard sublabel="MARKET VALUE" amount={marketVal} accent={false} />
              <ValCard sublabel="LOAN AMOUNT"  amount={loanAmt}  accent={true}  />
            </div>
          </div>

          <div className="pd-divider" />

          {/* ── KV details ───────────────────────────────── */}
          <div className="pd-details-section">
            <div className="pd-section-label">Collateral Details</div>
            {[
              { label: "Loan Coverage (LTV)",    value: ltvRaw,      highlight: ltvPct > 65 ? "red" : ltvPct >= 50 ? "amber" : "green" },
              { label: "Tier Location",           value: tierRaw,     highlight: /tier.?1/i.test(tierRaw) ? "green" : "amber" },
              { label: "Max Loan by LTV",         value: maxLoan,     highlight: "green", mono: true },
            ].map((r, i, arr) => (
              <KVRow key={i} {...r} isLast={i === arr.length - 1} />
            ))}
          </div>

          <div className="pd-divider" />

          {/* ── LTV progress bar ─────────────────────────── */}
          <LTVBar pct={ltvPct} />

        </div>
      </div>
    );
  }

  window.PropertyDetailsPanel = PropertyDetailsPanel;
})();
