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

export default function EvidenceListClient({ attachments = [] }) {
  const [search, setSearch] = useState("");
  const [evidenceType, setEvidenceType] = useState("all");
  const [referenceType, setReferenceType] = useState("all");

  const deferredSearch = useDeferredValue(search);

  const evidenceTypeOptions = useMemo(
    () => uniqueOptions(attachments, (item) => item.evidence_type),
    [attachments]
  );

  const referenceTypeOptions = useMemo(
    () => uniqueOptions(attachments, (item) => item.reference_type),
    [attachments]
  );

  const filteredAttachments = useMemo(() => {
    const term = normalize(deferredSearch);

    return attachments.filter((item) => {
      const searchableText = normalize(
        [
          item.title,
          item.description,
          item.file_name,
          item.file_url,
          item.file_path,
          item.uploaded_by,
          item.reference_type,
          item.evidence_type,
          item.report_type,
          item.report_month,
          item.created_at,
        ].join(" ")
      );

      const matchSearch = !term || searchableText.includes(term);
      const matchEvidenceType =
        evidenceType === "all" || item.evidence_type === evidenceType;
      const matchReferenceType =
        referenceType === "all" || item.reference_type === referenceType;

      return matchSearch && matchEvidenceType && matchReferenceType;
    });
  }, [attachments, deferredSearch, evidenceType, referenceType]);

  function clearFilters() {
    setSearch("");
    setEvidenceType("all");
    setReferenceType("all");
  }

  function exportCsv() {
    const headers = [
      "Title",
      "Reference Type",
      "Evidence Type",
      "Report Type",
      "Report Month",
      "File Name",
      "File URL",
      "File Path",
      "Uploaded By",
      "Created At",
      "Description",
    ];

    const rows = filteredAttachments.map((item) => [
      item.title,
      item.reference_type,
      item.evidence_type,
      item.report_type,
      item.report_month,
      item.file_name,
      item.file_url,
      item.file_path,
      item.uploaded_by,
      item.created_at,
      item.description,
    ]);

    const csvBody = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\r\n");

    const csv = "\uFEFFsep=,\r\n" + csvBody;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "fire-evidence-register-excel-ready.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <section style={panelStyle}>
      <div style={sectionHeaderStyle}>
        <div>
          <h2 style={{ margin: 0 }}>Evidence List</h2>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>
            Showing {filteredAttachments.length} of {attachments.length} evidence records
          </p>
        </div>

        <div style={actionGroupStyle}>
          <a href="/lab/fire-maintenance/evidence?new=1" style={primaryButtonStyle}>
            Add Evidence
          </a>
          <a href="/lab/fire-maintenance/inspections" style={linkButtonStyle}>
            Inspection
          </a>
          <a href="/lab/fire-maintenance/findings" style={linkButtonStyle}>
            Findings
          </a>
          <a href="/lab/fire-maintenance/training" style={linkButtonStyle}>
            Training
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
          placeholder="Search title, file, uploader, description..."
          style={inputStyle}
        />

        <select
          value={evidenceType}
          onChange={(event) => setEvidenceType(event.target.value)}
          style={selectStyle}
        >
          <option value="all">All Evidence Type</option>
          {evidenceTypeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          value={referenceType}
          onChange={(event) => setReferenceType(event.target.value)}
          style={selectStyle}
        >
          <option value="all">All Reference Type</option>
          {referenceTypeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <button type="button" onClick={clearFilters} style={secondaryButtonStyle}>
          Clear
        </button>
      </div>

      <div style={evidenceListStyle}>
        {filteredAttachments.map((item) => (
          <div style={evidenceCardStyle} key={item.id}>
            <div style={evidenceTopStyle}>
              <div>
                <strong style={{ color: "#ea580c" }}>{formatText(item.title)}</strong>
                <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
                  Ref: {formatText(item.reference_type)} | Report: {formatText(item.report_type)} | Month: {formatMonth(item.report_month)}
                </div>
              </div>

              <span style={getEvidenceBadgeStyle(item.evidence_type)}>
                {formatText(item.evidence_type)}
              </span>
            </div>

            <div style={evidenceMetaStyle}>File: {formatText(item.file_name)}</div>

            {item.signed_url && (
              <a style={fileLinkStyle} href={item.signed_url} target="_blank" rel="noreferrer">
                Open File
              </a>
            )}

            {item.file_path && (
              <div style={filePathStyle}>Path: {item.file_path}</div>
            )}

            <div style={evidenceDescStyle}>{formatText(item.description)}</div>

            <div style={evidenceMetaStyle}>
              Uploaded by: {formatText(item.uploaded_by)} | {formatDate(item.created_at)}
            </div>
          </div>
        ))}

        {filteredAttachments.length === 0 && (
          <div style={emptyStyle}>No evidence data matches the current search/filter.</div>
        )}
      </div>
    </section>
  );
}

function getEvidenceBadgeStyle(type) {
  const value = normalize(type);

  if (value === "photo") {
    return { ...badgeStyle, background: "#eff6ff", color: "#1d4ed8" };
  }

  if (value === "test_result") {
    return { ...badgeStyle, background: "#ecfdf5", color: "#047857" };
  }

  if (value === "signed_report" || value === "document") {
    return { ...badgeStyle, background: "#fff7ed", color: "#c2410c" };
  }

  if (value === "attendance") {
    return { ...badgeStyle, background: "#fefce8", color: "#a16207" };
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
  gridTemplateColumns: "minmax(260px, 1fr) 220px 220px 100px",
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

const evidenceListStyle = {
  display: "grid",
  gap: 12,
};

const evidenceCardStyle = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 14,
};

const evidenceTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 10,
};

const evidenceMetaStyle = {
  color: "#64748b",
  fontSize: 13,
  lineHeight: 1.5,
  marginBottom: 6,
};

const evidenceDescStyle = {
  color: "#334155",
  fontSize: 13,
  lineHeight: 1.5,
  marginTop: 8,
  marginBottom: 8,
};

const filePathStyle = {
  color: "#64748b",
  fontSize: 12,
  lineHeight: 1.5,
  marginBottom: 6,
  wordBreak: "break-all",
};

const fileLinkStyle = {
  display: "inline-flex",
  marginBottom: 8,
  color: "#047857",
  fontWeight: 900,
  textDecoration: "none",
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