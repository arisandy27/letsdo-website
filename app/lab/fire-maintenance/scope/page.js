import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import ScopeMatrixClient from "./ScopeMatrixClient";

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

async function loadScopeData() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      error:
        "Supabase env belum terbaca. Cek .env.local: NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const [projectRes, scopeRes] = await Promise.all([
    supabase
      .from("fire_projects")
      .select("*")
      .eq("project_code", PROJECT_CODE)
      .maybeSingle(),
    supabase
      .from("fire_scope_templates")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
  ]);

  const error = projectRes.error || scopeRes.error;

  if (error) return { error: error.message };

  return {
    project: projectRes.data || {},
    scopes: scopeRes.data || [],
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

  const { project, scopes } = data;

  const photoRequired = scopes.filter((item) => item.requires_photo).length;
  const testRequired = scopes.filter((item) => item.requires_test_result).length;
  const systemGroups = [...new Set(scopes.map((item) => item.system_group).filter(Boolean))];

  const projectStatus = project.project_status || "bidding";
  const timelineBasis = project.timeline_basis || "working_schedule";

  return (
    <main className="page">
      <style>{css}</style>

      <section className="hero">
        <div>
          <Link href="/lab/fire-maintenance" style={backLinkStyle}>
            Back to Fire Maintenance Dashboard
          </Link>

          <div className="eyebrow">Fire Maintenance Pro</div>
          <h1>Maintenance Scope Matrix</h1>
          <p>
            Master scope pekerjaan fire protection berdasarkan proposal/O&M.
            Scope ini menjadi dasar mapping ke asset, schedule generation,
            inspection, evidence, dan monthly report.
          </p>

          <div className="hero-actions">
            <Link href="/lab/fire-maintenance/scope-mapping" className="primary-link">
              Open Scope Mapping
            </Link>
            <Link href="/lab/fire-maintenance/timeline" className="secondary-link">
              Open Timeline
            </Link>
            <Link href="/lab/fire-maintenance/project-setup" className="secondary-link">
              Project Setup
            </Link>
          </div>
        </div>

        <div className="project-box">
          <div className="project-label">Project</div>
          <div className="project-title">{project?.project_name || "-"}</div>
          <div className="project-meta">{project?.site_name || "-"}</div>
          <div className="project-meta">Client: {project?.client_name || "-"}</div>
          <div className="project-meta">Vendor: {project?.vendor_name || "-"}</div>
          <div className="project-meta">Status: {String(projectStatus).replaceAll("_", " ")}</div>
          <div className="project-meta">Timeline: {String(timelineBasis).replaceAll("_", " ")}</div>
        </div>
      </section>

      <section className="mode-card">
        <div>
          <div className="mode-label">Scope Matrix Mode</div>
          <h2>Controlled Master Scope</h2>
          <p>
            Scope item tidak diedit dari halaman ini. Gunakan Scope Mapping untuk
            menghubungkan scope ke asset dan schedule.
          </p>
        </div>

        <div className="mode-badge">Read Only</div>
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

      <ScopeMatrixClient scopes={scopes} />
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
    margin: 0 0 8px;
    font-size: 20px;
  }

  p {
    color: #64748b;
    line-height: 1.55;
    margin: 0;
  }

  .hero-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 16px;
  }

  .primary-link,
  .secondary-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 42px;
    padding: 0 14px;
    border-radius: 10px;
    text-decoration: none;
    font-size: 14px;
    font-weight: 900;
  }

  .primary-link {
    background: #ea580c;
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
    line-height: 1.6;
  }

  .mode-card,
  .kpi-card {
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
    height: 42px;
    padding: 0 16px;
    border-radius: 999px;
    background: #f1f5f9;
    color: #334155;
    font-size: 13px;
    font-weight: 950;
  }

  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 14px;
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