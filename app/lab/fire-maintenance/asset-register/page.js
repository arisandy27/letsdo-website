import { createClient } from "@supabase/supabase-js";
import AssetRegisterClient from "./AssetRegisterClient";

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

export default async function AssetRegisterHubPage() {
  const supabase = getSupabaseAdmin();

  const { data: project, error: projectError } = await supabase
    .from("fire_projects")
    .select("*")
    .eq("project_code", PROJECT_CODE)
    .maybeSingle();

  if (projectError) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Asset Register</h1>
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
        <h1>Asset Register</h1>
        <p style={{ color: "#dc2626", fontWeight: 800 }}>
          Fire project not found: {PROJECT_CODE}
        </p>
      </main>
    );
  }

  const { data: assetsRaw, error } = await supabase
    .from("fire_assets")
    .select("*")
    .eq("project_id", project.id)
    .order("asset_level", { ascending: true })
    .order("asset_code", { ascending: true });

  const assets = assetsRaw || [];

  const equipmentCount = countBy(
    assets,
    (item) => !item.asset_level || item.asset_level === "equipment"
  );
  const zoneCount = countBy(assets, (item) => item.asset_level === "protection_zone");
  const deviceCount = countBy(assets, (item) => item.asset_level === "device");
  const highCriticality = countBy(
    assets,
    (item) => String(item.criticality || "").toLowerCase() === "high"
  );

  if (error) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Asset Register</h1>
        <p style={{ color: "#dc2626", fontWeight: 800 }}>
          Failed to load asset data.
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

      <section style={heroStyle}>
        <div>
          <div style={eyebrowStyle}>FIRE MAINTENANCE PRO</div>
          <h1 style={heroTitleStyle}>Asset Register</h1>
          <p style={heroTextStyle}>
            Central register for fire protection equipment, protection zones,
            and device/tag records. This structure separates system-level assets,
            area coverage, and actual device tags.
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
        <KpiCard title="Total Records" value={assets.length} caption="All asset records" />
        <KpiCard title="Equipment" value={equipmentCount} caption="Main maintainable assets" />
        <KpiCard title="Protection Zones" value={zoneCount} caption="Coverage/location items" />
        <KpiCard title="Devices / Tags" value={deviceCount} caption="Actual tag records" />
        <KpiCard title="High Criticality" value={highCriticality} caption="Critical assets/items" />
      </section>

      <section style={cardGridStyle}>
        <RegisterCard
          title="Equipment Register"
          badge={`${equipmentCount} records`}
          description="Main maintainable fire protection assets such as panels, CO2/FM-200 systems, hydrant, deluge, foam, APAR, and SCBA."
          href="/lab/fire-maintenance/assets"
          cta="Open Equipment Register"
        />

        <RegisterCard
          title="Protection Zone Register"
          badge={`${zoneCount} records`}
          description="Actual protection zones and location coverage from the O&M Manual, including protection type, detection type, and actuation mode."
          href="/lab/fire-maintenance/protection-zones"
          cta="Open Protection Zones"
        />

        <RegisterCard
          title="Device / Tag Register"
          badge={`${deviceCount} records`}
          description="Actual device and tag records from the Equipment Tag Numbering Table such as detectors, MCP, bell, strobe, and I/O devices."
          href="/lab/fire-maintenance/device-register"
          cta="Open Device Register"
        />
      </section>

      <AssetRegisterClient assets={assets} />

      <section style={panelStyle}>
        <h2 style={{ marginTop: 0 }}>Recommended Use</h2>

        <div style={{ display: "grid", gap: 12 }}>
          <InfoRow
            label="Equipment"
            text="Used for preventive maintenance schedule, inspection, finding, and asset condition tracking."
          />
          <InfoRow
            label="Protection Zone"
            text="Used for area coverage, report summary, risk visibility, and scope-to-location mapping."
          />
          <InfoRow
            label="Device / Tag"
            text="Used for detector test, alarm device test, fault tracking, replacement history, and tag-level traceability."
          />
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

function RegisterCard({ title, badge, description, href, cta }) {
  return (
    <div style={registerCardStyle}>
      <div style={badgeStyle}>{badge}</div>
      <h2 style={{ marginTop: 12, marginBottom: 8, color: "#0f172a" }}>{title}</h2>
      <p style={{ color: "#64748b", lineHeight: 1.6 }}>{description}</p>
      <a href={href} style={buttonStyle}>
        {cta}
      </a>
    </div>
  );
}

function InfoRow({ label, text }) {
  return (
    <div style={infoRowStyle}>
      <strong style={{ color: "#0f172a" }}>{label}</strong>
      <span style={{ color: "#475569" }}>{text}</span>
    </div>
  );
}

const heroStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 420px",
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
  maxWidth: 820,
};

const projectCardStyle = {
  background: "linear-gradient(135deg, #0f172a, #334155)",
  color: "white",
  padding: 20,
  borderRadius: 18,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.18)",
};

const projectLabelStyle = {
  color: "#fb923c",
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

const cardGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 18,
  marginBottom: 18,
};

const registerCardStyle = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  padding: 20,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
};

const badgeStyle = {
  display: "inline-block",
  background: "#e0f2fe",
  color: "#075985",
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 900,
};

const buttonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  marginTop: 14,
  height: 44,
  background: "#0369a1",
  color: "white",
  padding: "0 16px",
  borderRadius: 8,
  textDecoration: "none",
  fontWeight: 900,
};

const panelStyle = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  padding: 18,
  marginBottom: 18,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
};

const infoRowStyle = {
  display: "grid",
  gridTemplateColumns: "180px 1fr",
  gap: 12,
  padding: 12,
  background: "#f8fafc",
  borderRadius: 12,
  border: "1px solid #e2e8f0",
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
