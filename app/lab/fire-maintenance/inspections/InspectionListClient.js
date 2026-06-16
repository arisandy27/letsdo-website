"use client";

import { useDeferredValue, useMemo, useState } from "react";

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function formatText(value) {
  return value || "-";
}

function formatDate(value) {
  if (!value) return "-";
  const text = String(value);
  if (text.length < 10) return text;
  return `${text.slice(8, 10)}/${text.slice(5, 7)}/${text.slice(0, 4)}`;
}

function csvEscape(value) {
  const text = String(value || "");
  return `"${text.replace(/"/g, '""')}"`;
}

function uniqueOptions(items, getter) {
  return Array.from(new Set(items.map(getter).filter(Boolean).map(String))).sort();
}

function checklistScore(checklist) {
  const values = Object.values(checklist || {});
  if (!values.length) return "-";
  const ok = values.filter(Boolean).length;
  return `${ok}/${values.length}`;
}

export default function InspectionListClient({ inspections = [] }) {
  const [search, setSearch] = useState("");
  const [condition, setCondition] = useState("all");
  const [status, setStatus] = useState("all");

  const deferredSearch = useDeferredValue(search);

  const conditionOptions = useMemo(
    () => uniqueOptions(inspections, (item) => item.overall_condition),
    [inspections]
  );

  const statusOptions = useMemo(
    () => uniqueOptions(inspections, (item) => item.status),
    [inspections]
  );

  const filteredInspections = useMemo(() => {
    const term = normalize(deferredSearch);

    return inspections.filter((item) => {
      const searchableText = normalize(
        [
          item.inspection_date,
          item.inspector_name,
          item.overall_condition,
          item.status,
          item.summary,
          item.fire_assets?.asset_code,
          item.fire_assets?.asset_name,
          item.fire_maintenance_schedules?.schedule_code,
        ].join(" ")
      );

      const matchSearch = !term || searchableText.includes(term);
      const matchCondition =
        condition === "all" || item.overall_condition === condition;
      const matchStatus = status === "all" || item.status === status;

      return matchSearch && matchCondition && matchStatus;
    });
  }, [inspections, deferredSearch, condition, status]);

  function clearFilters() {
    setSearch("");
    setCondition("all");
    setStatus("all");
  }

  function exportCsv() {
    const headers = [
      "Inspection Date",
      "Asset Code",
      "Asset Name",
      "Schedule Code",
      "Inspector",
      "Overall Condition",
      "Checklist Score",
      "Status",
      "Summary",
    ];

    const rows = filteredInspections.map((item) => [
      item.inspection_date,
      item.fire_assets?.asset_code,
      item.fire_assets?.asset_name,
      item.fire_maintenance_schedules?.schedule_code,
      item.inspector_name,
      item.overall_condition,
      checklistScore(item.checklist),
      item.status,
      item.summary,
    ]);

    const csvBody = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\r\n");

    const csv = "\uFEFFsep=,\r\n" + csvBody;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "fire-inspection-records-excel-ready.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <section style={panelStyle}>
      <div style={sectionHeaderStyle}>
        <div>
          <h2 style={{ margin: 0 }}>Inspection Records</h2>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>
            Showing {filteredInspections.length} of {inspections.length} inspection records
          </p>
        </div>

        <div style={actionGroupStyle}>
          <a href="/lab/fire-maintenance/inspections?new=1" style={primaryButtonStyle}>
            Add Inspection
          </a>
          <a href="/lab/fire-maintenance/schedules" style={linkButtonStyle}>
            Schedule
          </a>
          <a href="/lab/fire-maintenance/findings" style={linkButtonStyle}>
            Findings
          </a>
          <a href="/lab/fire-maintenance/evidence" style={linkButtonStyle}>
            Evidence
          </a>
          <a href="/lab/fire-maintenance/reports" style={linkButtonStyle}>
            Reports
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
          placeholder="Search date, asset, schedule, inspector, summary..."
          style={inputStyle}
        />

        <select
          value={condition}
          onChange={(event) => setCondition(event.target.value)}
          style={selectStyle}
        >
          <option value="all">All Condition</option>
          {conditionOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          style={selectStyle}
        >
          <option value="all">All Status</option>
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option}
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
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Asset</th>
              <th style={thStyle}>Schedule</th>
              <th style={thStyle}>Inspector</th>
              <th style={thStyle}>Checklist</th>
              <th style={thStyle}>Condition</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Summary</th>
            </tr>
          </thead>

          <tbody>
            {filteredInspections.map((item) => (
              <tr key={item.id}>
                <td style={tdStyle}>{formatDate(item.inspection_date)}</td>
                <td style={tdStyle}>
                  <strong>{formatText(item.fire_assets?.asset_code)}</strong>
                  <div style={{ color: "#64748b" }}>
                    {formatText(item.fire_assets?.asset_name)}
                  </div>
                </td>
                <td style={tdStyle}>
                  {formatText(item.fire_maintenance_schedules?.schedule_code)}
                </td>
                <td style={tdStyle}>{formatText(item.inspector_name)}</td>
                <td style={tdStyle}>{checklistScore(item.checklist)}</td>
                <td style={tdStyle}>
                  <span style={getConditionBadgeStyle(item.overall_condition)}>
                    {formatText(item.overall_condition)}
                  </span>
                </td>
                <td style={tdStyle}>
                  <span style={getStatusBadgeStyle(item.status)}>
                    {formatText(item.status)}
                  </span>
                </td>
                <td style={tdStyle}>{formatText(item.summary)}</td>
              </tr>
            ))}

            {filteredInspections.length === 0 && (
              <tr>
                <td colSpan="8" style={{ ...tdStyle, color: "#64748b" }}>
                  No inspection data matches the current search/filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function getConditionBadgeStyle(condition) {
  const value = normalize(condition);

  if (value === "good") {
    return { ...badgeStyle, background: "#dcfce7", color: "#166534" };
  }

  if (value === "watch") {
    return { ...badgeStyle, background: "#fef3c7", color: "#92400e" };
  }

  if (value === "fail") {
    return { ...badgeStyle, background: "#fee2e2", color: "#991b1b" };
  }

  return { ...badgeStyle, background: "#f1f5f9", color: "#475569" };
}

function getStatusBadgeStyle(status) {
  const value = normalize(status);

  if (value === "submitted") {
    return { ...badgeStyle, background: "#e0f2fe", color: "#075985" };
  }

  return { ...badgeStyle, background: "#f1f5f9", color: "#475569" };
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
  textDecoration: "none",
  fontSize: 14,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
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

const badgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
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