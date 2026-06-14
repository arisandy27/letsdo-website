import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

async function saveAsset(formData) {
  "use server";

  const supabase = getSupabaseClient();

  if (!supabase) {
    redirect("/lab/fire-maintenance/assets?error=env");
  }

  const projectId = formData.get("project_id");
  const assetId = formData.get("asset_id");

  if (!projectId) {
    redirect("/lab/fire-maintenance/assets?error=project");
  }

  const payload = {
    project_id: projectId,
    asset_code: formData.get("asset_code"),
    asset_name: formData.get("asset_name"),
    asset_type: formData.get("asset_type"),
    area: formData.get("area") || null,
    location: formData.get("location") || null,
    manufacturer: formData.get("manufacturer") || null,
    model: formData.get("model") || null,
    serial_no: formData.get("serial_no") || null,
    criticality: formData.get("criticality") || "medium",
    status: formData.get("status") || "active",
    last_inspection_date: formData.get("last_inspection_date") || null,
    next_inspection_date: formData.get("next_inspection_date") || null,
    notes: formData.get("notes") || null,
  };

  if (assetId) {
    const { error } = await supabase
      .from("fire_assets")
      .update(payload)
      .eq("id", assetId);

    if (error) {
      redirect("/lab/fire-maintenance/assets?error=update");
    }

    revalidatePath("/lab/fire-maintenance/assets");
    revalidatePath("/lab/fire-maintenance");
    redirect("/lab/fire-maintenance/assets?updated=1");
  }

  const { error } = await supabase.from("fire_assets").insert(payload);

  if (error) {
    redirect("/lab/fire-maintenance/assets?error=insert");
  }

  revalidatePath("/lab/fire-maintenance/assets");
  revalidatePath("/lab/fire-maintenance");
  redirect("/lab/fire-maintenance/assets?created=1");
}

async function deleteAsset(formData) {
  "use server";

  const supabase = getSupabaseClient();

  if (!supabase) {
    redirect("/lab/fire-maintenance/assets?error=env");
  }

  const assetId = formData.get("asset_id");

  if (!assetId) {
    redirect("/lab/fire-maintenance/assets?error=delete");
  }

  const { error } = await supabase.from("fire_assets").delete().eq("id", assetId);

  if (error) {
    redirect("/lab/fire-maintenance/assets?error=delete");
  }

  revalidatePath("/lab/fire-maintenance/assets");
  revalidatePath("/lab/fire-maintenance");
  redirect("/lab/fire-maintenance/assets?deleted=1");
}

async function loadPageData() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      error:
        "Supabase env belum terbaca. Cek .env.local: NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const [projectRes, assetsRes] = await Promise.all([
    supabase
      .from("fire_projects")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("fire_assets")
      .select("*, fire_projects(project_name, client_name, vendor_name, site_name)")
      .order("asset_code", { ascending: true }),
  ]);

  const error = projectRes.error || assetsRes.error;

  if (error) return { error: error.message };

  return {
    project: projectRes.data,
    assets: assetsRes.data || [],
  };
}

export default async function FireAssetRegisterPage({ searchParams }) {
  const params = await searchParams;
  const data = await loadPageData();

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

  const { project, assets } = data;

  const editingAsset = assets.find((item) => item.id === params?.edit) || null;

  const created = params?.created;
  const updated = params?.updated;
  const deleted = params?.deleted;
  const error = params?.error;

  const activeAssets = assets.filter((item) => item.status === "active");
  const highCriticalAssets = assets.filter((item) =>
    ["high", "critical"].includes(String(item.criticality).toLowerCase())
  );

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
            inspection, finding, evidence, dan report.
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

      {created && <div className="success-box">Asset baru berhasil ditambahkan.</div>}
      {updated && <div className="success-box">Asset berhasil diupdate.</div>}
      {deleted && <div className="success-box">Asset berhasil dihapus.</div>}
      {error && (
        <div className="error-box">
          Ada error pada asset register. Pastikan Asset Code belum pernah dipakai.
        </div>
      )}

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

      <section className="two-col">
        <form action={saveAsset} className="panel">
          <div className="panel-head">
            <h2>{editingAsset ? "Edit Asset" : "Add New Asset"}</h2>
            <p>
              {editingAsset
                ? "Update data asset fire protection."
                : "Tambahkan asset fire protection baru ke register."}
            </p>

            {editingAsset && (
              <Link href="/lab/fire-maintenance/assets" className="cancel-link">
                Cancel Edit
              </Link>
            )}
          </div>

          <input type="hidden" name="project_id" value={project?.id || ""} />
          <input type="hidden" name="asset_id" value={editingAsset?.id || ""} />

          <label>
            Asset Code
            <input
              type="text"
              name="asset_code"
              required
              defaultValue={editingAsset?.asset_code || ""}
              placeholder="Contoh: FMP-008"
            />
          </label>

          <label>
            Asset Name
            <input
              type="text"
              name="asset_name"
              required
              defaultValue={editingAsset?.asset_name || ""}
              placeholder="Contoh: Fire Alarm Panel Area Boiler"
            />
          </label>

          <label>
            Asset Type
            <select
              name="asset_type"
              required
              defaultValue={editingAsset?.asset_type || ""}
            >
              <option value="">Select type</option>
              <option value="Fire Alarm System">Fire Alarm System</option>
              <option value="Detector">Detector</option>
              <option value="CO2 System">CO2 System</option>
              <option value="FM-200 System">FM-200 System</option>
              <option value="Deluge Valve">Deluge Valve</option>
              <option value="Hydrant System">Hydrant System</option>
              <option value="APAR">APAR</option>
              <option value="SCBA">SCBA</option>
              <option value="Foam System">Foam System</option>
              <option value="Other">Other</option>
            </select>
          </label>

          <label>
            Area
            <input
              type="text"
              name="area"
              defaultValue={editingAsset?.area || ""}
              placeholder="Contoh: Boiler Area"
            />
          </label>

          <label>
            Location
            <input
              type="text"
              name="location"
              defaultValue={editingAsset?.location || ""}
              placeholder="Contoh: Boiler Room"
            />
          </label>

          <label>
            Manufacturer
            <input
              type="text"
              name="manufacturer"
              defaultValue={editingAsset?.manufacturer || ""}
              placeholder="Contoh: Siemens"
            />
          </label>

          <label>
            Model
            <input
              type="text"
              name="model"
              defaultValue={editingAsset?.model || ""}
              placeholder="Contoh: FC724"
            />
          </label>

          <label>
            Serial No
            <input
              type="text"
              name="serial_no"
              defaultValue={editingAsset?.serial_no || ""}
              placeholder="Optional"
            />
          </label>

          <label>
            Criticality
            <select
              name="criticality"
              defaultValue={editingAsset?.criticality || "medium"}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>

          <label>
            Last Inspection Date
            <input
              type="date"
              name="last_inspection_date"
              defaultValue={editingAsset?.last_inspection_date || ""}
            />
          </label>

          <label>
            Next Inspection Date
            <input
              type="date"
              name="next_inspection_date"
              defaultValue={editingAsset?.next_inspection_date || ""}
            />
          </label>

          <label>
            Status
            <select name="status" defaultValue={editingAsset?.status || "active"}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </label>

          <label>
            Notes
            <textarea
              name="notes"
              rows="3"
              defaultValue={editingAsset?.notes || ""}
              placeholder="Catatan asset, coverage area, atau remark lainnya..."
            />
          </label>

          <button type="submit">
            {editingAsset ? "Update Asset" : "Add Asset"}
          </button>
        </form>

        <section className="panel">
          <div className="panel-head">
            <h2>Fire Protection Asset List</h2>
            <p>Asset register untuk project ini.</p>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Action</th>
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
                      <div className="actions">
                        <Link
                          href={`/lab/fire-maintenance/assets?edit=${asset.id}`}
                          className="edit-link"
                        >
                          Edit
                        </Link>

                        <form action={deleteAsset}>
                          <input type="hidden" name="asset_id" value={asset.id} />
                          <button type="submit" className="delete-button">
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>

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

  .back-link,
  .cancel-link {
    display: inline-flex;
    margin-bottom: 16px;
    color: #ea580c;
    text-decoration: none;
    font-weight: 900;
  }

  .cancel-link {
    margin-top: 10px;
    margin-bottom: 0;
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

  .two-col {
    display: grid;
    grid-template-columns: 420px 1fr;
    gap: 14px;
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

  label {
    display: grid;
    gap: 6px;
    margin-bottom: 12px;
    color: #334155;
    font-size: 13px;
    font-weight: 900;
  }

  input,
  select,
  textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #cbd5e1;
    border-radius: 12px;
    padding: 10px 12px;
    font-size: 14px;
    color: #0f172a;
    background: white;
  }

  textarea {
    resize: vertical;
  }

  button {
    border: none;
    background: #ea580c;
    color: white;
    font-weight: 900;
    border-radius: 12px;
    padding: 11px 14px;
    cursor: pointer;
    box-shadow: 0 8px 18px rgba(234,88,12,.22);
  }

  button:hover {
    background: #c2410c;
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

  .actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .edit-link {
    display: inline-flex;
    padding: 6px 10px;
    border-radius: 999px;
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
    text-decoration: none;
    font-size: 12px;
    font-weight: 900;
  }

  .delete-button {
    padding: 6px 10px;
    border-radius: 999px;
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
    box-shadow: none;
    font-size: 12px;
  }

  .delete-button:hover {
    background: #fee2e2;
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

  .badge.inactive,
  .badge.archived {
    background: #f1f5f9;
    color: #475569;
    border-color: #cbd5e1;
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

  .badge.low {
    background: #f1f5f9;
    color: #475569;
    border-color: #cbd5e1;
  }

  .badge.critical {
    background: #fef2f2;
    color: #b91c1c;
    border-color: #fecaca;
  }

  .success-box {
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #a7f3d0;
    border-radius: 14px;
    padding: 12px;
    margin-bottom: 14px;
    font-weight: 900;
  }

  .error-box {
    background: white;
    border: 1px solid #fecaca;
    color: #b91c1c;
    border-radius: 18px;
    padding: 20px;
    margin-bottom: 14px;
  }

  @media (max-width: 1000px) {
    .hero,
    .two-col,
    .kpi-grid {
      grid-template-columns: 1fr;
    }
  }
`;

