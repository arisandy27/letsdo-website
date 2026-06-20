import SectionHeading from "@/components/letsdo/ui/SectionHeading";

export default function FounderSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#0f172a,#1e293b)] p-5 text-white shadow-sm">
          <div className="overflow-hidden rounded-[1.5rem] bg-white/10">
            <img
              src="/images/founder-profile.png"
              alt="Bobby Rachmat Arisandy - Founder of Let's Do"
              className="h-[360px] w-full object-cover object-center"
            />
          </div>

          <div className="px-3 py-6 text-center">
            <div className="text-2xl font-semibold">Bobby Rachmat Arisandy</div>

            <div className="mt-2 text-sm font-medium text-teal-200">
              Founder, Let's Do
            </div>

            <div className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-300">
              20+ years of experience in industrial operations, safety, and practical digital solutions.
            </div>
          </div>
        </div>

        <div>
          <SectionHeading
            eyebrow="Founder"
            title="Built with real operational understanding"
            description="Let's Do is built on practical experience from manufacturing, operations, safety, compliance, and continuous improvement. The focus is simple: create digital tools that are relevant, manageable, and useful for daily execution."
          />

          <div className="mt-8 rounded-[2rem] border border-slate-200 bg-slate-50 p-7">
            <div className="text-2xl font-semibold tracking-tight text-slate-950">
              Bobby Rachmat Arisandy
            </div>
            <div className="mt-3 text-sm leading-7 text-slate-600">
              Industrial practitioner with 20+ years of experience in manufacturing,
              operations, safety, process-related workflows, and continuous improvement.
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "Manufacturing background",
              "Operations and productivity improvement",
              "Safety and compliance workflow understanding",
              "Practical digitalization mindset",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700 shadow-sm"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

