import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import EquipmentAssetListClient from "./EquipmentAssetListClient";

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
    asset_level: "equipment",
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
    revalidatePath("/lab/fire-maintenance/asset-register");
    revalidatePath("/lab/fire-maintenance");
    redirect("/lab/fire-maintenance/assets?updated=1");
  }

  const { error } = await supabase.from("fire_assets").insert(payload);

  if (error) {
    redirect("/lab/fire-maintenance/assets?error=insert");
  }

  revalidatePath("/lab/fire-maintenance/assets");
  revalidatePath("/lab/fire-maintenance/asset-register");
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
  revalidatePath("/lab/fire-maintenance/asset-register");
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

  const { data: project, error: projectError } = await supabase
    .from("fire_projects")
    .select("*")
    .eq("project_code", PROJECT_CODE)
    .maybeSingle();

  if (projectError) return { error: projectError.message };
  if (!project) return { error: `Project not found: ${PROJECT_CODE}` };

  const { data: assets, error: assetsError } = await supabase
    .from("fire_assets")
    .select("*")
    .eq("project_id", project.id)
    .order("asset_code", { ascending: true });

  if (assetsError) return { error: assetsError.message };

  return {
    project,
    assets: assets || [],
  };
}

export default async function FireAssetRegisterPage({ searchParams }) {
  const params = await searchParams;
  const data = await loadPageData();

  if (data.error) {
    return (
      <main style={pageStyle}>
        <section style={errorBoxStyle}>
          <h1>Equipment Register</h1>
          <p>{data.error}</p>
        </section>
      </main>
    );
  }

  const { project, assets } = data;

  const equipmentAssets = assets.filter(
    (item) => !item.asset_level || item.asset_level === "equipment"
  );

  const editingAsset =
    equipmentAssets.find((item) => item.id === params?.edit) || null;

  const created = params?.created;
  const updated = params?.updated;
  const deleted = params?.deleted;
  const error = params?.error;

  const showForm = params?.new === "1" || Boolean(editingAsset);
  const activeAssets = equipmentAssets.filter((item) => item.status === "active");
  const highCriticalAssets = equipmentAssets.filter((item) =>
    ["high", "critical"].includes(String(item.criticality).toLowerCase())
  );

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <div>
          <Link href="/lab/fire-maintenance" style={backLinkStyle}>Back to Fire Maintenance Dashboard</Link>

          <div style={eyebrowStyle}>FIRE MAINTENANCE PRO</div>
          <h1 style={heroTitleStyle}>Equipment Register</h1>
          <p style={heroTextStyle}>
            Master list maintainable fire protection equipment for maintenance schedule,
            inspection, finding, evidence, and report.
          </p>
        </div>

        <div style={projectBoxStyle}>
          <div style={projectLabelStyle}>PROJECT</div>
          <div style={projectTitleStyle}>{project?.project_name || "-"}</div>
          <div style={projectMetaStyle}>{project?.site_name || "-"}</div>
          <div style={projectMetaStyle}>Client: {project?.client_name || "-"}</div>
          <div style={projectMetaStyle}>Vendor: {project?.vendor_name || "-"}</div>
        </div>
      </section>

      {created && <div style={successBoxStyle}>Asset baru berhasil ditambahkan.</div>}
      {updated && <div style={successBoxStyle}>Asset berhasil diupdate.</div>}
      {deleted && <div style={successBoxStyle}>Asset berhasil dihapus.</div>}
      {error && (
        <div style={errorBoxStyle}>
          Ada error pada equipment register. Pastikan Asset Code belum pernah dipakai.
        </div>
      )}

      <section style={kpiGridStyle}>
        <KpiCard title="Total Equipment" value={equipmentAssets.length} caption="Maintainable assets" />
        <KpiCard title="Active Equipment" value={activeAssets.length} caption="Currently maintained" />
        <KpiCard title="High/Critical" value={highCriticalAssets.length} caption="Priority equipment" />
      </section>

      <section style={layoutStyle}>
        {showForm && (
        <form action={saveAsset} style={panelStyle}>
          <div style={panelHeadStyle}>
            <h2 style={{ margin: 0 }}>{editingAsset ? "Edit Equipment" : "Add New Equipment"}</h2>
            <p style={panelTextStyle}>
              {editingAsset
                ? "Update equipment data."
                : "Tambahkan equipment fire protection baru ke register."}
            </p>

            {editingAsset && (
              <Link href="/lab/fire-maintenance/assets" style={cancelLinkStyle}>
                Cancel Edit
              </Link>
            )}
          </div>

          <input type="hidden" name="project_id" value={project?.id || ""} />
          <input type="hidden" name="asset_id" value={editingAsset?.id || ""} />

          <Field label="Asset Code">
            <input
              type="text"
              name="asset_code"
              required
              defaultValue={editingAsset?.asset_code || ""}
              placeholder="Contoh: FMP-008"
              style={inputStyle}
            />
          </Field>

          <Field label="Asset Name">
            <input
              type="text"
              name="asset_name"
              required
              defaultValue={editingAsset?.asset_name || ""}
              placeholder="Contoh: Fire Alarm Panel Area Boiler"
              style={inputStyle}
            />
          </Field>

          <Field label="Asset Type">
            <select
              name="asset_type"
              required
              defaultValue={editingAsset?.asset_type || ""}
              style={inputStyle}
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
          </Field>

          <Field label="Area">
            <input
              type="text"
              name="area"
              defaultValue={editingAsset?.area || ""}
              placeholder="Contoh: Boiler Area"
              style={inputStyle}
            />
          </Field>

          <Field label="Location">
            <input
              type="text"
              name="location"
              defaultValue={editingAsset?.location || ""}
              placeholder="Contoh: Boiler Room"
              style={inputStyle}
            />
          </Field>

          <Field label="Manufacturer">
            <input
              type="text"
              name="manufacturer"
              defaultValue={editingAsset?.manufacturer || ""}
              placeholder="Contoh: Siemens"
              style={inputStyle}
            />
          </Field>

          <Field label="Model">
            <input
              type="text"
              name="model"
              defaultValue={editingAsset?.model || ""}
              placeholder="Contoh: FC724"
              style={inputStyle}
            />
          </Field>

          <Field label="Serial No">
            <input
              type="text"
              name="serial_no"
              defaultValue={editingAsset?.serial_no || ""}
              placeholder="Optional"
              style={inputStyle}
            />
          </Field>

          <Field label="Criticality">
            <select
              name="criticality"
              defaultValue={editingAsset?.criticality || "medium"}
              style={inputStyle}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </Field>

          <Field label="Last Inspection Date">
            <input
              type="date"
              name="last_inspection_date"
              defaultValue={editingAsset?.last_inspection_date || ""}
              style={inputStyle}
            />
          </Field>

          <Field label="Next Inspection Date">
            <input
              type="date"
              name="next_inspection_date"
              defaultValue={editingAsset?.next_inspection_date || ""}
              style={inputStyle}
            />
          </Field>

          <Field label="Status">
            <select
              name="status"
              defaultValue={editingAsset?.status || "active"}
              style={inputStyle}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </Field>

          <Field label="Notes">
            <textarea
              name="notes"
              rows="3"
              defaultValue={editingAsset?.notes || ""}
              placeholder="Catatan equipment, coverage area, atau remark lainnya..."
              style={{ ...inputStyle, height: "auto", paddingTop: 10 }}
            />
          </Field>

          <button type="submit" style={primaryButtonStyle}>
            {editingAsset ? "Update Equipment" : "Add Equipment"}
          </button>
        </form>
        )}

        <EquipmentAssetListClient
          assets={equipmentAssets}
          deleteAction={deleteAsset}
        />
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

function Field({ label, children }) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}

const pageStyle = {
  padding: 24,
  maxWidth: 1500,
  margin: "0 auto",
};

const heroStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 360px",
  gap: 20,
  alignItems: "center",
  marginBottom: 20,
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

const eyebrowStyle = {
  color: "#ea580c",
  fontWeight: 900,
  letterSpacing: 1.5,
  fontSize: 13,
  marginTop: 18,
  textTransform: "uppercase",
};

const heroTitleStyle = {
  fontSize: 34,
  margin: "10px 0",
  color: "#0f172a",
};

const heroTextStyle = {
  color: "#64748b",
  maxWidth: 820,
  margin: 0,
};

const projectBoxStyle = {
  background: "#0f172a",
  color: "white",
  padding: 20,
  borderRadius: 18,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.18)",
};

const projectLabelStyle = {
  color: "#fed7aa",
  fontWeight: 900,
  letterSpacing: 1.5,
  fontSize: 12,
  textTransform: "uppercase",
};

const projectTitleStyle = {
  fontSize: 22,
  fontWeight: 950,
  marginTop: 10,
};

const projectMetaStyle = {
  color: "#cbd5e1",
  marginTop: 6,
  fontSize: 14,
};

const successBoxStyle = {
  background: "#dcfce7",
  border: "1px solid #86efac",
  color: "#166534",
  padding: 12,
  borderRadius: 14,
  marginBottom: 14,
  fontWeight: 800,
};

const errorBoxStyle = {
  background: "#fee2e2",
  border: "1px solid #fecaca",
  color: "#991b1b",
  padding: 12,
  borderRadius: 14,
  marginBottom: 14,
  fontWeight: 800,
};

const kpiGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
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

const layoutStyle = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 18,
  alignItems: "start",
};

const panelStyle = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
};

const panelHeadStyle = {
  marginBottom: 14,
};

const panelTextStyle = {
  color: "#64748b",
  margin: "6px 0 0",
};

const cancelLinkStyle = {
  display: "inline-flex",
  marginTop: 10,
  color: "#0369a1",
  fontWeight: 900,
  textDecoration: "none",
};

const fieldStyle = {
  display: "grid",
  gap: 6,
  marginBottom: 12,
};

const labelStyle = {
  color: "#334155",
  fontWeight: 900,
  fontSize: 13,
};

const inputStyle = {
  width: "100%",
  height: 44,
  padding: "0 12px",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  fontSize: 14,
  boxSizing: "border-box",
  background: "white",
};

const primaryButtonStyle = {
  width: "100%",
  height: 44,
  border: "1px solid #ea580c",
  background: "#ea580c",
  color: "white",
  borderRadius: 8,
  fontWeight: 900,
  cursor: "pointer",
};