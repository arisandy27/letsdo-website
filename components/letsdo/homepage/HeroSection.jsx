import CTAButton from "@/components/letsdo/ui/CTAButton";

export default function HeroSection() {
  return (
    <section id="home" className="relative overflow-hidden border-b border-slate-200/70 bg-slate-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.05),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(45,212,191,0.12),_transparent_35%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-14 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
        <div className="flex flex-col justify-center">
          <div className="mb-5 inline-flex w-fit items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow-sm">
            Built from real industrial experience
          </div>

          <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
            Digital Tools for Safer and Better Operations
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Lets Do helps companies transform manual spreadsheets, paper forms, and scattered
            operational records into practical digital systems for safety, compliance,
            maintenance, and operational improvement.
          </p>

          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-500">
            Designed for teams that need practical systems they can actually use without
            unnecessary complexity.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <CTAButton
              href="/readiness-check"
              eventName="cta_readiness_check_click"
              sectionName="hero"
              ctaLabel="request_free_readiness_check"
              className="inline-flex items-center justify-center"
            >
              Request Free Readiness Check
            </CTAButton>

            <CTAButton
              href="/solutions"
              eventName="cta_view_solutions_click"
              sectionName="hero"
              ctaLabel="view_solutions"
              variant="secondary"
              className="inline-flex items-center justify-center"
            >
              View Solutions
            </CTAButton>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              ["Workflow-first", "Built around real operational use"],
              ["Practical", "Focused on adoption and follow-up"],
              ["Flexible", "Start small and grow from there"],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                <div className="text-sm font-semibold text-slate-900">{title}</div>
                <div className="mt-1 text-xs leading-6 text-slate-500">{desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">SDS</div>
            <div className="mt-4 text-2xl font-semibold text-slate-950">MSDS Toolkit Pro</div>
            <div className="mt-3 text-sm leading-7 text-slate-600">
              SDS register, QR labels, compatibility checks, and storage risk visibility.
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm sm:translate-y-8">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">MOC</div>
            <div className="mt-4 text-2xl font-semibold text-slate-950">MOC Manager Pro</div>
            <div className="mt-3 text-sm leading-7 text-slate-600">
              Workflow from screening to closure with action and approval tracking.
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">FIRE</div>
            <div className="mt-4 text-2xl font-semibold text-slate-950">Fire Maintenance Pro</div>
            <div className="mt-3 text-sm leading-7 text-slate-600">
              Assets, schedules, inspections, findings, evidence, and reporting.
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-900 bg-slate-950 p-7 text-white shadow-sm sm:translate-y-8">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-300">LETS DO</div>
            <div className="mt-4 text-2xl font-semibold">Practical digital systems</div>
            <div className="mt-3 text-sm leading-7 text-slate-300">
              Focused on safety, compliance, maintenance, and operational improvement.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
