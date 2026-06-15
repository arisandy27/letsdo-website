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

function monthStartIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}-01`;
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

async function createInspection(formData) {
  "use server";

  const supabase = getSupabaseClient();

  if (!supabase) {
    redirect("/lab/fire-maintenance/inspections?error=env");
  }

  const projectId = formData.get("project_id");
  const assetId = formData.get("asset_id");
  const scheduleId = formData.get("schedule_id");
  const inspectionDate = formData.get("inspection_date") || todayIso();

  const checklist = {
    visual_condition: formData.get("visual_condition") === "on",
    access_clear: formData.get("access_clear") === "on",
    signage_ok: formData.get("signage_ok") === "on",
    panel_normal: formData.get("panel_normal") === "on",
    pressure_ok: formData.get("pressure_ok") === "on",
    no_leak_damage: formData.get("no_leak_damage") === "on",
  };

  const { error } = await supabase.from("fire_inspections").insert({
    project_id: projectId,
    asset_id: assetId || null,
    schedule_id: scheduleId || null,
    inspection_date: inspectionDate,
    inspector_name: formData.get("inspector_name") || "Fire Kelas A Support",
    overall_condition: formData.get("overall_condition") || "good",
    checklist,
    summary: formData.get("summary") || null,
    report_month: monthStartIso(),
    status: "submitted",
  });

  if (error) {
    redirect("/lab/fire-maintenance/inspections?error=insert");
  }

  if (scheduleId) {
    await supabase
      .from("fire_maintenance_schedules")
      .update({
        status: "done",
        actual_date: inspectionDate,
      })
      .eq("id", scheduleId);
  }

  if (assetId) {
    const { data: nextSchedule } = await supabase
      .from("fire_maintenance_schedules")
      .select("planned_date")
      .eq("asset_id", assetId)
      .gt("planned_date", inspectionDate)
      .neq("status", "done")
      .neq("status", "cancelled")
      .order("planned_date", { ascending: true })
      .limit(1)
      .maybeSingle();

    await supabase
      .from("fire_assets")
      .update({
        last_inspection_date: inspectionDate,
        next_inspection_date: nextSchedule?.planned_date || null,
      })
      .eq("id", assetId);
  }

  revalidatePath("/lab/fire-maintenance/inspections");
  revalidatePath("/lab/fire-maintenance/schedules");
  revalidatePath("/lab/fire-maintenance/assets");
  revalidatePath("/lab/fire-maintenance/timeline");
  revalidatePath("/lab/fire-maintenance/reports");
  revalidatePath("/lab/fire-maintenance");
  redirect("/lab/fire-maintenance/inspections?created=1");
}

async function loadPageData() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      error:
        "Supabase env belum terbaca. Cek .env.local: NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const [projectRes, assetsRes, schedulesRes, inspectionsRes] = await Promise.all([
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
      .from("fire_maintenance_schedules")
      .select("*, fire_assets(asset_code, asset_name)")
      .order("planned_date", { ascending: true }),
    supabase
      .from("fire_inspections")
      .select("*, fire_assets(asset_code, asset_name), fire_maintenance_schedules(schedule_code)")
      .order("inspection_date", { ascending: false })
      .limit(10),
  ]);

  const error =
    projectRes.error ||
    assetsRes.error ||
    schedulesRes.error ||
    inspectionsRes.error;

  if (error) return { error: error.message };

  return {
    project: projectRes.data,
    assets: assetsRes.data || [],
    schedules: schedulesRes.data || [],
    inspections: inspectionsRes.data || [],
  };
}

export default async function FireInspectionPage({ searchParams }) {
  const data = await loadPageData();

  if (data.error) {
    return (
      <main className="page">
        <style>{css}</style>
        <section className="error-box">
          <h1>Inspection Form</h1>
          <p>{data.error}</p>
        </section>
      </main>
    );
  }

  const { project, assets, schedules, inspections } = data;
  const created = searchParams?.created;
  const error = searchParams?.error;

  return (
    <main className="page">
      <style>{css}</style>

      <section className="hero">
        <div>
          <Link href="/lab/fire-maintenance" className="back-link">
            ← Back to Fire Dashboard
          </Link>

          <div className="eyebrow">Fire Maintenance Pro</div>
          <h1>Inspection Form</h1>
          <p>
            Form input hasil inspeksi fire protection untuk visit bulanan,
            K3 inspection, dan dasar monthly report.
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

      {created && <div className="success-box">Inspection record berhasil disimpan.</div>}
      {error && <div className="error-box">Ada error saat menyimpan inspection record.</div>}

      <section className="two-col">
        <form action={createInspection} className="panel">
          <div className="panel-head">
            <h2>New Inspection Record</h2>
            <p>Input hasil inspeksi asset fire protection.</p>
          </div>

          <input type="hidden" name="project_id" value={project?.id || ""} />

          <label>
            Inspection Date
            <input type="date" name="inspection_date" defaultValue={todayIso()} />
          </label>

          <label>
            Inspector Name
            <input
              type="text"
              name="inspector_name"
              defaultValue="Fire Kelas A Support"
              placeholder="Inspector name"
            />
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
            Related Schedule
            <select name="schedule_id">
              <option value="">No related schedule</option>
              {schedules.map((schedule) => {
                const scopeTitle =
                  schedule.fire_scope_templates?.scope_title ||
                  schedule.activity_type ||
                  "Schedule";

                const systemGroup =
                  schedule.fire_scope_templates?.system_group ||
                  schedule.fire_assets?.asset_code ||
                  "General";

                const frequency =
                  schedule.fire_scope_templates?.frequency ||
                  schedule.frequency ||
                  "-";

                return (
                  <option key={schedule.id} value={schedule.id}>
                    {formatDate(schedule.planned_date)} | {frequency} | {systemGroup} | {scopeTitle} ({schedule.schedule_code})
                  </option>
                );
              })}
            </select>
          </label>

          <label>
            Overall Condition
            <select name="overall_condition">
              <option value="good">Good</option>
              <option value="watch">Watch</option>
              <option value="fail">Fail</option>
            </select>
          </label>

          <div className="checklist">
            <div className="check-title">Checklist</div>

            <label className="check">
              <input type="checkbox" name="visual_condition" defaultChecked />
              Visual condition OK
            </label>

            <label className="check">
              <input type="checkbox" name="access_clear" defaultChecked />
              Access clear
            </label>

            <label className="check">
              <input type="checkbox" name="signage_ok" defaultChecked />
              Signage / label OK
            </label>

            <label className="check">
              <input type="checkbox" name="panel_normal" />
              Panel / indicator normal
            </label>

            <label className="check">
              <input type="checkbox" name="pressure_ok" />
              Pressure / gauge OK
            </label>

            <label className="check">
              <input type="checkbox" name="no_leak_damage" defaultChecked />
              No leak / physical damage
            </label>
          </div>

          <label>
            Summary / Notes
            <textarea
              name="summary"
              rows="4"
              placeholder="Contoh: panel normal, area clear, signage perlu improvement..."
            />
          </label>

          <button type="submit">Save Inspection</button>
        </form>

        <section className="panel">
          <div className="panel-head">
            <h2>Recent Inspections</h2>
            <p>Record inspeksi terakhir yang sudah tersimpan.</p>
          </div>

          <div className="inspection-list">
            {inspections.map((item) => (
              <div className="inspection-card" key={item.id}>
                <div className="inspection-top">
                  <strong>{formatDate(item.inspection_date)}</strong>
                  <span className={badgeClass(item.overall_condition)}>
                    {item.overall_condition}
                  </span>
                </div>

                <div className="inspection-title">
                  {item.fire_assets?.asset_code || "-"} - {item.fire_assets?.asset_name || "-"}
                </div>

                <div className="inspection-meta">
                  Inspector: {item.inspector_name || "-"}
                </div>

                <div className="inspection-meta">
                  Schedule: {item.fire_maintenance_schedules?.schedule_code || "-"}
                </div>

                <div className="inspection-summary">{item.summary || "-"}</div>

                <span className={badgeClass(item.status)}>{item.status}</span>
              </div>
            ))}

            {inspections.length === 0 && (
              <div className="empty-box">Belum ada inspection record.</div>
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

  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .panel {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 18px;
    box-shadow: 0 8px 20px rgba(15,23,42,.04);
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

  .checklist {
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    border-radius: 14px;
    padding: 12px;
    margin-bottom: 12px;
  }

  .check-title {
    font-weight: 900;
    margin-bottom: 8px;
  }

  .check {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-weight: 700;
  }

  .check input {
    width: auto;
  }

  .inspection-list {
    display: grid;
    gap: 10px;
  }

  .inspection-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 12px;
  }

  .inspection-top {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 8px;
  }

  .inspection-title {
    font-weight: 900;
    margin-bottom: 6px;
  }

  .inspection-meta,
  .inspection-summary {
    color: #64748b;
    font-size: 12px;
    line-height: 1.5;
    margin-bottom: 6px;
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

  .badge.good,
  .badge.submitted {
    background: #ecfdf5;
    color: #047857;
    border-color: #a7f3d0;
  }

  .badge.watch {
    background: #fff7ed;
    color: #c2410c;
    border-color: #fed7aa;
  }

  .badge.fail {
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
    .two-col {
      grid-template-columns: 1fr;
    }
  }
`;


