import SectionHeading from "@/components/letsdo/ui/SectionHeading";

export default function ApproachSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <SectionHeading
          eyebrow="The approach"
          title="Practical systems, not unnecessary complexity"
          description="Let's Do builds focused digital tools that help teams improve visibility, control, traceability, and follow-up without the complexity of large enterprise systems."
          align="center"
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            ["Practical", "Built around workflows that teams actually use."],
            ["Relevant", "Designed from real industrial and operational understanding."],
            ["Step by step", "Start from one process, then grow as needed."],
          ].map(([title, desc]) => (
            <div key={title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <div className="text-lg font-semibold text-slate-900">{title}</div>
              <p className="mt-3 text-sm leading-7 text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
