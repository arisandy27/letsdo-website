import Header from "@/components/letsdo/homepage/Header";
import FooterSection from "@/components/letsdo/homepage/FooterSection";
import SectionHeading from "@/components/letsdo/ui/SectionHeading";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
            <div className="max-w-3xl">
              <div className="text-sm font-medium text-teal-700">About Lets Do</div>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Practical digital solutions built from real industrial experience
              </h1>
              <p className="mt-6 text-base leading-8 text-slate-600">
                Lets Do helps companies transform manual workflows into practical digital systems
                that improve visibility, control, follow-up, and reporting across safety,
                compliance, maintenance, and operational execution.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
            <SectionHeading
              eyebrow="Why Lets Do"
              title="Created from real workflow challenges"
              description="Many important workflows in industry are still managed through spreadsheets, paper forms, shared folders, PDFs, and chat-based follow-up. That creates gaps in visibility, consistency, and accountability."
            />
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-base leading-8 text-slate-600">
                Lets Do exists to help bridge that gap by turning real workflows into practical
                digital systems that are easier to use, monitor, and improve. We focus on
                solutions that are relevant to day-to-day operations and not overly complex
                systems that are difficult to adopt.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
            <SectionHeading
              eyebrow="What we believe"
              title="A practical approach to digitalization"
              align="center"
              description="Our approach is simple: solve a real problem, start with a manageable scope, and build something teams can actually use."
            />
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                [
                  "Practical first",
                  "A system should help people work better, not create unnecessary complexity.",
                ],
                [
                  "Built around real workflows",
                  "Good digitalization starts from actual field needs, not generic templates.",
                ],
                [
                  "Step by step improvement",
                  "Companies do not need to digitize everything at once. Start from one important process, then grow from there.",
                ],
              ].map(([title, desc]) => (
                <div key={title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                  <div className="text-lg font-semibold text-slate-900">{title}</div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="flex min-h-[360px] items-center justify-center rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#0f172a,#1e293b)] p-10 text-center text-white shadow-sm">
              <div>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-white/10 text-xl font-bold">
                  LD
                </div>
                <div className="mt-6 text-2xl font-semibold">Founder profile</div>
                <div className="mt-3 max-w-xs text-sm leading-7 text-slate-300">
                  Replace later with Lets Do founder photo or brand visual
                </div>
              </div>
            </div>

            <div>
              <SectionHeading
                eyebrow="Founder"
                title="Built with real operational understanding"
                description="Lets Do is built around practical understanding from manufacturing, operations, safety, and continuous improvement. The focus is to combine operational relevance with digital execution."
              />

              <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
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

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
            <SectionHeading
              eyebrow="How we work"
              title="A focused and manageable way to start"
              description="We usually begin by understanding your current workflow, identifying the most practical starting point, and defining a scope that is realistic for your team."
              align="center"
            />
            <div className="mt-12 grid gap-6 md:grid-cols-4">
              {[
                ["01", "Understand the workflow"],
                ["02", "Simplify and structure"],
                ["03", "Build practical tools"],
                ["04", "Start small and improve"],
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
                  Looking for a practical starting point?
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
                  Start with a free readiness check and identify which workflow is best to
                  digitize first.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
                <a
                  href="/readiness-check"
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-medium text-slate-900 transition hover:-translate-y-0.5"
                >
                  Request Free Readiness Check
                </a>
                <a
                  href="/solutions"
                  className="rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  View Solutions
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
