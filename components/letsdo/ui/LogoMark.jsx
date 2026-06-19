import { SITE_BRAND } from "@/lib/letsdo-site";

export default function LogoMark() {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/brand/letsdo-logo.png"
        alt={SITE_BRAND.name}
        className="h-14 w-auto object-contain"
      />
      <div className="leading-tight">
        <div className="text-xs text-slate-500">Practical digital solutions</div>
      </div>
    </div>
  );
}
