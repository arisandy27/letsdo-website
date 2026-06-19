import { SITE_BRAND } from "@/lib/letsdo-site";

export default function LogoMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white shadow-sm ring-1 ring-slate-900/10">
        LD
      </div>
      <div className="leading-tight">
        <div className="text-lg font-semibold tracking-tight text-slate-950">{SITE_BRAND.name}</div>
        <div className="text-xs text-slate-500">{SITE_BRAND.tagline}</div>
      </div>
    </div>
  );
}
