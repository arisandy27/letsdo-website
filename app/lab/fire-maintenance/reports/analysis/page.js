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

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB");
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

function summarize(items) {
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

export default async function FireReportAnalysisPage() {
  const supabase = getSupabaseAdmin();

  const { data: project } = await supabase
    .from("fire_projects")
    .select("*")
    .eq("project_code", PROJECT_CODE)
    .maybeSingle();

  const { data: schedulesRaw, error } = await supabase
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
    .eq("project_id", project?.id || "00000000-0000-0000-0000-000000000000")
    .order("planned_date", { ascending: true });

  const schedules = (schedulesRaw || []).map((item) => ({
    ...item,
    effective_status: getEffectiveStatus(item),
    system_group:
      item.fire_scope_templates?.system_group ||
      item.fire_assets?.asset_type ||
      "General",
  }));

  const overall = summarize(schedules);

  const byFrequency = Object.entries(groupBy(schedules, (item) => item.frequency))
    .map(([frequency, items]) => ({
      frequency,
      ...summarize(items),
    }))
    .sort((a, b) => sortFrequency(a.frequency, b.frequency));

  const bySystem = Object.entries(groupBy(schedules, (item) => item.system_group))
    .map(([system, items]) => ({
      system,
      ...summarize(items),
    }))
    .sort((a, b) => a.system.localeCompare(b.system));

  const overdueItems = schedules
    .filter((item) => item.effective_status === "overdue")
    .slice(0, 10);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const next14 = new Date(today);
  next14.setDate(today.getDate() + 14);

  const dueSoonItems = schedules
    .filter((item) => {
      if (item.effective_status !== "planned") return false;
      if (!item.planned_date) return false;

      const plannedDate = new Date(item.planned_date);
      plannedDate.setHours(0, 0, 0, 0);

      return plannedDate >= today && plannedDate <= next14;
    })
    .slice(0, 10);

  const upcomingItems = schedules
    .filter((item) => item.effective_status === "planned")
    .slice(0, 15);

  if (error) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Report Analysis</h1>
        <p style={{ color: "#dc2626", fontWeight: 800 }}>
          Failed to load schedule data.
        </p>
        <pre>{error.message}</pre>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <p>
        <a href="/lab/fire-maintenance/reports" style={{ color: "#0369a1", fontWeight: 800 }}>
          ← Back to Reports
        </a>
      </p>

      <section style={heroStyle}>
        <div>
          <div style={eyebrowStyle}>FIRE MAINTENANCE PRO</div>
          <h1 style={heroTitleStyle}>Report Analysis</h1>
          <p style={heroTextStyle}>
            Schedule progress, frequency completion, system coverage, overdue status,
            and upcoming preventive maintenance summary.
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
        <KpiCard title="Total Schedule" value={overall.total} caption="Maintenance activities" />
        <KpiCard title="Done" value={overall.done} caption="Completed work" />
        <KpiCard title="Planned" value={overall.planned} caption="Upcoming work" />
        <KpiCard title="Overdue" value={overall.overdue} caption="Need attention" />
        <KpiCard title="Completion" value={`${overall.completion}%`} caption="Overall progress" />
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Completion by Frequency</h2>
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
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Completion by System Group</h2>
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
      </section>

      <section style={twoColumnStyle}>
        <div style={panelStyle}>
          <h2 style={sectionTitleStyle}>Overdue Items</h2>
          {overdueItems.length === 0 ? (
            <p style={{ color: "#166534", fontWeight: 800 }}>No overdue schedule.</p>
          ) : (
            <ScheduleMiniTable items={overdueItems} />
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

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Upcoming Schedule</h2>
        <ScheduleMiniTable items={upcomingItems} />
      </section>
    </main>
  );
}

function KpiCard({ title, value, caption }) {
  return (
    <div style={kpiCardStyle}>
      <div style={kpiTitleStyle}>{title}</div>
      <div style={kpiValueStyle}>{value}</div>
      <div style={kpiCaptionStyle}>{caption}</div>
    </div>
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
        </tbody>
      </table>
    </div>
  );
}

function ScheduleMiniTable({ items }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Planned Date</th>
            <th style={thStyle}>Asset</th>
            <th style={thStyle}>Activity</th>
            <th style={thStyle}>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td style={tdStyle}>{formatDate(item.planned_date)}</td>
              <td style={tdStyle}>
                <strong>{item.fire_assets?.asset_code || "-"}</strong>
                <div style={{ color: "#64748b" }}>
                  {item.fire_assets?.asset_name || "-"}
                </div>
              </td>
              <td style={tdStyle}>{item.activity_type}</td>
              <td style={tdStyle}>
                <span
                  style={{
                    ...badgeStyle,
                    background:
                      item.effective_status === "done"
                        ? "#dcfce7"
                        : item.effective_status === "overdue"
                          ? "#fee2e2"
                          : "#e0f2fe",
                    color:
                      item.effective_status === "done"
                        ? "#166534"
                        : item.effective_status === "overdue"
                          ? "#991b1b"
                          : "#075985",
                  }}
                >
                  {item.effective_status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
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

const sectionTitleStyle = {
  marginTop: 0,
  color: "#0f172a",
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
  display: "inline-block",
  padding: "5px 8px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
};
