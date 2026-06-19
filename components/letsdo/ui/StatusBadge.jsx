export default function StatusBadge({ status }) {
  const className =
    status === "Demo Ready"
      ? "bg-emerald-50 text-emerald-700"
      : status === "Available for Pilot"
        ? "bg-sky-50 text-sky-700"
        : "bg-amber-50 text-amber-700";

  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${className}`}>{status}</span>;
}