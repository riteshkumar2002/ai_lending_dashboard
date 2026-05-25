// Consumer Data Ingestion & Flow dashboard

const INGESTION_DATA = {
  topMetrics: [
    { label: "Events / day", value: "54.1k", sub: "+8% vs 7d", tone: "good" },
    { label: "Sources connected", value: "12", sub: "All healthy", tone: "good" },
    { label: "End-to-end latency", value: "1.9s", sub: "p95", tone: "neutral" },
    { label: "Schema drift flags", value: "0", sub: "Past 24h", tone: "good" },
    { label: "Failed parses", value: "0.3%", sub: "Below SLA", tone: "good" },
  ],
  sources: [
    { id: "cibil",   letter: "C", tone: "good", title: "CIBIL / Experian",     sub: "Personal Bureau Report",    meta: "Score 300–900 · DPD · Trade Lines",   vol: "12.4k/d" },
    { id: "karza",   letter: "K", tone: "good", title: "KARZA / DigiLocker",   sub: "eKYC + Aadhaar",            meta: "PAN · Voter ID · Address Proof",     vol: "3.1k/d"  },
    { id: "aa",      letter: "A", tone: "good", title: "Account Aggregator",   sub: "Salary / Savings",          meta: "Income credits · EMI debits · AA",    vol: "20.9k/d" },
    { id: "telecom", letter: "T", tone: "good", title: "Telecom & Alt Data",   sub: "Mobile + Utility",          meta: "Usage patterns · Device footprint",   vol: "9.7k/d"  },
  ],
  parsers: [
    { id: "ekyc",   icon: "id",     title: "eKYC Processor",        sub: "Aadhaar OTP + Selfie Match", p95: "1.2s p95" },
    { id: "salary", icon: "doc",    title: "Salary Slip Parser",    sub: "OCR · Gross / Net Income",   p95: "0.8s p95" },
    { id: "form16", icon: "doc",    title: "Form-16 Extractor",     sub: "TDS · Employer · CTC",       p95: "1.6s p95" },
    { id: "bank",   icon: "bank",   title: "Bank Stmt Normalizer",  sub: "Salary credits · EMI debits",p95: "2.3s p95" },
    { id: "bureau", icon: "shield", title: "Bureau Parser",         sub: "Personal CIBIL schema",      p95: "0.4s p95" },
  ],
  core: {
    title: "Agentic AI Core",
    capabilities: ["Income Verification", "Bureau Fusion", "Behavioral Signals", "Life Event Detection"],
    metrics: [
      { l: "p95 inference", v: "187ms" },
      { l: "Models live",   v: "8 / 8" },
      { l: "Drift alerts",  v: "0" },
      { l: "Throughput",    v: "54k/m" },
    ],
    featureGroups: ["FOIR", "DTI", "EMI/Income", "Bureau fusion", "Income velocity", "Life events", "Device fp"],
  },
  outputs: [
    { n: "01", eyebrow: "Acquisition", title: "Propensity & Product Fit",   tone: "good", items: ["New Loan Score", "Pre-Qualification", "Best Loan Recommendation"] },
    { n: "02", eyebrow: "Decisioning", title: "Identity & Underwriting",     tone: "good", items: ["eKYC Confidence", "Fraud Risk", "Approval Score"] },
    { n: "03", eyebrow: "Lifecycle",   title: "Monitoring & Collections",    tone: "warn", items: ["Early Warning Score", "Repayment Risk", "Collections Priority"] },
  ],
};

const SCHEMA_GROUPS = [
  {
    label: "Identity", source: "KARZA / DigiLocker", color: "var(--c-green)",
    fields: [
      { name: "pan_number",          type: "string",  req: true,  desc: "Permanent Account Number" },
      { name: "aadhaar_hash",        type: "string",  req: true,  desc: "SHA-256 of Aadhaar UID — never stored raw" },
      { name: "full_name",           type: "string",  req: true,  desc: "Legal name from Aadhaar" },
      { name: "dob",                 type: "date",    req: true,  desc: "Date of birth" },
      { name: "address_verified",    type: "bool",    req: false, desc: "eKYC address match flag" },
      { name: "selfie_match_score",  type: "float",   req: false, desc: "Liveness confidence 0–1" },
    ],
  },
  {
    label: "Bureau", source: "CIBIL / Experian", color: "var(--accent)",
    fields: [
      { name: "cibil_score",         type: "integer", req: true,  desc: "Credit score 300–900" },
      { name: "dpd_30",              type: "integer", req: true,  desc: "Days past due (30d count)" },
      { name: "dpd_60",              type: "integer", req: true,  desc: "Days past due (60d count)" },
      { name: "total_tradelines",    type: "integer", req: true,  desc: "Active tradeline count" },
      { name: "revolving_util",      type: "float",   req: true,  desc: "Revolving utilization ratio" },
      { name: "file_age_months",     type: "integer", req: false, desc: "Oldest tradeline age (months)" },
      { name: "inquiries_6m",        type: "integer", req: false, desc: "Hard inquiries, last 6 months" },
      { name: "collections",         type: "integer", req: false, desc: "Active collection accounts" },
    ],
  },
  {
    label: "Income", source: "Account Aggregator · Salary Slip", color: "var(--c-amber)",
    fields: [
      { name: "gross_monthly_income",   type: "float",   req: true,  desc: "Gross income / month (INR)" },
      { name: "net_monthly_income",     type: "float",   req: true,  desc: "Net take-home / month" },
      { name: "income_source",          type: "enum",    req: true,  desc: "salaried | self_employed | gig" },
      { name: "employer_name",          type: "string",  req: false, desc: "Employer as on salary slip" },
      { name: "employer_tenure_months", type: "integer", req: false, desc: "Months at current employer" },
      { name: "income_verified",        type: "bool",    req: true,  desc: "AA + payroll cross-confirmed" },
    ],
  },
  {
    label: "Cashflow", source: "Account Aggregator", color: "var(--c-green-soft)",
    fields: [
      { name: "avg_monthly_inflow",  type: "float",   req: true,  desc: "Avg credit, 6 months" },
      { name: "avg_monthly_outflow", type: "float",   req: true,  desc: "Avg debit, 6 months" },
      { name: "nsf_count_6m",        type: "integer", req: true,  desc: "NSF / bounce count, 6 months" },
      { name: "emi_obligations",     type: "float",   req: true,  desc: "Monthly EMI commitments" },
      { name: "foir",                type: "float",   req: true,  desc: "Fixed obligation income ratio" },
      { name: "avg_eod_balance",     type: "float",   req: false, desc: "Avg end-of-day balance" },
      { name: "bnpl_active",         type: "integer", req: false, desc: "Active BNPL accounts" },
    ],
  },
  {
    label: "Device & KYC", source: "Telecom & Alt Data", color: "var(--text-3)",
    fields: [
      { name: "device_fingerprint",  type: "string",  req: false, desc: "Hashed device identifier" },
      { name: "sim_tenure_months",   type: "integer", req: false, desc: "Mobile number age (months)" },
      { name: "velocity_flag",       type: "bool",    req: false, desc: "Multiple apps same device/IP" },
      { name: "ofac_clear",          type: "bool",    req: true,  desc: "OFAC / PEP sanctions cleared" },
    ],
  },
];

const LINEAGE_COLS = [
  {
    title: "Sources", subtitle: "Raw data ingestion",
    nodes: [
      { label: "CIBIL / Experian",    sub: "Bureau",          tone: "good",    targets: [0] },
      { label: "KARZA / DigiLocker",  sub: "eKYC + Aadhaar",  tone: "good",    targets: [1] },
      { label: "Account Aggregator",  sub: "Salary / Savings", tone: "good",   targets: [2, 3, 4] },
      { label: "Telecom & Alt Data",  sub: "Mobile + Utility", tone: "good",   targets: [1] },
    ],
  },
  {
    title: "Parsers", subtitle: "Document normalisation",
    nodes: [
      { label: "Bureau Parser",        sub: "0.4s p95",  tone: "good" },
      { label: "eKYC Processor",       sub: "1.2s p95",  tone: "good" },
      { label: "Salary Slip Parser",   sub: "0.8s p95",  tone: "good" },
      { label: "Bank Stmt Normalizer", sub: "2.3s p95",  tone: "warn" },
      { label: "Form-16 Extractor",    sub: "1.6s p95",  tone: "good" },
    ],
  },
  {
    title: "AI Core", subtitle: "Streaming inference · Kafka",
    nodes: [
      { label: "Agentic AI Core", sub: "8 models · 187ms p95", tone: "good", big: true },
    ],
  },
  {
    title: "Outputs", subtitle: "8 modular scores · 3 phases",
    nodes: [
      { label: "Propensity Score",      sub: "Acquisition", tone: "good"    },
      { label: "Pre-Qualification",     sub: "Acquisition", tone: "good"    },
      { label: "Approval Score",        sub: "Decisioning", tone: "good"    },
      { label: "Fraud Risk",            sub: "Decisioning", tone: "good"    },
      { label: "eKYC Confidence",       sub: "Decisioning", tone: "good"    },
      { label: "Early Warning Score",   sub: "Lifecycle",   tone: "warn"    },
      { label: "Repayment Risk",        sub: "Lifecycle",   tone: "warn"    },
      { label: "Collections Priority",  sub: "Lifecycle",   tone: "neutral" },
    ],
  },
];

const HEALTH_DATA = {
  sources: [
    { label: "CIBIL / Experian",    uptime: "99.98%", lastSync: "2m ago",  latency: "340ms", errRate: "0.02%", status: "good", vol: "12.4k/d" },
    { label: "KARZA / DigiLocker",  uptime: "99.91%", lastSync: "5m ago",  latency: "820ms", errRate: "0.09%", status: "good", vol: "3.1k/d"  },
    { label: "Account Aggregator",  uptime: "99.95%", lastSync: "1m ago",  latency: "210ms", errRate: "0.05%", status: "good", vol: "20.9k/d" },
    { label: "Telecom & Alt Data",  uptime: "99.72%", lastSync: "12m ago", latency: "1.4s",  errRate: "0.28%", status: "warn", vol: "9.7k/d"  },
  ],
  parsers: [
    { label: "Bureau Parser",        p95: "0.4s",  errRate: "0.04%", throughput: "12.4k/d", status: "good" },
    { label: "eKYC Processor",       p95: "1.2s",  errRate: "0.12%", throughput: "3.1k/d",  status: "good" },
    { label: "Salary Slip Parser",   p95: "0.8s",  errRate: "0.08%", throughput: "8.4k/d",  status: "good" },
    { label: "Bank Stmt Normalizer", p95: "2.3s",  errRate: "0.44%", throughput: "11.2k/d", status: "warn" },
    { label: "Form-16 Extractor",    p95: "1.6s",  errRate: "0.21%", throughput: "2.9k/d",  status: "good" },
  ],
  models: [
    { label: "Income Verification", version: "v2.4.1", accuracy: "97.2%", status: "good" },
    { label: "Bureau Fusion",       version: "v1.8.0", accuracy: "98.1%", status: "good" },
    { label: "Fraud Risk",          version: "v3.1.2", accuracy: "96.4%", status: "good" },
    { label: "Approval Score",      version: "v2.9.0", accuracy: "94.8%", status: "good" },
    { label: "Propensity",          version: "v1.5.3", accuracy: "89.2%", status: "good" },
    { label: "Early Warning",       version: "v2.0.1", accuracy: "91.7%", status: "warn" },
    { label: "FOIR Model",          version: "v1.2.0", accuracy: "97.8%", status: "good" },
    { label: "Behavioral Signals",  version: "v1.0.4", accuracy: "85.3%", status: "good" },
  ],
  incidents: [
    { time: "Today · 09:14", label: "Telecom latency spike · p95 exceeded 2s for 4 min", sev: "warn" },
    { time: "Today · 07:32", label: "Bank Stmt Normalizer error rate elevated to 0.44%",  sev: "warn" },
    { time: "Apr 26 · 22:10", label: "Account Aggregator briefly disconnected · auto-recovered", sev: "info" },
    { time: "Apr 26 · 14:05", label: "CIBIL schema v2.1.0 deployed — no breaking changes", sev: "info" },
  ],
};

window.INGESTION_DATA = INGESTION_DATA;

// ─── Icon helper ────────────────────────────────────────────────────
function IngIcon({ kind, size = 14 }) {
  const paths = {
    id:     "M4 5h16v14H4zM4 9h16M8 14h4",
    doc:    "M6 3h9l3 3v15H6zM15 3v3h3",
    bank:   "M3 9h18M5 9V20h14V9M3 9l9-5 9 5",
    shield: "M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z",
    check:  "M5 12l5 5L20 7",
    warn:   "M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
    circle: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-6v-4m0-4h.01",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[kind] || paths.doc} />
    </svg>
  );
}

// ─── Status dot ─────────────────────────────────────────────────────
function StatusDot({ status, size = 7 }) {
  const color = status === "good" ? "var(--c-green)" : status === "warn" ? "var(--c-amber)" : "var(--c-red)";
  return <span style={{ display: "inline-block", width: size, height: size, borderRadius: "50%", background: color, flexShrink: 0 }} />;
}

// ─── FLOW tab ────────────────────────────────────────────────────────
function FlowView({ d }) {
  return (
    <div className="detail-grid ing-grid">
      {/* 01 — Sources */}
      <section className="card card-span-1">
        <div className="card-head">
          <div><div className="card-title">01 · Consumer data sources</div><div className="card-sub">What we ingest</div></div>
        </div>
        <div className="card-body ing-list">
          {d.sources.map(s => (
            <button key={s.id} className="ing-row" type="button">
              <span className={"ing-tag ing-tone-bg-" + s.tone}>{s.letter}</span>
              <span className="ing-row-body">
                <span className="ing-row-head">
                  <span className="ing-row-title">{s.title}</span>
                  <span className="ing-row-vol">{s.vol}</span>
                </span>
                <span className="ing-row-sub">{s.sub}</span>
                <span className="ing-row-meta">{s.meta}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 02 — Parsers */}
      <section className="card card-span-1">
        <div className="card-head">
          <div><div className="card-title">02 · Ingestion prism</div><div className="card-sub">Document parsers</div></div>
        </div>
        <div className="card-body ing-list">
          {d.parsers.map(p => (
            <div key={p.id} className="ing-row ing-row-static">
              <span className="ing-tag ing-tag-ghost"><IngIcon kind={p.icon} /></span>
              <span className="ing-row-body">
                <span className="ing-row-head">
                  <span className="ing-row-title">{p.title}</span>
                  <span className="ing-row-mono">{p.p95}</span>
                </span>
                <span className="ing-row-sub">{p.sub}</span>
              </span>
            </div>
          ))}
          <div className="ing-note">All parsed fields converge to a unified consumer schema before fan-out.</div>
        </div>
      </section>

      {/* 03 — AI Core */}
      <section className="card card-span-1">
        <div className="card-head">
          <div><div className="card-title">03 · Compute</div><div className="card-sub">Streaming AI core</div></div>
          <span className="ing-mini-pill"><span className="ing-mini-dot" />KAFKA</span>
        </div>
        <div className="card-body">
          <div className="ing-core-name">{d.core.title}</div>
          <div className="ing-core-caps">{d.core.capabilities.join(" · ")}</div>
          <div className="ing-core-grid">
            {d.core.metrics.map(m => (
              <div key={m.l} className="ing-core-cell">
                <div className="ing-core-cell-l">{m.l}</div>
                <div className="ing-core-cell-v">{m.v}</div>
              </div>
            ))}
          </div>
          <div className="ing-divider" />
          <div className="ing-fg-l">Feature groups</div>
          <div className="ing-fg-list">
            {d.core.featureGroups.map(f => <span key={f} className="ing-fg-chip">{f}</span>)}
          </div>
        </div>
      </section>

      {/* 04 — Outputs */}
      <section className="card card-span-1">
        <div className="card-head">
          <div><div className="card-title">04 · Lifecycle outputs</div><div className="card-sub">8 modular scores · 3 phases</div></div>
        </div>
        <div className="card-body ing-list ing-list-tight">
          {d.outputs.map(o => (
            <div key={o.n} className="ing-out">
              <div className="ing-out-head">
                <span className={"ing-out-num ing-tone-" + o.tone}>{o.n}</span>
                <div className="ing-out-text">
                  <span className="ing-out-eyebrow">{o.eyebrow}</span>
                  <span className="ing-out-title">{o.title}</span>
                </div>
              </div>
              <div className="ing-out-items">
                {o.items.map(it => (
                  <div key={it} className="ing-out-item">
                    <span className={"ing-mini-dot ing-mini-dot-" + o.tone} />
                    <span>{it}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── SCHEMAS tab ─────────────────────────────────────────────────────
function TypePill({ type }) {
  const colors = {
    string:  { bg: "oklch(from var(--accent) l c h / 0.12)",       color: "var(--accent-strong)" },
    integer: { bg: "oklch(from var(--c-green) l c h / 0.12)",      color: "var(--c-green)" },
    float:   { bg: "oklch(from var(--c-green) l c h / 0.12)",      color: "var(--c-green)" },
    bool:    { bg: "oklch(from var(--c-amber) l c h / 0.12)",      color: "var(--c-amber)" },
    date:    { bg: "oklch(from var(--c-amber) l c h / 0.12)",      color: "var(--c-amber)" },
    enum:    { bg: "oklch(from var(--c-red) l c h / 0.10)",        color: "var(--c-red)" },
  };
  const s = colors[type] || colors.string;
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, padding: "1px 6px", borderRadius: 3, background: s.bg, color: s.color, fontWeight: 600 }}>
      {type}
    </span>
  );
}

function SchemasView() {
  const [search, setSearch] = React.useState("");
  const q = search.toLowerCase();
  const filtered = SCHEMA_GROUPS.map(g => ({
    ...g,
    fields: g.fields.filter(f =>
      !q || f.name.includes(q) || f.desc.toLowerCase().includes(q) || f.type.includes(q)
    ),
  })).filter(g => !q || g.fields.length > 0 || g.label.toLowerCase().includes(q));

  const total = SCHEMA_GROUPS.reduce((a, g) => a + g.fields.length, 0);

  return (
    <div style={{ padding: "16px 20px 40px", display: "flex", flexDirection: "column", gap: 14 }}>
      {/* toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>Unified Consumer Schema</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-3)" }}>{total} fields · {SCHEMA_GROUPS.length} groups · v2.1.0</span>
        </div>
        <div className="search-row" style={{ margin: 0, width: 260 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search field, type…" style={{ border: 0, background: "transparent", outline: "none", fontSize: 12, color: "var(--text-1)", flex: 1 }} />
        </div>
      </div>

      {/* groups */}
      {filtered.map(g => (
        <div key={g.label} className="card">
          <div className="card-head" style={{ alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: g.color, flexShrink: 0 }} />
              <div>
                <div className="card-title">{g.label}</div>
                <div className="card-sub">{g.source}</div>
              </div>
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-3)" }}>{g.fields.length} fields</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="tl-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ paddingLeft: 14 }}>Field name</th>
                  <th>Type</th>
                  <th>Required</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {g.fields.map(f => (
                  <tr key={f.name}>
                    <td style={{ paddingLeft: 14 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-1)", fontWeight: 500 }}>{f.name}</span>
                    </td>
                    <td><TypePill type={f.type} /></td>
                    <td>
                      {f.req
                        ? <span style={{ fontSize: 10, fontWeight: 600, color: "var(--c-green)", textTransform: "uppercase", letterSpacing: "0.06em" }}>required</span>
                        : <span style={{ fontSize: 10, color: "var(--text-4)" }}>optional</span>
                      }
                    </td>
                    <td style={{ color: "var(--text-3)", fontSize: 11.5 }}>{f.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── LINEAGE tab ──────────────────────────────────────────────────────
function LineageView() {
  const toneColor = {
    good:    "var(--c-green)",
    warn:    "var(--c-amber)",
    bad:     "var(--c-red)",
    neutral: "var(--text-3)",
  };

  return (
    <div style={{ padding: "16px 20px 40px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>Data lineage · end-to-end pipeline</span>
        <div style={{ display: "flex", gap: 16, fontSize: 10.5, color: "var(--text-3)" }}>
          {[["good","Healthy"],["warn","Degraded"],["neutral","Passthrough"]].map(([t, l]) => (
            <span key={t} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: toneColor[t], display: "inline-block" }} />{l}
            </span>
          ))}
        </div>
      </div>

      {/* 4-column lineage grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 28px 1fr 28px 1fr 28px 1fr", gap: 0, alignItems: "center" }}>
        {LINEAGE_COLS.map((col, ci) => (
          <React.Fragment key={ci}>
            {/* Column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {/* Column header */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", fontWeight: 600 }}>
                  {String(ci + 1).padStart(2, "0")}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", letterSpacing: "-0.01em" }}>{col.title}</div>
                <div style={{ fontSize: 10.5, color: "var(--text-3)" }}>{col.subtitle}</div>
              </div>
              {/* Nodes */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {col.nodes.map((node, ni) => (
                  <div key={ni} style={{
                    background: node.big ? "linear-gradient(135deg, oklch(from var(--c-green) l c h / 0.10), var(--bg-1))" : "var(--bg-1)",
                    border: `1px solid ${node.big ? "oklch(from var(--c-green) l c h / 0.3)" : "var(--bg-3)"}`,
                    borderRadius: "var(--r-md)",
                    padding: node.big ? "12px 14px" : "8px 10px",
                    display: "flex", flexDirection: "column", gap: 2,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <StatusDot status={node.tone} />
                      <span style={{ fontSize: node.big ? 12 : 11.5, fontWeight: 600, color: "var(--text-1)" }}>{node.label}</span>
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-3)", paddingLeft: 13 }}>{node.sub}</div>
                    {node.targets && (
                      <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: 3, paddingLeft: 13 }}>
                        {node.targets.map(t => (
                          <span key={t} style={{ fontSize: 9.5, fontFamily: "var(--font-mono)", color: "var(--accent)", background: "oklch(from var(--accent) l c h / 0.10)", padding: "1px 5px", borderRadius: 3 }}>
                            → {LINEAGE_COLS[1].nodes[t]?.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Arrow between columns */}
            {ci < LINEAGE_COLS.length - 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--bg-3-strong)", fontSize: 18 }}>›</div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Edge summary strip */}
      <div className="card" style={{ marginTop: 4 }}>
        <div className="card-head">
          <div className="card-title">Edge annotations</div>
          <div className="card-sub">Data contracts between stages</div>
        </div>
        <div className="card-body" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px 20px" }}>
          {[
            ["CIBIL → Bureau Parser", "Raw XML · CIBIL v4.2 schema"],
            ["KARZA → eKYC Processor", "JSON · eKYC API v2"],
            ["AA → Salary Slip Parser", "PDF · Base64 encoded"],
            ["AA → Bank Stmt Normalizer", "OFX / CSV · AA FIP standard"],
            ["AA → Form-16 Extractor", "PDF · ITR Form-16 layout"],
            ["Telecom → eKYC Processor", "JSON · device + SIM telemetry"],
            ["All parsers → AI Core", "Parquet · unified consumer schema v2.1"],
            ["AI Core → Outputs", "JSON · score envelope · signed"],
          ].map(([edge, contract]) => (
            <div key={edge} style={{ fontSize: 11.5, padding: "5px 0", borderBottom: "1px solid var(--bg-3)" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-2)", fontWeight: 500 }}>{edge}</div>
              <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 1 }}>{contract}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── HEALTH tab ───────────────────────────────────────────────────────
function HealthStatusBadge({ status }) {
  const cfg = {
    good: { bg: "oklch(from var(--c-green) l c h / 0.12)", color: "var(--c-green)", label: "Healthy" },
    warn: { bg: "oklch(from var(--c-amber) l c h / 0.12)", color: "var(--c-amber)", label: "Degraded" },
    bad:  { bg: "oklch(from var(--c-red) l c h / 0.12)",   color: "var(--c-red)",   label: "Down" },
  }[status] || {};
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: cfg.bg, color: cfg.color, padding: "1px 7px", borderRadius: 999, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
      <StatusDot status={status} size={5} />{cfg.label}
    </span>
  );
}

function HealthView() {
  return (
    <div style={{ padding: "16px 20px 40px", display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Sources */}
      <div className="card">
        <div className="card-head">
          <div><div className="card-title">Source connectivity</div><div className="card-sub">Live status · last 24h</div></div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--c-green)" }}>
            {HEALTH_DATA.sources.filter(s => s.status === "good").length}/{HEALTH_DATA.sources.length} healthy
          </span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="tl-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 14 }}>Source</th>
                <th>Status</th>
                <th className="tnum">Uptime</th>
                <th className="tnum">Last sync</th>
                <th className="tnum">Latency</th>
                <th className="tnum">Error rate</th>
                <th className="tnum">Volume</th>
              </tr>
            </thead>
            <tbody>
              {HEALTH_DATA.sources.map(s => (
                <tr key={s.label}>
                  <td style={{ paddingLeft: 14, fontWeight: 500, color: "var(--text-1)" }}>{s.label}</td>
                  <td><HealthStatusBadge status={s.status} /></td>
                  <td className="tnum">{s.uptime}</td>
                  <td className="tnum" style={{ color: "var(--text-3)" }}>{s.lastSync}</td>
                  <td className="tnum">{s.latency}</td>
                  <td className="tnum" style={{ color: s.errRate > "0.20%" ? "var(--c-amber)" : "var(--text-2)" }}>{s.errRate}</td>
                  <td className="tnum" style={{ color: "var(--accent)", fontWeight: 500 }}>{s.vol}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Parsers + Models side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

        {/* Parsers */}
        <div className="card">
          <div className="card-head">
            <div><div className="card-title">Parser performance</div><div className="card-sub">p95 latency · error rate · throughput</div></div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="tl-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 14 }}>Parser</th>
                  <th>Status</th>
                  <th className="tnum">p95</th>
                  <th className="tnum">Error %</th>
                  <th className="tnum">Volume</th>
                </tr>
              </thead>
              <tbody>
                {HEALTH_DATA.parsers.map(p => (
                  <tr key={p.label}>
                    <td style={{ paddingLeft: 14, color: "var(--text-1)", fontWeight: 500 }}>{p.label}</td>
                    <td><HealthStatusBadge status={p.status} /></td>
                    <td className="tnum">{p.p95}</td>
                    <td className="tnum" style={{ color: p.status === "warn" ? "var(--c-amber)" : "var(--text-2)" }}>{p.errRate}</td>
                    <td className="tnum" style={{ color: "var(--accent)" }}>{p.throughput}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Models */}
        <div className="card">
          <div className="card-head">
            <div><div className="card-title">Model registry</div><div className="card-sub">Live versions · accuracy</div></div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--c-green)" }}>
              {HEALTH_DATA.models.filter(m => m.status === "good").length}/{HEALTH_DATA.models.length} nominal
            </span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="tl-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 14 }}>Model</th>
                  <th>Status</th>
                  <th className="tnum">Version</th>
                  <th className="tnum">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {HEALTH_DATA.models.map(m => (
                  <tr key={m.label}>
                    <td style={{ paddingLeft: 14, color: "var(--text-1)", fontWeight: 500 }}>{m.label}</td>
                    <td><HealthStatusBadge status={m.status} /></td>
                    <td className="tnum" style={{ fontFamily: "var(--font-mono)", fontSize: 10.5 }}>{m.version}</td>
                    <td className="tnum" style={{ color: m.status === "warn" ? "var(--c-amber)" : "var(--c-green)" }}>{m.accuracy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Incident log */}
      <div className="card">
        <div className="card-head">
          <div><div className="card-title">Recent events</div><div className="card-sub">Alerts · deployments · recoveries</div></div>
        </div>
        <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {HEALTH_DATA.incidents.map((inc, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "8px 120px 1fr", gap: 10, alignItems: "flex-start", padding: "6px 0", borderBottom: i < HEALTH_DATA.incidents.length - 1 ? "1px solid var(--bg-3)" : "none" }}>
              <StatusDot status={inc.sev === "warn" ? "warn" : "good"} size={7} style={{ marginTop: 3 }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-3)" }}>{inc.time}</span>
              <span style={{ fontSize: 11.5, color: inc.sev === "warn" ? "var(--c-amber)" : "var(--text-2)" }}>{inc.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────
function IngestionDashboard() {
  const d = window.INGESTION_DATA;
  const [tab, setTab] = React.useState("flow");

  return (
    <main className="detail-pane">
      {/* Header */}
      <div className="detail-header">
        <div className="detail-header-l">
          <div>
            <div className="detail-name-row">
              <h1 className="detail-name">Consumer Data Ingestion &amp; Flow</h1>
              <span className="status-pill" style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "2px 8px", fontSize: 10.5, fontWeight: 600,
                letterSpacing: "0.06em", textTransform: "uppercase",
                borderRadius: 999,
                color: "var(--c-green)",
                background: "oklch(from var(--c-green) l c h / 0.10)",
                border: "1px solid oklch(from var(--c-green) l c h / 0.35)",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--c-green)" }} />
                All systems live
              </span>
            </div>
            <div className="detail-meta">
              <span>Platform</span><span>·</span>
              <span>Pipeline architecture</span><span>·</span>
              <span>12 sources</span><span>·</span>
              <span>5 parsers</span><span>·</span>
              <span>8 models</span>
            </div>
          </div>
        </div>
        <div className="detail-header-r">
          {d.topMetrics.map((m, i) => (
            <div key={i} className="hk-stat">
              <div className="hk-l">{m.label}</div>
              <div className={"hk-v ing-tone-" + m.tone}>{m.value}</div>
              <div className="hk-sub">{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Action bar */}
      <div className="detail-actionbar">
        <div className="action-row">
          <div className="action-l">
            {[
              ["flow",    "Flow"],
              ["schemas", "Schemas"],
              ["lineage", "Lineage"],
              ["health",  "Health"],
            ].map(([k, label]) => (
              <button key={k} className={"tab" + (tab === k ? " tab-active" : "")} onClick={() => setTab(k)}>{label}</button>
            ))}
          </div>
          <div className="action-r">
            <button className="btn btn-ghost">Export</button>
            <button className="btn">Schema docs</button>
            <button className="btn btn-primary">Open lineage</button>
          </div>
        </div>
      </div>

      {/* Tab bodies */}
      {tab === "flow"    && <FlowView d={d} />}
      {tab === "schemas" && <SchemasView />}
      {tab === "lineage" && <LineageView />}
      {tab === "health"  && <HealthView />}
    </main>
  );
}

window.IngestionDashboard = IngestionDashboard;
