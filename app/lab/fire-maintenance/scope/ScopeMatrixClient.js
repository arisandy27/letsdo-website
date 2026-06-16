"use client";

import { useDeferredValue, useMemo, useState } from "react";

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function frequencyLabel(value) {
  const labels = {
    weekly: "Weekly",
    monthly: "Monthly",
    quarterly: "3 Month / Quarterly",
    semiannual: "6 Month / Semiannual",
    annual: "1 Year / Annual",
  };

  return labels[value] || value || "-";
}

function frequencyOrder(value) {
  const order = {
    weekly: 1,
    monthly: 2,
    quarterly: 3,
    semiannual: 4,
    annual: 5,
  };

  return order[value] || 99;
}

function csvEscape(value) {
  const text = String(value || "");
  return `"${text.replace(/"/g, '""')}"`;
}

function uniqueOptions(items, getter) {
  return Array.from(new Set(items.map(getter).filter(Boolean).map(String))).sort();
}

function checklistItems(value) {
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return value
        .split(/\r?\n|;/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

export default function ScopeMatrixClient({ scopes = [] }) {
  const [search, setSearch] = useState("");
  const [frequency, setFrequency] = useState("all");
  const [systemGroup, setSystemGroup] = useState("all");
  const [evidence, setEvidence] = useState("all");

  const deferredSearch = useDeferredValue(search);

  const frequencyOptions = useMemo(
    () =>
      uniqueOptions(scopes, (item) => item.frequency).sort(
        (a, b) => frequencyOrder(a) - frequencyOrder(b)
      ),
    [scopes]
  );

  const systemOptions = useMemo(
    () => uniqueOptions(scopes, (item) => item.system_group),
    [scopes]
  );

  const filteredScopes = useMemo(() => {
    const term = normalize(deferredSearch);

    return scopes.filter((scope) => {
      const checks = checklistItems(scope.checklist_items).join(" ");

      const searchableText = normalize(
        [
          scope.frequency,
          scope.system_group,
          scope.scope_title,
          scope.scope_detail,
          scope.execution_mode,
          checks,
          scope.source_reference,
        ].join(" ")
      );

      const matchSearch = !term || searchableText.includes(term);
      const matchFrequency = frequency === "all" || scope.frequency === frequency;
      const matchSystem = systemGroup === "all" || scope.system_group === systemGroup;

      const matchEvidence =
        evidence === "all" ||
        (evidence === "photo" && scope.requires_photo) ||
        (evidence === "test" && scope.requires_test_result) ||
        (evidence === "both" && scope.requires_photo && scope.requires_test_result) ||
        (evidence === "none" && !scope.requires_photo && !scope.requires_test_result);

      return matchSearch && matchFrequency && matchSystem && matchEvidence;
    });
  }, [scopes, deferredSearch, frequency, systemGroup, evidence]);

  const grouped = useMemo(() => {
    const bucket = filteredScopes.reduce((acc, item) => {
      const key = item.frequency || "unassigned";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    return Object.keys(bucket)
      .sort((a, b) => frequencyOrder(a) - frequencyOrder(b))
      .map((key) => ({
        frequency: key,
        items: bucket[key],
      }));
  }, [filteredScopes]);

  function clearFilters() {
    setSearch("");
    setFrequency("all");
    setSystemGroup("all");
    setEvidence("all");
  }

  function exportCsv() {
    const headers = [
      "Frequency",
      "System Group",
      "Execution Mode",
      "Scope Title",
      "Scope Detail",
      "Requires Photo",
      "Requires Test Result",
      "Checklist",
      "Source Reference",
    ];

    const rows = filteredScopes.map((scope) => [
      scope.frequency,
      scope.system_group,
      scope.execution_mode,
      scope.scope_title,
      scope.scope_detail,
      scope.requires_photo ? "Required" : "No",
      scope.requires_test_result ? "Required" : "No",
      checklistItems(scope.checklist_items).join(" | "),
      scope.source_reference,
    ]);

    const csvBody = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\r\n");

    const csv = "\uFEFFsep=,\r\n" + csvBody;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "fire-maintenance-scope-matrix-excel-ready.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <section style={panelStyle}>
      <div style={headerStyle}>
        <div>
          <h2 style={{ margin: 0 }}>Scope Matrix Viewer</h2>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>
            Showing {filteredScopes.length} of {scopes.length} scope items
          </p>
        </div>

        <div style={actionGroupStyle}>
          <a href="/lab/fire-maintenance/scope-mapping" style={linkButtonStyle}>
            Scope Mapping
          </a>
          <a href="/lab/fire-maintenance/timeline" style={linkButtonStyle}>
            Timeline
          </a>
          <a href="/lab/fire-maintenance/schedules" style={linkButtonStyle}>
            Schedule
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
          placeholder="Search scope title, system, checklist, source..."
          style={inputStyle}
        />

        <select
          value={frequency}
          onChange={(event) => setFrequency(event.target.value)}
          style={selectStyle}
        >
          <option value="all">All Frequency</option>
          {frequencyOptions.map((option) => (
            <option key={option} value={option}>
              {frequencyLabel(option)}
            </option>
          ))}
        </select>

        <select
          value={systemGroup}
          onChange={(event) => setSystemGroup(event.target.value)}
          style={selectStyle}
        >
          <option value="all">All System</option>
          {systemOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          value={evidence}
          onChange={(event) => setEvidence(event.target.value)}
          style={selectStyle}
        >
          <option value="all">All Evidence</option>
          <option value="photo">Photo Required</option>
          <option value="test">Test Result Required</option>
          <option value="both">Photo + Test Required</option>
          <option value="none">No Evidence Required</option>
        </select>

        <button type="button" onClick={clearFilters} style={secondaryButtonStyle}>
          Clear
        </button>
      </div>

      <div style={groupWrapperStyle}>
        {grouped.map((group) => (
          <div key={group.frequency} style={groupStyle}>
            <div style={groupHeadStyle}>
              <div>
                <h3 style={{ margin: 0 }}>{frequencyLabel(group.frequency)}</h3>
                <p style={{ margin: "5px 0 0", color: "#64748b", fontSize: 13 }}>
                  {group.items.length} active scope item(s)
                </p>
              </div>

              <span style={frequencyBadgeStyle}>{frequencyLabel(group.frequency)}</span>
            </div>

            <div style={cardGridStyle}>
              {group.items.map((scope) => (
                <ScopeCard key={scope.id} scope={scope} />
              ))}
            </div>
          </div>
        ))}

        {grouped.length === 0 && (
          <div style={emptyStyle}>No scope item matches the current search/filter.</div>
        )}
      </div>
    </section>
  );
}

function ScopeCard({ scope }) {
  const checks = checklistItems(scope.checklist_items);

  return (
    <div style={cardStyle}>
      <div style={cardTopStyle}>
        <span style={systemBadgeStyle}>{scope.system_group || "-"}</span>
        <span style={modeBadgeStyle}>{scope.execution_mode || "-"}</span>
      </div>

      <h3 style={{ margin: "8px 0", fontSize: 17 }}>{scope.scope_title || "-"}</h3>

      <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5, margin: "0 0 10px" }}>
        {scope.scope_detail || "-"}
      </p>

      <div style={evidenceRowStyle}>
        <span style={scope.requires_photo ? yesBadgeStyle : noBadgeStyle}>
          Photo: {scope.requires_photo ? "Required" : "No"}
        </span>

        <span style={scope.requires_test_result ? yesBadgeStyle : noBadgeStyle}>
          Test Result: {scope.requires_test_result ? "Required" : "No"}
        </span>
      </div>

      <div style={checklistStyle}>
        <div style={checklistTitleStyle}>Checklist</div>

        {checks.length > 0 ? (
          checks.map((item, index) => (
            <div style={checkItemStyle} key={index}>
              - {item}
            </div>
          ))
        ) : (
          <div style={checkItemStyle}>- No checklist item</div>
        )}
      </div>

      <div style={sourceStyle}>{scope.source_reference || "-"}</div>
    </div>
  );
}

const panelStyle = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.04)",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  alignItems: "flex-start",
  marginBottom: 16,
};

const actionGroupStyle = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const toolbarStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(260px, 1fr) 170px 190px 200px 90px",
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
  fontSize: 14,
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

const groupWrapperStyle = {
  display: "grid",
  gap: 16,
};

const groupStyle = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 14,
};

const groupHeadStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  marginBottom: 12,
  flexWrap: "wrap",
};

const cardGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
};

const cardStyle = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 14,
};

const cardTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  marginBottom: 8,
  flexWrap: "wrap",
};

const systemBadgeStyle = {
  display: "inline-flex",
  background: "#fff7ed",
  color: "#c2410c",
  border: "1px solid #fed7aa",
  borderRadius: 999,
  padding: "4px 10px",
  fontSize: 12,
  fontWeight: 900,
};

const modeBadgeStyle = {
  display: "inline-flex",
  background: "#eff6ff",
  color: "#1d4ed8",
  border: "1px solid #bfdbfe",
  borderRadius: 999,
  padding: "4px 10px",
  fontSize: 12,
  fontWeight: 900,
};

const frequencyBadgeStyle = {
  display: "inline-flex",
  background: "#e0f2fe",
  color: "#075985",
  border: "1px solid #bae6fd",
  borderRadius: 999,
  padding: "4px 10px",
  fontSize: 12,
  fontWeight: 900,
};

const evidenceRowStyle = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginBottom: 10,
};

const yesBadgeStyle = {
  display: "inline-flex",
  borderRadius: 999,
  padding: "4px 10px",
  fontSize: 12,
  fontWeight: 900,
  background: "#ecfdf5",
  color: "#047857",
  border: "1px solid #a7f3d0",
};

const noBadgeStyle = {
  display: "inline-flex",
  borderRadius: 999,
  padding: "4px 10px",
  fontSize: 12,
  fontWeight: 900,
  background: "#f1f5f9",
  color: "#475569",
  border: "1px solid #cbd5e1",
};

const checklistStyle = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 10,
  marginBottom: 10,
};

const checklistTitleStyle = {
  fontWeight: 900,
  marginBottom: 6,
  fontSize: 13,
};

const checkItemStyle = {
  color: "#334155",
  fontSize: 12,
  lineHeight: 1.6,
};

const sourceStyle = {
  color: "#64748b",
  fontSize: 11,
  fontStyle: "italic",
};

const emptyStyle = {
  color: "#64748b",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 14,
  fontSize: 14,
};