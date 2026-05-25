// CollateralLegalPanel — premium "Collateral & Legal" analytics card
// Receives: { label, subGroups, app }

(function () {
  const { useState, useEffect } = React;

  function getVal(rows, name) {
    return (rows || []).find(r => r.name === name)?.value || null;
  }

  function parseDays(str) {
    const m = (str || "").match(/[\d.]+/);
    return m ? parseInt(m[0]) : 0;
  }

  /* ── Processing days thresholds ──────────────────────────────── */
  function reportMeta(days, warnAt, critAt) {
    if (days <= warnAt)  return { hex: "#22C55E", label: "On Track" };
    if (days <= critAt)  return { hex: "#EAB308", label: "Delayed"  };
    return                      { hex: "#EF4444", label: "Critical" };
  }

  /* ── Status meta for fraud / legal ──────────────────────────── */
  function statusMeta(val) {
    const v = (val || "").toLowerCase();
    if (/no match|clean|verified|clear|pass/i.test(val))
      return { hex: "#22C55E", icon: "✓", short: "Clean"   };
    if (/pending|review/i.test(val))
      return { hex: "#EAB308", icon: "!",  short: "Pending" };
    if (/match|fail|reject|risk/i.test(val))
      return { hex: "#EF4444", icon: "✗", short: "Risk"    };
    return   { hex: "#94A3B8", icon: "–",  short: val       };
  }

  function legalStatusMeta(val) {
    if (/no match|clear|verified/i.test(val))  return { hex: "#22C55E", label: "No Match"  };
    if (/pending/i.test(val))                  return { hex: "#EAB308", label: "Pending"   };
    if (/reject|fail|risk/i.test(val))         return { hex: "#EF4444", label: "Rejected"  };
    return                                            { hex: "#94A3B8", label: val          };
  }

  /* ── Animated report bar ─────────────────────────────────────── */
  function ReportBar({ label, days, warnAt, critAt }) {
    const maxDays = 600;
    const pct     = Math.min(100, (days / maxDays) * 100);
    const meta    = reportMeta(days, warnAt, critAt);
    const [w, setW] = useState(0);
    useEffect(() => {
      const t = setTimeout(() => setW(pct), 150);
      return () => clearTimeout(t);
    }, [pct]);

    return (
      <div className="cl-report-row">
        <div className="cl-report-header">
          <span className="cl-report-label">{label}</span>
          <span className="cl-report-days" style={{ color: meta.hex }}>
            {days} days
          </span>
        </div>
        <div className="cl-bar-track">
          <div className="cl-bar-fill" style={{
            width: `${w}%`,
            background: meta.hex,
            boxShadow: `0 0 7px ${meta.hex}55`,
            transition: "width 0.95s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          }} />
        </div>
      </div>
    );
  }

  /* ── Fraud card ──────────────────────────────────────────────── */
  function FraudCard({ title, value }) {
    const raw  = value || "";
    const meta = statusMeta(raw);
    return (
      <div className="cl-fraud-card" style={{
        background: `${meta.hex}0e`,
        border: `1px solid ${meta.hex}35`,
      }}>
        <div className="cl-fraud-title">{title}</div>
        <div className="cl-fraud-status" style={{ color: meta.hex }}>
          <span style={{ fontWeight: 800 }}>{meta.icon}</span>
          {meta.short}
        </div>
      </div>
    );
  }

  /* ── Loan track metric row ───────────────────────────────────── */
  function TrackRow({ label, value, color, isLast }) {
    return (
      <div className="cl-track-row"
        style={{ borderBottom: isLast ? "none" : "1px solid var(--bg-3)" }}>
        <span className="cl-track-label">{label}</span>
        <span className="cl-track-value" style={{ color }}>
          {value}
        </span>
      </div>
    );
  }

  /* ── Legal status grid card ──────────────────────────────────── */
  function LegalStatusCard({ title, value }) {
    const meta = legalStatusMeta(value);
    return (
      <div className="cl-lstatus-card" style={{
        borderLeft: `3px solid ${meta.hex}`,
        background: `${meta.hex}0a`,
      }}>
        <div className="cl-lstatus-title">{title}</div>
        <div className="cl-lstatus-value" style={{ color: meta.hex }}>
          {meta.label}
        </div>
      </div>
    );
  }

  /* ── main panel ─────────────────────────────────────────────── */
  function CollateralLegalPanel({ label, subGroups, app }) {
    const [hovered, setHovered] = useState(false);

    const rows = (subGroups || []).find(g => /title|legal/i.test(g.label))?.rows
              || (subGroups || [])[0]?.rows
              || [];

    const legalDaysRaw  = getVal(rows, "Legal Report Processing Days")        || "307 days";
    const techDaysRaw   = getVal(rows, "Technical Report Processing Days")    || "476 days";
    const hunterRaw     = getVal(rows, "Hunter Match (Fraud Ring Detection)")  || "No Match (isMatch=FALSE)";
    const dedupeRaw     = getVal(rows, "External Dedupe (additional_match)")  || "No Match (FALSE)";
    const emiPaid       = getVal(rows, "EMI Paid Count")                      || "42";
    const bounceRaw     = getVal(rows, "Bounce Count (L6M)")                  || "2";

    const legalDays  = parseDays(legalDaysRaw);
    const techDays   = parseDays(techDaysRaw);
    const bounceN    = parseInt(bounceRaw) || 0;
    const emiN       = parseInt(emiPaid)   || 0;

    const bounceColor = bounceN === 0 ? "#22C55E" : bounceN <= 2 ? "#EAB308" : "#EF4444";
    const emiColor    = emiN >= 24 ? "#22C55E" : emiN >= 12 ? "#EAB308" : "var(--text-1)";

    /* Legal status items derived from existing data */
    const legalStatuses = [
      { title: "Hunter Match",       value: /no match/i.test(hunterRaw) ? "No Match" : "Match Found" },
      { title: "External Dedupe",    value: /no match|false/i.test(dedupeRaw) ? "No Match" : "Match Found" },
      { title: "Title Clearance",    value: legalDays > 200 ? "Pending" : "Verified" },
      { title: "Encumbrance Cert.",  value: techDays  > 300 ? "Pending" : "Verified" },
    ];

    return (
      <div
        className="cl-card"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          boxShadow: hovered
            ? "0 10px 36px oklch(0 0 0 / 0.22), 0 0 0 1px var(--bg-3-strong)"
            : "0 2px 14px oklch(0 0 0 / 0.10)",
          transform: hovered ? "translateY(-2px)" : "none",
        }}
      >
        {/* ── Header ────────────────────────────────────────── */}
        <div className="cl-header">
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div className="cl-icon-box">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="var(--accent)" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
            <div>
              <div className="cl-card-title">Collateral &amp; Legal</div>
              <div className="cl-card-sub">Fraud Prevention · Legal Status · Processing Delays</div>
            </div>
          </div>
          <span className="cl-section-badge">SECTION 06</span>
        </div>

        <div className="cl-rule" />

        {/* ── Body ──────────────────────────────────────────── */}
        <div className="cl-body">

          {/* ── Fraud Prevention ─────────────────────────── */}
          <div className="cl-fraud-section">
            <div className="cl-section-label">Fraud Prevention</div>
            <div className="cl-fraud-row">
              <FraudCard title="HUNTER / FRAUD RING" value={hunterRaw} />
              <FraudCard title="EXTERNAL DEDUPE"     value={dedupeRaw} />
            </div>
          </div>

          <div className="cl-divider" />

          {/* ── Report Processing Days ───────────────────── */}
          <div className="cl-reports-section">
            <div className="cl-section-label">Report Processing Days</div>
            <ReportBar label="Legal Report"     days={legalDays} warnAt={120} critAt={300} />
            <ReportBar label="Technical Report" days={techDays}  warnAt={120} critAt={300} />
          </div>

          <div className="cl-divider" />

          {/* ── Loan Track Record ────────────────────────── */}
          <div className="cl-track-section">
            <div className="cl-section-label">Loan Track Record</div>
            <TrackRow
              label="EMI Paid Count"
              value={emiN}
              color={emiColor}
            />
            <TrackRow
              label="Bounce Count (L6M)"
              value={bounceN}
              color={bounceColor}
              isLast
            />
          </div>

          <div className="cl-divider" />

          {/* ── Legal Status Grid ────────────────────────── */}
          <div className="cl-lstatus-section">
            <div className="cl-section-label">Legal Status</div>
            <div className="cl-lstatus-grid">
              {legalStatuses.map((s, i) => (
                <LegalStatusCard key={i} {...s} />
              ))}
            </div>
          </div>

        </div>
      </div>
    );
  }

  window.CollateralLegalPanel = CollateralLegalPanel;
})();
