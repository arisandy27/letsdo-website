import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const PROJECT_CODE = "FIRE-MEI-2026";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

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
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toLocaleDateString("en-GB");
}

function formatMonth(value) {
  if (!value) return "-";
  const text = String(value);
  if (text.length < 7) return text;
  return `${text.slice(5, 7)}/${text.slice(0, 4)}`;
}

function getEffectiveStatus(schedule) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const plannedDate = schedule.planned_date ? new Date(schedule.planned_date) : null;
  if (plannedDate) plannedDate.setHours(0, 0, 0, 0);

  if (schedule.status === "done") return "done";
  if (schedule.status === "cancelled") return "cancelled";
  if (plannedDate && plannedDate < today) return "overdue";
  return schedule.status || "planned";
}

function percent(done, total) {
  if (!total) return 0;
  return Math.round((done / total) * 1000) / 10;
}

function groupBy(items, keyGetter) {
  return items.reduce((acc, item) => {
    const key = keyGetter(item) || "-";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

function summarizeSchedule(items) {
  const total = items.length;
  const done = items.filter((item) => item.effective_status === "done").length;
  const planned = items.filter((item) => item.effective_status === "planned").length;
  const overdue = items.filter((item) => item.effective_status === "overdue").length;
  const cancelled = items.filter((item) => item.effective_status === "cancelled").length;

  return {
    total,
    done,
    planned,
    overdue,
    cancelled,
    completion: percent(done, total),
  };
}

function sortFrequency(a, b) {
  const order = {
    weekly: 1,
    monthly: 2,
    quarterly: 3,
    semiannual: 4,
    annual: 5,
  };

  return (order[a] || 99) - (order[b] || 99);
}

function isOpenFinding(item) {
  return String(item.status || "").toLowerCase() !== "closed";
}

function isHighCritical(item) {
  return ["high", "critical"].includes(String(item.severity || "").toLowerCase());
}

function isPastDate(value) {
  if (!value) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  date.setHours(0, 0, 0, 0);

  return date < today;
}

function isWithinNextDays(value, days) {
  if (!value) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return false;
  target.setHours(0, 0, 0, 0);

  const end = new Date(today);
  end.setDate(today.getDate() + days);

  return target >= today && target <= end;
}

function getManagementRisk({ overdueSchedule, openFindings, highCriticalOpen, overdueFindings }) {
  if (highCriticalOpen > 0 || overdueFindings > 0 || overdueSchedule > 0) {
    return {
      label: "Priority Attention",
      tone: "critical",
      note:
        "The report requires active management follow-up because overdue or high-risk items exist.",
    };
  }

  if (openFindings > 0) {
    return {
      label: "Controlled With Open Action",
      tone: "watch",
      note:
        "The maintenance program is running, but open findings still require tracking until closure.",
    };
  }

  return {
    label: "Controlled",
    tone: "good",
    note:
      "No major open risk is visible from the current report data. Continue routine monitoring.",
  };
}

function makePriorityActions({
  overdueScheduleItems,
  highCriticalOpenFindings,
  overdueFindingItems,
  dueSoonItems,
  evidenceTotal,
  trainings,
}) {
  const actions = [];

  if (overdueScheduleItems.length > 0) {
    actions.push({
      priority: "High",
      area: "Schedule",
      action: `Close ${overdueScheduleItems.length} overdue maintenance schedule item(s).`,
      owner: "Vendor / Site Team",
    });
  }

  if (highCriticalOpenFindings.length > 0) {
    actions.push({
      priority: "High",
      area: "Finding",
      action: `Prioritize ${highCriticalOpenFindings.length} open high/critical finding(s).`,
      owner: "Vendor / Site Team",
    });
  }

  if (overdueFindingItems.length > 0) {
    actions.push({
      priority: "High",
      area: "Corrective Action",
      action: `Follow up ${overdueFindingItems.length} overdue finding action(s).`,
      owner: "Assigned PIC",
    });
  }

  if (dueSoonItems.length > 0) {
    actions.push({
      priority: "Medium",
      area: "Planning",
      action: `Prepare resources for ${dueSoonItems.length} schedule item(s) due in the next 14 days.`,
      owner: "Planner / Vendor",
    });
  }

  if (evidenceTotal === 0) {
    actions.push({
      priority: "Medium",
      area: "Evidence",
      action: "Upload photo, checklist, test result, or signed report evidence.",
      owner: "Fire Kelas A Support",
    });
  }

  if (trainings.length === 0) {
    actions.push({
      priority: "Low",
      area: "Training",
      action: "Create at least one fire protection awareness or technical training record.",
      owner: "Fire Kelas A Support",
    });
  }

  if (actions.length === 0) {
    actions.push({
      priority: "Normal",
      area: "Routine Monitoring",
      action: "Continue routine maintenance, evidence capture, and monthly reporting.",
      owner: "Vendor / Fire Support",
    });
  }

  return actions.slice(0, 8);
}

export default async function FireReportAnalysisPage() {
  const supabase = getSupabaseAdmin();

  const { data: project, error: projectError } = await supabase
    .from("fire_projects")
    .select("*")
    .eq("project_code", PROJECT_CODE)
    .maybeSingle();

  if (projectError || !project) {
    return (
      <main style={pageStyle}>
        <section style={errorBoxStyle}>
          <h1>Report Analysis</h1>
          <p>{projectError?.message || `Project not found: ${PROJECT_CODE}`}</p>
        </section>
      </main>
    );
  }

  const [
    schedulesRes,
    findingsRes,
    inspectionsRes,
    attachmentsRes,
    trainingsRes,
  ] = await Promise.all([
    supabase
      .from("fire_maintenance_schedules")
      .select(`
        id,
        schedule_code,
        activity_type,
        frequency,
        planned_date,
        actual_date,
        assigned_to,
        status,
        fire_scope_templates (
          system_group,
          scope_title
        ),
        fire_assets (
          asset_code,
          asset_name,
          asset_type,
          area
        )
      `)
      .eq("project_id", project.id)
      .order("planned_date", { ascending: true }),

    supabase
      .from("fire_findings")
      .select(`
        id,
        finding_no,
        finding_date,
        finding_type,
        severity,
        description,
        corrective_action,
        pic,
        due_date,
        status,
        closed_at,
        fire_assets (
          asset_code,
          asset_name,
          asset_type,
          area
        )
      `)
      .eq("project_id", project.id)
      .order("due_date", { ascending: true }),

    supabase
      .from("fire_inspections")
      .select(`
        id,
        inspection_date,
        inspector_name,
        overall_condition,
        summary,
        status,
        fire_assets (
          asset_code,
          asset_name,
          asset_type,
          area
        )
      `)
      .eq("project_id", project.id)
      .order("inspection_date", { ascending: false }),

    supabase
      .from("fire_attachments")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false }),

    supabase
      .from("fire_training_records")
      .select("*")
      .eq("project_id", project.id)
      .order("training_date", { ascending: false }),
  ]);

  const dataError =
    schedulesRes.error ||
    findingsRes.error ||
    inspectionsRes.error ||
    attachmentsRes.error ||
    trainingsRes.error;

  if (dataError) {
    return (
      <main style={pageStyle}>
        <section style={errorBoxStyle}>
          <h1>Report Analysis</h1>
          <p>{dataError.message}</p>
        </section>
      </main>
    );
  }

  const schedules = (schedulesRes.data || []).map((item) => ({
    ...item,
    effective_status: getEffectiveStatus(item),
    system_group:
      item.fire_scope_templates?.system_group ||
      item.fire_assets?.asset_type ||
      "General",
  }));

  const findings = findingsRes.data || [];
  const inspections = inspectionsRes.data || [];
  const attachments = attachmentsRes.data || [];
  const trainings = trainingsRes.data || [];

  const scheduleOverall = summarizeSchedule(schedules);

  const byFrequency = Object.entries(groupBy(schedules, (item) => item.frequency))
    .map(([frequency, items]) => ({
      frequency,
      ...summarizeSchedule(items),
    }))
    .sort((a, b) => sortFrequency(a.frequency, b.frequency));

  const bySystem = Object.entries(groupBy(schedules, (item) => item.system_group))
    .map(([system, items]) => ({
      system,
      ...summarizeSchedule(items),
    }))
    .sort((a, b) => a.system.localeCompare(b.system));

  const overdueScheduleItems = schedules
    .filter((item) => item.effective_status === "overdue")
    .slice(0, 10);

  const dueSoonItems = schedules
    .filter((item) => item.effective_status === "planned" && isWithinNextDays(item.planned_date, 14))
    .slice(0, 10);

  const upcomingItems = schedules
    .filter((item) => item.effective_status === "planned")
    .slice(0, 15);

  const openFindings = findings.filter(isOpenFinding);
  const closedFindings = findings.filter((item) => !isOpenFinding(item));
  const highCriticalOpenFindings = findings.filter(
    (item) => isOpenFinding(item) && isHighCritical(item)
  );
  const overdueFindingItems = findings.filter(
    (item) => isOpenFinding(item) && isPastDate(item.due_date)
  );
  const dueSoonFindingItems = findings.filter(
    (item) => isOpenFinding(item) && isWithinNextDays(item.due_date, 14)
  );

  const goodInspections = inspections.filter((item) => item.overall_condition === "good");
  const watchInspections = inspections.filter((item) => item.overall_condition === "watch");
  const failInspections = inspections.filter((item) => item.overall_condition === "fail");

  const evidencePhotos = attachments.filter((item) => item.evidence_type === "photo");
  const evidenceTests = attachments.filter((item) => item.evidence_type === "test_result");
  const evidenceReports = attachments.filter(
    (item) => item.evidence_type === "signed_report" || item.reference_type === "report"
  );
  const evidenceAttendance = attachments.filter((item) => item.evidence_type === "attendance");

  const totalParticipants = trainings.reduce(
    (sum, item) => sum + Number(item.participants_count || 0),
    0
  );
  const completedTrainings = trainings.filter(
    (item) => String(item.training_date || "") <= todayIso()
  );
  const plannedTrainings = trainings.filter(
    (item) => String(item.training_date || "") > todayIso()
  );

  const managementRisk = getManagementRisk({
    overdueSchedule: scheduleOverall.overdue,
    openFindings: openFindings.length,
    highCriticalOpen: highCriticalOpenFindings.length,
    overdueFindings: overdueFindingItems.length,
  });

  const priorityActions = makePriorityActions({
    overdueScheduleItems,
    highCriticalOpenFindings,
    overdueFindingItems,
    dueSoonItems,
    evidenceTotal: attachments.length,
    trainings,
  });

  const scheduleInsight =
    scheduleOverall.overdue > 0
      ? `${scheduleOverall.overdue} schedule item(s) are overdue and require follow-up.`
      : `No overdue schedule is detected. Overall completion is ${scheduleOverall.completion}%.`;

  const findingInsight =
    highCriticalOpenFindings.length > 0
      ? `${highCriticalOpenFindings.length} high/critical finding(s) remain open. Immediate action is recommended.`
      : openFindings.length > 0
        ? `${openFindings.length} finding(s) remain open and should be tracked until closure.`
        : "No open finding remains in the current data.";

  const inspectionInsight =
    failInspections.length > 0
      ? `${failInspections.length} inspection record(s) show failed condition.`
      : watchInspections.length > 0
        ? `${watchInspections.length} inspection record(s) require monitoring.`
        : "Inspection records are currently in good condition or not indicating major issues.";

  const evidenceInsight =
    attachments.length === 0
      ? "No evidence attachment is registered. Photo, checklist, test result, or report evidence should be uploaded."
      : `${attachments.length} evidence record(s) are available, including ${evidencePhotos.length} photo(s), ${evidenceTests.length} test result(s), and ${evidenceReports.length} report attachment(s).`;

  const trainingInsight =
    trainings.length === 0
      ? "No training record is available. Training record should be added to support competency tracking."
      : `${trainings.length} training record(s) are available with ${totalParticipants} total participant(s).`;

  return (
    <main style={pageStyle}>
      <div style={topBarStyle}>
        <Link href="/lab/fire-maintenance/reports" style={backLinkStyle}>
          Back to Reports
        </Link>

        <div style={topActionStyle}>
          <Link href="/lab/fire-maintenance/reports/print?type=monthly" style={secondaryButtonStyle}>
            Print Monthly
          </Link>
          <Link href="/lab/fire-maintenance" style={secondaryButtonStyle}>
            Fire Dashboard
          </Link>
        </div>
      </div>

      <section style={heroStyle}>
        <div>
          <div style={eyebrowStyle}>FIRE MAINTENANCE PRO</div>
          <h1 style={heroTitleStyle}>Report Analysis</h1>
          <p style={heroTextStyle}>
            Management insight for schedule compliance, finding risk, inspection quality,
            evidence readiness, training coverage, and priority actions.
          </p>
        </div>

        <div style={projectCardStyle}>
          <div style={projectLabelStyle}>PROJECT</div>
          <h2 style={{ margin: "8px 0", color: "white" }}>
            {project?.project_name || "Fire Protection Maintenance Support"}
          </h2>
          <p style={{ margin: "4px 0", color: "#cbd5e1" }}>
            Client: {project?.client_name || "PT Merak Energi Indonesia"}
          </p>
          <p style={{ margin: "4px 0", color: "#cbd5e1" }}>
            Vendor: {project?.vendor_name || "PT Mitra Media Visindo"}
          </p>
        </div>
      </section>

      <section style={kpiGridStyle}>
        <KpiCard title="Schedule Completion" value={`${scheduleOverall.completion}%`} caption={`${scheduleOverall.done}/${scheduleOverall.total} done`} />
        <KpiCard title="Overdue Schedule" value={scheduleOverall.overdue} caption="Need attention" tone={scheduleOverall.overdue > 0 ? "critical" : "good"} />
        <KpiCard title="Open Findings" value={openFindings.length} caption={`${closedFindings.length} closed`} tone={openFindings.length > 0 ? "watch" : "good"} />
        <KpiCard title="High / Critical Open" value={highCriticalOpenFindings.length} caption="Priority risk" tone={highCriticalOpenFindings.length > 0 ? "critical" : "good"} />
        <KpiCard title="Evidence Records" value={attachments.length} caption="Attachments" />
        <KpiCard title="Training Participants" value={totalParticipants} caption={`${trainings.length} records`} />
      </section>

      <section style={panelStyle}>
        <div style={analysisHeaderStyle}>
          <div>
            <h2 style={sectionTitleStyle}>Management Insight</h2>
            <p style={mutedTextStyle}>{managementRisk.note}</p>
          </div>

          <Badge label={managementRisk.label} tone={managementRisk.tone} />
        </div>

        <div style={insightGridStyle}>
          <InsightCard title="Schedule Compliance" text={scheduleInsight} />
          <InsightCard title="Finding Risk" text={findingInsight} />
          <InsightCard title="Inspection Quality" text={inspectionInsight} />
          <InsightCard title="Evidence Readiness" text={evidenceInsight} />
          <InsightCard title="Training Coverage" text={trainingInsight} />
        </div>
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Priority Action Plan</h2>
        <Table
          headers={["Priority", "Area", "Recommended Action", "Owner"]}
          rows={priorityActions.map((item) => [
            <Badge key={`${item.area}-priority`} label={item.priority} tone={item.priority === "High" ? "critical" : item.priority === "Medium" ? "watch" : "good"} />,
            item.area,
            item.action,
            item.owner,
          ])}
        />
      </section>

      <section style={twoColumnStyle}>
        <div style={panelStyle}>
          <h2 style={sectionTitleStyle}>Schedule Analysis by Frequency</h2>
          <Table
            headers={["Frequency", "Total", "Done", "Planned", "Overdue", "Completion"]}
            rows={byFrequency.map((item) => [
              item.frequency,
              item.total,
              item.done,
              item.planned,
              item.overdue,
              `${item.completion}%`,
            ])}
          />
        </div>

        <div style={panelStyle}>
          <h2 style={sectionTitleStyle}>Schedule Analysis by System</h2>
          <Table
            headers={["System Group", "Total", "Done", "Planned", "Overdue", "Completion"]}
            rows={bySystem.map((item) => [
              item.system,
              item.total,
              item.done,
              item.planned,
              item.overdue,
              `${item.completion}%`,
            ])}
          />
        </div>
      </section>

      <section style={twoColumnStyle}>
        <div style={panelStyle}>
          <h2 style={sectionTitleStyle}>Overdue Schedule Items</h2>
          {overdueScheduleItems.length === 0 ? (
            <p style={{ color: "#166534", fontWeight: 800 }}>No overdue schedule.</p>
          ) : (
            <ScheduleMiniTable items={overdueScheduleItems} />
          )}
        </div>

        <div style={panelStyle}>
          <h2 style={sectionTitleStyle}>Due Soon - Next 14 Days</h2>
          {dueSoonItems.length === 0 ? (
            <p style={{ color: "#64748b", fontWeight: 800 }}>No due soon schedule.</p>
          ) : (
            <ScheduleMiniTable items={dueSoonItems} />
          )}
        </div>
      </section>

      <section style={twoColumnStyle}>
        <div style={panelStyle}>
          <h2 style={sectionTitleStyle}>Finding Risk Analysis</h2>
          <Table
            headers={["Metric", "Value"]}
            rows={[
              ["Total Findings", findings.length],
              ["Open Findings", openFindings.length],
              ["Closed Findings", closedFindings.length],
              ["Open High/Critical", highCriticalOpenFindings.length],
              ["Overdue Finding Actions", overdueFindingItems.length],
              ["Due Soon Finding Actions", dueSoonFindingItems.length],
            ]}
          />
        </div>

        <div style={panelStyle}>
          <h2 style={sectionTitleStyle}>Inspection Quality Analysis</h2>
          <Table
            headers={["Condition", "Records"]}
            rows={[
              ["Good", goodInspections.length],
              ["Watch", watchInspections.length],
              ["Fail", failInspections.length],
              ["Total Inspection Records", inspections.length],
            ]}
          />
        </div>
      </section>

      <section style={twoColumnStyle}>
        <div style={panelStyle}>
          <h2 style={sectionTitleStyle}>Evidence Completeness Analysis</h2>
          <Table
            headers={["Evidence Type", "Records"]}
            rows={[
              ["Photo", evidencePhotos.length],
              ["Test Result", evidenceTests.length],
              ["Signed Report / Report", evidenceReports.length],
              ["Training Attendance", evidenceAttendance.length],
              ["Total Evidence", attachments.length],
            ]}
          />
        </div>

        <div style={panelStyle}>
          <h2 style={sectionTitleStyle}>Training Coverage Analysis</h2>
          <Table
            headers={["Metric", "Value"]}
            rows={[
              ["Training Records", trainings.length],
              ["Completed Training", completedTrainings.length],
              ["Planned Training", plannedTrainings.length],
              ["Total Participants", totalParticipants],
            ]}
          />
        </div>
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Upcoming Schedule</h2>
        <ScheduleMiniTable items={upcomingItems} />
      </section>
    </main>
  );
}

function KpiCard({ title, value, caption, tone = "neutral" }) {
  return (
    <div style={{ ...kpiCardStyle, borderColor: getToneBorder(tone) }}>
      <div style={kpiTitleStyle}>{title}</div>
      <div style={kpiValueStyle}>{value}</div>
      <div style={kpiCaptionStyle}>{caption}</div>
    </div>
  );
}

function InsightCard({ title, text }) {
  return (
    <div style={insightCardStyle}>
      <div style={{ fontWeight: 900, color: "#0f172a", marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ color: "#475569", lineHeight: 1.5 }}>{text}</div>
    </div>
  );
}

function Badge({ label, tone = "neutral" }) {
  return (
    <span
      style={{
        ...badgeStyle,
        background: getToneBackground(tone),
        color: getToneColor(tone),
      }}
    >
      {label}
    </span>
  );
}

function Table({ headers, rows }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} style={thStyle}>
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} style={tdStyle}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td colSpan={headers.length} style={tdStyle}>
                No data.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ScheduleMiniTable({ items }) {
  return (
    <Table
      headers={["Planned Date", "Asset", "Activity", "Status"]}
      rows={items.map((item) => [
        formatDate(item.planned_date),
        <div key={`${item.id}-asset`}>
          <strong>{item.fire_assets?.asset_code || "-"}</strong>
          <div style={{ color: "#64748b" }}>
            {item.fire_assets?.asset_name || "-"}
          </div>
        </div>,
        item.activity_type,
        <Badge key={`${item.id}-status`} label={item.effective_status} tone={item.effective_status === "overdue" ? "critical" : item.effective_status === "done" ? "good" : "info"} />,
      ])}
    />
  );
}

function getToneBackground(tone) {
  const map = {
    good: "#dcfce7",
    watch: "#fef3c7",
    critical: "#fee2e2",
    info: "#e0f2fe",
    neutral: "#f1f5f9",
  };

  return map[tone] || map.neutral;
}

function getToneColor(tone) {
  const map = {
    good: "#166534",
    watch: "#92400e",
    critical: "#991b1b",
    info: "#075985",
    neutral: "#475569",
  };

  return map[tone] || map.neutral;
}

function getToneBorder(tone) {
  const map = {
    good: "#86efac",
    watch: "#fcd34d",
    critical: "#fecaca",
    info: "#bae6fd",
    neutral: "#e2e8f0",
  };

  return map[tone] || map.neutral;
}

const pageStyle = {
  padding: 24,
  maxWidth: 1440,
  margin: "0 auto",
  background: "#f8fafc",
  minHeight: "100vh",
  color: "#0f172a",
  fontFamily: "Arial, sans-serif",
};

const topBarStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 18,
};

const topActionStyle = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

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

const secondaryButtonStyle = {
  ...backLinkStyle,
  color: "#334155",
};

const heroStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 360px",
  gap: 20,
  alignItems: "center",
  marginBottom: 20,
};

const eyebrowStyle = {
  color: "#ea580c",
  fontWeight: 900,
  letterSpacing: 2,
  fontSize: 13,
};

const heroTitleStyle = {
  margin: "8px 0",
  fontSize: 34,
  color: "#0f172a",
};

const heroTextStyle = {
  color: "#64748b",
  maxWidth: 850,
  lineHeight: 1.55,
};

const projectCardStyle = {
  background: "#0f172a",
  color: "white",
  padding: 20,
  borderRadius: 18,
};

const projectLabelStyle = {
  color: "#fed7aa",
  fontWeight: 900,
  letterSpacing: 1.5,
  fontSize: 12,
};

const kpiGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
  gap: 14,
  marginBottom: 18,
};

const kpiCardStyle = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 18,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
};

const kpiTitleStyle = {
  color: "#64748b",
  fontWeight: 900,
  fontSize: 13,
};

const kpiValueStyle = {
  color: "#0f172a",
  fontWeight: 950,
  fontSize: 34,
  marginTop: 8,
};

const kpiCaptionStyle = {
  color: "#64748b",
  fontSize: 13,
};

const panelStyle = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  padding: 18,
  marginBottom: 18,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
};

const twoColumnStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 18,
};

const analysisHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 14,
};

const insightGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: 12,
};

const insightCardStyle = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 14,
};

const sectionTitleStyle = {
  marginTop: 0,
  color: "#0f172a",
};

const mutedTextStyle = {
  color: "#64748b",
  margin: "6px 0 0",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 14,
};

const thStyle = {
  textAlign: "left",
  padding: "10px",
  background: "#f8fafc",
  borderBottom: "1px solid #e2e8f0",
  color: "#334155",
};

const tdStyle = {
  padding: "10px",
  borderBottom: "1px solid #e2e8f0",
  verticalAlign: "top",
};

const badgeStyle = {
  display: "inline-flex",
  padding: "5px 9px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const errorBoxStyle = {
  background: "white",
  border: "1px solid #fecaca",
  color: "#991b1b",
  borderRadius: 18,
  padding: 20,
};