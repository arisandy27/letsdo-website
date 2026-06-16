import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

function formatDate(value) {
  if (!value) return "-";
  const text = String(value);
  if (text.length < 10) return text;
  return `${text.slice(8, 10)}/${text.slice(5, 7)}/${text.slice(0, 4)}`;
}

function badgeClass(value) {
  const key = String(value || "default").toLowerCase().replaceAll("_", "-");
  return `badge ${key}`;
}

async function createFinding(formData) {
  "use server";

  const supabase = getSupabaseClient();

  if (!supabase) {
    redirect("/lab/fire-maintenance/findings?error=env");
  }

  const { error } = await supabase.from("fire_findings").insert({
    project_id: formData.get("project_id"),
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

  const [projectRes, assetsRes, findingsRes] = await Promise.all([
    supabase
      .from("fire_projects")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("fire_assets")
      .select("*")
      .order("asset_code", { ascending: true }),
    supabase
      .from("fire_findings")
      .select("*, fire_assets(asset_code, asset_name, asset_type, area), fire_projects(project_name, client_name, vendor_name, site_name)")
      .order("due_date", { ascending: true }),
  ]);

  const error = projectRes.error || assetsRes.error || findingsRes.error;

  if (error) return { error: error.message };

  return {
    project: projectRes.data,
    assets: assetsRes.data || [],
    findings: findingsRes.data || [],
  };
}

export default async function FireFindingsPage({ searchParams }) {
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

  const created = searchParams?.created;
  const updated = searchParams?.updated;
  const error = searchParams?.error;

  return (
    <main className="page">
      <style>{css}</style>

      <section className="hero">
        <div>
          <Link href="/lab/fire-maintenance" style={backLinkStyle}>Back to Fire Maintenance Dashboard</Link>

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

      <section className="two-col">
        <form action={createFinding} className="panel">
          <div className="panel-head">
            <h2>New Finding</h2>
            <p>Input finding baru dari hasil inspeksi atau visit lapangan.</p>
          </div>

          <input type="hidden" name="project_id" value={project?.id || ""} />

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

          <label>
            Finding Description
            <textarea
              name="description"
              rows="4"
              required
              placeholder="Contoh: pressure gauge CO2 perlu verifikasi ulang..."
            />
          </label>

          <label>
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

          <button type="submit">Create Finding</button>
        </form>

        <section className="panel">
          <div className="panel-head">
            <h2>Finding List</h2>
            <p>Daftar finding dan status action tracker.</p>
          </div>

          <div className="finding-list">
            {findings.map((item) => (
              <div className="finding-card" key={item.id}>
                <div className="finding-top">
                  <strong>{item.finding_no}</strong>
                  <span className={badgeClass(item.severity)}>{item.severity}</span>
                </div>

                <div className="finding-title">{item.description}</div>

                <div className="finding-meta">
                  Asset: {item.fire_assets?.asset_code || "-"} -{" "}
                  {item.fire_assets?.asset_name || "-"}
                </div>

                <div className="finding-meta">
                  PIC: {item.pic || "-"} · Due: {formatDate(item.due_date)}
                </div>

                <div className="finding-action">
                  Action: {item.corrective_action || "-"}
                </div>

                <div className="finding-footer">
                  <span className={badgeClass(item.status)}>{item.status}</span>

                  {item.status !== "in_progress" && item.status !== "closed" && (
                    <form action={updateFindingStatus}>
                      <input type="hidden" name="finding_id" value={item.id} />
                      <input type="hidden" name="status" value="in_progress" />
                      <button type="submit" className="small-button dark">
                        Set In Progress
                      </button>
                    </form>
                  )}

                  {item.status !== "closed" && (
                    <form action={updateFindingStatus}>
                      <input type="hidden" name="finding_id" value={item.id} />
                      <input type="hidden" name="status" value="closed" />
                      <button type="submit" className="small-button">
                        Close
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}

            {findings.length === 0 && (
              <div className="empty-box">Belum ada finding.</div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

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
    grid-template-columns: 1fr 360px;
    gap: 20px;
    margin-bottom: 18px;
  }

  .back-link {
    display: inline-flex;
    margin-bottom: 16px;
    color: #ea580c;
    text-decoration: none;
    font-weight: 900;
  }

  .eyebrow {
    color: #ea580c;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: .4px;
    text-transform: uppercase;
    margin-bottom: 8px;
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
    grid-template-columns: repeat(4, 1fr);
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

  .two-col {
    display: grid;
    grid-template-columns: 420px 1fr;
    gap: 14px;
  }

  .panel-head {
    margin-bottom: 14px;
  }

  label {
    display: grid;
    gap: 6px;
    margin-bottom: 12px;
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
    border-radius: 12px;
    padding: 10px 12px;
    font-size: 14px;
    color: #0f172a;
    background: white;
  }

  textarea {
    resize: vertical;
  }

  button {
    border: none;
    background: #ea580c;
    color: white;
    font-weight: 900;
    border-radius: 12px;
    padding: 11px 14px;
    cursor: pointer;
    box-shadow: 0 8px 18px rgba(234,88,12,.22);
  }

  button:hover {
    background: #c2410c;
  }

  .finding-list {
    display: grid;
    gap: 10px;
  }

  .finding-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 12px;
  }

  .finding-top {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 8px;
  }

  .finding-top strong {
    color: #ea580c;
  }

  .finding-title {
    font-weight: 900;
    margin-bottom: 6px;
  }

  .finding-meta,
  .finding-action {
    color: #64748b;
    font-size: 12px;
    line-height: 1.5;
    margin-bottom: 6px;
  }

  .finding-footer {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 10px;
  }

  .small-button {
    padding: 6px 10px;
    font-size: 12px;
    box-shadow: none;
  }

  .small-button.dark {
    background: #0f172a;
  }

  .small-button.dark:hover {
    background: #1e293b;
  }

  .badge {
    display: inline-flex;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 800;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    color: #334155;
    text-transform: capitalize;
    white-space: nowrap;
  }

  .badge.open,
  .badge.high {
    background: #fff7ed;
    color: #c2410c;
    border-color: #fed7aa;
  }

  .badge.in-progress,
  .badge.medium {
    background: #eff6ff;
    color: #1d4ed8;
    border-color: #bfdbfe;
  }

  .badge.closed,
  .badge.low {
    background: #ecfdf5;
    color: #047857;
    border-color: #a7f3d0;
  }

  .badge.critical {
    background: #fef2f2;
    color: #b91c1c;
    border-color: #fecaca;
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

  .empty-box {
    color: #64748b;
    padding: 18px;
    text-align: center;
    border: 1px dashed #cbd5e1;
    border-radius: 14px;
  }

  @media (max-width: 900px) {
    .hero,
    .two-col,
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
