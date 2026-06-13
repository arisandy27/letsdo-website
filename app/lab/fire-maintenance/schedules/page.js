import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

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

async function loadSchedules() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      error:
        "Supabase env belum terbaca. Cek .env.local: NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const { data, error } = await supabase
    .from("fire_maintenance_schedules")
    .select("*, fire_assets(asset_code, asset_name, asset_type, area), fire_projects(project_name, client_name, vendor_name, site_name)")
    .order("planned_date", { ascending: true });

  if (error) return { error: error.message };

  return { schedules: data || [] };
}

export default async function FireMaintenanceSchedulePage() {
  const data = await loadSchedules();

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

  const schedules = data.schedules || [];
  const planned = schedules.filter((item) => item.status === "planned");
  const overdue = schedules.filter((item) => item.status === "overdue");
  const done = schedules.filter((item) => item.status === "done");
  const project = schedules[0]?.fire_projects || {};

  return (
    <main className="page">
      <style>{css}</style>

      <section className="hero">
        <div>
          <Link href="/lab/fire-maintenance" className="back-link">
            ← Back to Fire Dashboard
          </Link>

          <div className="eyebrow">Fire Maintenance Pro</div>
          <h1>Maintenance Schedule</h1>
          <p>
            Jadwal inspeksi dan maintenance fire protection untuk visit bulanan,
            K3 inspection, corrective action, dan monthly report.
          </p>
        </div>

        <div className="project-box">
          <div className="project-label">Project</div>
          <div className="project-title">{project.project_name || "-"}</div>
          <div className="project-meta">{project.site_name || "-"}</div>
          <div className="project-meta">Client: {project.client_name || "-"}</div>
          <div className="project-meta">Vendor: {project.vendor_name || "-"}</div>
        </div>
      </section>

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

      <section className="panel">
        <div className="panel-head">
          <h2>Maintenance Schedule List</h2>
          <p>Schedule awal untuk fire alarm, CO2, FM-200, deluge, hydrant, dan APAR.</p>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Planned Date</th>
                <th>Actual Date</th>
                <th>Schedule Code</th>
                <th>Asset</th>
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

  .panel-head {
    margin-bottom: 14px;
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

  .error-box {
    background: white;
    border: 1px solid #fecaca;
    color: #b91c1c;
    border-radius: 18px;
    padding: 20px;
  }

  @media (max-width: 900px) {
    .hero,
    .kpi-grid {
      grid-template-columns: 1fr;
    }
  }
`;
