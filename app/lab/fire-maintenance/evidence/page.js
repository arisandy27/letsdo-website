import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import EvidenceListClient from "./EvidenceListClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

function monthInputToDate(value) {
  if (!value) return null;
  return `${value}-01`;
}

async function createEvidence(formData) {
  "use server";

  const supabase = getSupabaseClient();

  if (!supabase) {
    redirect("/lab/fire-maintenance/evidence?error=env");
  }

  const projectId = formData.get("project_id");
  const uploadedFile = formData.get("evidence_file");

  if (!projectId) {
    redirect("/lab/fire-maintenance/evidence?error=project");
  }

  let fileName = formData.get("file_name") || null;
  let filePath = formData.get("file_path") || null;
  let fileUrl = formData.get("file_url") || null;
  let mimeType = null;
  let fileSize = null;

  if (uploadedFile && uploadedFile.size > 0) {
    const originalName = uploadedFile.name || "evidence-file";
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "-");
    const generatedPath =
      "fire-maintenance/evidence/" +
      projectId +
      "/" +
      Date.now() +
      "-" +
      safeName;

    const arrayBuffer = await uploadedFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("lab-files")
      .upload(generatedPath, buffer, {
        contentType: uploadedFile.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      redirect("/lab/fire-maintenance/evidence?error=upload");
    }

    fileName = originalName;
    filePath = generatedPath;
    fileUrl = null;
    mimeType = uploadedFile.type || null;
    fileSize = uploadedFile.size || null;
  }

  const { error } = await supabase.from("fire_attachments").insert({
    project_id: projectId,
    reference_type: formData.get("reference_type") || "project",
    evidence_type: formData.get("evidence_type") || "photo",
    report_type: formData.get("report_type") || null,
    report_month: monthInputToDate(formData.get("report_month")),
    title: formData.get("title") || "-",
    description: formData.get("description") || null,
    file_name: fileName,
    file_url: fileUrl,
    file_path: filePath,
    mime_type: mimeType,
    file_size: fileSize,
    uploaded_by: formData.get("uploaded_by") || "Fire Kelas A Support",
  });

  if (error) {
    redirect("/lab/fire-maintenance/evidence?error=insert");
  }

  revalidatePath("/lab/fire-maintenance/evidence");
  revalidatePath("/lab/fire-maintenance/reports");
  revalidatePath("/lab/fire-maintenance/reports/print");
  revalidatePath("/lab/fire-maintenance");
  redirect("/lab/fire-maintenance/evidence?created=1");
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

  const { data: rawAttachments, error: attachmentError } = await supabase
    .from("fire_attachments")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  if (attachmentError) return { error: attachmentError.message };

  const attachments = await Promise.all(
    (rawAttachments || []).map(async (item) => {
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
  );

  return {
    project,
    attachments,
  };
}

export default async function FireEvidencePage({ searchParams }) {
  const params = await searchParams;
  const data = await loadPageData();

  if (data.error) {
    return (
      <main className="page">
        <style>{css}</style>
        <section className="error-box">
          <h1>Evidence / Attachments</h1>
          <p>{data.error}</p>
        </section>
      </main>
    );
  }

  const { project, attachments } = data;

  const created = params?.created;
  const error = params?.error;
  const showForm = params?.new === "1";

  const photoCount = attachments.filter((item) => item.evidence_type === "photo").length;
  const testCount = attachments.filter((item) => item.evidence_type === "test_result").length;
  const reportCount = attachments.filter(
    (item) => item.evidence_type === "signed_report" || item.reference_type === "report"
  ).length;

  return (
    <main className="page">
      <style>{css}</style>

      <section className="hero">
        <div>
          <Link href="/lab/fire-maintenance" style={backLinkStyle}>
            Back to Fire Maintenance Dashboard
          </Link>

          <div className="eyebrow">Fire Maintenance Pro</div>
          <h1>Evidence / Attachments</h1>
          <p>
            Register lampiran untuk foto pekerjaan, test result, checklist,
            signed report, daftar hadir training, dan dokumen pendukung.
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

      {created && <div className="success-box">Evidence berhasil disimpan.</div>}
      {error && <div className="error-box">Ada error saat menyimpan/upload evidence. Pastikan bucket lab-files tersedia.</div>}

      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Evidence</div>
          <div className="kpi-value">{attachments.length}</div>
          <div className="kpi-note">All attachments</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Photos</div>
          <div className="kpi-value">{photoCount}</div>
          <div className="kpi-note">Photo evidence</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Test Results</div>
          <div className="kpi-value">{testCount}</div>
          <div className="kpi-note">Measurement / test data</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Reports</div>
          <div className="kpi-value">{reportCount}</div>
          <div className="kpi-note">Report attachments</div>
        </div>
      </section>

      {showForm && (
        <form action={createEvidence} className="panel form-panel">
          <div className="panel-head">
            <h2>New Evidence</h2>
            <p>Upload evidence file langsung ke Supabase Storage atau input manual URL/path bila file sudah tersedia.</p>

            <Link href="/lab/fire-maintenance/evidence" className="cancel-link">
              Cancel
            </Link>
          </div>

          <input type="hidden" name="project_id" value={project?.id || ""} />

          <div className="form-grid">
            <label className="wide">
              Evidence Title
              <input
                type="text"
                name="title"
                required
                placeholder="Contoh: Foto pressure gauge FM-200"
              />
            </label>

            <label>
              Reference Type
              <select name="reference_type" defaultValue="inspection">
                <option value="project">Project</option>
                <option value="schedule">Schedule</option>
                <option value="inspection">Inspection</option>
                <option value="finding">Finding</option>
                <option value="training">Training</option>
                <option value="report">Report</option>
                <option value="scope">Scope</option>
              </select>
            </label>

            <label>
              Evidence Type
              <select name="evidence_type" defaultValue="photo">
                <option value="photo">Photo</option>
                <option value="test_result">Test Result</option>
                <option value="checklist">Checklist</option>
                <option value="signed_report">Signed Report</option>
                <option value="attendance">Training Attendance</option>
                <option value="material_recommendation">Material Recommendation</option>
                <option value="document">Document</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label>
              Report Type
              <select name="report_type" defaultValue="">
                <option value="">Not report-specific</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">3 Month / Quarterly</option>
                <option value="semester">6 Month / Semiannual</option>
                <option value="annual">Annual</option>
              </select>
            </label>

            <label>
              Report Month
              <input type="month" name="report_month" />
            </label>

            <label className="wide">
              Upload File
              <input
                type="file"
                name="evidence_file"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              />
            </label>

            <label>
              File Name
              <input
                type="text"
                name="file_name"
                placeholder="Optional bila tidak upload file"
              />
            </label>

            <label>
              File URL
              <input
                type="text"
                name="file_url"
                placeholder="https://... atau signed URL"
              />
            </label>

            <label className="wide">
              File Path
              <input
                type="text"
                name="file_path"
                placeholder="fire-maintenance/evidence/..."
              />
            </label>

            <label>
              Uploaded By
              <input
                type="text"
                name="uploaded_by"
                defaultValue="Fire Kelas A Support"
              />
            </label>

            <label className="wide">
              Description
              <textarea
                name="description"
                rows="4"
                placeholder="Catatan evidence, lokasi, hasil test, atau referensi finding..."
              />
            </label>
          </div>

          <button type="submit" className="submit-button">
            Save Evidence
          </button>
        </form>
      )}

      <EvidenceListClient attachments={attachments} />
    </main>
  );
}

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
    grid-template-columns: minmax(0, 1fr) 360px;
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
    grid-template-columns: repeat(4, minmax(0, 1fr));
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

  .form-panel {
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

  .panel-head {
    margin-bottom: 14px;
  }

  .cancel-link {
    display: inline-flex;
    margin-top: 10px;
    color: #0369a1;
    text-decoration: none;
    font-weight: 900;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .wide {
    grid-column: 1 / -1;
  }

  label {
    display: grid;
    gap: 6px;
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
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 14px;
    color: #0f172a;
    background: white;
  }

  textarea {
    resize: vertical;
  }

  .submit-button {
    margin-top: 14px;
    border: none;
    background: #ea580c;
    color: white;
    font-weight: 900;
    border-radius: 8px;
    padding: 11px 16px;
    cursor: pointer;
    box-shadow: 0 8px 18px rgba(234,88,12,.22);
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

  @media (max-width: 900px) {
    .hero,
    .form-grid,
    .kpi-grid {
      grid-template-columns: 1fr;
    }
  }
`;