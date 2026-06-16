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

async function saveSchedule(formData) {
  "use server";

  const supabase = getSupabaseClient();

  if (!supabase) {
    redirect("/lab/fire-maintenance/schedules?error=env");
  }

  const projectId = formData.get("project_id");
  const scheduleId = formData.get("schedule_id");

  if (!projectId) {
    redirect("/lab/fire-maintenance/schedules?error=project");
  }

  const frequency = formData.get("frequency") || "monthly";

  const payload = {
    project_id: projectId,
    asset_id: formData.get("asset_id") || null,
    scope_template_id: formData.get("scope_template_id") || null,
    schedule_code: formData.get("schedule_code"),
    activity_type: formData.get("activity_type"),
    frequency,
    report_frequency: frequency,
    planned_date: formData.get("planned_date") || todayIso(),
    actual_date: formData.get("actual_date") || null,
    assigned_to: formData.get("assigned_to") || null,
    status: formData.get("status") || "planned",
    notes: formData.get("notes") || null,
  };

  if (scheduleId) {
    const { error } = await supabase
      .from("fire_maintenance_schedules")
      .update(payload)
      .eq("id", scheduleId);

    if (error) {
      redirect("/lab/fire-maintenance/schedules?error=update");
    }

    revalidatePath("/lab/fire-maintenance/schedules");
    revalidatePath("/lab/fire-maintenance");
    redirect("/lab/fire-maintenance/schedules?updated=1");
  }

  const { error } = await supabase
    .from("fire_maintenance_schedules")
    .insert(payload);

  if (error) {
    redirect("/lab/fire-maintenance/schedules?error=insert");
  }

  revalidatePath("/lab/fire-maintenance/schedules");
  revalidatePath("/lab/fire-maintenance");
  redirect("/lab/fire-maintenance/schedules?created=1");
}

async function deleteSchedule(formData) {
  "use server";

  const supabase = getSupabaseClient();

  if (!supabase) {
    redirect("/lab/fire-maintenance/schedules?error=env");
  }

  const scheduleId = formData.get("schedule_id");

  if (!scheduleId) {
    redirect("/lab/fire-maintenance/schedules?error=delete");
  }

  const { error } = await supabase
    .from("fire_maintenance_schedules")
    .delete()
    .eq("id", scheduleId);

  if (error) {
    redirect("/lab/fire-maintenance/schedules?error=delete");
  }

  revalidatePath("/lab/fire-maintenance/schedules");
  revalidatePath("/lab/fire-maintenance");
  redirect("/lab/fire-maintenance/schedules?deleted=1");
}

async function loadPageData() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      error:
        "Supabase env belum terbaca. Cek .env.local: NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const [projectRes, assetsRes, scopesRes, schedulesRes] = await Promise.all([
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
      .from("fire_scope_templates")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("fire_maintenance_schedules")
      .select("*, fire_assets(asset_code, asset_name, asset_type, area), fire_projects(project_name, client_name, vendor_name, site_name), fire_scope_templates(frequency, system_group, scope_title)")
      .order("planned_date", { ascending: true }),
  ]);

  const error =
    projectRes.error ||
    assetsRes.error ||
    scopesRes.error ||
    schedulesRes.error;

  if (error) return { error: error.message };

  return {
    project: projectRes.data,
    assets: assetsRes.data || [],
    scopes: scopesRes.data || [],
    schedules: schedulesRes.data || [],
  };
}

export default async function FireMaintenanceSchedulePage({ searchParams }) {
  const params = await searchParams;
  const data = await loadPageData();

  if (data.error) {
    return (
      <main className="page">
        <style>{css}</style>
        <section className="error-box">
          <h1>Maintenance Schedule</h1>
          <p>{data.error}</p>
        </section>
      </main>
    );
  }

  const { project, assets, scopes, schedules } = data;

  const editingSchedule =
    schedules.find((item) => item.id === params?.edit) || null;

  const created = params?.created;
  const updated = params?.updated;
  const deleted = params?.deleted;
  const error = params?.error;

  const planned = schedules.filter((item) => item.status === "planned");
  const overdue = schedules.filter((item) => item.status === "overdue");
  const done = schedules.filter((item) => item.status === "done");

  return (
    <main className="page">
      <style>{css}</style>

      <section className="hero">
        <div>
          <Link href="/lab/fire-maintenance" style={backLinkStyle}>Back to Fire Maintenance Dashboard</Link>

          <div className="eyebrow">Fire Maintenance Pro</div>
          <h1>Maintenance Schedule</h1>
          <p>
            Jadwal inspeksi dan maintenance fire protection untuk weekly, monthly,
            3-month, 6-month, dan annual scope.
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

      {created && <div className="success-box">Schedule baru berhasil dibuat.</div>}
      {updated && <div className="success-box">Schedule berhasil diupdate.</div>}
      {deleted && <div className="success-box">Schedule berhasil dihapus.</div>}
      {error && <div className="error-box">Ada error saat memproses schedule.</div>}

      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Schedule</div>
          <div className="kpi-value">{schedules.length}</div>
          <div className="kpi-note">Maintenance activities</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Planned</div>
          <div className="kpi-value">{planned.length}</div>
          <div className="kpi-note">Upcoming work</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Overdue</div>
          <div className="kpi-value">{overdue.length}</div>
          <div className="kpi-note">Need attention</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Done</div>
          <div className="kpi-value">{done.length}</div>
          <div className="kpi-note">Completed schedule</div>
        </div>
      </section>

      <section className="two-col">
        <form action={saveSchedule} className="panel">
          <div className="panel-head">
            <h2>{editingSchedule ? "Edit Schedule" : "Add New Schedule"}</h2>
            <p>
              {editingSchedule
                ? "Update jadwal maintenance."
                : "Tambahkan jadwal maintenance baru."}
            </p>

            {editingSchedule && (
              <Link href="/lab/fire-maintenance/schedules" className="cancel-link">
                Cancel Edit
              </Link>
            )}
          </div>

          <input type="hidden" name="project_id" value={project?.id || ""} />
          <input type="hidden" name="schedule_id" value={editingSchedule?.id || ""} />

          <label>
            Schedule Code
            <input
              type="text"
              name="schedule_code"
              required
              defaultValue={editingSchedule?.schedule_code || ""}
              placeholder="Contoh: FMS-202606-008"
            />
          </label>

          <label>
            Asset
            <select
              name="asset_id"
              defaultValue={editingSchedule?.asset_id || ""}
            >
              <option value="">No asset selected</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.asset_code} - {asset.asset_name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Scope Template
            <select
              name="scope_template_id"
              defaultValue={editingSchedule?.scope_template_id || ""}
            >
              <option value="">No scope template</option>
              {scopes.map((scope) => (
                <option key={scope.id} value={scope.id}>
                  {scope.frequency} - {scope.system_group} - {scope.scope_title}
                </option>
              ))}
            </select>
          </label>

          <label>
            Activity Type
            <input
              type="text"
              name="activity_type"
              required
              defaultValue={editingSchedule?.activity_type || ""}
              placeholder="Contoh: Monthly Fire Alarm Panel Inspection"
            />
          </label>

          <label>
            Frequency
            <select name="frequency" defaultValue={editingSchedule?.frequency || "monthly"}>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">3 Month / Quarterly</option>
              <option value="semiannual">6 Month / Semiannual</option>
              <option value="annual">Annual</option>
            </select>
          </label>

          <label>
            Planned Date
            <input
              type="date"
              name="planned_date"
              required
              defaultValue={editingSchedule?.planned_date || todayIso()}
            />
          </label>

          <label>
            Actual Date
            <input
              type="date"
              name="actual_date"
              defaultValue={editingSchedule?.actual_date || ""}
            />
          </label>

          <label>
            Assigned To
            <input
              type="text"
              name="assigned_to"
              defaultValue={editingSchedule?.assigned_to || ""}
              placeholder="Contoh: Vendor Team / Fire Kelas A Support"
            />
          </label>

          <label>
            Status
            <select name="status" defaultValue={editingSchedule?.status || "planned"}>
              <option value="planned">Planned</option>
              <option value="overdue">Overdue</option>
              <option value="done">Done</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>

          <label>
            Notes
            <textarea
              name="notes"
              rows="3"
              defaultValue={editingSchedule?.notes || ""}
              placeholder="Catatan schedule, scope, atau remark lainnya..."
            />
          </label>

          <button type="submit">
            {editingSchedule ? "Update Schedule" : "Add Schedule"}
          </button>
        </form>

        <section className="panel">
          <div className="panel-head">
            <h2>Maintenance Schedule List</h2>
            <p>Schedule maintenance yang sudah terdaftar.</p>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Planned Date</th>
                  <th>Actual Date</th>
                  <th>Schedule Code</th>
                  <th>Asset</th>
                  <th>Scope</th>
                  <th>Activity</th>
                  <th>Frequency</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>

              <tbody>
                {schedules.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="actions">
                        <Link
                          href={`/lab/fire-maintenance/schedules?edit=${item.id}`}
                          className="edit-link"
                        >
                          Edit
                        </Link>

                        <form action={deleteSchedule}>
                          <input type="hidden" name="schedule_id" value={item.id} />
                          <button type="submit" className="delete-button">
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>

                    <td>{formatDate(item.planned_date)}</td>
                    <td>{formatDate(item.actual_date)}</td>
                    <td>
                      <strong>{item.schedule_code}</strong>
                    </td>
                    <td>
                      <strong>{item.fire_assets?.asset_code || "-"}</strong>
                      <br />
                      <span>{item.fire_assets?.asset_name || "-"}</span>
                    </td>
                    <td>
                      {item.fire_scope_templates?.system_group || "-"}
                      <br />
                      <span>{item.fire_scope_templates?.scope_title || "-"}</span>
                    </td>
                    <td>{item.activity_type}</td>
                    <td>{item.frequency}</td>
                    <td>{item.assigned_to || "-"}</td>
                    <td>
                      <span className={badgeClass(item.status)}>{item.status}</span>
                    </td>
                    <td>{item.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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

  .table-wrap {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  th {
    text-align: left;
    color: #64748b;
    border-bottom: 1px solid #e2e8f0;
    padding: 10px 8px;
    font-size: 12px;
    text-transform: uppercase;
    white-space: nowrap;
  }

  td {
    border-bottom: 1px solid #f1f5f9;
    padding: 12px 8px;
    vertical-align: top;
  }

  td span {
    color: #64748b;
    font-size: 12px;
  }

  .actions {
    display: flex;
    gap: 8px;
    align-items: center;
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

  .badge.planned {
    background: #eff6ff;
    color: #1d4ed8;
    border-color: #bfdbfe;
  }

  .badge.done {
    background: #ecfdf5;
    color: #047857;
    border-color: #a7f3d0;
  }

  .badge.overdue {
    background: #fef2f2;
    color: #b91c1c;
    border-color: #fecaca;
  }

  .badge.cancelled {
    background: #f1f5f9;
    color: #475569;
    border-color: #cbd5e1;
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

  @media (max-width: 1000px) {
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
