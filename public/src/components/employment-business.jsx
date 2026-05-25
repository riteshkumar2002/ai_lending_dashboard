// EmploymentBusinessPanel — premium "Employment & Business" analytics card
// Receives: { label, subGroups, app }
// Conditionally renders SEP (Self-Employed) or Salaried variant

(function () {
  const { useState, useEffect } = React;

  /* ── helpers ───────────────────────────────────────────────────── */
  function getVal(rows, name) {
    const row = (rows || []).find(r => r.name === name);
    return row?.value || null;
  }

  function parseCrore(str) {
    if (!str) return null;
    const m = str.match(/[\d.]+/);
    return m ? parseFloat(m[0]) : null;
  }

  function parseYears(str) {
    if (!str) return null;
    const m = str.match(/[\d.]+/);
    return m ? parseFloat(m[0]) : null;
  }

  function yoyColor(pct) {
    if (pct >= 10)  return "var(--c-green)";
    if (pct >= 0)   return "var(--c-green)";
    if (pct >= -15) return "var(--c-amber)";
    return "var(--c-red)";
  }

  function yoyBg(pct) {
    if (pct >= 0)   return "oklch(from var(--c-green) l c h / 0.10)";
    if (pct >= -15) return "oklch(from var(--c-amber) l c h / 0.10)";
    return "oklch(from var(--c-red) l c h / 0.10)";
  }

  /* ── sub-components ────────────────────────────────────────────── */

  function EBChip({ label, type, check }) {
    const palette = {
      green: { color: "var(--c-green)",  bg: "oklch(from var(--c-green) l c h / 0.10)",  brd: "oklch(from var(--c-green) l c h / 0.25)"  },
      blue:  { color: "var(--accent)",   bg: "oklch(from var(--accent) l c h / 0.10)",   brd: "oklch(from var(--accent) l c h / 0.28)"   },
      slate: { color: "var(--text-2)",   bg: "var(--bg-2)",                               brd: "var(--bg-3)"                               },
    };
    const c = palette[type] || palette.slate;
    return (
      <span className="eb-chip" style={{ color: c.color, background: c.bg, border: `1px solid ${c.brd}` }}>
        {check && (
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{ flexShrink: 0 }}>
            <path d="M1.5 4.8l1.8 1.8L7.5 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {label}
      </span>
    );
  }

  function AnimatedBar({ pct, color, delay = 0 }) {
    const [filled, setFilled] = useState(0);
    useEffect(() => {
      const t = setTimeout(() => setFilled(Math.min(100, Math.max(0, pct))), 80 + delay);
      return () => clearTimeout(t);
    }, [pct]);
    return (
      <div className="eb-prog-track">
        <div
          className="eb-prog-fill"
          style={{ width: filled + "%", background: color || "var(--c-green)" }}
        />
      </div>
    );
  }

  /* mini bar chart for trend section */
  function TrendBars({ prevLabel, prevVal, currLabel, currVal, prevColor, currColor }) {
    const [visible, setVisible] = useState(false);
    useEffect(() => { const t = setTimeout(() => setVisible(true), 120); return () => clearTimeout(t); }, []);

    const maxVal = Math.max(prevVal || 0, currVal || 0, 0.01);
    const prevH  = visible ? Math.round((prevVal / maxVal) * 80) : 0;
    const currH  = visible ? Math.round((currVal / maxVal) * 80) : 0;

    return (
      <div className="eb-bars">
        <div className="eb-bar-col">
          <div className="eb-bar-value" style={{ color: "var(--text-2)" }}>{prevLabel}</div>
          <div className="eb-bar-track" style={{ height: 84, alignItems: "flex-end", display: "flex" }}>
            <div
              className="eb-bar-fill"
              style={{ height: prevH, background: prevColor || "var(--bg-3-strong)" }}
            />
          </div>
          <div className="eb-bar-foot">Prev Year</div>
        </div>
        <div className="eb-bar-col">
          <div className="eb-bar-value" style={{ color: "var(--text-2)" }}>{currLabel}</div>
          <div className="eb-bar-track" style={{ height: 84, alignItems: "flex-end", display: "flex" }}>
            <div
              className="eb-bar-fill"
              style={{ height: currH, background: currColor }}
            />
          </div>
          <div className="eb-bar-foot">Curr Year</div>
        </div>
      </div>
    );
  }

  function KVRow({ label, value, highlight, mono, isLast }) {
    const valColor = highlight === "green" ? "var(--c-green)"
                   : highlight === "amber" ? "var(--c-amber)"
                   : highlight === "red"   ? "var(--c-red)"
                   : "var(--text-1)";
    return (
      <div className="eb-kv-row" style={{ borderBottom: isLast ? "none" : "1px solid var(--bg-3)" }}>
        <span className="eb-kv-label">{label}</span>
        <span className="eb-kv-value" style={{
          color: valColor,
          fontFamily: mono ? "var(--font-mono)" : "inherit",
          fontWeight: highlight ? 600 : 500,
        }}>
          {value || "—"}
        </span>
      </div>
    );
  }

  /* ── SEP variant ────────────────────────────────────────────────── */
  function SEPCard({ sepRows }) {
    const companyCategory = getVal(sepRows, "Company Category") || "TGE";
    const vintageStr      = getVal(sepRows, "Business Vintage") || "13.98 years";
    const workExp         = getVal(sepRows, "Total Work Experience") || "30 months (on record)";
    const currTurnStr     = getVal(sepRows, "Current Year Turnover")  || "₹1.90 Crore";
    const prevTurnStr     = getVal(sepRows, "Previous Year Turnover") || "₹2.65 Crore";
    const gstTurnover     = getVal(sepRows, "GST Turnover (Reported)") || "₹2.33 Crore";
    const audited         = getVal(sepRows, "Financials Audited") || "YES";
    const constitution    = getVal(sepRows, "Constitution") || "HUF";

    const vintageYrs = parseYears(vintageStr) || 13.98;
    const BENCHMARK  = 20;
    const vintagePct = Math.min(100, (vintageYrs / BENCHMARK) * 100);

    const prevCr = parseCrore(prevTurnStr) || 2.65;
    const currCr = parseCrore(currTurnStr) || 1.90;
    const yoyPct = prevCr > 0 ? ((currCr - prevCr) / prevCr) * 100 : 0;
    const yoySign   = yoyPct >= 0 ? "▲" : "▼";
    const yoyAbs    = Math.abs(yoyPct).toFixed(0);
    const yoyClr    = yoyColor(yoyPct);
    const currBarClr = yoyPct >= 0
      ? "oklch(from var(--c-green) l c h / 0.45)"
      : "oklch(from var(--c-red) l c h / 0.42)";

    const isAudited = audited?.toUpperCase() === "YES";
    const isTGE     = companyCategory?.toUpperCase().includes("TGE");

    return (
      <>
        {/* Chips */}
        <div className="eb-chips">
          <EBChip label="SEP"                     type="blue"  />
          {isTGE && <EBChip label="TGE (Top Gross Entity)" type="green" check />}
          {isAudited && <EBChip label="Financials Audited" type="green" check />}
          {constitution !== "—" && <EBChip label={constitution.split(" ")[0]} type="slate" />}
        </div>

        {/* Business Vintage */}
        <div className="eb-vintage-block">
          <div className="eb-section-label">Business Vintage</div>
          <div className="eb-vintage-value-row">
            <span className="eb-vintage-num">
              {vintageYrs.toFixed(2)}
            </span>
            <span className="eb-vintage-unit">years</span>
          </div>
          <AnimatedBar pct={vintagePct} color="var(--c-green)" />
          <div className="eb-prog-labels">
            <span>0 yrs</span>
            <span>{BENCHMARK} yrs (benchmark)</span>
          </div>
        </div>

        {/* Turnover Trend */}
        <div className="eb-trend-block">
          <div className="eb-section-label">Turnover Trend (Year-on-Year)</div>
          <div className="eb-trend-inner">
            <TrendBars
              prevLabel={`₹${prevCr.toFixed(2)}Cr`}
              prevVal={prevCr}
              currLabel={`₹${currCr.toFixed(2)}Cr`}
              currVal={currCr}
              prevColor="var(--bg-3-strong)"
              currColor={currBarClr}
            />
            <div className="eb-yoy-block">
              <div className="eb-yoy-pct" style={{ color: yoyClr, background: yoyBg(yoyPct) }}>
                {yoySign}{yoyAbs}%
              </div>
              <div className="eb-yoy-label">YoY change</div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="eb-details-block">
          <div className="eb-section-label" style={{ marginBottom: 4 }}>Details</div>
          {[
            { label: "GST Turnover (Reported)",  value: gstTurnover },
            { label: "Total Work Experience",    value: workExp },
            { label: "Employer / Entity",        value: "N/A — Self-Employed" },
            { label: "Constitution",             value: constitution },
            { label: "Company Category",         value: companyCategory },
          ].map((r, i, arr) => (
            <KVRow key={i} label={r.label} value={r.value} isLast={i === arr.length - 1} />
          ))}
        </div>
      </>
    );
  }

  /* ── Salaried variant ───────────────────────────────────────────── */
  const SAL = {
    employerName:    "Tata Consultancy Services Ltd",
    employmentType:  "Permanent / Full-Time",
    employerCat:     "Category A — Large Enterprise",
    industry:        "IT / Software Services",
    totalExp:        7.2,
    currentTenure:   3.5,
    monthlyGross:    85000,
    creditMode:      "NEFT — Bank Transfer",
    prevSalary:      90000,
    currSalary:      102000,
    BENCHMARK:       10,
  };

  function SalariedCard({ salRows }) {
    const employerName = getVal(salRows, "Employer Name") !== "N/A — Self-Employed Applicant"
      ? getVal(salRows, "Employer Name") || SAL.employerName
      : SAL.employerName;

    const totalExp    = SAL.totalExp;
    const tenure      = SAL.currentTenure;
    const expPct      = Math.min(100, (totalExp / SAL.BENCHMARK) * 100);

    const prevSal = SAL.prevSalary;
    const currSal = SAL.currSalary;
    const yoyPct  = ((currSal - prevSal) / prevSal) * 100;
    const yoySign = yoyPct >= 0 ? "▲" : "▼";
    const yoyAbs  = Math.abs(yoyPct).toFixed(1);
    const yoyClr  = yoyColor(yoyPct);
    const currBarClr = "oklch(from var(--c-green) l c h / 0.42)";

    const fmtSal = n => `₹${(n / 1000).toFixed(0)}K`;

    return (
      <>
        {/* Chips */}
        <div className="eb-chips">
          <EBChip label="Salaried"          type="blue"  />
          <EBChip label="Salary Credited"   type="green" check />
          <EBChip label="Employer Verified" type="green" check />
        </div>

        {/* Employment Stability */}
        <div className="eb-vintage-block">
          <div className="eb-section-label">Employment Stability</div>
          <div className="eb-vintage-value-row">
            <span className="eb-vintage-num">{totalExp.toFixed(1)}</span>
            <span className="eb-vintage-unit">years experience</span>
          </div>
          <AnimatedBar pct={expPct} color="var(--accent)" />
          <div className="eb-prog-labels">
            <span>0 yrs</span>
            <span>{SAL.BENCHMARK} yrs (benchmark)</span>
          </div>
        </div>

        {/* Salary Trend */}
        <div className="eb-trend-block">
          <div className="eb-section-label">Salary Trend (Year-on-Year)</div>
          <div className="eb-trend-inner">
            <TrendBars
              prevLabel={fmtSal(prevSal)}
              prevVal={prevSal}
              currLabel={fmtSal(currSal)}
              currVal={currSal}
              prevColor="var(--bg-3-strong)"
              currColor={currBarClr}
            />
            <div className="eb-yoy-block">
              <div className="eb-yoy-pct" style={{ color: yoyClr, background: yoyBg(yoyPct) }}>
                {yoySign}{yoyAbs}%
              </div>
              <div className="eb-yoy-label">YoY increment</div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="eb-details-block">
          <div className="eb-section-label" style={{ marginBottom: 4 }}>Details</div>
          {[
            { label: "Employer Name",          value: employerName },
            { label: "Employment Type",        value: SAL.employmentType },
            { label: "Monthly Gross Salary",   value: `₹${SAL.monthlyGross.toLocaleString("en-IN")}` },
            { label: "Total Experience",       value: `${SAL.totalExp} years` },
            { label: "Current Company Tenure", value: `${SAL.currentTenure} years` },
            { label: "Salary Credit Mode",     value: SAL.creditMode },
          ].map((r, i, arr) => (
            <KVRow key={i} label={r.label} value={r.value} isLast={i === arr.length - 1} />
          ))}
        </div>
      </>
    );
  }

  /* ── main panel ─────────────────────────────────────────────────── */
  function EmploymentBusinessPanel({ label, subGroups, app }) {
    const [hovered, setHovered] = useState(false);

    const sepRows = (subGroups || []).find(g => /self.employ/i.test(g.label))?.rows || [];
    const salRows = (subGroups || []).find(g => /salaried/i.test(g.label))?.rows   || [];

    const segment = getVal(sepRows, "Segment") || "";
    const isSEP   = /SELF_EMPLOYED/.test(segment) ||
                    (!!getVal(sepRows, "Business Vintage") && getVal(sepRows, "Business Vintage") !== "—");

    return (
      <div
        className="eb-card"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          boxShadow: hovered
            ? "0 10px 36px oklch(0 0 0 / 0.22), 0 0 0 1px var(--bg-3-strong)"
            : "0 2px 14px oklch(0 0 0 / 0.10)",
          transform: hovered ? "translateY(-2px)" : "none",
        }}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <div className="eb-header">
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div className="eb-icon-box">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="var(--accent)" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
                <line x1="12" y1="12" x2="12" y2="17"/>
                <line x1="9.5" y1="14.5" x2="14.5" y2="14.5"/>
              </svg>
            </div>
            <div>
              <div className="eb-card-title">Employment &amp; Business</div>
              <div className="eb-card-sub">
                {isSEP ? "Self-Employed · Vintage · Turnover" : "Salaried · Stability · Salary Trend"}
              </div>
            </div>
          </div>
          <span className="eb-section-badge">SECTION 02</span>
        </div>

        <div className="eb-rule" />

        {/* ── Body ─────────────────────────────────────── */}
        <div className="eb-body">
          {isSEP
            ? <SEPCard     sepRows={sepRows} />
            : <SalariedCard salRows={salRows} />
          }
        </div>
      </div>
    );
  }

  window.EmploymentBusinessPanel = EmploymentBusinessPanel;
})();
