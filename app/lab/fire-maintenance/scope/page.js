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

function badgeClass(value) {
  const key = String(value || "default").toLowerCase().replaceAll("_", "-");
  return `badge ${key}`;
}

async function loadScopeData() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      error:
        "Supabase env belum terbaca. Cek .env.local: NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const [projectRes, scopeRes, summaryRes] = await Promise.all([
    supabase
      .from("fire_projects")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("fire_scope_templates")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("v_fire_scope_template_summary")
      .select("*"),
  ]);

  const error = projectRes.error || scopeRes.error || summaryRes.error;

  if (error) return { error: error.message };

  const scopes = scopeRes.data || [];

  const grouped = scopes.reduce((acc, item) => {
    if (!acc[item.frequency]) acc[item.frequency] = [];
    acc[item.frequency].push(item);
    return acc;
  }, {});

  const groups = Object.keys(grouped)
    .sort((a, b) => frequencyOrder(a) - frequencyOrder(b))
    .map((frequency) => ({
      frequency,
      items: grouped[frequency],
    }));

  return {
    project: projectRes.data,
    scopes,
    summary: summaryRes.data || [],
    groups,
  };
}

export default async function FireScopeMatrixPage() {
  const data = await loadScopeData();

  if (data.error) {
    return (
      <main className="page">
        <style>{css}</style>
        <section className="error-box">
          <h1>Maintenance Scope Matrix</h1>
          <p>{data.error}</p>
        </section>
      </main>
    );
  }

  const { project, scopes, groups } = data;

  const photoRequired = scopes.filter((item) => item.requires_photo).length;
  const testRequired = scopes.filter((item) => item.requires_test_result).length;
  const systemGroups = [...new Set(scopes.map((item) => item.system_group))];

  return (
    <main className="page">
      <style>{css}</style>

      <section className="hero">
        <div>
          <Link href="/lab/fire-maintenance" style={backLinkStyle}>Back to Fire Maintenance Dashboard</Link>

          <div className="eyebrow">Fire Maintenance Pro</div>
          <h1>Maintenance Scope Matrix</h1>
          <p>
            Matrix pekerjaan aktual berdasarkan proposal: weekly, monthly,
            quarterly, semiannual, dan annual.
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

      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Scope</div>
          <div className="kpi-value">{scopes.length}</div>
          <div className="kpi-note">Active scope templates</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">System Group</div>
          <div className="kpi-value">{systemGroups.length}</div>
          <div className="kpi-note">Fire protection systems</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Photo Required</div>
          <div className="kpi-value">{photoRequired}</div>
          <div className="kpi-note">Evidence required</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Test Result</div>
          <div className="kpi-value">{testRequired}</div>
          <div className="kpi-note">Test data required</div>
        </div>
      </section>

      <section className="scope-groups">
        {groups.map((group) => (
          <div className="panel" key={group.frequency}>
            <div className="panel-head">
              <div>
                <h2>{frequencyLabel(group.frequency)}</h2>
                <p>{group.items.length} active scope item(s)</p>
              </div>

              <span className={badgeClass(group.frequency)}>
                {frequencyLabel(group.frequency)}
              </span>
            </div>

            <div className="scope-list">
              {group.items.map((scope) => (
                <div className="scope-card" key={scope.id}>
                  <div className="scope-top">
                    <span className="system">{scope.system_group}</span>
                    <span className="mode">{scope.execution_mode}</span>
                  </div>

                  <h3>{scope.scope_title}</h3>

                  <p className="scope-detail">{scope.scope_detail}</p>

                  <div className="evidence-row">
                    <span className={scope.requires_photo ? "yes" : "no"}>
                      Photo: {scope.requires_photo ? "Required" : "No"}
                    </span>

                    <span className={scope.requires_test_result ? "yes" : "no"}>
                      Test Result: {scope.requires_test_result ? "Required" : "No"}
                    </span>
                  </div>

                  <div className="checklist">
                    <div className="checklist-title">Checklist</div>

                    {(Array.isArray(scope.checklist_items)
                      ? scope.checklist_items
                      : []
                    ).map((item, index) => (
                      <div className="check-item" key={index}>
                        ✓ {item}
                      </div>
                    ))}
                  </div>

                  <div className="source">{scope.source_reference}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
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
    font-size: 20px;
  }

  h3 {
    margin: 8px 0;
    font-size: 17px;
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

  .scope-groups {
    display: grid;
    gap: 16px;
  }

  .panel-head {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 14px;
  }

  .scope-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .scope-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 14px;
  }

  .scope-top {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 8px;
  }

  .system {
    display: inline-flex;
    background: #fff7ed;
    color: #c2410c;
    border: 1px solid #fed7aa;
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 12px;
    font-weight: 900;
  }

  .mode {
    display: inline-flex;
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 12px;
    font-weight: 900;
  }

  .scope-detail {
    font-size: 13px;
    margin-bottom: 10px;
  }

  .evidence-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 10px;
  }

  .yes,
  .no {
    display: inline-flex;
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 12px;
    font-weight: 900;
  }

  .yes {
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #a7f3d0;
  }

  .no {
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #cbd5e1;
  }

  .checklist {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 10px;
    margin-bottom: 10px;
  }

  .checklist-title {
    font-weight: 900;
    margin-bottom: 6px;
    font-size: 13px;
  }

  .check-item {
    color: #334155;
    font-size: 12px;
    line-height: 1.6;
  }

  .source {
    color: #64748b;
    font-size: 11px;
    font-style: italic;
  }

  .badge {
    display: inline-flex;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 900;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    color: #334155;
    white-space: nowrap;
  }

  .badge.weekly {
    background: #eff6ff;
    color: #1d4ed8;
    border-color: #bfdbfe;
  }

  .badge.monthly {
    background: #ecfdf5;
    color: #047857;
    border-color: #a7f3d0;
  }

  .badge.quarterly {
    background: #fff7ed;
    color: #c2410c;
    border-color: #fed7aa;
  }

  .badge.semiannual {
    background: #fefce8;
    color: #a16207;
    border-color: #fde68a;
  }

  .badge.annual {
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
    margin-bottom: 14px;
  }

  @media (max-width: 900px) {
    .hero,
    .kpi-grid,
    .scope-list {
      grid-template-columns: 1fr;
    }

    .panel-head {
      display: block;
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
