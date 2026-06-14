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

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "-";
  const text = String(value);
  if (text.length < 10) return text;
  return `${text.slice(8, 10)}/${text.slice(5, 7)}/${text.slice(0, 4)}`;
}

function reportTypeLabel(type) {
  const labels = {
    monthly: "Monthly Report",
    quarterly: "3-Month / Quarterly Report",
    semester: "6-Month / Semiannual Report",
    annual: "Annual Report",
  };

  return labels[type] || "Monthly Report";
}

function frequencyLabel(value) {
  const labels = {
    weekly: "Weekly",
    monthly: "Monthly",
    quarterly: "3 Month / Quarterly",
    semiannual: "6 Month / Semiannual",
    annual: "1 Year / Annual",
  };

  return labels[value] || value;
}

function includedFrequencies(type) {
  if (type === "annual") return ["weekly", "monthly", "quarterly", "semiannual", "annual"];
  if (type === "semester") return ["weekly", "monthly", "quarterly", "semiannual"];
  if (type === "quarterly") return ["weekly", "monthly", "quarterly"];
  return ["weekly", "monthly"];
}

function frequencyOrder(value) {
  const order = {
    weekly: 1,
    monthly: 2,
    quarterly: 3,
    semiannual: 4,
    annual: 5,
  };

  return order[value] || 99;
}

function formatMonth(value) {
  if (!value) return "-";
  const text = String(value);
  if (text.length < 7) return text;
  return `${text.slice(5, 7)}/${text.slice(0, 4)}`;
}

function statusText(value) {
  return String(value || "-").replaceAll("_", " ");
}

function includeEvidenceInReport(item, type) {
  const reportType = item.report_type;

  // General evidence without report_type will appear in all reports.
  if (!reportType) return true;

  // Report-specific evidence only appears in the matching report type.
  return reportType === type;
}

async function loadPrintData() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      error:
        "Supabase env belum terbaca. Cek .env.local: NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const [
    projectRes,
    dashboardRes,
    scopesRes,
    schedulesRes,
    inspectionsRes,
    findingsRes,
    trainingsRes,
    reportsRes,
    attachmentsRes,
  ] = await Promise.all([
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
      .from("fire_scope_templates")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("fire_maintenance_schedules")
      .select("*, fire_assets(asset_code, asset_name, asset_type, area)")
      .order("planned_date", { ascending: true }),
    supabase
      .from("fire_inspections")
      .select("*, fire_assets(asset_code, asset_name)")
      .order("inspection_date", { ascending: false })
      .limit(20),
    supabase
      .from("fire_findings")
      .select("*, fire_assets(asset_code, asset_name, asset_type, area)")
      .order("finding_date", { ascending: false }),
    supabase
      .from("fire_training_records")
      .select("*")
      .order("training_date", { ascending: false }),
    supabase
      .from("fire_monthly_reports")
      .select("*")
      .order("report_month", { ascending: false })
      .limit(1),
    supabase
      .from("fire_attachments")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  const error =
    projectRes.error ||
    dashboardRes.error ||
    scopesRes.error ||
    schedulesRes.error ||
    inspectionsRes.error ||
    findingsRes.error ||
    trainingsRes.error ||
    reportsRes.error ||
    attachmentsRes.error;

  if (error) return { error: error.message };

  return {
    project: projectRes.data || {},
    dashboard: dashboardRes.data || {},
    scopes: scopesRes.data || [],
    schedules: schedulesRes.data || [],
    inspections: inspectionsRes.data || [],
    findings: findingsRes.data || [],
    trainings: trainingsRes.data || [],
    latestReport: reportsRes.data?.[0] || null,
    attachments: await Promise.all(
      (attachmentsRes.data || []).map(async (item) => {
        let signedUrl = item.file_url || null;

        if (!signedUrl && item.file_path) {
          const { data: signedData } = await supabase.storage
            .from(item.storage_bucket || "lab-files")
            .createSignedUrl(item.file_path, 60 * 60);

          signedUrl = signedData?.signedUrl || null;
        }

        return {
          ...item,
          signed_url: signedUrl,
        };
      })
    ),
  };
}

export default async function FirePrintableReportPage({ searchParams }) {
  const params = await searchParams;
  const type = params?.type || "monthly";
  const data = await loadPrintData();

  if (data.error) {
    return (
      <main className="page">
        <style>{css}</style>
        <section className="error-box">
          <h1>Printable Report</h1>
          <p>{data.error}</p>
        </section>
      </main>
    );
  }

  const {
    project,
    dashboard,
    scopes,
    schedules,
    inspections,
    findings,
    trainings,
    latestReport,
    attachments,
  } = data;

  const included = includedFrequencies(type);

  const reportScopes = scopes.filter((scope) => included.includes(scope.frequency));

  const scopeGroups = reportScopes.reduce((acc, item) => {
    if (!acc[item.frequency]) acc[item.frequency] = [];
    acc[item.frequency].push(item);
    return acc;
  }, {});

  const sortedScopeGroups = Object.keys(scopeGroups)
    .sort((a, b) => frequencyOrder(a) - frequencyOrder(b))
    .map((frequency) => ({
      frequency,
      items: scopeGroups[frequency],
    }));

  const openFindings = findings.filter((item) => item.status !== "closed");
  const closedFindings = findings.filter((item) => item.status === "closed");
  const highCriticalFindings = findings.filter(
    (item) =>
      item.status !== "closed" &&
      ["high", "critical"].includes(String(item.severity).toLowerCase())
  );

  const doneSchedules = schedules.filter((item) => item.status === "done");
  const overdueSchedules = schedules.filter((item) => item.status === "overdue");

  const reportAttachments = attachments.filter((item) =>
    includeEvidenceInReport(item, type)
  );

  return (
    <main className="page">
      <style>{css}</style>

      <section className="toolbar no-print">
        <Link href="/lab/fire-maintenance/reports" className="back-link">
          ← Back to Monthly Report
        </Link>

        <div className="type-links">
          <a href="/lab/fire-maintenance/reports/print?type=monthly">Monthly</a>
          <a href="/lab/fire-maintenance/reports/print?type=quarterly">3 Month</a>
          <a href="/lab/fire-maintenance/reports/print?type=semester">6 Month</a>
          <a href="/lab/fire-maintenance/reports/print?type=annual">Annual</a>
        </div>

        <div className="print-note">Use CTRL + P → Save as PDF</div>
      </section>

      <section className="cover">
        <div>
          <div className="eyebrow">Fire Maintenance Pro</div>
          <h1>{reportTypeLabel(type)}</h1>
          <p className="subtitle">
            Fire Protection Maintenance Report based on actual maintenance scope,
            schedule, inspection, findings, and training records.
          </p>
        </div>

        <div className="project-box">
          <div className="project-label">Project</div>
          <div className="project-title">{project.project_name || "-"}</div>
          <div>Site: {project.site_name || "-"}</div>
          <div>Client: {project.client_name || "-"}</div>
          <div>Vendor: {project.vendor_name || "-"}</div>
          <div>Generated: {formatDate(todayIso())}</div>
        </div>
      </section>

      <section className="section">
        <h2>1. Executive Summary</h2>

        <div className="summary-box">
          <p>
            This report summarizes fire protection maintenance activities,
            inspection status, findings/action tracker, scope compliance, and
            training records for the selected reporting period.
          </p>

          {latestReport?.summary && (
            <p>
              <strong>Latest monthly summary:</strong> {latestReport.summary}
            </p>
          )}
        </div>

        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-label">Total Assets</div>
            <div className="kpi-value">{dashboard.total_assets || 0}</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Schedule This Month</div>
            <div className="kpi-value">{dashboard.schedules_this_month || 0}</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Open Findings</div>
            <div className="kpi-value">{openFindings.length}</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">High / Critical</div>
            <div className="kpi-value">{highCriticalFindings.length}</div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>2. Scope Coverage</h2>
        <p className="section-desc">
          Scope coverage follows the actual maintenance frequency matrix:
          weekly, monthly, quarterly/3-month, semiannual/6-month, and annual.
        </p>

        {sortedScopeGroups.map((group) => (
          <div className="scope-group" key={group.frequency}>
            <h3>{frequencyLabel(group.frequency)}</h3>

            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>System</th>
                  <th>Scope</th>
                  <th>Execution Mode</th>
                  <th>Photo</th>
                  <th>Test Result</th>
                </tr>
              </thead>

              <tbody>
                {group.items.map((scope, index) => (
                  <tr key={scope.id}>
                    <td>{index + 1}</td>
                    <td>{scope.system_group}</td>
                    <td>
                      <strong>{scope.scope_title}</strong>
                      <br />
                      <span>{scope.scope_detail}</span>
                    </td>
                    <td>{scope.execution_mode}</td>
                    <td>{scope.requires_photo ? "Required" : "-"}</td>
                    <td>{scope.requires_test_result ? "Required" : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </section>

      <section className="section">
        <h2>3. Maintenance Schedule Status</h2>

        <div className="mini-kpi">
          <span>Total: {schedules.length}</span>
          <span>Done: {doneSchedules.length}</span>
          <span>Overdue: {overdueSchedules.length}</span>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Schedule Code</th>
              <th>Asset</th>
              <th>Activity</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {schedules.slice(0, 12).map((item) => (
              <tr key={item.id}>
                <td>{formatDate(item.planned_date)}</td>
                <td>{item.schedule_code}</td>
                <td>
                  {item.fire_assets?.asset_code || "-"} -{" "}
                  {item.fire_assets?.asset_name || "-"}
                </td>
                <td>{item.activity_type}</td>
                <td>{statusText(item.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="section">
        <h2>4. Inspection Summary</h2>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Asset</th>
              <th>Inspector</th>
              <th>Condition</th>
              <th>Summary</th>
            </tr>
          </thead>

          <tbody>
            {inspections.slice(0, 10).map((item) => (
              <tr key={item.id}>
                <td>{formatDate(item.inspection_date)}</td>
                <td>
                  {item.fire_assets?.asset_code || "-"} -{" "}
                  {item.fire_assets?.asset_name || "-"}
                </td>
                <td>{item.inspector_name || "-"}</td>
                <td>{statusText(item.overall_condition)}</td>
                <td>{item.summary || "-"}</td>
              </tr>
            ))}

            {inspections.length === 0 && (
              <tr>
                <td colSpan="5">No inspection record.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="section">
        <h2>5. Findings & Corrective Action</h2>

        <div className="mini-kpi">
          <span>Open: {openFindings.length}</span>
          <span>Closed: {closedFindings.length}</span>
          <span>High/Critical: {highCriticalFindings.length}</span>
        </div>

        <table>
          <thead>
            <tr>
              <th>Finding No</th>
              <th>Asset</th>
              <th>Severity</th>
              <th>Description</th>
              <th>Action</th>
              <th>PIC</th>
              <th>Due</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {findings.map((item) => (
              <tr key={item.id}>
                <td>{item.finding_no}</td>
                <td>{item.fire_assets?.asset_code || "-"}</td>
                <td>{statusText(item.severity)}</td>
                <td>{item.description}</td>
                <td>{item.corrective_action || "-"}</td>
                <td>{item.pic || "-"}</td>
                <td>{formatDate(item.due_date)}</td>
                <td>{statusText(item.status)}</td>
              </tr>
            ))}

            {findings.length === 0 && (
              <tr>
                <td colSpan="8">No finding record.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="section">
        <h2>6. Training Record</h2>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Training Title</th>
              <th>Topic</th>
              <th>Trainer</th>
              <th>Target Team</th>
              <th>Participants</th>
            </tr>
          </thead>

          <tbody>
            {trainings.map((item) => (
              <tr key={item.id}>
                <td>{formatDate(item.training_date)}</td>
                <td>{item.training_title}</td>
                <td>{item.topic}</td>
                <td>{item.trainer_name || "-"}</td>
                <td>{item.target_team || "-"}</td>
                <td>{item.participants_count || 0}</td>
              </tr>
            ))}

            {trainings.length === 0 && (
              <tr>
                <td colSpan="6">No training record.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="section">
        <h2>7. Evidence / Attachments</h2>

        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Title</th>
              <th>Reference</th>
              <th>Evidence Type</th>
              <th>Report</th>
              <th>Month</th>
              <th>File</th>
              <th>Description</th>
            </tr>
          </thead>

          <tbody>
            {reportAttachments.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.title || "-"}</td>
                <td>{item.reference_type || "-"}</td>
                <td>{statusText(item.evidence_type)}</td>
                <td>{item.report_type || "-"}</td>
                <td>{formatMonth(item.report_month)}</td>
                <td>
                  {item.signed_url ? (
                    <a href={item.signed_url} target="_blank">
                      {item.file_name || "Open file"}
                    </a>
                  ) : (
                    item.file_name || item.file_path || "-"
                  )}
                </td>
                <td>{item.description || "-"}</td>
              </tr>
            ))}

            {reportAttachments.length === 0 && (
              <tr>
                <td colSpan="8">No evidence / attachment registered.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="section">
        <h2>8. Recommendation</h2>

        <div className="summary-box">
          {openFindings.length > 0 ? (
            <p>
              Open findings remain and should be followed up based on severity,
              due date, and assigned PIC. High/critical findings should be
              prioritized for immediate corrective action.
            </p>
          ) : (
            <p>
              No open finding remains in the current data. Continue routine
              preventive maintenance and maintain evidence records.
            </p>
          )}

          <p>
            Weekly and monthly scope should be continuously recorded. Quarterly,
            semiannual, and annual activities should be planned in advance to
            ensure compliance with the maintenance proposal.
          </p>
        </div>
      </section>

      <section className="section sign-section">
        <h2>9. Approval / Sign-off</h2>

        <div className="sign-grid">
          <div className="sign-box">
            <div className="sign-title">Prepared By</div>
            <div className="sign-space"></div>
            <div className="sign-name">Fire Kelas A Support</div>
            <div className="sign-role">Fire Maintenance Support</div>
          </div>

          <div className="sign-box">
            <div className="sign-title">Vendor PIC</div>
            <div className="sign-space"></div>
            <div className="sign-name">PT Mitra Media Visindo</div>
            <div className="sign-role">Fire Protection Vendor</div>
          </div>

          <div className="sign-box">
            <div className="sign-title">Client Representative</div>
            <div className="sign-space"></div>
            <div className="sign-name">PT Merak Energi Indonesia</div>
            <div className="sign-role">Owner / User Representative</div>
          </div>
        </div>
      </section>

      <footer className="footer-note">
        Generated by LetsDo Fire Maintenance Pro · Fire Protection Maintenance Report
      </footer>    </main>
  );
}

const css = `
  .page {
    background: #f8fafc;
    color: #0f172a;
    padding: 24px;
    font-family: Arial, sans-serif;
  }

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 12px;
    margin-bottom: 18px;
  }

  .back-link {
    color: #ea580c;
    text-decoration: none;
    font-weight: 900;
  }

  .type-links {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .type-links a {
    background: #f1f5f9;
    color: #334155;
    border: 1px solid #cbd5e1;
    border-radius: 999px;
    padding: 6px 10px;
    text-decoration: none;
    font-size: 12px;
    font-weight: 900;
  }

  .print-note {
    color: #64748b;
    font-size: 12px;
    font-weight: 900;
  }

  .cover {
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: 20px;
    margin-bottom: 18px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 20px;
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
    margin: 0 0 10px;
    font-size: 20px;
  }

  h3 {
    margin: 14px 0 8px;
    font-size: 16px;
  }

  p {
    color: #475569;
    line-height: 1.55;
    margin: 0 0 8px;
  }

  .subtitle {
    max-width: 760px;
  }

  .project-box {
    background: #0f172a;
    color: white;
    border-radius: 16px;
    padding: 18px;
    line-height: 1.55;
    font-size: 13px;
  }

  .project-label {
    color: #fed7aa;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .project-title {
    font-size: 18px;
    font-weight: 900;
    margin-bottom: 8px;
  }

  .section {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 18px;
    margin-bottom: 14px;
    page-break-inside: avoid;
  }

  .section-desc {
    margin-bottom: 12px;
  }

  .summary-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 12px;
    margin-bottom: 12px;
  }

  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }

  .kpi-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 12px;
  }

  .kpi-label {
    color: #64748b;
    font-size: 12px;
    font-weight: 900;
  }

  .kpi-value {
    font-size: 28px;
    font-weight: 950;
    margin-top: 4px;
  }

  .scope-group {
    margin-bottom: 16px;
  }

  .mini-kpi {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 10px;
  }

  .mini-kpi span {
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 999px;
    padding: 5px 10px;
    font-size: 12px;
    font-weight: 900;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }

  th {
    background: #f1f5f9;
    color: #334155;
    text-align: left;
    border: 1px solid #cbd5e1;
    padding: 8px;
    vertical-align: top;
  }

  td {
    border: 1px solid #e2e8f0;
    padding: 8px;
    vertical-align: top;
  }

  td span {
    color: #64748b;
    font-size: 11px;
    line-height: 1.4;
  }

  .error-box {
    background: white;
    border: 1px solid #fecaca;
    color: #b91c1c;
    border-radius: 18px;
    padding: 20px;
    margin-bottom: 14px;
  }

  .sign-section {
    page-break-inside: avoid;
  }

  .sign-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin-top: 14px;
  }

  .sign-box {
    border: 1px solid #cbd5e1;
    border-radius: 12px;
    padding: 14px;
    min-height: 170px;
    background: #f8fafc;
  }

  .sign-title {
    font-weight: 900;
    color: #334155;
    margin-bottom: 14px;
  }

  .sign-space {
    height: 76px;
    border-bottom: 1px solid #94a3b8;
    margin-bottom: 12px;
  }

  .sign-name {
    font-weight: 900;
    color: #0f172a;
  }

  .sign-role {
    color: #64748b;
    font-size: 12px;
    margin-top: 4px;
  }

  .footer-note {
    color: #64748b;
    font-size: 11px;
    text-align: center;
    padding: 14px 0;
  }

  @page {
    size: A4;
    margin: 12mm;
  }
  @media print {
    .no-print {
      display: none !important;
    }

    .page {
      background: white;
      padding: 0;
      color: black;
    }

    .cover,
    .section {
      border-radius: 0;
      box-shadow: none;
      border-color: #999;
    }

    .project-box {
      background: white;
      color: black;
      border: 1px solid #999;
    }

    h1 {
      font-size: 28px;
    }

    h2 {
      font-size: 18px;
    }

    table {
      font-size: 10px;
    }

    th,
    td {
      padding: 5px;
    }
  }

  @media (max-width: 900px) {
    .cover,
    .kpi-grid {
      grid-template-columns: 1fr;
    }

    .toolbar {
      display: block;
    }

    .type-links {
      margin-top: 10px;
    }
  }
`;






