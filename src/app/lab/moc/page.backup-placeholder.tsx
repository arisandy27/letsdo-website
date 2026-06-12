export default function Page() {
  return (
    <main style={{ padding: "32px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <a href="/lab" style={{ color: "#555", textDecoration: "none" }}>
          ← Back to LetsDo Lab
        </a>

        <div style={{ marginTop: "24px" }}>
          <p style={{ color: "#777", marginBottom: "8px" }}>Process Safety</p>

          <h1 style={{ fontSize: "34px", margin: "0 0 12px" }}>
            MOC Manager Pro
          </h1>

          <span
            style={{
              display: "inline-block",
              padding: "6px 12px",
              borderRadius: "999px",
              background: "#f2f2f2",
              fontSize: "13px",
              marginBottom: "24px",
            }}
          >
            Status: MVP
          </span>

          <p style={{ color: "#555", lineHeight: 1.7, maxWidth: "720px" }}>
            Management of Change workflow from request, screening, impact review, action tracker, PSSR, approval, implementation, and closure.
          </p>

          <div
            style={{
              marginTop: "28px",
              padding: "20px",
              border: "1px solid #ddd",
              borderRadius: "16px",
              background: "#fff",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Next Development Area</h2>
            <ul style={{ color: "#555", lineHeight: 1.8 }}>
              <li>Define MVP scope</li>
              <li>Create database module</li>
              <li>Create dashboard layout</li>
              <li>Create input form</li>
              <li>Create list/detail page</li>
              <li>Prepare demo data</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
