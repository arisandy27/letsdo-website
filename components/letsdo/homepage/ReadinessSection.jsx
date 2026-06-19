"use client";

import CTAButton from "@/components/letsdo/ui/CTAButton";
import { trackEvent } from "@/lib/analytics";

export default function ReadinessSection() {
  return (
    <section id="readiness" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
      <div className="rounded-[2rem] bg-slate-900 px-8 py-12 text-white shadow-sm lg:px-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Not sure where to start?</h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
              Start with a free readiness check. We help identify which manual process can be digitized first based on your current workflow, priorities, and improvement needs.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <CTAButton
              href="/readiness-check"
              eventName="cta_readiness_check_click"
              sectionName="bottom_cta"
              ctaLabel="request_free_readiness_check"
              pageName="home"
              variant="light"
            >
              Request Free Readiness Check
            </CTAButton>
            <a
              href="/contact"
              onClick={() =>
                trackEvent("cta_discuss_needs_click", {
                  page_name: "home",
                  section_name: "bottom_cta",
                  cta_label: "discuss_your_needs",
                })
              }
              className="rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Discuss Your Needs
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
