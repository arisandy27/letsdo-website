"use client";

import { useDeferredValue, useMemo, useState } from "react";

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function formatDate(value) {
  if (!value) return "-";
  const text = String(value);
  if (text.length < 10) return text;
  return `${text.slice(8, 10)}/${text.slice(5, 7)}/${text.slice(0, 4)}`;
}

function frequencyLabel(value) {
  const labels = {
    weekly: "Weekly",
    monthly: "Monthly",
    quarterly: "3 Month / Quarterly",
    semiannual: "6 Month / Semiannual",
    annual: "Annual",
  };

  return labels[value] || value || "-";
}

function csvEscape(value) {
  const text = String(value || "");
  return `"${text.replace(/"/g, '""')}"`;
}

function uniqueOptions(items, getter) {
  return Array.from(new Set(items.map(getter).filter(Boolean).map(String))).sort();
}

function clampPercent(value) {
  const num = Number(value || 0);
  if (Number.isNaN(num)) return 0;
  if (num < 0) return 0;
  if (num > 100) return 100;
  return num;
}

export default function TimelineScopeClient({ scopeRows = [] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [frequency, setFrequency] = useState("all");

  const deferredSearch = useDeferredValue(search);

  const statusOptions = useMemo(
    () => uniqueOptions(scopeRows, (item) => item.scope_status),
    [scopeRows]
  );

  const frequencyOptions = useMemo(
    () => uniqueOptions(scopeRows, (item) => item.frequency),
    [scopeRows]
  );

  const filteredRows = useMemo(() => {
    const term = normalize(deferredSearch);

    return scopeRows.filter((row) => {
      const searchableText = normalize(
        [
          row.scope_status,
          row.frequency,
          row.system_group,
          row.scope_title,
          row.next_planned_date,
          row.total_schedule,
          row.done_schedule,
          row.overdue_schedule,
          row.progress_percent,
        ].join(" ")
      );

      const matchSearch = !term || searchableText.includes(term);
      const matchStatus = status === "all" || row.scope_status === status;
      const matchFrequency = frequency === "all" || row.frequency === frequency;

      return matchSearch && matchStatus && matchFrequency;
    });
  }, [scopeRows, deferredSearch, status, frequency]);

  function clearFilters() {
    setSearch("");
    setStatus("all");
    setFrequency("all");
  }

  function exportCsv() {
    const headers = [
      "Status",
      "Frequency",
      "System",
      "Scope Item",
      "Requires Photo",
      "Requires Test Result",
      "Total Schedule",
      "Done",
      "Overdue",
      "Next Planned",
      "Progress Percent",
    ];

    const rows = filteredRows.map((row) => [
      row.scope_status,
      row.frequency,
      row.system_group,
      row.scope_title,
      row.requires_photo ? "Required" : "-",
      row.requires_test_result ? "Required" : "-",
      row.total_schedule,
      row.done_schedule,
      row.overdue_schedule,
      row.next_planned_date,
      row.progress_percent,
    ]);

    const csvBody = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\r\n");

    const csv = "\uFEFFsep=,\r\n" + csvBody;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "fire-timeline-scope-progress-excel-ready.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <section style={panelStyle}>
      <div style={sectionHeaderStyle}>
        <div>
          <h2 style={{ margin: 0 }}>Scope Item Progress</h2>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>
            Showing {filteredRows.length} of {scopeRows.length} scope items
          </p>
        </div>

        <div style={actionGroupStyle}>
          <a href="/lab/fire-maintenance/project-setup" style={linkButtonStyle}>
            Project Setup
          </a>
          <a href="/lab/fire-maintenance/schedules" style={linkButtonStyle}>
            Schedule
          </a>
          <a href="/lab/fire-maintenance/scope-mapping" style={linkButtonStyle}>
            Scope Mapping
          </a>
          <a href="/lab/fire-maintenance/reports" style={linkButtonStyle}>
            Reports
          </a>
          <a href="/lab/fire-maintenance/reports/analysis" style={linkButtonStyle}>
            Report Analysis
          </a>
          <button type="button" onClick={exportCsv} style={primaryButtonStyle}>
            Export Excel CSV
          </button>
        </div>
      </div>

      <div style={toolbarStyle}>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search status, frequency, system, scope item..."
          style={inputStyle}
        />

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          style={selectStyle}
        >
          <option value="all">All Status</option>
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {String(option).replaceAll("_", " ")}
            </option>
          ))}
        </select>

        <select
          value={frequency}
          onChange={(event) => setFrequency(event.target.value)}
          style={selectStyle}
        >
          <option value="all">All Frequency</option>
          {frequencyOptions.map((option) => (
            <option key={option} value={option}>
              {frequencyLabel(option)}
            </option>
          ))}
        </select>

        <button type="button" onClick={clearFilters} style={secondaryButtonStyle}>
          Clear
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Frequency</th>
              <th style={thStyle}>System</th>
              <th style={thStyle}>Scope Item</th>
              <th style={thStyle}>Total</th>
              <th style={thStyle}>Done</th>
              <th style={thStyle}>Overdue</th>
              <th style={thStyle}>Next Planned</th>
              <th style={thStyle}>Progress</th>
            </tr>
          </thead>

          <tbody>
            {filteredRows.map((row, index) => (
              <tr key={row.scope_template_id || `${row.scope_title}-${index}`}>
                <td style={tdStyle}>
                  <StatusBadge status={row.scope_status} />
                </td>
                <td style={tdStyle}>{frequencyLabel(row.frequency)}</td>
                <td style={tdStyle}>{row.system_group || "-"}</td>
                <td style={tdStyle}>
                  <strong>{row.scope_title || "-"}</strong>
                  <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
                    Photo: {row.requires_photo ? "Required" : "-"} | Test:{" "}
                    {row.requires_test_result ? "Required" : "-"}
                  </div>
                </td>
                <td style={tdStyle}>{row.total_schedule || 0}</td>
                <td style={tdStyle}>{row.done_schedule || 0}</td>
                <td style={tdStyle}>{row.overdue_schedule || 0}</td>
                <td style={tdStyle}>{formatDate(row.next_planned_date)}</td>
                <td style={tdStyle}>
                  <ProgressBar value={row.progress_percent || 0} />
                </td>
              </tr>
            ))}

            {filteredRows.length === 0 && (
              <tr>
                <td colSpan="9" style={{ ...tdStyle, color: "#64748b" }}>
                  No scope item matches the current search/filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ProgressBar({ value }) {
  const percent = clampPercent(value);

  return (
    <div style={progressStyle}>
      <div style={{ ...progressFillStyle, width: `${percent}%` }} />
      <span style={progressTextStyle}>{percent}%</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const value = normalize(status);
  const style = getStatusStyle(value);

  return (
    <span style={{ ...badgeStyle, background: style.background, color: style.color }}>
      {String(status || "-").replaceAll("_", " ")}
    </span>
  );
}

function getStatusStyle(status) {
  const map = {
    completed: { background: "#dcfce7", color: "#166534" },
    done: { background: "#dcfce7", color: "#166534" },
    "in-progress": { background: "#e0f2fe", color: "#075985" },
    due_soon: { background: "#e0f2fe", color: "#075985" },
    planned: { background: "#f1f5f9", color: "#475569" },
    overdue: { background: "#fee2e2", color: "#991b1b" },
    not_scheduled: { background: "#ffedd5", color: "#9a3412" },
  };

  return map[status] || { background: "#f1f5f9", color: "#475569" };
}

const panelStyle = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  padding: 18,
  marginBottom: 18,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
};

const sectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 16,
  flexWrap: "wrap",
};

const actionGroupStyle = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  justifyContent: "flex-end",
  alignItems: "center",
};

const toolbarStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(260px, 1fr) 180px 180px 100px",
  gap: 10,
  marginBottom: 16,
  alignItems: "center",
};

const inputStyle = {
  width: "100%",
  height: 44,
  padding: "0 14px",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const selectStyle = {
  width: "100%",
  height: 44,
  padding: "0 14px",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "white",
  fontSize: 14,
  boxSizing: "border-box",
};

const primaryButtonStyle = {
  height: 44,
  border: "1px solid #ea580c",
  background: "#ea580c",
  color: "white",
  padding: "0 16px",
  borderRadius: 8,
  fontWeight: 800,
  cursor: "pointer",
  fontSize: 14,
  whiteSpace: "nowrap",
};

const secondaryButtonStyle = {
  height: 44,
  border: "1px solid #cbd5e1",
  background: "white",
  color: "#334155",
  padding: "0 16px",
  borderRadius: 8,
  fontWeight: 800,
  cursor: "pointer",
  fontSize: 14,
};

const linkButtonStyle = {
  height: 44,
  border: "1px solid #cbd5e1",
  background: "white",
  color: "#0369a1",
  padding: "0 16px",
  borderRadius: 8,
  fontWeight: 800,
  textDecoration: "none",
  fontSize: 14,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  whiteSpace: "nowrap",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 14,
};

const thStyle = {
  textAlign: "left",
  padding: "10px",
  background: "#f8fafc",
  borderBottom: "1px solid #e2e8f0",
  color: "#334155",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "10px",
  borderBottom: "1px solid #e2e8f0",
  verticalAlign: "top",
};

const badgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  textTransform: "capitalize",
  whiteSpace: "nowrap",
};

const progressStyle = {
  position: "relative",
  height: 22,
  background: "#e2e8f0",
  borderRadius: 999,
  overflow: "hidden",
  minWidth: 120,
};

const progressFillStyle = {
  position: "absolute",
  left: 0,
  top: 0,
  bottom: 0,
  background: "#ea580c",
};

const progressTextStyle = {
  position: "relative",
  zIndex: 1,
  display: "block",
  textAlign: "center",
  fontSize: 12,
  fontWeight: 900,
  color: "#0f172a",
  lineHeight: "22px",
};