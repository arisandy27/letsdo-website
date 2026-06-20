import SectionHeading from "@/components/letsdo/ui/SectionHeading";

export default function FounderSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#0f172a,#1e293b)] p-5 text-white shadow-sm">
          <div className="relative overflow-hidden rounded-[1.5rem] bg-white/10">
            <img
              src="/images/founder-profile.png"
              alt="Bobby Rachmat Arisandy - Founder of Let's Do"
              className="h-[380px] w-full object-cover object-center"
            />

            <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-left shadow-lg backdrop-blur">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-200">
                Founder-led credibility
              </div>
              <div className="mt-2 text-lg font-semibold">
                Built from real industrial experience
              </div>
              <div className="mt-2 text-xs leading-5 text-slate-300">
                Practical digital tools shaped by real operations, safety, and improvement workflows.
              </div>
            </div>
          </div>
        </div>

        <div>
          <SectionHeading
            eyebrow="Trust basis"
            title="Built with real operational understanding"
            description="Let's Do is founder-led and built around practical experience from manufacturing, operations, safety, compliance, and continuous improvement. The focus is simple: create digital tools that are relevant, manageable, and useful for daily execution."
          />

          <div className="mt-8 rounded-[2rem] border border-slate-200 bg-slate-50 p-7">
            <div className="text-2xl font-semibold tracking-tight text-slate-950">
              Bobby Rachmat Arisandy
            </div>
            <div className="mt-3 text-sm leading-7 text-slate-600">
              Industrial practitioner with 20+ years of experience in manufacturing,
              operations, safety, process-related workflows, and continuous improvement.
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {[
                "20+ years experience",
                "Industrial operations",
                "Safety & compliance",
                "Practical digital tools",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
                >
                  {item}
                </span>
              ))}
            </div>

            <a
              href="/about"
              className="mt-7 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5"
            >
              Learn more about the founder
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
