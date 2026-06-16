import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import ReportListClient from "./ReportListClient";

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

function currentMonthInput() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

function dateToMonthInput(value) {
  if (!value) return currentMonthInput();
  const text = String(value);
  if (text.length < 7) return currentMonthInput();
  return text.slice(0, 7);
}

function monthInputToDate(value) {
  if (!value) return `${currentMonthInput()}-01`;
  return `${value}-01`;
}

async function saveMonthlyReport(formData) {
  "use server";

  const supabase = getSupabaseClient();

  if (!supabase) {
    redirect("/lab/fire-maintenance/reports?error=env");
  }

  const reportId = formData.get("report_id");
  const projectId = formData.get("project_id");
  const reportMonth = monthInputToDate(formData.get("report_month"));

  if (!projectId) {
    redirect("/lab/fire-maintenance/reports?error=project");
  }

  const { count: openFindingsCount } = await supabase
    .from("fire_findings")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .neq("status", "closed");

  const status = formData.get("status") || "draft";

  const payload = {
    project_id: projectId,
    report_month: reportMonth,
    visit_date: formData.get("visit_date") || todayIso(),
    prepared_by: formData.get("prepared_by") || "Fire Kelas A Support",
    summary: formData.get("summary") || null,
    open_findings_count: openFindingsCount || 0,
    status,
    submitted_at: status === "submitted" ? new Date().toISOString() : null,
  };

  if (reportId) {
    const { error } = await supabase
      .from("fire_monthly_reports")
      .update(payload)
      .eq("id", reportId);

    if (error) {
      redirect("/lab/fire-maintenance/reports?error=update");
    }

    revalidatePath("/lab/fire-maintenance/reports");
    revalidatePath("/lab/fire-maintenance/reports/print");
    revalidatePath("/lab/fire-maintenance");
    redirect("/lab/fire-maintenance/reports?updated=1");
  }

  const { error } = await supabase.from("fire_monthly_reports").upsert(payload, {
    onConflict: "project_id,report_month",
  });

  if (error) {
    redirect("/lab/fire-maintenance/reports?error=save");
  }

  revalidatePath("/lab/fire-maintenance/reports");
  revalidatePath("/lab/fire-maintenance/reports/print");
  revalidatePath("/lab/fire-maintenance");
  redirect("/lab/fire-maintenance/reports?saved=1");
}

async function deleteMonthlyReport(formData) {
  "use server";

  const supabase = getSupabaseClient();

  if (!supabase) {
    redirect("/lab/fire-maintenance/reports?error=env");
  }

  const reportId = formData.get("report_id");

  if (!reportId) {
    redirect("/lab/fire-maintenance/reports?error=delete");
  }

  const { error } = await supabase
    .from("fire_monthly_reports")
    .delete()
    .eq("id", reportId);

  if (error) {
    redirect("/lab/fire-maintenance/reports?error=delete");
  }

  revalidatePath("/lab/fire-maintenance/reports");
  revalidatePath("/lab/fire-maintenance/reports/print");
  revalidatePath("/lab/fire-maintenance");
  redirect("/lab/fire-maintenance/reports?deleted=1");
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

  const [dashboardRes, reportsRes, findingsRes, schedulesRes] =
    await Promise.all([
      supabase
        .from("v_fire_dashboard_summary")
        .select("*")
        .limit(1)
        .maybeSingle(),

      supabase
        .from("fire_monthly_reports")
        .select("*")
        .eq("project_id", project.id)
        .order("report_month", { ascending: false }),

      supabase
        .from("fire_findings")
        .select("id,status,severity")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false }),

      supabase
        .from("fire_maintenance_schedules")
        .select("id,status")
        .eq("project_id", project.id)
        .order("planned_date", { ascending: true }),
    ]);

  const error =
    dashboardRes.error ||
    reportsRes.error ||
    findingsRes.error ||
    schedulesRes.error;

  if (error) return { error: error.message };

  return {
    project,
    dashboard: dashboardRes.data || {},
    reports: reportsRes.data || [],
    findings: findingsRes.data || [],
    schedules: schedulesRes.data || [],
  };
}

export default async function FireMonthlyReportPage({ searchParams }) {
  const params = await searchParams;
  const data = await loadPageData();

  if (data.error) {
    return (
      <main className="page">
        <style>{css}</style>
        <section className="error-box">
          <h1>Monthly Report</h1>
          <p>{data.error}</p>
        </section>
      </main>
    );
  }

  const { project, dashboard, reports, findings, schedules } = data;

  const editingReport = reports.find((item) => item.id === params?.edit) || null;

  const saved = params?.saved;
  const updated = params?.updated;
  const deleted = params?.deleted;
  const error = params?.error;
  const showForm = params?.new === "1" || Boolean(editingReport);

  const openFindings = findings.filter((item) => item.status !== "closed");
  const highCriticalFindings = findings.filter(
    (item) =>
      item.status !== "closed" &&
      ["high", "critical"].includes(String(item.severity).toLowerCase())
  );
  const completedSchedules = schedules.filter((item) => item.status === "done");

  const generatedSummary = `Monthly fire protection maintenance report. Total assets: ${
    dashboard.total_assets || 0
  }. Schedule this month: ${
    dashboard.schedules_this_month || 0
  }. Open findings: ${openFindings.length}. High/critical findings: ${
    highCriticalFindings.length
  }.`;

  return (
    <main className="page">
      <style>{css}</style>

      <section className="hero">
        <div>
          <Link href="/lab/fire-maintenance" style={backLinkStyle}>
            Back to Fire Maintenance Dashboard
          </Link>

          <div className="eyebrow">Fire Maintenance Pro</div>
          <h1>Monthly Report</h1>
          <p>
            Draft laporan bulanan untuk visit, inspection summary, schedule status,
            open findings, training record, dan evidence attachment.
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

      {saved && <div className="success-box">Monthly report berhasil disimpan.</div>}
      {updated && <div className="success-box">Monthly report berhasil diupdate.</div>}
      {deleted && <div className="success-box">Monthly report berhasil dihapus.</div>}
      {error && <div className="error-box">Ada error saat memproses monthly report.</div>}

      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Assets</div>
          <div className="kpi-value">{dashboard.total_assets || 0}</div>
          <div className="kpi-note">Registered assets</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Schedule Done</div>
          <div className="kpi-value">{completedSchedules.length}</div>
          <div className="kpi-note">Completed maintenance</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Open Findings</div>
          <div className="kpi-value">{openFindings.length}</div>
          <div className="kpi-note">Need action</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">High / Critical</div>
          <div className="kpi-value">{highCriticalFindings.length}</div>
          <div className="kpi-note">Priority findings</div>
        </div>
      </section>

      {showForm && (
        <form action={saveMonthlyReport} className="panel form-panel">
          <div className="panel-head">
            <h2>{editingReport ? "Edit Report Composer" : "Create Report Composer"}</h2>
            <p>
              {editingReport
                ? "Update report header, executive summary, and publishing status."
                : "Prepare report header and executive summary. Detailed sections are generated automatically from module data."}
            </p>

            <Link href="/lab/fire-maintenance/reports" className="cancel-link">
              Cancel
            </Link>
          </div>

          <input type="hidden" name="project_id" value={project?.id || ""} />
          <input type="hidden" name="report_id" value={editingReport?.id || ""} />
          <div className="composer-guide">
            <div className="composer-guide-head">
              <strong>Monthly Report Structure</strong>
              <span>Print report output follows this structure</span>
            </div>

            <div className="composer-grid">
              <div className="composer-item">
                <span>1. Report Header</span>
                <b className="composer-badge editable">Editable</b>
              </div>

              <div className="composer-item">
                <span>2. Executive Summary</span>
                <b className="composer-badge editable">Editable</b>
              </div>

              <div className="composer-item">
                <span>3. Scope Coverage</span>
                <b className="composer-badge auto">Auto</b>
              </div>

              <div className="composer-item">
                <span>4. Schedule Status</span>
                <b className="composer-badge auto">Auto</b>
              </div>

              <div className="composer-item">
                <span>5. Inspection Summary</span>
                <b className="composer-badge auto">Auto</b>
              </div>

              <div className="composer-item">
                <span>6. Findings & Action</span>
                <b className="composer-badge auto">Auto</b>
              </div>

              <div className="composer-item">
                <span>7. Training Record</span>
                <b className="composer-badge auto">Auto</b>
              </div>

              <div className="composer-item">
                <span>8. Evidence / Attachments</span>
                <b className="composer-badge auto">Auto</b>
              </div>

              <div className="composer-item">
                <span>9. Report Analysis</span>
                <b className="composer-badge auto">Auto</b>
              </div>

              <div className="composer-item">
                <span>10. Recommendation & Sign-off</span>
                <b className="composer-badge auto">Auto</b>
              </div>
            </div>
          </div>

          <div className="form-grid">
            <label>
              Report Month
              <input
                type="month"
                name="report_month"
                defaultValue={dateToMonthInput(editingReport?.report_month)}
              />
            </label>

            <label>
              Visit Date
              <input
                type="date"
                name="visit_date"
                defaultValue={editingReport?.visit_date || todayIso()}
              />
            </label>

            <label>
              Prepared By
              <input
                type="text"
                name="prepared_by"
                defaultValue={editingReport?.prepared_by || "Fire Kelas A Support"}
              />
            </label>

            <label>
              Report Status
              <select name="status" defaultValue={editingReport?.status || "draft"}>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
              </select>
            </label>

            <label className="wide">
              Executive Summary / Monthly Summary
              <textarea
                name="summary"
                rows="6"
                defaultValue={editingReport?.summary || generatedSummary}
              />
              <div className="field-hint">
                This text appears in the Executive Summary. Scope, schedule, inspection, findings, training, evidence, and analysis sections are generated automatically.
              </div>
            </label>
          </div>

          <button type="submit" className="submit-button">
            {editingReport ? "Update Monthly Report" : "Save Monthly Report"}
          </button>
        </form>
      )}

      <ReportListClient
        reports={reports}
        deleteAction={deleteMonthlyReport}
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