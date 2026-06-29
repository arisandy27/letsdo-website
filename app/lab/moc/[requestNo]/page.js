"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

const card = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  padding: 20,
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
};

const badge = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 800,
  background: "#f1f5f9",
  color: "#334155",
  border: "1px solid #cbd5e1",
};

function valueText(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function formatDate(value) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}

function InfoGrid({ items }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: 12,
        marginTop: 16,
      }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            padding: 14,
            background: "#f8fafc",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#64748b",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {item.label}
          </div>
          <div
            style={{
              marginTop: 6,
              color: "#0f172a",
              fontWeight: 800,
              lineHeight: 1.4,
            }}
          >
            {valueText(item.value)}
          </div>
        </div>
      ))}
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <section style={{ ...card, marginTop: 18 }}>
      <h2
        style={{
          margin: 0,
          fontSize: 24,
          color: "#020617",
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p style={{ margin: "6px 0 0", color: "#64748b", lineHeight: 1.6 }}>
          {subtitle}
        </p>
      )}
      <div style={{ marginTop: 16 }}>{children}</div>
    </section>
  );
}

function SimpleTable({ rows, columns, emptyText }) {
  if (!rows || rows.length === 0) {
    return (
      <div
        style={{
          border: "1px dashed #cbd5e1",
          borderRadius: 14,
          padding: 18,
          color: "#64748b",
          background: "#f8fafc",
        }}
      >
        {emptyText || "No data available."}
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  textAlign: "left",
                  padding: "12px 10px",
                  borderBottom: "1px solid #e5e7eb",
                  color: "#334155",
                  fontSize: 13,
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || index}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    padding: "12px 10px",
                    borderBottom: "1px solid #e5e7eb",
                    color: "#334155",
                    verticalAlign: "top",
                    lineHeight: 1.5,
                  }}
                >
                  {col.format ? col.format(row[col.key], row) : valueText(row[col.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MocDetailPage() {
  const params = useParams();
  const requestNo = params?.requestNo;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setErrorText("");

        const res = await fetch(`/api/lab/moc/${encodeURIComponent(requestNo)}`, {
          cache: "no-store",
        });

        const json = await res.json();

        if (!res.ok || !json.ok) {
          throw new Error(json.error || "Failed to load MOC detail");
        }

        setData(json);
      } catch (error) {
        setErrorText(error.message || "Failed to load MOC detail");
      } finally {
        setLoading(false);
      }
    }

    if (requestNo) loadData();
  }, [requestNo]);

  const request = data?.request;

  const workflowKpis = useMemo(() => {
    if (!data) return [];

    return [
      { label: "Impact Reviews", value: data.impactReviews?.length || 0 },
      { label: "Actions", value: data.actions?.length || 0 },
      { label: "Approval Steps", value: data.approvalSteps?.length || 0 },
      { label: "Audit Events", value: data.auditEvents?.length || 0 },
    ];
  }, [data]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "40px 24px 72px",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={card}>
          <div style={badge}>LETSDO LAB / MOC MANAGER PRO / DETAIL</div>

          <h1
            style={{
              marginTop: 16,
              marginBottom: 10,
              fontSize: 40,
              lineHeight: 1.1,
              color: "#020617",
              letterSpacing: "-0.04em",
            }}
          >
            {loading ? "Loading MOC Detail..." : request?.title || "MOC Detail"}
          </h1>

          <p style={{ margin: 0, color: "#64748b", fontSize: 17, lineHeight: 1.7 }}>
            Read-only preview untuk demo workflow MOC: request, screening,
            impact review, action tracker, approval, implementation, PSSR,
            closure, dan audit trail.
          </p>

          <div style={{ marginTop: 22, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              href="/lab/moc"
              style={{
                textDecoration: "none",
                background: "#0f172a",
                color: "white",
                padding: "12px 16px",
                borderRadius: 12,
                fontWeight: 800,
              }}
            >
              Back to MOC Dashboard
            </Link>

            <Link
              href="/lab"
              style={{
                textDecoration: "none",
                background: "white",
                color: "#0f172a",
                border: "1px solid #cbd5e1",
                padding: "12px 16px",
                borderRadius: 12,
                fontWeight: 800,
              }}
            >
              Back to Lab
            </Link>
          </div>
        </div>

        {loading && (
          <section style={{ ...card, marginTop: 18, color: "#64748b" }}>
            Loading data...
          </section>
        )}

        {errorText && (
          <section
            style={{
              ...card,
              marginTop: 18,
              background: "#fef2f2",
              color: "#991b1b",
              borderColor: "#fecaca",
              fontWeight: 800,
            }}
          >
            {errorText}
          </section>
        )}

        {!loading && !errorText && request && (
          <>
            <Section title="Request Summary">
              <InfoGrid
                items={[
                  { label: "Request No", value: request.request_no },
                  { label: "Status", value: request.status },
                  { label: "Priority", value: request.priority },
                  { label: "Risk Level", value: request.risk_level },
                  { label: "Company", value: data.company?.company_name },
                  { label: "Site", value: data.site?.site_name },
                  { label: "Requested By", value: request.requested_by_name },
                  { label: "Created", value: formatDate(request.created_at) },
                ]}
              />

              <div style={{ marginTop: 18 }}>
                <h3 style={{ margin: "0 0 8px", color: "#0f172a" }}>Description</h3>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                  {valueText(request.description)}
                </p>
              </div>

              <InfoGrid
                items={[
                  { label: "Change Type", value: request.change_type },
                  { label: "Department", value: request.department },
                  { label: "Area", value: request.area },
                  { label: "Target Completion", value: formatDate(request.target_completion_date) },
                ]}
              />

              <div style={{ marginTop: 18 }}>
                <h3 style={{ margin: "0 0 8px", color: "#0f172a" }}>
                  Current Condition
                </h3>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                  {valueText(request.current_condition)}
                </p>

                <h3 style={{ margin: "18px 0 8px", color: "#0f172a" }}>
                  Proposed Change
                </h3>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
                  {valueText(request.proposed_change)}
                </p>
              </div>
            </Section>

            <Section title="Workflow Snapshot">
              <InfoGrid items={workflowKpis} />
            </Section>

            <Section title="Screening" subtitle="Data dari table moc_screening dan moc_screenings.">
              <SimpleTable
                rows={[...(data.screeningOld || []), ...(data.screeningNew || [])]}
                emptyText="Belum ada data screening."
                columns={[
                  { key: "screening_decision", label: "Decision" },
                  { key: "screening_result", label: "Result" },
                  { key: "is_moc_required", label: "MOC Required" },
                  { key: "screening_notes", label: "Notes" },
                  { key: "created_at", label: "Created", format: formatDate },
                ]}
              />
            </Section>

            <Section title="Impact Reviews">
              <SimpleTable
                rows={data.impactReviews}
                emptyText="Belum ada impact review."
                columns={[
                  { key: "review_area", label: "Area" },
                  { key: "impact_description", label: "Impact" },
                  { key: "risk_before", label: "Risk Before" },
                  { key: "risk_after", label: "Risk After" },
                  { key: "review_status", label: "Status" },
                ]}
              />
            </Section>

            <Section title="Action Tracker">
              <SimpleTable
                rows={data.actions}
                emptyText="Belum ada action tracker."
                columns={[
                  { key: "action_title", label: "Action" },
                  { key: "responsible_person", label: "PIC" },
                  { key: "due_date", label: "Due Date", format: formatDate },
                  { key: "priority", label: "Priority" },
                  { key: "status", label: "Status" },
                ]}
              />
            </Section>

            <Section title="Approval">
              <SimpleTable
                rows={data.approvalSteps}
                emptyText="Belum ada approval step."
                columns={[
                  { key: "step_no", label: "Step" },
                  { key: "step_name", label: "Name" },
                  { key: "approval_role", label: "Role" },
                  { key: "decision", label: "Decision" },
                  { key: "approval_comment", label: "Comment" },
                ]}
              />
            </Section>

            <Section title="Implementation Requirements">
              <SimpleTable
                rows={data.implementationRequirements}
                emptyText="Belum ada implementation requirement."
                columns={[
                  { key: "requirement_name", label: "Requirement" },
                  { key: "requirement_type", label: "Type" },
                  { key: "requirement_status", label: "Status" },
                  { key: "is_mandatory", label: "Mandatory" },
                  { key: "verifier_comment", label: "Verifier Comment" },
                ]}
              />
            </Section>

            <Section title="PSSR Checklist">
              <SimpleTable
                rows={data.pssrChecklistItems}
                emptyText="Belum ada PSSR checklist."
                columns={[
                  { key: "checklist_category", label: "Category" },
                  { key: "checklist_item", label: "Item" },
                  { key: "item_status", label: "Status" },
                  { key: "is_mandatory", label: "Mandatory" },
                  { key: "verifier_comment", label: "Comment" },
                ]}
              />
            </Section>

            <Section title="Closure Requirements">
              <SimpleTable
                rows={data.closureRequirements}
                emptyText="Belum ada closure requirement."
                columns={[
                  { key: "requirement_name", label: "Requirement" },
                  { key: "requirement_type", label: "Type" },
                  { key: "requirement_status", label: "Status" },
                  { key: "is_mandatory", label: "Mandatory" },
                  { key: "verifier_comment", label: "Comment" },
                ]}
              />
            </Section>

            <Section title="Audit Trail">
              <SimpleTable
                rows={data.auditEvents}
                emptyText="Belum ada audit event."
                columns={[
                  { key: "created_at", label: "Date", format: formatDate },
                  { key: "event_stage", label: "Stage" },
                  { key: "event_type", label: "Type" },
                  { key: "event_title", label: "Event" },
                  { key: "actor_name", label: "Actor" },
                ]}
              />
            </Section>
          </>
        )}
      </div>
    </main>
  );
}