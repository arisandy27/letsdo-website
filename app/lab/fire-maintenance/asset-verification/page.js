import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const PROJECT_CODE = "FIRE-MEI-2026";
const VERIFIED_BY = "Bobby Rachmat Arisandy";

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

async function markSiteVerified(formData) {
  "use server";

  const supabase = getSupabaseAdmin();
  const assetId = formData.get("asset_id");

  if (!assetId) {
    redirect("/lab/fire-maintenance/asset-verification?error=missing_asset");
  }

  const { error } = await supabase
    .from("fire_assets")
    .update({
      verification_status: "site_verified",
      source_confidence: "field_verified",
      verified_by: VERIFIED_BY,
      verified_at: new Date().toISOString(),
    })
    .eq("id", assetId);

  if (error) {
    redirect("/lab/fire-maintenance/asset-verification?error=site_verify");
  }

  revalidatePath("/lab/fire-maintenance/asset-verification");
  revalidatePath("/lab/fire-maintenance/asset-register");
  revalidatePath("/lab/fire-maintenance/scope-mapping");
  redirect("/lab/fire-maintenance/asset-verification?verified=1");
}

async function markNeedsVerification(formData) {
  "use server";

  const supabase = getSupabaseAdmin();
  const assetId = formData.get("asset_id");

  if (!assetId) {
    redirect("/lab/fire-maintenance/asset-verification?error=missing_asset");
  }

  const { error } = await supabase
    .from("fire_assets")
    .update({
      verification_status: "needs_verification",
      source_confidence: "needs_review",
      verified_by: null,
      verified_at: null,
    })
    .eq("id", assetId);

  if (error) {
    redirect("/lab/fire-maintenance/asset-verification?error=needs_verification");
  }

  revalidatePath("/lab/fire-maintenance/asset-verification");
  revalidatePath("/lab/fire-maintenance/asset-register");
  revalidatePath("/lab/fire-maintenance/scope-mapping");
  redirect("/lab/fire-maintenance/asset-verification?needs=1");
}

export default async function AssetVerificationPage({ searchParams }) {
  const params = await searchParams;
  const supabase = getSupabaseAdmin();

  const { data: project } = await supabase
    .from("fire_projects")
    .select("*")
    .eq("project_code", PROJECT_CODE)
    .maybeSingle();

  const { data: assetsRaw, error } = await supabase
    .from("fire_assets")
    .select("*")
    .eq("project_id", project?.id || "00000000-0000-0000-0000-000000000000")
    .order("asset_level", { ascending: true })
    .order("asset_code", { ascending: true });

  const assets = assetsRaw || [];

  const total = assets.length;
  const documented = countBy(assets, (item) => item.verification_status === "documented");
  const siteVerified = countBy(assets, (item) => item.verification_status === "site_verified");
  const needsVerification = countBy(
    assets,
    (item) =>
      item.verification_status === "needs_verification" ||
      item.verification_status === "draft" ||
      !item.verification_status
  );
  const equipment = countBy(assets, (item) => !item.asset_level || item.asset_level === "equipment");
  const zones = countBy(assets, (item) => item.asset_level === "protection_zone");
  const devices = countBy(assets, (item) => item.asset_level === "device");

  if (error) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Asset Verification</h1>
        <p style={{ color: "#dc2626", fontWeight: 800 }}>
          Failed to load asset verification data.
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
          <h1 style={heroTitleStyle}>Asset Verification</h1>
          <p style={heroTextStyle}>
            Review document-based and seed/manual asset records, then mark assets as
            site verified after field confirmation. Verified assets can be used for official
            maintenance mapping and schedule generation.
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

      {params?.verified && <Alert text="Asset marked as site verified." />}
      {params?.needs && <Alert text="Asset returned to needs verification." />}
      {params?.error && <ErrorAlert text={`Action failed: ${params.error}`} />}

      <section style={kpiGridStyle}>
        <KpiCard title="Total Assets" value={total} caption="All records" />
        <KpiCard title="Documented" value={documented} caption="From source document" />
        <KpiCard title="Site Verified" value={siteVerified} caption="Field confirmed" />
        <KpiCard title="Needs Verification" value={needsVerification} caption="Need review" />
        <KpiCard title="Asset Layers" value={`${equipment}/${zones}/${devices}`} caption="Equipment / Zone / Device" />
      </section>

      <section style={panelStyle}>
        <h2 style={{ marginTop: 0 }}>Verification List</h2>

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
              {assets.map((asset) => (
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
                  </td>
                  <td style={tdStyle}>
                    <StatusBadge status={asset.verification_status || "draft"} />
                  </td>
                  <td style={tdStyle}>
                    <div>{formatText(asset.verified_by)}</div>
                    <div style={{ color: "#64748b" }}>
                      {asset.verified_at ? new Date(asset.verified_at).toLocaleString("en-GB") : "-"}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <form action={markSiteVerified}>
                        <input type="hidden" name="asset_id" value={asset.id} />
                        <button type="submit" style={successButtonStyle}>
                          Site Verify
                        </button>
                      </form>

                      <form action={markNeedsVerification}>
                        <input type="hidden" name="asset_id" value={asset.id} />
                        <button type="submit" style={secondaryButtonStyle}>
                          Needs Review
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}

              {assets.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ ...tdStyle, color: "#64748b" }}>
                    No asset data found.
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

function Alert({ text }) {
  return (
    <div style={alertStyle}>
      {text}
    </div>
  );
}

function ErrorAlert({ text }) {
  return (
    <div style={errorAlertStyle}>
      {text}
    </div>
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

function StatusBadge({ status }) {
  const colorMap = {
    documented: ["#e0f2fe", "#075985"],
    site_verified: ["#dcfce7", "#166534"],
    needs_verification: ["#fef3c7", "#92400e"],
    draft: ["#f1f5f9", "#475569"],
  };

  const [background, color] = colorMap[status] || ["#f1f5f9", "#475569"];

  return (
    <span
      style={{
        display: "inline-block",
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

const successButtonStyle = {
  background: "#16a34a",
  color: "white",
  border: 0,
  borderRadius: 10,
  padding: "8px 10px",
  fontWeight: 800,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  background: "#475569",
  color: "white",
  border: 0,
  borderRadius: 10,
  padding: "8px 10px",
  fontWeight: 800,
  cursor: "pointer",
};

const alertStyle = {
  background: "#dcfce7",
  color: "#166534",
  padding: "12px 14px",
  borderRadius: 12,
  marginBottom: 14,
  fontWeight: 800,
};

const errorAlertStyle = {
  background: "#fee2e2",
  color: "#991b1b",
  padding: "12px 14px",
  borderRadius: 12,
  marginBottom: 14,
  fontWeight: 800,
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
