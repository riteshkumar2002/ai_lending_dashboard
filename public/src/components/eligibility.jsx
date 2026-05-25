// Generic EligibilityPanel
// Props: { kpis, sections, decision }
// kpis      — array of { label, value, subValue, tone }
// sections  — array of { id, title, subtitle, tag, tagTone, rows: [{ name, value, status, reason? }] }
// decision  — { tone, items: [{ label, value, tone }] }

(function () {
  const { useState } = React;

  const STATUS_TONE = {
    PASS:      { bg: "oklch(from var(--c-green) l c h / 0.12)", border: "oklch(from var(--c-green) l c h / 0.30)", color: "var(--c-green)" },
    FAIL:      { bg: "oklch(from var(--c-red)   l c h / 0.12)", border: "oklch(from var(--c-red)   l c h / 0.30)", color: "var(--c-red)" },
    DEVIATION: { bg: "oklch(from var(--c-amber) l c h / 0.12)", border: "oklch(from var(--c-amber) l c h / 0.30)", color: "var(--c-amber)" },
    "N/A":     { bg: "var(--bg-2)", border: "var(--bg-3)", color: "var(--text-3)" },
  };

  const TONE_COLOR = {
    good:    "var(--c-green)",
    warn:    "var(--c-amber)",
    bad:     "var(--c-red)",
    info:    "var(--accent)",
    neutral: "var(--text-2)",
  };

  /* FAIL → DEVIATION → PASS → N/A */
  const SEVERITY_ORDER = { FAIL: 0, DEVIATION: 1, PASS: 2, "N/A": 3 };

  /* ── SVG status icons ─────────────────────────────────────────── */
  function StatusIcon({ status, size = 16 }) {
    const t   = STATUS_TONE[status] || STATUS_TONE["N/A"];
    const c   = t.color;
    const s   = { flexShrink: 0, display: "block" };

    if (status === "PASS") return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={s}>
        <circle cx="8" cy="8" r="6.5" fill={c} fillOpacity="0.14" stroke={c} strokeWidth="1.4"/>
        <path d="M5 8.5l2.1 2.1L11 6" stroke={c} strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );

    if (status === "DEVIATION") return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={s}>
        <path d="M8 2.2L14 13H2L8 2.2Z" fill={c} fillOpacity="0.14" stroke={c} strokeWidth="1.4" strokeLinejoin="round"/>
        <path d="M8 6.5V9.5" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
        <circle cx="8" cy="11.4" r="0.8" fill={c}/>
      </svg>
    );

    if (status === "FAIL") return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={s}>
        <circle cx="8" cy="8" r="6.5" fill={c} fillOpacity="0.14" stroke={c} strokeWidth="1.4"/>
        <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke={c} strokeWidth="1.55" strokeLinecap="round"/>
      </svg>
    );

    /* N/A — dash */
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={s}>
        <circle cx="8" cy="8" r="6.5" fill="var(--bg-3)" stroke="var(--bg-3-strong)" strokeWidth="1.3"/>
        <path d="M5 8h6" stroke="var(--text-4)" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    );
  }

  /* ── Status pill badge ────────────────────────────────────────── */
  function StatusBadge({ status }) {
    const t = STATUS_TONE[status] || STATUS_TONE["N/A"];
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "3px 10px 3px 8px", borderRadius: 999,
        border: `1px solid ${t.border}`, background: t.bg, color: t.color,
        fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em",
        textTransform: "uppercase", whiteSpace: "nowrap",
      }}>
        <StatusIcon status={status} size={11} />
        {status}
      </span>
    );
  }

  /* ── KPI strip ────────────────────────────────────────────────── */
  function KpiStrip({ kpis }) {
    return (
      <div className="elig-kpi-strip">
        {(kpis || []).map((k, i) => (
          <div key={i} className="elig-kpi-card">
            <div className="elig-kpi-label">{k.label}</div>
            <div className="elig-kpi-value" style={{ color: TONE_COLOR[k.tone] || "var(--text-1)" }}>{k.value}</div>
            {k.subValue && <div className="elig-kpi-sub">{k.subValue}</div>}
          </div>
        ))}
      </div>
    );
  }

  /* ── Deviation tooltip — fixed-position, above or below row ──── */
  function DeviationTooltip({ tooltip }) {
    if (!tooltip) return null;
    const { reason, status, rect } = tooltip;
    const isDeviation  = status === "DEVIATION";
    const accentColor  = isDeviation ? "var(--c-amber)" : "var(--c-red)";
    const labelText    = isDeviation ? "Deviation Reason" : "Failure Reason";
    const above        = rect.top > 140;
    const posStyle     = above
      ? { top: rect.top - 10, transform: "translateY(-100%)" }
      : { top: rect.bottom + 10 };

    return (
      <div
        className="elig-tooltip"
        style={{
          position: "fixed", left: rect.left + 12, ...posStyle,
          borderLeft: `3px solid ${accentColor}`,
          zIndex: 9999, pointerEvents: "none",
        }}
      >
        <div className="elig-tooltip-label" style={{ color: accentColor }}>{labelText}</div>
        <div className="elig-tooltip-reason">{reason}</div>
      </div>
    );
  }

  /* ── Section table ────────────────────────────────────────────── */
  function SectionTable({ section }) {
    const [tooltip,    setTooltip]    = useState(null);
    const [hoveredIdx, setHoveredIdx] = useState(null);

    if (!section) return null;

    /* sort rows: FAIL first, then DEVIATION, then PASS */
    const sortedRows = [...(section.rows || [])].sort(
      (a, b) => (SEVERITY_ORDER[a.status] ?? 99) - (SEVERITY_ORDER[b.status] ?? 99)
    );

    const handleEnter = (e, row, idx) => {
      setHoveredIdx(idx);
      if (!row.reason) return;
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltip({ reason: row.reason, status: row.status, rect });
    };
    const handleLeave = () => { setHoveredIdx(null); setTooltip(null); };

    const tagColor = section.tagTone === "good" ? "var(--c-green)" : section.tagTone === "warn" ? "var(--c-amber)" : "var(--c-red)";
    const tagBorder = section.tagTone === "good"
      ? "oklch(from var(--c-green) l c h / 0.35)"
      : section.tagTone === "warn"
      ? "oklch(from var(--c-amber) l c h / 0.35)"
      : "oklch(from var(--c-red) l c h / 0.35)";
    const tagBg = section.tagTone === "good"
      ? "oklch(from var(--c-green) l c h / 0.10)"
      : section.tagTone === "warn"
      ? "oklch(from var(--c-amber) l c h / 0.10)"
      : "oklch(from var(--c-red) l c h / 0.10)";

    return (
      <>
        <div className="elig-section">
          <div className="elig-section-head">
            <div>
              <div className="elig-section-title">{section.title}</div>
              {section.subtitle && <div className="elig-section-sub">{section.subtitle}</div>}
            </div>
            {section.tag && (
              <span className="elig-section-tag" style={{ color: tagColor, border: `1px solid ${tagBorder}`, background: tagBg }}>
                {section.tag}
              </span>
            )}
          </div>

          <div className="elig-table-wrap">
            <table className="elig-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Parameter</th>
                  <th style={{ textAlign: "left" }}>Value</th>
                  <th style={{ textAlign: "right", width: 120 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row, i) => {
                  const st          = row.status;
                  const isDeviation = st === "DEVIATION";
                  const isFail      = st === "FAIL";
                  const isPass      = st === "PASS";
                  const hasReason   = (isDeviation || isFail) && !!row.reason;
                  const isHovered   = hoveredIdx === i;

                  const accentColor = isDeviation ? "var(--c-amber)" : isFail ? "var(--c-red)" : null;

                  /* stronger tint on hover */
                  const rowBg = isHovered
                    ? isDeviation ? "oklch(from var(--c-amber) l c h / 0.10)"
                      : isFail   ? "oklch(from var(--c-red)   l c h / 0.10)"
                      : "var(--bg-2)"
                    : isDeviation ? "oklch(from var(--c-amber) l c h / 0.05)"
                      : isFail   ? "oklch(from var(--c-red)   l c h / 0.05)"
                      : "transparent";

                  /* inset highlight ring on hover for flagged rows */
                  const rowShadow = isHovered && accentColor
                    ? `inset 0 1px 0 ${accentColor}28, inset 0 -1px 0 ${accentColor}28`
                    : "none";

                  return (
                    <tr
                      key={i}
                      style={{
                        background: rowBg,
                        boxShadow: rowShadow,
                        cursor: hasReason ? "pointer" : "default",
                        transition: "background 0.14s ease, box-shadow 0.14s ease",
                      }}
                      onMouseEnter={(e) => handleEnter(e, row, i)}
                      onMouseLeave={handleLeave}
                    >
                      {/* ── Parameter name + icon ── */}
                      <td style={{
                        fontWeight: 500, fontSize: 12,
                        color: accentColor || "var(--text-1)",
                        borderLeft: accentColor
                          ? `3px solid ${accentColor}`
                          : "3px solid transparent",
                        paddingLeft: 9,
                        transition: "border-left-color 0.14s ease",
                      }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                          <StatusIcon status={st} size={16} />
                          {row.name}
                        </span>
                      </td>

                      {/* ── Value ── */}
                      <td style={{
                        fontFamily: "var(--font-mono)", fontSize: 11.5,
                        color: accentColor || "var(--text-2)",
                      }}>
                        {row.value}
                      </td>

                      {/* ── Badge ── */}
                      <td style={{ textAlign: "right" }}>
                        <StatusBadge status={st} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <DeviationTooltip tooltip={tooltip} />
      </>
    );
  }

  /* ── GO / NO-GO decision card ─────────────────────────────────── */
  function DecisionCard({ decision }) {
    if (!decision) return null;
    const isGo = decision.tone === "go";
    const borderColor = isGo ? "oklch(from var(--c-green) l c h / 0.30)" : "oklch(from var(--c-red) l c h / 0.30)";
    const bgColor     = isGo ? "oklch(from var(--c-green) l c h / 0.06)" : "oklch(from var(--c-red) l c h / 0.06)";
    return (
      <div className="elig-decision" style={{ border: `1px solid ${borderColor}`, background: bgColor }}>
        <div className="elig-decision-title" style={{ color: isGo ? "var(--c-green)" : "var(--c-red)" }}>
          GO / NO-GO DECISION
        </div>
        <div className="elig-decision-grid">
          {(decision.items || []).map((item, i) => (
            <div key={i} className="elig-decision-row">
              <div className="elig-decision-label">{item.label}</div>
              <div className="elig-decision-value" style={{ color: TONE_COLOR[item.tone] || "var(--text-1)" }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Root panel ───────────────────────────────────────────────── */
  function EligibilityPanel({ kpis, sections, decision }) {
    if (!kpis || !Array.isArray(kpis)) return (
      <div style={{ padding: 32, color: "var(--text-3)" }}>No eligibility data available.</div>
    );
    return (
      <div className="elig-panel">
        <KpiStrip kpis={kpis} />
        {(sections || []).map(section => (
          <SectionTable key={section.id} section={section} />
        ))}
        {decision && <DecisionCard decision={decision} />}
      </div>
    );
  }

  window.EligibilityPanel = EligibilityPanel;
})();
