"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import LogoMark from "@/components/letsdo/ui/LogoMark";
import CTAButton from "@/components/letsdo/ui/CTAButton";
import { NAV_ITEMS } from "@/lib/letsdo-data";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <a href="/" className="shrink-0">
          <LogoMark />
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <CTAButton
            href="/readiness-check"
            eventName="cta_readiness_check_click"
            sectionName="header"
            ctaLabel="request_free_readiness_check"
            className="inline-flex items-center"
          >
            Request Free Readiness Check
          </CTAButton>
        </div>

        <button
          type="button"
          className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm md:hidden"
          onClick={() => setMobileOpen((current) => !current)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-slate-200 bg-white px-6 py-4 md:hidden">
          <div className="grid gap-4 text-sm text-slate-600">
            {NAV_ITEMS.map((item) => (
              <a key={item.label} href={item.href} onClick={() => setMobileOpen(false)}>
                {item.label}
              </a>
            ))}
            <CTAButton
              href="/readiness-check"
              eventName="cta_readiness_check_click"
              sectionName="mobile_menu"
              ctaLabel="request_free_readiness_check"
              className="mt-2 inline-flex justify-center"
            >
              Request Free Readiness Check
            </CTAButton>
          </div>
        </div>
      ) : null}
    </header>
  );
}
