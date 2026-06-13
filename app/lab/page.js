import Link from "next/link";

export const dynamic = "force-dynamic";

const apps = [
  {
    title: "Fire Maintenance Pro",
    description:
      "Asset register, maintenance schedule, inspection, findings/action tracker, monthly report, and training record for fire protection maintenance.",
    href: "/lab/fire-maintenance",
    status: "MVP Active",
    category: "Fire Protection",
  },
];

export default function LabHomePage() {
  return (
    <main className="page">
      <style>{css}</style>

      <section className="hero">
        <div>
          <div className="eyebrow">LetsDo Lab</div>
          <h1>Digital Tools Lab</h1>
          <p>
            Kumpulan MVP tools untuk safety, operations, maintenance, dan compliance.
          </p>
        </div>
      </section>

      <section className="grid">
        {apps.map((app) => (
          <Link key={app.href} href={app.href} className="card">
            <div className="top">
              <span className="category">{app.category}</span>
              <span className="status">{app.status}</span>
            </div>

            <h2>{app.title}</h2>
            <p>{app.description}</p>

            <div className="open">Open Dashboard →</div>
          </Link>
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
  }

  .card:hover {
    transform: translateY(-2px);
    border-color: #fed7aa;
    box-shadow: 0 14px 28px rgba(15,23,42,.08);
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
  }

  .category {
    background: #fff7ed;
    color: #c2410c;
    border-color: #fed7aa;
  }

  .status {
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

  @media (max-width: 900px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
`;
