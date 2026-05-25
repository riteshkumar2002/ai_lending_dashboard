// BureauCreditPanel — premium "Bureau & Credit (CIBIL)" analytics card
// Receives: { label, subGroups, app }

(function () {
  const { useState, useEffect } = React;

  /* ── score band helpers ────────────────────────────────────────── */
  const BANDS = [
    { min: 300, max: 599, label: "Poor",      hex: "#EF4444", cssVar: "var(--c-red)"   },
    { min: 600, max: 749, label: "Fair",      hex: "#EAB308", cssVar: "var(--c-amber)" },
    { min: 750, max: 900, label: "Excellent", hex: "#22C55E", cssVar: "var(--c-green)" },
  ];
  function scoreBand(n) {
    return BANDS.find(b => n >= b.min && n <= b.max) || BANDS[0];
  }
  function nstpBadge(n) {
    if (n >= 750) return { icon: "✓", text: "Strong profile"  };
    if (n >= 700) return { icon: "!", text: "Review needed"   };
    if (n >= 650) return { icon: "!", text: "NSTP required"   };
    return         { icon: "✗", text: "Critical – Decline" };
  }

  function getVal(rows, name) {
    return (rows || []).find(r => r.name === name)?.value || null;
  }

  function parseDays(str) {
    const m = (str || "").match(/[\d.]+/);
    return m ? parseFloat(m[0]) : 0;
  }

  /* DPD risk */
  function dpdRisk(days) {
    if (days === 0)  return { label: "Clean",    hex: "#22C55E" };
    if (days <= 5)   return { label: "Minor",    hex: "#EAB308" };
    if (days <= 30)  return { label: "Moderate", hex: "#F97316" };
    return            { label: "Elevated",  hex: "#EF4444" };
  }

  /* Enquiry risk */
  function enqRisk(n) {
    if (n <= 2) return { label: "Normal",   hex: "#22C55E", check: true  };
    if (n <= 5) return { label: "Moderate", hex: "#EAB308", check: false };
    return       { label: "High",      hex: "#EF4444", check: false };
  }

  /* ── animated gauge ────────────────────────────────────────────── */
  function CIBILGauge({ score }) {
    const [anim, setAnim] = useState(0);
    useEffect(() => {
      const t = setTimeout(() => setAnim(Math.min(1, Math.max(0, (score - 300) / 600))), 120);
      return () => clearTimeout(t);
    }, [score]);

    const band  = scoreBand(score);
    const badge = nstpBadge(score);
    const hex   = band.hex;

    /* ── Circular ring geometry ───────────────────────────────
     * 300° arc: starts at 7 o'clock (210° CW from top) → 5 o'clock (150° CW from top)
     * Gap of 60° sits at the bottom centre.
     * All angles measured CLOCKWISE from the top (12 o'clock).
     */
    const cx = 100, cy = 95, r = 70;

    const toXY = (degCW) => {
      const a = (degCW - 90) * Math.PI / 180;   // convert to SVG angle (0=right, CW+)
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    };

    const [sx, sy] = toXY(210);   // arc start — lower-left  (7 o'clock)
    const [ex, ey] = toXY(150);   // arc end   — lower-right (5 o'clock)

    // 300° clockwise arc: large-arc=1, sweep-cw=1
    const arc     = `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 1 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
    const arcLen  = (300 / 360) * 2 * Math.PI * r;   // ≈ 366.5
    const dashOff = (arcLen * (1 - anim)).toFixed(2);
    const ease    = "0.95s cubic-bezier(0.25,0.46,0.45,0.94)";

    // Glowing dot at the live score position (tip of progress ring)
    const dotDeg = 210 + anim * 300;
    const dotA   = (dotDeg - 90) * Math.PI / 180;
    const dotX   = (cx + r * Math.cos(dotA)).toFixed(2);
    const dotY   = (cy + r * Math.sin(dotA)).toFixed(2);

    // Band-boundary tick helper
    const tick = (degCW, inner, outer) => {
      const a = (degCW - 90) * Math.PI / 180;
      const cos = Math.cos(a), sin = Math.sin(a);
      return {
        x1: (cx + inner * cos).toFixed(2), y1: (cy + inner * sin).toFixed(2),
        x2: (cx + outer * cos).toFixed(2), y2: (cy + outer * sin).toFixed(2),
      };
    };
    // Fair starts at score 600 → 50 % of arc → 210 + 150 = 360 ≡ 0° (12 o'clock)
    // Good starts at score 750 → 75 % of arc → 210 + 225 = 435 ≡ 75° (~2:30)
    const fairTick = tick(0,  r - 9, r + 9);
    const goodTick = tick(75, r - 9, r + 9);

    return (
      <div className="bc-gauge-col">
        <svg width="200" height="175" viewBox="0 0 200 175">
          <defs>
            <filter id="bcGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="bcDot" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* ── background track ring ──────────────────────── */}
          <path d={arc} fill="none"
            stroke="rgba(255,255,255,0.07)" strokeWidth="12" strokeLinecap="round"/>

          {/* ── glow blur pass ─────────────────────────────── */}
          <path d={arc} fill="none" stroke={hex} strokeWidth="16" strokeLinecap="round"
            strokeDasharray={`${arcLen.toFixed(2)} 99999`}
            strokeDashoffset={dashOff}
            opacity="0.22" filter="url(#bcGlow)"
            style={{ transition: `stroke-dashoffset ${ease}` }}
          />

          {/* ── progress ring (crisp) ──────────────────────── */}
          <path d={arc} fill="none" stroke={hex} strokeWidth="12" strokeLinecap="round"
            strokeDasharray={`${arcLen.toFixed(2)} 99999`}
            strokeDashoffset={dashOff}
            style={{ transition: `stroke-dashoffset ${ease}` }}
          />

          {/* ── glowing dot at score tip ───────────────────── */}
          <circle cx={dotX} cy={dotY} r="7" fill={hex} opacity="0.30" filter="url(#bcDot)"
            style={{ transition: `cx ${ease}, cy ${ease}` }}
          />
          <circle cx={dotX} cy={dotY} r="5" fill={hex}
            style={{ transition: `cx ${ease}, cy ${ease}` }}
          />
          <circle cx={dotX} cy={dotY} r="2.2" fill="white" opacity="0.9"
            style={{ transition: `cx ${ease}, cy ${ease}` }}
          />

          {/* ── band boundary ticks ────────────────────────── */}
          <line {...fairTick} stroke="#EAB30855" strokeWidth="1.5"/>
          <line {...goodTick} stroke="#22C55E55" strokeWidth="1.5"/>

          {/* ── band zone labels ───────────────────────────── */}
          <text x="14"  y="98" textAnchor="middle" fontSize="8" fill="#EF444475" fontWeight="700">Poor</text>
          <text x="100" y="13" textAnchor="middle" fontSize="8" fill="#EAB30875" fontWeight="700">Fair</text>
          <text x="187" y="72" textAnchor="middle" fontSize="8" fill="#22C55E75" fontWeight="700">Good</text>

          {/* ── range numbers at arc endpoints ─────────────── */}
          <text x={sx.toFixed(1)} y={(sy + 14).toFixed(1)} textAnchor="middle"
            fontSize="7.5" fill="var(--text-4)" fontFamily="'JetBrains Mono', monospace">300</text>
          <text x={ex.toFixed(1)} y={(ey + 14).toFixed(1)} textAnchor="middle"
            fontSize="7.5" fill="var(--text-4)" fontFamily="'JetBrains Mono', monospace">900</text>

          {/* ── score & band centred inside the ring ───────── */}
          <text x={cx} y={cy - 5} textAnchor="middle"
            fontSize="28" fontWeight="800" fill="var(--text-1)"
            fontFamily="'JetBrains Mono', monospace" letterSpacing="-1">
            {score}
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle"
            fontSize="9" fill={hex} fontWeight="700" letterSpacing="0.06em">
            {band.label.toUpperCase()} BAND
          </text>
        </svg>

        {/* NSTP badge */}
        <div className="bc-nstp-badge" style={{
          color: hex,
          background: `${hex}1c`,
          border: `1px solid ${hex}45`,
        }}>
          <span style={{ fontWeight: 800 }}>{badge.icon}</span>
          {badge.text}
        </div>
      </div>
    );
  }

  /* ── delinquency risk chip ──────────────────────────────────────── */
  function RiskChip({ label, hex, check }) {
    return (
      <span className="bc-risk-chip" style={{
        color: hex,
        background: `${hex}16`,
        border: `1px solid ${hex}42`,
      }}>
        {check && (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" style={{ flexShrink: 0 }}>
            <path d="M1.2 4.2l1.6 1.6L6.8 2"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {label}
      </span>
    );
  }

  /* ── delinquency metric block ───────────────────────────────────── */
  function DelinqMetric({ label, value, valueColor, chip }) {
    return (
      <div className="bc-delinq-metric">
        <div className="bc-delinq-label">{label}</div>
        <div className="bc-delinq-value" style={{ color: valueColor }}>{value}</div>
        <RiskChip {...chip} />
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
      <div className="bc-kv-row"
        style={{ borderBottom: isLast ? "none" : "1px solid var(--bg-3)" }}>
        <span className="bc-kv-label">{label}</span>
        <span className="bc-kv-value" style={{
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
  function BureauCreditPanel({ label, subGroups, app }) {
    const [hovered, setHovered] = useState(false);

    const cibilRows = (subGroups || []).find(g => /cibil/i.test(g.label))?.rows || [];
    const dlpRows   = (subGroups || []).find(g => /last payment/i.test(g.label))?.rows || [];

    /* values */
    const scoreRaw    = getVal(cibilRows, "CIBIL Score")                     || "684";
    const cmrRank     = getVal(cibilRows, "CMR Rank")                        || "9 (HUF entity)";
    const dpdRaw      = getVal(cibilRows, "Max DPD (Last 12M — Live Accounts)") || "5 days";
    const ccOverdue   = getVal(cibilRows, "Overdue Amount CC / KCC")         || "₹35,000";
    const nonCcOverdue= getVal(cibilRows, "Overdue Amount Non-CC")           || "₹20,000";
    const enquiryRaw  = getVal(cibilRows, "Enquiry Count (L6M)")             || "1";
    const derogatory  = getVal(cibilRows, "Derogatory / Written-Off Status") || "NONE (Code: 0)";
    const suitFiled   = getVal(cibilRows, "Suit Filed / Wilful Default")     || "0";
    const lastPayment = getVal(dlpRows,  "Days Since Last Payment")          || "2.92 years";

    const score    = parseInt(scoreRaw) || 684;
    const dpdDays  = parseDays(dpdRaw);
    const enqCount = parseInt(enquiryRaw) || 0;

    const dpdR  = dpdRisk(dpdDays);
    const enqR  = enqRisk(enqCount);

    /* overdue color */
    const hasOverdue = parseFloat(ccOverdue.replace(/[^0-9.]/g, "")) > 0;
    const overdueClr = hasOverdue ? "amber" : "green";

    /* derogatory clean? */
    const isDerogClean  = /NONE/i.test(derogatory) || derogatory === "0";
    const isSuitClean   = suitFiled === "0" || /none/i.test(suitFiled);

    return (
      <div
        className="bc-card"
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
        <div className="bc-header">
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div className="bc-icon-box">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="var(--accent)" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <div className="bc-card-title">Bureau &amp; Credit (CIBIL)</div>
              <div className="bc-card-sub">CIBIL Score · DPD · Delinquency · Overdue</div>
            </div>
          </div>
          <span className="bc-section-badge">SECTION 04</span>
        </div>

        <div className="bc-rule" />

        {/* ── Body ────────────────────────────────────────── */}
        <div className="bc-body">

          {/* ── Gauge + Delinquency row ──────────────────── */}
          <div className="bc-top-row">
            <CIBILGauge score={score} />

            {/* Delinquency metrics */}
            <div className="bc-delinq-col">
              <div className="bc-section-label">Delinquency</div>
              <div className="bc-delinq-metrics">
                <DelinqMetric
                  label="Max DPD (12M)"
                  value={dpdRaw}
                  valueColor={dpdR.hex}
                  chip={{ label: dpdR.label, hex: dpdR.hex, check: dpdDays === 0 }}
                />
                <DelinqMetric
                  label="Enquiries L6M"
                  value={enqCount}
                  valueColor={enqR.hex}
                  chip={{ label: enqR.label, hex: enqR.hex, check: enqCount <= 2 }}
                />
              </div>
            </div>
          </div>

          <div className="bc-divider" />

          {/* ── Overdue Amounts ──────────────────────────── */}
          <div className="bc-overdue-section">
            <div className="bc-section-label">Overdue Amounts</div>
            {[
              { label: "CC / KCC Overdue",  value: ccOverdue,    highlight: overdueClr },
              { label: "Non-CC Overdue",    value: nonCcOverdue, highlight: overdueClr },
            ].map((r, i, arr) => (
              <KVRow key={i} {...r} isLast={i === arr.length - 1} />
            ))}
          </div>

          <div className="bc-divider" />

          {/* ── Status ───────────────────────────────────── */}
          <div className="bc-status-section">
            <div className="bc-section-label">Status</div>
            {[
              { label: "Derogatory Status",        value: derogatory,  highlight: isDerogClean  ? "green" : "red"   },
              { label: "Suit Filed / Wilful Default", value: suitFiled, highlight: isSuitClean   ? "green" : "red"   },
              { label: "CMR Rank",                  value: cmrRank     },
              { label: "Days Since Last Payment",   value: lastPayment },
            ].map((r, i, arr) => (
              <KVRow key={i} {...r} isLast={i === arr.length - 1} />
            ))}
          </div>

        </div>
      </div>
    );
  }

  window.BureauCreditPanel = BureauCreditPanel;
})();
