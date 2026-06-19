export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white px-8 py-6 text-center shadow-sm">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
        <div className="mt-4 text-sm font-medium text-slate-700">Loading...</div>
      </div>
    </div>
  );
}
