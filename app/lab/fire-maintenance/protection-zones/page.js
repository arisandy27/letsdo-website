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

export default async function ProtectionZonesPage() {
  const supabase = getSupabaseAdmin();

  const { data: project } = await supabase
    .from("fire_projects")
    .select("*")
    .eq("project_code", PROJECT_CODE)
    .maybeSingle();

  const { data: zonesRaw, error } = await supabase
    .from("fire_assets")
    .select("*")
    .eq("project_id", project?.id || "00000000-0000-0000-0000-000000000000")
    .eq("asset_level", "protection_zone")
    .order("asset_code", { ascending: true });

  const zones = zonesRaw || [];

  const highCritical = zones.filter((item) => item.criticality === "high").length;
  const officialZoneCount = new Set(zones.map((item) => item.zone_no).filter(Boolean)).size;

  if (error) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Protection Zone Register</h1>
        <p style={{ color: "#dc2626", fontWeight: 800 }}>
          Failed to load protection zone data.
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

      <section style={{ marginBottom: 24 }}>
        <div style={{ color: "#ea580c", fontWeight: 900, letterSpacing: 2, fontSize: 13 }}>
          FIRE MAINTENANCE PRO
        </div>
        <h1 style={{ margin: "8px 0", fontSize: 34, color: "#0f172a" }}>
          Protection Zone Register
        </h1>
        <p style={{ color: "#64748b", maxWidth: 900 }}>
          Actual fire protection zones imported from the O&amp;M Manual. This register
          links area/location with fire protection, detection, and actuation type.
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 }}>
        <KpiCard title="Official Zones" value={officialZoneCount} caption="Zone No. 1–32" />
        <KpiCard title="Coverage Items" value={zones.length} caption="Location/sublocation rows" />
        <KpiCard title="High Criticality Items" value={highCritical} caption="Critical coverage items" />
        <KpiCard title="Source" value="O&M" caption="Manual page 7–9" />
      </section>

      <section style={panelStyle}>
        <h2 style={{ marginTop: 0 }}>Protection Zone List</h2>

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
              {zones.map((zone) => (
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

              {zones.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ ...tdStyle, color: "#64748b" }}>
                    No protection zone data found.
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
      <div style={{ color: "#64748b", fontWeight: 900, fontSize: 13 }}>{title}</div>
      <div style={{ color: "#0f172a", fontWeight: 950, fontSize: 34, marginTop: 8 }}>
        {value}
      </div>
      <div style={{ color: "#64748b", fontSize: 13 }}>{caption}</div>
    </div>
  );
}

const kpiCardStyle = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 18,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
};

const panelStyle = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  padding: 18,
  marginBottom: 18,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
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

