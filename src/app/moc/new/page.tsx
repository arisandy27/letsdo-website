"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  app_role: string;
  company_id: string;
  site_id: string;
  department_id: string | null;
};

type Company = {
  id: string;
  company_name: string;
};

type Site = {
  id: string;
  site_name: string;
  company_id: string;
};

type Department = {
  id: string;
  department_name: string;
  site_id: string;
};

type Area = {
  id: string;
  area_name: string;
  site_id: string;
  department_id: string | null;
};

export default function CreateMocPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [canCreate, setCanCreate] = useState(false);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);

  const [companyId, setCompanyId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [areaId, setAreaId] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [changeType, setChangeType] = useState("permanent");
  const [changeCategory, setChangeCategory] = useState("process");
 const [priority, setPriority] = useState("medium");
const [area, setArea] = useState("reactor_area");
  const [reasonForChange, setReasonForChange] = useState("");
  const [expectedBenefit, setExpectedBenefit] = useState("");
  const [currentCondition, setCurrentCondition] = useState("");
  const [proposedChange, setProposedChange] = useState("");
  const [targetStartDate, setTargetStartDate] = useState("");
  const [targetCompletionDate, setTargetCompletionDate] = useState("");


  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function loadInitialData() {
    setLoading(true);
    setMessage("");

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setMessage("You are not logged in.");
      setLoading(false);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("users_profile")
      .select("*")
      .eq("auth_user_id", userData.user.id)
      .single();

    if (profileError) {
      setMessage(`Profile error: ${profileError.message}`);
      setLoading(false);
      return;
    }

    const userProfile = profileData as UserProfile;
    setProfile(userProfile);

    const { data: permissionData, error: permissionError } = await supabase
      .from("moc_role_permissions")
      .select("can_create")
      .eq("app_role", userProfile.app_role)
      .eq("module_name", "moc_request")
      .single();

    if (permissionError) {
      setMessage(`Permission error: ${permissionError.message}`);
      setLoading(false);
      return;
    }

    const allowed = Boolean(permissionData?.can_create);
    setCanCreate(allowed);

    if (!allowed) {
      setLoading(false);
      return;
    }

    const { data: companyData, error: companyError } = await supabase
      .from("companies")
      .select("id, company_name")
      .order("company_name");

    if (companyError) {
      setMessage(`Company error: ${companyError.message}`);
      setLoading(false);
      return;
    }

    const { data: siteData, error: siteError } = await supabase
      .from("sites")
      .select("id, site_name, company_id")
      .order("site_name");

    if (siteError) {
      setMessage(`Site error: ${siteError.message}`);
      setLoading(false);
      return;
    }

    const { data: departmentData, error: departmentError } = await supabase
      .from("departments")
      .select("id, department_name, site_id")
      .order("department_name");

    if (departmentError) {
      setMessage(`Department error: ${departmentError.message}`);
      setLoading(false);
      return;
    }

    const { data: areaData, error: areaError } = await supabase
      .from("areas")
      .select("id, area_name, site_id, department_id")
      .order("area_name");

    if (areaError) {
      setMessage(`Area error: ${areaError.message}`);
      setLoading(false);
      return;
    }

    setCompanies((companyData || []) as Company[]);
    setSites((siteData || []) as Site[]);
    setDepartments((departmentData || []) as Department[]);
    setAreas((areaData || []) as Area[]);

    setCompanyId(userProfile.company_id || companyData?.[0]?.id || "");
    setSiteId(userProfile.site_id || siteData?.[0]?.id || "");
    setDepartmentId(userProfile.department_id || departmentData?.[0]?.id || "");
    setAreaId((areaData || [])[0]?.id || "");

    setLoading(false);
  }

  function generateRequestNo() {
    const year = new Date().getFullYear();
    const compactTime = Date.now().toString().slice(-6);
    return `MOC-${year}-${compactTime}`;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!profile) {
      setMessage("Profile not found.");
      return;
    }

    if (!canCreate) {
      setMessage("You do not have permission to create MOC.");
      return;
    }

    if (!title.trim() || !description.trim()) {
      setMessage("Title and description are required.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    const requestNo = generateRequestNo();

    const { error } = await supabase.from("moc_requests").insert({
      company_id: companyId,
      site_id: siteId,
      department_id: departmentId || null,
      area_id: areaId || null,
      request_no: requestNo,
      title,
      description,
      requested_by: profile.id,
      change_type: changeType,
      change_category: changeCategory,
      reason_for_change: reasonForChange || null,
      expected_benefit: expectedBenefit || null,
      current_condition: currentCondition || null,
      proposed_change: proposedChange || null,
      target_start_date: targetStartDate || null,
      target_completion_date: targetCompletionDate || null,
      status: "draft",
      priority,
    });

    if (error) {
      setMessage(`Create MOC failed: ${error.message}`);
      setSubmitting(false);
      return;
    }

    router.push(`/moc/${encodeURIComponent(requestNo)}`);
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  const filteredSites = sites.filter((site) => site.company_id === companyId);
  const filteredDepartments = departments.filter((dept) => dept.site_id === siteId);
  const filteredAreas = areas.filter((area) => area.site_id === siteId);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <section className="mb-6 rounded-3xl bg-slate-950 px-8 py-7 text-white shadow-lg">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
            Lets Do..!
          </p>
          <h1 className="mt-2 text-3xl font-bold">Create New MOC</h1>
          <p className="mt-2 max-w-3xl text-slate-300">
            Submit a new Management of Change request for screening,
            classification, risk review, approval, implementation, and closure.
          </p>
        </section>

        {loading && (
          <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow">
            Loading form...
          </div>
        )}

        {!loading && !canCreate && (
          <div className="rounded-3xl bg-white p-8 shadow">
            <h2 className="text-xl font-semibold">Read-only access</h2>
            <p className="mt-2 text-slate-600">
              Your current role does not have permission to create a new MOC.
            </p>
            <p className="mt-4 text-sm text-slate-500">
              Logged in as: {profile?.email} / {profile?.app_role}
            </p>
          </div>
        )}

        {!loading && canCreate && (
          <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 shadow">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">MOC Request Form</h2>
              <p className="mt-1 text-sm text-slate-500">
                Logged in as {profile?.full_name} / {profile?.app_role}
              </p>
            </div>

            {message && (
              <p className="mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {message}
              </p>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <SelectField
                label="Company"
                value={companyId}
                onChange={setCompanyId}
                options={companies.map((item) => ({
                  value: item.id,
                  label: item.company_name,
                }))}
              />

              <SelectField
                label="Site"
                value={siteId}
                onChange={setSiteId}
                options={filteredSites.map((item) => ({
                  value: item.id,
                  label: item.site_name,
                }))}
              />

              <SelectField
                label="Department"
                value={departmentId}
                onChange={setDepartmentId}
                options={filteredDepartments.map((item) => ({
                  value: item.id,
                  label: item.department_name,
                }))}
              />

              <SelectField
  label="Area"
  value={areaId}
  onChange={setAreaId}
  options={filteredAreas.map((area) => ({
    value: area.id,
    label: area.area_name,
  }))}
/>

              <SelectField
                label="Change Type"
                value={changeType}
                onChange={setChangeType}
                options={[
                  { value: "permanent", label: "Permanent" },
                  { value: "temporary", label: "Temporary" },
                  { value: "emergency", label: "Emergency" },
                ]}
              />

              <SelectField
                label="Change Category"
                value={changeCategory}
                onChange={setChangeCategory}
                options={[
                  { value: "process", label: "Process" },
                  { value: "equipment", label: "Equipment" },
                  { value: "chemical", label: "Chemical" },
                  { value: "procedure", label: "Procedure" },
                  { value: "organization", label: "Organization" },
                  { value: "facility", label: "Facility" },
                  { value: "software", label: "Software" },
                  { value: "other", label: "Other" },
                ]}
              />

              <SelectField
  label="Priority"
  value={priority}
  onChange={setPriority}
  options={[
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "critical", label: "Critical" },
  ]}
/>

              <TextField
                label="Target Start Date"
                type="date"
                value={targetStartDate}
                onChange={setTargetStartDate}
              />

              <TextField
                label="Target Completion Date"
                type="date"
                value={targetCompletionDate}
                onChange={setTargetCompletionDate}
              />

              <div className="md:col-span-2">
                <TextField
                  label="Title"
                  value={title}
                  onChange={setTitle}
                  placeholder="Example: Change of reactor temperature control setpoint"
                />
              </div>

              <div className="md:col-span-2">
                <TextArea
                  label="Description"
                  value={description}
                  onChange={setDescription}
                  placeholder="Describe the proposed change clearly."
                />
              </div>

              <TextArea
                label="Reason for Change"
                value={reasonForChange}
                onChange={setReasonForChange}
              />

              <TextArea
                label="Expected Benefit"
                value={expectedBenefit}
                onChange={setExpectedBenefit}
              />

              <TextArea
                label="Current Condition"
                value={currentCondition}
                onChange={setCurrentCondition}
              />

              <TextArea
                label="Proposed Change"
                value={proposedChange}
                onChange={setProposedChange}
              />
            </div>

            <div className="mt-8 flex flex-wrap justify-end gap-3">
              <Link
                href="/"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold hover:bg-slate-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Create MOC"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-600">{label}</span>
      <input
        type={type}
        className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-600">{label}</span>
      <textarea
        className="mt-2 min-h-28 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-600">{label}</span>
      <select
        className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}