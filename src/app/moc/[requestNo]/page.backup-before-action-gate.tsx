"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type MocSummary = {
  request_no: string;
  title: string;
  description: string | null;
  company_name: string | null;
  site_name: string | null;
  department_name: string | null;
  area_name: string | null;
  requested_by_name: string | null;
  change_type: string | null;
  change_category: string | null;
  priority: string;
  status: string;
  screening_decision: string | null;
  classification_risk_level: string | null;
  complexity_level: string | null;
  highest_risk_before: string | null;
  highest_risk_after: string | null;
  total_actions: number;
  verified_actions: number;
  final_decision: string | null;
  implementation_status: string | null;
  pssr_status: string | null;
  closure_status: string | null;
  effectiveness_status: string | null;
};

type AuditEvent = {
  event_stage: string | null;
  event_type: string;
  event_title: string;
  event_detail: string | null;
  actor_name: string | null;
  actor_role: string | null;
  created_at: string;
};

type TimelineEvent = {
  event_stage: string;
  event_title: string;
  event_status: string | null;
  event_at: string | null;
  event_detail: string | null;
};

type MocAction = {
  id: string;
  action_no: string;
  action_title: string;
  action_description: string | null;
  priority: string;
  action_status: string;
  due_date: string | null;
  verification_comment: string | null;
};
type RequiredDocument = {
  id: string;
  moc_action_id: string;
  moc_request_id: string;
  document_name: string;
  document_type: string | null;
  requirement_note: string | null;
  is_mandatory: boolean;
  document_status: string;
};

type ActionAttachment = {
  id: string;
  moc_action_id: string;
  moc_request_id: string;
  required_document_id: string | null;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  attachment_category: string | null;
  description: string | null;
  verification_status: string | null;
  uploaded_at: string | null;
  verifier_comment: string | null;
  verified_at: string | null;
};
type TabName = "overview" | "timeline" | "actions" | "approval" | "audit";
const WORKFLOW_STAGES = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "classification", label: "Classification" },
  { value: "impact_review", label: "Impact Review" },
  { value: "risk_assessment", label: "Risk Assessment" },
  { value: "action_tracker", label: "Action Tracker" },
  { value: "approval", label: "Approval" },
  { value: "implementation", label: "Implementation" },
  { value: "pssr", label: "PSSR" },
  { value: "closure", label: "Closure" },
  { value: "closed", label: "Closed" },
];
export default function MocDetailPage() {
  const params = useParams();
  const requestNo = decodeURIComponent(String(params.requestNo || ""));

  const [activeTab, setActiveTab] = useState<TabName>("overview");
  const [summary, setSummary] = useState<MocSummary | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [actions, setActions] = useState<MocAction[]>([]);
const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocument[]>([]);
const [attachments, setAttachments] = useState<ActionAttachment[]>([]);
const [approvalSteps, setApprovalSteps] = useState<ApprovalStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function getCurrentProfile() {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  const userId = userData.user?.id;
  const userEmail = userData.user?.email;

  if (!userId) {
    throw new Error("User is not authenticated.");
  }

  const { data: profileData, error: profileError } = await supabase
    .from("users_profile")
    .select("id, full_name, app_role, email")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  return {
    id: profileData?.id || null,
    full_name: profileData?.full_name || userEmail || "Demo User",
    app_role: profileData?.app_role || "authenticated_user",
    email: profileData?.email || userEmail || null,
  };
}
async function getCurrentRequestId() {
  const { data, error: requestError } = await supabase
    .from("moc_requests")
    .select("id")
    .eq("request_no", requestNo)
    .single();

  if (requestError || !data?.id) {
    throw new Error(requestError?.message || "MOC request not found");
  }

  return data.id;
}
async function addAuditEvent(
  mocRequestId: string,
  profile: any,
  eventType: string,
  eventStage: string,
  eventTitle: string,
  eventDetail: string,
  sourceTable: string
) {
  const { error: auditError } = await supabase.from("moc_audit_events").insert({
    moc_request_id: mocRequestId,
    event_type: eventType,
    event_stage: eventStage,
    event_title: eventTitle,
    event_detail: eventDetail,
    actor_id: profile?.id || null,
    actor_name: profile?.full_name || profile?.email || "Demo User",
    actor_role: profile?.app_role || "authenticated_user",
    source_table: sourceTable,
  });

  if (auditError) {
    throw new Error(auditError.message);
  }
}
  async function loadDetail() {
    setLoading(true);
    setMessage("");

    const { data: summaryData, error: summaryError } = await supabase
      .from("v_moc_request_summary")
      .select("*")
      .eq("request_no", requestNo)
      .single();

    if (summaryError) {
      setMessage(`MOC detail error: ${summaryError.message}`);
      setLoading(false);
      return;
    }

    const { data: reqData, error: reqError } = await supabase
      .from("moc_requests")
      .select("id")
      .eq("request_no", requestNo)
      .single();

    if (reqError) {
      setMessage(`Request lookup error: ${reqError.message}`);
      setLoading(false);
      return;
    }

    const mocRequestId = reqData.id as string;
    setRequestId(mocRequestId);

    const { data: timelineData } = await supabase
      .from("v_moc_timeline_events")
      .select("*")
      .eq("request_no", requestNo)
      .order("event_at", { ascending: true });

    const { data: auditData } = await supabase
      .from("v_moc_audit_events")
      .select("*")
      .eq("request_no", requestNo)
      .order("created_at", { ascending: true });

    const { data: actionsData } = await supabase
      .from("moc_actions")
      .select("*")
      .eq("moc_request_id", mocRequestId)
      .order("action_no", { ascending: true });
const { data: requiredDocumentsData } = await supabase
  .from("moc_action_required_documents")
  .select("*")
  .eq("moc_request_id", mocRequestId)
  .order("created_at", { ascending: true });

const { data: attachmentsData } = await supabase
  .from("moc_action_attachments")
  .select("*")
  .eq("moc_request_id", mocRequestId)
  .order("uploaded_at", { ascending: true });

    const { data: approvalData } = await supabase
      .from("moc_approval_steps")
      .select("*")
      .eq("moc_request_id", mocRequestId)
      .order("step_no", { ascending: true });

    setSummary(summaryData as MocSummary);
    setTimeline((timelineData || []) as TimelineEvent[]);
    setAuditEvents((auditData || []) as AuditEvent[]);
    setActions((actionsData || []) as MocAction[]);
setRequiredDocuments((requiredDocumentsData || []) as RequiredDocument[]);
setAttachments((attachmentsData || []) as ActionAttachment[]);
setApprovalSteps((approvalData || []) as ApprovalStep[]);
    setLoading(false);
  }

  async function handleSubmitForScreening() {
  if (!summary) return;

  setLoading(true);
  setMessage("");

  try {
    const profile = await getCurrentProfile();
    const mocRequestId = await getCurrentRequestId();

    const { error: updateError } = await supabase
      .from("moc_requests")
      .update({ status: "submitted" })
      .eq("request_no", summary.request_no);

    if (updateError) throw new Error(updateError.message);

    await addAuditEvent(
      mocRequestId,
      profile,
      "submitted",
      "request",
      "MOC submitted for screening",
      "Draft MOC request was submitted for screening.",
      "moc_requests"
    );

    await loadDetail();
  } catch (err: any) {
    setMessage(`Submit failed: ${err.message}`);
    setLoading(false);
  }
}
  async function handleAcceptScreening() {
    if (!summary) return;

    setLoading(true);
    setMessage("");

    try {
      const profile = await getCurrentProfile();
      const mocRequestId = await getCurrentRequestId();

      const { error: screeningError } = await supabase
        .from("moc_screening")
        .upsert(
          {
            moc_request_id: mocRequestId,
            screening_decision: "accepted_as_moc",
            screening_date: new Date().toISOString().slice(0, 10),
            screened_by: profile.id,
            screening_notes:
              "Screening completed. Request is accepted as MOC and shall proceed to classification.",
          },
          { onConflict: "moc_request_id" }
        );

      if (screeningError) throw new Error(screeningError.message);

      const { error: updateError } = await supabase
        .from("moc_requests")
        .update({ status: "classification" })
        .eq("request_no", summary.request_no);

      if (updateError) throw new Error(updateError.message);

      await addAuditEvent(
        mocRequestId,
        profile,
        "screened",
        "screening",
        "MOC screening completed",
        "Screening decision: accepted as MOC. Request moved to classification stage.",
        "moc_screening"
      );

      await loadDetail();
    } catch (err: any) {
      setMessage(`Screening failed: ${err.message}`);
      setLoading(false);
    }
  }

  async function handleCompleteClassification() {
    if (!summary) return;

    setLoading(true);
    setMessage("");

    try {
      const profile = await getCurrentProfile();
      const mocRequestId = await getCurrentRequestId();

      const { error: classError } = await supabase
        .from("moc_classification")
        .upsert(
          {
            moc_request_id: mocRequestId,
            classified_by: profile.id,
            classification_date: new Date().toISOString().slice(0, 10),
            risk_level: "high",
            complexity_level: "medium",
            classification_notes:
              "Classification completed. This MOC is classified as a process change with medium complexity and high initial risk.",
          },
          { onConflict: "moc_request_id" }
        );

      if (classError) throw new Error(classError.message);

      const { error: updateError } = await supabase
        .from("moc_requests")
        .update({ status: "impact_review" })
        .eq("request_no", summary.request_no);

      if (updateError) throw new Error(updateError.message);

      await addAuditEvent(
        mocRequestId,
        profile,
        "classified",
        "classification",
        "MOC classification completed",
        "MOC classified as high initial risk and medium complexity. Request moved to impact review stage.",
        "moc_classification"
      );

      await loadDetail();
    } catch (err: any) {
      setMessage(`Classification failed: ${err.message}`);
      setLoading(false);
    }
  }

  async function handleCompleteImpactReview() {
    if (!summary) return;

    setLoading(true);
    setMessage("");

    try {
      const profile = await getCurrentProfile();
      const mocRequestId = await getCurrentRequestId();

      const { error: updateError } = await supabase
        .from("moc_requests")
        .update({ status: "risk_assessment" })
        .eq("request_no", summary.request_no);

      if (updateError) throw new Error(updateError.message);

      await addAuditEvent(
        mocRequestId,
        profile,
        "reviewed",
        "impact_review",
        "Impact review completed",
        "Impact review completed. Request moved to risk assessment stage.",
        "moc_impact_reviews"
      );

      await loadDetail();
    } catch (err: any) {
      setMessage(`Impact review failed: ${err.message}`);
      setLoading(false);
    }
  }
async function handleCompleteRiskAssessment() {
  if (!summary) return;

  setLoading(true);
  setMessage("");

  try {
    const profile = await getCurrentProfile();
    const mocRequestId = await getCurrentRequestId();

    const { error: updateError } = await supabase
      .from("moc_requests")
      .update({ status: "action_tracker" })
      .eq("request_no", summary.request_no);

    if (updateError) throw new Error(updateError.message);

    await addAuditEvent(
      mocRequestId,
      profile,
      "risk_assessed",
      "risk_assessment",
      "Risk assessment completed",
      "Risk assessment completed. Request moved to action tracker stage.",
      "moc_risk_assessments"
    );

    await loadDetail();
  } catch (err: any) {
    setMessage(`Risk assessment failed: ${err.message}`);
    setLoading(false);
  }
}
async function handleCompleteActionTracker() {
  if (!summary) return;

  setLoading(true);
  setMessage("");

  try {
    const profile = await getCurrentProfile();
    const mocRequestId = await getCurrentRequestId();

    const { data: actionRows, error: actionCheckError } = await supabase
      .from("moc_actions")
      .select("id, action_no, action_title, action_status")
      .eq("moc_request_id", mocRequestId);

    if (actionCheckError) {
      throw new Error(actionCheckError.message);
    }

    if (!actionRows || actionRows.length === 0) {
      setMessage(
        "Action tracker cannot be completed. No action items have been generated yet."
      );
      setLoading(false);
      return;
    }

    const pendingActions = actionRows.filter(
      (action) => action.action_status !== "verified"
    );

    if (pendingActions.length > 0) {
      setMessage(
        `Action tracker cannot be completed. ${pendingActions.length} action item(s) still not verified.`
      );
      setLoading(false);
      return;
    }

    const { data: mandatoryDocs, error: docsCheckError } = await supabase
      .from("moc_action_required_documents")
      .select("id, document_name, document_status, is_mandatory")
      .eq("moc_request_id", mocRequestId)
      .eq("is_mandatory", true);

    if (docsCheckError) {
      throw new Error(docsCheckError.message);
    }

    if (!mandatoryDocs || mandatoryDocs.length === 0) {
      setMessage(
        "Action tracker cannot be completed. Mandatory evidence requirements have not been generated yet."
      );
      setLoading(false);
      return;
    }

    const pendingMandatoryDocs = mandatoryDocs.filter(
      (doc) => doc.document_status !== "verified"
    );

    if (pendingMandatoryDocs.length > 0) {
      setMessage(
        `Action tracker cannot be completed. ${pendingMandatoryDocs.length} mandatory evidence document(s) still not verified.`
      );
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("moc_requests")
      .update({ status: "approval" })
      .eq("request_no", summary.request_no);

    if (updateError) throw new Error(updateError.message);

    await addAuditEvent(
      mocRequestId,
      profile,
      "action_verified",
      "action_tracker",
      "Action tracker completed",
      "All required action items and mandatory evidence were verified. Request moved to approval stage.",
      "moc_actions"
    );

    await loadDetail();
  } catch (err: any) {
    setMessage(`Action tracker failed: ${err.message}`);
    setLoading(false);
  }
}
async function handleCompleteApproval() {
  if (!summary) return;

  setLoading(true);
  setMessage("");

  try {
    const profile = await getCurrentProfile();
const mocRequestId = await getCurrentRequestId();
if (approvalSteps.length === 0) {
  setMessage(
    "Approval cannot be completed. Approval workflow steps have not been generated yet."
  );
  setLoading(false);
  return;
}

const rejectedApprovalSteps = approvalSteps.filter(
  (step) => step.decision === "rejected"
);

const pendingApprovalSteps = approvalSteps.filter(
  (step) =>
    !step.decision ||
    step.decision === "pending" ||
    step.decision === "-"
);

if (rejectedApprovalSteps.length > 0) {
  setMessage(
    `Approval cannot be completed. ${rejectedApprovalSteps.length} approval step(s) rejected this MOC.`
  );
  setLoading(false);
  return;
}

if (pendingApprovalSteps.length > 0) {
  setMessage(
    `Approval cannot be completed. ${pendingApprovalSteps.length} approval step(s) still pending.`
  );
  setLoading(false);
  return;
}

const { error: updateError } = await supabase
      .from("moc_requests")
      .update({ status: "implementation" })
      .eq("request_no", summary.request_no);

    if (updateError) throw new Error(updateError.message);

    await addAuditEvent(
      mocRequestId,
      profile,
      "approved",
      "approval",
      "MOC approval completed",
      "MOC has been approved. Request moved to implementation stage.",
      "moc_approval_workflows"
    );

    await loadDetail();
  } catch (err: any) {
    setMessage(`Approval failed: ${err.message}`);
    setLoading(false);
  }
} 
async function handleCompleteImplementation() {
  if (!summary) return;

  setLoading(true);
  setMessage("");

  try {
    const profile = await getCurrentProfile();
    const mocRequestId = await getCurrentRequestId();

    const { error: updateError } = await supabase
      .from("moc_requests")
      .update({ status: "pssr" })
      .eq("request_no", summary.request_no);

    if (updateError) throw new Error(updateError.message);

    await addAuditEvent(
      mocRequestId,
      profile,
      "implemented",
      "implementation",
      "Implementation completed",
      "Approved change has been implemented. Request moved to PSSR stage.",
      "moc_implementation_plans"
    );

    await loadDetail();
  } catch (err: any) {
    setMessage(`Implementation failed: ${err.message}`);
    setLoading(false);
  }
}
async function handleCompletePssr() {
  if (!summary) return;

  setLoading(true);
  setMessage("");

  try {
    const profile = await getCurrentProfile();
    const mocRequestId = await getCurrentRequestId();

    const { error: updateError } = await supabase
      .from("moc_requests")
      .update({ status: "closure" })
      .eq("request_no", summary.request_no);

    if (updateError) throw new Error(updateError.message);

    await addAuditEvent(
      mocRequestId,
      profile,
      "pssr_completed",
      "pssr",
      "PSSR completed",
      "Pre-startup safety review has been completed. Request moved to closure stage.",
      "moc_pssr_reviews"
    );

    await loadDetail();
  } catch (err: any) {
    setMessage(`PSSR failed: ${err.message}`);
    setLoading(false);
  }
}
async function handleCloseMoc() {
  if (!summary) return;

  setLoading(true);
  setMessage("");

  try {
    const profile = await getCurrentProfile();
    const mocRequestId = await getCurrentRequestId();

    const { error: updateError } = await supabase
      .from("moc_requests")
      .update({ status: "closed" })
      .eq("request_no", summary.request_no);

    if (updateError) throw new Error(updateError.message);

    await addAuditEvent(
      mocRequestId,
      profile,
      "closed",
      "closure",
      "MOC closed",
      "MOC has been reviewed and formally closed.",
      "moc_closure_reviews"
    );

    await loadDetail();
  } catch (err: any) {
    setMessage(`Closure failed: ${err.message}`);
    setLoading(false);
  }
}
useEffect(() => {
    if (requestNo) {
      loadDetail();
    }
  }, [requestNo]);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            ← Back to Dashboard
          </Link>

          <div className="flex flex-wrap gap-3">
            {summary?.status === "draft" && (
              <button
                onClick={handleSubmitForScreening}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Submit for Screening
              </button>
            )}

            {summary?.status === "submitted" && (
              <button
                onClick={handleAcceptScreening}
                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
              >
                Accept Screening
              </button>
            )}

            {summary?.status === "classification" && (
              <button
                onClick={handleCompleteClassification}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Complete Classification
              </button>
            )}

            {summary?.status === "impact_review" && (
              <button
                onClick={handleCompleteImpactReview}
                className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
              >
                Complete Impact Review
              </button>
            )}
{summary?.status === "risk_assessment" && (
  <button
    onClick={handleCompleteRiskAssessment}
    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
  >
    Complete Risk Assessment
  </button>
)}
{summary?.status === "action_tracker" && (
  <button
    onClick={handleCompleteActionTracker}
    className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
  >
    Complete Action Tracker
  </button>
)}
{summary?.status === "approval" && (
  <button
    onClick={handleCompleteApproval}
    className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
  >
    Complete Approval
  </button>
)}
{summary?.status === "implementation" && (
  <button
    onClick={handleCompleteImplementation}
    className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
  >
    Complete Implementation
  </button>
)}
{summary?.status === "pssr" && (
  <button
    onClick={handleCompletePssr}
    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
  >
    Complete PSSR
  </button>
)}
{summary?.status === "closure" && (
  <button
    onClick={handleCloseMoc}
    className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
  >
    Close MOC
  </button>
)}
            <button
              onClick={loadDetail}
              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Refresh
            </button>
          </div>
        </div>

        <section className="mb-6 overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl">
  <div className="px-8 py-8">
    <div className="flex flex-wrap items-start justify-between gap-6">
      <div>
        <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">
          MOC Detail
        </p>

        <h1 className="mt-3 text-4xl font-extrabold tracking-tight">
          {requestNo}
        </h1>

        <p className="mt-3 max-w-4xl text-base leading-7 text-slate-300">
          {summary?.title || "Loading MOC detail..."}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
          Current Status
        </p>
        <p className="mt-2 text-2xl font-bold">
          {summary?.status === "closed"
            ? "Completed Lifecycle"
            : formatStatus(summary?.status)}
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Priority: {formatStatus(summary?.priority)}
        </p>
      </div>
    </div>

    <div className="mt-7 flex flex-wrap gap-3">
      <span className="rounded-full bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300">
        Management of Change
      </span>
      <span className="rounded-full bg-blue-400/10 px-4 py-2 text-sm font-semibold text-blue-300">
        Process Safety Review
      </span>
      <span className="rounded-full bg-purple-400/10 px-4 py-2 text-sm font-semibold text-purple-300">
        Approval Workflow
      </span>
      <span className="rounded-full bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-300">
        Audit Trail
      </span>
    </div>
  </div>
</section>

        {message && (
          <p className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {message}
          </p>
        )}

        {loading && (
          <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow">
            Loading detail...
          </div>
        )}

        {!loading && summary && (
          <>
            <div className="mb-6 grid gap-4 md:grid-cols-4">
              <SummaryCard label="Status" value={summary.status} />
              <SummaryCard label="Priority" value={summary.priority} />
              <SummaryCard
                label="Risk Before"
                value={summary.highest_risk_before || "-"}
              />
              <SummaryCard
                label="Risk After"
                value={summary.highest_risk_after || "-"}
              />
            </div>
<WorkflowProgress currentStatus={summary.status} />
            <div className="mb-6 rounded-3xl bg-white p-3 shadow">
              <div className="flex flex-wrap gap-2">
                <TabButton label="Overview" tab="overview" activeTab={activeTab} setActiveTab={setActiveTab} />
                <TabButton label="Timeline" tab="timeline" activeTab={activeTab} setActiveTab={setActiveTab} />
                <TabButton label="Actions" tab="actions" activeTab={activeTab} setActiveTab={setActiveTab} />
                <TabButton label="Approval" tab="approval" activeTab={activeTab} setActiveTab={setActiveTab} />
                <TabButton label="Audit Log" tab="audit" activeTab={activeTab} setActiveTab={setActiveTab} />
              </div>
            </div>

            {activeTab === "overview" && <OverviewTab summary={summary} />}

{activeTab === "timeline" && <TimelineTab timeline={timeline} />}

{activeTab === "actions" && (
  <ActionsTab
    actions={actions}
    requestId={requestId}
    requiredDocuments={requiredDocuments}
    attachments={attachments}
    onRefresh={loadDetail}
  />
)}

{activeTab === "approval" && (
  <ApprovalTab approvalSteps={approvalSteps} />
)}

{activeTab === "audit" && <AuditTab auditEvents={auditEvents} />}
          </>
        )}
      </div>
    </main>
  );
}
function WorkflowProgress({ currentStatus }: { currentStatus: string }) {
  const currentIndex = WORKFLOW_STAGES.findIndex(
    (stage) => stage.value === currentStatus
  );

  const activeIndex = currentIndex >= 0 ? currentIndex : 0;

  return (
    <section className="mb-6 rounded-3xl bg-white p-6 shadow">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Workflow Progress</h2>
          <p className="text-sm text-slate-500">
            Current stage: {formatStatus(currentStatus)}
          </p>
        </div>

        <span className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
          {activeIndex + 1}/{WORKFLOW_STAGES.length}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-6">
        {WORKFLOW_STAGES.map((stage, index) => {
          const isDone = index < activeIndex;
          const isCurrent = index === activeIndex;

          return (
            <div
              key={stage.value}
              className={`rounded-2xl border p-4 ${
                isCurrent
                  ? "border-slate-950 bg-slate-950 text-white"
                  : isDone
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-slate-200 bg-slate-50 text-slate-500"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                Step {index + 1}
              </p>
              <p className="mt-2 text-sm font-bold">{stage.label}</p>
              <p className="mt-2 text-xs">
  {isCurrent && currentStatus === "closed"
    ? "Completed"
    : isCurrent
    ? "Current"
    : isDone
    ? "Done"
    : "Pending"}
</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}
function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold">{formatStatus(value)}</p>
    </div>
  );
}
function TabButton({
  label,
  tab,
  activeTab,
  setActiveTab,
}: {
  label: string;
  tab: TabName;
  activeTab: TabName;
  setActiveTab: (tab: TabName) => void;
}) {
  const isActive = activeTab === tab;

  return (
    <button
      onClick={() => setActiveTab(tab)}
      className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
        isActive
          ? "bg-slate-950 text-white"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

function OverviewTab({ summary }: { summary: MocSummary }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">MOC Overview</h2>
          <p className="text-sm text-slate-500">
            Key information, ownership, and workflow status for this MOC request.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge text={summary.status} />
          <Badge text={summary.priority} />
        </div>
      </div>

      <div className="mb-6 rounded-2xl bg-slate-950 p-5 text-white">
        <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">
          Change Title
        </p>
        <h3 className="mt-2 text-2xl font-bold">{summary.title}</h3>
        <p className="mt-3 max-w-5xl text-sm leading-6 text-slate-300">
          {summary.description || "-"}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-lg font-bold text-slate-950">
            Request Information
          </h3>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Info label="Company" value={summary.company_name || "-"} />
            <Info label="Site" value={summary.site_name || "-"} />
            <Info label="Department" value={summary.department_name || "-"} />
            <Info label="Area" value={summary.area_name || "-"} />
            <Info label="Requested By" value={summary.requested_by_name || "-"} />
            <Info label="Priority" value={formatStatus(summary.priority)} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-lg font-bold text-slate-950">
            Change Classification
          </h3>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Info label="Change Type" value={formatStatus(summary.change_type)} />
            <Info
              label="Change Category"
              value={formatStatus(summary.change_category)}
            />
            <Info
              label="Screening Decision"
              value={formatStatus(summary.screening_decision)}
            />
            <Info
              label="Classification Risk"
              value={formatStatus(summary.classification_risk_level)}
            />
            <Info
              label="Complexity"
              value={formatStatus(summary.complexity_level)}
            />
            <Info label="Current Status" value={formatStatus(summary.status)} />
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-lg font-bold text-slate-950">
          Workflow Status Summary
        </h3>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <MiniInfo
            label="Actions"
            value={`${summary.verified_actions}/${summary.total_actions} verified`}
          />
          <MiniInfo
            label="Approval"
            value={formatStatus(summary.final_decision)}
          />
          <MiniInfo
            label="Implementation"
            value={formatStatus(summary.implementation_status)}
          />
          <MiniInfo label="PSSR" value={formatStatus(summary.pssr_status)} />
          <MiniInfo label="Closure" value={formatStatus(summary.closure_status)} />
          <MiniInfo
            label="Effectiveness"
            value={formatStatus(summary.effectiveness_status)}
          />
          <MiniInfo
            label="Risk Before"
            value={formatStatus(summary.highest_risk_before)}
          />
          <MiniInfo
            label="Risk After"
            value={formatStatus(summary.highest_risk_after)}
          />
        </div>
      </div>
    </section>
  );
}
function TimelineTab({ timeline }: { timeline: TimelineEvent[] }) {
  const stageOrder: Record<string, number> = {
    request: 1,
    screening: 2,
    classification: 3,
    impact_review: 4,
    risk_assessment: 5,
    action_tracker: 6,
    approval: 7,
    implementation: 8,
    pssr: 9,
    closure: 10,
    effectiveness_review: 11,
    closed: 12,
  };

  const sortedTimeline = [...timeline].sort((a, b) => {
    const orderA = stageOrder[a.event_stage] || 999;
    const orderB = stageOrder[b.event_stage] || 999;

    if (orderA !== orderB) return orderA - orderB;

    return (
      new Date(a.event_at || "").getTime() -
      new Date(b.event_at || "").getTime()
    );
  });
  return (
    <section className="rounded-3xl bg-white p-6 shadow">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Lifecycle Timeline</h2>
          <p className="text-sm text-slate-500">
            Visual sequence of MOC lifecycle milestones.
          </p>
        </div>

        <span className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
          {sortedTimeline.length} Timeline Events
        </span>
      </div>

      <div className="relative space-y-4">
        {sortedTimeline.map((item, index) => (
          <div
            key={index}
            className="relative rounded-2xl border border-slate-200 bg-slate-50 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
                  {index + 1}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
                    {formatStatus(item.event_stage)}
                  </p>

                  <h3 className="mt-2 text-lg font-bold text-slate-950">
                    {item.event_title}
                  </h3>
                </div>
              </div>

              <Badge text={item.event_status || "-"} />
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              {item.event_detail || "-"}
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <MiniInfo label="Stage" value={formatStatus(item.event_stage)} />
              <MiniInfo label="Timestamp" value={formatDate(item.event_at)} />
            </div>
          </div>
        ))}

        {sortedTimeline.length === 0 && (
          <p className="rounded-2xl bg-slate-50 p-5 text-slate-500">
            No timeline events yet.
          </p>
        )}
      </div>
    </section>
  );
}
function ActionsTab({
  actions,
  requestId,
  requiredDocuments,
  attachments,
  onRefresh,
}: {
  actions: MocAction[];
  requestId: string | null;
  requiredDocuments: RequiredDocument[];
  attachments: ActionAttachment[];
  onRefresh: () => Promise<void>;
}) {
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState("");

  const verifiedCount = actions.filter(
    (item) => item.action_status === "verified"
  ).length;
const mandatoryDocs = requiredDocuments.filter((doc) => doc.is_mandatory);
const verifiedDocs = mandatoryDocs.filter(
  (doc) => doc.document_status === "verified"
);
const evidenceReady =
  mandatoryDocs.length > 0 && verifiedDocs.length === mandatoryDocs.length;
  async function handleUpload(
    action: MocAction,
    requiredDocument: RequiredDocument,
    file: File | null
  ) {
    if (!file || !requestId) return;

    setUploadingKey(requiredDocument.id);
    setUploadMessage("");

    try {
      const { data: userData } = await supabase.auth.getUser();

      const { data: profileData } = await supabase
  .from("users_profile")
  .select("id, full_name, app_role")
  .eq("auth_user_id", userData.user?.id)
  .single();

      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${requestId}/${action.id}/${requiredDocument.id}/${Date.now()}-${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("moc-attachments")
        .upload(filePath, file, {
          upsert: false,
        });

      if (uploadError) throw new Error(uploadError.message);

      const { error: insertError } = await supabase
        .from("moc_action_attachments")
        .insert({
          moc_action_id: action.id,
          moc_request_id: requestId,
          required_document_id: requiredDocument.id,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type || null,
          file_size: file.size,
          attachment_category: "evidence",
          description: requiredDocument.document_name,
          uploaded_by: profileData?.id || null,
          verification_status: "uploaded",
        });

      if (insertError) throw new Error(insertError.message);

      const { error: documentUpdateError } = await supabase
  .from("moc_action_required_documents")
  .update({
    document_status: "uploaded",
    updated_at: new Date().toISOString(),
  })
  .eq("id", requiredDocument.id);

if (documentUpdateError) throw new Error(documentUpdateError.message);

const { error: auditError } = await supabase.from("moc_audit_events").insert({
  moc_request_id: requiredDocument.moc_request_id,
  event_type: "evidence_uploaded",
  event_stage: "action_tracker",
  event_title: "Action evidence uploaded",
  event_detail: `Evidence uploaded for ${requiredDocument.document_name}. File: ${file.name}.`,
  actor_id: profileData?.id || null,
  actor_name: profileData?.full_name || userData.user?.email || "Demo User",
  actor_role: profileData?.app_role || "authenticated_user",
  source_table: "moc_action_attachments",
});

if (auditError) {
  setUploadMessage(
    `Attachment uploaded successfully, but audit log failed: ${auditError.message}`
  );
} else {
  setUploadMessage("Attachment uploaded successfully.");
}

await onRefresh();
    } catch (err: any) {
      setUploadMessage(`Upload failed: ${err.message}`);
    } finally {
      setUploadingKey(null);
    }
  }
  async function handleOpenAttachment(filePath: string) {
    const { data, error } = await supabase.storage
      .from("moc-attachments")
      .createSignedUrl(filePath, 60 * 5);

    if (error || !data?.signedUrl) {
      setUploadMessage(`Open file failed: ${error?.message}`);
      return;
    }

    window.open(data.signedUrl, "_blank");
  }
async function handleOpenAttachment(filePath: string) {
  const { data, error } = await supabase.storage
    .from("moc-attachments")
    .createSignedUrl(filePath, 60 * 5);

  if (error || !data?.signedUrl) {
    setUploadMessage(`Open file failed: ${error?.message}`);
    return;
  }

  window.open(data.signedUrl, "_blank");
}

async function handleVerifyAttachment(
  attachment: ActionAttachment,
  requiredDocument: RequiredDocument,
  decision: "accepted" | "rejected"
) {
  setUploadMessage("");

  try {
    const verifierComment =
      decision === "accepted"
        ? "Evidence accepted."
        : window.prompt("Reason for rejection / revision note:") ||
          "Evidence rejected. Revision required.";

    const { data: userData } = await supabase.auth.getUser();

    const { data: profileData } = await supabase
  .from("users_profile")
  .select("id, full_name, app_role")
  .eq("auth_user_id", userData.user?.id)
  .single();

    const { error: attachmentError } = await supabase
      .from("moc_action_attachments")
      .update({
        verification_status: decision,
        verifier_comment: verifierComment,
        verified_by: profileData?.id || null,
        verified_at: new Date().toISOString(),
      })
      .eq("id", attachment.id);

    if (attachmentError) throw new Error(attachmentError.message);

    const { error: documentError } = await supabase
      .from("moc_action_required_documents")
      .update({
        document_status: decision === "accepted" ? "verified" : "required",
        updated_at: new Date().toISOString(),
      })
      .eq("id", requiredDocument.id);

  if (documentError) throw new Error(documentError.message);

const { error: auditError } = await supabase.from("moc_audit_events").insert({
  moc_request_id: requiredDocument.moc_request_id,
  event_type:
    decision === "accepted" ? "evidence_accepted" : "evidence_rejected",
  event_stage: "action_tracker",
  event_title:
    decision === "accepted"
      ? "Action evidence accepted"
      : "Action evidence rejected",
  event_detail:
    decision === "accepted"
      ? `Evidence accepted for ${requiredDocument.document_name}. File: ${attachment.file_name}.`
      : `Evidence rejected for ${requiredDocument.document_name}. File: ${attachment.file_name}. Comment: ${verifierComment}`,
  actor_id: profileData?.id || null,
actor_name: profileData?.full_name || userData.user?.email || "Demo User",
actor_role: profileData?.app_role || "authenticated_user",
  source_table: "moc_action_attachments",
});

if (auditError) throw new Error(`Audit insert failed: ${auditError.message}`);
setUploadMessage(
  decision === "accepted"
    ? "Evidence accepted successfully."
    : "Evidence rejected. Required document status returned to Required."
);

await onRefresh();
  } catch (err: any) {
    setUploadMessage(`Evidence verification failed: ${err.message}`);
  }
}
  return (
    <section className="rounded-3xl bg-white p-6 shadow">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Action Tracker</h2>
          <p className="text-sm text-slate-500">
            Required actions, evidence documents, upload status, and verification.
          </p>
        </div>

       <div className="flex flex-wrap gap-2">
  <span className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
    {verifiedCount}/{actions.length} Actions Verified
  </span>

  <span
    className={`rounded-full px-4 py-2 text-sm font-semibold ${
      evidenceReady
        ? "bg-emerald-100 text-emerald-800"
        : "bg-amber-100 text-amber-800"
    }`}
  >
    Evidence {verifiedDocs.length}/{mandatoryDocs.length} Verified
  </span>
</div>
      </div>

      {uploadMessage && (
        <p className="mb-5 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
          {uploadMessage}
        </p>
      )}
<div
  className={`mb-5 rounded-2xl border p-4 ${
    evidenceReady
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-amber-200 bg-amber-50 text-amber-900"
  }`}
>
  <div className="flex flex-wrap items-start justify-between gap-3">
    <div>
      <h3 className="font-bold">
        {evidenceReady ? "Evidence Gate Ready" : "Evidence Gate Not Ready"}
      </h3>
      <p className="mt-1 text-sm">
        {evidenceReady
          ? "All mandatory evidence documents have been verified. Action Tracker is ready to proceed."
          : `${mandatoryDocs.length - verifiedDocs.length} mandatory evidence document(s) still need verification before Action Tracker can proceed.`}
      </p>
    </div>

    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold">
      {verifiedDocs.length}/{mandatoryDocs.length} Verified
    </span>
  </div>
</div>

      <div className="grid gap-4">
        {actions.map((item, index) => {
          const docs = requiredDocuments.filter(
            (doc) => doc.moc_action_id === item.id
          );

          const actionAttachments = attachments.filter(
            (attachment) => attachment.moc_action_id === item.id
          );

          return (
            <div
              key={item.action_no}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
                    {index + 1}
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
                      {item.action_no}
                    </p>

                    <h3 className="mt-2 text-lg font-bold text-slate-950">
                      {item.action_title}
                    </h3>
                  </div>
                </div>

                <Badge text={item.action_status} />
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">
                {item.action_description || "No action description available."}
              </p>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <MiniInfo label="Priority" value={formatStatus(item.priority)} />
                <MiniInfo label="Due Date" value={item.due_date || "-"} />
                <MiniInfo
                  label="Verification"
                  value={item.verification_comment || "-"}
                />
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-950">
                      Required Evidence
                    </h4>
                    <p className="text-sm text-slate-500">
                      Mandatory documents or records needed to close this action.
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {docs.length} Required
                  </span>
                </div>

                <div className="grid gap-3">
                  {docs.map((doc) => {
                    const docAttachments = actionAttachments.filter(
                      (attachment) => attachment.required_document_id === doc.id
                    );

                    return (
                      <div
                        key={doc.id}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h5 className="font-bold text-slate-950">
                              {doc.document_name}
                            </h5>
                            <p className="mt-1 text-sm text-slate-600">
                              {doc.requirement_note || "-"}
                            </p>
                          </div>

                          <Badge text={doc.document_status} />
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <label className="inline-flex cursor-pointer rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                            {uploadingKey === doc.id
                              ? "Uploading..."
                              : "Upload Evidence"}
                            <input
                              type="file"
                              className="hidden"
                              disabled={uploadingKey === doc.id}
                              onChange={(event) =>
                                handleUpload(
                                  item,
                                  doc,
                                  event.target.files?.[0] || null
                                )
                              }
                            />
                          </label>

                          <p className="text-xs text-slate-500">
                            Status: {formatStatus(doc.document_status)}
                          </p>
                        </div>

                        {docAttachments.length > 0 && (
                          <div className="mt-4 rounded-xl bg-white p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                              Uploaded Attachments
                            </p>

                            <div className="mt-2 space-y-2">
                              {docAttachments.map((attachment) => (
                                <div
                                  key={attachment.id}
                                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
                                >
                                  <div>
  <p className="text-sm font-semibold text-slate-950">
    {attachment.file_name}
  </p>
  <p className="text-xs text-slate-500">
    {formatFileSize(attachment.file_size)} ·{" "}
    {formatStatus(attachment.verification_status)}
  </p>
{attachment.verifier_comment && (
  <p className="mt-1 text-xs text-slate-500">
    Comment: {attachment.verifier_comment}
  </p>
)}

{attachment.verified_at && (
  <p className="mt-1 text-xs text-slate-400">
    Verified at: {formatDate(attachment.verified_at)}
  </p>
)}
</div>

<div className="flex flex-wrap items-center gap-2">
  <button
    onClick={() => handleOpenAttachment(attachment.file_path)}
    className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100"
  >
    Open File
  </button>

  {attachment.verification_status !== "accepted" && (
    <button
      onClick={() =>
        handleVerifyAttachment(attachment, doc, "accepted")
      }
      className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
    >
      Accept Evidence
    </button>
  )}

  {attachment.verification_status !== "rejected" && (
    <button
      onClick={() =>
        handleVerifyAttachment(attachment, doc, "rejected")
      }
      className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
    >
      Reject
    </button>
  )}

  <Badge text={attachment.verification_status || "-"} />
</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {docs.length === 0 && (
                    <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                      No required evidence has been defined for this action.
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {actions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <h3 className="text-lg font-bold text-slate-950">
              No action items yet
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Required actions will appear here after risk assessment or review
              actions are assigned.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
function ApprovalTab({ approvalSteps }: { approvalSteps: ApprovalStep[] }) {
  const completedSteps = approvalSteps.filter(
    (step) =>
      step.decision === "approved" ||
      step.decision === "approved_with_conditions" ||
      step.decision === "rejected"
  );

  const rejectedSteps = approvalSteps.filter(
    (step) => step.decision === "rejected"
  );

  const pendingSteps = approvalSteps.filter(
    (step) =>
      !step.decision ||
      step.decision === "pending" ||
      step.decision === "-"
  );

  const approvalReady =
    approvalSteps.length > 0 &&
    pendingSteps.length === 0 &&
    rejectedSteps.length === 0;

  return (
    <section className="rounded-3xl bg-white p-6 shadow">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Approval Workflow</h2>
          <p className="text-sm text-slate-500">
            Multi-step approval record, decision status, conditions, and comments.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
            {completedSteps.length}/{approvalSteps.length} Completed
          </span>

          <span
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              approvalReady
                ? "bg-emerald-100 text-emerald-800"
                : rejectedSteps.length > 0
                ? "bg-red-100 text-red-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {approvalReady
              ? "Approval Ready"
              : rejectedSteps.length > 0
              ? "Rejected"
              : "Approval Pending"}
          </span>
        </div>
      </div>

      <div
        className={`mb-5 rounded-2xl border p-4 ${
          approvalReady
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : rejectedSteps.length > 0
            ? "border-red-200 bg-red-50 text-red-900"
            : "border-amber-200 bg-amber-50 text-amber-900"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-bold">
              {approvalReady
                ? "Approval Gate Ready"
                : rejectedSteps.length > 0
                ? "Approval Rejected"
                : "Approval Gate Not Complete"}
            </h3>

            <p className="mt-1 text-sm">
              {approvalReady
                ? "All approval steps have been completed. This MOC is approved to proceed."
                : rejectedSteps.length > 0
                ? `${rejectedSteps.length} approval step(s) rejected this MOC.`
                : `${pendingSteps.length} approval step(s) still pending.`}
            </p>
          </div>

          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold">
            {completedSteps.length}/{approvalSteps.length} Steps
          </span>
        </div>
      </div>

      <div className="grid gap-4">
        {approvalSteps.map((step) => (
          <div
            key={step.step_no}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
                  {step.step_no}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
                    Approval Step {step.step_no}
                  </p>

                  <h3 className="mt-2 text-lg font-bold text-slate-950">
                    {step.step_name}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Role: {formatStatus(step.approval_role)}
                  </p>
                </div>
              </div>

              <Badge text={step.decision || "pending"} />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <MiniInfo
                label="Decision"
                value={formatStatus(step.decision || "pending")}
              />
              <MiniInfo
                label="Decision Date"
                value={formatDate(step.decision_date)}
              />
              <MiniInfo
                label="Condition"
                value={step.approval_condition || "-"}
              />
            </div>

            <div className="mt-4 rounded-xl bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Approval Comment
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {step.approval_comment || "-"}
              </p>
            </div>
          </div>
        ))}

        {approvalSteps.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <h3 className="text-lg font-bold text-slate-950">
              No approval steps yet
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Approval steps will appear here after the approval workflow is generated.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function AuditTab({ auditEvents }: { auditEvents: AuditEvent[] }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Audit Trail</h2>
          <p className="text-sm text-slate-500">
            Complete traceability of key MOC workflow events.
          </p>
        </div>

        <span className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
          {auditEvents.length} Events
        </span>
      </div>

      <div className="relative space-y-4">
        {auditEvents.map((item, index) => (
          <div
            key={index}
            className="relative rounded-2xl border border-slate-200 bg-slate-50 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
                  {formatStatus(item.event_stage || "-")}
                </p>

                <h3 className="mt-2 text-lg font-bold text-slate-950">
                  {item.event_title}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  Event #{index + 1}
                </span>
                <Badge text={item.event_type} />
              </div>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {item.event_detail || "-"}
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <MiniInfo label="Actor" value={item.actor_name || "-"} />
              <MiniInfo label="Role" value={item.actor_role || "-"} />
              <MiniInfo label="Timestamp" value={formatDate(item.created_at)} />
            </div>
          </div>
        ))}

        {auditEvents.length === 0 && (
          <p className="rounded-2xl bg-slate-50 p-5 text-slate-500">
            No audit events yet.
          </p>
        )}
      </div>
    </section>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 font-medium">{value}</p>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span className="inline-flex whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
      {formatStatus(text)}
    </span>
  );
}
function formatStatus(value: string | null | undefined) {
  if (!value) return "-";

  return value
    .replaceAll("_", " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
function formatFileSize(value: number | null | undefined) {
  if (!value) return "-";

  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}
function formatDate(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}