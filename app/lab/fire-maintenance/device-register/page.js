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

export default async function DeviceRegisterPage() {
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

  const totalDevices = devices.length;
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
            This register is used for device-level inspection, fault tracking, and
            maintenance traceability.
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
        <KpiCard title="Parent Panels" value={panelCount} caption="MFACP/LFACP groups" />
        <KpiCard title="Detectors" value={detectorCount} caption="Smoke/heat/flame devices" />
        <KpiCard title="MCP" value={mcpCount} caption="Manual call points" />
        <KpiCard title="Alarm Devices" value={alarmDeviceCount} caption="Bell/strobe/alarm" />
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Device / Tag List</h2>
        <p style={{ color: "#64748b", marginTop: 0 }}>
          Source: Equipment Tag Numbering Table from O&amp;M Manual.
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
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Source</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
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
                    <span style={badgeStyle}>{formatText(device.status)}</span>
                  </td>
                  <td style={tdStyle}>
                    <div>{formatText(device.source_page)}</div>
                    <div style={{ color: "#64748b" }}>
                      {device.source_document ? "O&M Manual" : "-"}
                    </div>
                  </td>
                </tr>
              ))}

              {devices.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ ...tdStyle, color: "#64748b" }}>
                    No device/tag data found.
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
  background: "#dcfce7",
  color: "#166534",
};
