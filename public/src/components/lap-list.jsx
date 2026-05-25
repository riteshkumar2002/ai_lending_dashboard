// LapQueueList — left-rail queue for LAP applications
// Reuses existing list-pane CSS classes; LAP-specific columns: CIBIL / LTV / Amount

(function () {
  const { useState, useMemo } = React;

  function LapQueueList({ apps, selectedId, onSelect, query, setQuery }) {
    const [statusFilter, setStatusFilter] = useState("all");

    const filtered = useMemo(() => {
      const q = query.trim().toLowerCase();
      return apps.filter(a => {
        if (statusFilter !== "all" && a.status !== statusFilter) return false;
        if (!q) return true;
        return (
          a.name.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q) ||
          a.product.toLowerCase().includes(q)
        );
      });
    }, [apps, query, statusFilter]);

    const counts = useMemo(() => {
      const out = { all: apps.length };
      apps.forEach(a => { out[a.status] = (out[a.status] || 0) + 1; });
      return out;
    }, [apps]);

    const cibilColor = score => score >= 750 ? "var(--c-green)" : score >= 650 ? "var(--c-amber)" : "var(--c-red)";

    const filters = [
      ["all",        "All",        counts.all || 0],
      ["in_review",  "NCM Review", counts.in_review || 0],
      ["approved",   "Approved",   counts.approved || 0],
      ["pending",    "Pending",    counts.pending || 0],
      ["rejected",   "Rejected",   counts.rejected || 0],
    ];

    return (
      <aside className="list-pane">
        {/* Header */}
        <div className="list-header">
          <div className="list-header-row">
            <div>
              <div className="eyebrow">Queue · Applications</div>
              <div className="list-title">Applications</div>
            </div>
            <div className="queue-meta">
              <div><span className="num">{counts.all}</span><span className="meta-l">total</span></div>
              <div><span className="num">{(counts.in_review || 0) + (counts.pending || 0)}</span><span className="meta-l">pending</span></div>
            </div>
          </div>

          <div className="search-row">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search name, ID, product…"
              spellCheck={false}
            />
            <kbd>/</kbd>
          </div>

          <div className="chip-row">
            {filters.map(([k, label, n]) => (
              <button
                key={k}
                className={"chip" + (statusFilter === k ? " chip-active" : "")}
                onClick={() => setStatusFilter(k)}
              >
                {label}<span className="chip-n">{n}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Column headers */}
        <div className="list-colhead">
          <span>Applicant</span>
          <span style={{ textAlign: "center" }}>CIBIL</span>
          <span style={{ textAlign: "center" }}>LTV</span>
          <span style={{ textAlign: "right" }}>Amount</span>
        </div>

        {/* Rows */}
        <div className="list-rows">
          {filtered.length === 0 && <div className="empty">No applications match.</div>}
          {filtered.map(a => {
            const isSel = a.id === selectedId;
            const statusMeta = (window.LAP_STATUS_META || {})[a.status] || { label: a.stage, dot: "var(--text-3)" };
            return (
              <button
                key={a.id}
                className={"row" + (isSel ? " row-sel" : "")}
                onClick={() => onSelect(a.id)}
              >
                <div className="row-stripe" style={{ background: statusMeta.dot }} />
                <div className="row-main">
                  <div className="row-line1">
                    <div className="avatar">{a.initials}</div>
                    <div className="row-name">
                      <div className="row-name-text">{a.name}</div>
                      <div className="row-sub">
                        <span className="row-id">{a.id}</span>
                        <span className="dot-sep">·</span>
                        <span>{a.submittedAgo}</span>
                      </div>
                    </div>
                  </div>
                  <div className="row-line2">
                    <span className="status-pill" style={{ "--pill": statusMeta.dot }}>
                      <span className="status-dot" />{a.stage}
                    </span>
                    {(a.flags || []).slice(0, 2).map(f => (
                      <span key={f} className="flag-pill">{f}</span>
                    ))}
                  </div>
                </div>
                <div className="row-num row-num-cibil">
                  <span className="row-num-primary" style={{ color: cibilColor(a.cibilScore) }}>
                    {a.cibilScore}
                  </span>
                  <span className="row-num-secondary">
                    {Math.round(a.ltv * 100)}%
                  </span>
                </div>
                <div className="row-num row-num-ltv">
                  {Math.round(a.ltv * 100)}%
                </div>
                <div className="row-num row-num-amt">
                  {window.fmtINR ? window.fmtINR(a.amount) : a.amount}
                </div>
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  window.LapQueueList = LapQueueList;
})();
