"use client";

import { useEffect, useMemo, useState } from "react";

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function InquiryCard({ inquiry }: { inquiry: any }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-lg font-semibold text-slate-950">{inquiry.name}</div>
          <div className="mt-1 text-sm text-slate-500">{inquiry.company}</div>
        </div>
        <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          {inquiry.status}
        </div>
      </div>

      <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
        <div>
          <span className="font-medium text-slate-900">Email:</span> {inquiry.email}
        </div>
        <div>
          <span className="font-medium text-slate-900">Interest:</span> {inquiry.interest_area}
        </div>
        <div>
          <span className="font-medium text-slate-900">Job title:</span> {inquiry.job_title || "-"}
        </div>
        <div>
          <span className="font-medium text-slate-900">Source:</span> {inquiry.source_page} / {inquiry.source_section}
        </div>
      </div>

      <div className="mt-5 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
        {inquiry.message || "No additional message."}
      </div>

      <div className="mt-4 text-xs text-slate-500">Submitted: {formatDate(inquiry.created_at)}</div>
    </div>
  );
}

export default function AdminInquiriesPage() {
  const [adminKey, setAdminKey] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inquiries, setInquiries] = useState<any[]>([]);

  const total = useMemo(() => inquiries.length, [inquiries]);

  const loadInquiries = async () => {
    if (!adminKey) {
      setError("Please enter admin key.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const url = statusFilter
        ? `/api/admin/inquiries?status=${encodeURIComponent(statusFilter)}`
        : "/api/admin/inquiries";

      const response = await fetch(url, {
        headers: {
          "x-admin-key": adminKey,
        },
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setError(result.error || "Failed to load inquiries.");
        setInquiries([]);
        return;
      }

      setInquiries(result.inquiries || []);
    } catch (err) {
      console.error(err);
      setError("Unexpected error while loading inquiries.");
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!adminKey) return;
    loadInquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm font-medium text-teal-700">Internal Admin</div>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
              Website inquiries
            </h1>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Simple dashboard to review inquiry submissions from the Lets Do website.
            </p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
            Total shown: <span className="font-semibold text-slate-950">{total}</span>
          </div>
        </div>

        <div className="mt-8 grid gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[1fr_220px_160px]">
          <input
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
            placeholder="Enter admin key"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-600 outline-none"
          >
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="reviewed">Reviewed</option>
            <option value="contacted">Contacted</option>
            <option value="closed">Closed</option>
          </select>

          <button
            type="button"
            onClick={loadInquiries}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 disabled:opacity-70"
            disabled={loading}
          >
            {loading ? "Loading..." : "Load inquiries"}
          </button>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6">
          {inquiries.length === 0 && !loading ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
              No inquiries loaded.
            </div>
          ) : null}

          {inquiries.map((inquiry) => (
            <InquiryCard key={inquiry.id} inquiry={inquiry} />
          ))}
        </div>
      </div>
    </div>
  );
}
