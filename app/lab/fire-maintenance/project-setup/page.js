import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

function formatDate(value) {
  if (!value) return "-";
  const text = String(value);
  if (text.length < 10) return text;
  return `${text.slice(8, 10)}/${text.slice(5, 7)}/${text.slice(0, 4)}`;
}

function emptyToNull(value) {
  const text = String(value || "").trim();
  return text ? text : null;
}

async function updateProjectSetup(formData) {
  "use server";

  const supabase = getSupabaseClient();

  if (!supabase) {
    redirect("/lab/fire-maintenance/project-setup?error=env");
  }

  const projectId = formData.get("project_id");

  if (!projectId) {
    redirect("/lab/fire-maintenance/project-setup?error=project");
  }

  const payload = {
    project_status: formData.get("project_status") || "bidding",
    timeline_basis: formData.get("timeline_basis") || "working_schedule",
    tentative_start_date: emptyToNull(formData.get("tentative_start_date")),
    tentative_end_date: emptyToNull(formData.get("tentative_end_date")),
    official_start_date: emptyToNull(formData.get("official_start_date")),
    official_end_date: emptyToNull(formData.get("official_end_date")),
    contract_notes: emptyToNull(formData.get("contract_notes")),
  };

  const { error } = await supabase
    .from("fire_projects")
    .update(payload)
    .eq("id", projectId);

  if (error) {
    redirect("/lab/fire-maintenance/project-setup?error=update");
  }

  revalidatePath("/lab/fire-maintenance/project-setup");
  revalidatePath("/lab/fire-maintenance/timeline");
  revalidatePath("/lab/fire-maintenance/schedules");
  revalidatePath("/lab/fire-maintenance/reports");
  revalidatePath("/lab/fire-maintenance/reports/print");
  revalidatePath("/lab/fire-maintenance");
  redirect("/lab/fire-maintenance/project-setup?saved=1");
}

async function loadPageData() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      error:
        "Supabase env belum terbaca. Cek .env.local: NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const { data: project, error } = await supabase
    .from("fire_projects")
    .select("*")
    .eq("project_code", PROJECT_CODE)
    .maybeSingle();

  if (error) return { error: error.message };

  return { project };
}

export default async function FireProjectSetupPage({ searchParams }) {
  const params = await searchParams;
  const data = await loadPageData();

  if (data.error) {
    return (
      <main className="page">
        <style>{css}</style>
        <section className="error-box">
          <h1>Project Setup</h1>
          <p>{data.error}</p>
        </section>
      </main>
    );
  }

  const project = data.project || {};

  const projectStatus = project.project_status || "bidding";
  const timelineBasis = project.timeline_basis || "working_schedule";

  const isOfficial =
    projectStatus === "active" || timelineBasis === "official_schedule";

  return (
    <main className="page">
      <style>{css}</style>

      <section className="hero">
        <div>
          <Link href="/lab/fire-maintenance" style={backLinkStyle}>
            Back to Fire Maintenance Dashboard
          </Link>

          <div className="eyebrow">Fire Maintenance Pro</div>
          <h1>Project Setup / Contract Setup</h1>
          <p>
            Setup status project, tentative planning date, dan official contract
            date. Saat project masih bidding, gunakan working schedule. Saat deal,
            ubah menjadi active dan official schedule.
          </p>
        </div>

        <div className="project-box">
          <div className="project-label">Current Project</div>
          <div className="project-title">{project.project_name || "-"}</div>
          <div className="project-meta">{project.site_name || "-"}</div>
          <div className="project-meta">Client: {project.client_name || "-"}</div>
          <div className="project-meta">Vendor: {project.vendor_name || "-"}</div>
        </div>
      </section>

      {params?.saved && (
        <div className="success-box">Project setup berhasil disimpan.</div>
      )}
      {params?.error && (
        <div className="error-box">Ada error saat menyimpan project setup.</div>
      )}

      <section className="mode-card">
        <div>
          <div className="mode-label">Current Mode</div>
          <h2>{isOfficial ? "Official Contract Mode" : "Bidding / Planning Mode"}</h2>
          <p>
            {isOfficial
              ? "Timeline menggunakan official contract schedule. Overdue dan progress dianggap valid sebagai monitoring kontrak."
              : "Timeline masih menggunakan working schedule. Tanggal dan overdue bersifat tentative untuk kebutuhan bidding/proposal/demo."}
          </p>
        </div>

        <div className={isOfficial ? "mode-badge official" : "mode-badge planning"}>
          {isOfficial ? "Official" : "Working"}
        </div>
      </section>

      <section className="grid">
        <div className="panel">
          <h2>How This Works</h2>

          <div className="flow">
            <div>
              <strong>Bidding / Planning</strong>
              <span>Working schedule, tentative date, no official overdue.</span>
            </div>

            <div>
              <strong>Awarded</strong>
              <span>Contract awarded, waiting for confirmed start date.</span>
            </div>

            <div>
              <strong>Active Contract</strong>
              <span>Official start date confirmed, official schedule active.</span>
            </div>
          </div>
        </div>

        <div className="panel">
          <h2>Current Dates</h2>

          <div className="date-list">
            <div>
              <span>Tentative Start</span>
              <strong>{formatDate(project.tentative_start_date)}</strong>
            </div>
            <div>
              <span>Tentative End</span>
              <strong>{formatDate(project.tentative_end_date)}</strong>
            </div>
            <div>
              <span>Official Start</span>
              <strong>{formatDate(project.official_start_date)}</strong>
            </div>
            <div>
              <span>Official End</span>
              <strong>{formatDate(project.official_end_date)}</strong>
            </div>
          </div>
        </div>
      </section>

      <form action={updateProjectSetup} className="panel form-panel">
        <input type="hidden" name="project_id" value={project.id || ""} />

        <div className="panel-head">
          <h2>Update Project Status</h2>
          <p>
            Gunakan bidding/planning selama project masih proposal. Setelah deal,
            ubah status dan isi official contract date.
          </p>
        </div>

        <div className="form-grid">
          <label>
            Project Status
            <select name="project_status" defaultValue={projectStatus}>
              <option value="bidding">Bidding / Proposal</option>
              <option value="awarded">Awarded / Waiting Start Date</option>
              <option value="active">Active Contract</option>
              <option value="completed">Completed</option>
            </select>
          </label>

          <label>
            Timeline Basis
            <select name="timeline_basis" defaultValue={timelineBasis}>
              <option value="working_schedule">Working Schedule</option>
              <option value="official_schedule">Official Schedule</option>
            </select>
          </label>

          <label>
            Tentative Start Date
            <input
              type="date"
              name="tentative_start_date"
              defaultValue={project.tentative_start_date || ""}
            />
          </label>

          <label>
            Tentative End Date
            <input
              type="date"
              name="tentative_end_date"
              defaultValue={project.tentative_end_date || ""}
            />
          </label>

          <label>
            Official Start Date
            <input
              type="date"
              name="official_start_date"
              defaultValue={project.official_start_date || ""}
            />
          </label>

          <label>
            Official End Date
            <input
              type="date"
              name="official_end_date"
              defaultValue={project.official_end_date || ""}
            />
          </label>

          <label className="full">
            Contract / Planning Notes
            <textarea
              name="contract_notes"
              rows="5"
              defaultValue={project.contract_notes || ""}
              placeholder="Example: Project masih bidding. Official start date menunggu PO/SPK/contract award."
            />
          </label>
        </div>

        <div className="button-row">
          <button type="submit" className="primary-button">
            Save Project Setup
          </button>

          <Link href="/lab/fire-maintenance/timeline" className="secondary-button">
            Open Timeline
          </Link>

          <Link href="/lab/fire-maintenance/schedules" className="secondary-button">
            Open Schedule
          </Link>
        </div>
      </form>
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
  .panel {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 18px;
    box-shadow: 0 8px 20px rgba(15,23,42,.04);
    margin-bottom: 14px;
  }

  .mode-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
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
    min-width: 120px;
    height: 44px;
    border-radius: 999px;
    font-weight: 950;
    font-size: 14px;
  }

  .mode-badge.planning {
    background: #fff7ed;
    color: #c2410c;
  }

  .mode-badge.official {
    background: #ecfdf5;
    color: #047857;
  }

  .grid {
    display: grid;
    grid-template-columns: 1.1fr .9fr;
    gap: 14px;
  }

  .flow {
    display: grid;
    gap: 10px;
  }

  .flow div,
  .date-list div {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 12px;
  }

  .flow strong,
  .date-list strong {
    display: block;
    color: #0f172a;
    font-size: 15px;
    margin-bottom: 4px;
  }

  .flow span,
  .date-list span {
    color: #64748b;
    font-size: 13px;
    font-weight: 800;
  }

  .date-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .form-panel {
    margin-top: 14px;
  }

  .panel-head {
    margin-bottom: 16px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }

  label {
    display: grid;
    gap: 7px;
    font-size: 13px;
    font-weight: 900;
    color: #334155;
  }

  label.full {
    grid-column: 1 / -1;
  }

  input,
  select,
  textarea {
    width: 100%;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    padding: 11px 12px;
    font-size: 14px;
    box-sizing: border-box;
    font-family: Arial, sans-serif;
  }

  textarea {
    resize: vertical;
  }

  .button-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 16px;
  }

  .primary-button,
  .secondary-button {
    height: 44px;
    border-radius: 10px;
    padding: 0 16px;
    font-weight: 900;
    font-size: 14px;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .primary-button {
    border: 1px solid #ea580c;
    background: #ea580c;
    color: white;
  }

  .secondary-button {
    border: 1px solid #cbd5e1;
    background: white;
    color: #0369a1;
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

  @media (max-width: 900px) {
    .hero,
    .grid,
    .form-grid {
      grid-template-columns: 1fr;
    }

    .date-list {
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