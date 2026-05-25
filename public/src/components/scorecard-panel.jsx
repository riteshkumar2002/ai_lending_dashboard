// Scorecard — hierarchical drill-down: Category → Subcategory → Parameter
// Exports: ScoreRings, DrilldownScorecard, ScorecardPanel (tab fallback)
// Legacy exports kept for SummaryView compat: CompositeOverview, CategoryDetail, SubcategoryDetail

(function () {
  const { useState, useMemo, useRef } = React;

  /* ═══════════════════════════════════════════════════════════════
     UTILITIES
  ═══════════════════════════════════════════════════════════════ */

  function normalizeSubcats(cat) {
    const items = cat.items || [];
    if (!items.length) return [];
    if (items[0] && Array.isArray(items[0].items)) return items;
    return [{ label: cat.label, items }];
  }

  function subcatStats(subcat) {
    const items = subcat.items || [];
    const achieved = items.reduce((s, p) => s + (p.points  || 0), 0);
    const maxPts   = items.reduce((s, p) => s + (p.maxPoints || 0), 0);
    const pct      = maxPts > 0 ? Math.round(achieved / maxPts * 100) : 0;
    return { achieved, maxPts, pct };
  }

  function subcatToRingItem(subcat, color) {
    const st = subcatStats(subcat);
    return { id: subcat.label, label: subcat.label, color, weight: "", ...st };
  }

  function paramToRingItem(param, color) {
    return {
      id: param.label, label: param.label, color, weight: "",
      achieved: param.points || 0, maxPts: param.maxPoints || 0, pct: param.pct || 0,
    };
  }

  /* Single source of truth for performance color + label.
     Call as perfMeta(pct) or perfMeta(achieved, max). */
  function perfMeta(scoreOrPct, max) {
    const pct = (max != null && max > 0) ? Math.round(scoreOrPct / max * 100) : Math.round(scoreOrPct);
    const color = pct >= 80 ? "var(--perf-green)"
                : pct >= 60 ? "var(--perf-yellow)"
                : pct >= 40 ? "var(--perf-orange)"
                :             "var(--perf-red)";
    const label = pct >= 80 ? "Strong"
                : pct >= 60 ? "Moderate"
                : pct >= 40 ? "Risk"
                :             "Critical";
    return { pct, color, label };
  }

  /* Ordered neon palette — outer ring first, then inner, then fallback.
     Avoids red/green/yellow/orange (reserved for performance states). */
  const RING_COLORS = [
    "#00C8FF", // Sky Blue      — outer ring
    "#FF3EA5", // Hot Pink
    "#00DDB0", // Mint Teal
    "#3A55FF", // Royal Blue
    "#9060EE", // Violet
    "#6DCAFF", // Baby Blue     — inner ring
    "#00AAFF", // Cobalt Cyan   — fallback 7
    "#C060FF", // Neon Purple   — fallback 8
    "#00F0C8", // Bright Mint   — fallback 9
    "#5580FF", // Periwinkle    — fallback 10
    "#FF60C0", // Soft Pink     — fallback 11
    "#40D8FF", // Light Cyan    — fallback 12
  ];

  function assignRingColors(n, startIdx) {
    if (!n) return [];
    const offset = startIdx || 0;
    return Array.from({ length: n }, (_, i) => RING_COLORS[(offset + i) % RING_COLORS.length]);
  }

  /* ═══════════════════════════════════════════════════════════════
     SCORE RINGS SVG
  ═══════════════════════════════════════════════════════════════ */
  function ScoreRings({
    score, maxScore, categories,
    activeIdx, hoverIdx,
    onRingClick, onRingHover,
    decisionLabel, centerLabel,
  }) {
    const size   = 300;
    const trackW = 10;
    const gap    = 6;
    const cx = size / 2, cy = size / 2;

    const cats = categories || [];

    /* center content — hover overrides default */
    const hoverCat  = hoverIdx !== null ? cats[hoverIdx] : null;
    const dc        = hoverCat;
    const cScore    = dc ? dc.achieved : score;
    const cMax      = dc ? dc.maxPts   : maxScore;
    const cTopLabel = dc
      ? dc.label.replace(/\s*[&–-].*/, "").trim().toUpperCase().slice(0, 12)
      : (centerLabel || "APPROVAL");
    const cSubLabel = dc
      ? `${dc.pct}%${dc.weight ? " · " + dc.weight : ""}`
      : (decisionLabel || "");
    const cNumColor = dc ? dc.color : "#ffffff";

    const innerR  = (size / 2 - trackW / 2 - 4) - Math.max(0, cats.length - 1) * (trackW + gap);
    const bgDiscR = Math.max(20, innerR - trackW / 4 - 1);

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        style={{ display: "block", flexShrink: 0 }}>

        {cats.map((cat, i) => {
          const r    = (size / 2 - trackW / 2 - 4) - i * (trackW + gap);
          if (r <= 12) return null;
          const circ = 2 * Math.PI * r;
          const pct  = Math.min(1, (cat.pct || 0) / 100);
          const fill = circ * pct;

          const isActive  = activeIdx === i;
          const isHovered = hoverIdx  === i;
          const lift      = isActive || isHovered;
          const anyFocus  = hoverIdx !== null || activeIdx !== null;

          /* active arc brightness — inactive rings remain visible in the background */
          const activeOp   = anyFocus ? (lift ? 0.90 : 0.78) : 0.86;
          const inactiveOp = anyFocus ? (lift ? 0.16 : 0.10) : 0.12;
          const glowOp     = anyFocus ? (lift ? 0.34 : 0.14) : 0.24;
          const arcW       = trackW + (lift ? 2 : 0);

          const endAngle = -Math.PI / 2 + 2 * Math.PI * pct;
          const dotX     = cx + r * Math.cos(endAngle);
          const dotY     = cy + r * Math.sin(endAngle);

          return (
            <g key={cat.id || i}
              style={{
                cursor: "pointer",
                transform: lift ? "scale(1.015)" : "scale(1)",
                transformOrigin: `${cx}px ${cy}px`,
                transition: "transform 0.2s ease",
              }}
              onClick={() => onRingClick(i)}
              onMouseEnter={() => onRingHover(i)}
              onMouseLeave={() => onRingHover(null)}
            >
              {/* ── INACTIVE ARC — full ring, muted, shows remaining portion ── */}
              <circle cx={cx} cy={cy} r={r} fill="none"
                stroke={cat.color} strokeWidth={Math.max(1, arcW - 3)}
                strokeLinecap="round"
                style={{ opacity: inactiveOp, transition: "opacity 0.2s, stroke-width 0.15s" }}
              />

              {/* ── ACTIVE ARC — glow bloom behind crisp arc ── */}
              {pct > 0.02 && (
                <circle cx={cx} cy={cy} r={r} fill="none"
                  stroke={cat.color} strokeWidth={arcW + 3}
                  strokeLinecap="round"
                  strokeDasharray={`${fill} ${circ - fill}`}
                  transform={`rotate(-90 ${cx} ${cy})`}
                  style={{
                    opacity: glowOp,
                    strokeOpacity: 0.78,
                    filter: "blur(1.5px)",
                    transition: "opacity 0.2s",
                  }}
                />
              )}

              {/* ── ACTIVE ARC — crisp bright stroke, no filter ── */}
              <circle cx={cx} cy={cy} r={r} fill="none"
                stroke={cat.color} strokeWidth={arcW}
                strokeLinecap="round"
                strokeDasharray={`${fill} ${circ - fill}`}
                transform={`rotate(-90 ${cx} ${cy})`}
                style={{
                  opacity: activeOp,
                  transition: "opacity 0.2s, stroke-width 0.15s, stroke-dasharray 0.45s ease",
                }}
              />

              {/* ── START MARKER — glow bloom ── */}
              <circle cx={cx} cy={cy - r} r={10}
                fill={cat.color}
                style={{ opacity: glowOp * 0.65, filter: "blur(2px)", transition: "opacity 0.2s" }}
              />
              {/* start marker — colored fill ring */}
              <circle cx={cx} cy={cy - r} r={7}
                fill={cat.color}
                stroke="rgba(255,255,255,0.28)"
                strokeWidth={1.5}
                style={{ opacity: anyFocus ? (lift ? 1.0 : 0.72) : 0.95, transition: "opacity 0.2s" }}
              />
              {/* start marker — dark center punch */}
              <circle cx={cx} cy={cy - r} r={3}
                fill="var(--bg-0)"
                style={{ opacity: 1 }}
              />

              {/* ── END MARKER — stronger glow than start ── */}
              {pct > 0.02 && (
                <circle cx={dotX} cy={dotY} r={14}
                  fill={cat.color}
                  style={{ opacity: glowOp * 0.80, filter: "blur(3px)", transition: "opacity 0.2s" }}
                />
              )}
              {/* end marker — colored fill ring */}
              {pct > 0.02 && (
                <circle cx={dotX} cy={dotY} r={9}
                  fill={cat.color}
                  stroke="rgba(255,255,255,0.28)"
                  strokeWidth={1.5}
                  style={{ opacity: Math.min(1, activeOp), transition: "opacity 0.2s" }}
                />
              )}
              {/* end marker — dark center punch */}
              {pct > 0.02 && (
                <circle cx={dotX} cy={dotY} r={3.5}
                  fill="var(--bg-0)"
                  style={{ opacity: 1 }}
                />
              )}

              {/* wide invisible hit zone */}
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="transparent" strokeWidth={trackW + 18} />
            </g>
          );
        })}

        {/* centre background disc — solid dark, covers ring glow bleed */}
        <circle cx={cx} cy={cy} r={bgDiscR} fill="var(--bg-0)" style={{ opacity: 1 }} />
        <circle cx={cx} cy={cy} r={bgDiscR} fill="var(--bg-1)" style={{ opacity: 0.88 }} />

        {/* centre text */}
        <g style={{ transition: "opacity 0.18s" }}>
          <text x={cx} y={cy - 22}
            textAnchor="middle" fill="rgba(255,255,255,0.96)"
            fontSize="8.5" fontWeight="700" letterSpacing="0.18em"
            fontFamily="var(--font-mono)"
            style={{ textShadow: "0 0 2px rgba(255,255,255,0.10)" }}
          >
            {cTopLabel}
          </text>

          <text x={cx} y={cy + 10}
            textAnchor="middle" fill={cNumColor}
            fontSize="40" fontWeight="800"
            fontFamily="var(--font-mono)"
            style={{ transition: "fill 0.18s", filter: "drop-shadow(0 0 4px rgba(255,255,255,0.12))" }}
          >
            {cScore}
          </text>

          <text x={cx} y={cy + 28}
            textAnchor="middle" fill="rgba(255,255,255,0.70)"
            fontSize="11.5" fontFamily="var(--font-mono)"
            fontWeight="700"
          >
            / {cMax}
          </text>

          <text x={cx} y={cy + 44}
            textAnchor="middle" fill="rgba(255,255,255,0.62)" fontSize="9"
            fontFamily="var(--font-mono)"
            style={{ fontWeight: 600 }}
          >
            {(cSubLabel || "").length > 20 ? cSubLabel.slice(0, 19) + "…" : cSubLabel}
          </text>
        </g>
      </svg>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     HOVER CARD (tooltip shown below a row)
  ═══════════════════════════════════════════════════════════════ */
  function HoverCard({ title, rows, accentColor }) {
    return (
      <div className="sc-hover-card" style={{ borderLeft: `3px solid ${accentColor}` }}>
        <div className="sc-hover-card-title">{title}</div>
        {rows.map((row, i) => (
          <div key={i} className="sc-hover-card-row">
            <span className="sc-hover-card-label">{row.label}</span>
            <span className="sc-hover-card-score" style={{ color: row.color }}>{row.score}</span>
          </div>
        ))}
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     LEVEL-ROW (shared row for category / subcategory lists)
  ═══════════════════════════════════════════════════════════════ */
  function LevelRow({ label, meta, pct, achieved, maxPts, color, isHighlighted, onClick, onMouseEnter, onMouseLeave, children }) {
    const perf = perfMeta(pct);
    return (
      <div style={{ position: "relative" }} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        <button
          type="button"
          className="sc-level-row sc-level-row-nav"
          style={{
            borderLeft: `3px solid ${color}`,           /* category color — identity */
            background: isHighlighted ? `oklch(from ${color} l c h / 0.08)` : "transparent",
          }}
          onClick={onClick}
        >
          <div className="sc-level-row-left">
            <span className="sc-level-row-label"
              style={{ color: isHighlighted ? color : "var(--text-1)" }}
            >{label}</span>
            {meta && <span className="sc-level-row-meta">{meta}</span>}
          </div>
          <div className="sc-level-row-right">
            {/* perf dot — performance identity separate from category left-border */}
            <span className="sc-level-perf-dot" style={{ background: perf.color }} />
            <div className="sc-level-bar-track" style={{ width: 56 }}>
              <div className="sc-level-bar-fill" style={{ width: pct + "%", background: perf.color }} />
            </div>
            <div className="sc-level-score-block">
              <span className="sc-level-row-score" style={{ color: perf.color }}>
                {achieved}<span className="sc-level-row-max">/{maxPts}</span>
              </span>
              <span className="sc-level-perf-label" style={{ color: perf.color }}>{perf.label}</span>
            </div>
          </div>
        </button>
        {children}
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     LEVEL 0 — CATEGORY PANEL
  ═══════════════════════════════════════════════════════════════ */
  function CategoryLevelPanel({ categories, score, maxScore, hoverIdx, onRowHover, onSelect }) {
    return (
      <div className="sc-breakdown-card">
        <div className="sc-breakdown-header">
          <span className="sc-breakdown-title">COMPOSITE BREAKDOWN</span>
          <span className="sc-breakdown-total">
            {score}<span className="sc-breakdown-max">/{maxScore}</span>
          </span>
        </div>
        <div className="sc-breakdown-body">
          <p className="sc-breakdown-desc">Click a category to drill into subcategories and parameters.</p>
          <div className="sc-level-list">
            {(categories || []).map((cat, i) => {
              const subs = normalizeSubcats(cat);
              const isHigh = hoverIdx === i;
              const catPerf = perfMeta(cat.pct);
              const subRows = subs.map(s => {
                const st = subcatStats(s);
                return { label: s.label, score: `${st.achieved}/${st.maxPts}`, color: perfMeta(st.pct).color };
              });
              return (
                <LevelRow
                  key={i}
                  label={cat.label}
                  meta={`${cat.weight} · ${subs.length} subcategor${subs.length !== 1 ? "ies" : "y"}`}
                  pct={cat.pct} achieved={cat.achieved} maxPts={cat.maxPts} color={cat.color}
                  isHighlighted={isHigh}
                  onClick={() => onSelect(i)}
                  onMouseEnter={() => onRowHover(i)}
                  onMouseLeave={() => onRowHover(null)}
                >
                  {isHigh && subRows.length > 0 && (
                    <HoverCard title="Subcategories" rows={subRows} accentColor={catPerf.color} />
                  )}
                </LevelRow>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     LEVEL 1 — SUBCATEGORY PANEL
  ═══════════════════════════════════════════════════════════════ */
  function SubcategoryLevelPanel({ cat, subcatColors, hoverIdx, onRowHover, onSelect, onBack }) {
    const subcats  = normalizeSubcats(cat);
    const catPerf  = perfMeta(cat.pct);
    return (
      <div className="sc-breakdown-card">
        <div className="sc-breakdown-header">
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <button className="sc-back-btn" onClick={onBack}>← Back</button>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: cat.color, flexShrink: 0, display: "inline-block" }} />
            <span className="sc-breakdown-title">{cat.label.toUpperCase()}</span>
            <span className="sc-cat-weight-pill">{cat.weight}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span className="sc-breakdown-total" style={{ color: catPerf.color }}>
              {cat.achieved}<span className="sc-breakdown-max">/{cat.maxPts}</span>
            </span>
            <span className="sc-perf-badge" style={{ color: catPerf.color }}>{catPerf.label} · {catPerf.pct}%</span>
          </div>
        </div>
        <div className="sc-breakdown-body">
          <div className="sc-drill-bar-row">
            <div className="sc-cat-bar-track" style={{ flex: 1, height: 5 }}>
              <div style={{ width: cat.pct + "%", background: catPerf.color, height: "100%", borderRadius: 3, transition: "width 0.4s ease" }} />
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: catPerf.color, marginLeft: 10, minWidth: 36, textAlign: "right" }}>{cat.pct}%</span>
          </div>
          <p className="sc-breakdown-desc" style={{ marginTop: 12 }}>Click a subcategory to view individual parameters.</p>
          <div className="sc-level-list">
            {subcats.map((sub, i) => {
              const st       = subcatStats(sub);
              const isHigh   = hoverIdx === i;
              const subPerf  = perfMeta(st.pct);
              const subColor = (subcatColors && subcatColors[i]) || cat.color;
              const paramRows = (sub.items || []).slice(0, 5).map(p => ({
                label: p.label,
                score: `${p.points}/${p.maxPoints}`,
                color: perfMeta(p.pct).color,
              }));
              return (
                <LevelRow
                  key={i}
                  label={sub.label}
                  meta={`${(sub.items || []).length} parameter${(sub.items || []).length !== 1 ? "s" : ""}`}
                  pct={st.pct} achieved={st.achieved} maxPts={st.maxPts} color={subColor}
                  isHighlighted={isHigh}
                  onClick={() => onSelect(i)}
                  onMouseEnter={() => onRowHover(i)}
                  onMouseLeave={() => onRowHover(null)}
                >
                  {isHigh && paramRows.length > 0 && (
                    <HoverCard title="Parameters" rows={paramRows} accentColor={subPerf.color} />
                  )}
                </LevelRow>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     LEVEL 2 — PARAMETER PANEL
  ═══════════════════════════════════════════════════════════════ */
  function ParameterLevelPanel({ subcat, cat, paramColors, hoverIdx, activeRingIdx, onBack }) {
    const [expandedIdx, setExpandedIdx] = useState(null);
    const [hoveredIdx,  setHoveredIdx]  = useState(null);
    const params      = subcat.items || [];
    const st          = subcatStats(subcat);
    const subcatPerf  = perfMeta(st.pct);

    const effectiveExpanded = activeRingIdx !== null ? activeRingIdx : expandedIdx;

    return (
      <div className="sc-breakdown-card">
        <div className="sc-breakdown-header">
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <button className="sc-back-btn" onClick={onBack}>← Back</button>
            <span className="sc-breakdown-title">{subcat.label.toUpperCase()}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span className="sc-breakdown-total" style={{ color: subcatPerf.color }}>
              {st.achieved}<span className="sc-breakdown-max">/{st.maxPts}</span>
            </span>
            <span className="sc-perf-badge" style={{ color: subcatPerf.color }}>{subcatPerf.label} · {subcatPerf.pct}%</span>
          </div>
        </div>
        <div className="sc-breakdown-body">
          <div className="sc-drill-bar-row">
            <div className="sc-cat-bar-track" style={{ flex: 1, height: 5 }}>
              <div style={{ width: st.pct + "%", background: subcatPerf.color, height: "100%", borderRadius: 3, transition: "width 0.4s ease" }} />
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: subcatPerf.color, marginLeft: 10, minWidth: 36, textAlign: "right" }}>{st.pct}%</span>
          </div>
          <div className="sc-level-list" style={{ marginTop: 12 }}>
            {params.map((param, i) => {
              const paramPerf  = perfMeta(param.pct);
              const paramColor = (paramColors && paramColors[i]) || cat.color;
              const isExp      = effectiveExpanded === i;
              const isHov      = hoveredIdx === i;
              const showDetails = isExp || isHov;
              return (
                <div
                  key={i}
                  style={{ position: "relative" }}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <div
                    className="sc-param-card"
                    style={{
                      borderLeft: `3px solid ${paramColor}`,
                      background: (isHov || isExp) ? `oklch(from ${paramColor} l c h / 0.09)` : "transparent",
                    }}
                    onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: (isHov || isExp) ? paramColor : "var(--text-1)", flex: 1, minWidth: 0 }}>
                        {param.label}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <div className="sc-level-bar-track" style={{ width: 52 }}>
                          <div className="sc-level-bar-fill" style={{ width: param.pct + "%", background: paramPerf.color }} />
                        </div>
                        <div className="sc-level-score-block">
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: paramPerf.color, minWidth: 36, textAlign: "right" }}>
                            {param.points}<span style={{ color: "var(--text-3)", fontWeight: 400 }}>/{param.maxPoints}</span>
                          </span>
                          <span className="sc-level-perf-label" style={{ color: paramPerf.color }}>{paramPerf.label}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {showDetails && (
                    <div style={{ marginTop: 8, marginLeft: 12, marginRight: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, paddingTop: 10, paddingBottom: 8, borderTop: `1px solid ${paramColor}`, borderLeft: `3px solid ${paramColor}` }}>
                      <div>
                        <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.10em", color: "var(--text-3)", fontWeight: 700, marginBottom: 4 }}>Actual Value</div>
                        <div style={{ fontSize: 12, color: "var(--text-1)", fontWeight: 500 }}>{param.value || "—"}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.10em", color: "var(--text-3)", fontWeight: 700, marginBottom: 4 }}>Benchmark</div>
                        <div style={{ fontSize: 12, color: "var(--text-2)" }}>{param.benchmark || "—"}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     DRILLDOWN SCORECARD — unified state machine
  ═══════════════════════════════════════════════════════════════ */
  function DrilldownScorecard({ app }) {
    const sc   = app?.scorecard || {};
    const cats = sc.categories || [];

    const [level,             setLevel]             = useState(0);
    const [selectedCatIdx,    setSelectedCatIdx]    = useState(null);
    const [selectedSubcatIdx, setSelectedSubcatIdx] = useState(null);
    const [hoverIdx,          setHoverIdx]          = useState(null);
    const [activeRingIdx,     setActiveRingIdx]     = useState(null);

    const selectedCat    = selectedCatIdx    !== null ? cats[selectedCatIdx]       : null;
    const subcats        = selectedCat       ? normalizeSubcats(selectedCat)       : [];
    const selectedSubcat = selectedSubcatIdx !== null ? subcats[selectedSubcatIdx] : null;

    /* independent color palettes — each level freely cycles the neon ring palette */
    const subcatColors = useMemo(
      () => selectedCat ? assignRingColors(subcats.length) : [],
      [selectedCat?.id, subcats.length]
    );

    const selectedSubcatColor = (selectedSubcatIdx !== null && subcatColors[selectedSubcatIdx])
      || (selectedCat ? selectedCat.color : null);

    const paramColors = useMemo(
      () => selectedSubcat
        ? assignRingColors((selectedSubcat.items || []).length)
        : [],
      [selectedSubcat?.label]
    );

    /* ring items for current level */
    const ringItems = useMemo(() => {
      if (level === 0) return cats;
      if (level === 1 && selectedCat) return subcats.map((s, i) => subcatToRingItem(s, subcatColors[i] || selectedCat.color));
      if (level === 2 && selectedSubcat) return (selectedSubcat.items || []).map((p, i) => paramToRingItem(p, paramColors[i] || selectedSubcatColor));
      return cats;
    }, [level, selectedCatIdx, selectedSubcatIdx, subcatColors, paramColors]);

    /* ring center values */
    const centerScore = level === 0 ? sc.score
      : level === 1 && selectedCat ? selectedCat.achieved
      : level === 2 && selectedSubcat ? subcatStats(selectedSubcat).achieved
      : sc.score;

    const centerMax = level === 0 ? sc.maxScore
      : level === 1 && selectedCat ? selectedCat.maxPts
      : level === 2 && selectedSubcat ? subcatStats(selectedSubcat).maxPts
      : sc.maxScore;

    const centerLabel = level === 0 ? "APPROVAL"
      : level === 1 && selectedCat ? selectedCat.label.replace(/\s*[&–-].*/, "").trim().toUpperCase().slice(0, 10)
      : level === 2 && selectedSubcat ? selectedSubcat.label.split(" ")[0].toUpperCase().slice(0, 10)
      : "APPROVAL";

    const centerSublabel = level === 0 ? (sc.decisionLabel || "")
      : level === 1 && selectedCat ? `${selectedCat.pct}% · ${selectedCat.weight}`
      : level === 2 && selectedSubcat ? `${subcatStats(selectedSubcat).pct}% of subcategory`
      : (sc.decisionLabel || "");

    /* ring click → drill down */
    const handleRingClick = (i) => {
      setHoverIdx(null);
      if (level === 0) {
        setSelectedCatIdx(i); setSelectedSubcatIdx(null); setLevel(1); setActiveRingIdx(null);
      } else if (level === 1) {
        setSelectedSubcatIdx(i); setLevel(2); setActiveRingIdx(null);
      } else if (level === 2) {
        /* at parameter level, ring click expands that param */
        setActiveRingIdx(prev => prev === i ? null : i);
      }
    };

    /* row hover → sync ring highlight */
    const handleRowHover = (i) => setHoverIdx(i);

    return (
      <div className="sc-panel">
        <div className="sc-main-layout">

          {/* ── Left: rings + legend ── */}
          <div className="sc-rings-col">
            <ScoreRings
              score={centerScore}
              maxScore={centerMax}
              categories={ringItems}
              activeIdx={activeRingIdx}
              hoverIdx={hoverIdx}
              onRingClick={handleRingClick}
              onRingHover={setHoverIdx}
              decisionLabel={centerSublabel}
              centerLabel={centerLabel}
            />
          </div>

          {/* ── Right: level panel + AI card ── */}
          <div className="sc-detail-col">
            {level === 0 && (
              <CategoryLevelPanel
                categories={cats} score={sc.score} maxScore={sc.maxScore}
                hoverIdx={hoverIdx} onRowHover={handleRowHover}
                onSelect={(i) => { setSelectedCatIdx(i); setSelectedSubcatIdx(null); setLevel(1); setActiveRingIdx(null); setHoverIdx(null); }}
              />
            )}
            {level === 1 && selectedCat && (
              <SubcategoryLevelPanel
                cat={selectedCat} subcatColors={subcatColors}
                hoverIdx={hoverIdx} onRowHover={handleRowHover}
                onSelect={(i) => { setSelectedSubcatIdx(i); setLevel(2); setActiveRingIdx(null); setHoverIdx(null); }}
                onBack={() => { setLevel(0); setSelectedCatIdx(null); setActiveRingIdx(null); setHoverIdx(null); }}
              />
            )}
            {level === 2 && selectedSubcat && selectedCat && (
              <ParameterLevelPanel
                subcat={selectedSubcat} cat={selectedCat} paramColors={paramColors}
                hoverIdx={hoverIdx} activeRingIdx={activeRingIdx}
                onBack={() => { setLevel(1); setSelectedSubcatIdx(null); setActiveRingIdx(null); setHoverIdx(null); }}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     LEGACY COMPONENTS — kept for backward compatibility
  ═══════════════════════════════════════════════════════════════ */

  function SubcategoryDetail({ subcat, parentColor, onBack }) {
    const [expandedParamIdx, setExpandedParamIdx] = useState(null);
    const st     = subcatStats(subcat);
    const params = subcat.items || [];
    const stPerf = perfMeta(st.pct);

    if (expandedParamIdx !== null) {
      const param     = params[expandedParamIdx];
      const paramPerf = perfMeta(param.pct);
      return (
        <div className="sc-breakdown-card">
          <div className="sc-breakdown-header">
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <button className="sc-back-btn" onClick={() => setExpandedParamIdx(null)}>← Back</button>
              <span className="sc-breakdown-title">{param.label.toUpperCase()}</span>
            </div>
            <span className="sc-breakdown-total" style={{ color: paramPerf.color }}>{param.points}<span className="sc-breakdown-max">/{param.maxPoints}</span></span>
          </div>
          <div className="sc-drill-bar-row">
            <div className="sc-cat-bar-track" style={{ flex: 1, height: 5 }}>
              <div style={{ width: param.pct + "%", background: paramPerf.color, height: "100%", borderRadius: 3 }} />
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: paramPerf.color, marginLeft: 10, minWidth: 36, textAlign: "right" }}>{param.pct}%</span>
          </div>
          <div style={{ marginTop: 14, padding: 12, background: "var(--bg-2)", borderRadius: 6, borderLeft: `3px solid ${parentColor}` }}>
            <h4 style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, color: "var(--text-3)", marginBottom: 5 }}>Actual Value</h4>
            <p style={{ fontSize: 13, color: "var(--text-1)", fontWeight: 500, marginBottom: 10 }}>{param.value}</p>
            <h4 style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, color: "var(--text-3)", marginBottom: 5 }}>Benchmark</h4>
            <p style={{ fontSize: 13, color: "var(--text-1)", fontWeight: 500 }}>{param.benchmark}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="sc-breakdown-card">
        <div className="sc-breakdown-header">
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <button className="sc-back-btn" onClick={onBack}>← Back</button>
            <span className="sc-breakdown-title">{subcat.label.toUpperCase()}</span>
          </div>
          <span className="sc-breakdown-total" style={{ color: stPerf.color }}>{st.achieved}<span className="sc-breakdown-max">/{st.maxPts}</span></span>
        </div>
        <div className="sc-drill-bar-row">
          <div className="sc-cat-bar-track" style={{ flex: 1, height: 5 }}>
            <div style={{ width: st.pct + "%", background: stPerf.color, height: "100%", borderRadius: 3 }} />
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: stPerf.color, marginLeft: 10, minWidth: 36, textAlign: "right" }}>{st.pct}%</span>
        </div>
        <div className="sc-cat-items" style={{ marginTop: 12 }}>
          {params.map((param, i) => {
            const pc = perfMeta(param.pct).color;
            return (
              <div key={i} className="sc-cat-item-row sc-cat-item-nav"
                onClick={() => setExpandedParamIdx(i)}
                style={{ borderLeft: `3px solid ${parentColor}`, paddingLeft: 12, cursor: "pointer" }}
              >
                <span className="sc-cat-item-label">{param.label}</span>
                <span className="sc-cat-item-pts" style={{ color: pc }}>{param.points}<span style={{ color: "var(--text-3)", fontWeight: 400 }}>/{param.maxPoints}</span></span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function CategoryDetail({ cat, onClose }) {
    const [selectedSubcat, setSelectedSubcat] = useState(null);
    const catPerf       = perfMeta(cat.pct);
    const subcategories = normalizeSubcats(cat);

    if (selectedSubcat) {
      return <SubcategoryDetail subcat={selectedSubcat} parentColor={cat.color} onBack={() => setSelectedSubcat(null)} />;
    }

    return (
      <div className="sc-breakdown-card">
        <div className="sc-breakdown-header">
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: cat.color, flexShrink: 0, display: "inline-block" }} />
            <span className="sc-breakdown-title">{cat.label.toUpperCase()}</span>
            <span className="sc-cat-weight-pill">{cat.weight}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="sc-breakdown-total" style={{ color: catPerf.color }}>{cat.achieved}<span className="sc-breakdown-max">/{cat.maxPts}</span></span>
            <button className="sc-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="sc-drill-bar-row">
          <div className="sc-cat-bar-track" style={{ flex: 1, height: 5 }}>
            <div style={{ width: cat.pct + "%", background: catPerf.color, height: "100%", borderRadius: 3 }} />
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: catPerf.color, marginLeft: 10, minWidth: 36, textAlign: "right" }}>{cat.pct}%</span>
        </div>
        <div className="sc-cat-items" style={{ marginTop: 12 }}>
          {subcategories.map((sub, i) => {
            const st = subcatStats(sub);
            const pc = perfMeta(st.pct).color;
            return (
              <div key={i} className="sc-cat-item-row sc-cat-item-nav"
                onClick={() => setSelectedSubcat(sub)}
                style={{ borderLeft: `3px solid ${cat.color}`, paddingLeft: 12, cursor: "pointer" }}
              >
                <span className="sc-cat-item-label">{sub.label}</span>
                <span className="sc-cat-item-pts" style={{ color: pc }}>{st.achieved}<span style={{ color: "var(--text-3)", fontWeight: 400 }}>/{st.maxPts}</span></span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function CompositeOverview({ score, maxScore, categories, onNavigate }) {
    const [expandedCatIdx, setExpandedCatIdx] = useState(null);

    if (expandedCatIdx !== null) {
      const cat = categories[expandedCatIdx];
      return (
        <div className="sc-breakdown-card">
          <div className="sc-breakdown-header">
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <button className="sc-back-btn" onClick={() => setExpandedCatIdx(null)}>← Back</button>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: cat.color, flexShrink: 0, display: "inline-block" }} />
              <span className="sc-breakdown-title">{cat.label.toUpperCase()}</span>
              <span className="sc-cat-weight-pill">{cat.weight}</span>
            </div>
            <span className="sc-breakdown-total" style={{ color: perfMeta(cat.pct).color }}>{cat.achieved}<span className="sc-breakdown-max">/{cat.maxPts}</span></span>
          </div>
          <div className="sc-cat-items" style={{ marginTop: 12 }}>
            {normalizeSubcats(cat).map((sub, i) => {
              const st = subcatStats(sub);
              const pc = perfMeta(st.pct).color;
              return (
                <div key={i} className="sc-cat-item-row"
                  style={{ borderLeft: `3px solid ${cat.color}`, paddingLeft: 12 }}
                >
                  <span className="sc-cat-item-label">{sub.label}</span>
                  <span className="sc-cat-item-pts" style={{ color: pc }}>{st.achieved}<span style={{ color: "var(--text-3)", fontWeight: 400 }}>/{st.maxPts}</span></span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="sc-breakdown-card">
        <div className="sc-breakdown-header">
          <span className="sc-breakdown-title">COMPOSITE BREAKDOWN</span>
          <span className="sc-breakdown-total">{score}<span className="sc-breakdown-max">/{maxScore}</span></span>
        </div>
        <div className="sc-overview-grid" style={{ marginTop: 12 }}>
          {(categories || []).map((cat, i) => (
            <button key={i} type="button" className="sc-overview-cell sc-overview-nav"
              onClick={() => setExpandedCatIdx(i)}
            >
              <span className="sc-overview-dot" style={{ background: cat.color }} />
              <span className="sc-overview-label">{cat.label}</span>
              <span className="sc-overview-pts" style={{ color: perfMeta(cat.pct).color }}>
                {cat.achieved}<span className="sc-overview-max">/{cat.maxPts}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ─── ScorecardPanel (tab entry-point — wraps DrilldownScorecard) ── */
  function ScorecardPanel({ score, maxScore, decisionLabel, decisionTone, meta, categories, decisionSummary, onNavigate, app }) {
    if (!score) return <div style={{ padding: 32, color: "var(--text-3)" }}>No scorecard data available.</div>;
    /* app may be passed directly; build a minimal proxy if missing */
    const proxyApp = app || { scorecard: { score, maxScore, decisionLabel, decisionTone, meta, categories, decisionSummary } };
    return <DrilldownScorecard app={proxyApp} />;
  }

  /* ─── Exports ────────────────────────────────────────────────── */
  window.ScoreRings         = ScoreRings;
  window.CompositeOverview  = CompositeOverview;
  window.CategoryDetail     = CategoryDetail;
  window.SubcategoryDetail  = SubcategoryDetail;
  window.DrilldownScorecard = DrilldownScorecard;
  window.ScorecardPanel     = ScorecardPanel;
})();
