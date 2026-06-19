import Header from "@/components/letsdo/homepage/Header";
import FooterSection from "@/components/letsdo/homepage/FooterSection";
import SectionHeading from "@/components/letsdo/ui/SectionHeading";

const SERVICE_CATEGORIES = [
  {
    title: "Workflow Digitalization Consulting",
    description:
      "We help map manual or fragmented workflows into a clearer digital structure that improves control, traceability, and follow-up.",
    suitableFor:
      "Manual reporting processes, disconnected approval flows, spreadsheet-heavy tracking, and recurring operational follow-up needs.",
  },
  {
    title: "Excel / Google Sheet to Web App Conversion",
    description:
      "We help turn spreadsheet-based tools into structured web applications with better visibility, consistency, and usability.",
    suitableFor:
      "Internal tracking tools, approval workflows, reporting systems, and operational dashboards.",
  },
  {
    title: "SDS / MSDS System Setup",
    description:
      "We support the setup of practical systems for material register, SDS document management, QR labels, and storage risk visibility.",
    suitableFor:
      "Sites with scattered SDS records, growing compliance needs, and chemical inventory visibility improvement.",
  },
  {
    title: "MOC and Compliance Workflow Setup",
    description:
      "We help companies structure change management and compliance-related workflows into more traceable digital processes.",
    suitableFor:
      "Manual MOC processes, action tracking gaps, and approval and closure visibility needs.",
  },
  {
    title: "Fire Maintenance Tracking Setup",
    description:
      "We support practical digitalization of fire maintenance activities including asset tracking, schedules, inspections, findings, and reporting.",
    suitableFor:
      "Routine maintenance tracking, reporting improvement, and evidence and closure visibility.",
  },
  {
    title: "Operational Dashboard Development",
    description:
      "We develop dashboards that help teams monitor performance, follow-up, and operational priorities more effectively.",
    suitableFor:
      "Production review, loss monitoring, KPI dashboards, and action follow-up visibility.",
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
            <div className="max-w-3xl">
              <div className="text-sm font-medium text-teal-700">Services</div>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Practical support for companies that want to digitize step by step
              </h1>
              <p className="mt-6 text-base leading-8 text-slate-600">
                Not every company needs a full software rollout from day one. Lets Do
                provides services to help teams move from manual process to digital
                workflow in a practical, focused, and manageable way.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {SERVICE_CATEGORIES.map((service) => (
              <div
                key={service.title}
                className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm"
              >
                <div className="text-xl font-semibold tracking-tight text-slate-950">
                  {service.title}
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {service.description}
                </p>
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Suitable for
                  </div>
                  <div className="mt-2 text-sm leading-7 text-slate-700">{service.suitableFor}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
            <SectionHeading
              eyebrow="How we usually start"
              title="A simple path to implementation"
              description="We begin by understanding your current workflow, identifying the most practical starting point, and defining a pilot or solution scope that fits your team."
              align="center"
            />

            <div className="mt-12 grid gap-6 md:grid-cols-4">
              {[
                ["01", "Understand your current workflow"],
                ["02", "Identify the most practical starting point"],
                ["03", "Define scope for pilot or setup"],
                ["04", "Build and improve step by step"],
              ].map(([step, title]) => (
                <div key={step} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                  <div className="text-sm font-semibold text-teal-700">{step}</div>
                  <div className="mt-3 text-lg font-semibold text-slate-900">{title}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="rounded-[2rem] bg-slate-950 px-8 py-12 text-white shadow-sm lg:px-12 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Have a manual process you want to improve?
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
                  Lets start from your current workflow and identify a practical
                  digital approach that fits your team.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
                <a
                  href="/contact"
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-medium text-slate-900 transition hover:-translate-y-0.5"
                >
                  Discuss Your Needs
                </a>
                <a
                  href="/readiness-check"
                  className="rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Start with Readiness Check
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
}
