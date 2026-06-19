import Header from "@/components/letsdo/homepage/Header";
import FooterSection from "@/components/letsdo/homepage/FooterSection";
import SectionHeading from "@/components/letsdo/ui/SectionHeading";
import StatusBadge from "@/components/letsdo/ui/StatusBadge";
import { SOLUTIONS, LAB_ITEMS } from "@/lib/letsdo-data";

const TYPICAL_USE: Record<string, string> = {
  msds_toolkit_pro:
    "Suitable for HSE, warehouse, and production teams that need better SDS control, QR access, and chemical documentation visibility.",
  moc_manager_pro:
    "Suitable for operations, engineering, and HSE teams that need a more structured workflow for change review, action tracking, and closure.",
  fire_maintenance_pro:
    "Suitable for fire protection, maintenance, and HSE teams that need better control of assets, inspections, findings, and reporting.",
  e_permit:
    "Suitable for supervisors, HSE, and field teams that need clearer permit request, verification, and approval workflow.",
  oee_toolkit:
    "Suitable for production and plant leadership teams that need better visibility of losses, downtime, and improvement opportunities.",
  inspection_action_tracker:
    "Suitable for teams that need a simple way to record findings, assign actions, and monitor closure status.",
};

export default function SolutionsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
            <div className="max-w-3xl">
              <div className="text-sm font-medium text-teal-700">Solutions</div>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Focused digital tools for safety, compliance, maintenance, and operational improvement
              </h1>
              <p className="mt-6 text-base leading-8 text-slate-600">
                Lets Do develops practical digital solutions designed around real workflows.
                The goal is to help companies improve control, consistency, traceability,
                and execution without overcomplicating implementation.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {SOLUTIONS.map((solution) => {
              const Icon = solution.icon;
              const detailHref = `/solutions/${solution.slug}`;

              return (
                <a
                  key={solution.name}
                  href={detailHref}
                  className="group flex h-full flex-col rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <StatusBadge status={solution.status} />
                  </div>

                  <div className="mt-6 text-xl font-semibold tracking-tight text-slate-950">
                    {solution.name}
                  </div>

                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    {solution.desc}
                  </p>

                  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Typical use
                    </div>
                    <div className="mt-2 text-sm leading-7 text-slate-700">
                      {TYPICAL_USE[solution.slug] || "Suitable for teams that need better workflow visibility and follow-up."}
                    </div>
                  </div>

                  <div className="mt-6 inline-flex items-center text-sm font-medium text-slate-900">
                    Learn more
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
            <SectionHeading
              eyebrow="Lets Do Lab"
              title="Also part of the Lets Do Lab"
              description="In addition to the main solutions above, Lets Do also explores practical digital tools for other real-world workflows."
            />

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {LAB_ITEMS.map((item) => (
                <div
                  key={item}
                  className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6"
                >
                  <div className="mb-3 inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700">
                    Lab Concept
                  </div>
                  <div className="text-base font-medium text-slate-900">{item}</div>
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
                  Need a solution that fits your workflow?
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
                  We can help you start from an existing manual process and shape it into
                  a practical digital workflow.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
                <a
                  href="/contact"
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-medium text-slate-900 transition hover:-translate-y-0.5"
                >
                  Request Demo
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
