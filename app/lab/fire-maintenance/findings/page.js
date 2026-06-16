import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import FindingListClient from "./FindingListClient";

export const dynamic = "force-dynamic";

const PROJECT_CODE = "FIRE-MEI-2026";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function makeFindingNo() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const h = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  return `FDF-${y}${m}${d}-${h}${min}${s}`;
}

async function createFinding(formData) {
  "use server";

  const supabase = getSupabaseClient();

  if (!supabase) {
    redirect("/lab/fire-maintenance/findings?error=env");
  }

  const projectId = formData.get("project_id");

  if (!projectId) {
    redirect("/lab/fire-maintenance/findings?error=project");
  }

  const { error } = await supabase.from("fire_findings").insert({
    project_id: projectId,
    asset_id: formData.get("asset_id") || null,
    finding_no: makeFindingNo(),
    finding_date: formData.get("finding_date") || todayIso(),
    finding_type: formData.get("finding_type") || "technical",
    severity: formData.get("severity") || "medium",
    description: formData.get("description") || "-",
    corrective_action: formData.get("corrective_action") || null,
    pic: formData.get("pic") || null,
    due_date: formData.get("due_date") || null,
    status: "open",
  });

  if (error) {
    redirect("/lab/fire-maintenance/findings?error=insert");
  }

  revalidatePath("/lab/fire-maintenance/findings");
  revalidatePath("/lab/fire-maintenance/evidence");
  revalidatePath("/lab/fire-maintenance/reports");
  revalidatePath("/lab/fire-maintenance");
  redirect("/lab/fire-maintenance/findings?created=1");
}

async function updateFindingStatus(formData) {
  "use server";

  const supabase = getSupabaseClient();

  if (!supabase) {
    redirect("/lab/fire-maintenance/findings?error=env");
  }

  const findingId = formData.get("finding_id");
  const status = formData.get("status");

  if (!findingId || !status) {
    redirect("/lab/fire-maintenance/findings?error=update");
  }

  const payload = {
    status,
    closed_at: status === "closed" ? todayIso() : null,
  };

  const { error } = await supabase
    .from("fire_findings")
    .update(payload)
    .eq("id", findingId);

  if (error) {
    redirect("/lab/fire-maintenance/findings?error=update");
  }

  revalidatePath("/lab/fire-maintenance/findings");
  revalidatePath("/lab/fire-maintenance/evidence");
  revalidatePath("/lab/fire-maintenance/reports");
  revalidatePath("/lab/fire-maintenance");
  redirect("/lab/fire-maintenance/findings?updated=1");
}

async function loadPageData() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      error:
        "Supabase env belum terbaca. Cek .env.local: NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const { data: project, error: projectError } = await supabase
    .from("fire_projects")
    .select("*")
    .eq("project_code", PROJECT_CODE)
    .maybeSingle();

  if (projectError) return { error: projectError.message };
  if (!project) return { error: `Project not found: ${PROJECT_CODE}` };

  const [assetsRes, findingsRes] = await Promise.all([
    supabase
      .from("fire_assets")
      .select("*")
      .eq("project_id", project.id)
      .order("asset_code", { ascending: true }),

    supabase
      .from("fire_findings")
      .select("*, fire_assets(asset_code, asset_name, asset_type, area), fire_projects(project_name, client_name, vendor_name, site_name)")
      .eq("project_id", project.id)
      .order("due_date", { ascending: true }),
  ]);

  const error = assetsRes.error || findingsRes.error;

  if (error) return { error: error.message };

  return {
    project,
    assets: assetsRes.data || [],
    findings: findingsRes.data || [],
  };
}

export default async function FireFindingsPage({ searchParams }) {
  const params = await searchParams;
  const data = await loadPageData();

  if (data.error) {
    return (
      <main className="page">
        <style>{css}</style>
        <section className="error-box">
          <h1>Findings / Action Tracker</h1>
          <p>{data.error}</p>
        </section>
      </main>
    );
  }

  const { project, assets, findings } = data;

  const open = findings.filter((item) => item.status === "open");
  const inProgress = findings.filter((item) => item.status === "in_progress");
  const closed = findings.filter((item) => item.status === "closed");
  const highCritical = findings.filter(
    (item) =>
      item.status !== "closed" &&
      ["high", "critical"].includes(String(item.severity).toLowerCase())
  );

  const created = params?.created;
  const updated = params?.updated;
  const error = params?.error;
  const showForm = params?.new === "1";

  return (
    <main className="page">
      <style>{css}</style>

      <section className="hero">
        <div>
          <Link href="/lab/fire-maintenance" style={backLinkStyle}>
            Back to Fire Maintenance Dashboard
          </Link>

          <div className="eyebrow">Fire Maintenance Pro</div>
          <h1>Findings / Action Tracker</h1>
          <p>
            Tracking finding inspeksi, corrective action, PIC, due date, dan status
            penyelesaian.
          </p>
        </div>

        <div className="project-box">
          <div className="project-label">Project</div>
          <div className="project-title">{project?.project_name || "-"}</div>
          <div className="project-meta">{project?.site_name || "-"}</div>
          <div className="project-meta">Client: {project?.client_name || "-"}</div>
          <div className="project-meta">Vendor: {project?.vendor_name || "-"}</div>
        </div>
      </section>

      {created && <div className="success-box">Finding baru berhasil dibuat.</div>}
      {updated && <div className="success-box">Status finding berhasil diupdate.</div>}
      {error && <div className="error-box">Ada error saat memproses finding.</div>}

      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Open</div>
          <div className="kpi-value">{open.length}</div>
          <div className="kpi-note">Need action</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">In Progress</div>
          <div className="kpi-value">{inProgress.length}</div>
          <div className="kpi-note">On-going action</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">High / Critical</div>
          <div className="kpi-value">{highCritical.length}</div>
          <div className="kpi-note">Priority findings</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Closed</div>
          <div className="kpi-value">{closed.length}</div>
          <div className="kpi-note">Completed action</div>
        </div>
      </section>

      {showForm && (
        <form action={createFinding} className="panel form-panel">
          <div className="panel-head">
            <h2>New Finding</h2>
            <p>Input finding baru dari hasil inspeksi atau visit lapangan.</p>

            <Link href="/lab/fire-maintenance/findings" className="cancel-link">
              Cancel
            </Link>
          </div>

          <input type="hidden" name="project_id" value={project?.id || ""} />

          <div className="form-grid">
            <label>
              Finding Date
              <input type="date" name="finding_date" defaultValue={todayIso()} />
            </label>

            <label>
              Asset
              <select name="asset_id" required>
                <option value="">Select asset</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.asset_code} - {asset.asset_name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Finding Type
              <select name="finding_type">
                <option value="technical">Technical</option>
                <option value="K3">K3</option>
                <option value="documentation">Documentation</option>
                <option value="training">Training</option>
              </select>
            </label>

            <label>
              Severity
              <select name="severity">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </label>

            <label className="wide">
              Finding Description
              <textarea
                name="description"
                rows="4"
                required
                placeholder="Contoh: pressure gauge CO2 perlu verifikasi ulang..."
              />
            </label>

            <label className="wide">
              Corrective Action
              <textarea
                name="corrective_action"
                rows="3"
                placeholder="Contoh: lakukan inspection ulang dan attach evidence..."
              />
            </label>

            <label>
              PIC
              <input type="text" name="pic" placeholder="Vendor Team / Site Team" />
            </label>

            <label>
              Due Date
              <input type="date" name="due_date" />
            </label>
          </div>

          <button type="submit" className="submit-button">
            Create Finding
          </button>
        </form>
      )}

      <FindingListClient
        findings={findings}
        updateAction={updateFindingStatus}
      />
    </main>
  );
}

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

const css = `
  .page {
    min-height: 100vh;
    background: #f8fafc;
    color: #0f172a;
    padding: 24px;
    font-family: Arial, sans-serif;
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 360px;
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
    margin: 0;
    font-size: 18px;
  }

  p {
    color: #64748b;
    line-height: 1.55;
    margin: 0;
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

  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 14px;
  }

  .kpi-card,
  .panel {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 18px;
    box-shadow: 0 8px 20px rgba(15,23,42,.04);
  }

  .form-panel {
    margin-bottom: 14px;
  }

  .kpi-label {
    color: #64748b;
    font-size: 13px;
    font-weight: 900;
  }

  .kpi-value {
    font-size: 34px;
    font-weight: 950;
    margin-top: 8px;
  }

  .kpi-note {
    color: #64748b;
    font-size: 13px;
  }

  .panel-head {
    margin-bottom: 14px;
  }

  .cancel-link {
    display: inline-flex;
    margin-top: 10px;
    color: #0369a1;
    text-decoration: none;
    font-weight: 900;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .wide {
    grid-column: 1 / -1;
  }

  label {
    display: grid;
    gap: 6px;
    color: #334155;
    font-size: 13px;
    font-weight: 900;
  }

  input,
  select,
  textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 14px;
    color: #0f172a;
    background: white;
  }

  textarea {
    resize: vertical;
  }

  .submit-button {
    margin-top: 14px;
    border: none;
    background: #ea580c;
    color: white;
    font-weight: 900;
    border-radius: 8px;
    padding: 11px 16px;
    cursor: pointer;
    box-shadow: 0 8px 18px rgba(234,88,12,.22);
  }

  .success-box {
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #a7f3d0;
    border-radius: 14px;
    padding: 12px;
    margin-bottom: 14px;
    font-weight: 900;
  }

  .error-box {
    background: white;
    border: 1px solid #fecaca;
    color: #b91c1c;
    border-radius: 18px;
    padding: 20px;
    margin-bottom: 14px;
  }

  @media (max-width: 900px) {
    .hero,
    .form-grid,
    .kpi-grid {
      grid-template-columns: 1fr;
    }
  }
`;