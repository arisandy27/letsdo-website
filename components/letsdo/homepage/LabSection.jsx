import SectionHeading from "@/components/letsdo/ui/SectionHeading";
import { LAB_ITEMS } from "@/lib/letsdo-data";

export default function LabSection() {
  return (
    <section id="lab" className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <SectionHeading
          eyebrow="Let's Do Lab"
          title="Additional workflow tools in development"
          description="In addition to the main solutions, Let's Do also explores practical digital tools for other real-world workflows through the Let's Do Lab."
        />

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {LAB_ITEMS.map((item) => (
            <div
              key={item}
              className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-6"
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
  );
}
