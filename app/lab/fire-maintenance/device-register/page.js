import { createClient } from "@supabase/supabase-js";
import DeviceRegisterClient from "./DeviceRegisterClient";

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

function countBy(items, predicate) {
  return items.filter(predicate).length;
}

export default async function DeviceRegisterPage() {
  const supabase = getSupabaseAdmin();

  const { data: project, error: projectError } = await supabase
    .from("fire_projects")
    .select("*")
    .eq("project_code", PROJECT_CODE)
    .maybeSingle();

  if (projectError) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Device / Tag Register</h1>
        <p style={{ color: "#dc2626", fontWeight: 800 }}>
          Failed to load fire project.
        </p>
        <pre>{projectError.message}</pre>
      </main>
    );
  }

  if (!project) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Device / Tag Register</h1>
        <p style={{ color: "#dc2626", fontWeight: 800 }}>
          Fire project not found: {PROJECT_CODE}
        </p>
      </main>
    );
  }

  const { data: devicesRaw, error } = await supabase
    .from("fire_assets")
    .select("*")
    .eq("project_id", project.id)
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

  const documentedCount = countBy(devices, (item) =>
    item.verification_status === "documented" || item.verification_status === "site_verified"
  );

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
          Back to Fire Maintenance Dashboard
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
        <KpiCard title="Parent Panels" value={panelCount} caption="MFACP/LFACP groups" />
        <KpiCard title="Detectors" value={detectorCount} caption="Smoke/heat/flame devices" />
        <KpiCard title="MCP / Alarm" value={`${mcpCount}/${alarmDeviceCount}`} caption="MCP / bell-strobe" />
        <KpiCard title="Documented" value={documentedCount} caption="Verified/documented tags" />
      </section>

      <DeviceRegisterClient devices={devices} />
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
  gridTemplateColumns: "minmax(0, 1fr) 420px",
  gap: 18,
  alignItems: "stretch",
  marginBottom: 18,
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
  maxWidth: 900,
  margin: 0,
};

const projectCardStyle = {
  background: "linear-gradient(135deg, #0f172a, #334155)",
  borderRadius: 18,
  padding: 20,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.18)",
};

const projectLabelStyle = {
  color: "#fb923c",
  fontWeight: 900,
  fontSize: 12,
  letterSpacing: 2,
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
  fontSize: 32,
  marginTop: 8,
};

const kpiCaptionStyle = {
  color: "#64748b",
  fontSize: 13,
};