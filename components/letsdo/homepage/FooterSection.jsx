"use client";

import LogoMark from "@/components/letsdo/ui/LogoMark";
import { trackEvent } from "@/lib/analytics";
import { NAV_ITEMS } from "@/lib/letsdo-data";
import { SITE_BRAND, SITE_CONTACT } from "@/lib/letsdo-site";

export default function FooterSection() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-3 lg:px-8">
        <div>
          <LogoMark />
          <p className="mt-4 max-w-sm text-sm leading-7 text-slate-600">
            {SITE_BRAND.name} is a practical digital solutions brand focused on safety, compliance,
            maintenance, and operational improvement.
          </p>
        </div>

        <div>
          <div className="text-sm font-semibold text-slate-900">Quick Links</div>
          <div className="mt-4 grid gap-3 text-sm text-slate-600">
            {NAV_ITEMS.filter((item) => item.label !== "Home").map((item) => (
              <a key={item.label} href={item.href} className="transition hover:text-slate-950">
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold text-slate-900">Contact</div>
          <div className="mt-4 grid gap-3 text-sm text-slate-600">
            <a
              href={`mailto:${SITE_CONTACT.email}`}
              onClick={() =>
                trackEvent("cta_email_click", {
                  page_name: "home",
                  section_name: "footer",
                  cta_label: "email",
                })
              }
            >
              {SITE_CONTACT.email}
            </a>
            <a
              href={SITE_CONTACT.whatsappUrl}
              onClick={() =>
                trackEvent("cta_whatsapp_click", {
                  page_name: "home",
                  section_name: "footer",
                  cta_label: "whatsapp",
                })
              }
            >
              WhatsApp
            </a>
            <a
              href={SITE_CONTACT.linkedinUrl}
              onClick={() =>
                trackEvent("linkedin_click", {
                  page_name: "home",
                  section_name: "footer",
                  cta_label: "linkedin",
                })
              }
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 px-6 py-5 text-center text-xs text-slate-500 lg:px-8">
        (c) {SITE_BRAND.name}
      </div>
    </footer>
  );
}