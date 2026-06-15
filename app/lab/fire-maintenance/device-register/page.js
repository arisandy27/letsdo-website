import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const PROJECT_CODE = "FIRE-MEI-2026";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function formatText(value) {
  return value || "-";
}

function countBy(items, predicate) {
  return items.filter(predicate).length;
}

function uniqueOptions(items, key) {
  return Array.from(
    new Set(items.map((item) => item[key]).filter(Boolean))
  ).sort((a, b) => String(a).localeCompare(String(b)));
}

function includesText(value, query) {
  return String(value || "").toLowerCase().includes(query);
}

export default async function DeviceRegisterPage({ searchParams }) {
  const params = await searchParams;

  const q = String(params?.q || "").trim().toLowerCase();
  const parentPanelFilter = String(params?.parent_panel || "");
  const assetTypeFilter = String(params?.asset_type || "");
  const areaFilter = String(params?.area || "");

  const supabase = getSupabaseAdmin();

  const { data: project } = await supabase
    .from("fire_projects")
    .select("*")
    .eq("project_code", PROJECT_CODE)
    .maybeSingle();

  const { data: devicesRaw, error } = await supabase
    .from("fire_assets")
    .select("*")
    .eq("project_id", project?.id || "00000000-0000-0000-0000-000000000000")
    .eq("asset_level", "device")
    .order("parent_panel", { ascending: true })
    .order("group_no", { ascending: true })
    .order("device_flow_no", { ascending: true });

  const devices = devicesRaw || [];

  const filteredDevices = devices.filter((device) => {
    const matchSearch =
      !q ||
      includesText(device.tag_no, q) ||
      includesText(device.asset_code, q) ||
      includesText(device.asset_name, q) ||
      includesText(device.asset_type, q) ||
      includesText(device.device_type_code, q) ||
      includesText(device.device_signal_type, q) ||
      includesText(device.area, q) ||
      includesText(device.location, q) ||
      includesText(device.parent_panel, q);

    const matchParentPanel =
      !parentPanelFilter || device.parent_panel === parentPanelFilter;

    const matchAssetType =
      !assetTypeFilter || device.asset_type === assetTypeFilter;

    const matchArea =
      !areaFilter || device.area === areaFilter;

    return matchSearch && matchParentPanel && matchAssetType && matchArea;
  });

  const totalDevices = devices.length;
  const filteredCount = filteredDevices.length;

  const panelCount = new Set(devices.map((item) => item.parent_panel).filter(Boolean)).size;
  const detectorCount = countBy(devices, (item) =>
    `${item.asset_type} ${item.device_signal_type}`.toLowerCase().includes("detector")
  );
  const mcpCount = countBy(devices, (item) =>
    `${item.asset_type} ${item.device_signal_type}`.toLowerCase().includes("mcp")
  );
  const alarmDeviceCount = countBy(devices, (item) => {
    const value = `${item.asset_type} ${item.device_signal_type}`.toLowerCase();
    return value.includes("bell") || value.includes("strobe") || value.includes("alarm");
  });

  const parentPanelOptions = uniqueOptions(devices, "parent_panel");
  const assetTypeOptions = uniqueOptions(devices, "asset_type");
  const areaOptions = uniqueOptions(devices, "area");

  if (error) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Device / Tag Register</h1>
        <p style={{ color: "#dc2626", fontWeight: 800 }}>
          Failed to load device register data.
        </p>
        <pre>{error.message}</pre>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 1500, margin: "0 auto" }}>
      <p>
        <a href="/lab/fire-maintenance" style={{ color: "#0369a1", fontWeight: 800 }}>
          ← Back to Fire Maintenance Dashboard
        </a>
      </p>

      <section style={heroStyle}>
        <div>
          <div style={eyebrowStyle}>FIRE MAINTENANCE PRO</div>
          <h1 style={heroTitleStyle}>Device / Tag Register</h1>
          <p style={heroTextStyle}>
            Actual device/tag register imported from the Equipment Tag Numbering Table.
            Search and filter by tag number, parent panel, device type, and area.
          </p>
        </div>

        <div style={projectCardStyle}>
          <div style={projectLabelStyle}>PROJECT</div>
          <h2 style={{ margin: "8px 0", color: "white" }}>
            {project?.project_name || "Fire Protection Maintenance Support"}
          </h2>
          <p style={{ margin: "4px 0", color: "#cbd5e1" }}>
            Client: {project?.client_name || "PT Merak Energi Indonesia"}
          </p>
          <p style={{ margin: "4px 0", color: "#cbd5e1" }}>
            Vendor: {project?.vendor_name || "PT Mitra Media Visindo"}
          </p>
        </div>
      </section>

      <section style={kpiGridStyle}>
        <KpiCard title="Device Tags" value={totalDevices} caption="Imported tag records" />
        <KpiCard title="Filtered" value={filteredCount} caption="Current view" />
        <KpiCard title="Parent Panels" value={panelCount} caption="MFACP/LFACP groups" />
        <KpiCard title="Detectors" value={detectorCount} caption="Smoke/heat/flame devices" />
        <KpiCard title="MCP / Alarm" value={`${mcpCount}/${alarmDeviceCount}`} caption="MCP / bell-strobe" />
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Search & Filter</h2>

        <form method="GET" style={filterGridStyle}>
          <label style={labelStyle}>
            Search
            <input
              name="q"
              defaultValue={params?.q || ""}
              placeholder="Search tag, area, panel, device type..."
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Parent Panel
            <select name="parent_panel" defaultValue={parentPanelFilter} style={inputStyle}>
              <option value="">All panels</option>
              {parentPanelOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            Device Type
            <select name="asset_type" defaultValue={assetTypeFilter} style={inputStyle}>
              <option value="">All device types</option>
              {assetTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            Area
            <select name="area" defaultValue={areaFilter} style={inputStyle}>
              <option value="">All areas</option>
              {areaOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: "flex", gap: 10, alignItems: "end" }}>
            <button type="submit" style={primaryButtonStyle}>
              Apply Filter
            </button>

            <a href="/lab/fire-maintenance/device-register" style={secondaryLinkStyle}>
              Reset
            </a>
          </div>
        </form>
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Device / Tag List</h2>
        <p style={{ color: "#64748b", marginTop: 0 }}>
          Showing {filteredCount} of {totalDevices} device/tag records.
        </p>

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
                    <span
                      style={{
                        ...badgeStyle,
                        background:
                          device.verification_status === "site_verified"
                            ? "#dcfce7"
                            : device.verification_status === "documented"
                              ? "#e0f2fe"
                              : "#f1f5f9",
                        color:
                          device.verification_status === "site_verified"
                            ? "#166534"
                            : device.verification_status === "documented"
                              ? "#075985"
                              : "#475569",
                      }}
                    >
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
                    No device/tag data matches the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function KpiCard({ title, value, caption }) {
  return (
    <div style={kpiCardStyle}>
      <div style={kpiTitleStyle}>{title}</div>
      <div style={kpiValueStyle}>{value}</div>
      <div style={kpiCaptionStyle}>{caption}</div>
    </div>
  );
}

const heroStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 360px",
  gap: 20,
  alignItems: "center",
  marginBottom: 20,
};

const eyebrowStyle = {
  color: "#ea580c",
  fontWeight: 900,
  letterSpacing: 2,
  fontSize: 13,
};

const heroTitleStyle = {
  margin: "8px 0",
  fontSize: 34,
  color: "#0f172a",
};

const heroTextStyle = {
  color: "#64748b",
  maxWidth: 850,
};

const projectCardStyle = {
  background: "#0f172a",
  color: "white",
  padding: 20,
  borderRadius: 18,
};

const projectLabelStyle = {
  color: "#fed7aa",
  fontWeight: 900,
  letterSpacing: 1.5,
  fontSize: 12,
};

const kpiGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: 14,
  marginBottom: 18,
};

const kpiCardStyle = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 18,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
};

const kpiTitleStyle = {
  color: "#64748b",
  fontWeight: 900,
  fontSize: 13,
};

const kpiValueStyle = {
  color: "#0f172a",
  fontWeight: 950,
  fontSize: 34,
  marginTop: 8,
};

const kpiCaptionStyle = {
  color: "#64748b",
  fontSize: 13,
};

const panelStyle = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  padding: 18,
  marginBottom: 18,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
};

const sectionTitleStyle = {
  marginTop: 0,
  color: "#0f172a",
};

const filterGridStyle = {
  display: "grid",
  gridTemplateColumns: "1.4fr 1fr 1fr 1fr auto",
  gap: 12,
  alignItems: "end",
};

const labelStyle = {
  display: "grid",
  gap: 6,
  color: "#334155",
  fontWeight: 800,
};

const inputStyle = {
  width: "100%",
  height: 42,
  padding: "0 12px",
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  background: "white",
  color: "#0f172a",
  boxSizing: "border-box",
  outline: "none",
};

const primaryButtonStyle = {
  height: 42,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#0369a1",
  color: "white",
  border: 0,
  borderRadius: 12,
  padding: "0 16px",
  fontWeight: 900,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const secondaryLinkStyle = {
  height: 42,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#475569",
  color: "white",
  textDecoration: "none",
  borderRadius: 12,
  padding: "0 16px",
  fontWeight: 900,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
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

const badgeStyle = {
  display: "inline-block",
  padding: "5px 8px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
};

