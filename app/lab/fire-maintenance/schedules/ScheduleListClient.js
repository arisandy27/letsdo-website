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

export default function ScheduleListClient({ schedules = [], deleteAction }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [frequency, setFrequency] = useState("all");

  const deferredSearch = useDeferredValue(search);

  const statusOptions = useMemo(
    () => uniqueOptions(schedules, (item) => item.status),
    [schedules]
  );

  const frequencyOptions = useMemo(
    () => uniqueOptions(schedules, (item) => item.frequency),
    [schedules]
  );

  const filteredSchedules = useMemo(() => {
    const term = normalize(deferredSearch);

    return schedules.filter((item) => {
      const searchableText = normalize(
        [
          item.schedule_code,
          item.activity_type,
          item.frequency,
          item.status,
          item.assigned_to,
          item.notes,
          item.planned_date,
          item.actual_date,
          item.fire_assets?.asset_code,
          item.fire_assets?.asset_name,
          item.fire_assets?.asset_type,
          item.fire_assets?.area,
          item.fire_scope_templates?.system_group,
          item.fire_scope_templates?.scope_title,
        ].join(" ")
      );

      const matchSearch = !term || searchableText.includes(term);
      const matchStatus = status === "all" || item.status === status;
      const matchFrequency = frequency === "all" || item.frequency === frequency;

      return matchSearch && matchStatus && matchFrequency;
    });
  }, [schedules, deferredSearch, status, frequency]);

  function clearFilters() {
    setSearch("");
    setStatus("all");
    setFrequency("all");
  }

  function exportCsv() {
    const headers = [
      "Planned Date",
      "Actual Date",
      "Schedule Code",
      "Asset Code",
      "Asset Name",
      "Asset Type",
      "Area",
      "Scope Group",
      "Scope Title",
      "Activity",
      "Frequency",
      "Assigned To",
      "Status",
      "Notes",
    ];

    const rows = filteredSchedules.map((item) => [
      item.planned_date,
      item.actual_date,
      item.schedule_code,
      item.fire_assets?.asset_code,
      item.fire_assets?.asset_name,
      item.fire_assets?.asset_type,
      item.fire_assets?.area,
      item.fire_scope_templates?.system_group,
      item.fire_scope_templates?.scope_title,
      item.activity_type,
      item.frequency,
      item.assigned_to,
      item.status,
      item.notes,
    ]);

    const csvBody = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\r\n");

    const csv = "\uFEFFsep=,\r\n" + csvBody;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "fire-maintenance-schedule-excel-ready.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <section style={panelStyle}>
      <div style={sectionHeaderStyle}>
        <div>
          <h2 style={{ margin: 0 }}>Maintenance Schedule List</h2>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>
            Showing {filteredSchedules.length} of {schedules.length} schedule items
          </p>
        </div>

        <div style={actionGroupStyle}>
          <a href="/lab/fire-maintenance/schedules?new=1" style={primaryButtonStyle}>
            Add Schedule
          </a>
          <a href="/lab/fire-maintenance/data-readiness" style={linkButtonStyle}>
            Data Readiness
          </a>
          <a href="/lab/fire-maintenance/inspections" style={linkButtonStyle}>
            Inspection
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
          placeholder="Search schedule, asset, scope, activity, assigned..."
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
              {option}
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
              <th style={thStyle}>Action</th>
              <th style={thStyle}>Planned</th>
              <th style={thStyle}>Actual</th>
              <th style={thStyle}>Code</th>
              <th style={thStyle}>Asset</th>
              <th style={thStyle}>Scope</th>
              <th style={thStyle}>Activity</th>
              <th style={thStyle}>Frequency</th>
              <th style={thStyle}>Assigned</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Notes</th>
            </tr>
          </thead>

          <tbody>
            {filteredSchedules.map((item) => (
              <tr key={item.id}>
                <td style={tdStyle}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <a href={`/lab/fire-maintenance/schedules?edit=${item.id}`} style={smallLinkStyle}>
                      Edit
                    </a>

                    <form
                      action={deleteAction}
                      onSubmit={(event) => {
                        if (!confirm("Delete this schedule item?")) {
                          event.preventDefault();
                        }
                      }}
                    >
                      <input type="hidden" name="schedule_id" value={item.id} />
                      <button type="submit" style={dangerButtonStyle}>
                        Delete
                      </button>
                    </form>
                  </div>
                </td>

                <td style={tdStyle}>{formatDate(item.planned_date)}</td>
                <td style={tdStyle}>{formatDate(item.actual_date)}</td>
                <td style={tdStyle}>
                  <strong>{formatText(item.schedule_code)}</strong>
                </td>
                <td style={tdStyle}>
                  <strong>{formatText(item.fire_assets?.asset_code)}</strong>
                  <div style={{ color: "#64748b" }}>
                    {formatText(item.fire_assets?.asset_name)}
                  </div>
                </td>
                <td style={tdStyle}>
                  <div>{formatText(item.fire_scope_templates?.system_group)}</div>
                  <div style={{ color: "#64748b" }}>
                    {formatText(item.fire_scope_templates?.scope_title)}
                  </div>
                </td>
                <td style={tdStyle}>{formatText(item.activity_type)}</td>
                <td style={tdStyle}>{formatText(item.frequency)}</td>
                <td style={tdStyle}>{formatText(item.assigned_to)}</td>
                <td style={tdStyle}>
                  <span style={getStatusBadgeStyle(item.status)}>
                    {formatText(item.status)}
                  </span>
                </td>
                <td style={tdStyle}>{formatText(item.notes)}</td>
              </tr>
            ))}

            {filteredSchedules.length === 0 && (
              <tr>
                <td colSpan="11" style={{ ...tdStyle, color: "#64748b" }}>
                  No schedule data matches the current search/filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function getStatusBadgeStyle(status) {
  const value = normalize(status);

  if (value === "done") {
    return { ...badgeStyle, background: "#dcfce7", color: "#166534" };
  }

  if (value === "planned") {
    return { ...badgeStyle, background: "#e0f2fe", color: "#075985" };
  }

  if (value === "overdue") {
    return { ...badgeStyle, background: "#fee2e2", color: "#991b1b" };
  }

  if (value === "cancelled") {
    return { ...badgeStyle, background: "#f1f5f9", color: "#475569" };
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

const smallLinkStyle = {
  border: "1px solid #cbd5e1",
  background: "white",
  color: "#0369a1",
  padding: "6px 10px",
  borderRadius: 8,
  fontWeight: 800,
  textDecoration: "none",
  fontSize: 13,
};

const dangerButtonStyle = {
  border: "1px solid #fecaca",
  background: "#fee2e2",
  color: "#991b1b",
  padding: "6px 10px",
  borderRadius: 8,
  fontWeight: 800,
  cursor: "pointer",
  fontSize: 13,
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