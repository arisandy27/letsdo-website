"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type MocRequest = {
  id: string;
  request_no: string;
  title: string;
  description: string | null;
  change_type: string;
  priority: string;
  risk_level: string;
  status: string;
  requested_by_name: string | null;
  department: string | null;
  area: string | null;
  current_condition: string | null;
  proposed_change: string | null;
  expected_benefit: string | null;
  target_start_date: string | null;
  target_completion_date: string | null;
  notes: string | null;
  created_at: string;
};

type MocAction = {
  id: string;
  moc_request_id: string;
  action_title: string;
  action_description: string | null;
  action_type: string | null;
  responsible_person: string | null;
  due_date: string | null;
  completion_date: string | null;
  priority: string;
  status: string;
  remarks: string | null;
};

type MocImpactReview = {
  id: string;
  moc_request_id: string;
  review_area: string;
  impact_description: string | null;
  risk_before: string | null;
  risk_after: string | null;
  mitigation_required: boolean | null;
  mitigation_plan: string | null;
  review_status: string;
  reviewed_by_name: string | null;
};

type MocApproval = {
  id: string;
  moc_request_id: string;
  approval_stage: string;
  approver_role: string | null;
  approver_name: string | null;
  decision: string;
  decision_notes: string | null;
};

type MocPssr = {
  id: string;
  moc_request_id: string;
  checklist_item: string;
  category: string | null;
  result: string;
  corrective_action: string | null;
  responsible_person: string | null;
  due_date: string | null;
};

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
      {label.replaceAll("_", " ")}
    </span>
  );
}

function StatCard({ title, value }: { title: string; value: number | string }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "16px",
        padding: "18px",
        background: "#fff",
      }}
    >
      <p style={{ margin: "0 0 8px", color: "#777", fontSize: "14px" }}>
        {title}
      </p>
      <strong style={{ fontSize: "28px" }}>{value}</strong>
    </div>
  );
}

export default function MocLabPage() {
  const [requests, setRequests] = useState<MocRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [actions, setActions] = useState<MocAction[]>([]);
  const [impacts, setImpacts] = useState<MocImpactReview[]>([]);
  const [approvals, setApprovals] = useState<MocApproval[]>([]);
  const [pssr, setPssr] = useState<MocPssr[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const selectedRequest = useMemo(
    () => requests.find((item) => item.id === selectedId) || null,
    [requests, selectedId]
  );

  const openActions = actions.filter((item) => item.status !== "completed");
  const completedActions = actions.filter((item) => item.status === "completed");

  async function loadRequests() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("moc_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`Failed to load MOC requests: ${error.message}`);
      setLoading(false);
      return;
    }

    const rows = (data || []) as MocRequest[];
    setRequests(rows);

    if (rows.length > 0) {
      setSelectedId(rows[0].id);
    }

    setLoading(false);
  }

  async function loadWorkflow(mocRequestId: string) {
    setMessage("");

    const [
      actionsResult,
      impactsResult,
      approvalsResult,
      pssrResult,
    ] = await Promise.all([
      supabase
        .from("moc_actions")
        .select("*")
        .eq("moc_request_id", mocRequestId)
        .order("due_date", { ascending: true }),

      supabase
        .from("moc_impact_reviews")
        .select("*")
        .eq("moc_request_id", mocRequestId)
        .order("review_area", { ascending: true }),

      supabase
        .from("moc_approvals")
        .select("*")
        .eq("moc_request_id", mocRequestId)
        .order("created_at", { ascending: true }),

      supabase
        .from("moc_pssr_checklists")
        .select("*")
        .eq("moc_request_id", mocRequestId)
        .order("created_at", { ascending: true }),
    ]);

    if (actionsResult.error) {
      setMessage(`Action tracker error: ${actionsResult.error.message}`);
      return;
    }

    if (impactsResult.error) {
      setMessage(`Impact review error: ${impactsResult.error.message}`);
      return;
    }

    if (approvalsResult.error) {
      setMessage(`Approval error: ${approvalsResult.error.message}`);
      return;
    }

    if (pssrResult.error) {
      setMessage(`PSSR error: ${pssrResult.error.message}`);
      return;
    }

    setActions((actionsResult.data || []) as MocAction[]);
    setImpacts((impactsResult.data || []) as MocImpactReview[]);
    setApprovals((approvalsResult.data || []) as MocApproval[]);
    setPssr((pssrResult.data || []) as MocPssr[]);
  }

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadWorkflow(selectedId);
    }
  }, [selectedId]);

  return (
    <main style={{ padding: "32px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: "1150px", margin: "0 auto" }}>
        <a href="/lab" style={{ color: "#555", textDecoration: "none" }}>
          ← Back to LetsDo Lab
        </a>

        <div style={{ marginTop: "24px" }}>
          <p style={{ color: "#777", marginBottom: "8px" }}>
            Process Safety
          </p>

          <h1 style={{ fontSize: "34px", margin: "0 0 12px" }}>
            MOC Manager Pro
          </h1>

          <p style={{ color: "#555", lineHeight: 1.7, maxWidth: "760px" }}>
            Simple MOC dashboard connected to Supabase tables: request,
            screening, impact review, action tracker, approval, and PSSR.
          </p>
        </div>

        <div style={{ marginTop: "18px" }}>
          <a
            href="/lab/moc/new"
            style={{
              display: "inline-block",
              padding: "11px 16px",
              borderRadius: "10px",
              background: "#222",
              color: "#fff",
              textDecoration: "none",
              fontSize: "14px",
            }}
          >
            + New MOC Request
          </a>
        </div>

        {loading && (
          <p style={{ marginTop: "28px", color: "#777" }}>
            Loading MOC data...
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

        {!loading && requests.length === 0 && (
          <p style={{ marginTop: "28px", color: "#777" }}>
            No MOC requests found.
          </p>
        )}

        {!loading && requests.length > 0 && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "16px",
                marginTop: "28px",
              }}
            >
              <StatCard title="Total MOC" value={requests.length} />
              <StatCard title="Open Actions" value={openActions.length} />
              <StatCard title="Completed Actions" value={completedActions.length} />
              <StatCard title="Impact Reviews" value={impacts.length} />
              <StatCard title="PSSR Items" value={pssr.length} />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "320px 1fr",
                gap: "18px",
                marginTop: "24px",
                alignItems: "start",
              }}
            >
              <aside
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "16px",
                  background: "#fff",
                  padding: "16px",
                }}
              >
                <h2 style={{ marginTop: 0, fontSize: "18px" }}>
                  MOC Requests
                </h2>

                {requests.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      border:
                        selectedId === item.id
                          ? "1px solid #222"
                          : "1px solid #eee",
                      borderRadius: "12px",
                      padding: "12px",
                      marginBottom: "10px",
                      background: selectedId === item.id ? "#fafafa" : "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <strong>{item.request_no}</strong>
                    <p style={{ margin: "6px 0 8px", color: "#555" }}>
                      {item.title}
                    </p>
                    <Badge label={item.status} />
                  </button>
                ))}
              </aside>

              <section>
                {selectedRequest && (
                  <div
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "16px",
                      background: "#fff",
                      padding: "20px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "16px",
                        alignItems: "start",
                      }}
                    >
                      <div>
                        <p style={{ color: "#777", margin: "0 0 6px" }}>
                          {selectedRequest.request_no}
                        </p>
                        <h2 style={{ margin: "0 0 12px" }}>
                          {selectedRequest.title}
                        </h2>
                      </div>

                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <Badge label={selectedRequest.status} />
                        <Badge label={selectedRequest.risk_level} />
                        <Badge label={selectedRequest.priority} />

                        <a
                          href={`/lab/moc/${encodeURIComponent(selectedRequest.request_no)}`}
                          style={{
                            padding: "5px 10px",
                            borderRadius: "999px",
                            background: "#222",
                            color: "#fff",
                            fontSize: "12px",
                            textDecoration: "none",
                          }}
                        >
                          Open Detail
                        </a>
                      </div>
                    </div>

                    <p style={{ color: "#555", lineHeight: 1.7 }}>
                      {selectedRequest.description}
                    </p>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "12px",
                        marginTop: "18px",
                      }}
                    >
                      <div>
                        <strong>Department</strong>
                        <p style={{ color: "#555" }}>
                          {selectedRequest.department || "-"}
                        </p>
                      </div>
                      <div>
                        <strong>Area</strong>
                        <p style={{ color: "#555" }}>
                          {selectedRequest.area || "-"}
                        </p>
                      </div>
                      <div>
                        <strong>Requested by</strong>
                        <p style={{ color: "#555" }}>
                          {selectedRequest.requested_by_name || "-"}
                        </p>
                      </div>
                    </div>

                    <hr style={{ border: 0, borderTop: "1px solid #eee", margin: "22px 0" }} />

                    <h3>Change Summary</h3>

                    <div style={{ display: "grid", gap: "14px" }}>
                      <div>
                        <strong>Current condition</strong>
                        <p style={{ color: "#555", lineHeight: 1.6 }}>
                          {selectedRequest.current_condition || "-"}
                        </p>
                      </div>
                      <div>
                        <strong>Proposed change</strong>
                        <p style={{ color: "#555", lineHeight: 1.6 }}>
                          {selectedRequest.proposed_change || "-"}
                        </p>
                      </div>
                      <div>
                        <strong>Expected benefit</strong>
                        <p style={{ color: "#555", lineHeight: 1.6 }}>
                          {selectedRequest.expected_benefit || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div
                  style={{
                    display: "grid",
                    gap: "18px",
                    marginTop: "18px",
                  }}
                >
                  <div style={{ border: "1px solid #ddd", borderRadius: "16px", padding: "20px", background: "#fff" }}>
                    <h3 style={{ marginTop: 0 }}>Impact Review</h3>
                    {impacts.map((item) => (
                      <div key={item.id} style={{ padding: "12px 0", borderTop: "1px solid #eee" }}>
                        <strong>{item.review_area.replaceAll("_", " ")}</strong>
                        <p style={{ color: "#555", lineHeight: 1.6 }}>
                          {item.impact_description}
                        </p>
                        <p style={{ color: "#777", margin: 0 }}>
                          Risk before: {item.risk_before || "-"} → Risk after: {item.risk_after || "-"}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div style={{ border: "1px solid #ddd", borderRadius: "16px", padding: "20px", background: "#fff" }}>
                    <h3 style={{ marginTop: 0 }}>Action Tracker</h3>
                    {actions.map((item) => (
                      <div key={item.id} style={{ padding: "12px 0", borderTop: "1px solid #eee" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                          <strong>{item.action_title}</strong>
                          <Badge label={item.status} />
                        </div>
                        <p style={{ color: "#555", lineHeight: 1.6 }}>
                          {item.action_description}
                        </p>
                        <p style={{ color: "#777", margin: 0 }}>
                          PIC: {item.responsible_person || "-"} · Due: {item.due_date || "-"}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div style={{ border: "1px solid #ddd", borderRadius: "16px", padding: "20px", background: "#fff" }}>
                    <h3 style={{ marginTop: 0 }}>Approvals</h3>
                    {approvals.map((item) => (
                      <div key={item.id} style={{ padding: "12px 0", borderTop: "1px solid #eee" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                          <strong>{item.approval_stage.replaceAll("_", " ")}</strong>
                          <Badge label={item.decision} />
                        </div>
                        <p style={{ color: "#555", marginBottom: 0 }}>
                          {item.approver_role || "-"} · {item.approver_name || "-"}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div style={{ border: "1px solid #ddd", borderRadius: "16px", padding: "20px", background: "#fff" }}>
                    <h3 style={{ marginTop: 0 }}>PSSR Checklist</h3>
                    {pssr.map((item) => (
                      <div key={item.id} style={{ padding: "12px 0", borderTop: "1px solid #eee" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                          <strong>{item.checklist_item}</strong>
                          <Badge label={item.result} />
                        </div>
                        <p style={{ color: "#777", marginBottom: 0 }}>
                          PIC: {item.responsible_person || "-"} · Due: {item.due_date || "-"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

