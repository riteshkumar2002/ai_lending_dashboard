// Generic DocumentsPanel
// Props: { summary, groups, applicantName?, applicantPhone?, appId? }
// summary — { total, required, received, missing, notApplicable, conditional, completionPct }
// groups  — array of { label, items: [{ sr, name, mandatory, status, dateReceived, remarks }] }

(function () {
  const { useState } = React;

  const DOC_STATUS = {
    "Received":       { color: "var(--c-green)", bg: "oklch(from var(--c-green) l c h / 0.10)", border: "oklch(from var(--c-green) l c h / 0.25)" },
    "Missing":        { color: "var(--c-red)",   bg: "oklch(from var(--c-red)   l c h / 0.10)", border: "oklch(from var(--c-red)   l c h / 0.25)" },
    "Not Applicable": { color: "var(--text-3)",  bg: "var(--bg-2)",                              border: "var(--bg-3)" },
    "Conditional":    { color: "var(--c-amber)", bg: "oklch(from var(--c-amber) l c h / 0.10)", border: "oklch(from var(--c-amber) l c h / 0.25)" },
  };

  const WA_GREEN = "#25D366";

  /* ── helpers ──────────────────────────────────────────────────── */
  function docKey(groupLabel, item) {
    return `${groupLabel}::${item.sr}::${item.name}`;
  }
  function uploadLink(docName) {
    const token = btoa(docName).replace(/[^A-Za-z0-9]/g, "").slice(0, 10).toUpperCase();
    return `https://docs.loanapp.io/upload/${token}`;
  }

  /* ── WhatsApp icon path (reusable) ────────────────────────────── */
  const WA_PATH = "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z";

  function WaIcon({ size = 12 }) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={WA_GREEN}>
        <path d={WA_PATH}/>
      </svg>
    );
  }

  /* ── DocStatusBadge ───────────────────────────────────────────── */
  function DocStatusBadge({ status }) {
    const s = DOC_STATUS[status] || DOC_STATUS["Not Applicable"];
    return (
      <span style={{
        display: "inline-block", padding: "2px 8px", borderRadius: 999,
        border: `1px solid ${s.border}`, background: s.bg, color: s.color,
        fontSize: 10, fontWeight: 600, whiteSpace: "nowrap",
      }}>
        {status}
      </span>
    );
  }

  /* ── AskUserBtn — small WhatsApp icon with tooltip ────────────── */
  function AskUserBtn({ onClick }) {
    const [tip, setTip] = useState(null); // {x, y} in viewport coords
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

        {/* Fixed tooltip — escapes all overflow:hidden parents */}
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
              borderRadius: 8,
              padding: "5px 11px",
              fontSize: 11,
              fontWeight: 600,
              color: WA_GREEN,
              boxShadow: "0 4px 20px rgba(0,0,0,0.70)",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <WaIcon size={10}/>
              Ask user via WhatsApp
            </div>
            <div style={{
              position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
              width: 0, height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "5px solid rgba(37,211,102,0.50)",
            }}/>
          </div>
        )}
      </>
    );
  }

  /* ── "Asked" badge shown after sending ───────────────────────── */
  function AskedBadge() {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: 9.5, fontWeight: 600, color: WA_GREEN,
        background: "rgba(37,211,102,0.10)",
        border: "1px solid rgba(37,211,102,0.32)",
        borderRadius: 999, padding: "1px 8px",
        whiteSpace: "nowrap",
      }}>
        <WaIcon size={9}/>
        Asked
      </span>
    );
  }

  /* ── AskUserModal ─────────────────────────────────────────────── */
  function AskUserModal({ item, groupLabel, applicantName, applicantPhone, appId, onSend, onClose }) {
    const [phone,   setPhone]   = useState(applicantPhone || "");
    const [copied,  setCopied]  = useState(false);
    const [sending, setSending] = useState(false);
    const [sent,    setSent]    = useState(false);

    const link    = uploadLink(item.name);
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
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    const handleSend = () => {
      if (!cleanPhone) return;
      setSending(true);
      window.open(waUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => {
        setSent(true);
        setTimeout(() => { onSend(); onClose(); }, 700);
      }, 400);
    };

    const handleCopy = () => {
      navigator.clipboard?.writeText(link).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      });
    };

    const canSend = !!cleanPhone && !sent;

    return (
      <>
        {/* Backdrop */}
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 9100,
            background: "rgba(1,4,16,0.72)",
            backdropFilter: "blur(5px)",
            WebkitBackdropFilter: "blur(5px)",
          }}
        />

        {/* Modal panel */}
        <div style={{
          position: "fixed",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9101,
          width: 430, maxWidth: "calc(100vw - 32px)",
          background: "rgba(4,9,28,0.99)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          border: "1px solid rgba(37,211,102,0.22)",
          borderRadius: 20,
          boxShadow: "0 32px 96px rgba(0,0,0,0.88), 0 0 48px rgba(37,211,102,0.07)",
          overflow: "hidden",
        }}>

          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 11,
            padding: "16px 20px 14px",
            borderBottom: "1px solid rgba(37,211,102,0.12)",
            background: "rgba(37,211,102,0.05)",
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(37,211,102,0.14)",
              border: "1px solid rgba(37,211,102,0.38)",
            }}>
              <WaIcon size={19}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1)", letterSpacing: "0.01em" }}>
                Request Document via WhatsApp
              </div>
              <div style={{ fontSize: 10.5, color: "var(--text-3)", marginTop: 2 }}>
                Applicant will receive a secure upload link
              </div>
            </div>
            <button onClick={onClose} style={{
              background: "transparent", border: "none", cursor: "pointer",
              color: "var(--text-3)", padding: 4, borderRadius: 6, lineHeight: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: "18px 20px 20px" }}>

            {/* Document pill */}
            <div style={{ marginBottom: 14 }}>
              <div style={labelStyle}>Document</div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                background: "oklch(from var(--c-red) l c h / 0.08)",
                border: "1px solid oklch(from var(--c-red) l c h / 0.30)",
                borderRadius: 9, padding: "6px 12px",
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="var(--c-red)" strokeWidth="2" strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                </svg>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>{item.name}</span>
              </div>
            </div>

            {/* Phone input */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>WhatsApp Number</label>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${phone ? "rgba(37,211,102,0.35)" : "rgba(255,255,255,0.12)"}`,
                borderRadius: 10, padding: "8px 12px",
                transition: "border-color 0.15s",
              }}>
                <WaIcon size={13}/>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  autoFocus
                  style={{
                    background: "transparent", border: "none", outline: "none",
                    color: "var(--text-1)", fontSize: 12.5,
                    fontFamily: "var(--font-mono)", letterSpacing: "0.03em",
                    width: "100%",
                  }}
                />
              </div>
            </div>

            {/* Message preview */}
            <div style={{ marginBottom: 16 }}>
              <div style={labelStyle}>Message Preview</div>
              <div style={{
                background: "rgba(37,211,102,0.04)",
                border: "1px solid rgba(37,211,102,0.13)",
                borderRadius: 11, padding: "11px 14px",
                maxHeight: 130, overflowY: "auto",
              }}>
                <pre style={{
                  margin: 0, fontSize: 10.5, lineHeight: 1.65,
                  color: "var(--text-2)", whiteSpace: "pre-wrap",
                  wordBreak: "break-word", fontFamily: "var(--font)",
                }}>
                  {message}
                </pre>
              </div>

              {/* Upload link row */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                marginTop: 7,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 8, padding: "7px 12px",
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                  stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                </svg>
                <span style={{
                  flex: 1, fontSize: 10, color: "var(--text-3)",
                  fontFamily: "var(--font-mono)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{link}</span>
                <button onClick={handleCopy} style={{
                  background: copied ? "rgba(37,211,102,0.15)" : "transparent",
                  border: `1px solid ${copied ? "rgba(37,211,102,0.40)" : "rgba(255,255,255,0.12)"}`,
                  borderRadius: 6, cursor: "pointer",
                  color: copied ? WA_GREEN : "var(--text-3)",
                  fontSize: 10, fontWeight: 600, padding: "2px 8px",
                  transition: "all 0.15s",
                }}>
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onClose} style={{
                flex: 1, padding: "9px 14px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 11, cursor: "pointer",
                color: "var(--text-2)", fontSize: 12, fontWeight: 600,
              }}>
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={!canSend}
                style={{
                  flex: 2, padding: "9px 14px",
                  background: sent
                    ? "rgba(37,211,102,0.22)"
                    : canSend ? "rgba(37,211,102,0.16)" : "rgba(37,211,102,0.05)",
                  border: `1px solid rgba(37,211,102,${sent ? 0.65 : canSend ? 0.48 : 0.18})`,
                  borderRadius: 11,
                  cursor: canSend ? "pointer" : "not-allowed",
                  color: canSend ? WA_GREEN : "rgba(37,211,102,0.38)",
                  fontSize: 12, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  boxShadow: canSend && !sent ? "0 0 18px rgba(37,211,102,0.14)" : "none",
                  transition: "all 0.18s",
                }}
              >
                {sent ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke={WA_GREEN} strokeWidth="2.8" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Sent!
                  </>
                ) : (
                  <>
                    <WaIcon size={13}/>
                    {sending ? "Opening WhatsApp…" : "Send WhatsApp Request"}
                  </>
                )}
              </button>
            </div>

            {/* Disclaimer */}
            <div style={{
              marginTop: 12, fontSize: 9.5, color: "var(--text-4)",
              textAlign: "center", lineHeight: 1.5,
            }}>
              Opens WhatsApp with the pre-filled message. A remark will be added once sent.
            </div>
          </div>
        </div>
      </>
    );
  }

  const labelStyle = {
    display: "block", fontSize: 9.5, fontWeight: 700,
    color: "var(--text-3)", letterSpacing: "0.09em",
    textTransform: "uppercase", marginBottom: 5,
  };

  /* ── SummaryStrip ─────────────────────────────────────────────── */
  function SummaryStrip({ summary }) {
    const chips = [
      { label: "Total",       value: summary.total,         color: "var(--text-1)" },
      { label: "Required",    value: summary.required,      color: "var(--text-2)" },
      { label: "Received",    value: summary.received,      color: "var(--c-green)" },
      { label: "Missing",     value: summary.missing,       color: "var(--c-red)" },
      { label: "N/A",         value: summary.notApplicable, color: "var(--text-3)" },
      { label: "Conditional", value: summary.conditional,   color: "var(--c-amber)" },
    ];
    return (
      <div className="docp-summary">
        <div className="docp-chips">
          {chips.map(c => (
            <div key={c.label} className="docp-chip">
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 15, color: c.color }}>{c.value}</span>
              <span style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{c.label}</span>
            </div>
          ))}
        </div>
        <div className="docp-progress-wrap">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: "var(--text-2)" }}>Completion (Required docs)</span>
            <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "var(--font-mono)", color: summary.completionPct >= 80 ? "var(--c-green)" : summary.completionPct >= 60 ? "var(--c-amber)" : "var(--c-red)" }}>
              {summary.completionPct}%
            </span>
          </div>
          <div className="docp-progress-track">
            <div className="docp-progress-fill" style={{
              width: summary.completionPct + "%",
              background: summary.completionPct >= 80 ? "var(--c-green)" : summary.completionPct >= 60 ? "var(--c-amber)" : "var(--c-red)",
            }} />
          </div>
        </div>
      </div>
    );
  }

  /* ── DocGroup ─────────────────────────────────────────────────── */
  function DocGroup({ group, pendingReqs, onAsk }) {
    return (
      <div className="docp-group">
        <div className="docp-group-label">{group.label}</div>
        <table className="docp-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>Sr#</th>
              <th>Document Name</th>
              <th style={{ width: 80 }}>Mandatory</th>
              <th style={{ width: 148 }}>Status</th>
              <th style={{ width: 110 }}>Date Received</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {group.items.map((item, i) => {
              const isMissing = item.status === "Missing";
              const key       = docKey(group.label, item);
              const isPending = pendingReqs[key] === true;
              return (
                <tr key={i} style={{ background: isMissing ? "oklch(from var(--c-red) l c h / 0.04)" : "" }}>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)", textAlign: "center" }}>{item.sr}</td>
                  <td style={{ fontWeight: isMissing ? 600 : 400, color: isMissing ? "var(--text-1)" : "var(--text-2)" }}>{item.name}</td>
                  <td style={{ textAlign: "center" }}>
                    {item.mandatory
                      ? <span style={{ color: "var(--c-red)", fontWeight: 700, fontSize: 11 }}>YES</span>
                      : <span style={{ color: "var(--text-3)", fontSize: 11 }}>No</span>}
                  </td>

                  {/* Status cell: badge + Ask button (or Asked chip) */}
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <DocStatusBadge status={item.status} />
                      {isMissing && !isPending && (
                        <AskUserBtn onClick={() => onAsk(group.label, item)} />
                      )}
                      {isMissing && isPending && <AskedBadge />}
                    </div>
                  </td>

                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-3)" }}>{item.dateReceived}</td>

                  {/* Remarks cell: override to "Pending upload" when asked */}
                  <td style={{ fontSize: 11, maxWidth: 240 }}>
                    {isPending ? (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        color: "var(--c-amber)", fontWeight: 500,
                      }}>
                        <span style={{ fontSize: 13 }}>⏳</span>
                        Pending upload by user
                      </span>
                    ) : (
                      <span style={{ color: isMissing ? "var(--c-amber)" : "var(--text-3)" }}>{item.remarks}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  /* ── DocumentsPanel ───────────────────────────────────────────── */
  // Receives { summary, groups } from app.documents spread,
  // plus app={app} injected by ParamsDashboard — use app for name/id.
  function DocumentsPanel({ summary, groups, app, applicantName, applicantPhone, appId }) {
    const [pendingReqs, setPendingReqs] = useState({});
    const [modal,       setModal]       = useState(null);

    if (!summary) return <div style={{ padding: 32, color: "var(--text-3)" }}>No document data available.</div>;

    // Prefer explicit props, fall back to app object
    const name  = applicantName  || app?.name  || "";
    const phone = applicantPhone || app?.phone || "";
    const id    = appId          || app?.id    || "";

    const openModal  = (groupLabel, item) => setModal({ groupLabel, item });
    const closeModal = () => setModal(null);
    const handleSend = () => {
      if (!modal) return;
      setPendingReqs(prev => ({ ...prev, [docKey(modal.groupLabel, modal.item)]: true }));
    };

    return (
      <>
        <div className="docp-panel">
          <SummaryStrip summary={summary} />
          {(groups || []).map((g, i) => (
            <DocGroup
              key={i}
              group={g}
              pendingReqs={pendingReqs}
              onAsk={openModal}
            />
          ))}
        </div>

        {modal && (
          <AskUserModal
            item={modal.item}
            groupLabel={modal.groupLabel}
            applicantName={name}
            applicantPhone={phone}
            appId={id}
            onSend={handleSend}
            onClose={closeModal}
          />
        )}
      </>
    );
  }

  window.DocumentsPanel = DocumentsPanel;
})();
