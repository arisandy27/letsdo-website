"use client";

import { useDeferredValue, useMemo, useState } from "react";

function formatText(value) {
  return value || "-";
}

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function csvEscape(value) {
  const text = String(value || "");
  return `"${text.replace(/"/g, '""')}"`;
}

export default function ProtectionZonesClient({ zones = [] }) {
  const [search, setSearch] = useState("");
  const [criticality, setCriticality] = useState("all");
  const [protectionType, setProtectionType] = useState("all");

  const deferredSearch = useDeferredValue(search);

  const protectionOptions = useMemo(() => {
    return Array.from(
      new Set(zones.map((zone) => zone.fire_protection_type).filter(Boolean))
    ).sort();
  }, [zones]);

  const filteredZones = useMemo(() => {
    const term = normalize(deferredSearch);

    return zones.filter((zone) => {
      const searchableText = normalize(
        [
          zone.asset_code,
          zone.zone_no,
          zone.asset_name,
          zone.asset_type,
          zone.area,
          zone.location,
          zone.fire_protection_type,
          zone.fire_detection_type,
          zone.actuation_type,
          zone.source_page,
        ].join(" ")
      );

      const matchSearch = !term || searchableText.includes(term);

      const matchCriticality =
        criticality === "all" ||
        normalize(zone.criticality) === normalize(criticality);

      const matchProtection =
        protectionType === "all" ||
        zone.fire_protection_type === protectionType;

      return matchSearch && matchCriticality && matchProtection;
    });
  }, [zones, deferredSearch, criticality, protectionType]);

  function clearFilters() {
    setSearch("");
    setCriticality("all");
    setProtectionType("all");
  }

  function exportCsv() {
    const headers = [
      "Code",
      "Zone No",
      "Asset Name",
      "Asset Type",
      "Area",
      "Location",
      "Fire Protection",
      "Fire Detection",
      "Actuation",
      "Criticality",
      "Source",
    ];

    const rows = filteredZones.map((zone) => [
      zone.asset_code,
      zone.zone_no,
      zone.asset_name,
      zone.asset_type,
      zone.area,
      zone.location,
      zone.fire_protection_type,
      zone.fire_detection_type,
      zone.actuation_type,
      zone.criticality,
      zone.source_page,
    ]);

    const csvBody = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\r\n");

    const csv = "\uFEFFsep=,\r\n" + csvBody;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "fire-protection-zones-excel-ready.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <section style={panelStyle}>
      <div style={sectionHeaderStyle}>
        <div>
          <h2 style={{ margin: 0 }}>Protection Zone List</h2>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>
            Showing {filteredZones.length} of {zones.length} coverage items
          </p>
        </div>

        <div style={actionGroupStyle}>
          <a href="/lab/fire-maintenance/asset-register" style={linkButtonStyle}>
            Asset Register
          </a>
          <a href="/lab/fire-maintenance/device-register" style={linkButtonStyle}>
            Device Register
          </a>
          <button type="button" onClick={exportCsv} style={primaryButtonStyle}>
            Export CSV
          </button>
        </div>
      </div>

      <div style={toolbarStyle}>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search zone, area, location, protection, detection..."
          style={inputStyle}
        />

        <select
          value={criticality}
          onChange={(event) => setCriticality(event.target.value)}
          style={selectStyle}
        >
          <option value="all">All Criticality</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          value={protectionType}
          onChange={(event) => setProtectionType(event.target.value)}
          style={selectStyle}
        >
          <option value="all">All Protection Type</option>
          {protectionOptions.map((option) => (
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
              <th style={thStyle}>Code</th>
              <th style={thStyle}>Zone / Asset Name</th>
              <th style={thStyle}>Area</th>
              <th style={thStyle}>Location</th>
              <th style={thStyle}>Fire Protection</th>
              <th style={thStyle}>Fire Detection</th>
              <th style={thStyle}>Actuation</th>
              <th style={thStyle}>Source</th>
            </tr>
          </thead>
          <tbody>
            {filteredZones.map((zone) => (
              <tr key={zone.id}>
                <td style={tdStyle}>
                  <strong>{formatText(zone.asset_code)}</strong>
                  <div style={{ color: "#64748b" }}>Zone {formatText(zone.zone_no)}</div>
                </td>
                <td style={tdStyle}>
                  <strong>{formatText(zone.asset_name)}</strong>
                  <div style={{ color: "#64748b" }}>{formatText(zone.asset_type)}</div>
                </td>
                <td style={tdStyle}>{formatText(zone.area)}</td>
                <td style={tdStyle}>{formatText(zone.location)}</td>
                <td style={tdStyle}>{formatText(zone.fire_protection_type)}</td>
                <td style={tdStyle}>{formatText(zone.fire_detection_type)}</td>
                <td style={tdStyle}>{formatText(zone.actuation_type)}</td>
                <td style={tdStyle}>{formatText(zone.source_page)}</td>
              </tr>
            ))}

            {filteredZones.length === 0 && (
              <tr>
                <td colSpan="8" style={{ ...tdStyle, color: "#64748b" }}>
                  No protection zone data found for current search/filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
  gridTemplateColumns: "minmax(260px, 1fr) 180px 260px 100px",
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
