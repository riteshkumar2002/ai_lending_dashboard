// Generic ApplicantDetail shell — single-page dashboard layout
// Props: { app, tabs, onBack }

(function () {
  const { useState, useEffect } = React;

  /* ── Ask-User helpers (shared with DocumentsView) ─────────────── */
  const WA_GREEN  = "#25D366";
  const WA_PATH   = "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z";

  function WaIcon({ size = 12 }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill={WA_GREEN}><path d={WA_PATH}/></svg>;
  }

  function auDocKey(groupLabel, item) {
    return `${groupLabel}::${item.sr ?? ""}::${item.name}`;
  }
  function auUploadLink(docName) {
    const token = btoa(docName).replace(/[^A-Za-z0-9]/g, "").slice(0, 10).toUpperCase();
    return `https://docs.loanapp.io/upload/${token}`;
  }

  function AuAskBtn({ onClick }) {
    const [tip, setTip] = useState(null);
    const btnRef = React.useRef(null);

    function handleEnter() {
      if (btnRef.current) {
        const r = btnRef.current.getBoundingClientRect();
        setTip({ x: r.left + r.width / 2, y: r.top - 8 });
      }
    }

    return (
      <>
        <button
          ref={btnRef}
          onClick={e => { e.stopPropagation(); onClick(); }}
          onMouseEnter={handleEnter}
          onMouseLeave={() => setTip(null)}
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 22, height: 22, borderRadius: "50%", padding: 0, cursor: "pointer",
            background: tip ? "rgba(37,211,102,0.20)" : "rgba(37,211,102,0.10)",
            border: `1px solid rgba(37,211,102,${tip ? 0.65 : 0.35})`,
            boxShadow: tip ? "0 0 10px rgba(37,211,102,0.30)" : "none",
            transition: "background 0.15s, border-color 0.15s, box-shadow 0.15s",
            flexShrink: 0,
          }}
        >
          <WaIcon size={11}/>
        </button>

        {tip && (
          <div style={{
            position: "fixed",
            left: tip.x,
            top: tip.y,
            transform: "translate(-50%, -100%)",
            zIndex: 9999,
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}>
            <div style={{
              background: "rgba(3,7,22,0.97)",
              border: "1px solid rgba(37,211,102,0.50)",
              borderRadius: 8, padding: "5px 11px",
              fontSize: 11, fontWeight: 600, color: WA_GREEN,
              boxShadow: "0 4px 20px rgba(0,0,0,0.70)",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <WaIcon size={10}/>
              Ask user via WhatsApp
            </div>
            <div style={{
              position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
              width: 0, height: 0,
              borderLeft: "5px solid transparent", borderRight: "5px solid transparent",
              borderTop: "5px solid rgba(37,211,102,0.50)",
            }}/>
          </div>
        )}
      </>
    );
  }

  function AuAskedBadge() {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 9.5, fontWeight: 600, color: WA_GREEN,
        background: "rgba(37,211,102,0.10)",
        border: "1px solid rgba(37,211,102,0.32)",
        borderRadius: 999, padding: "1px 8px", whiteSpace: "nowrap",
      }}>
        <WaIcon size={9}/>
        Asked
      </span>
    );
  }

  function AuModal({ item, groupLabel, applicantName, applicantPhone, appId, onSend, onClose }) {
    const [phone,   setPhone]   = useState(applicantPhone || "");
    const [copied,  setCopied]  = useState(false);
    const [sending, setSending] = useState(false);
    const [sent,    setSent]    = useState(false);

    const link    = auUploadLink(item.name);
    const name    = applicantName || "the applicant";
    const fileRef = appId ? ` (Ref: ${appId})` : "";
    const message =
`Hello ${name},

We require the following document to process your loan application${fileRef}:

📄 *${item.name}*

Please upload it securely via the link below:
🔗 ${link}

_The link is valid for 48 hours._

For any queries, please reply to this message.

Regards,
Loan Processing Team`;

    const cleanPhone = phone.replace(/\D/g, "");
    const waUrl      = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    const canSend    = !!cleanPhone && !sent;

    const handleSend = () => {
      if (!canSend) return;
      setSending(true);
      window.open(waUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => { setSent(true); setTimeout(() => { onSend(); onClose(); }, 700); }, 400);
    };
    const handleCopy = () => {
      navigator.clipboard?.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
    };

    const lbl = { display:"block", fontSize:9.5, fontWeight:700, color:"var(--text-3)", letterSpacing:"0.09em", textTransform:"uppercase", marginBottom:5 };

    return (
      <>
        <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:9100, background:"rgba(1,4,16,0.72)", backdropFilter:"blur(5px)", WebkitBackdropFilter:"blur(5px)" }}/>
        <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:9101, width:430, maxWidth:"calc(100vw - 32px)", background:"rgba(4,9,28,0.99)", backdropFilter:"blur(28px)", WebkitBackdropFilter:"blur(28px)", border:"1px solid rgba(37,211,102,0.22)", borderRadius:20, boxShadow:"0 32px 96px rgba(0,0,0,0.88), 0 0 48px rgba(37,211,102,0.07)", overflow:"hidden" }}>
          {/* Header */}
          <div style={{ display:"flex", alignItems:"center", gap:11, padding:"16px 20px 14px", borderBottom:"1px solid rgba(37,211,102,0.12)", background:"rgba(37,211,102,0.05)" }}>
            <div style={{ width:38, height:38, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(37,211,102,0.14)", border:"1px solid rgba(37,211,102,0.38)" }}><WaIcon size={19}/></div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13.5, fontWeight:700, color:"var(--text-1)" }}>Request Document via WhatsApp</div>
              <div style={{ fontSize:10.5, color:"var(--text-3)", marginTop:2 }}>Applicant will receive a secure upload link</div>
            </div>
            <button onClick={onClose} style={{ background:"transparent", border:"none", cursor:"pointer", color:"var(--text-3)", padding:4, borderRadius:6, lineHeight:0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          {/* Body */}
          <div style={{ padding:"18px 20px 20px" }}>
            {/* Doc pill */}
            <div style={{ marginBottom:14 }}>
              <div style={lbl}>Document</div>
              <div style={{ display:"inline-flex", alignItems:"center", gap:7, background:"oklch(from var(--c-red) l c h / 0.08)", border:"1px solid oklch(from var(--c-red) l c h / 0.30)", borderRadius:9, padding:"6px 12px" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--c-red)" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
                <span style={{ fontSize:12, fontWeight:600, color:"var(--text-1)" }}>{item.name}</span>
              </div>
            </div>
            {/* Phone */}
            <div style={{ marginBottom:14 }}>
              <label style={lbl}>WhatsApp Number</label>
              <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.04)", border:`1px solid ${phone ? "rgba(37,211,102,0.35)" : "rgba(255,255,255,0.12)"}`, borderRadius:10, padding:"8px 12px", transition:"border-color 0.15s" }}>
                <WaIcon size={13}/>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" autoFocus style={{ background:"transparent", border:"none", outline:"none", color:"var(--text-1)", fontSize:12.5, fontFamily:"var(--font-mono)", letterSpacing:"0.03em", width:"100%" }}/>
              </div>
            </div>
            {/* Message preview */}
            <div style={{ marginBottom:16 }}>
              <div style={lbl}>Message Preview</div>
              <div style={{ background:"rgba(37,211,102,0.04)", border:"1px solid rgba(37,211,102,0.13)", borderRadius:11, padding:"11px 14px", maxHeight:130, overflowY:"auto" }}>
                <pre style={{ margin:0, fontSize:10.5, lineHeight:1.65, color:"var(--text-2)", whiteSpace:"pre-wrap", wordBreak:"break-word", fontFamily:"var(--font)" }}>{message}</pre>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:7, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:8, padding:"7px 12px" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                <span style={{ flex:1, fontSize:10, color:"var(--text-3)", fontFamily:"var(--font-mono)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{link}</span>
                <button onClick={handleCopy} style={{ background:copied?"rgba(37,211,102,0.15)":"transparent", border:`1px solid ${copied?"rgba(37,211,102,0.40)":"rgba(255,255,255,0.12)"}`, borderRadius:6, cursor:"pointer", color:copied?WA_GREEN:"var(--text-3)", fontSize:10, fontWeight:600, padding:"2px 8px", transition:"all 0.15s" }}>{copied ? "✓ Copied" : "Copy"}</button>
              </div>
            </div>
            {/* Buttons */}
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={onClose} style={{ flex:1, padding:"9px 14px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:11, cursor:"pointer", color:"var(--text-2)", fontSize:12, fontWeight:600 }}>Cancel</button>
              <button onClick={handleSend} disabled={!canSend} style={{ flex:2, padding:"9px 14px", background:sent?"rgba(37,211,102,0.22)":canSend?"rgba(37,211,102,0.16)":"rgba(37,211,102,0.05)", border:`1px solid rgba(37,211,102,${sent?0.65:canSend?0.48:0.18})`, borderRadius:11, cursor:canSend?"pointer":"not-allowed", color:canSend?WA_GREEN:"rgba(37,211,102,0.38)", fontSize:12, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:7, boxShadow:canSend&&!sent?"0 0 18px rgba(37,211,102,0.14)":"none", transition:"all 0.18s" }}>
                {sent ? (<><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={WA_GREEN} strokeWidth="2.8" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>Sent!</>) : (<><WaIcon size={13}/>{sending ? "Opening WhatsApp…" : "Send WhatsApp Request"}</>)}
              </button>
            </div>
            <div style={{ marginTop:12, fontSize:9.5, color:"var(--text-4)", textAlign:"center", lineHeight:1.5 }}>Opens WhatsApp with the pre-filled message. Remark will update to "Pending upload by user".</div>
          </div>
        </div>
      </>
    );
  }

  const TONE_COLORS = {
    good: { color: "var(--c-green)", bg: "oklch(from var(--c-green) l c h / 0.12)", border: "oklch(from var(--c-green) l c h / 0.30)" },
    warn: { color: "var(--c-amber)", bg: "oklch(from var(--c-amber) l c h / 0.12)", border: "oklch(from var(--c-amber) l c h / 0.30)" },
    bad:  { color: "var(--c-red)",   bg: "oklch(from var(--c-red)   l c h / 0.12)", border: "oklch(from var(--c-red)   l c h / 0.30)" },
    info: { color: "var(--accent)",  bg: "var(--accent-faint)",                      border: "oklch(from var(--accent) l c h / 0.30)" },
  };

  /* ── Eligibility helpers ─────────────────────────────────────── */
  const ELIG_TONE = {
    PASS:      { color: "var(--c-green)", bg: "oklch(from var(--c-green) l c h / 0.12)", border: "oklch(from var(--c-green) l c h / 0.30)" },
    DEVIATION: { color: "var(--c-amber)", bg: "oklch(from var(--c-amber) l c h / 0.12)", border: "oklch(from var(--c-amber) l c h / 0.30)" },
    FAIL:      { color: "var(--c-red)",   bg: "oklch(from var(--c-red)   l c h / 0.12)", border: "oklch(from var(--c-red)   l c h / 0.30)" },
    "N/A":     { color: "var(--text-3)",  bg: "var(--bg-2)",                             border: "var(--bg-3)" },
  };
  const SEVERITY_ORDER = { FAIL: 0, DEVIATION: 1, PASS: 2, "N/A": 3 };

  function EligIcon({ status, size = 15 }) {
    const t = ELIG_TONE[status] || ELIG_TONE["N/A"];
    const c = t.color;
    const s = { flexShrink: 0, display: "block" };
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
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={s}>
        <circle cx="8" cy="8" r="6.5" fill="var(--bg-3)" stroke="var(--bg-3-strong)" strokeWidth="1.3"/>
        <path d="M5 8h6" stroke="var(--text-4)" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    );
  }

  function EligBadge({ status }) {
    const t = ELIG_TONE[status] || ELIG_TONE["N/A"];
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "3px 10px 3px 8px", borderRadius: 999,
        border: `1px solid ${t.border}`, background: t.bg, color: t.color,
        fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
        textTransform: "uppercase", whiteSpace: "nowrap", flexShrink: 0,
      }}>
        <EligIcon status={status} size={10} />
        {status}
      </span>
    );
  }

  function EligTooltip({ tooltip }) {
    if (!tooltip) return null;
    const { reason, status, rect } = tooltip;
    const t         = ELIG_TONE[status] || ELIG_TONE["N/A"];
    const labelText = status === "DEVIATION" ? "Deviation Reason" : "Failure Reason";
    const above     = rect.top > 140;
    const posStyle  = above
      ? { top: rect.top - 10, transform: "translateY(-100%)" }
      : { top: rect.bottom + 10 };
    return (
      <div style={{
        position: "fixed", left: rect.left + 8, ...posStyle,
        background: "var(--bg-1)", border: `1px solid var(--bg-3)`,
        borderLeft: `3px solid ${t.color}`,
        borderRadius: "var(--r-md)", padding: "10px 14px",
        maxWidth: 320, minWidth: 200,
        fontSize: 11.5, lineHeight: 1.55, color: "var(--text-1)",
        boxShadow: "0 6px 20px oklch(0 0 0 / 0.18)",
        zIndex: 9999, pointerEvents: "none",
      }}>
        <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.10em", fontWeight: 700, color: t.color, marginBottom: 5 }}>{labelText}</div>
        <div style={{ color: "var(--text-2)" }}>{reason}</div>
      </div>
    );
  }

  function EligibilityBlock({ eligibility }) {
    const [tooltip,    setTooltip]    = useState(null);
    const [hoveredIdx, setHoveredIdx] = useState(null);

    const checks = [...(eligibility?.sections?.[0]?.rows || [])].sort(
      (a, b) => (SEVERITY_ORDER[a.status] ?? 99) - (SEVERITY_ORDER[b.status] ?? 99)
    );

    return (
      <>
        <div className="eligibility-block">
          <h3>Eligibility Checks</h3>
          <div className="eligibility-list">
            {checks.map((check, i) => {
              const st          = check.status;
              const isDeviation = st === "DEVIATION";
              const isFail      = st === "FAIL";
              const hasReason   = (isDeviation || isFail) && !!check.reason;
              const isHovered   = hoveredIdx === i;
              const t           = ELIG_TONE[st] || ELIG_TONE["N/A"];
              const rowBg = isHovered
                ? (isDeviation || isFail) ? `oklch(from ${t.color} l c h / 0.13)` : "var(--bg-2)"
                : (isDeviation || isFail) ? `oklch(from ${t.color} l c h / 0.07)` : "var(--bg-2)";
              return (
                <div
                  key={i}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 12px 8px 10px", borderRadius: "var(--r-md)",
                    borderLeft: `3px solid ${t.color}`, background: rowBg,
                    cursor: hasReason ? "pointer" : "default",
                    transition: "background 0.14s ease, box-shadow 0.14s ease",
                    boxShadow: isHovered && (isDeviation || isFail)
                      ? `0 2px 10px ${t.color}1a, inset 0 1px 0 ${t.color}22, inset 0 -1px 0 ${t.color}22`
                      : "none",
                  }}
                  onMouseEnter={(e) => {
                    setHoveredIdx(i);
                    if (check.reason) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltip({ reason: check.reason, status: st, rect });
                    }
                  }}
                  onMouseLeave={() => { setHoveredIdx(null); setTooltip(null); }}
                >
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 7,
                    fontSize: 12, fontWeight: 500,
                    color: (isDeviation || isFail) ? t.color : "var(--text-1)",
                    minWidth: 0,
                  }}>
                    <EligIcon status={st} size={15} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{check.name}</span>
                  </span>
                  <EligBadge status={st} />
                </div>
              );
            })}
          </div>
        </div>
        <EligTooltip tooltip={tooltip} />
      </>
    );
  }

  /* ── Documents full-page view (accessed via summary bar) ────── */
  function DocumentsView({ app, onBack }) {
    const payload = app.documents || {};
    const groups  = Array.isArray(payload.groups) ? payload.groups : [];
    const [expandedGroups, setExpandedGroups] = useState(() => groups.map(() => true));
    const [pendingReqs,    setPendingReqs]    = useState({});
    const [modal,          setModal]          = useState(null);

    useEffect(() => {
      setExpandedGroups(groups.map(() => true));
    }, [groups.length]);

    const toggleGroup = (idx) =>
      setExpandedGroups(prev => prev.map((v, i) => i === idx ? !v : v));

    const openModal  = (groupLabel, doc) => setModal({ groupLabel, doc });
    const closeModal = () => setModal(null);
    const handleSend = () => {
      if (!modal) return;
      setPendingReqs(prev => ({ ...prev, [auDocKey(modal.groupLabel, modal.doc)]: true }));
    };

    return (
      <>
        <div className="documents-page">
          <div className="documents-header">
            <button className="documents-back-btn" onClick={onBack}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Back to Dashboard
            </button>
          </div>
          <div className="documents-sections">
            <table className="doc-table">
              <colgroup>
                <col className="doc-col-sr" />
                <col className="doc-col-name" />
                <col className="doc-col-mandatory" />
                <col className="doc-col-status" />
                <col className="doc-col-date" />
                <col className="doc-col-remarks" />
                <col className="doc-col-download" />
              </colgroup>
              <thead>
                <tr>
                  <th className="doc-th doc-th-sr">SR #</th>
                  <th className="doc-th doc-th-name">Document Name</th>
                  <th className="doc-th doc-th-mandatory">Mandatory</th>
                  <th className="doc-th doc-th-status">Status</th>
                  <th className="doc-th doc-th-date">Date Received</th>
                  <th className="doc-th doc-th-remarks">Remarks</th>
                  <th className="doc-th doc-th-download">Download</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group, gi) => (
                  <React.Fragment key={gi}>
                    <tr className="doc-section-row">
                      <td colSpan={7}>
                        <button
                          type="button"
                          className="doc-section-toggle-btn"
                          onClick={() => toggleGroup(gi)}
                          aria-expanded={expandedGroups[gi]}
                        >
                          <span className="doc-section-title">{group.label}</span>
                          <span className="doc-section-count">{(group.items || []).length} docs</span>
                          <svg
                            className={"doc-section-chevron" + (expandedGroups[gi] ? " open" : "")}
                            width="13" height="13" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                          >
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                    {expandedGroups[gi] && (Array.isArray(group.items) ? group.items : []).map((doc, i) => {
                      const isMissing = doc.status === "Missing";
                      const key       = auDocKey(group.label, doc);
                      const isPending = pendingReqs[key] === true;
                      const statusKey = (doc.status || "").toLowerCase().replace(/\s+/g, "-");
                      return (
                        <tr key={i} className="doc-data-row"
                          style={{ background: isMissing ? "oklch(from var(--c-red) l c h / 0.04)" : "" }}>
                          <td className="doc-td doc-td-sr">{doc.sr ?? i + 1}</td>
                          <td className="doc-td doc-td-name"
                            style={{ fontWeight: isMissing ? 600 : 400 }}>{doc.name}</td>
                          <td className="doc-td doc-td-mandatory">
                            {doc.mandatory
                              ? <span style={{ color: "var(--c-red)", fontWeight: 700, fontSize: 11 }}>YES</span>
                              : <span style={{ color: "var(--text-3)", fontSize: 11 }}>No</span>}
                          </td>

                          {/* Status + Ask User button */}
                          <td className="doc-td doc-td-status">
                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <span className={`doc-status-badge doc-status-${statusKey}`}>{doc.status || "—"}</span>
                              {isMissing && !isPending && (
                                <AuAskBtn onClick={() => openModal(group.label, doc)} />
                              )}
                              {isMissing && isPending && <AuAskedBadge />}
                            </div>
                          </td>

                          <td className="doc-td doc-td-date">{doc.dateReceived || "—"}</td>

                          {/* Remarks: override when pending */}
                          <td className="doc-td doc-td-remarks">
                            {isPending ? (
                              <span style={{
                                display: "inline-flex", alignItems: "center", gap: 5,
                                color: "var(--c-amber)", fontWeight: 500, fontSize: 11,
                              }}>
                                <span style={{ fontSize: 13 }}>⏳</span>
                                Pending upload by user
                              </span>
                            ) : (
                              doc.remarks || "—"
                            )}
                          </td>

                          <td className="doc-td doc-td-download">
                            <button className="download-btn">Download</button>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {modal && (
          <AuModal
            item={modal.doc}
            groupLabel={modal.groupLabel}
            applicantName={app.name}
            applicantPhone={app.phone || ""}
            appId={app.id}
            onSend={handleSend}
            onClose={closeModal}
          />
        )}
      </>
    );
  }

  /* ── Documents summary compact bar ──────────────────────────── */
  function DocumentsSummaryBar({ docSummary, onViewAll }) {
    const pctColor = docSummary.pct >= 80 ? "var(--c-green)" : docSummary.pct >= 60 ? "var(--c-amber)" : "var(--c-red)";
    return (
      <div className="doc-summary-bar">
        <div className="doc-summary-bar-inner">
          <div className="doc-summary-bar-title">Documents Summary</div>
          <div className="doc-summary-bar-body">
            <div className="doc-summary-bar-chips">
              {[
                { label: "Total",       value: docSummary.total,       color: "var(--text-1)" },
                { label: "Required",    value: docSummary.required,    color: "var(--text-2)" },
                { label: "Received",    value: docSummary.received,    color: "var(--c-green)" },
                { label: "Missing",     value: docSummary.missing,     color: "var(--c-red)" },
                { label: "Conditional", value: docSummary.conditional, color: "var(--c-amber)" },
              ].map(chip => (
                <div key={chip.label} className="doc-summary-chip">
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: chip.color, lineHeight: 1 }}>{chip.value}</span>
                  <span style={{ fontSize: 9, color: "var(--text-4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{chip.label}</span>
                </div>
              ))}
            </div>
            <div className="doc-summary-bar-progress">
              <div className="doc-summary-progress-header">
                <span style={{ fontSize: 10, color: "var(--text-3)" }}>Completion (required docs)</span>
                <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)", color: pctColor }}>{docSummary.pct}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: "var(--bg-3)", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 999, width: docSummary.pct + "%", background: pctColor }} />
              </div>
              <button onClick={onViewAll} className="doc-summary-view-all">
                View all documents →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── section ID for each param tab ──────────────────────────── */
  const PARAM_SECTION_ID = {
    param_identity:   "section-identity",
    param_employment: "section-employment",
    param_income:     "section-income",
    param_bureau:     "section-bureau",
    param_property:   "section-property",
    param_collateral: "section-collateral",
  };

  /* ── Application Parameters grid ─────────────────────────────── */
  function ParamsDashboard({ app, paramTabs }) {
    return (
      <div className="apdet-params-section">
        <div className="apdet-params-heading">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="var(--text-4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
          Application Parameters
        </div>
        <div className="apdet-params-grid">
          {paramTabs.map(t => {
            const Panel    = t.Panel;
            if (!Panel) return null;
            const data     = app[t.dataKey] || {};
            const secId    = PARAM_SECTION_ID[t.id];
            return (
              <div key={t.id} id={secId} className="apdet-params-card-wrap">
                <Panel {...data} app={app} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ── Main ApplicantDetail ────────────────────────────────────── */
  function ApplicantDetail({ app, tabs, onBack }) {
    const [showDocs, setShowDocs] = useState(false);
    const [isAiOpen, setIsAiOpen] = useState(false);

    if (!app) return null;

    const paramTabs = (tabs || []).filter(t => t.section === "params");

    /* document summary metrics */
    const _docPayload  = app.documents || {};
    const _docMeta     = _docPayload.summary || {};
    const _docGroups   = Array.isArray(_docPayload.groups) ? _docPayload.groups : [];
    const _docItems    = _docGroups.flatMap(g => Array.isArray(g.items) ? g.items : []);
    const _required    = _docMeta.required    ?? _docItems.filter(d => d.mandatory).length;
    const _received    = _docMeta.received    ?? _docItems.filter(d => d.status === 'Received').length;
    const _missing     = _docMeta.missing     ?? _docItems.filter(d => d.status === 'Missing').length;
    const _conditional = _docMeta.conditional ?? _docItems.filter(d => d.status === 'Conditional').length;
    const _total       = _docMeta.total       ?? _docItems.length;
    const _pct         = _docMeta.completionPct ?? (_required ? Math.round((_received / _required) * 100) : 0);
    const _docSummary  = { total: _total, required: _required, received: _received, missing: _missing, conditional: _conditional, pct: _pct };

    if (showDocs) {
      return (
        <div className="apdet-fullscreen">
          <div className="hdr-shell">
            <div className="hdr-top" style={{ justifyContent: "flex-start", gap: 12 }}>
              <div className="hdr-identity">
                <div className="hdr-avatar">{app.initials}</div>
                <div className="hdr-id-block">
                  <div className="hdr-name">{app.name}</div>
                  <div className="hdr-id-row">
                    <span className="hdr-id-badge">{app.id}</span>
                    <span className="hdr-stage-pill">Documents</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowDocs(false)}
                style={{
                  marginLeft: "auto", background: "var(--bg-2)", border: "1px solid var(--bg-3)",
                  color: "var(--text-2)", padding: "6px 14px", borderRadius: "var(--r-md)",
                  fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}
              >← Back to Dashboard</button>
            </div>
          </div>
          <div className="apdet-content">
            <DocumentsView app={app} onBack={() => setShowDocs(false)} />
          </div>
        </div>
      );
    }

    /* ── header derived values ─────────────────────────── */
    const amountFmt  = app.amount
      ? '₹' + (app.amount >= 10000000
          ? (app.amount / 10000000).toFixed(1) + ' Cr'
          : (app.amount / 100000).toFixed(1) + 'L')
      : '—';
    /* EMI = P × r(1+r)^n / ((1+r)^n-1)  at ~11.5% pa, 240m */
    const rate       = 0.115 / 12;
    const n          = 240;
    const emiRaw     = app.amount
      ? Math.round(app.amount * rate * Math.pow(1 + rate, n) / (Math.pow(1 + rate, n) - 1))
      : 34234;
    const emiFmt     = '₹' + emiRaw.toLocaleString('en-IN');
    const cibilColor = (app.cibilScore || 684) >= 750 ? 'var(--c-green)'
                     : (app.cibilScore || 684) >= 650 ? 'var(--c-amber)'
                     : 'var(--c-red)';
    /* NSTP authority label */
    const nstpLevel  = (app.authority || 'NCM') === 'NCM'
      ? 'L4 — National Credit Manager'
      : (app.authority || '') + ' Authority';
    const nstpRule   = (app.flags || []).find(f => /CIBIL|DPD|LTV|DBR/i.test(f))
      ? 'APPLICANT_CIBIL_002 triggered'
      : 'Standard processing';
    const stageLabel = app.stage || 'NCM Review';

    return (
      <div className={"apdet-fullscreen" + (isAiOpen ? " apdet-split-mode" : "")}>

        {/* ── Left column: full applicant view (header + content) ── */}
        {/* Occupies 100% normally, shrinks to 2/3 when AI panel is open */}
        <div className="apdet-left-col">

          {/* ── Compact executive header ─────────────────── */}
          <div className="hdr-shell">

            {/* ── TOP ROW: identity | NSTP authority | approval ── */}
            <div className="hdr-top">

              {/* LEFT — applicant identity */}
              <div className="hdr-identity">
                <div className="hdr-avatar">{app.initials}</div>
                <div className="hdr-id-block">
                  <div className="hdr-name">{app.name}</div>
                  <div className="hdr-id-row">
                    <span className="hdr-id-badge">{app.id}</span>
                    <span className="hdr-stage-pill">{stageLabel}</span>
                  </div>
                  <div className="hdr-sub-row">
                    {app.employment && <span className="hdr-sub-item">{app.employment}</span>}
                    {app.employment && <span className="hdr-sub-dot" />}
                    {app.age        && <span className="hdr-sub-item">Age {app.age}</span>}
                    {app.age        && <span className="hdr-sub-dot" />}
                    <span className="hdr-sub-item">Submitted {app.submitted || '—'}</span>
                  </div>
                </div>
              </div>

              {/* CENTER — NSTP authority block */}
              <div className="hdr-nstp">
                <div className="hdr-nstp-label">NSTP AUTHORITY</div>
                <div className="hdr-nstp-badge">{nstpLevel}</div>
                <div className="hdr-nstp-rule">{nstpRule}</div>
              </div>

              {/* RIGHT — approval block */}
              <div className="hdr-approval">
                <div className="hdr-approval-label">LOAN APPROVAL AMOUNT</div>
                <div className="hdr-approval-amount">{amountFmt}</div>
                <div className="hdr-approval-actions">
                  <button className="hdr-btn hdr-btn-decline">Decline</button>
                  <button className="hdr-btn hdr-btn-approve">Approve</button>
                </div>
              </div>
            </div>

            {/* ── BOTTOM ROW: horizontal metrics bar ──────── */}
            <div className="hdr-metrics-bar">
              {[
                { label: 'LOAN AMOUNT',    value: amountFmt,              mono: true  },
                { label: 'PRODUCT',        value: app.product || 'LAP',   mono: false },
                { label: 'TENOR',          value: '240 months',           sub: '(20 yr)' },
                { label: 'EMI',            value: emiFmt,                 mono: true  },
                { label: 'INTEREST RATE',  value: '11.50% p.a.',          mono: true  },
                { label: 'CIBIL SCORE',    value: app.cibilScore || 684,  color: cibilColor, mono: true },
              ].map((m, i, arr) => (
                <div key={i} className="hdr-metric">
                  <div className="hdr-metric-label">{m.label}</div>
                  <div className="hdr-metric-value"
                    style={{ fontFamily: m.mono ? 'var(--font-mono)' : 'inherit', color: m.color || 'var(--text-1)' }}>
                    {m.value}
                    {m.sub && <span className="hdr-metric-sub"> {m.sub}</span>}
                  </div>
                  {i < arr.length - 1 && <div className="hdr-metric-divider" />}
                </div>
              ))}
            </div>

          </div>

          {/* ── Scrollable dashboard content ─────────────── */}
          <div className="apdet-content">

            {/* Scorecard + Eligibility */}
            <div id="section-scorecard" className="summary-grid">
              <div className="summary-scorecard">
                <window.DrilldownScorecard app={app} />
              </div>
              <div className="summary-right">
                <EligibilityBlock eligibility={app.eligibility || []} />
              </div>
            </div>

            {/* Documents Summary */}
            <div id="section-docs">
              <DocumentsSummaryBar
                docSummary={_docSummary}
                onViewAll={() => setShowDocs(true)}
              />
            </div>

            {/* All parameter cards in responsive grid */}
            <ParamsDashboard app={app} paramTabs={paramTabs} />

          </div>

        </div>{/* /apdet-left-col */}

        {/* ── Right column: AI Assistant panel (1/3) ───── */}
        {isAiOpen && (
          <div className="apdet-ai-panel">
            {window.AIAnalystPanel && (
              <window.AIAnalystPanel app={app} onClose={() => setIsAiOpen(false)} />
            )}
          </div>
        )}

        {/* ── Ask AI floating action button ──────────────── */}
        <button
          className={"ask-ai-fab" + (isAiOpen ? " ask-ai-fab-active" : "")}
          onClick={() => setIsAiOpen(v => !v)}
          title={isAiOpen ? "Close AI panel" : "Open AI Credit Analyst"}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
            <circle cx="9" cy="12" r="1" fill="currentColor"/>
            <circle cx="12" cy="12" r="1" fill="currentColor"/>
            <circle cx="15" cy="12" r="1" fill="currentColor"/>
          </svg>
          Ask AI
        </button>

        {/* ── Floating section navigator ──────────────────── */}
        {window.SectionNavigator && (
          <window.SectionNavigator app={app} docPct={_pct} aiOpen={isAiOpen} />
        )}
      </div>
    );
  }

  window.ApplicantDetail = ApplicantDetail;
})();
