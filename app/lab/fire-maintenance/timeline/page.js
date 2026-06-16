import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import TimelineScopeClient from "./TimelineScopeClient";

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

function formatMonth(value) {
  if (!value) return "-";
  const text = String(value);
  if (text.length < 7) return text;
  return `${text.slice(5, 7)}/${text.slice(0, 4)}`;
}

function numberValue(value) {
  const num = Number(value || 0);
  if (Number.isNaN(num)) return 0;
  return num;
}

function clampPercent(value) {
  const num = numberValue(value);
  if (num < 0) return 0;
  if (num > 100) return 100;
  return num;
}

function frequencyLabel(value) {
  const labels = {
    weekly: "Weekly",
    monthly: "Monthly",
    quarterly: "3 Month / Quarterly",
    semiannual: "6 Month / Semiannual",
    annual: "Annual",
  };

  return labels[value] || value;
}

async function loadTimelineData() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      error:
        "Supabase env belum terbaca. Cek .env.local: NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const [projectRes, contractRes, monthlyRes, frequencyRes, scopeRes] =
    await Promise.all([
      supabase
        .from("fire_projects")
        .select("*")
        .eq("project_code", PROJECT_CODE)
        .maybeSingle(),
      supabase
        .from("v_fire_contract_progress")
        .select("*")
        .limit(1)
        .maybeSingle(),
      supabase
        .from("v_fire_monthly_timeline")
        .select("*")
        .order("month_start", { ascending: true }),
      supabase
        .from("v_fire_frequency_progress")
        .select("*"),
      supabase
        .from("v_fire_scope_item_progress")
        .select("*")
        .order("sort_order", { ascending: true }),
    ]);

  const error =
    projectRes.error ||
    contractRes.error ||
    monthlyRes.error ||
    frequencyRes.error ||
    scopeRes.error;

  if (error) return { error: error.message };

  const frequencyOrder = {
    weekly: 1,
    monthly: 2,
    quarterly: 3,
    semiannual: 4,
    annual: 5,
  };

  const frequencyRows = (frequencyRes.data || []).sort(
    (a, b) =>
      (frequencyOrder[a.frequency] || 99) - (frequencyOrder[b.frequency] || 99)
  );

  return {
    project: projectRes.data || {},
    contract: contractRes.data || {},
    monthly: monthlyRes.data || [],
    frequencyRows,
    scopeRows: scopeRes.data || [],
  };
}

function ProgressBar({ value }) {
  const percent = clampPercent(value);

  return (
    <div className="progress">
      <div className="progress-fill" style={{ width: `${percent}%` }} />
      <span>{percent}%</span>
    </div>
  );
}

export default async function FireTimelinePage() {
  const data = await loadTimelineData();

  if (data.error) {
    return (
      <main className="page">
        <style>{css}</style>
        <section className="error-box">
          <h1>Timeline & Scope Progress</h1>
          <p>{data.error}</p>
        </section>
      </main>
    );
  }

  const { project, contract, monthly, frequencyRows, scopeRows } = data;

  const notScheduled = scopeRows.filter(
    (item) => item.scope_status === "not_scheduled"
  );
  const overdue = scopeRows.filter((item) => item.scope_status === "overdue");
  const dueSoon = scopeRows.filter((item) => item.scope_status === "due_soon");

  const progressGap =
    Number(contract.time_progress_percent || 0) -
    Number(contract.work_progress_percent || 0);

  const timelineInsight =
    overdue.length > 0
      ? `${overdue.length} scope item(s) are overdue and need follow-up.`
      : notScheduled.length > 0
        ? `${notScheduled.length} scope item(s) are not scheduled yet. Generate or verify schedule coverage.`
        : dueSoon.length > 0
          ? `${dueSoon.length} scope item(s) are due soon in the next 14 days.`
          : "Timeline coverage is under control based on current scope progress.";

  return (
    <main className="page">
      <style>{css}</style>

      <section className="hero">
        <div>
          <Link href="/lab/fire-maintenance" style={backLinkStyle}>
            Back to Fire Maintenance Dashboard
          </Link>

          <div className="eyebrow">Fire Maintenance Pro</div>
          <h1>Timeline & Scope Progress</h1>
          <p>
            Tracking progress kontrak tahunan, monthly timeline, frequency
            progress, dan status setiap item lingkup pekerjaan.
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

      <section className="contract-grid">
        <div className="contract-card">
          <div className="label">Contract Period</div>
          <div className="period">
            {formatDate(contract.contract_start)} - {formatDate(contract.contract_end)}
          </div>
          <div className="note">
            {contract.elapsed_days || 0} elapsed days /{" "}
            {contract.total_contract_days || 0} total days
          </div>
        </div>

        <div className="contract-card">
          <div className="label">Time Progress</div>
          <div className="big">{contract.time_progress_percent || 0}%</div>
          <ProgressBar value={contract.time_progress_percent || 0} />
        </div>

        <div className="contract-card">
          <div className="label">Work Progress</div>
          <div className="big">{contract.work_progress_percent || 0}%</div>
          <ProgressBar value={contract.work_progress_percent || 0} />
        </div>

        <div className="contract-card">
          <div className="label">Progress Gap</div>
          <div className="big">{Math.round(progressGap * 10) / 10}%</div>
          <div className="note">
            Positive means time progress is ahead of work progress.
          </div>
        </div>
      </section>

      <section className="panel timeline-insight">
        <div>
          <h2>Timeline Insight</h2>
          <p>{timelineInsight}</p>
        </div>

        <div className="status-line horizontal">
          <span>Done: {contract.done_schedule || 0}</span>
          <span>Planned: {contract.planned_schedule || 0}</span>
          <span>Overdue: {contract.overdue_schedule || 0}</span>
        </div>
      </section>

      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Scope Items</div>
          <div className="kpi-value">{scopeRows.length}</div>
          <div className="kpi-note">Master scope items</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Not Scheduled</div>
          <div className="kpi-value">{notScheduled.length}</div>
          <div className="kpi-note">Need schedule generation</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Due Soon</div>
          <div className="kpi-value">{dueSoon.length}</div>
          <div className="kpi-note">Next 14 days</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Overdue</div>
          <div className="kpi-value">{overdue.length}</div>
          <div className="kpi-note">Need attention</div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Frequency Progress</h2>
          <p>Progress berdasarkan weekly, monthly, 3-month, 6-month, dan annual.</p>
        </div>

        <div className="frequency-grid">
          {frequencyRows.map((row) => (
            <div className="frequency-card" key={row.frequency}>
              <div className="freq-title">{frequencyLabel(row.frequency)}</div>
              <div className="freq-progress">
                {row.avg_progress_percent || 0}%
              </div>
              <ProgressBar value={row.avg_progress_percent || 0} />

              <div className="freq-meta">
                <span>Total scope: {row.total_scope_item || 0}</span>
                <span>Completed: {row.completed_scope_item || 0}</span>
                <span>Overdue: {row.overdue_scope_item || 0}</span>
                <span>Not scheduled: {row.not_scheduled_scope_item || 0}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Monthly Timeline</h2>
          <p>Timeline kontrak dari start sampai end date.</p>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Total Schedule</th>
                <th>Done</th>
                <th>Planned</th>
                <th>Overdue</th>
                <th>Progress</th>
              </tr>
            </thead>

            <tbody>
              {monthly.map((row) => (
                <tr key={row.month_start}>
                  <td>
                    <strong>{formatMonth(row.month_start)}</strong>
                    <br />
                    <span>
                      {formatDate(row.month_start)} - {formatDate(row.month_end)}
                    </span>
                  </td>
                  <td>{row.total_schedule || 0}</td>
                  <td>{row.done_schedule || 0}</td>
                  <td>{row.planned_schedule || 0}</td>
                  <td>{row.overdue_schedule || 0}</td>
                  <td>
                    <ProgressBar value={row.month_progress_percent || 0} />
                  </td>
                </tr>
              ))}

              {monthly.length === 0 && (
                <tr>
                  <td colSpan="6">No monthly timeline data.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <TimelineScopeClient scopeRows={scopeRows} />
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

  .contract-grid,
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 14px;
  }

  .contract-card,
  .kpi-card,
  .panel {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 18px;
    box-shadow: 0 8px 20px rgba(15,23,42,.04);
  }

  .timeline-insight {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .label,
  .kpi-label {
    color: #64748b;
    font-size: 13px;
    font-weight: 900;
  }

  .period {
    font-size: 20px;
    font-weight: 950;
    margin-top: 8px;
  }

  .big,
  .kpi-value {
    font-size: 34px;
    font-weight: 950;
    margin-top: 8px;
  }

  .note,
  .kpi-note {
    color: #64748b;
    font-size: 13px;
  }

  .status-line,
  .freq-meta {
    display: grid;
    gap: 5px;
    margin-top: 10px;
    color: #334155;
    font-size: 13px;
    font-weight: 800;
  }

  .status-line.horizontal {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .status-line.horizontal span {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 999px;
    padding: 8px 10px;
  }

  .panel {
    margin-bottom: 14px;
  }

  .panel-head {
    margin-bottom: 14px;
  }

  .frequency-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 12px;
  }

  .frequency-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 12px;
  }

  .freq-title {
    font-weight: 900;
    color: #ea580c;
    margin-bottom: 8px;
  }

  .freq-progress {
    font-size: 24px;
    font-weight: 950;
    margin-bottom: 8px;
  }

  .progress {
    position: relative;
    height: 22px;
    background: #e2e8f0;
    border-radius: 999px;
    overflow: hidden;
    min-width: 120px;
  }

  .progress-fill {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    background: #ea580c;
  }

  .progress span {
    position: relative;
    z-index: 1;
    display: block;
    text-align: center;
    font-size: 12px;
    font-weight: 900;
    color: #0f172a;
    line-height: 22px;
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

  .error-box {
    background: white;
    border: 1px solid #fecaca;
    color: #b91c1c;
    border-radius: 18px;
    padding: 20px;
    margin-bottom: 14px;
  }

  @media (max-width: 1100px) {
    .contract-grid,
    .kpi-grid,
    .frequency-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 800px) {
    .hero,
    .contract-grid,
    .kpi-grid,
    .frequency-grid {
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