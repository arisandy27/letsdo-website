export default function LabDashboardPage() {
  const apps = [
    {
      name: "MOC Manager Pro",
      route: "/lab/moc",
      status: "MVP",
      category: "Process Safety",
      description: "Management of Change workflow: request, screening, impact review, actions, PSSR, approval, and closure.",
    },
    {
      name: "E-Permit Toolkit",
      route: "/lab/epermit",
      status: "Idea",
      category: "HSE Operations",
      description: "Digital permit-to-work concept for high-risk jobs, approval, worker list, and job closure.",
    },
    {
      name: "OEE Toolkit",
      route: "/lab/oee",
      status: "Idea",
      category: "Operational Excellence",
      description: "OEE monitoring for availability, performance, quality, downtime, and production reporting.",
    },
    {
      name: "CCTV Safety Observation",
      route: "/lab/cctv-safety",
      status: "Idea",
      category: "Safety Technology",
      description: "Safety observation dashboard concept using CCTV, unsafe action records, and corrective action tracking.",
    },
    {
      name: "RT/RW Digital Admin",
      route: "/lab/rtrw",
      status: "Idea",
      category: "Community Administration",
      description: "Resident data, letters, dues, complaints, and local community administration.",
    },
    {
      name: "Exam Question Bank",
      route: "/lab/edu-exam",
      status: "Idea",
      category: "Education",
      description: "Question bank for school exercises, exam questions, answers, and review history.",
    },
  ];

  return (
    <main style={{ padding: "32px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <p style={{ color: "#666", marginBottom: "8px" }}>Let&apos;s Do..!</p>

        <h1 style={{ fontSize: "36px", margin: "0 0 12px" }}>
          LetsDo Lab
        </h1>

        <p style={{ color: "#555", maxWidth: "760px", lineHeight: 1.6 }}>
          Internal incubator for LetsDo digital tools. Use this space to test,
          organize, and develop MVPs before moving selected products into their
          own production project.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
            marginTop: "28px",
          }}
        >
          {apps.map((app) => (
            <a
              key={app.route}
              href={app.route}
              style={{
                display: "block",
                textDecoration: "none",
                color: "inherit",
                border: "1px solid #ddd",
                borderRadius: "16px",
                padding: "20px",
                background: "#fff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                <strong>{app.name}</strong>
                <span
                  style={{
                    fontSize: "12px",
                    padding: "4px 8px",
                    borderRadius: "999px",
                    background: "#f2f2f2",
                  }}
                >
                  {app.status}
                </span>
              </div>

              <p style={{ margin: "0 0 10px", color: "#777", fontSize: "14px" }}>
                {app.category}
              </p>

              <p style={{ margin: 0, color: "#555", lineHeight: 1.5 }}>
                {app.description}
              </p>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}