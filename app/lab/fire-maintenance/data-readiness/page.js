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

function countBy(items, predicate) {
  return items.filter(predicate).length;
}

function percent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 1000) / 10;
}

export default async function DataReadinessPage() {
  const supabase = getSupabaseAdmin();

  const { data: project } = await supabase
    .from("fire_projects")
    .select("*")
    .eq("project_code", PROJECT_CODE)
    .maybeSingle();

  const [
    assetsResult,
    mappingsResult,
    scopeSummaryResult,
    schedulesResult,
  ] = await Promise.all([
    supabase
      .from("fire_assets")
      .select("id, asset_level, verification_status, status, data_source")
      .eq("project_id", project?.id || "00000000-0000-0000-0000-000000000000"),

    supabase
      .from("v_fire_asset_scope_mapping_detail")
      .select("*"),

    supabase
      .from("v_fire_scope_asset_mapping_summary")
      .select("*"),

    supabase
      .from("fire_maintenance_schedules")
      .select("id, status, notes")
      .eq("project_id", project?.id || "00000000-0000-0000-0000-000000000000"),
  ]);

  const assets = assetsResult.data || [];
  const mappings = mappingsResult.data || [];
  const scopeSummary = scopeSummaryResult.data || [];
  const schedules = schedulesResult.data || [];

  const totalAssets = assets.length;
  const documentedAssets = countBy(assets, (item) => item.verification_status === "documented");
  const siteVerifiedAssets = countBy(assets, (item) => item.verification_status === "site_verified");
  const needsVerificationAssets = countBy(
    assets,
    (item) =>
      !item.verification_status ||
      item.verification_status === "draft" ||
      item.verification_status === "needs_verification"
  );

  const equipmentAssets = countBy(assets, (item) => !item.asset_level || item.asset_level === "equipment");
  const zoneAssets = countBy(assets, (item) => item.asset_level === "protection_zone");
  const deviceAssets = countBy(assets, (item) => item.asset_level === "device");

  const totalMappings = mappings.length;
  const verifiedMappings = countBy(mappings, (item) => item.validation_status === "verified");
  const draftMappings = countBy(
    mappings,
    (item) => !item.validation_status || item.validation_status === "draft"
  );
  const officialReadyMappings = countBy(
    mappings,
    (item) =>
      item.validation_status === "verified" &&
      item.verification_status === "site_verified"
  );

  const totalScopeItems = scopeSummary.length;
  const mappedScopeItems = countBy(scopeSummary, (item) => item.mapping_status === "mapped");
  const notMappedScopeItems = countBy(scopeSummary, (item) => item.mapping_status === "not_mapped");

  const workingSchedules = countBy(
    schedules,
    (item) =>
      (item.notes || "").includes("scope-asset mapping") ||
      (item.notes || "").includes("scope matrix")
  );

  const officialSchedules = countBy(
    schedules,
    (item) => (item.notes || "").includes("Official schedule")
  );

  const readinessItems = [
    {
      label: "Protection zone data imported",
      value: `${zoneAssets} coverage items`,
      status: zoneAssets > 0 ? "ready" : "missing",
      note: "Document-based actual data from O&M Manual.",
    },
    {
      label: "Device / tag data imported",
      value: `${deviceAssets} device records`,
      status: deviceAssets > 0 ? "partial" : "missing",
      note: "Pilot batch imported. Full Equipment Tag Numbering Table still pending.",
    },
    {
      label: "Asset site verification",
      value: `${siteVerifiedAssets} / ${totalAssets}`,
      status: siteVerifiedAssets > 0 ? "partial" : "pending",
      note: "Needed before official schedule generation.",
    },
    {
      label: "Scope mapping verification",
      value: `${verifiedMappings} / ${totalMappings}`,
      status: verifiedMappings > 0 ? "partial" : "pending",
      note: "Verified mapping is required for official schedule.",
    },
    {
      label: "Official-ready mapping",
      value: `${officialReadyMappings} / ${totalMappings}`,
      status: officialReadyMappings > 0 ? "partial" : "pending",
      note: "Requires both site_verified asset and verified mapping.",
    },
    {
      label: "Working schedule available",
      value: `${workingSchedules} working schedule items`,
      status: workingSchedules > 0 ? "ready" : "missing",
      note: "Used for planning/demo before official verification is complete.",
    },
  ];

  return (
    <main style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <p>
        <a href="/lab/fire-maintenance" style={{ color: "#0369a1", fontWeight: 800 }}>
          ← Back to Fire Maintenance Dashboard
        </a>
      </p>

      <section style={heroStyle}>
        <div>
          <div style={eyebrowStyle}>FIRE MAINTENANCE PRO</div>
          <h1 style={heroTitleStyle}>Actual Data Readiness</h1>
          <p style={heroTextStyle}>
            Monitor whether asset data, mapping validation, and schedule generation are ready
            for actual project execution and official maintenance reporting.
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
        <KpiCard title="Assets" value={totalAssets} caption={`${equipmentAssets}/${zoneAssets}/${deviceAssets} equipment/zone/device`} />
        <KpiCard title="Documented" value={documentedAssets} caption={`${percent(documentedAssets, totalAssets)}% of assets`} />
        <KpiCard title="Site Verified" value={siteVerifiedAssets} caption={`${percent(siteVerifiedAssets, totalAssets)}% of assets`} />
        <KpiCard title="Verified Mapping" value={verifiedMappings} caption={`${percent(verifiedMappings, totalMappings)}% of mappings`} />
        <KpiCard title="Official Ready" value={officialReadyMappings} caption="Verified mapping + site verified asset" />
      </section>

      <section style={twoColumnStyle}>
        <div style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Asset Verification Summary</h2>
          <InfoRow label="Total Assets" value={totalAssets} />
          <InfoRow label="Documented" value={documentedAssets} />
          <InfoRow label="Site Verified" value={siteVerifiedAssets} />
          <InfoRow label="Needs Verification" value={needsVerificationAssets} />
          <InfoRow label="Equipment / Zone / Device" value={`${equipmentAssets} / ${zoneAssets} / ${deviceAssets}`} />
        </div>

        <div style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Mapping & Schedule Summary</h2>
          <InfoRow label="Scope Items" value={totalScopeItems} />
          <InfoRow label="Mapped Scope Items" value={mappedScopeItems} />
          <InfoRow label="Not Mapped Scope Items" value={notMappedScopeItems} />
          <InfoRow label="Draft Mapping" value={draftMappings} />
          <InfoRow label="Verified Mapping" value={verifiedMappings} />
          <InfoRow label="Working / Official Schedule" value={`${workingSchedules} / ${officialSchedules}`} />
        </div>
      </section>

      <section style={panelStyle}>
        <h2 style={{ marginTop: 0 }}>Readiness Checklist</h2>

        <div style={{ display: "grid", gap: 12 }}>
          {readinessItems.map((item) => (
            <div key={item.label} style={checkRowStyle}>
              <div>
                <strong style={{ color: "#0f172a" }}>{item.label}</strong>
                <div style={{ color: "#64748b", marginTop: 4 }}>{item.note}</div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 950, color: "#0f172a" }}>{item.value}</div>
                <StatusBadge status={item.status} />
              </div>
            </div>
          ))}
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

function InfoRow({ label, value }) {
  return (
    <div style={infoRowStyle}>
      <span style={{ color: "#64748b", fontWeight: 800 }}>{label}</span>
      <strong style={{ color: "#0f172a" }}>{value}</strong>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    ready: ["#dcfce7", "#166534"],
    partial: ["#e0f2fe", "#075985"],
    pending: ["#fef3c7", "#92400e"],
    missing: ["#fee2e2", "#991b1b"],
  };

  const [background, color] = map[status] || ["#f1f5f9", "#475569"];

  return (
    <span
      style={{
        display: "inline-block",
        marginTop: 6,
        background,
        color,
        padding: "5px 8px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 900,
      }}
    >
      {status}
    </span>
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

const twoColumnStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 18,
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
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  padding: "10px 0",
  borderBottom: "1px solid #e2e8f0",
};

const checkRowStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 220px",
  gap: 16,
  padding: 14,
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  background: "#f8fafc",
};
