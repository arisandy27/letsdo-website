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

function formatMonth(value) {
  if (!value) return "-";
  const text = String(value);
  if (text.length < 7) return text;
  return `${text.slice(5, 7)}/${text.slice(0, 4)}`;
}

function csvEscape(value) {
  const text = String(value || "");
  return `"${text.replace(/"/g, '""')}"`;
}

function uniqueOptions(items, getter) {
  return Array.from(new Set(items.map(getter).filter(Boolean).map(String))).sort();
}

export default function ReportListClient({ reports = [], deleteAction }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const deferredSearch = useDeferredValue(search);

  const statusOptions = useMemo(
    () => uniqueOptions(reports, (item) => item.status),
    [reports]
  );

  const filteredReports = useMemo(() => {
    const term = normalize(deferredSearch);

    return reports.filter((item) => {
      const searchableText = normalize(
        [
          item.report_month,
          item.visit_date,
          item.prepared_by,
          item.status,
          item.summary,
          item.open_findings_count,
          item.submitted_at,
        ].join(" ")
      );

      const matchSearch = !term || searchableText.includes(term);
      const matchStatus = status === "all" || item.status === status;

      return matchSearch && matchStatus;
    });
  }, [reports, deferredSearch, status]);

  function clearFilters() {
    setSearch("");
    setStatus("all");
  }

  function exportCsv() {
    const headers = [
      "Report Month",
      "Visit Date",
      "Prepared By",
      "Status",
      "Open Findings Count",
      "Submitted At",
      "Summary",
    ];

    const rows = filteredReports.map((item) => [
      item.report_month,
      item.visit_date,
      item.prepared_by,
      item.status,
      item.open_findings_count,
      item.submitted_at,
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
    link.download = "fire-monthly-report-register-excel-ready.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <section style={panelStyle}>
      <div style={sectionHeaderStyle}>
        <div>
          <h2 style={{ margin: 0 }}>Report History</h2>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>
            Showing {filteredReports.length} of {reports.length} reports
          </p>
        </div>

        <div style={actionGroupStyle}>
          <a href="/lab/fire-maintenance/reports?new=1" style={primaryButtonStyle}>
            Add Report
          </a>
          <a href="/lab/fire-maintenance/reports/print?type=monthly" style={linkButtonStyle}>
            Print Monthly
          </a>
          <a href="/lab/fire-maintenance/reports/print?type=quarterly" style={linkButtonStyle}>
            Print 3 Month
          </a>
          <a href="/lab/fire-maintenance/reports/print?type=semester" style={linkButtonStyle}>
            Print 6 Month
          </a>
          <a href="/lab/fire-maintenance/reports/print?type=annual" style={linkButtonStyle}>
            Print Annual
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
          placeholder="Search month, visit date, prepared by, summary..."
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

        <button type="button" onClick={clearFilters} style={secondaryButtonStyle}>
          Clear
        </button>
      </div>

      <div style={reportListStyle}>
        {filteredReports.map((report) => (
          <div style={reportCardStyle} key={report.id}>
            <div style={reportTopStyle}>
              <div>
                <strong style={{ color: "#ea580c" }}>
                  {formatMonth(report.report_month)}
                </strong>
                <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
                  Visit: {formatDate(report.visit_date)} | Prepared by: {formatText(report.prepared_by)}
                </div>
              </div>

              <span style={getStatusBadgeStyle(report.status)}>
                {formatText(report.status)}
              </span>
            </div>

            <div style={reportSummaryStyle}>{formatText(report.summary)}</div>

            <div style={reportMetaStyle}>
              Open findings at report time: {report.open_findings_count || 0}
            </div>

            <div style={actionRowStyle}>
              <a href={`/lab/fire-maintenance/reports?edit=${report.id}`} style={smallLinkStyle}>
                Edit
              </a>

              <form
                action={deleteAction}
                onSubmit={(event) => {
                  if (!confirm("Delete this monthly report?")) {
                    event.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="report_id" value={report.id} />
                <button type="submit" style={dangerButtonStyle}>
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))}

        {filteredReports.length === 0 && (
          <div style={emptyStyle}>No report data matches the current search/filter.</div>
        )}
      </div>
    </section>
  );
}

function getStatusBadgeStyle(status) {
  const value = normalize(status);

  if (value === "submitted") {
    return { ...badgeStyle, background: "#ecfdf5", color: "#047857" };
  }

  if (value === "draft") {
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

const reportListStyle = {
  display: "grid",
  gap: 12,
};

const reportCardStyle = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 14,
};

const reportTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 10,
};

const reportSummaryStyle = {
  color: "#334155",
  fontSize: 13,
  lineHeight: 1.5,
  marginBottom: 8,
};

const reportMetaStyle = {
  color: "#64748b",
  fontSize: 13,
  lineHeight: 1.5,
  marginBottom: 6,
};

const actionRowStyle = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginTop: 12,
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
  textTransform: "capitalize",
  whiteSpace: "nowrap",
};

const emptyStyle = {
  padding: 14,
  border: "1px dashed #cbd5e1",
  borderRadius: 14,
  color: "#64748b",
  background: "#f8fafc",
};