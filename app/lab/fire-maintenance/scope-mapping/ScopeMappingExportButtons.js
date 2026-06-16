"use client";

function csvEscape(value) {
  const text = String(value || "");
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(filename, headers, rows) {
  try {
    const csvBody = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\r\n");

    const csv = "\uFEFFsep=,\r\n" + csvBody;
    const dataUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);

    const link = document.createElement("a");
    link.setAttribute("href", dataUri);
    link.setAttribute("download", filename);
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("CSV export failed:", error);
    window.alert("CSV export failed. Please check browser console.");
  }
}
export default function ScopeMappingExportButtons({
  summary = [],
  details = [],
  projectStatus = "bidding",
  timelineBasis = "working_schedule",
  verifiedMappings = 0,
  draftMappings = 0,
}) {
  function exportSummary() {
    const headers = [
      "Frequency",
      "System Group",
      "Scope Title",
      "Mapped Asset Count",
      "Mapped Assets",
      "Mapping Status",
    ];

    const rows = summary.map((item) => [
      item.frequency,
      item.system_group,
      item.scope_title,
      item.mapped_asset_count,
      item.mapped_assets,
      item.mapping_status,
    ]);

    downloadCsv(
      "fire-scope-mapping-summary-excel-ready.csv",
      headers,
      rows
    );
  }

  function exportDetails() {
    const headers = [
      "Frequency",
      "System Group",
      "Scope Title",
      "Asset Code",
      "Asset Name",
      "Asset Level",
      "Asset Type",
      "Area",
      "Notes",
      "Mapping Source",
      "Validation Status",
      "Asset Verification Status",
      "Data Source",
    ];

    const rows = details.map((item) => [
      item.frequency,
      item.system_group,
      item.scope_title,
      item.asset_code,
      item.asset_name,
      item.asset_level,
      item.asset_type,
      item.area,
      item.notes,
      item.mapping_source,
      item.validation_status,
      item.verification_status,
      item.data_source,
    ]);

    downloadCsv(
      "fire-scope-mapping-detail-excel-ready.csv",
      headers,
      rows
    );
  }

  return (
    <section style={panelStyle}>
      <div style={headerStyle}>
        <div>
          <h2 style={{ margin: 0 }}>Mapping Control Panel</h2>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>
            Project status: <strong>{String(projectStatus).replaceAll("_", " ")}</strong> | Timeline basis:{" "}
            <strong>{String(timelineBasis).replaceAll("_", " ")}</strong>
          </p>
        </div>

        <div style={counterWrapStyle}>
          <span style={counterStyle}>Verified: {verifiedMappings}</span>
          <span style={counterStyle}>Draft: {draftMappings}</span>
          <span style={counterStyle}>Rows: {details.length}</span>
        </div>
      </div>

      <div style={infoBoxStyle}>
        Scope Mapping adalah sumber data untuk schedule generation dan timeline.
        Selama project masih bidding/planning, gunakan Working Schedule. Setelah project deal,
        update status di Project Setup sebelum membuat official schedule.
      </div>

      <div style={buttonWrapStyle}>
        <a href="/lab/fire-maintenance/project-setup" style={linkButtonStyle}>
          Project Setup
        </a>
        <a href="/lab/fire-maintenance/scope" style={linkButtonStyle}>
          Scope Matrix
        </a>
        <a href="/lab/fire-maintenance/timeline" style={linkButtonStyle}>
          Timeline
        </a>
        <a href="/lab/fire-maintenance/schedules" style={linkButtonStyle}>
          Schedule
        </a>
        <a href="/lab/fire-maintenance/reports" style={linkButtonStyle}>
          Reports
        </a>

        <button type="button" onClick={exportSummary} style={secondaryButtonStyle}>
          Export Summary CSV
        </button>

        <button type="button" onClick={exportDetails} style={primaryButtonStyle}>
          Export Detail CSV
        </button>
      </div>
    </section>
  );
}

const panelStyle = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  padding: 18,
  marginBottom: 18,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  alignItems: "flex-start",
  marginBottom: 12,
};

const counterWrapStyle = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const counterStyle = {
  display: "inline-flex",
  alignItems: "center",
  height: 34,
  padding: "0 10px",
  borderRadius: 999,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  color: "#334155",
  fontSize: 13,
  fontWeight: 900,
};

const infoBoxStyle = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 12,
  color: "#475569",
  fontSize: 13,
  lineHeight: 1.5,
  fontWeight: 700,
  marginBottom: 14,
};

const buttonWrapStyle = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const linkButtonStyle = {
  height: 42,
  border: "1px solid #cbd5e1",
  background: "white",
  color: "#0369a1",
  padding: "0 14px",
  borderRadius: 8,
  fontWeight: 900,
  textDecoration: "none",
  fontSize: 14,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  whiteSpace: "nowrap",
};

const primaryButtonStyle = {
  height: 42,
  border: "1px solid #ea580c",
  background: "#ea580c",
  color: "white",
  padding: "0 14px",
  borderRadius: 8,
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 14,
  whiteSpace: "nowrap",
};

const secondaryButtonStyle = {
  height: 42,
  border: "1px solid #cbd5e1",
  background: "white",
  color: "#334155",
  padding: "0 14px",
  borderRadius: 8,
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 14,
  whiteSpace: "nowrap",
};