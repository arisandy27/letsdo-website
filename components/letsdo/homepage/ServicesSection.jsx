import SectionHeading from "@/components/letsdo/ui/SectionHeading";
import { SERVICES } from "@/lib/letsdo-data";

export default function ServicesSection() {
  return (
    <section id="services" className="bg-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <SectionHeading
          eyebrow="Service support"
          title="Services to help you digitize step by step"
          description="Not every company needs a full system rollout from day one. Let's Do also provides services to help teams move from manual process to digital workflow in a practical and manageable way."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {SERVICES.map((service) => (
            <div key={service} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <div className="text-sm leading-7 text-slate-700">{service}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
