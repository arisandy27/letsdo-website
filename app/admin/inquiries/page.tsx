"use client";

import { useEffect, useMemo, useState } from "react";

type Inquiry = {
  id: string;
  created_at: string;
  name: string;
  company: string;
  job_title?: string | null;
  email: string;
  interest_area: string;
  message?: string | null;
  source_page: string;
  source_section: string;
  status: string;
  is_read: boolean;
  notes?: string | null;
};

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function InquiryCard({
  inquiry,
  adminKey,
  onStatusUpdated,
}: {
  inquiry: Inquiry;
  adminKey: string;
  onStatusUpdated?: () => void;
}) {
  const [status, setStatus] = useState(inquiry.status || "new");
  const [notes, setNotes] = useState(inquiry.notes || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const saveStatus = async () => {
    try {
      setSaving(true);
      setMessage("");

      const response = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          inquiryId: inquiry.id,
          status,
          notes,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setMessage(result.error || "Failed to update inquiry.");
        return;
      }

      setMessage("Inquiry updated.");
      onStatusUpdated?.();
    } catch (error) {
      console.error(error);
      setMessage("Unexpected error while updating.");
    } finally {
      setSaving(false);
    }
  };

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

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          Internal Notes
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-3 min-h-[110px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
          placeholder="Add internal follow-up notes here..."
        />
      </div>

      <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1fr_140px]">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700 outline-none"
        >
          <option value="new">New</option>
          <option value="reviewed">Reviewed</option>
          <option value="contacted">Contacted</option>
          <option value="closed">Closed</option>
        </select>

        <button
          type="button"
          onClick={saveStatus}
          disabled={saving}
          className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 disabled:opacity-70"
        >
          {saving ? "Saving..." : "Update"}
        </button>
      </div>

      {message ? (
        <div className="mt-3 text-xs text-slate-500">{message}</div>
      ) : null}

      <div className="mt-4 text-xs text-slate-500">Submitted: {formatDate(inquiry.created_at)}</div>
    </div>
  );
}

export default function AdminInquiriesPage() {
  const [adminKey, setAdminKey] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);

  const filteredInquiries = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    if (!q) return inquiries;

    return inquiries.filter((inquiry) => {
      const haystack = [
        inquiry.name,
        inquiry.company,
        inquiry.email,
        inquiry.job_title || "",
        inquiry.interest_area,
        inquiry.message || "",
        inquiry.notes || "",
        inquiry.source_page,
        inquiry.source_section,
        inquiry.status,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [inquiries, searchTerm]);

  const totalLoaded = useMemo(() => inquiries.length, [inquiries]);
  const totalShown = useMemo(() => filteredInquiries.length, [filteredInquiries]);

  const loadInquiries = async (): Promise<void> => {
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
            Showing <span className="font-semibold text-slate-950">{totalShown}</span> of{" "}
            <span className="font-semibold text-slate-950">{totalLoaded}</span>
          </div>
        </div>

        <div className="mt-8 grid gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[1fr_220px_1fr_160px]">
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

          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
            placeholder="Search name, company, email, interest..."
          />

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
          {filteredInquiries.length === 0 && !loading ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
              No inquiries found.
            </div>
          ) : null}

          {filteredInquiries.map((inquiry) => (
            <InquiryCard
              key={inquiry.id}
              inquiry={inquiry}
              adminKey={adminKey}
              onStatusUpdated={loadInquiries}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
