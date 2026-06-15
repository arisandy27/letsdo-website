import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

function formatText(value) {
  return value || "-";
}

async function addMapping(formData) {
  "use server";

  const supabase = getSupabaseAdmin();

  const scopeTemplateId = formData.get("scope_template_id");
  const assetId = formData.get("asset_id");
  const notes = formData.get("notes") || "Manual mapping";

  const { data: project } = await supabase
    .from("fire_projects")
    .select("id")
    .eq("project_code", PROJECT_CODE)
    .maybeSingle();

  if (!project?.id || !scopeTemplateId || !assetId) {
    redirect("/lab/fire-maintenance/scope-mapping?error=missing");
  }

  const { error } = await supabase.from("fire_scope_asset_mappings").upsert(
    {
      project_id: project.id,
      scope_template_id: scopeTemplateId,
      asset_id: assetId,
      active: true,
      notes,
    },
    {
      onConflict: "project_id,scope_template_id,asset_id",
    }
  );

  if (error) {
    redirect("/lab/fire-maintenance/scope-mapping?error=add");
  }

  revalidatePath("/lab/fire-maintenance/scope-mapping");
  redirect("/lab/fire-maintenance/scope-mapping?added=1");
}

async function deleteMapping(formData) {
  "use server";

  const supabase = getSupabaseAdmin();

  const mappingId = formData.get("mapping_id");

  if (!mappingId) {
    redirect("/lab/fire-maintenance/scope-mapping?error=missing_mapping");
  }

  const { error } = await supabase
    .from("fire_scope_asset_mappings")
    .delete()
    .eq("id", mappingId);

  if (error) {
    redirect("/lab/fire-maintenance/scope-mapping?error=delete");
  }

  revalidatePath("/lab/fire-maintenance/scope-mapping");
  redirect("/lab/fire-maintenance/scope-mapping?deleted=1");
}

async function regenerateSchedules() {
  "use server";

  const supabase = getSupabaseAdmin();

  const { error } = await supabase.rpc("generate_fire_contract_schedule_by_asset", {
    p_project_code: PROJECT_CODE,
  });

  if (error) {
    redirect("/lab/fire-maintenance/scope-mapping?error=regenerate");
  }

  revalidatePath("/lab/fire-maintenance/scope-mapping");
  revalidatePath("/lab/fire-maintenance/schedules");
  revalidatePath("/lab/fire-maintenance/inspections");
  revalidatePath("/lab/fire-maintenance/timeline");
  revalidatePath("/lab/fire-maintenance/reports");
  revalidatePath("/lab/fire-maintenance");

  redirect("/lab/fire-maintenance/scope-mapping?regenerated=1");
}

export default async function FireScopeMappingPage({ searchParams }) {
  const params = await searchParams;
  const supabase = getSupabaseAdmin();

  const { data: project } = await supabase
    .from("fire_projects")
    .select("*")
    .eq("project_code", PROJECT_CODE)
    .maybeSingle();

  const [
    summaryResult,
    detailResult,
    scopeResult,
    assetResult,
  ] = await Promise.all([
    supabase
      .from("v_fire_scope_asset_mapping_summary")
      .select("*")
      .order("sort_order", { ascending: true }),

    supabase
      .from("v_fire_asset_scope_mapping_detail")
      .select("*")
      .order("frequency", { ascending: true })
      .order("system_group", { ascending: true })
      .order("asset_code", { ascending: true }),

    supabase
      .from("fire_scope_templates")
      .select("id, frequency, system_group, scope_title, sort_order")
      .eq("active", true)
      .order("sort_order", { ascending: true }),

    project?.id
      ? supabase
          .from("fire_assets")
          .select("id, asset_code, asset_name, asset_type, area, status")
          .eq("project_id", project.id)
          .eq("status", "active")
          .order("asset_code", { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  const summary = summaryResult.data || [];
  const details = detailResult.data || [];
  const scopes = scopeResult.data || [];
  const assets = assetResult.data || [];

  const mappedCount = summary.filter((item) => item.mapping_status === "mapped").length;
  const notMappedCount = summary.filter((item) => item.mapping_status === "not_mapped").length;
  const totalMappings = details.length;

  return (
    <main style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <p>
        <a href="/lab/fire-maintenance" style={{ color: "#0369a1", fontWeight: 800 }}>
          ← Back to Fire Maintenance Dashboard
        </a>
      </p>

      <section
        style={{
          background: "linear-gradient(135deg, #0f172a, #075985)",
          color: "white",
          padding: 24,
          borderRadius: 18,
          marginBottom: 18,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 30 }}>Scope-to-Asset Mapping</h1>
        <p style={{ marginTop: 10, maxWidth: 900, color: "#dbeafe" }}>
          Map setiap scope preventive maintenance ke equipment/asset aktual agar schedule,
          inspection, progress, dan report menjadi lebih akurat.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
          <div style={cardDarkStyle}>
            <div style={labelDarkStyle}>Scope Items</div>
            <div style={valueDarkStyle}>{summary.length}</div>
          </div>
          <div style={cardDarkStyle}>
            <div style={labelDarkStyle}>Mapped</div>
            <div style={valueDarkStyle}>{mappedCount}</div>
          </div>
          <div style={cardDarkStyle}>
            <div style={labelDarkStyle}>Not Mapped</div>
            <div style={valueDarkStyle}>{notMappedCount}</div>
          </div>
          <div style={cardDarkStyle}>
            <div style={labelDarkStyle}>Active Mapping Rows</div>
            <div style={valueDarkStyle}>{totalMappings}</div>
          </div>
        </div>
      </section>

      {params?.added && <Alert text="Mapping added successfully." />}
      {params?.deleted && <Alert text="Mapping deleted successfully." />}
      {params?.regenerated && <Alert text="Schedule regenerated successfully." />}
      {params?.error && <ErrorAlert text={`Action failed: ${params.error}`} />}

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Add Manual Mapping</h2>

        <form action={addMapping} style={{ display: "grid", gap: 12 }}>
          <label style={labelStyle}>
            Scope Item
            <select name="scope_template_id" required style={inputStyle}>
              <option value="">Select scope item</option>
              {scopes.map((scope) => (
                <option key={scope.id} value={scope.id}>
                  {scope.frequency} | {scope.system_group} | {scope.scope_title}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            Asset / Equipment
            <select name="asset_id" required style={inputStyle}>
              <option value="">Select asset</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.asset_code} | {asset.asset_name} | {asset.asset_type}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            Notes
            <input
              name="notes"
              placeholder="Example: Manual correction based on site equipment list"
              style={inputStyle}
            />
          </label>

          <button type="submit" style={primaryButtonStyle}>
            Add Mapping
          </button>
        </form>
      </section>

      <section style={panelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={sectionTitleStyle}>Mapping Summary</h2>
            <p style={{ color: "#64748b", marginTop: 0 }}>
              Review scope yang sudah punya target asset dan scope yang masih belum mapped.
            </p>
          </div>

          <form action={regenerateSchedules}>
            <button type="submit" style={warningButtonStyle}>
              Regenerate Schedule from Mapping
            </button>
          </form>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Frequency</th>
                <th style={thStyle}>System</th>
                <th style={thStyle}>Scope</th>
                <th style={thStyle}>Mapped Assets</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((item) => (
                <tr key={item.scope_template_id}>
                  <td style={tdStyle}>{formatText(item.frequency)}</td>
                  <td style={tdStyle}>{formatText(item.system_group)}</td>
                  <td style={tdStyle}>{formatText(item.scope_title)}</td>
                  <td style={tdStyle}>
                    <strong>{item.mapped_asset_count || 0}</strong>
                    <div style={{ color: "#64748b", marginTop: 4 }}>
                      {formatText(item.mapped_assets)}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        ...badgeStyle,
                        background:
                          item.mapping_status === "mapped" ? "#dcfce7" : "#fee2e2",
                        color:
                          item.mapping_status === "mapped" ? "#166534" : "#991b1b",
                      }}
                    >
                      {item.mapping_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Active Mapping Detail</h2>

        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Scope</th>
                <th style={thStyle}>Asset</th>
                <th style={thStyle}>Area</th>
                <th style={thStyle}>Notes</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {details.map((item) => (
                <tr key={item.mapping_id}>
                  <td style={tdStyle}>
                    <strong>{item.frequency}</strong>
                    <div>{item.system_group}</div>
                    <div style={{ color: "#64748b" }}>{item.scope_title}</div>
                  </td>
                  <td style={tdStyle}>
                    <strong>{item.asset_code}</strong>
                    <div>{item.asset_name}</div>
                    <div style={{ color: "#64748b" }}>{item.asset_type}</div>
                  </td>
                  <td style={tdStyle}>{formatText(item.area)}</td>
                  <td style={tdStyle}>{formatText(item.notes)}</td>
                  <td style={tdStyle}>
                    <form action={deleteMapping}>
                      <input type="hidden" name="mapping_id" value={item.mapping_id} />
                      <button type="submit" style={dangerButtonStyle}>
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}

              {details.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ ...tdStyle, color: "#64748b" }}>
                    No mapping data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Alert({ text }) {
  return (
    <div
      style={{
        background: "#dcfce7",
        color: "#166534",
        padding: "12px 14px",
        borderRadius: 12,
        marginBottom: 14,
        fontWeight: 800,
      }}
    >
      {text}
    </div>
  );
}

function ErrorAlert({ text }) {
  return (
    <div
      style={{
        background: "#fee2e2",
        color: "#991b1b",
        padding: "12px 14px",
        borderRadius: 12,
        marginBottom: 14,
        fontWeight: 800,
      }}
    >
      {text}
    </div>
  );
}

const panelStyle = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  padding: 18,
  marginBottom: 18,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
};

const cardDarkStyle = {
  background: "rgba(255,255,255,0.12)",
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: 14,
  padding: 14,
  minWidth: 170,
};

const labelDarkStyle = {
  color: "#bfdbfe",
  fontSize: 13,
  fontWeight: 800,
};

const valueDarkStyle = {
  color: "white",
  fontSize: 30,
  fontWeight: 950,
  marginTop: 4,
};

const sectionTitleStyle = {
  marginTop: 0,
  marginBottom: 12,
  color: "#0f172a",
};

const labelStyle = {
  display: "grid",
  gap: 6,
  color: "#334155",
  fontWeight: 800,
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
};

const primaryButtonStyle = {
  background: "#0369a1",
  color: "white",
  border: 0,
  borderRadius: 12,
  padding: "11px 14px",
  fontWeight: 900,
  cursor: "pointer",
};

const warningButtonStyle = {
  background: "#ea580c",
  color: "white",
  border: 0,
  borderRadius: 12,
  padding: "11px 14px",
  fontWeight: 900,
  cursor: "pointer",
};

const dangerButtonStyle = {
  background: "#dc2626",
  color: "white",
  border: 0,
  borderRadius: 10,
  padding: "8px 10px",
  fontWeight: 800,
  cursor: "pointer",
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

