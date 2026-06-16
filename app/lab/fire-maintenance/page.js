import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

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

  const projectRes = await supabase
    .from("fire_projects")
    .select("*")
    .eq("project_code", PROJECT_CODE)
    .maybeSingle();

  const project = projectRes.data || {};
  const projectId = project?.id;

  const [
    summaryRes,
    assetsRes,
    schedulesRes,
    findingsRes,
    trainingsRes,
    reportsRes,
    mappingSummaryRes,
  ] = await Promise.all([
    supabase.from("v_fire_dashboard_summary").select("*").limit(1).maybeSingle(),

    projectId
      ? supabase
          .from("fire_assets")
          .select("*")
          .eq("project_id", projectId)
          .order("asset_code", { ascending: true })
      : Promise.resolve({ data: [] }),

    projectId
      ? supabase
          .from("fire_maintenance_schedules")
          .select("*, fire_assets(asset_code, asset_name, asset_type, area)")
          .eq("project_id", projectId)
          .order("planned_date", { ascending: true })
      : Promise.resolve({ data: [] }),

    projectId
      ? supabase
          .from("fire_findings")
          .select("*, fire_assets(asset_code, asset_name, asset_type, area)")
          .eq("project_id", projectId)
          .order("finding_date", { ascending: false })
      : Promise.resolve({ data: [] }),

    projectId
      ? supabase
          .from("fire_training_records")
          .select("*")
          .eq("project_id", projectId)
          .order("training_date", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),

    projectId
      ? supabase
          .from("fire_monthly_reports")
          .select("*")
          .eq("project_id", projectId)
          .order("report_month", { ascending: false })
          .limit(3)
      : Promise.resolve({ data: [] }),

    supabase
      .from("v_fire_scope_asset_mapping_summary")
      .select("*")
      .order("sort_order", { ascending: true }),
  ]);

  const error =
    projectRes.error ||
    summaryRes.error ||
    assetsRes.error ||
    schedulesRes.error ||
    findingsRes.error ||
    trainingsRes.error ||
    reportsRes.error ||
    mappingSummaryRes.error;

  if (error) return { error: error.message };

  return {
    summary: summaryRes.data || {},
    project,
    assets: assetsRes.data || [],
    schedules: schedulesRes.data || [],
    findings: findingsRes.data || [],
    trainings: trainingsRes.data || [],
    reports: reportsRes.data || [],
    mappingSummary: mappingSummaryRes.data || [],
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

function WorkflowStep({ step, title, text, href, status }) {
  return (
    <Link href={href} className="workflow-card">
      <div className="workflow-step">{step}</div>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
        <span className="workflow-status">{status}</span>
      </div>
    </Link>
  );
}

function ActionGroup({ title, description, items }) {
  return (
    <div className="action-group">
      <div className="action-head">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <div className="action-list">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="action-link">
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function EmptyRow({ colSpan, text }) {
  return (
    <tr>
      <td colSpan={colSpan} className="empty-cell">
        {text}
      </td>
    </tr>
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

  const {
    summary,
    project,
    assets,
    schedules,
    findings,
    trainings,
    reports,
    mappingSummary,
  } = data;

  const projectStatus = project.project_status || "bidding";
  const timelineBasis = project.timeline_basis || "working_schedule";
  const isOfficial =
    projectStatus === "active" || timelineBasis === "official_schedule";

  const openFindings = findings.filter((item) => item.status !== "closed");
  const highCriticalFindings = openFindings.filter((item) =>
    ["high", "critical"].includes(String(item.severity).toLowerCase())
  );

  const activeAssets = assets.filter((item) => item.status === "active");
  const siteVerifiedAssets = assets.filter(
    (item) => item.verification_status === "site_verified"
  );
  const needsVerificationAssets = assets.filter(
    (item) =>
      item.verification_status === "needs_verification" ||
      item.verification_status === "draft" ||
      !item.verification_status
  );

  const mappedScopes = mappingSummary.filter(
    (item) => item.mapping_status === "mapped"
  );
  const notMappedScopes = mappingSummary.filter(
    (item) => item.mapping_status === "not_mapped"
  );

  const overdueSchedules = schedules.filter((item) => item.status === "overdue");
  const plannedSchedules = schedules.filter((item) => item.status === "planned");
  const doneSchedules = schedules.filter((item) => item.status === "done");

  const workflowSteps = [
    {
      step: "01",
      title: "Project Setup",
      text: "Set bidding, planning, or official contract mode.",
      href: "/lab/fire-maintenance/project-setup",
      status: isOfficial ? "Official mode" : "Bidding / planning",
    },
    {
      step: "02",
      title: "Asset Register",
      text: "Manage equipment, protection zone, and device records.",
      href: "/lab/fire-maintenance/asset-register",
      status: `${assets.length} assets`,
    },
    {
      step: "03",
      title: "Asset Verification",
      text: "Confirm documented asset data with field verification.",
      href: "/lab/fire-maintenance/asset-verification",
      status: `${siteVerifiedAssets.length} site verified`,
    },
    {
      step: "04",
      title: "Scope Mapping",
      text: "Connect scope matrix to actual asset records.",
      href: "/lab/fire-maintenance/scope-mapping",
      status: `${mappedScopes.length}/${mappingSummary.length || 0} mapped`,
    },
    {
      step: "05",
      title: "Maintenance Schedule",
      text: "Generate and monitor working or official schedule.",
      href: "/lab/fire-maintenance/schedules",
      status: `${plannedSchedules.length} planned`,
    },
    {
      step: "06",
      title: "Inspection & Evidence",
      text: "Record inspection result and upload supporting evidence.",
      href: "/lab/fire-maintenance/inspections",
      status: "Execution records",
    },
    {
      step: "07",
      title: "Findings & Training",
      text: "Track corrective action and competency record.",
      href: "/lab/fire-maintenance/findings",
      status: `${openFindings.length} open findings`,
    },
    {
      step: "08",
      title: "Report & Analysis",
      text: "Generate monthly report and management insight.",
      href: "/lab/fire-maintenance/reports",
      status: "Report output",
    },
  ];

  return (
    <main className="page">
      <style>{css}</style>

      <section className="hero">
        <div>
          <div className="eyebrow">LetsDo Lab / Fire Maintenance Pro</div>
          <h1>Fire Protection Maintenance Dashboard</h1>
          <p>
            Workflow dashboard untuk mengelola project setup, asset register,
            scope mapping, schedule, inspection, findings, evidence, training,
            timeline, dan monthly report.
          </p>

          <div className="hero-actions">
            <Link href="/lab/fire-maintenance/project-setup" className="primary-link">
              Project Setup / Contract Setup
            </Link>
            <Link href="/lab/fire-maintenance/schedules" className="dark-link">
              Open Schedule
            </Link>
            <Link href="/lab/fire-maintenance/reports" className="dark-link">
              Open Monthly Report
            </Link>
            <Link href="/lab/fire-maintenance/reports/analysis" className="secondary-link">
              Report Analysis
            </Link>
          </div>
        </div>

        <div className="project-box">
          <div className="project-label">Active Project</div>
          <div className="project-title">{project.project_name || "-"}</div>
          <div className="project-meta">{project.site_name || "-"}</div>
          <div className="project-meta">Client: {project.client_name || "-"}</div>
          <div className="project-meta">Vendor: {project.vendor_name || "-"}</div>
          <div className="project-meta">Status: {String(projectStatus).replaceAll("_", " ")}</div>
          <div className="project-meta">Timeline: {String(timelineBasis).replaceAll("_", " ")}</div>
        </div>
      </section>

      <section className="mode-card">
        <div>
          <div className="mode-label">Current Project Mode</div>
          <h2>{isOfficial ? "Official Contract Workflow" : "Bidding / Planning Workflow"}</h2>
          <p>
            {isOfficial
              ? "Official schedule and overdue monitoring are active based on confirmed contract date."
              : "Project is still in bidding/planning mode. Use working schedule and tentative timeline until contract is confirmed."}
          </p>
        </div>

        <Link href="/lab/fire-maintenance/project-setup" className={isOfficial ? "mode-badge official" : "mode-badge planning"}>
          {isOfficial ? "Official" : "Working Schedule"}
        </Link>
      </section>

      <section className="kpi-grid">
        <KpiCard
          label="Total Assets"
          value={summary.total_assets || assets.length}
          note={`${activeAssets.length || summary.active_assets || 0} active assets`}
        />
        <KpiCard
          label="Site Verified"
          value={siteVerifiedAssets.length}
          note={`${needsVerificationAssets.length} need verification`}
        />
        <KpiCard
          label="Scope Mapping"
          value={`${mappedScopes.length}/${mappingSummary.length || 0}`}
          note={`${notMappedScopes.length} not mapped`}
        />
        <KpiCard
          label="Schedule Status"
          value={summary.schedules_this_month || schedules.length}
          note={`${overdueSchedules.length || summary.overdue_schedules || 0} overdue schedule`}
        />
        <KpiCard
          label="Open Findings"
          value={summary.open_findings || openFindings.length}
          note={`${highCriticalFindings.length} high / critical`}
        />
      </section>

      <section className="workflow-section">
        <div className="section-head">
          <div>
            <h2>Fire Maintenance Workflow</h2>
            <p>Alur kerja utama dari project setup sampai report output.</p>
          </div>
        </div>

        <div className="workflow-grid">
          {workflowSteps.map((item) => (
            <WorkflowStep key={item.step} {...item} />
          ))}
        </div>
      </section>

      <section className="quick-actions">
        <div className="section-head">
          <div>
            <h2>Quick Actions by Workflow Area</h2>
            <p>Akses modul berdasarkan alur kerja, bukan hanya daftar tombol.</p>
          </div>
        </div>

        <div className="action-grid">
          <ActionGroup
            title="1. Setup & Readiness"
            description="Project status, scope baseline, and data readiness."
            items={[
              { label: "Project Setup", href: "/lab/fire-maintenance/project-setup" },
              { label: "Data Readiness", href: "/lab/fire-maintenance/data-readiness" },
              { label: "Scope Matrix", href: "/lab/fire-maintenance/scope" },
              { label: "Timeline", href: "/lab/fire-maintenance/timeline" },
            ]}
          />

          <ActionGroup
            title="2. Register & Verification"
            description="Asset, zone, device, and field verification."
            items={[
              { label: "Asset Register", href: "/lab/fire-maintenance/asset-register" },
              { label: "Equipment Register", href: "/lab/fire-maintenance/assets" },
              { label: "Protection Zones", href: "/lab/fire-maintenance/protection-zones" },
              { label: "Device Register", href: "/lab/fire-maintenance/device-register" },
              { label: "Asset Verification", href: "/lab/fire-maintenance/asset-verification" },
            ]}
          />

          <ActionGroup
            title="3. Planning & Execution"
            description="Mapping, schedule, inspection, evidence, and findings."
            items={[
              { label: "Scope Mapping", href: "/lab/fire-maintenance/scope-mapping" },
              { label: "Maintenance Schedule", href: "/lab/fire-maintenance/schedules" },
              { label: "Inspection Form", href: "/lab/fire-maintenance/inspections" },
              { label: "Evidence", href: "/lab/fire-maintenance/evidence" },
              { label: "Findings Tracker", href: "/lab/fire-maintenance/findings" },
            ]}
          />

          <ActionGroup
            title="4. Report & Support"
            description="Training records, monthly reports, and management insight."
            items={[
              { label: "Training Record", href: "/lab/fire-maintenance/training" },
              { label: "Monthly Report", href: "/lab/fire-maintenance/reports" },
              { label: "Report Analysis", href: "/lab/fire-maintenance/reports/analysis" },
              { label: "Print Monthly Report", href: "/lab/fire-maintenance/reports/print?type=monthly" },
            ]}
          />
        </div>
      </section>

      <section className="two-col">
        <div className="panel">
          <div className="panel-head">
            <h2>Upcoming Maintenance Schedule</h2>
            <p>Prioritas inspeksi dan visit berikutnya.</p>
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
                    <td>{item.activity_type || "-"}</td>
                    <td>
                      <span className={badgeClass(item.status)}>{item.status || "-"}</span>
                    </td>
                  </tr>
                ))}

                {schedules.length === 0 && (
                  <EmptyRow colSpan="4" text="No schedule data found." />
                )}
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
                  Asset: {item.fire_assets?.asset_code || "-"} | PIC: {item.pic || "-"} | Due:{" "}
                  {formatDate(item.due_date)}
                </div>
                <div className="finding-action">
                  Action: {item.corrective_action || "-"}
                </div>
                <span className={badgeClass(item.status)}>{item.status}</span>
              </div>
            ))}

            {openFindings.length === 0 && (
              <div className="empty-card">No open findings.</div>
            )}
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
            {assets.slice(0, 8).map((asset) => (
              <div className="asset-card" key={asset.id}>
                <div className="asset-code">{asset.asset_code}</div>
                <div className="asset-name">{asset.asset_name}</div>
                <div className="asset-meta">{asset.asset_type}</div>
                <div className="asset-meta">{asset.area}</div>
                <div className="asset-badges">
                  <span className={badgeClass(asset.asset_level || "equipment")}>
                    {asset.asset_level || "equipment"}
                  </span>
                  <span className={badgeClass(asset.verification_status || "draft")}>
                    {String(asset.verification_status || "draft").replaceAll("_", " ")}
                  </span>
                </div>
              </div>
            ))}

            {assets.length === 0 && (
              <div className="empty-card">No asset data found.</div>
            )}
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

            {reports.length === 0 && (
              <div className="empty-card">No monthly report found.</div>
            )}
          </div>

          <h3>Training Records</h3>
          <div className="mini-list">
            {trainings.map((training) => (
              <div className="mini-card" key={training.id}>
                <div>
                  <strong>{training.training_title}</strong>
                  <p>{formatDate(training.training_date)} | {training.topic}</p>
                  <p>Participants: {training.participants_count || 0}</p>
                </div>
              </div>
            ))}

            {trainings.length === 0 && (
              <div className="empty-card">No training record found.</div>
            )}
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
    grid-template-columns: 1fr 380px;
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
    font-size: 36px;
    line-height: 1.1;
    margin: 0 0 10px;
    letter-spacing: -1px;
  }

  h2 {
    margin: 0;
    font-size: 20px;
  }

  h3 {
    margin: 0;
    font-size: 15px;
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

  .primary-link,
  .dark-link,
  .secondary-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 42px;
    padding: 0 14px;
    border-radius: 10px;
    text-decoration: none;
    font-weight: 900;
    font-size: 14px;
  }

  .primary-link {
    background: #ea580c;
    color: white;
    box-shadow: 0 8px 18px rgba(234,88,12,.22);
  }

  .dark-link {
    background: #0f172a;
    color: white;
  }

  .secondary-link {
    background: white;
    color: #0369a1;
    border: 1px solid #cbd5e1;
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
    line-height: 1.7;
  }

  .mode-card,
  .kpi-card,
  .workflow-section,
  .quick-actions,
  .panel {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 18px;
    box-shadow: 0 8px 20px rgba(15,23,42,.04);
  }

  .mode-card {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    align-items: center;
    margin-bottom: 14px;
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
    min-width: 150px;
    height: 42px;
    padding: 0 16px;
    border-radius: 999px;
    font-weight: 950;
    font-size: 13px;
    text-decoration: none;
  }

  .mode-badge.planning {
    background: #fff7ed;
    color: #c2410c;
  }

  .mode-badge.official {
    background: #ecfdf5;
    color: #047857;
  }

  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 14px;
    margin-bottom: 14px;
  }

  .kpi-label {
    color: #64748b;
    font-size: 13px;
    font-weight: 900;
  }

  .kpi-value {
    font-size: 32px;
    font-weight: 950;
    margin-top: 8px;
  }

  .kpi-note {
    color: #64748b;
    font-size: 13px;
  }

  .workflow-section,
  .quick-actions {
    margin-bottom: 14px;
  }

  .section-head {
    margin-bottom: 14px;
  }

  .workflow-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }

  .workflow-card {
    display: grid;
    grid-template-columns: 46px 1fr;
    gap: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 14px;
    color: inherit;
    text-decoration: none;
  }

  .workflow-card:hover {
    border-color: #fb923c;
    box-shadow: 0 8px 18px rgba(234,88,12,.12);
  }

  .workflow-step {
    width: 42px;
    height: 42px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #ffedd5;
    color: #c2410c;
    font-size: 13px;
    font-weight: 950;
  }

  .workflow-card h3 {
    margin: 0 0 6px;
    font-size: 15px;
  }

  .workflow-card p {
    font-size: 12px;
    line-height: 1.45;
    margin-bottom: 8px;
  }

  .workflow-status {
    display: inline-flex;
    background: white;
    border: 1px solid #e2e8f0;
    color: #334155;
    border-radius: 999px;
    padding: 4px 8px;
    font-size: 11px;
    font-weight: 900;
  }

  .action-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }

  .action-group {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 14px;
  }

  .action-head {
    margin-bottom: 10px;
  }

  .action-head h3 {
    margin-bottom: 6px;
  }

  .action-head p {
    font-size: 12px;
    line-height: 1.45;
  }

  .action-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .action-link {
    display: inline-flex;
    min-height: 34px;
    align-items: center;
    justify-content: center;
    background: white;
    border: 1px solid #cbd5e1;
    color: #0369a1;
    border-radius: 999px;
    padding: 0 11px;
    text-decoration: none;
    font-size: 12px;
    font-weight: 900;
  }

  .action-link:hover {
    border-color: #0284c7;
    background: #f0f9ff;
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
  .mini-card,
  .empty-card {
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

  .empty-card,
  .empty-cell {
    color: #64748b;
    font-size: 13px;
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
  .badge.done,
  .badge.site-verified {
    background: #ecfdf5;
    color: #047857;
    border-color: #a7f3d0;
  }

  .badge.planned,
  .badge.medium,
  .badge.documented,
  .badge.protection-zone {
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
  .badge.high,
  .badge.needs-verification {
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
  .badge.draft,
  .badge.device,
  .badge.equipment {
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

  @media (max-width: 1200px) {
    .kpi-grid,
    .workflow-grid,
    .action-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 900px) {
    .hero,
    .two-col,
    .kpi-grid,
    .workflow-grid,
    .action-grid,
    .asset-grid {
      grid-template-columns: 1fr;
    }
  }
`;