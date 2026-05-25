// SectionNavigator — radial arc wheel navigator
// Receives: { app, docPct }
// Renders as a true overlay — position:fixed, never affects document layout.

(function () {
  const { useState, useEffect } = React;

  /* ── Section registry ──────────────────────────────────────── */
  const SECTIONS = [
    { id: "section-scorecard",   label: "Score Overview",        icon: "chart",  color: "#38BDF8" },
    { id: "section-docs",        label: "Documents Summary",     icon: "doc",    color: "#34D399" },
    { id: "section-identity",    label: "Applicant Identity",    icon: "person", color: "#818CF8" },
    { id: "section-employment",  label: "Employment & Business", icon: "brief",  color: "#F472B6" },
    { id: "section-income",      label: "Income & Financials",   icon: "coin",   color: "#FBBF24" },
    { id: "section-bureau",      label: "Bureau & Credit",       icon: "shield", color: "#22D3EE" },
    { id: "section-property",    label: "Property Details",      icon: "home",   color: "#A78BFA" },
    { id: "section-collateral",  label: "Collateral & Legal",    icon: "lock",   color: "#FB7185" },
  ];

  /* ── Layout constants ─────────────────────────────────────── */
  const CW      = 460;
  const CH      = 420;
  const TRIG_R  = 8;                            // px inset from viewport right edge
  const TRIG_SZ = 56;                           // trigger circle diameter
  const TCX     = CW - TRIG_R - TRIG_SZ / 2;  // 424 — trigger centre X in container
  const TCY     = CH / 2;                       // 210 — trigger centre Y
  const R       = 162;
  const RI      = 95;
  const N       = SECTIONS.length;
  const ANG0    = 115;
  const ANG1    = 245;

  function geom(i) {
    const deg = ANG0 + (i / (N - 1)) * (ANG1 - ANG0);
    const rad = deg * Math.PI / 180;
    return {
      cx:  R  * Math.cos(rad),
      cy: -R  * Math.sin(rad),
      icx: RI * Math.cos(rad),
      icy: -RI * Math.sin(rad),
    };
  }

  function buildArc(radius, a0, a1) {
    const r0 = a0 * Math.PI / 180;
    const r1 = a1 * Math.PI / 180;
    const x0 = (TCX + radius * Math.cos(r0)).toFixed(2);
    const y0 = (TCY - radius * Math.sin(r0)).toFixed(2);
    const x1 = (TCX + radius * Math.cos(r1)).toFixed(2);
    const y1 = (TCY - radius * Math.sin(r1)).toFixed(2);
    return `M ${x0} ${y0} A ${radius} ${radius} 0 0 0 ${x1} ${y1}`;
  }

  const ARC_MAIN  = buildArc(R,      ANG0,     ANG1);
  const ARC_INNER = buildArc(RI,     ANG0,     ANG1);
  const ARC_OUTER = buildArc(R + 26, ANG0 + 7, ANG1 - 7);

  /* ── Icon set ───────────────────────────────────────────────── */
  function NavIcon({ type, size = 14, color = "currentColor" }) {
    const p = {
      width: size, height: size, viewBox: "0 0 24 24",
      fill: "none", stroke: color,
      strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round",
    };
    switch (type) {
      case "chart":  return <svg {...p}><path d="M18 20V10M12 20V4M6 20v-6"/></svg>;
      case "doc":    return <svg {...p}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>;
      case "person": return <svg {...p}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>;
      case "brief":  return <svg {...p}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>;
      case "coin":   return <svg {...p}><circle cx="12" cy="12" r="10"/><path d="M12 6v2m0 8v2M9.17 9.17A3 3 0 0112 8a3 3 0 010 6 3 3 0 01-2.83-2"/></svg>;
      case "shield": return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
      case "home":   return <svg {...p}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>;
      case "lock":   return <svg {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>;
      default:       return <svg {...p}><circle cx="12" cy="12" r="3"/></svg>;
    }
  }

  /* ── Main component ─────────────────────────────────────────── */
  function SectionNavigator({ app, docPct, aiOpen = false }) {
    const [open,     setOpen]     = useState(false);
    const [live,     setLive]     = useState(false);
    const [activeId, setActiveId] = useState(SECTIONS[0].id);
    const [hoverId,  setHoverId]  = useState(null);
    const [trigHov,  setTrigHov]  = useState(false);
    const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

    /* ── Responsive breakpoint ──────────────────────────────── */
    useEffect(() => {
      const h = () => setIsMobile(window.innerWidth <= 768);
      window.addEventListener("resize", h, { passive: true });
      return () => window.removeEventListener("resize", h);
    }, []);

    /* ── Scroll tracking ────────────────────────────────────── */
    useEffect(() => {
      const scrollEl = document.querySelector(".apdet-content");
      const track = () => {
        const base = scrollEl ? scrollEl.getBoundingClientRect().top : 0;
        const thr  = base + window.innerHeight * 0.33;
        let cur = null;
        for (const s of SECTIONS) {
          const el = document.getElementById(s.id);
          if (el && el.getBoundingClientRect().top <= thr) cur = s.id;
        }
        if (cur) setActiveId(cur);
      };
      const host = scrollEl || window;
      host.addEventListener("scroll", track, { passive: true });
      const t = setTimeout(track, 200);
      return () => { host.removeEventListener("scroll", track); clearTimeout(t); };
    }, []);

    /* ── Stagger gate ───────────────────────────────────────── */
    useEffect(() => {
      if (open) {
        const t = setTimeout(() => setLive(true), 18);
        return () => clearTimeout(t);
      }
      setLive(false);
    }, [open]);

    /* ── Escape key ─────────────────────────────────────────── */
    useEffect(() => {
      const h = e => { if (e.key === "Escape") setOpen(false); };
      document.addEventListener("keydown", h);
      return () => document.removeEventListener("keydown", h);
    }, []);

    /* ── Scroll to section ──────────────────────────────────── */
    const scrollTo = id => {
      const el   = document.getElementById(id);
      const cont = document.querySelector(".apdet-content");
      if (el && cont) {
        const cr = cont.getBoundingClientRect();
        const er = el.getBoundingClientRect();
        cont.scrollTo({ top: cont.scrollTop + (er.top - cr.top) - 16, behavior: "smooth" });
      } else if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
      setActiveId(id);
      setOpen(false);
    };

    /* ── Shared trigger visual styles ───────────────────────── */
    const trigBase = {
      width: TRIG_SZ, height: TRIG_SZ,
      borderRadius: "50%",
      background: open || trigHov ? "rgba(10,15,35,0.98)" : "rgba(8,12,28,0.93)",
      backdropFilter: "blur(22px)",
      WebkitBackdropFilter: "blur(22px)",
      border: `1.5px solid rgba(56,189,248,${open ? 0.50 : trigHov ? 0.38 : 0.28})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer",
      boxShadow: open
        ? "0 0 0 2px rgba(56,189,248,0.22), 0 0 36px rgba(56,189,248,0.44), inset 0 0 14px rgba(56,189,248,0.10)"
        : trigHov
          ? "0 0 0 1px rgba(56,189,248,0.20), 0 0 26px rgba(56,189,248,0.32)"
          : "0 0 0 1px rgba(56,189,248,0.12), 0 0 20px rgba(56,189,248,0.22)",
      transition: "background 0.2s, box-shadow 0.3s, border-color 0.2s",
    };

    const trigIcon = open ? (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="rgba(56,189,248,0.92)" strokeWidth="2.2" strokeLinecap="round">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    ) : (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke={trigHov ? "rgba(56,189,248,0.96)" : "rgba(56,189,248,0.74)"}
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        style={{ transition: "stroke 0.2s" }}>
        <rect x="3"  y="3"  width="7" height="7" rx="1.5"/>
        <rect x="14" y="3"  width="7" height="7" rx="1.5"/>
        <rect x="3"  y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    );

    /* ══════════════════════════════════════════════════════════
     * MOBILE — floating vertical pill menu
     * ══════════════════════════════════════════════════════════ */
    if (isMobile && aiOpen) return null;
    if (isMobile) {
      return (
        <React.Fragment>

          {/* Backdrop */}
          <div
            aria-hidden="true"
            style={{
              position: "fixed", inset: 0,
              zIndex: 8998,
              pointerEvents: open ? "auto" : "none",
              background: open
                ? "radial-gradient(ellipse 420px 620px at 100% 50%, rgba(1,5,18,0.88) 0%, rgba(1,5,18,0.55) 50%, transparent 80%)"
                : "none",
              backdropFilter: open ? "blur(7px)" : "none",
              WebkitBackdropFilter: open ? "blur(7px)" : "none",
              transition: "background 0.3s ease, backdrop-filter 0.3s ease",
            }}
            onClick={() => setOpen(false)}
          />

          {/* Trigger circle */}
          <div
            onClick={() => setOpen(o => !o)}
            onMouseEnter={() => setTrigHov(true)}
            onMouseLeave={() => setTrigHov(false)}
            style={{
              ...trigBase,
              position: "fixed",
              right: TRIG_R,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 9000,
              pointerEvents: "auto",
            }}
          >
            {trigIcon}
          </div>

          {/* Pulse ring */}
          {!open && (
            <div aria-hidden="true" style={{
              position: "fixed",
              right: TRIG_R, top: "50%",
              width: TRIG_SZ, height: TRIG_SZ,
              borderRadius: "50%",
              border: "1.5px solid rgba(56,189,248,0.38)",
              pointerEvents: "none",
              zIndex: 8999,
              animation: "snav-ping 3s ease-out infinite",
            }}/>
          )}

          {/* Vertical menu panel */}
          <div style={{
            position: "fixed",
            right: TRIG_R + TRIG_SZ + 10,
            top: "50%",
            zIndex: 8999,
            transform: open && live
              ? "translateY(-50%) translateX(0px)"
              : "translateY(-50%) translateX(14px)",
            opacity: open && live ? 1 : 0,
            pointerEvents: open ? "auto" : "none",
            transition: "opacity 0.24s ease, transform 0.32s cubic-bezier(0.34,1.56,0.64,1)",
            background: "rgba(3,7,22,0.97)",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            border: "1px solid rgba(56,189,248,0.18)",
            borderRadius: "18px",
            boxShadow: "0 8px 48px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.04), 0 0 24px rgba(56,189,248,0.10)",
            padding: "8px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            maxHeight: "82vh",
            overflowY: "auto",
          }}>
            {SECTIONS.map((sec) => {
              const isActive = activeId === sec.id;
              const isHov    = hoverId  === sec.id;
              return (
                <div
                  key={sec.id}
                  onClick={() => scrollTo(sec.id)}
                  onMouseEnter={() => setHoverId(sec.id)}
                  onMouseLeave={() => setHoverId(null)}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "8px 14px 8px 10px",
                    borderRadius: "11px",
                    cursor: "pointer",
                    background: isActive ? `${sec.color}16` : isHov ? `${sec.color}0d` : "transparent",
                    border: `1px solid ${isActive ? sec.color + "40" : isHov ? sec.color + "22" : "transparent"}`,
                    boxShadow: isActive ? `inset 0 0 12px ${sec.color}14` : "none",
                    transition: "background 0.15s, border-color 0.15s, box-shadow 0.15s",
                  }}
                >
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: isActive ? `${sec.color}20` : `${sec.color}10`,
                    border: `1px solid ${isActive ? sec.color + "55" : sec.color + "30"}`,
                    boxShadow: isActive ? `0 0 12px ${sec.color}40` : "none",
                    transition: "background 0.15s, border-color 0.15s, box-shadow 0.15s",
                  }}>
                    <NavIcon type={sec.icon} size={13} color={isActive || isHov ? sec.color : sec.color + "88"}/>
                  </div>
                  <span style={{
                    fontSize: "12px",
                    fontWeight: isActive ? 600 : isHov ? 500 : 400,
                    color: isActive ? sec.color : isHov ? "rgba(230,242,255,0.95)" : "rgba(175,205,240,0.80)",
                    whiteSpace: "nowrap",
                    letterSpacing: "0.012em",
                    userSelect: "none",
                    transition: "color 0.15s",
                  }}>{sec.label}</span>
                </div>
              );
            })}
          </div>

        </React.Fragment>
      );
    }

    /* ══════════════════════════════════════════════════════════
     * DESKTOP — radial arc wheel
     * ══════════════════════════════════════════════════════════ */
    return (
      <React.Fragment>

        {/*
         * BACKDROP — position:fixed, inset:0.
         * Localised radial dim on the right side only. z-index 8998.
         */}
        <div
          aria-hidden="true"
          style={{
            position: "fixed", inset: 0,
            zIndex: 8998,
            pointerEvents: open ? "auto" : "none",
            cursor: "default",
            background: open
              ? `radial-gradient(
                  ellipse 560px 700px at calc(100%) 50%,
                  rgba(1,4,16,0.90) 0%,
                  rgba(1,5,18,0.64) 45%,
                  rgba(1,5,18,0.22) 70%,
                  transparent 88%
                )`
              : "none",
            backdropFilter: open ? "blur(8px)" : "none",
            WebkitBackdropFilter: open ? "blur(8px)" : "none",
            transition: "background 0.35s ease, backdrop-filter 0.35s ease",
          }}
          onClick={() => setOpen(false)}
        />

        {/*
         * NAVIGATOR WHEEL — position:fixed, zero document-flow impact.
         * Container is pointer-events:none; only children opt in.
         */}
        <div style={{
          position: "fixed",
          right: aiOpen ? "33.333%" : 0,
          top: "50%",
          transform: "translateY(-50%)",
          width: CW,
          height: CH,
          zIndex: 8999,
          pointerEvents: "none",
          transition: "right 0.28s cubic-bezier(0.4,0,0.2,1)",
        }}>

          {/* ── SVG decorative arcs ────────────────────────── */}
          <svg
            width={CW} height={CH}
            style={{
              position: "absolute", inset: 0, overflow: "visible",
              pointerEvents: "none",
              opacity: open && live ? 1 : 0,
              transition: "opacity 0.38s ease",
            }}
          >
            <defs>
              <filter id="snav-glow-f" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            {/* Outer halo arc */}
            <path d={ARC_OUTER}
              stroke="rgba(56,189,248,0.07)" fill="none"
              strokeWidth="1" strokeLinecap="round"/>

            {/* Primary arc glow pass */}
            <path d={ARC_MAIN}
              stroke="rgba(56,189,248,0.45)" fill="none"
              strokeWidth="9" strokeLinecap="round"
              filter="url(#snav-glow-f)"/>

            {/* Primary arc crisp dashes */}
            <path d={ARC_MAIN}
              stroke="rgba(56,189,248,0.65)" fill="none"
              strokeWidth="1.5" strokeDasharray="3 7" strokeLinecap="round"/>

            {/* Inner reference ring */}
            <path d={ARC_INNER}
              stroke="rgba(56,189,248,0.18)" fill="none"
              strokeWidth="1" strokeLinecap="round"/>

            {/* Spoke lines — hub to each node */}
            {SECTIONS.map((_, i) => {
              const { cx, cy } = geom(i);
              return (
                <line key={i}
                  x1={TCX} y1={TCY}
                  x2={(TCX + cx).toFixed(2)} y2={(TCY + cy).toFixed(2)}
                  stroke="rgba(56,189,248,0.05)" strokeWidth="1"/>
              );
            })}

            {/* Inner-ring node dots */}
            {SECTIONS.map((sec, i) => {
              const { icx, icy } = geom(i);
              const isActive = activeId === sec.id;
              return (
                <circle key={i}
                  cx={(TCX + icx).toFixed(2)} cy={(TCY + icy).toFixed(2)}
                  r={isActive ? "3.5" : "1.8"}
                  fill={isActive ? sec.color : "rgba(56,189,248,0.28)"}/>
              );
            })}

            {/* Centre hub */}
            <circle cx={TCX} cy={TCY} r="20"
              fill="rgba(56,189,248,0.04)"
              stroke="rgba(56,189,248,0.16)" strokeWidth="1"/>
            <circle cx={TCX} cy={TCY} r="4"  fill="rgba(56,189,248,0.55)"/>
            <circle cx={TCX} cy={TCY} r="2"  fill="rgba(56,189,248,1)"/>
          </svg>

          {/* ── Section items ─────────────────────────────── */}
          {SECTIONS.map((sec, i) => {
            const { cx, cy } = geom(i);
            const isActive = activeId === sec.id;
            const isHover  = hoverId  === sec.id;
            const lit      = isActive || isHover;

            /*
             * Positioning: icon centre must land at (TCX + cx, TCY + cy).
             * row-reverse → icon is the rightmost child.
             * Icon is 36px wide; its centre is 18px from its right edge.
             * Item right edge (= icon right edge) from container right:
             *   = (CW − TCX) − cx_offset_from_trigger − 18
             *   = 36 − cx − 18  = 18 − cx
             * (cx is negative → value > 18, pushing icon leftward)
             */
            const itemRight = (18 - cx).toFixed(1);
            const itemTop   = (TCY + cy - 17).toFixed(1);
            const delay     = i * 32;

            return (
              <div
                key={sec.id}
                onClick={() => scrollTo(sec.id)}
                onMouseEnter={() => setHoverId(sec.id)}
                onMouseLeave={() => setHoverId(null)}
                style={{
                  position: "absolute",
                  right: `${itemRight}px`,
                  top:   `${itemTop}px`,
                  display: "flex",
                  flexDirection: "row-reverse",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  pointerEvents: open ? "auto" : "none",
                  opacity:   open && live ? 1 : 0,
                  transform: open && live
                    ? "scale(1) translateX(0px)"
                    : "scale(0.48) translateX(28px)",
                  transition: [
                    `opacity   0.26s ${delay}ms ease`,
                    `transform 0.36s ${delay}ms cubic-bezier(0.34,1.56,0.64,1)`,
                  ].join(", "),
                  zIndex: isHover ? 4 : isActive ? 3 : 1,
                }}
              >
                {/* Icon ring */}
                <div style={{
                  width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isActive ? `${sec.color}2e` : isHover ? `${sec.color}22` : `rgba(2,5,18,0.92)`,
                  border: `2px solid ${isActive ? sec.color : isHover ? sec.color + "cc" : sec.color + "55"}`,
                  boxShadow: isActive
                    ? `0 0 0 4px ${sec.color}20, 0 0 26px ${sec.color}66, 0 0 48px ${sec.color}28`
                    : isHover
                      ? `0 0 18px ${sec.color}55, 0 2px 12px rgba(0,0,0,0.8)`
                      : `0 2px 10px rgba(0,0,0,0.75)`,
                  transform: isHover ? "scale(1.14)" : "scale(1)",
                  transition: "background 0.2s, border-color 0.2s, box-shadow 0.2s, transform 0.18s",
                }}>
                  <NavIcon type={sec.icon} size={15} color={lit ? sec.color : sec.color + "99"}/>
                </div>

                {/* Label pill — fully opaque dark background, always readable over any card */}
                <div style={{
                  padding: "5px 14px 6px",
                  borderRadius: "999px",
                  background: isActive ? "rgba(2,6,20,1)" : "rgba(2,5,18,0.99)",
                  border: `1.5px solid ${isActive ? sec.color + "88" : isHover ? sec.color + "60" : "rgba(56,189,248,0.28)"}`,
                  backdropFilter: "blur(28px)",
                  WebkitBackdropFilter: "blur(28px)",
                  boxShadow: [
                    "0 4px 24px rgba(0,0,0,0.92)",
                    "0 2px 8px rgba(0,0,0,0.96)",
                    "0 1px 0 rgba(255,255,255,0.06) inset",
                    isActive ? `0 0 18px ${sec.color}40` : isHover ? `0 0 10px ${sec.color}22` : "",
                  ].filter(Boolean).join(", "),
                  fontSize: "12px",
                  fontWeight: isActive ? 700 : isHover ? 600 : 500,
                  color: isActive ? sec.color : isHover ? "rgba(240,248,255,1)" : "rgba(210,228,255,0.95)",
                  whiteSpace: "nowrap",
                  letterSpacing: "0.014em",
                  userSelect: "none",
                  transition: "color 0.2s, border-color 0.2s, background 0.2s, box-shadow 0.2s",
                }}>
                  {sec.label}
                </div>
              </div>
            );
          })}

          {/* ── Trigger button — full circle ───────────────── */}
          <div
            onClick={() => setOpen(o => !o)}
            onMouseEnter={() => setTrigHov(true)}
            onMouseLeave={() => setTrigHov(false)}
            style={{
              ...trigBase,
              position: "absolute",
              right: TRIG_R,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "auto",
              zIndex: 6,
            }}
          >
            {trigIcon}
          </div>

          {/* ── Pulse ring (collapsed only) ─────────────────── */}
          {!open && (
            <div aria-hidden="true" style={{
              position: "absolute",
              right: TRIG_R, top: "50%",
              width: TRIG_SZ, height: TRIG_SZ,
              borderRadius: "50%",
              border: "1.5px solid rgba(56,189,248,0.38)",
              pointerEvents: "none",
              animation: "snav-ping 3s ease-out infinite",
            }}/>
          )}

        </div>{/* end navigator wheel */}
      </React.Fragment>
    );
  }

  window.SectionNavigator = SectionNavigator;
})();
