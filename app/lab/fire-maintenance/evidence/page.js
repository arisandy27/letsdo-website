import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

function monthInputToDate(value) {
  if (!value) return null;
  return `${value}-01`;
}

function formatDate(value) {
  if (!value) return "-";
  const text = String(value);
  if (text.length < 10) return text;
  return `${text.slice(8, 10)}/${text.slice(5, 7)}/${text.slice(0, 4)}`;
}

function formatMonth(value) {
  if (!value) return "-";
  const text = String(value);
  if (text.length < 7) return text;
  return `${text.slice(5, 7)}/${text.slice(0, 4)}`;
}

function badgeClass(value) {
  const key = String(value || "default").toLowerCase().replaceAll("_", "-");
  return `badge ${key}`;
}

async function createEvidence(formData) {
  "use server";

  const supabase = getSupabaseClient();

  if (!supabase) {
    redirect("/lab/fire-maintenance/evidence?error=env");
  }

  const projectId = formData.get("project_id");
  const uploadedFile = formData.get("evidence_file");

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
  revalidatePath("/lab/fire-maintenance/reports/print");
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

  const [projectRes, attachmentsRes, summaryRes] = await Promise.all([
    supabase
      .from("fire_projects")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("fire_attachments")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("v_fire_attachment_summary")
      .select("*"),
  ]);

  const error = projectRes.error || attachmentsRes.error || summaryRes.error;

  if (error) return { error: error.message };

  const rawAttachments = attachmentsRes.data || [];

  const attachments = await Promise.all(
    rawAttachments.map(async (item) => {
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
    project: projectRes.data,
    attachments,
    summary: summaryRes.data || [],
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
          <Link href="/lab/fire-maintenance" className="back-link">
            ← Back to Fire Dashboard
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

      <section className="two-col">
        <form action={createEvidence} className="panel">
          <div className="panel-head">
            <h2>New Evidence</h2>
            <p>Upload evidence file langsung ke Supabase Storage atau input manual URL/path bila file sudah tersedia.</p>
          </div>

          <input type="hidden" name="project_id" value={project?.id || ""} />

          <label>
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

          <label>
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

          <label>
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

          <label>
            Description
            <textarea
              name="description"
              rows="4"
              placeholder="Catatan evidence, lokasi, hasil test, atau referensi finding..."
            />
          </label>

          <button type="submit">Save Evidence</button>
        </form>

        <section className="panel">
          <div className="panel-head">
            <h2>Evidence List</h2>
            <p>Daftar lampiran yang sudah diregister.</p>
          </div>

          <div className="evidence-list">
            {attachments.map((item) => (
              <div className="evidence-card" key={item.id}>
                <div className="evidence-top">
                  <strong>{item.title}</strong>
                  <span className={badgeClass(item.evidence_type)}>
                    {item.evidence_type}
                  </span>
                </div>

                <div className="evidence-meta">
                  Ref: {item.reference_type} · Report: {item.report_type || "-"} · Month:{" "}
                  {formatMonth(item.report_month)}
                </div>

                <div className="evidence-meta">
                  File: {item.file_name || "-"}
                </div>

                {item.signed_url && (
                  <a className="file-link" href={item.signed_url} target="_blank">
                    Open File →
                  </a>
                )}

                {item.file_path && (
                  <div className="file-path">Path: {item.file_path}</div>
                )}

                <div className="evidence-desc">{item.description || "-"}</div>

                <div className="evidence-meta">
                  Uploaded by: {item.uploaded_by || "-"} · {formatDate(item.created_at)}
                </div>
              </div>
            ))}

            {attachments.length === 0 && (
              <div className="empty-box">Belum ada evidence.</div>
            )}
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
    grid-template-columns: repeat(4, 1fr);
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

  .evidence-list {
    display: grid;
    gap: 10px;
  }

  .evidence-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 12px;
  }

  .evidence-top {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 8px;
  }

  .evidence-top strong {
    color: #ea580c;
  }

  .evidence-meta,
  .evidence-desc,
  .file-path {
    color: #64748b;
    font-size: 12px;
    line-height: 1.5;
    margin-bottom: 6px;
  }

  .file-link {
    display: inline-flex;
    margin-bottom: 8px;
    color: #047857;
    font-weight: 900;
    text-decoration: none;
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
    white-space: nowrap;
  }

  .badge.photo {
    background: #eff6ff;
    color: #1d4ed8;
    border-color: #bfdbfe;
  }

  .badge.test-result {
    background: #ecfdf5;
    color: #047857;
    border-color: #a7f3d0;
  }

  .badge.signed-report,
  .badge.document {
    background: #fff7ed;
    color: #c2410c;
    border-color: #fed7aa;
  }

  .badge.attendance {
    background: #fefce8;
    color: #a16207;
    border-color: #fde68a;
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

  .empty-box {
    color: #64748b;
    padding: 18px;
    text-align: center;
    border: 1px dashed #cbd5e1;
    border-radius: 14px;
  }

  @media (max-width: 900px) {
    .hero,
    .two-col,
    .kpi-grid {
      grid-template-columns: 1fr;
    }
  }
`;



