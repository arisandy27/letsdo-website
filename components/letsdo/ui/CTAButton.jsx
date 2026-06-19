"use client";

import { trackEvent } from "@/lib/analytics";

export default function CTAButton({
  href,
  children,
  eventName,
  sectionName,
  ctaLabel,
  pageName = "home",
  variant = "primary",
  className = "",
}) {
  const base =
    variant === "primary"
      ? "bg-slate-900 text-white hover:-translate-y-0.5"
      : variant === "light"
        ? "bg-white text-slate-900 hover:-translate-y-0.5"
        : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50";

  return (
    <a
      href={href}
      onClick={() =>
        trackEvent(eventName, {
          page_name: pageName,
          section_name: sectionName,
          cta_label: ctaLabel,
        })
      }
      className={`rounded-2xl px-5 py-3 text-sm font-medium shadow-sm transition ${base} ${className}`}
    >
      {children}
    </a>
  );
}