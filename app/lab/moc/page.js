"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  padding: 20,
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
};

const badgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 700,
  background: "#fff7ed",
  color: "#ea580c",
  border: "1px solid #fed7aa",
};

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

export default function MocDashboardPage() {
  const [data, setData] = useState({
    total: 0,
    open: 0,
    closed: 0,
    highPriority: 0,
    items: [],
  });
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setErrorText("");

        const res = await fetch("/api/lab/moc/requests", {
          cache: "no-store",
        });

        const json = await res.json();

        if (!res.ok || !json.ok) {
          throw new Error(json.error || "Failed to load MOC data");
        }

        setData(json);
      } catch (error) {
        setErrorText(error.message || "Failed to load MOC data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const kpis = useMemo(
    () => [
      { label: "Total MOC", value: data.total },
      { label: "Open MOC", value: data.open },
      { label: "Closed MOC", value: data.closed },
      { label: "High Priority", value: data.highPriority },
    ],
    [data]
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "40px 24px 72px",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={cardStyle}>
          <div style={badgeStyle}>LETSDO LAB / MOC MANAGER PRO</div>

          <h1
            style={{
              marginTop: 16,
              marginBottom: 10,
              fontSize: 42,
              lineHeight: 1.1,
              color: "#020617",
              letterSpacing: "-0.04em",
            }}
          >
            Management of Change Dashboard
          </h1>

          <p
            style={{
              maxWidth: 820,
              color: "#64748b",
              fontSize: 17,
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            Dashboard untuk mengelola workflow MOC: request, screening, impact
            review, action tracker, approval, implementation, PSSR, closure,
            dan attachment evidence.
          </p>

          <div
            style={{
              marginTop: 24,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/lab"
              style={{
                textDecoration: "none",
                background: "#0f172a",
                color: "white",
                padding: "12px 16px",
                borderRadius: 12,
                fontWeight: 800,
              }}
            >
              Back to Lab
            </Link>

            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                border: "1px solid #cbd5e1",
                background: "white",
                color: "#0f172a",
                padding: "12px 16px",
                borderRadius: 12,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Refresh Data
            </button>
          </div>
        </div>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 16,
            marginTop: 20,
          }}
        >
          {kpis.map((kpi) => (
            <div key={kpi.label} style={cardStyle}>
              <div
                style={{
                  color: "#64748b",
                  fontSize: 13,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {kpi.label}
              </div>
              <div
                style={{
                  marginTop: 10,
                  color: "#020617",
                  fontSize: 34,
                  fontWeight: 900,
                }}
              >
                {kpi.value}
              </div>
            </div>
          ))}
        </section>

        <section style={{ ...cardStyle, marginTop: 20, overflowX: "auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  color: "#020617",
                  fontSize: 24,
                  letterSpacing: "-0.02em",
                }}
              >
                MOC Request Register
              </h2>
              <p style={{ margin: "6px 0 0", color: "#64748b" }}>
                Reconnect awal dari table Supabase <b>moc_requests</b>.
              </p>
            </div>
          </div>

          {loading && (
            <div style={{ padding: 24, color: "#64748b" }}>
              Loading MOC data...
            </div>
          )}

          {errorText && (
            <div
              style={{
                padding: 16,
                borderRadius: 12,
                background: "#fef2f2",
                color: "#991b1b",
                border: "1px solid #fecaca",
                fontWeight: 700,
              }}
            >
              {errorText}
            </div>
          )}

          {!loading && !errorText && data.items.length === 0 && (
            <div
              style={{
                padding: 24,
                borderRadius: 12,
                background: "#f8fafc",
                color: "#64748b",
                border: "1px dashed #cbd5e1",
              }}
            >
              Belum ada data MOC di table <b>moc_requests</b>.
            </div>
          )}

          {!loading && !errorText && data.items.length > 0 && (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 920,
              }}
            >
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {[
                    "Request No",
                    "Title",
                    "Status",
                    "Priority",
                    "Risk Before",
                    "Risk After",
                    "Requester",
                    "Created",
                    "Detail",
                  ].map((head) => (
                    <th
                      key={head}
                      style={{
                        textAlign: "left",
                        padding: "12px 10px",
                        borderBottom: "1px solid #e5e7eb",
                        color: "#334155",
                        fontSize: 13,
                      }}
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id || item.requestNo}>
                    <td
                      style={{
                        padding: "12px 10px",
                        borderBottom: "1px solid #e5e7eb",
                        fontWeight: 800,
                        color: "#0f172a",
                      }}
                    >
                      {item.requestNo}
                    </td>
                    <td
                      style={{
                        padding: "12px 10px",
                        borderBottom: "1px solid #e5e7eb",
                        color: "#0f172a",
                      }}
                    >
                      {item.title}
                    </td>
                    <td
                      style={{
                        padding: "12px 10px",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      <span
                        style={{
                          ...badgeStyle,
                          background: "#f1f5f9",
                          color: "#334155",
                          borderColor: "#cbd5e1",
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "12px 10px",
                        borderBottom: "1px solid #e5e7eb",
                        color: "#334155",
                      }}
                    >
                      {item.priority}
                    </td>
                    <td
                      style={{
                        padding: "12px 10px",
                        borderBottom: "1px solid #e5e7eb",
                        color: "#334155",
                      }}
                    >
                      {item.riskBefore}
                    </td>
                    <td
                      style={{
                        padding: "12px 10px",
                        borderBottom: "1px solid #e5e7eb",
                        color: "#334155",
                      }}
                    >
                      {item.riskAfter}
                    </td>
                    <td
                      style={{
                        padding: "12px 10px",
                        borderBottom: "1px solid #e5e7eb",
                        color: "#334155",
                      }}
                    >
                      {item.requester}
                    </td>
                    <td
                      style={{
                        padding: "12px 10px",
                        borderBottom: "1px solid #e5e7eb",
                        color: "#334155",
                      }}
                    >
                      {formatDate(item.createdAt)}
                    </td>
                    <td
                      style={{
                        padding: "12px 10px",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      <Link
  href={`/lab/moc/${encodeURIComponent(item.requestNo)}`}
  style={{
    color: "#ea580c",
    fontWeight: 800,
    textDecoration: "none",
  }}
>
  Open Detail →
</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </main>
  );
}
