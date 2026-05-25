// ApplicantIdentityPanel — premium "Applicant Identity" analytics card
// Receives: { label, subGroups, app }

(function () {
  const { useState } = React;

  function getVal(rows, name) {
    return (rows || []).find(r => r.name === name)?.value || "—";
  }

  function fmtSegment(raw) {
    return {
      SELF_EMPLOYED_PROFESSIONAL:     "Self-Employed Prof.",
      SELF_EMPLOYED_NON_PROFESSIONAL: "Self-Employed Non-Prof.",
      SALARIED:                       "Salaried",
      SELF_EMPLOYED:                  "Self-Employed",
    }[raw] || (raw || "—");
  }

  function fmtConstitution(raw) {
    return {
      "HINDU_UNDIVIDED_FAMILY (HUF)": "HUF",
      INDIVIDUAL:                     "Individual",
      PARTNERSHIP:                    "Partnership",
      PROPRIETORSHIP:                 "Proprietorship",
    }[raw] || (raw || "").replace(/_/g, " ") || "—";
  }

  /* ── Verification chip ────────────────────────────────────────── */
  function VerifyChip({ label, type }) {
    const palette = {
      green: { color: "var(--c-green)", bg: "oklch(from var(--c-green) l c h / 0.10)", brd: "oklch(from var(--c-green) l c h / 0.24)" },
      blue:  { color: "var(--accent)",  bg: "oklch(from var(--accent) l c h / 0.10)",  brd: "oklch(from var(--accent) l c h / 0.28)" },
      slate: { color: "var(--text-2)",  bg: "var(--bg-2)",                              brd: "var(--bg-3)" },
    };
    const c = palette[type] || palette.blue;
    return (
      <span className="ai-chip" style={{ color: c.color, background: c.bg, border: `1px solid ${c.brd}` }}>
        <svg width="8" height="8" viewBox="0 0 9 9" fill="none">
          <path d="M1.5 4.8l1.8 1.8L7.5 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {label}
      </span>
    );
  }

  /* ── KV row ───────────────────────────────────────────────────── */
  function KVRow({ label, value, highlight, mono, isLast }) {
    const valColor = highlight === "green" ? "var(--c-green)"
                   : highlight === "amber" ? "var(--c-amber)"
                   : "var(--text-1)";
    return (
      <div className="ai-kv-row" style={{ borderBottom: isLast ? "none" : "1px solid var(--bg-3)" }}>
        <span className="ai-kv-label">{label}</span>
        <span className="ai-kv-value" style={{
          color: valColor,
          fontFamily: mono ? "var(--font-mono)" : "inherit",
          fontWeight: highlight ? 600 : 500,
        }}>
          {value || "—"}
        </span>
      </div>
    );
  }

  /* ── Section block ────────────────────────────────────────────── */
  function DataSection({ title, rows }) {
    return (
      <div className="ai-section">
        <div className="ai-section-title">{title}</div>
        {rows.map((row, i) => (
          <KVRow key={i} {...row} isLast={i === rows.length - 1} />
        ))}
      </div>
    );
  }

  /* ── Main panel ───────────────────────────────────────────────── */
  function ApplicantIdentityPanel({ label, subGroups, app }) {
    const [hovered, setHovered] = useState(false);

    const demoRows  = (subGroups || []).find(g => g.label === "Demographics")?.rows || [];
    const kycRows   = (subGroups || []).find(g => g.label === "KYC")?.rows           || [];
    const residRows = (subGroups || []).find(g => g.label === "Residence")?.rows     || [];

    const segment      = getVal(demoRows, "Customer Segment");
    const constitution = getVal(demoRows, "Constitution");
    const appType      = getVal(demoRows, "Applicant Type");
    const panStatus    = getVal(kycRows,  "PAN NSDL Status");
    const aadhaar      = getVal(kycRows,  "Aadhaar Number");
    const nationality  = getVal(kycRows,  "Nationality");

    const initials         = app?.initials || "AM";
    const fullName         = app?.name     || "Applicant";
    const roleLabel        = fmtSegment(segment);
    const constitLabel     = fmtConstitution(constitution);
    const isPanVerified    = /TRUE|VERIFIED/i.test(panStatus);
    const isAadhaarLinked  = aadhaar && aadhaar !== "—";
    const isIndian         = /INDIAN/i.test(nationality);
    const panDisplay       = isPanVerified ? "TRUE (Verified)" : panStatus;

    return (
      <div
        className="ai-card"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          boxShadow: hovered
            ? "0 10px 36px oklch(0 0 0 / 0.20), 0 0 0 1px var(--bg-3-strong)"
            : "0 2px 14px oklch(0 0 0 / 0.10)",
          transform: hovered ? "translateY(-2px)" : "none",
        }}
      >
        {/* ── Header ────────────────────────────────────── */}
        <div className="ai-header">
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div className="ai-icon-box">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            </div>
            <div>
              <div className="ai-card-title">Applicant Identity</div>
              <div className="ai-card-sub">KYC · Demographics · Residence</div>
            </div>
          </div>
          <span className="ai-section-badge">SECTION 01</span>
        </div>

        <div className="ai-rule" />

        {/* ── Body ──────────────────────────────────────── */}
        <div className="ai-body">

          {/* Profile strip */}
          <div className="ai-profile-strip">
            <div className="ai-avatar">{initials}</div>
            <div className="ai-profile-text">
              <div className="ai-name">{fullName}</div>
              <div className="ai-role">{roleLabel}</div>
            </div>
            <div className="ai-chips">
              {isPanVerified   && <VerifyChip label="PAN Verified"    type="green" />}
              {isAadhaarLinked && <VerifyChip label="Aadhaar Linked"  type="blue"  />}
              {isIndian        && <VerifyChip label="Indian"          type="blue"  />}
            </div>
          </div>

          <div className="ai-divider" />

          {/* Data sections */}
          <DataSection
            title="Demographics"
            rows={[
              { label: "Age",              value: getVal(demoRows, "Age") },
              { label: "Date of Birth",    value: getVal(demoRows, "Date of Birth"), mono: true },
              { label: "Applicant Type",   value: appType },
              { label: "Customer Segment", value: segment },
              { label: "Constitution",     value: constitLabel },
            ]}
          />

          <div className="ai-divider" />

          <DataSection
            title="KYC"
            rows={[
              { label: "PAN Number",    value: getVal(kycRows, "PAN Number"), mono: true },
              { label: "PAN Status",    value: panDisplay, highlight: isPanVerified ? "green" : false },
              { label: "Aadhaar",       value: aadhaar, mono: true },
              { label: "Nationality",   value: nationality },
            ]}
          />

          <div className="ai-divider" />

          <DataSection
            title="Residence"
            rows={[
              { label: "Resident Type", value: getVal(residRows, "Resident Type") },
              { label: "Address",       value: getVal(residRows, "Current Address"), isLast: true },
            ]}
          />

        </div>
      </div>
    );
  }

  window.ApplicantIdentityPanel = ApplicantIdentityPanel;
})();
