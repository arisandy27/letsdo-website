import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import TrainingListClient from "./TrainingListClient";

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

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

async function createTrainingRecord(formData) {
  "use server";

  const supabase = getSupabaseClient();

  if (!supabase) {
    redirect("/lab/fire-maintenance/training?error=env");
  }

  const projectId = formData.get("project_id");

  if (!projectId) {
    redirect("/lab/fire-maintenance/training?error=project");
  }

  const { error } = await supabase.from("fire_training_records").insert({
    project_id: projectId,
    training_title: formData.get("training_title") || "-",
    topic: formData.get("topic") || "-",
    training_date: formData.get("training_date") || todayIso(),
    trainer_name: formData.get("trainer_name") || "Fire Kelas A Support",
    target_team: formData.get("target_team") || null,
    participants_count: Number(formData.get("participants_count") || 0),
    notes: formData.get("notes") || null,
  });

  if (error) {
    redirect("/lab/fire-maintenance/training?error=insert");
  }

  revalidatePath("/lab/fire-maintenance/training");
  revalidatePath("/lab/fire-maintenance/evidence");
  revalidatePath("/lab/fire-maintenance/reports");
  revalidatePath("/lab/fire-maintenance");
  redirect("/lab/fire-maintenance/training?created=1");
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

  const { data: trainings, error: trainingError } = await supabase
    .from("fire_training_records")
    .select("*, fire_projects(project_name, client_name, vendor_name, site_name)")
    .eq("project_id", project.id)
    .order("training_date", { ascending: false });

  if (trainingError) return { error: trainingError.message };

  return {
    project,
    trainings: trainings || [],
  };
}

export default async function FireTrainingPage({ searchParams }) {
  const params = await searchParams;
  const data = await loadPageData();

  if (data.error) {
    return (
      <main className="page">
        <style>{css}</style>
        <section className="error-box">
          <h1>Training Record</h1>
          <p>{data.error}</p>
        </section>
      </main>
    );
  }

  const { project, trainings } = data;

  const created = params?.created;
  const error = params?.error;
  const showForm = params?.new === "1";

  const totalParticipants = trainings.reduce(
    (sum, item) => sum + Number(item.participants_count || 0),
    0
  );

  const completedTrainings = trainings.filter(
    (item) => String(item.training_date) <= todayIso()
  );

  const plannedTrainings = trainings.filter(
    (item) => String(item.training_date) > todayIso()
  );

  return (
    <main className="page">
      <style>{css}</style>

      <section className="hero">
        <div>
          <Link href="/lab/fire-maintenance" style={backLinkStyle}>
            Back to Fire Maintenance Dashboard
          </Link>

          <div className="eyebrow">Fire Maintenance Pro</div>
          <h1>Training Record</h1>
          <p>
            Record pelatihan team kerja, awareness fire protection, dan class training
            CO2 / FM-200 / Deluge Valve.
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

      {created && <div className="success-box">Training record berhasil disimpan.</div>}
      {error && <div className="error-box">Ada error saat menyimpan training record.</div>}

      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Training</div>
          <div className="kpi-value">{trainings.length}</div>
          <div className="kpi-note">Training records</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Completed</div>
          <div className="kpi-value">{completedTrainings.length}</div>
          <div className="kpi-note">Done / past training</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Planned</div>
          <div className="kpi-value">{plannedTrainings.length}</div>
          <div className="kpi-note">Upcoming training</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Participants</div>
          <div className="kpi-value">{totalParticipants}</div>
          <div className="kpi-note">Total participants</div>
        </div>
      </section>

      {showForm && (
        <form action={createTrainingRecord} className="panel form-panel">
          <div className="panel-head">
            <h2>New Training Record</h2>
            <p>Input record pelatihan atau rencana training.</p>

            <Link href="/lab/fire-maintenance/training" className="cancel-link">
              Cancel
            </Link>
          </div>

          <input type="hidden" name="project_id" value={project?.id || ""} />

          <div className="form-grid">
            <label>
              Training Title
              <input
                type="text"
                name="training_title"
                required
                placeholder="Contoh: CO2 System Basic Training"
              />
            </label>

            <label>
              Topic
              <input
                type="text"
                name="topic"
                required
                placeholder="Contoh: CO2, FM-200, Deluge Valve"
              />
            </label>

            <label>
              Training Date
              <input type="date" name="training_date" defaultValue={todayIso()} />
            </label>

            <label>
              Trainer Name
              <input
                type="text"
                name="trainer_name"
                defaultValue="Fire Kelas A Support"
              />
            </label>

            <label>
              Target Team
              <input
                type="text"
                name="target_team"
                placeholder="Contoh: Maintenance Team / Vendor Team / Site Team"
              />
            </label>

            <label>
              Participants Count
              <input type="number" name="participants_count" min="0" defaultValue="0" />
            </label>

            <label className="wide">
              Notes
              <textarea
                name="notes"
                rows="4"
                placeholder="Catatan materi, peserta, evidence, atau rencana tindak lanjut..."
              />
            </label>
          </div>

          <button type="submit" className="submit-button">
            Save Training Record
          </button>
        </form>
      )}

      <TrainingListClient trainings={trainings} />
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