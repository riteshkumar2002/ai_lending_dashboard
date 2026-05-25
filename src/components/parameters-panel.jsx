// ParameterGroupPanel — single parameter group with collapsible sub-groups
// Props: { label, subGroups: [{ label, rows: [{ name, value, source }] }] }

(function () {
  const { useState } = React;

  function SubGroup({ sg }) {
    const [open, setOpen] = useState(true);
    return (
      <div className="pg-subgroup">
        <button className="pg-subgroup-header" onClick={() => setOpen(o => !o)}>
          <span className="pg-chevron" style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
          <span className="pg-subgroup-label">{sg.label}</span>
          <span className="pg-row-count">{(sg.rows || []).length} params</span>
        </button>
        {open && (
          <table className="pg-table">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Parameter</th>
                <th style={{ textAlign: "left" }}>Value</th>
                <th style={{ textAlign: "left", width: 180 }}>Source</th>
              </tr>
            </thead>
            <tbody>
              {(sg.rows || []).map((row, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500, fontSize: 12, color: "var(--text-1)" }}>{row.name}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-2)" }}>{row.value || "—"}</td>
                  <td style={{ fontSize: 11, color: "var(--text-3)" }}>{row.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  function ParameterGroupPanel({ label, subGroups }) {
    if (!subGroups) return <div style={{ padding: 32, color: "var(--text-3)" }}>No parameter data available.</div>;
    return (
      <div className="pg-panel">
        {(subGroups || []).map((sg, i) => <SubGroup key={i} sg={sg} />)}
      </div>
    );
  }

  window.ParameterGroupPanel = ParameterGroupPanel;
})();
