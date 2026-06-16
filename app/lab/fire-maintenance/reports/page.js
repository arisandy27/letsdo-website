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

async function saveMonthlyReport(formData) {
  "use server";

  const supabase = getSupabaseClient();

  if (!supabase) {
    redirect("/lab/fire-maintenance/reports?error=env");
  }

  const reportId = formData.get("report_id");
  const projectId = formData.get("project_id");
  const reportMonth = monthInputToDate(formData.get("report_month"));

  const { count: openFindingsCount } = await supabase
    .from("fire_findings")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .neq("status", "closed");

  const payload = {
    project_id: projectId,
    report_month: reportMonth,
    visit_date: formData.get("visit_date") || todayIso(),
    prepared_by: formData.get("prepared_by") || "Fire Kelas A Support",
    summary: formData.get("summary") || null,
    open_findings_count: openFindingsCount || 0,
    status: formData.get("status") || "draft",
    submitted_at:
      formData.get("status") === "submitted" ? new Date().toISOString() : null,
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

  const [projectRes, dashboardRes, reportsRes, findingsRes, schedulesRes] =
    await Promise.all([
      supabase
        .from("fire_projects")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("v_fire_dashboard_summary")
        .select("*")
        .limit(1)
        .maybeSingle(),
      supabase
        .from("fire_monthly_reports")
        .select("*")
        .order("report_month", { ascending: false }),
      supabase
        .from("fire_findings")
        .select("id,status,severity")
        .order("created_at", { ascending: false }),
      supabase
        .from("fire_maintenance_schedules")
        .select("id,status")
        .order("planned_date", { ascending: true }),
    ]);

  const error =
    projectRes.error ||
    dashboardRes.error ||
    reportsRes.error ||
    findingsRes.error ||
    schedulesRes.error;

  if (error) return { error: error.message };

  return {
    project: projectRes.data,
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
          <Link href="/lab/fire-maintenance" style={backLinkStyle}>Back to Fire Maintenance Dashboard</Link>

          <div className="eyebrow">Fire Maintenance Pro</div>
          <h1>Monthly Report</h1>
          <p>
            Draft laporan bulanan untuk visit, inspection summary, schedule status,
            open findings, dan training record.
          </p>

          <p style={{ marginTop: 18 }}>
            <a
              href="/lab/fire-maintenance/reports/print?type=monthly"
              style={{
                display: "inline-flex",
                background: "#ea580c",
                color: "white",
                textDecoration: "none",
                fontWeight: 900,
                padding: "10px 14px",
                borderRadius: 12,
                marginRight: 10,
              }}
            >
              Print Monthly →
            </a>

            <a
              href="/lab/fire-maintenance/reports/print?type=quarterly"
              style={{
                display: "inline-flex",
                background: "#0f172a",
                color: "white",
                textDecoration: "none",
                fontWeight: 900,
                padding: "10px 14px",
                borderRadius: 12,
                marginRight: 10,
              }}
            >
              Print 3 Month →
            </a>

            <a
              href="/lab/fire-maintenance/reports/print?type=semester"
              style={{
                display: "inline-flex",
                background: "#047857",
                color: "white",
                textDecoration: "none",
                fontWeight: 900,
                padding: "10px 14px",
                borderRadius: 12,
                marginRight: 10,
              }}
            >
              Print 6 Month →
            </a>

            <a
              href="/lab/fire-maintenance/reports/print?type=annual"
              style={{
                display: "inline-flex",
                background: "#7c2d12",
                color: "white",
                textDecoration: "none",
                fontWeight: 900,
                padding: "10px 14px",
                borderRadius: 12,
              }}
            >
              Print Annual →
            </a>
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

      <section className="two-col">
        <form action={saveMonthlyReport} className="panel">
          <div className="panel-head">
            <h2>{editingReport ? "Edit Monthly Report" : "Create / Update Monthly Report"}</h2>
            <p>
              {editingReport
                ? "Update draft laporan bulanan."
                : "Generate draft laporan bulanan berdasarkan kondisi terakhir."}
            </p>

            {editingReport && (
              <Link href="/lab/fire-maintenance/reports" className="cancel-link">
                Cancel Edit
              </Link>
            )}
          </div>

          <input type="hidden" name="project_id" value={project?.id || ""} />
          <input type="hidden" name="report_id" value={editingReport?.id || ""} />

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

          <label>
            Monthly Summary
            <textarea
              name="summary"
              rows="6"
              defaultValue={editingReport?.summary || ""}

            />
          </label>

          <button type="submit">
            {editingReport ? "Update Monthly Report" : "Save Monthly Report"}
          </button>
        </form>

        <section className="panel">
          <div className="panel-head">
            <h2>Report History</h2>
            <p>Daftar monthly report yang sudah dibuat.</p>
          </div>

          <div className="report-list">
            {reports.map((report) => (
              <div className="report-card" key={report.id}>
                <div className="report-top">
                  <strong>{formatDate(report.report_month)}</strong>
                  <span className={badgeClass(report.status)}>{report.status}</span>
                </div>

                <div className="report-meta">
                  Visit: {formatDate(report.visit_date)} · Prepared by:{" "}
                  {report.prepared_by || "-"}
                </div>

                <div className="report-summary">{report.summary || "-"}</div>

                <div className="report-meta">
                  Open findings at report time: {report.open_findings_count || 0}
                </div>

                <div className="actions">
                  <Link
                    href={`/lab/fire-maintenance/reports?edit=${report.id}`}
                    className="edit-link"
                  >
                    Edit
                  </Link>

                  <form action={deleteMonthlyReport}>
                    <input type="hidden" name="report_id" value={report.id} />
                    <button type="submit" className="delete-button">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))}

            {reports.length === 0 && (
              <div className="empty-box">Belum ada monthly report.</div>
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

  .back-link,
  .cancel-link {
    display: inline-flex;
    margin-bottom: 16px;
    color: #ea580c;
    text-decoration: none;
    font-weight: 900;
  }

  .cancel-link {
    margin-top: 10px;
    margin-bottom: 0;
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

  .two-col {
    display: grid;
    grid-template-columns: 420px 1fr;
    gap: 14px;
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

  .report-list {
    display: grid;
    gap: 10px;
  }

  .report-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 12px;
  }

  .report-top {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 8px;
  }

  .report-meta,
  .report-summary {
    color: #64748b;
    font-size: 12px;
    line-height: 1.5;
    margin-bottom: 6px;
  }

  .actions {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-top: 10px;
  }

  .edit-link {
    display: inline-flex;
    padding: 6px 10px;
    border-radius: 999px;
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
    text-decoration: none;
    font-size: 12px;
    font-weight: 900;
  }

  .delete-button {
    padding: 6px 10px;
    border-radius: 999px;
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
    box-shadow: none;
    font-size: 12px;
  }

  .delete-button:hover {
    background: #fee2e2;
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

  .badge.draft {
    background: #f1f5f9;
    color: #475569;
    border-color: #cbd5e1;
  }

  .badge.submitted {
    background: #ecfdf5;
    color: #047857;
    border-color: #a7f3d0;
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
