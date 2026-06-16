import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import AssetVerificationClient from "./AssetVerificationClient";

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
  revalidatePath("/lab/fire-maintenance/data-readiness");
  revalidatePath("/lab/fire-maintenance/timeline");
  revalidatePath("/lab/fire-maintenance/reports");
  revalidatePath("/lab/fire-maintenance");
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
  revalidatePath("/lab/fire-maintenance/data-readiness");
  revalidatePath("/lab/fire-maintenance/timeline");
  revalidatePath("/lab/fire-maintenance/reports");
  revalidatePath("/lab/fire-maintenance");
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

  const projectStatus = project?.project_status || "bidding";
  const timelineBasis = project?.timeline_basis || "working_schedule";

  if (error) {
    return (
      <main className="page">
        <style>{css}</style>
        <section className="error-box">
          <h1>Asset Verification</h1>
          <p>Failed to load asset verification data.</p>
          <pre>{error.message}</pre>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <style>{css}</style>

      <section className="hero">
        <div>
          <Link href="/lab/fire-maintenance" style={backLinkStyle}>
            Back to Fire Maintenance Dashboard
          </Link>

          <div className="eyebrow">Fire Maintenance Pro</div>
          <h1>Asset Verification</h1>
          <p>
            Review document-based and seed/manual asset records, then mark assets
            as site verified after field confirmation. Verified assets can be used
            for official maintenance mapping and schedule generation.
          </p>

          <div className="hero-actions">
            <Link href="/lab/fire-maintenance/asset-register" className="primary-link">
              Asset Register
            </Link>
            <Link href="/lab/fire-maintenance/scope-mapping" className="secondary-link">
              Scope Mapping
            </Link>
            <Link href="/lab/fire-maintenance/data-readiness" className="secondary-link">
              Data Readiness
            </Link>
            <Link href="/lab/fire-maintenance/project-setup" className="secondary-link">
              Project Setup
            </Link>
          </div>
        </div>

        <div className="project-box">
          <div className="project-label">Project</div>
          <div className="project-title">
            {project?.project_name || "Fire Protection Maintenance Support"}
          </div>
          <div className="project-meta">Client: {project?.client_name || "-"}</div>
          <div className="project-meta">Vendor: {project?.vendor_name || "-"}</div>
          <div className="project-meta">Status: {String(projectStatus).replaceAll("_", " ")}</div>
          <div className="project-meta">Timeline: {String(timelineBasis).replaceAll("_", " ")}</div>
        </div>
      </section>

      {params?.verified && <Alert text="Asset marked as site verified." />}
      {params?.needs && <Alert text="Asset returned to needs verification." />}
      {params?.error && <ErrorAlert text={`Action failed: ${params.error}`} />}

      <section className="mode-card">
        <div>
          <div className="mode-label">Verification Rule</div>
          <h2>Documented to Site Verified</h2>
          <p>
            Data dari proposal/O&M/manual masih dianggap documented. Setelah field
            check, ubah menjadi site verified agar siap dipakai untuk official mapping
            dan official schedule.
          </p>
        </div>

        <div className="mode-badge">Controlled Data</div>
      </section>

      <section className="kpi-grid">
        <KpiCard title="Total Assets" value={total} caption="All records" />
        <KpiCard title="Documented" value={documented} caption="From source document" />
        <KpiCard title="Site Verified" value={siteVerified} caption="Field confirmed" />
        <KpiCard title="Needs Verification" value={needsVerification} caption="Need review" />
        <KpiCard title="Asset Layers" value={`${equipment}/${zones}/${devices}`} caption="Equipment / Zone / Device" />
      </section>

      <AssetVerificationClient
        assets={assets}
        markSiteVerifiedAction={markSiteVerified}
        markNeedsVerificationAction={markNeedsVerification}
      />
    </main>
  );
}

function Alert({ text }) {
  return <div className="success-box">{text}</div>;
}

function ErrorAlert({ text }) {
  return <div className="error-box">{text}</div>;
}

function KpiCard({ title, value, caption }) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{title}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-note">{caption}</div>
    </div>
  );
}

const css = `
  .page {
    min-height: 100vh;
    background: #f8fafc;
    color: #0f172a;
    padding: 24px;
    font-family: Arial, sans-serif;
    max-width: 1500px;
    margin: 0 auto;
  }

  .hero {
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: 20px;
    margin-bottom: 18px;
  }

  .eyebrow {
    color: #ea580c;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: .4px;
    text-transform: uppercase;
    margin: 16px 0 8px;
  }

  h1 {
    margin: 0 0 10px;
    font-size: 34px;
    letter-spacing: -1px;
  }

  h2 {
    margin: 0 0 8px;
    font-size: 20px;
  }

  p {
    color: #64748b;
    line-height: 1.55;
    margin: 0;
  }

  .hero-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 16px;
  }

  .primary-link,
  .secondary-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 42px;
    padding: 0 14px;
    border-radius: 10px;
    text-decoration: none;
    font-size: 14px;
    font-weight: 900;
  }

  .primary-link {
    background: #ea580c;
    color: white;
  }

  .secondary-link {
    background: white;
    color: #0369a1;
    border: 1px solid #cbd5e1;
  }

  .project-box {
    background: #0f172a;
    color: white;
    border-radius: 18px;
    padding: 20px;
    box-shadow: 0 14px 30px rgba(15,23,42,.16);
  }

  .project-label {
    color: #fed7aa;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .project-title {
    font-size: 20px;
    font-weight: 900;
    margin-bottom: 10px;
  }

  .project-meta {
    color: #cbd5e1;
    font-size: 13px;
    line-height: 1.6;
  }

  .mode-card,
  .kpi-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 18px;
    box-shadow: 0 8px 20px rgba(15,23,42,.04);
  }

  .mode-card {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    align-items: center;
    margin-bottom: 14px;
  }

  .mode-label {
    color: #ea580c;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .mode-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 42px;
    padding: 0 16px;
    border-radius: 999px;
    background: #ecfdf5;
    color: #047857;
    font-size: 13px;
    font-weight: 950;
  }

  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 14px;
  }

  .kpi-label {
    color: #64748b;
    font-size: 13px;
    font-weight: 900;
  }

  .kpi-value {
    color: #0f172a;
    font-weight: 950;
    font-size: 34px;
    margin-top: 8px;
  }

  .kpi-note {
    color: #64748b;
    font-size: 13px;
  }

  .success-box,
  .error-box {
    border-radius: 14px;
    padding: 12px 14px;
    margin-bottom: 14px;
    font-weight: 800;
  }

  .success-box {
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    color: #047857;
  }

  .error-box {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #b91c1c;
  }

  @media (max-width: 1000px) {
    .hero,
    .kpi-grid {
      grid-template-columns: 1fr;
    }
  }
`;

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