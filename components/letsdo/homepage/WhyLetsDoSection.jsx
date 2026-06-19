import SectionHeading from "@/components/letsdo/ui/SectionHeading";
import { BENEFITS } from "@/lib/letsdo-data";

export default function WhyLetsDoSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
      <SectionHeading
        eyebrow="Why Let's Do"
        title="Built for practical execution"
        description="Let's Do combines industrial understanding with practical digitalization so teams can improve control and follow-up without overcomplicating implementation."
      />
      <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {BENEFITS.map((benefit) => (
          <div key={benefit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-base font-medium text-slate-900">{benefit}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
