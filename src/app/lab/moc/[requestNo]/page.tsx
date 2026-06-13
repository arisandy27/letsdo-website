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
              {impacts.length === 0 && (
                <p style={{ color: "#777" }}>No impact review yet.</p>
              )}

              {impacts.map((item) => (
                <div
                  key={item.id}
                  style={{ padding: "12px 0", borderTop: "1px solid #eee" }}
                >
                  <strong>{item.review_area.replaceAll("_", " ")}</strong>
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