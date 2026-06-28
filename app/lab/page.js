import Link from "next/link";

export const dynamic = "force-dynamic";

const apps = [
  {
    title: "Fire Maintenance Pro",
    description:
      "Asset register, schedule, inspection, findings, evidence, reports, and training record for fire protection maintenance.",
    href: "/lab/fire-maintenance",
    status: "MVP Active",
    category: "Fire Protection",
  },
  {
    title: "MOC Manager Pro",
    description:
      "Management of Change workflow: screening, impact review, action tracker, approval, PSSR, closure, and attachments.",
    href: "/lab/moc",
    status: "MVP Active",
    category: "Process Safety",
  },
  {
    title: "MSDS Toolkit Pro",
    description:
      "SDS register, QR label, storage risk, chemical compatibility, reports, and readiness check for factories.",
    href: null,
    status: "Separate Live App",
    category: "Chemical Safety",
  },
  {
    title: "E-Permit",
    description:
      "Digital permit to work for hot work, confined space, electrical work, working at height, and excavation.",
    href: null,
    status: "Planned MVP",
    category: "Safety Permit",
  },
  {
    title: "OEE Toolkit",
    description:
      "Production performance dashboard with availability, losses, downtime, batch output, and improvement tracking.",
    href: null,
    status: "Planned MVP",
    category: "Operations",
  },
  {
    title: "CCTV Safety Observation",
    description:
      "Safety observation dashboard from CCTV findings, unsafe action records, and corrective action monitoring.",
    href: null,
    status: "Planned MVP",
    category: "Safety AI",
  },
  {
    title: "Edu Exam Archive",
    description:
      "Tool to collect school exercise and exam questions, correct answers, review notes, and preparation history.",
    href: null,
    status: "Planned MVP",
    category: "Education",
  },
  {
    title: "RT/RW Citizen Tools",
    description:
      "Neighborhood administration tools for resident data, letters, dues, reports, and RT/RW service tracking.",
    href: null,
    status: "Planned MVP",
    category: "Community",
  },
];

function AppCard({ app }) {
  const content = (
    <>
      <div className="top">
        <span className="category">{app.category}</span>
        <span className={app.href ? "status active" : "status"}>{app.status}</span>
      </div>

      <h2>{app.title}</h2>
      <p>{app.description}</p>

      <div className={app.href ? "open" : "open disabled"}>
        {app.href ? "Open Dashboard →" : "Coming Soon / Connect Later"}
      </div>
    </>
  );

  if (app.href) {
    return (
      <Link href={app.href} className="card">
        {content}
      </Link>
    );
  }

  return <div className="card disabled-card">{content}</div>;
}

export default function LabHomePage() {
  return (
    <main className="page">
      <style>{css}</style>

      <section className="hero">
        <div>
          <div className="eyebrow">LetsDo Lab</div>
          <h1>Digital Tools Lab</h1>
          <p>
            Kumpulan MVP tools untuk safety, operations, maintenance, compliance,
            education, dan community services.
          </p>
        </div>
      </section>

      <section className="grid">
        {apps.map((app) => (
          <AppCard key={app.title} app={app} />
        ))}
      </section>
    </main>
  );
}

const css = `
  .page {
    min-height: 100vh;
    background: #f8fafc;
    color: #0f172a;
    padding: 24px;
    font-family: Arial, sans-serif;
  }

  .hero {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    padding: 28px;
    margin-bottom: 18px;
    box-shadow: 0 8px 20px rgba(15,23,42,.04);
  }

  .eyebrow {
    color: #ea580c;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: .4px;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  h1 {
    margin: 0 0 10px;
    font-size: 36px;
    letter-spacing: -1px;
  }

  p {
    color: #64748b;
    line-height: 1.55;
    margin: 0;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .card {
    display: block;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 20px;
    text-decoration: none;
    color: inherit;
    box-shadow: 0 8px 20px rgba(15,23,42,.04);
    transition: all .15s ease;
    min-height: 190px;
  }

  a.card:hover {
    transform: translateY(-2px);
    border-color: #fed7aa;
    box-shadow: 0 14px 28px rgba(15,23,42,.08);
  }

  .disabled-card {
    opacity: .78;
  }

  .top {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 16px;
  }

  .category,
  .status {
    display: inline-flex;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 800;
    border: 1px solid #e2e8f0;
    white-space: nowrap;
  }

  .category {
    background: #fff7ed;
    color: #c2410c;
    border-color: #fed7aa;
  }

  .status {
    background: #f1f5f9;
    color: #475569;
    border-color: #cbd5e1;
  }

  .status.active {
    background: #ecfdf5;
    color: #047857;
    border-color: #a7f3d0;
  }

  h2 {
    margin: 0 0 8px;
    font-size: 22px;
  }

  .open {
    margin-top: 18px;
    color: #ea580c;
    font-weight: 900;
  }

  .open.disabled {
    color: #64748b;
  }

  @media (max-width: 1000px) {
    .grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 700px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
`;
