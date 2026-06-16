"use client";

import { useDeferredValue, useMemo, useState } from "react";

function formatText(value) {
  return value || "-";
}

function normalize(value) {
  return String(value || "").toLowerCase().trim();
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

function uniqueOptions(items, key) {
  return Array.from(
    new Set(items.map((item) => item[key]).filter(Boolean).map(String))
  ).sort((a, b) => a.localeCompare(b));
}

export default function EquipmentAssetListClient({ assets = [], deleteAction }) {
  const [search, setSearch] = useState("");
  const [assetType, setAssetType] = useState("all");
  const [status, setStatus] = useState("all");
  const [criticality, setCriticality] = useState("all");

  const deferredSearch = useDeferredValue(search);

  const assetTypeOptions = useMemo(() => uniqueOptions(assets, "asset_type"), [assets]);
  const statusOptions = useMemo(() => uniqueOptions(assets, "status"), [assets]);
  const criticalityOptions = useMemo(() => uniqueOptions(assets, "criticality"), [assets]);

  const filteredAssets = useMemo(() => {
    const term = normalize(deferredSearch);

    return assets.filter((asset) => {
      const searchableText = normalize(
        [
          asset.asset_code,
          asset.asset_name,
          asset.asset_type,
          asset.area,
          asset.location,
          asset.manufacturer,
          asset.model,
          asset.serial_no,
          asset.status,
          asset.criticality,
          asset.notes,
        ].join(" ")
      );

      const matchSearch = !term || searchableText.includes(term);
      const matchType = assetType === "all" || asset.asset_type === assetType;
      const matchStatus = status === "all" || asset.status === status;
      const matchCriticality =
        criticality === "all" || asset.criticality === criticality;

      return matchSearch && matchType && matchStatus && matchCriticality;
    });
  }, [assets, deferredSearch, assetType, status, criticality]);

  function clearFilters() {
    setSearch("");
    setAssetType("all");
    setStatus("all");
    setCriticality("all");
  }

  function exportCsv() {
    const headers = [
      "Asset Code",
      "Asset Name",
      "Asset Type",
      "Area",
      "Location",
      "Manufacturer",
      "Model",
      "Serial No",
      "Criticality",
      "Status",
      "Last Inspection Date",
      "Next Inspection Date",
      "Notes",
    ];

    const rows = filteredAssets.map((asset) => [
      asset.asset_code,
      asset.asset_name,
      asset.asset_type,
      asset.area,
      asset.location,
      asset.manufacturer,
      asset.model,
      asset.serial_no,
      asset.criticality,
      asset.status,
      asset.last_inspection_date,
      asset.next_inspection_date,
      asset.notes,
    ]);

    const csvBody = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\r\n");

    const csv = "\uFEFFsep=,\r\n" + csvBody;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "fire-equipment-register-excel-ready.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <section style={panelStyle}>
      <div style={sectionHeaderStyle}>
        <div>
          <h2 style={{ margin: 0 }}>Fire Protection Equipment List</h2>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>
            Showing {filteredAssets.length} of {assets.length} equipment records
          </p>
        </div>

        <div style={actionGroupStyle}>
          <a href="/lab/fire-maintenance/assets?new=1" style={primaryButtonStyle}>
            Add Equipment
          </a>
          <a href="/lab/fire-maintenance/asset-register" style={linkButtonStyle}>
            Asset Hub
          </a>
          <a href="/lab/fire-maintenance/protection-zones" style={linkButtonStyle}>
            Zones
          </a>
          <a href="/lab/fire-maintenance/device-register" style={linkButtonStyle}>
            Devices
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
          placeholder="Search code, name, type, area, manufacturer..."
          style={inputStyle}
        />

        <select
          value={assetType}
          onChange={(event) => setAssetType(event.target.value)}
          style={selectStyle}
        >
          <option value="all">All Types</option>
          {assetTypeOptions.map((option) => (
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

        <select
          value={criticality}
          onChange={(event) => setCriticality(event.target.value)}
          style={selectStyle}
        >
          <option value="all">All Criticality</option>
          {criticalityOptions.map((option) => (
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
              <th style={thStyle}>Asset Code</th>
              <th style={thStyle}>Asset Name</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Area / Location</th>
              <th style={thStyle}>Manufacturer / Model</th>
              <th style={thStyle}>Inspection</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Criticality</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.map((asset) => (
              <tr key={asset.id}>
                <td style={tdStyle}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <a href={`/lab/fire-maintenance/assets?edit=${asset.id}`} style={smallLinkStyle}>
                      Edit
                    </a>

                    <form
                      action={deleteAction}
                      onSubmit={(event) => {
                        if (!confirm("Delete this equipment asset?")) {
                          event.preventDefault();
                        }
                      }}
                    >
                      <input type="hidden" name="asset_id" value={asset.id} />
                      <button type="submit" style={dangerButtonStyle}>
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
                <td style={tdStyle}>
                  <strong>{formatText(asset.asset_code)}</strong>
                </td>
                <td style={tdStyle}>{formatText(asset.asset_name)}</td>
                <td style={tdStyle}>{formatText(asset.asset_type)}</td>
                <td style={tdStyle}>
                  <div>{formatText(asset.area)}</div>
                  <div style={{ color: "#64748b" }}>{formatText(asset.location)}</div>
                </td>
                <td style={tdStyle}>
                  <div>{formatText(asset.manufacturer)}</div>
                  <div style={{ color: "#64748b" }}>{formatText(asset.model)}</div>
                  {asset.serial_no && (
                    <div style={{ color: "#64748b" }}>SN: {asset.serial_no}</div>
                  )}
                </td>
                <td style={tdStyle}>
                  <div>Last: {formatDate(asset.last_inspection_date)}</div>
                  <div style={{ color: "#64748b" }}>
                    Next: {formatDate(asset.next_inspection_date)}
                  </div>
                </td>
                <td style={tdStyle}>
                  <span style={getStatusBadgeStyle(asset.status)}>
                    {formatText(asset.status || "draft")}
                  </span>
                </td>
                <td style={tdStyle}>
                  <span style={getCriticalityBadgeStyle(asset.criticality)}>
                    {formatText(asset.criticality || "-")}
                  </span>
                </td>
              </tr>
            ))}

            {filteredAssets.length === 0 && (
              <tr>
                <td colSpan="9" style={{ ...tdStyle, color: "#64748b" }}>
                  No equipment data matches the current search/filter.
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

  if (value === "active") {
    return { ...badgeStyle, background: "#dcfce7", color: "#166534" };
  }

  if (value === "inactive") {
    return { ...badgeStyle, background: "#fee2e2", color: "#991b1b" };
  }

  if (value === "archived") {
    return { ...badgeStyle, background: "#fef3c7", color: "#92400e" };
  }

  return { ...badgeStyle, background: "#f1f5f9", color: "#475569" };
}

function getCriticalityBadgeStyle(criticality) {
  const value = normalize(criticality);

  if (value === "high" || value === "critical") {
    return { ...badgeStyle, background: "#fee2e2", color: "#991b1b" };
  }

  if (value === "medium") {
    return { ...badgeStyle, background: "#fef3c7", color: "#92400e" };
  }

  if (value === "low") {
    return { ...badgeStyle, background: "#dcfce7", color: "#166534" };
  }

  return { ...badgeStyle, background: "#f1f5f9", color: "#475569" };
}

const panelStyle = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  padding: 18,
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
  gridTemplateColumns: "minmax(260px, 1fr) 180px 160px 180px 100px",
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
  textDecoration: "none",
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