"use client";

import { ArrowRight } from "lucide-react";
import SectionHeading from "@/components/letsdo/ui/SectionHeading";
import StatusBadge from "@/components/letsdo/ui/StatusBadge";
import { trackEvent } from "@/lib/analytics";
import { SOLUTIONS } from "@/lib/letsdo-data";

export default function SolutionsSection() {
  return (
    <section id="solutions" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          eyebrow="Core solutions"
          title="Solutions designed around real workflows"
          description="Our solutions help companies digitize key operational, safety, and compliance activities in a practical way."
        />
        <a
          href="/solutions"
          onClick={() =>
            trackEvent("cta_discuss_needs_click", {
              page_name: "home",
              section_name: "solutions_header",
              cta_label: "browse_solutions",
            })
          }
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-950"
        >
          Browse All Solutions <ArrowRight className="h-4 w-4" />
        </a>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {SOLUTIONS.map((solution) => {
          const Icon = solution.icon;
          const detailHref = `/solutions/${solution.slug}`;

          return (
            <a
              key={solution.name}
              href={detailHref}
              onClick={() =>
                trackEvent("solution_card_click", {
                  page_name: "home",
                  section_name: "solutions_grid",
                  solution_name: solution.slug,
                  solution_status: solution.status,
                })
              }
              className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                  <Icon className="h-5 w-5" />
                </div>
                <StatusBadge status={solution.status} />
              </div>
              <div className="mt-5 text-lg font-semibold text-slate-950">{solution.name}</div>
              <p className="mt-4 flex-1 text-sm leading-7 text-slate-600">{solution.desc}</p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                Learn more <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
