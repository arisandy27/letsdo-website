"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";


type MocSummary = {
  request_no: string;
  title: string;
  company_name: string;
  site_name: string;
  department_name: string | null;
  status: string;
  priority: string;
  highest_risk_before: string | null;
  highest_risk_after: string | null;
  total_actions: number;
  verified_actions: number;
  workflow_status: string | null;
  final_decision: string | null;
  implementation_status: string | null;
  pssr_status: string | null;
  startup_authorization: string | null;
  closure_status: string | null;
  effectiveness_status: string | null;
};

type DashboardOverview = {
  total_moc: number;
  open_moc: number;
  closed_moc: number;
  moc_in_approval: number;
  moc_in_implementation: number;
  moc_in_pssr: number;
  high_priority_open_moc: number;
  moc_created_this_month: number;
  overdue_target_completion: number;
};

export default function Home() {
  const [email, setEmail] = useState("viewer.demo@letsdo.id");
  const [password, setPassword] = useState("Demo@123456");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [mocs, setMocs] = useState<MocSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);
    setMessage("");

    const { data: overviewData, error: overviewError } = await supabase
      .from("v_moc_dashboard_overview")
      .select("*")
      .single();

    if (overviewError) {
      setMessage(`Dashboard error: ${overviewError.message}`);
      setLoading(false);
      return;
    }

    const { data: mocData, error: mocError } = await supabase
      .from("v_moc_request_summary")
      .select("*")
      .order("request_no", { ascending: true });

    if (mocError) {
      setMessage(`MOC list error: ${mocError.message}`);
      setLoading(false);
      return;
    }

    setOverview(overviewData as DashboardOverview);
    setMocs((mocData || []) as MocSummary[]);
    setLoading(false);
  }

  async function checkSession() {
    const { data } = await supabase.auth.getUser();

    if (data.user?.email) {
      setUserEmail(data.user.email);
      await loadData();
    }
  }

  async function handleLogin() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(`Login failed: ${error.message}`);
      setLoading(false);
      return;
    }

    setUserEmail(data.user.email || null);
    await loadData();
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUserEmail(null);
    setOverview(null);
    setMocs([]);
    setMessage("");
  }

  useEffect(() => {
    checkSession();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 rounded-3xl bg-slate-950 px-8 py-7 text-white shadow-lg">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
            Lets Do..!
          </p>
          <h1 className="mt-2 text-3xl font-bold">MOC Manager Pro</h1>
          <p className="mt-2 max-w-3xl text-slate-300">
            Management of Change system for process safety, approval workflow,
            action tracking, implementation, PSSR, closure, and audit trail.
          </p>
        </div>

        {!userEmail ? (
          <section className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow">
  <h2 className="text-xl font-semibold">Login Demo</h2>
  <p className="mt-2 text-sm text-slate-500">
    Gunakan salah satu demo user yang sudah dibuat di Supabase Auth.
  </p>

  <label className="mt-5 block text-sm font-medium">Email</label>
  <input
    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />

  <label className="mt-4 block text-sm font-medium">Password</label>
  <input
    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
    type="password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
  />

  <button
    onClick={handleLogin}
    disabled={loading}
    className="mt-6 w-full rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
  >
    {loading ? "Loading..." : "Login"}
  </button>

  {message && (
    <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
      {message}
    </p>
  )}

  <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
    <p className="font-semibold text-slate-900">Demo login:</p>
    <p>viewer.demo@letsdo.id</p>
    <p>requestor.demo@letsdo.id</p>
    <p>approver.demo@letsdo.id</p>
    <p>demo@letsdo.id</p>
    <p className="mt-2">Password: Demo@123456</p>
  </div>
</section>
        ) : (
          <section>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Logged in as</p>
                <h2 className="text-xl font-semibold">{userEmail}</h2>
              </div>

              <div className="flex flex-wrap gap-3">
              {(userEmail === "demo@letsdo.id" ||
  userEmail === "requestor.demo@letsdo.id" ||
  ["company_admin", "plant_manager", "moc_requestor", "requestor"].includes(
    currentProfile?.app_role
  )) && (
  <Link
    href="/moc/new"
    className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
  >
    + Create New MOC
  </Link>
)}

                <button
                  onClick={handleLogout}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-medium hover:bg-slate-50"
                >
                  Logout
                </button>
              </div>
            </div>

            {message && (
              <p className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {message}
              </p>
            )}

           {overview && (
  <div className="mb-6 space-y-4">
    <div className="grid gap-4 md:grid-cols-4">
      <DashboardCard label="Total MOC" value={overview.total_moc} />
      <DashboardCard label="Open MOC" value={overview.open_moc} />
      <DashboardCard label="Closed MOC" value={overview.closed_moc} />
      <DashboardCard
        label="High Priority Open"
        value={overview.high_priority_open_moc}
      />
    </div>

    <div className="grid gap-4 md:grid-cols-4">
      <MiniKpi label="In Approval" value={overview.moc_in_approval} />
      <MiniKpi
        label="In Implementation"
        value={overview.moc_in_implementation}
      />
      <MiniKpi label="In PSSR" value={overview.moc_in_pssr} />
      <MiniKpi
        label="Created This Month"
        value={overview.moc_created_this_month}
      />
    </div>
  </div>
)}

            <div className="rounded-3xl bg-white p-6 shadow">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">
                    MOC Request Summary
                  </h3>
                  <p className="text-sm text-slate-500">
                    Data diambil dari Supabase view v_moc_request_summary.
                  </p>
                </div>

                <button
                  onClick={loadData}
                  className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Refresh
                </button>
              </div>

              <div className="grid gap-4">
  {mocs.map((moc) => (
    <div
      key={moc.request_no}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            {moc.request_no}
          </p>
          <h4 className="mt-1 text-lg font-bold text-slate-950">
            {moc.title}
          </h4>
          <p className="mt-2 text-sm text-slate-500">
            Priority: <span className="font-semibold">{formatStatus(moc.priority)}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge text={moc.status} />

          <Link
            href={"/moc/" + encodeURIComponent(moc.request_no)}
            className="inline-flex whitespace-nowrap rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            View Detail
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <MiniInfo label="Risk Before" value={moc.highest_risk_before || "-"} />
        <MiniInfo label="Risk After" value={moc.highest_risk_after || "-"} />
        <MiniInfo
          label="Actions"
          value={`${moc.verified_actions}/${moc.total_actions} verified`}
        />
        <MiniInfo label="Approval" value={moc.final_decision || "-"} />
        <MiniInfo
          label="Implementation"
          value={moc.implementation_status || "-"}
        />
        <MiniInfo label="PSSR" value={moc.pssr_status || "-"} />
        <MiniInfo label="Closure" value={moc.closure_status || "-"} />
        <MiniInfo label="Company" value={moc.company_name || "-"} />
      </div>
    </div>
  ))}
</div>

              {mocs.length === 0 && !loading && (
                <p className="py-8 text-center text-slate-500">
                  No MOC data visible for this user.
                </p>
              )}

              {loading && (
                <p className="py-8 text-center text-slate-500">Loading...</p>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">
        {formatStatus(value)}
      </p>
    </div>
  );
}
function MiniKpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}
function DashboardCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950">
            {value}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
          KPI
        </div>
      </div>
    </div>
  );
}
function Badge({ text }: { text: string }) {
  return (
    <span className="inline-flex whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
      {formatStatus(text)}
    </span>
  );
}

function formatStatus(value: string | null | undefined) {
  if (!value) return "-";

  return value
    .replaceAll("_", " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}