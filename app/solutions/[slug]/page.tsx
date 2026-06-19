import { notFound } from "next/navigation";
import Header from "@/components/letsdo/homepage/Header";
import FooterSection from "@/components/letsdo/homepage/FooterSection";
import StatusBadge from "@/components/letsdo/ui/StatusBadge";
import { PRODUCT_LINKS } from "@/lib/product-links";

const SOLUTION_DETAILS = {
  msds_toolkit_pro: {
    title: "MSDS Toolkit Pro",
    status: "Demo Ready",
    summary:
      "A practical system to manage material register, SDS documents, QR access, compatibility checks, and storage risk visibility in one place.",
    bestFor: [
      "HSE teams handling SDS compliance",
      "Warehouse and storage teams managing chemical materials",
      "Production sites that need faster SDS access",
      "Companies that want better visibility of chemical documentation",
    ],
    keyPoints: [
      "Centralized material and SDS register",
      "QR-based access to current SDS documents",
      "Compatibility and storage risk visibility",
      "Practical structure for growing companies",
    ],
    outcomes: [
      "Faster access to SDS information",
      "Better visibility of chemical-related documentation",
      "Improved readiness for audit and compliance review",
      "Reduced dependence on scattered files and manual tracking",
    ],
  },
  moc_manager_pro: {
    title: "MOC Manager Pro",
    status: "Demo Ready",
    summary:
      "A structured workflow tool to digitize management of change from screening through review, action tracking, approval, implementation, and closure.",
    bestFor: [
      "Operations teams running formal change workflows",
      "Engineering and technical teams handling modifications",
      "HSE teams that need traceability of review and approval",
      "Sites that still rely on spreadsheet-based MOC tracking",
    ],
    keyPoints: [
      "Structured lifecycle from request to closure",
      "Improved visibility of review and action status",
      "Better traceability for approvals and follow-up",
      "Practical digitalization without enterprise-level complexity",
    ],
    outcomes: [
      "More consistent MOC workflow execution",
      "Better action tracking and accountability",
      "Improved documentation quality",
      "Clearer status visibility across the MOC process",
    ],
  },
  fire_maintenance_pro: {
    title: "Fire Maintenance Pro",
    status: "Available for Pilot",
    summary:
      "A practical system for fire maintenance tracking that connects assets, scope mapping, schedules, inspections, findings, evidence, and reporting.",
    bestFor: [
      "Fire protection maintenance teams",
      "HSE teams that need better fire system visibility",
      "Sites managing routine inspection and follow-up manually",
      "Organizations improving maintenance reporting discipline",
    ],
    keyPoints: [
      "Asset and scope visibility",
      "Inspection and finding tracking",
      "Evidence and reporting workflow",
      "Better control of maintenance follow-up",
    ],
    outcomes: [
      "Improved visibility of fire maintenance activities",
      "Better follow-up of findings and evidence",
      "More structured reporting workflow",
      "Reduced fragmentation across files and manual records",
    ],
  },
  e_permit: {
    title: "E-Permit / Permit to Work",
    status: "In Development",
    summary:
      "A practical workflow concept to improve permit control, verification, and approval for higher-risk work activities.",
    bestFor: [
      "Sites managing permit to work manually",
      "Supervisors handling verification and approval flow",
      "HSE teams improving permit discipline",
    ],
    keyPoints: [
      "Permit request and review workflow",
      "Clearer verification and approval structure",
      "Better record visibility",
    ],
    outcomes: [
      "Improved permit traceability",
      "Better control of approval status",
      "More structured permit documentation",
    ],
  },
  oee_toolkit: {
    title: "OEE / Operations Performance Toolkit",
    status: "Available for Pilot",
    summary:
      "A practical toolkit to improve visibility of losses, downtime, performance issues, and operational improvement opportunities.",
    bestFor: [
      "Production teams monitoring losses and downtime",
      "Plant leaders reviewing operational performance",
      "Sites that still depend on spreadsheets for performance tracking",
    ],
    keyPoints: [
      "Loss and downtime visibility",
      "Practical dashboard structure",
      "Support for operational improvement review",
    ],
    outcomes: [
      "Improved visibility of performance gaps",
      "Better prioritization of improvement opportunities",
      "Clearer operational review discussions",
    ],
  },
  inspection_action_tracker: {
    title: "Inspection and Action Tracker",
    status: "Available for Pilot",
    summary:
      "A simple but practical workflow to record findings, assign actions, and monitor closure progress in one place.",
    bestFor: [
      "Teams conducting routine inspections",
      "HSE teams managing findings and follow-up",
      "Operations teams that need cleaner action tracking",
    ],
    keyPoints: [
      "Finding capture and action assignment",
      "Closure tracking",
      "Improved follow-up visibility",
    ],
    outcomes: [
      "Better accountability for follow-up",
      "Clearer action status visibility",
      "Reduced dependence on disconnected records",
    ],
  },
};

export default async function SolutionDetailPage({ params }) {
  const { slug } = await params;
  const detail = SOLUTION_DETAILS[slug];

  if (!detail) {
    notFound();
  }

  const productLinks = PRODUCT_LINKS[slug];
  const isMsdsGateway = slug === "msds_toolkit_pro" && productLinks;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
            <div className="max-w-4xl">
              <div className="text-sm font-medium text-teal-700">Solution Detail</div>
              <div className="mt-5">
                <StatusBadge status={detail.status} />
              </div>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                {detail.title}
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600">
                {detail.summary}
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Key Points
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {detail.keyPoints.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-10 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Expected Outcomes
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {detail.outcomes.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Suitable For
              </div>
              <div className="mt-6 grid gap-3">
                {detail.bestFor.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </div>

              {isMsdsGateway ? (
                <div className="mt-8 grid gap-3">
                  <a
                    href={productLinks.readinessCheckUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl bg-slate-900 px-5 py-3 text-center text-sm font-medium text-white transition hover:-translate-y-0.5"
                  >
                    Free SDS Readiness Check
                  </a>
                  <a
                    href={productLinks.demoUrl}
                    className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    Discuss This Solution
                  </a>
                </div>
              ) : (
                <div className="mt-8 grid gap-3">
                  <a
                    href="/contact"
                    className="rounded-2xl bg-slate-900 px-5 py-3 text-center text-sm font-medium text-white transition hover:-translate-y-0.5"
                  >
                    Discuss This Solution
                  </a>
                  <a
                    href="/readiness-check"
                    className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    Start with Readiness Check
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
}
