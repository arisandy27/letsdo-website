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

async function loadDashboard() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      error:
        "Supabase env belum terbaca. Cek .env.local: NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const [
    summaryRes,
    projectRes,
    assetsRes,
    schedulesRes,
    findingsRes,
    trainingsRes,
    reportsRes,
  ] = await Promise.all([
    supabase.from("v_fire_dashboard_summary").select("*").limit(1).maybeSingle(),
    supabase.from("fire_projects").select("*").order("created_at", { ascending: true }).limit(1).maybeSingle(),
    supabase.from("fire_assets").select("*").order("asset_code", { ascending: true }),
    supabase.from("fire_maintenance_schedules").select("*, fire_assets(asset_code, asset_name, asset_type, area)").order("planned_date", { ascending: true }),
    supabase.from("fire_findings").select("*, fire_assets(asset_code, asset_name, asset_type, area)").order("finding_date", { ascending: false }),
    supabase.from("fire_training_records").select("*").order("training_date", { ascending: false }).limit(5),
    supabase.from("fire_monthly_reports").select("*").order("report_month", { ascending: false }).limit(3),
  ]);

  const error =
    summaryRes.error ||
    projectRes.error ||
    assetsRes.error ||
    schedulesRes.error ||
    findingsRes.error ||
    trainingsRes.error ||
    reportsRes.error;

  if (error) return { error: error.message };

  return {
    summary: summaryRes.data || {},
    project: projectRes.data || {},
    assets: assetsRes.data || [],
    schedules: schedulesRes.data || [],
    findings: findingsRes.data || [],
    trainings: trainingsRes.data || [],
    reports: reportsRes.data || [],
  };
}

function KpiCard({ label, value, note }) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-note">{note}</div>
    </div>
  );
}

export default async function FireMaintenancePage() {
  const data = await loadDashboard();

  if (data.error) {
    return (
      <main className="page">
        <style>{css}</style>
        <section className="error-box">
          <h1>Fire Maintenance Pro</h1>
          <p>{data.error}</p>
        </section>
      </main>
    );
  }

  const { summary, project, assets, schedules, findings, trainings, reports } = data;

  const openFindings = findings.filter((item) => item.status !== "closed");
  const highCriticalFindings = openFindings.filter((item) =>
    ["high", "critical"].includes(String(item.severity).toLowerCase())
  );

  return (
    <main className="page">
      <style>{css}</style>

      <section className="hero">
        <div>
          <div className="eyebrow">LetsDo Lab / Fire Maintenance Pro</div>
          <h1>Fire Protection Maintenance Dashboard</h1>
                    <p>
            Monitoring asset fire protection, schedule maintenance,
            inspection, finding/action tracker, monthly report, dan training
            record.
          </p>

          <p style={{ marginTop: 18 }}>
            <a
              href="/lab/fire-maintenance/assets"
              style={{
                display: "inline-flex",
                background: "#ea580c",
                color: "white",
                textDecoration: "none",
                fontWeight: 900,
                padding: "10px 14px",
                borderRadius: 12,
              }}
            >
              Open Asset Register →
            </a>

            <a
              href="/lab/fire-maintenance/schedules"
              style={{
                display: "inline-flex",
                background: "#0f172a",
                color: "white",
                textDecoration: "none",
                fontWeight: 900,
                padding: "10px 14px",
                borderRadius: 12,
                marginLeft: 10,
              }}
            >
              Open Maintenance Schedule →
            </a>

            <a
              href="/lab/fire-maintenance/inspections"
              style={{
                display: "inline-flex",
                background: "#047857",
                color: "white",
                textDecoration: "none",
                fontWeight: 900,
                padding: "10px 14px",
                borderRadius: 12,
                marginLeft: 10,
              }}
            >
              Open Inspection Form →
            </a>
          </p>
        </div>

        <div className="project-box">
          <div className="project-label">Active Project</div>
          <div className="project-title">{project.project_name || "-"}</div>
          <div className="project-meta">{project.site_name || "-"}</div>
          <div className="project-meta">Client: {project.client_name || "-"}</div>
          <div className="project-meta">Vendor: {project.vendor_name || "-"}</div>
        </div>
      </section>

      <section className="kpi-grid">
        <KpiCard
          label="Total Assets"
          value={summary.total_assets || 0}
          note={`${summary.active_assets || 0} active assets`}
        />
        <KpiCard
          label="Schedule This Month"
          value={summary.schedules_this_month || 0}
          note={`${summary.overdue_schedules || 0} overdue schedule`}
        />
        <KpiCard
          label="Open Findings"
          value={summary.open_findings || 0}
          note={`${highCriticalFindings.length} high / critical`}
        />
        <KpiCard
          label="Training Records"
          value={summary.training_records || 0}
          note="Awareness & technical class"
        />
      </section>

      <section className="two-col">
        <div className="panel">
          <div className="panel-head">
            <h2>Upcoming Maintenance Schedule</h2>
            <p>Prioritas inspeksi dan visit bulanan.</p>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Asset</th>
                  <th>Activity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {schedules.slice(0, 6).map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.planned_date)}</td>
                    <td>
                      <strong>{item.fire_assets?.asset_code || "-"}</strong>
                      <br />
                      <span>{item.fire_assets?.asset_name || "-"}</span>
                    </td>
                    <td>{item.activity_type}</td>
                    <td>
                      <span className={badgeClass(item.status)}>{item.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Open Findings / Action Tracker</h2>
            <p>Finding terbuka yang harus ditindaklanjuti.</p>
          </div>

          <div className="finding-list">
            {openFindings.slice(0, 6).map((item) => (
              <div className="finding-card" key={item.id}>
                <div className="finding-top">
                  <strong>{item.finding_no}</strong>
                  <span className={badgeClass(item.severity)}>{item.severity}</span>
                </div>
                <div className="finding-title">{item.description}</div>
                <div className="finding-meta">
                  Asset: {item.fire_assets?.asset_code || "-"} · PIC: {item.pic || "-"} · Due:{" "}
                  {formatDate(item.due_date)}
                </div>
                <div className="finding-action">
                  Action: {item.corrective_action || "-"}
                </div>
                <span className={badgeClass(item.status)}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="two-col">
        <div className="panel">
          <div className="panel-head">
            <h2>Asset Register Snapshot</h2>
            <p>Ringkasan asset utama fire protection.</p>
          </div>

          <div className="asset-grid">
            {assets.map((asset) => (
              <div className="asset-card" key={asset.id}>
                <div className="asset-code">{asset.asset_code}</div>
                <div className="asset-name">{asset.asset_name}</div>
                <div className="asset-meta">{asset.asset_type}</div>
                <div className="asset-meta">{asset.area}</div>
                <div className="asset-badges">
                  <span className={badgeClass(asset.criticality)}>{asset.criticality}</span>
                  <span className={badgeClass(asset.status)}>{asset.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Monthly Report & Training</h2>
            <p>Tracking report bulanan dan record pelatihan.</p>
          </div>

          <h3>Monthly Report</h3>
          <div className="mini-list">
            {reports.map((report) => (
              <div className="mini-card" key={report.id}>
                <div>
                  <strong>{formatDate(report.report_month)}</strong>
                  <p>{report.summary}</p>
                </div>
                <span className={badgeClass(report.status)}>{report.status}</span>
              </div>
            ))}
          </div>

          <h3>Training Records</h3>
          <div className="mini-list">
            {trainings.map((training) => (
              <div className="mini-card" key={training.id}>
                <div>
                  <strong>{training.training_title}</strong>
                  <p>{formatDate(training.training_date)} · {training.topic}</p>
                  <p>Participants: {training.participants_count || 0}</p>
                </div>
              </div>
            ))}
          </div>
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

  .eyebrow {
    color: #ea580c;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: .4px;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  h1 {
    font-size: 34px;
    line-height: 1.1;
    margin: 0 0 10px;
  }

  h2 {
    margin: 0;
    font-size: 18px;
  }

  h3 {
    margin: 18px 0 8px;
    font-size: 14px;
  }

  p {
    color: #64748b;
    line-height: 1.55;
    margin: 0;
  }

  .hero-actions {
    margin-top: 18px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .primary-link {
    display: inline-flex;
    align-items: center;
    background: #ea580c;
    color: white;
    text-decoration: none;
    font-weight: 900;
    padding: 10px 14px;
    border-radius: 12px;
    box-shadow: 0 8px 18px rgba(234,88,12,.22);
  }

  .primary-link:hover {
    background: #c2410c;
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
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-bottom: 14px;
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

  .finding-list {
    display: grid;
    gap: 10px;
  }

  .finding-card,
  .asset-card,
  .mini-card {
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

  .finding-top strong,
  .asset-code {
    color: #ea580c;
    font-weight: 900;
  }

  .finding-title,
  .asset-name {
    font-weight: 900;
    margin-bottom: 6px;
  }

  .finding-meta,
  .finding-action,
  .asset-meta {
    color: #64748b;
    font-size: 12px;
    line-height: 1.5;
    margin-bottom: 8px;
  }

  .asset-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .asset-badges {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 10px;
  }

  .mini-list {
    display: grid;
    gap: 10px;
  }

  .mini-card {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .mini-card p {
    font-size: 12px;
    margin-top: 4px;
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

  .badge.active,
  .badge.done {
    background: #ecfdf5;
    color: #047857;
    border-color: #a7f3d0;
  }

  .badge.planned,
  .badge.medium {
    background: #eff6ff;
    color: #1d4ed8;
    border-color: #bfdbfe;
  }

  .badge.overdue,
  .badge.critical {
    background: #fef2f2;
    color: #b91c1c;
    border-color: #fecaca;
  }

  .badge.open,
  .badge.high {
    background: #fff7ed;
    color: #c2410c;
    border-color: #fed7aa;
  }

  .badge.in-progress {
    background: #fefce8;
    color: #a16207;
    border-color: #fde68a;
  }

  .badge.low,
  .badge.draft {
    background: #f1f5f9;
    color: #475569;
    border-color: #cbd5e1;
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
    .two-col,
    .kpi-grid {
      grid-template-columns: 1fr;
    }
  }
`;




