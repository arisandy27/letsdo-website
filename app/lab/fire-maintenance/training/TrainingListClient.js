"use client";

import { useDeferredValue, useMemo, useState } from "react";

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function formatText(value) {
  return value || "-";
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "-";
  const text = String(value);
  if (text.length < 10) return text;
  return `${text.slice(8, 10)}/${text.slice(5, 7)}/${text.slice(0, 4)}`;
}

function csvEscape(value) {
  const text = String(value || "");
  return `"${text.replace(/"/g, '""')}"`;
}

function uniqueOptions(items, getter) {
  return Array.from(new Set(items.map(getter).filter(Boolean).map(String))).sort();
}

function getTrainingStatus(trainingDate) {
  return String(trainingDate || "") > todayIso() ? "planned" : "completed";
}

export default function TrainingListClient({ trainings = [] }) {
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("all");
  const [status, setStatus] = useState("all");

  const deferredSearch = useDeferredValue(search);

  const topicOptions = useMemo(
    () => uniqueOptions(trainings, (item) => item.topic),
    [trainings]
  );

  const filteredTrainings = useMemo(() => {
    const term = normalize(deferredSearch);

    return trainings.filter((item) => {
      const computedStatus = getTrainingStatus(item.training_date);

      const searchableText = normalize(
        [
          item.training_title,
          item.topic,
          item.training_date,
          item.trainer_name,
          item.target_team,
          item.participants_count,
          item.notes,
          computedStatus,
        ].join(" ")
      );

      const matchSearch = !term || searchableText.includes(term);
      const matchTopic = topic === "all" || item.topic === topic;
      const matchStatus = status === "all" || computedStatus === status;

      return matchSearch && matchTopic && matchStatus;
    });
  }, [trainings, deferredSearch, topic, status]);

  function clearFilters() {
    setSearch("");
    setTopic("all");
    setStatus("all");
  }

  function exportCsv() {
    const headers = [
      "Training Date",
      "Status",
      "Training Title",
      "Topic",
      "Trainer Name",
      "Target Team",
      "Participants Count",
      "Notes",
    ];

    const rows = filteredTrainings.map((item) => [
      item.training_date,
      getTrainingStatus(item.training_date),
      item.training_title,
      item.topic,
      item.trainer_name,
      item.target_team,
      item.participants_count,
      item.notes,
    ]);

    const csvBody = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\r\n");

    const csv = "\uFEFFsep=,\r\n" + csvBody;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "fire-training-records-excel-ready.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <section style={panelStyle}>
      <div style={sectionHeaderStyle}>
        <div>
          <h2 style={{ margin: 0 }}>Training History</h2>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>
            Showing {filteredTrainings.length} of {trainings.length} training records
          </p>
        </div>

        <div style={actionGroupStyle}>
          <a href="/lab/fire-maintenance/training?new=1" style={primaryButtonStyle}>
            Add Training
          </a>
          <a href="/lab/fire-maintenance/evidence" style={linkButtonStyle}>
            Evidence
          </a>
          <a href="/lab/fire-maintenance/findings" style={linkButtonStyle}>
            Findings
          </a>
          <a href="/lab/fire-maintenance/reports" style={linkButtonStyle}>
            Reports
          </a>
          <button type="button" onClick={exportCsv} style={primaryButtonStyle}>
            Export Excel CSV
          </button>
        </div>
      </div>

      <div style={toolbarStyle}>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search title, topic, trainer, team, notes..."
          style={inputStyle}
        />

        <select
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          style={selectStyle}
        >
          <option value="all">All Topic</option>
          {topicOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          style={selectStyle}
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="planned">Planned</option>
        </select>

        <button type="button" onClick={clearFilters} style={secondaryButtonStyle}>
          Clear
        </button>
      </div>

      <div style={trainingListStyle}>
        {filteredTrainings.map((training) => {
          const computedStatus = getTrainingStatus(training.training_date);

          return (
            <div style={trainingCardStyle} key={training.id}>
              <div style={trainingTopStyle}>
                <div>
                  <strong style={{ color: "#ea580c" }}>
                    {formatText(training.training_title)}
                  </strong>
                  <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
                    {formatDate(training.training_date)}
                  </div>
                </div>

                <span style={getStatusBadgeStyle(computedStatus)}>
                  {computedStatus}
                </span>
              </div>

              <div style={trainingTopicStyle}>{formatText(training.topic)}</div>

              <div style={trainingMetaStyle}>
                Trainer: {formatText(training.trainer_name)}
              </div>

              <div style={trainingMetaStyle}>
                Target: {formatText(training.target_team)} | Participants: {training.participants_count || 0}
              </div>

              <div style={trainingNotesStyle}>{formatText(training.notes)}</div>
            </div>
          );
        })}

        {filteredTrainings.length === 0 && (
          <div style={emptyStyle}>No training data matches the current search/filter.</div>
        )}
      </div>
    </section>
  );
}

function getStatusBadgeStyle(status) {
  const value = normalize(status);

  if (value === "completed") {
    return { ...badgeStyle, background: "#ecfdf5", color: "#047857" };
  }

  if (value === "planned") {
    return { ...badgeStyle, background: "#eff6ff", color: "#1d4ed8" };
  }

  return { ...badgeStyle, background: "#f1f5f9", color: "#475569" };
}

const panelStyle = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  padding: 18,
  marginBottom: 18,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
};

const sectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 16,
  flexWrap: "wrap",
};

const actionGroupStyle = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  justifyContent: "flex-end",
  alignItems: "center",
};

const toolbarStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(260px, 1fr) 220px 180px 100px",
  gap: 10,
  marginBottom: 16,
  alignItems: "center",
};

const inputStyle = {
  width: "100%",
  height: 44,
  padding: "0 14px",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const selectStyle = {
  width: "100%",
  height: 44,
  padding: "0 14px",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "white",
  fontSize: 14,
  boxSizing: "border-box",
};

const primaryButtonStyle = {
  height: 44,
  border: "1px solid #ea580c",
  background: "#ea580c",
  color: "white",
  padding: "0 16px",
  borderRadius: 8,
  fontWeight: 800,
  cursor: "pointer",
  textDecoration: "none",
  fontSize: 14,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  whiteSpace: "nowrap",
};

const secondaryButtonStyle = {
  height: 44,
  border: "1px solid #cbd5e1",
  background: "white",
  color: "#334155",
  padding: "0 16px",
  borderRadius: 8,
  fontWeight: 800,
  cursor: "pointer",
  fontSize: 14,
};

const linkButtonStyle = {
  height: 44,
  border: "1px solid #cbd5e1",
  background: "white",
  color: "#0369a1",
  padding: "0 16px",
  borderRadius: 8,
  fontWeight: 800,
  textDecoration: "none",
  fontSize: 14,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  whiteSpace: "nowrap",
};

const trainingListStyle = {
  display: "grid",
  gap: 12,
};

const trainingCardStyle = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 14,
};

const trainingTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 10,
};

const trainingTopicStyle = {
  fontWeight: 900,
  color: "#0f172a",
  marginBottom: 8,
};

const trainingMetaStyle = {
  color: "#64748b",
  fontSize: 13,
  lineHeight: 1.5,
  marginBottom: 6,
};

const trainingNotesStyle = {
  color: "#334155",
  fontSize: 13,
  lineHeight: 1.5,
  marginTop: 8,
};

const badgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 900,
  textTransform: "capitalize",
  whiteSpace: "nowrap",
};

const emptyStyle = {
  padding: 14,
  border: "1px dashed #cbd5e1",
  borderRadius: 14,
  color: "#64748b",
  background: "#f8fafc",
};