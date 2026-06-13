"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function Badge({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "5px 10px",
        borderRadius: "999px",
        background: "#f2f2f2",
        fontSize: "12px",
        textTransform: "capitalize",
      }}
    >
      {String(label || "-").replaceAll("_", " ")}
    </span>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        border: "1px solid #ddd",
        borderRadius: "16px",
        padding: "20px",
        background: "#fff",
        marginTop: "18px",
      }}
    >
      <h2 style={{ marginTop: 0, fontSize: "20px" }}>{title}</h2>
      {children}
    </section>
  );
}

export default function MocDetailPage() {
  const params = useParams();
  const rawRequestNo = params["requestNo"];
  const requestNo =
    typeof rawRequestNo === "string" ? decodeURIComponent(rawRequestNo) : "";

  const [moc, setMoc] = useState<any>(null);
  const [screening, setScreening] = useState<any>(null);
  const [impacts, setImpacts] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [pssr, setPssr] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const allImpactReviewsCompleted =
    impacts.length > 0 &&
    impacts.every((item) => item.review_status === "completed");

  const allActionsCompleted =
    actions.length > 0 &&
    actions.every((item) => item.status === "completed");

  const allPssrOk =
    pssr.length > 0 &&
    pssr.every((item) => item.result === "ok");

  async function loadDetail() {
    if (!requestNo) return;

    setLoading(true);
    setMessage("");

    const { data: mocData, error: mocError } = await supabase
      .from("moc_requests")
      .select("*")
      .eq("request_no", requestNo)
      .single();

    if (mocError) {
      setMessage(`Failed to load MOC detail: ${mocError.message}`);
      setLoading(false);
      return;
    }

    setMoc(mocData);

    const [
      screeningResult,
      impactsResult,
      actionsResult,
      approvalsResult,
      pssrResult,
    ] = await Promise.all([
      supabase
        .from("moc_screenings")
        .select("*")
        .eq("moc_request_id", mocData.id)
        .maybeSingle(),

      supabase
        .from("moc_impact_reviews")
        .select("*")
        .eq("moc_request_id", mocData.id)
        .order("review_area", { ascending: true }),

      supabase
        .from("moc_actions")
        .select("*")
        .eq("moc_request_id", mocData.id)
        .order("due_date", { ascending: true }),

      supabase
        .from("moc_approvals")
        .select("*")
        .eq("moc_request_id", mocData.id)
        .order("created_at", { ascending: true }),

      supabase
        .from("moc_pssr_checklists")
        .select("*")
        .eq("moc_request_id", mocData.id)
        .order("created_at", { ascending: true }),
    ]);

    if (screeningResult.error) {
      setMessage(`Screening error: ${screeningResult.error.message}`);
      setLoading(false);
      return;
    }

    if (impactsResult.error) {
      setMessage(`Impact review error: ${impactsResult.error.message}`);
      setLoading(false);
      return;
    }

    if (actionsResult.error) {
      setMessage(`Action tracker error: ${actionsResult.error.message}`);
      setLoading(false);
      return;
    }

    if (approvalsResult.error) {
      setMessage(`Approval error: ${approvalsResult.error.message}`);
      setLoading(false);
      return;
    }

    if (pssrResult.error) {
      setMessage(`PSSR error: ${pssrResult.error.message}`);
      setLoading(false);
      return;
    }

    setScreening(screeningResult.data || null);
    setImpacts(impactsResult.data || []);
    setActions(actionsResult.data || []);
    setApprovals(approvalsResult.data || []);
    setPssr(pssrResult.data || []);
    setLoading(false);
  }


  async function handleScreeningDecision(decision: string) {
    if (!moc) return;

    setMessage("");

    const decisionMap: Record<
      string,
      {
        result: string;
        mocRequired: boolean;
        requestStatus: string;
        label: string;
        notes: string;
      }
    > = {
      moc_required: {
        result: "moc_required",
        mocRequired: true,
        requestStatus: "impact_review",
        label: "Accepted as Full MOC",
        notes:
          "Screening decision: accepted as Full MOC. Continue to impact review.",
      },
      not_moc: {
        result: "not_moc",
        mocRequired: false,
        requestStatus: "closed",
        label: "Routed as RIK / Non-MOC",
        notes:
          "Screening decision: routed as RIK / Non-MOC. Full MOC workflow is not required.",
      },
      need_more_review: {
        result: "need_more_review",
        mocRequired: false,
        requestStatus: "screening",
        label: "Need More Info",
        notes:
          "Screening decision: more information is required before final decision.",
      },
      rejected: {
        result: "rejected",
        mocRequired: false,
        requestStatus: "rejected",
        label: "Rejected",
        notes:
          "Screening decision: rejected. Request will not continue to MOC workflow.",
      },
    };

    const selected = decisionMap[decision];

    if (!selected) {
      setMessage("Invalid screening decision.");
      return;
    }

    const payload = {
      moc_request_id: moc.id,
      affects_process_safety: selected.result === "moc_required",
      affects_hse: selected.result === "moc_required",
      affects_quality: false,
      affects_equipment: false,
      affects_material: false,
      affects_procedure: selected.result === "moc_required",
      affects_people_org: false,
      affects_legal_compliance: selected.result === "moc_required",
      moc_required: selected.mocRequired,
      screening_result: selected.result,
      screening_notes: selected.notes,
      screened_by_name: "Bobby Rachmat Arisandy",
      screened_at: new Date().toISOString(),
    };

    const screeningResponse = screening?.id
      ? await supabase
          .from("moc_screenings")
          .update(payload)
          .eq("id", screening.id)
      : await supabase.from("moc_screenings").insert(payload);

    if (screeningResponse.error) {
      setMessage(
        "Failed to save screening decision: " +
          screeningResponse.error.message
      );
      return;
    }

    const { error: updateError } = await supabase
      .from("moc_requests")
      .update({
        status: selected.requestStatus,
      })
      .eq("id", moc.id);

    if (updateError) {
      setMessage("Failed to update MOC status: " + updateError.message);
      return;
    }

    if (selected.result === "moc_required") {
      const { data: existingImpactRows, error: existingImpactError } =
        await supabase
          .from("moc_impact_reviews")
          .select("id")
          .eq("moc_request_id", moc.id)
          .limit(1);

      if (existingImpactError) {
        setMessage(
          "Screening saved, but failed to check impact review: " +
            existingImpactError.message
        );
        return;
      }

      if (!existingImpactRows || existingImpactRows.length === 0) {
        const defaultImpactReviews = [
          {
            moc_request_id: moc.id,
            review_area: "process_safety",
            impact_description:
              "Assess impact on process safety, chemical compatibility, operating envelope, safeguards, and MOC control.",
            risk_before: "medium",
            risk_after: "low",
            mitigation_required: true,
            mitigation_plan:
              "Review process safety impact and define mitigation before implementation.",
            review_status: "pending",
            reviewed_by_name: null,
          },
          {
            moc_request_id: moc.id,
            review_area: "occupational_safety",
            impact_description:
              "Assess worker safety impact, access route, manual handling, exposure, and work execution risk.",
            risk_before: "medium",
            risk_after: "low",
            mitigation_required: true,
            mitigation_plan:
              "Define safety controls, briefing needs, PPE, access control, and verification before implementation.",
            review_status: "pending",
            reviewed_by_name: null,
          },
          {
            moc_request_id: moc.id,
            review_area: "environment",
            impact_description:
              "Assess possible environmental impact, spill potential, waste generation, emission, and containment needs.",
            risk_before: "medium",
            risk_after: "low",
            mitigation_required: true,
            mitigation_plan:
              "Confirm spill control, waste handling, and environmental compliance before implementation.",
            review_status: "pending",
            reviewed_by_name: null,
          },
          {
            moc_request_id: moc.id,
            review_area: "quality",
            impact_description:
              "Assess impact on product quality, specification, process consistency, and customer requirement.",
            risk_before: "medium",
            risk_after: "low",
            mitigation_required: false,
            mitigation_plan:
              "Confirm whether quality validation, trial, or customer notification is required.",
            review_status: "pending",
            reviewed_by_name: null,
          },
          {
            moc_request_id: moc.id,
            review_area: "production",
            impact_description:
              "Assess production impact, downtime, operating method, scheduling, and handover requirement.",
            risk_before: "medium",
            risk_after: "low",
            mitigation_required: true,
            mitigation_plan:
              "Coordinate implementation schedule, production readiness, and communication to affected team.",
            review_status: "pending",
            reviewed_by_name: null,
          },
          {
            moc_request_id: moc.id,
            review_area: "document_control",
            impact_description:
              "Assess required updates to SOP, layout, checklist, training material, and related controlled documents.",
            risk_before: "medium",
            risk_after: "low",
            mitigation_required: true,
            mitigation_plan:
              "List all affected documents and complete revision before MOC closure.",
            review_status: "pending",
            reviewed_by_name: null,
          },
        ];

        const { error: impactInsertError } = await supabase
          .from("moc_impact_reviews")
          .insert(defaultImpactReviews);

        if (impactInsertError) {
          setMessage(
            "Screening saved, but failed to generate impact review: " +
              impactInsertError.message
          );
          return;
        }
      }
    }

    setMessage(
      selected.result === "moc_required"
        ? "Screening saved: " +
            selected.label +
            ". Impact review checklist is ready."
        : "Screening saved: " + selected.label
    );

    await loadDetail();
  }


  async function handleCompleteImpactReviews() {
    if (!moc) return;

    setMessage("");

    if (impacts.length === 0) {
      setMessage("No impact review rows found. Accept as Full MOC first.");
      return;
    }

    const { error: impactError } = await supabase
      .from("moc_impact_reviews")
      .update({
        review_status: "completed",
        reviewed_by_name: "Bobby Rachmat Arisandy",
        reviewed_at: new Date().toISOString(),
      })
      .eq("moc_request_id", moc.id);

    if (impactError) {
      setMessage("Failed to complete impact reviews: " + impactError.message);
      return;
    }

    const { error: mocUpdateError } = await supabase
      .from("moc_requests")
      .update({
        status: "action_tracking",
      })
      .eq("id", moc.id);

    if (mocUpdateError) {
      setMessage("Failed to update MOC status: " + mocUpdateError.message);
      return;
    }

    setMessage("Impact reviews completed. MOC moved to Action Tracking.");
    await loadDetail();
  }


  async function handleGenerateActionTracker() {
    if (!moc) return;

    setMessage("");

    if (actions.length > 0) {
      setMessage("Action tracker already exists for this MOC.");
      return;
    }

    const makeDueDate = (days: number) => {
      const date = new Date();
      date.setDate(date.getDate() + days);
      return date.toISOString().slice(0, 10);
    };

    const defaultActions = [
      {
        moc_request_id: moc.id,
        action_title: "Finalize impact review mitigation plan",
        action_description:
          "Review all impact review findings and confirm required mitigation before implementation.",
        action_type: "verification",
        responsible_person: "MOC Owner / HSE",
        due_date: makeDueDate(7),
        priority: "high",
        status: "open",
        remarks: "Generated automatically after impact review completion.",
      },
      {
        moc_request_id: moc.id,
        action_title: "Update related SOP, checklist, or controlled document",
        action_description:
          "Identify and update all procedures, layout, checklist, or other controlled documents affected by this change.",
        action_type: "document_update",
        responsible_person: "Document Control",
        due_date: makeDueDate(10),
        priority: "medium",
        status: "open",
        remarks: "Generated automatically after impact review completion.",
      },
      {
        moc_request_id: moc.id,
        action_title: "Conduct team briefing or training",
        action_description:
          "Brief affected workers or departments about the approved change, risk controls, and implementation requirements.",
        action_type: "training",
        responsible_person: "HSE / Area Owner",
        due_date: makeDueDate(14),
        priority: "medium",
        status: "open",
        remarks: "Generated automatically after impact review completion.",
      },
      {
        moc_request_id: moc.id,
        action_title: "Verify implementation readiness",
        action_description:
          "Verify that required resources, controls, documents, and responsible persons are ready before implementation.",
        action_type: "verification",
        responsible_person: "Area Owner",
        due_date: makeDueDate(18),
        priority: "high",
        status: "open",
        remarks: "Generated automatically after impact review completion.",
      },
      {
        moc_request_id: moc.id,
        action_title: "Prepare PSSR readiness items",
        action_description:
          "Prepare PSSR checklist items and evidence requirements before startup or final change activation.",
        action_type: "inspection",
        responsible_person: "HSE / Engineering",
        due_date: makeDueDate(21),
        priority: "medium",
        status: "open",
        remarks: "Generated automatically after impact review completion.",
      },
    ];

    const { error: actionError } = await supabase
      .from("moc_actions")
      .insert(defaultActions);

    if (actionError) {
      setMessage("Failed to generate action tracker: " + actionError.message);
      return;
    }

    const { error: mocUpdateError } = await supabase
      .from("moc_requests")
      .update({
        status: "action_tracking",
      })
      .eq("id", moc.id);

    if (mocUpdateError) {
      setMessage("Action tracker generated, but failed to update MOC status: " + mocUpdateError.message);
      return;
    }

    setMessage("Action tracker generated successfully.");
    await loadDetail();
  }


  async function handleCompleteActionsAndGeneratePssr() {
    if (!moc) return;

    setMessage("");

    if (actions.length === 0) {
      setMessage("No action tracker rows found. Generate Action Tracker first.");
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    const { error: actionUpdateError } = await supabase
      .from("moc_actions")
      .update({
        status: "completed",
        completion_date: today,
      })
      .eq("moc_request_id", moc.id);

    if (actionUpdateError) {
      setMessage("Failed to complete action tracker: " + actionUpdateError.message);
      return;
    }

    const { data: existingPssrRows, error: existingPssrError } = await supabase
      .from("moc_pssr_checklists")
      .select("id")
      .eq("moc_request_id", moc.id)
      .limit(1);

    if (existingPssrError) {
      setMessage(
        "Actions completed, but failed to check PSSR checklist: " +
          existingPssrError.message
      );
      return;
    }

    if (!existingPssrRows || existingPssrRows.length === 0) {
      const makeDueDate = (days: number) => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString().slice(0, 10);
      };

      const defaultPssrItems = [
        {
          moc_request_id: moc.id,
          checklist_item: "Verify approved change implementation is complete",
          category: "engineering",
          is_required: true,
          result: "pending",
          corrective_action:
            "Confirm field implementation matches approved MOC scope.",
          responsible_person: "Area Owner / Engineering",
          due_date: makeDueDate(3),
        },
        {
          moc_request_id: moc.id,
          checklist_item: "Verify updated SOP, checklist, and controlled documents are available",
          category: "document",
          is_required: true,
          result: "pending",
          corrective_action:
            "Ensure all affected documents are updated and available to users.",
          responsible_person: "Document Control",
          due_date: makeDueDate(3),
        },
        {
          moc_request_id: moc.id,
          checklist_item: "Verify training or briefing has been completed",
          category: "training",
          is_required: true,
          result: "pending",
          corrective_action:
            "Attach briefing/training evidence before startup authorization.",
          responsible_person: "HSE / Area Owner",
          due_date: makeDueDate(5),
        },
        {
          moc_request_id: moc.id,
          checklist_item: "Verify safety controls are in place",
          category: "safety",
          is_required: true,
          result: "pending",
          corrective_action:
            "Confirm required safety controls, signage, access, PPE, and safeguards.",
          responsible_person: "HSE",
          due_date: makeDueDate(5),
        },
        {
          moc_request_id: moc.id,
          checklist_item: "Verify environmental and spill controls are ready",
          category: "environment",
          is_required: true,
          result: "pending",
          corrective_action:
            "Confirm spill kit, containment, waste handling, and environmental controls.",
          responsible_person: "HSE / Environment",
          due_date: makeDueDate(5),
        },
        {
          moc_request_id: moc.id,
          checklist_item: "Startup or change activation authorization",
          category: "general",
          is_required: true,
          result: "pending",
          corrective_action:
            "Authorize startup or activation only after all required PSSR items are verified.",
          responsible_person: "Plant Manager / Area Owner",
          due_date: makeDueDate(7),
        },
      ];

      const { error: pssrInsertError } = await supabase
        .from("moc_pssr_checklists")
        .insert(defaultPssrItems);

      if (pssrInsertError) {
        setMessage(
          "Actions completed, but failed to generate PSSR checklist: " +
            pssrInsertError.message
        );
        return;
      }
    }

    const { error: mocUpdateError } = await supabase
      .from("moc_requests")
      .update({
        status: "pssr",
      })
      .eq("id", moc.id);

    if (mocUpdateError) {
      setMessage(
        "PSSR checklist generated, but failed to update MOC status: " +
          mocUpdateError.message
      );
      return;
    }

    setMessage("Actions completed. PSSR checklist is ready.");
    await loadDetail();
  }


  async function handleVerifyPssrAndMoveToApproval() {
    if (!moc) return;

    setMessage("");

    if (pssr.length === 0) {
      setMessage("No PSSR checklist found. Complete action tracker first.");
      return;
    }

    const { error: pssrUpdateError } = await supabase
      .from("moc_pssr_checklists")
      .update({
        result: "ok",
        verified_by_name: "Bobby Rachmat Arisandy",
        verified_at: new Date().toISOString(),
      })
      .eq("moc_request_id", moc.id);

    if (pssrUpdateError) {
      setMessage("Failed to verify PSSR checklist: " + pssrUpdateError.message);
      return;
    }

    const { error: mocUpdateError } = await supabase
      .from("moc_requests")
      .update({
        status: "approval",
      })
      .eq("id", moc.id);

    if (mocUpdateError) {
      setMessage(
        "PSSR verified, but failed to update MOC status: " +
          mocUpdateError.message
      );
      return;
    }

    setMessage("PSSR verified. MOC moved to Approval.");
    await loadDetail();
  }

  useEffect(() => {
    loadDetail();
  }, [requestNo]);

  return (
    <main style={{ padding: "32px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: "1050px", margin: "0 auto" }}>
        <a href="/lab/moc" style={{ color: "#555", textDecoration: "none" }}>
          ← Back to MOC Dashboard
        </a>

        {loading && (
          <p style={{ marginTop: "28px", color: "#777" }}>
            Loading MOC detail...
          </p>
        )}

        {message && (
          <div
            style={{
              marginTop: "24px",
              padding: "14px 16px",
              border: "1px solid #f0b5b5",
              borderRadius: "12px",
              background: "#fff5f5",
              color: "#9b1c1c",
            }}
          >
            {message}
          </div>
        )}

        {!loading && moc && (
          <>
            <div style={{ marginTop: "24px" }}>
              <p style={{ color: "#777", marginBottom: "8px" }}>
                {moc.request_no}
              </p>

              <h1 style={{ fontSize: "34px", margin: "0 0 12px" }}>
                {moc.title}
              </h1>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <Badge label={moc.status} />
                <Badge label={moc.risk_level} />
                <Badge label={moc.priority} />
                <Badge label={moc.change_type} />
              </div>

              <p style={{ color: "#555", lineHeight: 1.7, maxWidth: "760px" }}>
                {moc.description || "-"}
              </p>
            </div>

            <Card title="Request Detail">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "14px",
                }}
              >
                <div>
                  <strong>Department</strong>
                  <p style={{ color: "#555" }}>{moc.department || "-"}</p>
                </div>

                <div>
                  <strong>Area</strong>
                  <p style={{ color: "#555" }}>{moc.area || "-"}</p>
                </div>

                <div>
                  <strong>Requested by</strong>
                  <p style={{ color: "#555" }}>
                    {moc.requested_by_name || "-"}
                  </p>
                </div>
              </div>
            </Card>

            <Card title="Change Summary">
              <div style={{ display: "grid", gap: "14px" }}>
                <div>
                  <strong>Current Condition</strong>
                  <p style={{ color: "#555", lineHeight: 1.6 }}>
                    {moc.current_condition || "-"}
                  </p>
                </div>

                <div>
                  <strong>Proposed Change</strong>
                  <p style={{ color: "#555", lineHeight: 1.6 }}>
                    {moc.proposed_change || "-"}
                  </p>
                </div>

                <div>
                  <strong>Expected Benefit</strong>
                  <p style={{ color: "#555", lineHeight: 1.6 }}>
                    {moc.expected_benefit || "-"}
                  </p>
                </div>
              </div>
            </Card>

            <Card title="Screening">
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px",
                  marginBottom: "18px",
                }}
              >
                <button
                  type="button"
                  onClick={() => handleScreeningDecision("moc_required")}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid #222",
                    background: "#222",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Accept as Full MOC
                </button>

                <button
                  type="button"
                  onClick={() => handleScreeningDecision("not_moc")}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid #ddd",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Route as RIK / Non-MOC
                </button>

                <button
                  type="button"
                  onClick={() => handleScreeningDecision("need_more_review")}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid #ddd",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Need More Info
                </button>

                <button
                  type="button"
                  onClick={() => handleScreeningDecision("rejected")}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid #f0b5b5",
                    background: "#fff5f5",
                    color: "#9b1c1c",
                    cursor: "pointer",
                  }}
                >
                  Reject
                </button>
              </div>
              {screening ? (
                <>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <Badge label={screening.screening_result || "not screened"} />
                    <Badge
                      label={screening.moc_required ? "moc required" : "not required"}
                    />
                  </div>

                  <p style={{ color: "#555", lineHeight: 1.6 }}>
                    {screening.screening_notes || "-"}
                  </p>

                  <p style={{ color: "#777" }}>
                    Screened by: {screening.screened_by_name || "-"}
                  </p>
                </>
              ) : (
                <p style={{ color: "#777" }}>No screening record yet.</p>
              )}
            </Card>

            <Card title="Impact Review">
              <div style={{ marginBottom: "18px" }}>
                <button
                  type="button"
                  disabled={impacts.length === 0 || allImpactReviewsCompleted}
                  onClick={handleCompleteImpactReviews}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid #222",
                    background: impacts.length === 0 || allImpactReviewsCompleted ? "#777" : "#222",
                    color: "#fff",
                    cursor: impacts.length === 0 || allImpactReviewsCompleted ? "not-allowed" : "pointer",
                  }}
                >
                  {allImpactReviewsCompleted
                    ? "Impact Reviews Completed"
                    : "Mark All Impact Reviews Completed"}
                </button>
              </div>
              {impacts.length === 0 && (
                <p style={{ color: "#777" }}>No impact review yet.</p>
              )}

              {impacts.map((item) => (
                <div
                  key={item.id}
                  style={{ padding: "12px 0", borderTop: "1px solid #eee" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                      alignItems: "center",
                    }}
                  >
                    <strong>{item.review_area.replaceAll("_", " ")}</strong>
                    <Badge label={item.review_status || "pending"} />
                  </div>
                  <p style={{ color: "#555", lineHeight: 1.6 }}>
                    {item.impact_description || "-"}
                  </p>
                  <p style={{ color: "#777", margin: 0 }}>
                    Risk before: {item.risk_before || "-"} → Risk after:{" "}
                    {item.risk_after || "-"}
                  </p>
                </div>
              ))}
            </Card>

            <Card title="Action Tracker">
              <div style={{ marginBottom: "18px" }}>
                <button
                  type="button"
                  disabled={actions.length > 0}
                  onClick={handleGenerateActionTracker}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid #222",
                    background: actions.length > 0 ? "#777" : "#222",
                    color: "#fff",
                    cursor: actions.length > 0 ? "not-allowed" : "pointer",
                  }}
                >
                  {actions.length > 0
                    ? "Action Tracker Ready"
                    : "Generate Action Tracker"}
                </button>
              </div>
              <div style={{ marginBottom: "18px" }}>
                <button
                  type="button"
                  disabled={
                    actions.length === 0 ||
                    (allActionsCompleted && pssr.length > 0)
                  }
                  onClick={handleCompleteActionsAndGeneratePssr}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid #222",
                    background:
                      actions.length === 0 ||
                      (allActionsCompleted && pssr.length > 0)
                        ? "#777"
                        : "#222",
                    color: "#fff",
                    cursor:
                      actions.length === 0 ||
                      (allActionsCompleted && pssr.length > 0)
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {allActionsCompleted && pssr.length > 0
                    ? "Actions Completed / PSSR Ready"
                    : "Mark All Actions Completed & Generate PSSR"}
                </button>
              </div>
              {actions.length === 0 && (
                <p style={{ color: "#777" }}>No action tracker yet.</p>
              )}

              {actions.map((item) => (
                <div
                  key={item.id}
                  style={{ padding: "12px 0", borderTop: "1px solid #eee" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <strong>{item.action_title}</strong>
                    <Badge label={item.status} />
                  </div>

                  <p style={{ color: "#555", lineHeight: 1.6 }}>
                    {item.action_description || "-"}
                  </p>

                  <p style={{ color: "#777", margin: 0 }}>
                    PIC: {item.responsible_person || "-"} · Due:{" "}
                    {item.due_date || "-"}
                  </p>
                </div>
              ))}
            </Card>

            <Card title="Approvals">
              {approvals.length === 0 && (
                <p style={{ color: "#777" }}>No approval record yet.</p>
              )}

              {approvals.map((item) => (
                <div
                  key={item.id}
                  style={{ padding: "12px 0", borderTop: "1px solid #eee" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <strong>{item.approval_stage.replaceAll("_", " ")}</strong>
                    <Badge label={item.decision} />
                  </div>

                  <p style={{ color: "#555", marginBottom: 0 }}>
                    {item.approver_role || "-"} · {item.approver_name || "-"}
                  </p>
                </div>
              ))}
            </Card>

            <Card title="PSSR Checklist">
              <div style={{ marginBottom: "18px" }}>
                <button
                  type="button"
                  disabled={pssr.length === 0 || allPssrOk}
                  onClick={handleVerifyPssrAndMoveToApproval}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid #222",
                    background:
                      pssr.length === 0 || allPssrOk ? "#777" : "#222",
                    color: "#fff",
                    cursor:
                      pssr.length === 0 || allPssrOk
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {allPssrOk
                    ? "PSSR Verified / Approval Ready"
                    : "Mark All PSSR Items OK"}
                </button>
              </div>
              {pssr.length === 0 && (
                <p style={{ color: "#777" }}>No PSSR checklist yet.</p>
              )}

              {pssr.map((item) => (
                <div
                  key={item.id}
                  style={{ padding: "12px 0", borderTop: "1px solid #eee" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <strong>{item.checklist_item}</strong>
                    <Badge label={item.result} />
                  </div>

                  <p style={{ color: "#777", marginBottom: 0 }}>
                    PIC: {item.responsible_person || "-"} · Due:{" "}
                    {item.due_date || "-"}
                  </p>
                </div>
              ))}
            </Card>
          </>
        )}
      </div>
    </main>
  );
}