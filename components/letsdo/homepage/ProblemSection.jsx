import SectionHeading from "@/components/letsdo/ui/SectionHeading";
import { PAIN_POINTS } from "@/lib/letsdo-data";

export default function ProblemSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8" id="about">
      <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <SectionHeading
          eyebrow="The challenge"
          title="Many important workflows are still managed manually"
          description="Critical operational activities are often still managed through spreadsheets, paper forms, PDFs, shared folders, or chat-based follow-up. These methods may work for a while, but they often make tracking harder, reporting slower, and accountability less visible."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {PAIN_POINTS.map((item) => (
            <div key={item} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm leading-7 text-slate-700">{item}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
