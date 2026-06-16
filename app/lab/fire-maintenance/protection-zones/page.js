import { createClient } from "@supabase/supabase-js";
import ProtectionZonesClient from "./ProtectionZonesClient";

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

export default async function ProtectionZonesPage() {
  const supabase = getSupabaseAdmin();

  const { data: project, error: projectError } = await supabase
    .from("fire_projects")
    .select("id, project_code, project_name")
    .eq("project_code", PROJECT_CODE)
    .maybeSingle();

  if (projectError) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Protection Zone Register</h1>
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
        <h1>Protection Zone Register</h1>
        <p style={{ color: "#dc2626", fontWeight: 800 }}>
          Fire project not found: {PROJECT_CODE}
        </p>
      </main>
    );
  }

  const { data: zonesRaw, error } = await supabase
    .from("fire_assets")
    .select(
      "id, asset_code, asset_name, asset_type, area, location, criticality, zone_no, fire_protection_type, fire_detection_type, actuation_type, source_page"
    )
    .eq("project_id", project.id)
    .eq("asset_level", "protection_zone")
    .order("asset_code", { ascending: true });

  const zones = zonesRaw || [];

  const highCritical = zones.filter(
    (item) => String(item.criticality || "").toLowerCase() === "high"
  ).length;

  const officialZoneCount = new Set(
    zones.map((item) => item.zone_no).filter(Boolean)
  ).size;

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
        <a href="/lab/fire-maintenance" style={backLinkStyle}>Back to Fire Maintenance Dashboard</a>
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
        <KpiCard title="Official Zones" value={officialZoneCount} caption="Zone No. 1â€“32" />
        <KpiCard title="Coverage Items" value={zones.length} caption="Location/sublocation rows" />
        <KpiCard title="High Criticality Items" value={highCritical} caption="Critical coverage items" />
        <KpiCard title="Source" value="O&M" caption="Manual page 7â€“9" />
      </section>

      <ProtectionZonesClient zones={zones} />
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

const backLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 40,
  padding: "0 14px",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "white",
  color: "#0369a1",
  fontWeight: 900,
  fontSize: 14,
  textDecoration: "none",
  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
};
