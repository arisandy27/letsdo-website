"use client";

import { useDeferredValue, useMemo, useState } from "react";

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function formatText(value) {
  return value || "-";
}

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");

  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function csvEscape(value) {
  const text = String(value || "");
  return `"${text.replace(/"/g, '""')}"`;
}

function uniqueOptions(items, getter) {
  return Array.from(new Set(items.map(getter).filter(Boolean).map(String))).sort();
}

function downloadCsv(filename, headers, rows) {
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
}

export default function AssetVerificationClient({
  assets = [],
  markSiteVerifiedAction,
  markNeedsVerificationAction,
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [assetLevel, setAssetLevel] = useState("all");

  const deferredSearch = useDeferredValue(search);

  const statusOptions = useMemo(
    () => uniqueOptions(assets, (item) => item.verification_status || "draft"),
    [assets]
  );

  const levelOptions = useMemo(
    () => uniqueOptions(assets, (item) => item.asset_level || "equipment"),
    [assets]
  );

  const filteredAssets = useMemo(() => {
    const term = normalize(deferredSearch);

    return assets.filter((asset) => {
      const currentStatus = asset.verification_status || "draft";
      const currentLevel = asset.asset_level || "equipment";

      const searchableText = normalize(
        [
          asset.asset_code,
          asset.asset_name,
          asset.asset_type,
          asset.asset_level,
          asset.area,
          asset.location,
          asset.zone_no,
          asset.tag_no,
          asset.data_source,
          asset.source_page,
          asset.source_confidence,
          asset.verification_status,
          asset.verified_by,
        ].join(" ")
      );

      const matchSearch = !term || searchableText.includes(term);
      const matchStatus = status === "all" || currentStatus === status;
      const matchLevel = assetLevel === "all" || currentLevel === assetLevel;

      return matchSearch && matchStatus && matchLevel;
    });
  }, [assets, deferredSearch, status, assetLevel]);

  function clearFilters() {
    setSearch("");
    setStatus("all");
    setAssetLevel("all");
  }

  function exportCsv() {
    const headers = [
      "Asset Code",
      "Asset Name",
      "Asset Type",
      "Asset Level",
      "Area",
      "Location",
      "Zone No",
      "Tag No",
      "Data Source",
      "Source Page",
      "Source Confidence",
      "Verification Status",
      "Verified By",
      "Verified At",
    ];

    const rows = filteredAssets.map((asset) => [
      asset.asset_code,
      asset.asset_name,
      asset.asset_type,
      asset.asset_level || "equipment",
      asset.area,
      asset.location,
      asset.zone_no,
      asset.tag_no,
      asset.data_source,
      asset.source_page,
      asset.source_confidence,
      asset.verification_status || "draft",
      asset.verified_by,
      asset.verified_at,
    ]);

    downloadCsv("fire-asset-verification-excel-ready.csv", headers, rows);
  }

  return (
    <section style={panelStyle}>
      <div style={headerStyle}>
        <div>
          <h2 style={{ margin: 0 }}>Verification List</h2>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>
            Showing {filteredAssets.length} of {assets.length} assets
          </p>
        </div>

        <div style={actionGroupStyle}>
          <a href="/lab/fire-maintenance/asset-register" style={linkButtonStyle}>
            Asset Register
          </a>
          <a href="/lab/fire-maintenance/scope-mapping" style={linkButtonStyle}>
            Scope Mapping
          </a>
          <a href="/lab/fire-maintenance/data-readiness" style={linkButtonStyle}>
            Data Readiness
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
          placeholder="Search asset code, name, area, tag, source..."
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
              {String(option).replaceAll("_", " ")}
            </option>
          ))}
        </select>

        <select
          value={assetLevel}
          onChange={(event) => setAssetLevel(event.target.value)}
          style={selectStyle}
        >
          <option value="all">All Asset Level</option>
          {levelOptions.map((option) => (
            <option key={option} value={option}>
              {String(option).replaceAll("_", " ")}
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
              <th style={thStyle}>Asset</th>
              <th style={thStyle}>Level</th>
              <th style={thStyle}>Area / Location</th>
              <th style={thStyle}>Source</th>
              <th style={thStyle}>Verification</th>
              <th style={thStyle}>Verified By</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredAssets.map((asset) => (
              <tr key={asset.id}>
                <td style={tdStyle}>
                  <strong>{asset.asset_code}</strong>
                  <div>{asset.asset_name}</div>
                  <div style={{ color: "#64748b" }}>{formatText(asset.asset_type)}</div>
                </td>

                <td style={tdStyle}>{formatText(asset.asset_level || "equipment")}</td>

                <td style={tdStyle}>
                  <div>{formatText(asset.area)}</div>
                  <div style={{ color: "#64748b" }}>{formatText(asset.location)}</div>
                </td>

                <td style={tdStyle}>
                  <div>{formatText(asset.data_source)}</div>
                  <div style={{ color: "#64748b" }}>{formatText(asset.source_page)}</div>
                  <div style={{ color: "#64748b" }}>
                    Confidence: {formatText(asset.source_confidence)}
                  </div>
                </td>

                <td style={tdStyle}>
                  <StatusBadge status={asset.verification_status || "draft"} />
                </td>

                <td style={tdStyle}>
                  <div>{formatText(asset.verified_by)}</div>
                  <div style={{ color: "#64748b" }}>
                    {formatDateTime(asset.verified_at)}
                  </div>
                </td>

                <td style={tdStyle}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <form action={markSiteVerifiedAction}>
                      <input type="hidden" name="asset_id" value={asset.id} />
                      <button
                        type="submit"
                        style={successButtonStyle}
                        onClick={(event) => {
                          if (!window.confirm("Mark this asset as site verified?")) {
                            event.preventDefault();
                          }
                        }}
                      >
                        Site Verify
                      </button>
                    </form>

                    <form action={markNeedsVerificationAction}>
                      <input type="hidden" name="asset_id" value={asset.id} />
                      <button
                        type="submit"
                        style={secondarySmallButtonStyle}
                        onClick={(event) => {
                          if (!window.confirm("Return this asset to needs verification?")) {
                            event.preventDefault();
                          }
                        }}
                      >
                        Needs Review
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}

            {filteredAssets.length === 0 && (
              <tr>
                <td colSpan="7" style={{ ...tdStyle, color: "#64748b" }}>
                  No asset data matches the current search/filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StatusBadge({ status }) {
  const key = String(status || "draft");

  const colorMap = {
    documented: ["#e0f2fe", "#075985"],
    site_verified: ["#dcfce7", "#166534"],
    needs_verification: ["#fef3c7", "#92400e"],
    draft: ["#f1f5f9", "#475569"],
  };

  const [background, color] = colorMap[key] || ["#f1f5f9", "#475569"];

  return (
    <span
      style={{
        display: "inline-flex",
        background,
        color,
        padding: "5px 8px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 900,
        textTransform: "capitalize",
      }}
    >
      {String(key).replaceAll("_", " ")}
    </span>
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
  marginBottom: 16,
};

const actionGroupStyle = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const toolbarStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(260px, 1fr) 180px 180px 90px",
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
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 14,
  whiteSpace: "nowrap",
};

const secondaryButtonStyle = {
  height: 44,
  border: "1px solid #cbd5e1",
  background: "white",
  color: "#334155",
  padding: "0 16px",
  borderRadius: 8,
  fontWeight: 900,
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
  fontWeight: 900,
  textDecoration: "none",
  fontSize: 14,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
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

const successButtonStyle = {
  background: "#16a34a",
  color: "white",
  border: 0,
  borderRadius: 10,
  padding: "8px 10px",
  fontWeight: 900,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const secondarySmallButtonStyle = {
  background: "#475569",
  color: "white",
  border: 0,
  borderRadius: 10,
  padding: "8px 10px",
  fontWeight: 900,
  cursor: "pointer",
  whiteSpace: "nowrap",
};