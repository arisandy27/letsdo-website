"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function PrintSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        borderTop: "1px solid #ddd",
        paddingTop: "16px",
        marginTop: "18px",
      }}
    >
      <h2 style={{ fontSize: "18px", margin: "0 0 12px" }}>{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <strong>{label}</strong>
      <div style={{ color: "#444", marginTop: "4px" }}>{value || "-"}</div>
    </div>
  );
}

export default function MocPrintPage() {
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

  async function loadPrintData() {
    if (!requestNo) return;

    setLoading(true);
    setMessage("");

    const { data: mocData, error: mocError } = await supabase
      .from("moc_requests")
      .select("*")
      .eq("request_no", requestNo)
      .single();

    if (mocError) {
      setMessage("Failed to load MOC: " + mocError.message);
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
      setMessage("Screening error: " + screeningResult.error.message);
      setLoading(false);
      return;
    }

    if (impactsResult.error) {
      setMessage("Impact review error: " + impactsResult.error.message);
      setLoading(false);
      return;
    }

    if (actionsResult.error) {
      setMessage("Action tracker error: " + actionsResult.error.message);
      setLoading(false);
      return;
    }

    if (approvalsResult.error) {
      setMessage("Approval error: " + approvalsResult.error.message);
      setLoading(false);
      return;
    }

    if (pssrResult.error) {
      setMessage("PSSR error: " + pssrResult.error.message);
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
    loadPrintData();
  }, [requestNo]);

  return (
    <main
      style={{
        padding: "32px",
        fontFamily: "Arial, sans-serif",
        color: "#222",
        background: "#f6f6f6",
      }}
    >
      <style>
        {`
          @media print {
            body {
              background: #fff !important;
            }

            .no-print {
              display: none !important;
            }

            main {
              padding: 0 !important;
              background: #fff !important;
            }

            .print-page {
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              max-width: 100% !important;
            }
          }
        `}
      </style>

      <div
        className="no-print"
        style={{
          maxWidth: "980px",
          margin: "0 auto 18px",
          display: "flex",
          gap: "10px",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <a href={`/lab/moc/${encodeURIComponent(requestNo)}`}>
          ← Back to MOC Detail
        </a>

        <button
          type="button"
          onClick={() => window.print()}
          style={{
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid #222",
            background: "#222",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Print / Save as PDF
        </button>
      </div>

      <div
        className="print-page"
        style={{
          maxWidth: "980px",
          margin: "0 auto",
          background: "#fff",
          border: "1px solid #ddd",
          borderRadius: "16px",
          padding: "28px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
        }}
      >
        {loading && <p>Loading print summary...</p>}

        {message && (
          <div
            style={{
              padding: "12px",
              border: "1px solid #f0b5b5",
              background: "#fff5f5",
              color: "#9b1c1c",
              borderRadius: "10px",
            }}
          >
            {message}
          </div>
        )}

        {!loading && moc && (
          <>
            <header
              style={{
                borderBottom: "2px solid #222",
                paddingBottom: "16px",
                marginBottom: "18px",
              }}
            >
              <p style={{ margin: "0 0 6px", color: "#777" }}>
                Let&apos;s Do..! · MOC Manager Pro
              </p>

              <h1 style={{ margin: "0 0 8px", fontSize: "28px" }}>
                Management of Change Summary
              </h1>

              <p style={{ margin: 0, color: "#555" }}>
                Generated from LetsDo Lab
              </p>
            </header>

            <PrintSection title="1. MOC Request">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "12px",
                }}
              >
                <Row label="Request No" value={moc.request_no} />
                <Row label="Status" value={String(moc.status).replaceAll("_", " ")} />
                <Row label="Risk Level" value={String(moc.risk_level).replaceAll("_", " ")} />
                <Row label="Priority" value={String(moc.priority).replaceAll("_", " ")} />
                <Row label="Department" value={moc.department} />
                <Row label="Area" value={moc.area} />
                <Row label="Requested By" value={moc.requested_by_name} />
              </div>

              <Row label="Title" value={moc.title} />
              <Row label="Description" value={moc.description} />
              <Row label="Current Condition" value={moc.current_condition} />
              <Row label="Proposed Change" value={moc.proposed_change} />
              <Row label="Expected Benefit" value={moc.expected_benefit} />
            </PrintSection>

            <PrintSection title="2. Screening Decision">
              {screening ? (
                <>
                  <Row
                    label="Screening Result"
                    value={String(screening.screening_result || "-").replaceAll("_", " ")}
                  />
                  <Row
                    label="MOC Required"
                    value={screening.moc_required ? "Yes" : "No"}
                  />
                  <Row label="Screened By" value={screening.screened_by_name} />
                  <Row label="Screening Notes" value={screening.screening_notes} />
                </>
              ) : (
                <p>No screening record.</p>
              )}
            </PrintSection>

            <PrintSection title="3. Impact Review">
              {impacts.length === 0 && <p>No impact review record.</p>}

              {impacts.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: "10px 0",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <strong>{String(item.review_area).replaceAll("_", " ")}</strong>
                  <p style={{ margin: "6px 0", color: "#444" }}>
                    {item.impact_description || "-"}
                  </p>
                  <p style={{ margin: 0, color: "#666" }}>
                    Status: {String(item.review_status || "-").replaceAll("_", " ")}
                    {" · "}
                    Risk before: {item.risk_before || "-"}
                    {" · "}
                    Risk after: {item.risk_after || "-"}
                  </p>
                </div>
              ))}
            </PrintSection>

            <PrintSection title="4. Action Tracker">
              {actions.length === 0 && <p>No action tracker record.</p>}

              {actions.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: "10px 0",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <strong>{item.action_title}</strong>
                  <p style={{ margin: "6px 0", color: "#444" }}>
                    {item.action_description || "-"}
                  </p>
                  <p style={{ margin: 0, color: "#666" }}>
                    PIC: {item.responsible_person || "-"}
                    {" · "}
                    Due: {item.due_date || "-"}
                    {" · "}
                    Status: {String(item.status || "-").replaceAll("_", " ")}
                  </p>
                </div>
              ))}
            </PrintSection>

            <PrintSection title="5. PSSR Checklist">
              {pssr.length === 0 && <p>No PSSR checklist record.</p>}

              {pssr.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: "10px 0",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <strong>{item.checklist_item}</strong>
                  <p style={{ margin: "6px 0", color: "#666" }}>
                    Category: {String(item.category || "-").replaceAll("_", " ")}
                    {" · "}
                    Result: {String(item.result || "-").replaceAll("_", " ")}
                    {" · "}
                    PIC: {item.responsible_person || "-"}
                  </p>
                </div>
              ))}
            </PrintSection>

            <PrintSection title="6. Approvals">
              {approvals.length === 0 && <p>No approval record.</p>}

              {approvals.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: "10px 0",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <strong>{String(item.approval_stage).replaceAll("_", " ")}</strong>
                  <p style={{ margin: "6px 0", color: "#666" }}>
                    Decision: {String(item.decision || "-").replaceAll("_", " ")}
                    {" · "}
                    Approver: {item.approver_name || "-"}
                  </p>
                  <p style={{ margin: 0, color: "#666" }}>
                    Notes: {item.decision_notes || "-"}
                  </p>
                </div>
              ))}
            </PrintSection>

            <footer
              style={{
                borderTop: "1px solid #ddd",
                marginTop: "24px",
                paddingTop: "12px",
                color: "#777",
                fontSize: "13px",
              }}
            >
              Printed on {new Date().toLocaleString()} · LetsDo Lab
            </footer>
          </>
        )}
      </div>
    </main>
  );
}