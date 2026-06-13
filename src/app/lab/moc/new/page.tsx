"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function NewMocRequestPage() {
  const router = useRouter();

  const [requestNo, setRequestNo] = useState(
    `MOC-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [area, setArea] = useState("");
  const [requestedByName, setRequestedByName] = useState("Bobby Rachmat Arisandy");
  const [currentCondition, setCurrentCondition] = useState("");
  const [proposedChange, setProposedChange] = useState("");
  const [expectedBenefit, setExpectedBenefit] = useState("");
  const [priority, setPriority] = useState("medium");
  const [riskLevel, setRiskLevel] = useState("not_assessed");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    if (!requestNo.trim()) {
      setMessage("Request No is required.");
      setLoading(false);
      return;
    }

    if (!title.trim()) {
      setMessage("Title is required.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("moc_requests").insert({
      request_no: requestNo.trim(),
      title: title.trim(),
      description: description.trim() || null,
      change_type: "normal",
      priority,
      risk_level: riskLevel,
      status: "draft",
      requested_by_name: requestedByName.trim() || null,
      department: department.trim() || null,
      area: area.trim() || null,
      current_condition: currentCondition.trim() || null,
      proposed_change: proposedChange.trim() || null,
      expected_benefit: expectedBenefit.trim() || null,
      notes: "Created from LetsDo Lab New MOC Request UI.",
    });

    if (error) {
      setMessage(`Failed to create MOC request: ${error.message}`);
      setLoading(false);
      return;
    }

    router.push("/lab/moc");
  }

  return (
    <main style={{ padding: "32px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: "850px", margin: "0 auto" }}>
        <a href="/lab/moc" style={{ color: "#555", textDecoration: "none" }}>
          ← Back to MOC Dashboard
        </a>

        <div style={{ marginTop: "24px" }}>
          <p style={{ color: "#777", marginBottom: "8px" }}>MOC Manager Pro</p>

          <h1 style={{ fontSize: "34px", margin: "0 0 12px" }}>
            New MOC Request
          </h1>

          <p style={{ color: "#555", lineHeight: 1.7 }}>
            Create a new Management of Change request. Data will be saved to
            Supabase table <code>moc_requests</code> with draft status.
          </p>
        </div>

        {message && (
          <div
            style={{
              marginTop: "20px",
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

        <form
          onSubmit={handleSubmit}
          style={{
            marginTop: "24px",
            border: "1px solid #ddd",
            borderRadius: "16px",
            padding: "22px",
            background: "#fff",
          }}
        >
          <div style={{ display: "grid", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "8px" }}>
                Request No *
              </label>
              <input
                value={requestNo}
                onChange={(e) => setRequestNo(e.target.value)}
                style={{
                  width: "100%",
                  padding: "11px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "8px" }}>
                Title *
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Example: Change of chemical storage layout"
                style={{
                  width: "100%",
                  padding: "11px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontWeight: 600, marginBottom: "8px" }}>
                  Department
                </label>
                <input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="HSE / Warehouse"
                  style={{
                    width: "100%",
                    padding: "11px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "10px",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, marginBottom: "8px" }}>
                  Area
                </label>
                <input
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Chemical Storage Area"
                  style={{
                    width: "100%",
                    padding: "11px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "10px",
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "8px" }}>
                Requested By
              </label>
              <input
                value={requestedByName}
                onChange={(e) => setRequestedByName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "11px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontWeight: 600, marginBottom: "8px" }}>
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "11px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "10px",
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, marginBottom: "8px" }}>
                  Risk Level
                </label>
                <select
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "11px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "10px",
                  }}
                >
                  <option value="not_assessed">Not Assessed</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "8px" }}>
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: "80px",
                  padding: "11px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "8px" }}>
                Current Condition
              </label>
              <textarea
                value={currentCondition}
                onChange={(e) => setCurrentCondition(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: "80px",
                  padding: "11px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "8px" }}>
                Proposed Change
              </label>
              <textarea
                value={proposedChange}
                onChange={(e) => setProposedChange(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: "80px",
                  padding: "11px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "8px" }}>
                Expected Benefit
              </label>
              <textarea
                value={expectedBenefit}
                onChange={(e) => setExpectedBenefit(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: "80px",
                  padding: "11px 12px",
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "22px" }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "12px 18px",
                border: "1px solid #222",
                borderRadius: "10px",
                background: "#222",
                color: "#fff",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Saving..." : "Create MOC Request"}
            </button>

            <a
              href="/lab/moc"
              style={{
                padding: "12px 18px",
                border: "1px solid #ddd",
                borderRadius: "10px",
                color: "#333",
                textDecoration: "none",
              }}
            >
              Cancel
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}
