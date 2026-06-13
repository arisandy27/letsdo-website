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
  const key = String(value || "default").toLowerCase();
  return `badge ${key}`;
}

async function loadAssets() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      error:
        "Supabase env belum terbaca. Cek .env.local: NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const { data, error } = await supabase
    .from("fire_assets")
    .select("*, fire_projects(project_name, client_name, vendor_name, site_name)")
    .order("asset_code", { ascending: true });

  if (error) return { error: error.message };

  return { assets: data || [] };
}

export default async function FireAssetRegisterPage() {
  const data = await loadAssets();

  if (data.error) {
    return (
      <main className="page">
        <style>{css}</style>
        <section className="error-box">
          <h1>Asset Register</h1>
          <p>{data.error}</p>
        </section>
      </main>
    );
  }

  const assets = data.assets || [];
  const activeAssets = assets.filter((item) => item.status === "active");
  const highCriticalAssets = assets.filter((item) =>
    ["high", "critical"].includes(String(item.criticality).toLowerCase())
  );

  const project = assets[0]?.fire_projects || {};

  return (
    <main className="page">
      <style>{css}</style>

      <section className="hero">
        <div>
          <Link href="/lab/fire-maintenance" className="back-link">
            ← Back to Fire Dashboard
          </Link>

          <div className="eyebrow">Fire Maintenance Pro</div>
          <h1>Asset Register</h1>
          <p>
            Master list asset fire protection untuk maintenance schedule,
            inspection, finding, dan monthly report.
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
          <div className="kpi-label">Total Assets</div>
          <div className="kpi-value">{assets.length}</div>
          <div className="kpi-note">Registered assets</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Active Assets</div>
          <div className="kpi-value">{activeAssets.length}</div>
          <div className="kpi-note">Currently maintained</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">High/Critical</div>
          <div className="kpi-value">{highCriticalAssets.length}</div>
          <div className="kpi-note">Priority assets</div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Fire Protection Asset List</h2>
          <p>Asset register awal untuk PLTU Merak Energi.</p>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Asset Code</th>
                <th>Asset Name</th>
                <th>Type</th>
                <th>Area</th>
                <th>Location</th>
                <th>Manufacturer</th>
                <th>Criticality</th>
                <th>Status</th>
                <th>Last Inspection</th>
                <th>Next Inspection</th>
              </tr>
            </thead>

            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id}>
                  <td>
                    <strong>{asset.asset_code}</strong>
                  </td>
                  <td>{asset.asset_name}</td>
                  <td>{asset.asset_type}</td>
                  <td>{asset.area || "-"}</td>
                  <td>{asset.location || "-"}</td>
                  <td>{asset.manufacturer || "-"}</td>
                  <td>
                    <span className={badgeClass(asset.criticality)}>
                      {asset.criticality}
                    </span>
                  </td>
                  <td>
                    <span className={badgeClass(asset.status)}>{asset.status}</span>
                  </td>
                  <td>{formatDate(asset.last_inspection_date)}</td>
                  <td>{formatDate(asset.next_inspection_date)}</td>
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
    grid-template-columns: repeat(3, 1fr);
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
    white-space: nowrap;
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
  }

  .badge.active {
    background: #ecfdf5;
    color: #047857;
    border-color: #a7f3d0;
  }

  .badge.high {
    background: #fff7ed;
    color: #c2410c;
    border-color: #fed7aa;
  }

  .badge.medium {
    background: #eff6ff;
    color: #1d4ed8;
    border-color: #bfdbfe;
  }

  .badge.critical {
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
