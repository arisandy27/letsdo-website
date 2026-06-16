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

export default function FindingListClient({ findings = [], updateAction }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [severity, setSeverity] = useState("all");

  const deferredSearch = useDeferredValue(search);

  const statusOptions = useMemo(
    () => uniqueOptions(findings, (item) => item.status),
    [findings]
  );

  const severityOptions = useMemo(
    () => uniqueOptions(findings, (item) => item.severity),
    [findings]
  );

  const filteredFindings = useMemo(() => {
    const term = normalize(deferredSearch);

    return findings.filter((item) => {
      const searchableText = normalize(
        [
          item.finding_no,
          item.finding_date,
          item.finding_type,
          item.severity,
          item.status,
          item.description,
          item.corrective_action,
          item.pic,
          item.due_date,
          item.fire_assets?.asset_code,
          item.fire_assets?.asset_name,
          item.fire_assets?.asset_type,
          item.fire_assets?.area,
        ].join(" ")
      );

      const matchSearch = !term || searchableText.includes(term);
      const matchStatus = status === "all" || item.status === status;
      const matchSeverity = severity === "all" || item.severity === severity;

      return matchSearch && matchStatus && matchSeverity;
    });
  }, [findings, deferredSearch, status, severity]);

  function clearFilters() {
    setSearch("");
    setStatus("all");
    setSeverity("all");
  }

  function exportCsv() {
    const headers = [
      "Finding No",
      "Finding Date",
      "Asset Code",
      "Asset Name",
      "Finding Type",
      "Severity",
      "Description",
      "Corrective Action",
      "PIC",
      "Due Date",
      "Status",
      "Closed At",
    ];

    const rows = filteredFindings.map((item) => [
      item.finding_no,
      item.finding_date,
      item.fire_assets?.asset_code,
      item.fire_assets?.asset_name,
      item.finding_type,
      item.severity,
      item.description,
      item.corrective_action,
      item.pic,
      item.due_date,
      item.status,
      item.closed_at,
    ]);

    const csvBody = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\r\n");

    const csv = "\uFEFFsep=,\r\n" + csvBody;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "fire-findings-action-tracker-excel-ready.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <section style={panelStyle}>
      <div style={sectionHeaderStyle}>
        <div>
          <h2 style={{ margin: 0 }}>Finding List</h2>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>
            Showing {filteredFindings.length} of {findings.length} findings
          </p>
        </div>

        <div style={actionGroupStyle}>
          <a href="/lab/fire-maintenance/findings?new=1" style={primaryButtonStyle}>
            Add Finding
          </a>
          <a href="/lab/fire-maintenance/inspections" style={linkButtonStyle}>
            Inspection
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
          placeholder="Search finding no, asset, PIC, description, action..."
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
          value={severity}
          onChange={(event) => setSeverity(event.target.value)}
          style={selectStyle}
        >
          <option value="all">All Severity</option>
          {severityOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <button type="button" onClick={clearFilters} style={secondaryButtonStyle}>
          Clear
        </button>
      </div>

      <div style={findingListStyle}>
        {filteredFindings.map((item) => (
          <div style={findingCardStyle} key={item.id}>
            <div style={findingTopStyle}>
              <div>
                <strong style={{ color: "#ea580c" }}>
                  {formatText(item.finding_no)}
                </strong>
                <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
                  {formatDate(item.finding_date)} | Due: {formatDate(item.due_date)}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <span style={getSeverityBadgeStyle(item.severity)}>
                  {formatText(item.severity)}
                </span>
                <span style={getStatusBadgeStyle(item.status)}>
                  {formatText(item.status)}
                </span>
              </div>
            </div>

            <div style={findingTitleStyle}>{formatText(item.description)}</div>

            <div style={findingMetaStyle}>
              Asset: {formatText(item.fire_assets?.asset_code)} - {formatText(item.fire_assets?.asset_name)}
            </div>

            <div style={findingMetaStyle}>
              PIC: {formatText(item.pic)} | Type: {formatText(item.finding_type)}
            </div>

            <div style={findingActionStyle}>
              Action: {formatText(item.corrective_action)}
            </div>

            <div style={footerStyle}>
              {item.status !== "in_progress" && item.status !== "closed" && (
                <form action={updateAction}>
                  <input type="hidden" name="finding_id" value={item.id} />
                  <input type="hidden" name="status" value="in_progress" />
                  <button type="submit" style={darkButtonStyle}>
                    Set In Progress
                  </button>
                </form>
              )}

              {item.status !== "closed" && (
                <form action={updateAction}>
                  <input type="hidden" name="finding_id" value={item.id} />
                  <input type="hidden" name="status" value="closed" />
                  <button type="submit" style={smallButtonStyle}>
                    Close
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}

        {filteredFindings.length === 0 && (
          <div style={emptyStyle}>No finding data matches the current search/filter.</div>
        )}
      </div>
    </section>
  );
}

function getSeverityBadgeStyle(severity) {
  const value = normalize(severity);

  if (value === "critical") {
    return { ...badgeStyle, background: "#fee2e2", color: "#991b1b" };
  }

  if (value === "high") {
    return { ...badgeStyle, background: "#fff7ed", color: "#c2410c" };
  }

  if (value === "medium") {
    return { ...badgeStyle, background: "#eff6ff", color: "#1d4ed8" };
  }

  if (value === "low") {
    return { ...badgeStyle, background: "#ecfdf5", color: "#047857" };
  }

  return { ...badgeStyle, background: "#f1f5f9", color: "#475569" };
}

function getStatusBadgeStyle(status) {
  const value = normalize(status);

  if (value === "closed") {
    return { ...badgeStyle, background: "#ecfdf5", color: "#047857" };
  }

  if (value === "in_progress") {
    return { ...badgeStyle, background: "#eff6ff", color: "#1d4ed8" };
  }

  if (value === "open") {
    return { ...badgeStyle, background: "#fff7ed", color: "#c2410c" };
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

const findingListStyle = {
  display: "grid",
  gap: 12,
};

const findingCardStyle = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 14,
};

const findingTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 10,
};

const findingTitleStyle = {
  fontWeight: 900,
  color: "#0f172a",
  marginBottom: 8,
};

const findingMetaStyle = {
  color: "#64748b",
  fontSize: 13,
  lineHeight: 1.5,
  marginBottom: 6,
};

const findingActionStyle = {
  color: "#334155",
  fontSize: 13,
  lineHeight: 1.5,
  marginTop: 8,
};

const footerStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
  marginTop: 12,
};

const smallButtonStyle = {
  border: "none",
  background: "#ea580c",
  color: "white",
  fontWeight: 900,
  borderRadius: 8,
  padding: "7px 10px",
  cursor: "pointer",
  fontSize: 12,
};

const darkButtonStyle = {
  ...smallButtonStyle,
  background: "#0f172a",
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