"use client";

import { useDeferredValue, useMemo, useState } from "react";

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function csvEscape(value) {
  const text = String(value || "");
  return `"${text.replace(/"/g, '""')}"`;
}

export default function DataReadinessClient({ readinessItems = [] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const deferredSearch = useDeferredValue(search);

  const filteredItems = useMemo(() => {
    const term = normalize(deferredSearch);

    return readinessItems.filter((item) => {
      const searchableText = normalize(
        [item.label, item.value, item.status, item.note].join(" ")
      );

      const matchSearch = !term || searchableText.includes(term);
      const matchStatus = status === "all" || item.status === status;

      return matchSearch && matchStatus;
    });
  }, [readinessItems, deferredSearch, status]);

  const statusCounts = useMemo(() => {
    return readinessItems.reduce(
      (acc, item) => {
        const key = item.status || "unknown";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {}
    );
  }, [readinessItems]);

  function clearFilters() {
    setSearch("");
    setStatus("all");
  }

  function exportCsv() {
    const headers = ["Readiness Item", "Value", "Status", "Note"];

    const rows = filteredItems.map((item) => [
      item.label,
      item.value,
      item.status,
      item.note,
    ]);

    const csvBody = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\r\n");

    const csv = "\uFEFFsep=,\r\n" + csvBody;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "fire-data-readiness-excel-ready.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <section style={panelStyle}>
      <div style={sectionHeaderStyle}>
        <div>
          <h2 style={{ margin: 0 }}>Readiness Checklist</h2>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>
            Showing {filteredItems.length} of {readinessItems.length} readiness items
          </p>
        </div>

        <div style={actionGroupStyle}>
          <a href="/lab/fire-maintenance/asset-verification" style={linkButtonStyle}>
            Asset Verification
          </a>
          <a href="/lab/fire-maintenance/scope-mapping" style={linkButtonStyle}>
            Scope Mapping
          </a>
          <a href="/lab/fire-maintenance/schedules" style={linkButtonStyle}>
            Schedule
          </a>
          <a href="/lab/fire-maintenance/reports" style={linkButtonStyle}>
            Reports
          </a>
          <button type="button" onClick={exportCsv} style={primaryButtonStyle}>
            Export Excel CSV
          </button>
        </div>
      </div>

      <div style={statusSummaryStyle}>
        <StatusPill label="Ready" value={statusCounts.ready || 0} status="ready" />
        <StatusPill label="Partial" value={statusCounts.partial || 0} status="partial" />
        <StatusPill label="Pending" value={statusCounts.pending || 0} status="pending" />
        <StatusPill label="Missing" value={statusCounts.missing || 0} status="missing" />
      </div>

      <div style={toolbarStyle}>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search readiness item, status, note..."
          style={inputStyle}
        />

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          style={selectStyle}
        >
          <option value="all">All Status</option>
          <option value="ready">Ready</option>
          <option value="partial">Partial</option>
          <option value="pending">Pending</option>
          <option value="missing">Missing</option>
        </select>

        <button type="button" onClick={clearFilters} style={secondaryButtonStyle}>
          Clear
        </button>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {filteredItems.map((item) => (
          <div key={item.label} style={checkRowStyle}>
            <div>
              <strong style={{ color: "#0f172a" }}>{item.label}</strong>
              <div style={{ color: "#64748b", marginTop: 4 }}>{item.note}</div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 950, color: "#0f172a" }}>{item.value}</div>
              <StatusBadge status={item.status} />
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div style={emptyStyle}>No readiness item matches the current filter.</div>
        )}
      </div>
    </section>
  );
}

function StatusPill({ label, value, status }) {
  const style = getStatusStyle(status);

  return (
    <div style={{ ...statusPillStyle, background: style.background, color: style.color }}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusBadge({ status }) {
  const style = getStatusStyle(status);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 6,
        background: style.background,
        color: style.color,
        padding: "5px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 900,
        textTransform: "capitalize",
      }}
    >
      {status}
    </span>
  );
}

function getStatusStyle(status) {
  const map = {
    ready: { background: "#dcfce7", color: "#166534" },
    partial: { background: "#e0f2fe", color: "#075985" },
    pending: { background: "#fef3c7", color: "#92400e" },
    missing: { background: "#fee2e2", color: "#991b1b" },
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

const statusSummaryStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 10,
  marginBottom: 16,
};

const statusPillStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: "10px 12px",
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 900,
};

const toolbarStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(260px, 1fr) 180px 100px",
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
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  whiteSpace: "nowrap",
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
  boxSizing: "border-box",
  whiteSpace: "nowrap",
};

const checkRowStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 220px",
  gap: 16,
  padding: 14,
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  background: "#f8fafc",
};

const emptyStyle = {
  padding: 14,
  border: "1px dashed #cbd5e1",
  borderRadius: 14,
  color: "#64748b",
  background: "#f8fafc",
};