"use client";

import { trackEvent } from "@/lib/analytics";

export default function ContactCard({
  href,
  title,
  value,
  icon: Icon,
  eventName,
  sectionName,
  pageName = "home",
}) {
  return (
    <a
      href={href}
      onClick={() =>
        trackEvent(eventName, {
          page_name: pageName,
          section_name: sectionName,
          cta_label: title.toLowerCase(),
        })
      }
      className="block rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm text-slate-500">{title}</div>
          <div className="mt-1 text-base font-medium text-slate-900">{value}</div>
        </div>
      </div>
    </a>
  );
}