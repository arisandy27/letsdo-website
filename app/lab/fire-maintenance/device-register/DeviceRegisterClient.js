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

function uniqueOptions(items, key) {
  return Array.from(
    new Set(items.map((item) => item[key]).filter(Boolean))
  ).sort((a, b) => String(a).localeCompare(String(b)));
}

export default function DeviceRegisterClient({ devices = [] }) {
  const [search, setSearch] = useState("");
  const [parentPanel, setParentPanel] = useState("all");
  const [assetType, setAssetType] = useState("all");
  const [area, setArea] = useState("all");

  const deferredSearch = useDeferredValue(search);

  const parentPanelOptions = useMemo(
    () => uniqueOptions(devices, "parent_panel"),
    [devices]
  );

  const assetTypeOptions = useMemo(
    () => uniqueOptions(devices, "asset_type"),
    [devices]
  );

  const areaOptions = useMemo(
    () => uniqueOptions(devices, "area"),
    [devices]
  );

  const filteredDevices = useMemo(() => {
    const term = normalize(deferredSearch);

    return devices.filter((device) => {
      const searchableText = normalize(
        [
          device.tag_no,
          device.asset_code,
          device.asset_name,
          device.asset_type,
          device.device_type_code,
          device.device_signal_type,
          device.area,
          device.location,
          device.parent_panel,
          device.group_no,
          device.device_flow_no,
          device.verification_status,
          device.source_page,
        ].join(" ")
      );

      const matchSearch = !term || searchableText.includes(term);

      const matchParentPanel =
        parentPanel === "all" || device.parent_panel === parentPanel;

      const matchAssetType =
        assetType === "all" || device.asset_type === assetType;

      const matchArea =
        area === "all" || device.area === area;

      return matchSearch && matchParentPanel && matchAssetType && matchArea;
    });
  }, [devices, deferredSearch, parentPanel, assetType, area]);

  function clearFilters() {
    setSearch("");
    setParentPanel("all");
    setAssetType("all");
    setArea("all");
  }

  function exportCsv() {
    const headers = [
      "Tag No",
      "Asset Code",
      "Asset Name",
      "Parent Panel",
      "Group No",
      "Flow No",
      "Area",
      "Location",
      "Device Type Code",
      "Device Signal Type",
      "Asset Type",
      "Verification Status",
      "Source Page",
      "Source Document",
    ];

    const rows = filteredDevices.map((device) => [
      device.tag_no,
      device.asset_code,
      device.asset_name,
      device.parent_panel,
      device.group_no,
      device.device_flow_no,
      device.area,
      device.location,
      device.device_type_code,
      device.device_signal_type,
      device.asset_type,
      device.verification_status,
      device.source_page,
      device.source_document,
    ]);

    const csvBody = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\r\n");

    const csv = "\uFEFFsep=,\r\n" + csvBody;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "fire-device-register-excel-ready.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <section style={panelStyle}>
      <div style={sectionHeaderStyle}>
        <div>
          <h2 style={{ margin: 0 }}>Device / Tag List</h2>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>
            Showing {filteredDevices.length} of {devices.length} device/tag records
          </p>
        </div>

        <div style={actionGroupStyle}>
          <a href="/lab/fire-maintenance/protection-zones" style={linkButtonStyle}>
            Protection Zones
          </a>
          <a href="/lab/fire-maintenance/asset-register" style={linkButtonStyle}>
            Asset Register
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
          placeholder="Search tag, area, panel, device type..."
          style={inputStyle}
        />

        <select
          value={parentPanel}
          onChange={(event) => setParentPanel(event.target.value)}
          style={selectStyle}
        >
          <option value="all">All Panels</option>
          {parentPanelOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          value={assetType}
          onChange={(event) => setAssetType(event.target.value)}
          style={selectStyle}
        >
          <option value="all">All Device Types</option>
          {assetTypeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          value={area}
          onChange={(event) => setArea(event.target.value)}
          style={selectStyle}
        >
          <option value="all">All Areas</option>
          {areaOptions.map((option) => (
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
              <th style={thStyle}>Tag No</th>
              <th style={thStyle}>Parent Panel</th>
              <th style={thStyle}>Group / Flow</th>
              <th style={thStyle}>Area</th>
              <th style={thStyle}>Location</th>
              <th style={thStyle}>Device Type Code</th>
              <th style={thStyle}>Device / Signal Type</th>
              <th style={thStyle}>Verification</th>
              <th style={thStyle}>Source</th>
            </tr>
          </thead>
          <tbody>
            {filteredDevices.map((device) => (
              <tr key={device.id}>
                <td style={tdStyle}>
                  <strong>{formatText(device.tag_no)}</strong>
                  <div style={{ color: "#64748b" }}>{formatText(device.asset_code)}</div>
                </td>
                <td style={tdStyle}>{formatText(device.parent_panel)}</td>
                <td style={tdStyle}>
                  <div>Group: {formatText(device.group_no)}</div>
                  <div>Flow: {formatText(device.device_flow_no)}</div>
                </td>
                <td style={tdStyle}>{formatText(device.area)}</td>
                <td style={tdStyle}>{formatText(device.location)}</td>
                <td style={tdStyle}>{formatText(device.device_type_code)}</td>
                <td style={tdStyle}>
                  <strong>{formatText(device.device_signal_type)}</strong>
                  <div style={{ color: "#64748b" }}>{formatText(device.asset_type)}</div>
                </td>
                <td style={tdStyle}>
                  <span style={getBadgeStyle(device.verification_status)}>
                    {formatText(device.verification_status || "draft")}
                  </span>
                </td>
                <td style={tdStyle}>
                  <div>{formatText(device.source_page)}</div>
                  <div style={{ color: "#64748b" }}>
                    {device.source_document ? "O&M Manual" : "-"}
                  </div>
                </td>
              </tr>
            ))}

            {filteredDevices.length === 0 && (
              <tr>
                <td colSpan="9" style={{ ...tdStyle, color: "#64748b" }}>
                  No device/tag data matches the current search/filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function getBadgeStyle(status) {
  const value = String(status || "draft");

  if (value === "site_verified") {
    return {
      ...badgeStyle,
      background: "#dcfce7",
      color: "#166534",
    };
  }

  if (value === "documented") {
    return {
      ...badgeStyle,
      background: "#e0f2fe",
      color: "#075985",
    };
  }

  return {
    ...badgeStyle,
    background: "#f1f5f9",
    color: "#475569",
  };
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
  gridTemplateColumns: "minmax(260px, 1fr) 180px 220px 180px 100px",
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