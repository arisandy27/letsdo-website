"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/letsdo/homepage/Header";
import FooterSection from "@/components/letsdo/homepage/FooterSection";
import SectionHeading from "@/components/letsdo/ui/SectionHeading";

export default function ReadinessCheckPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: "",
    company: "",
    jobTitle: "",
    email: "",
    whatsapp: "",
    area: "",
    currentMethod: "",
    mainProblem: "",
    firstImprovement: "",
    challenge: "",
    wantsDemo: "",
  });

  const [submitState, setSubmitState] = useState({
    status: "idle",
    message: "",
  });

  const updateField = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.fullName || !formData.company || !formData.email || !formData.area) {
      setSubmitState({
        status: "error",
        message: "Please complete all required fields.",
      });
      return;
    }

    try {
      setSubmitState({
        status: "loading",
        message: "Sending your readiness check...",
      });

      const messageLines = [
        `WhatsApp: ${formData.whatsapp || "-"}`,
        `Current method: ${formData.currentMethod || "-"}`,
        `Main problem: ${formData.mainProblem || "-"}`,
        `First improvement: ${formData.firstImprovement || "-"}`,
        `Challenge: ${formData.challenge || "-"}`,
        `Wants demo: ${formData.wantsDemo || "-"}`,
      ];

      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.fullName,
          company: formData.company,
          jobTitle: formData.jobTitle,
          email: formData.email,
          interestArea: formData.area,
          message: messageLines.join("\n"),
          sourcePage: "readiness_check",
          sourceSection: "readiness_form",
          referrer: typeof window !== "undefined" ? document.referrer : "",
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setSubmitState({
          status: "error",
          message: result.error || "Failed to send readiness check.",
        });
        return;
      }

      router.push("/thank-you");
    } catch (error) {
      console.error(error);
      setSubmitState({
        status: "error",
        message: "Unexpected error. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
            <div className="max-w-3xl">
              <div className="text-sm font-medium text-teal-700">Free Readiness Check</div>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Find the most practical starting point to digitize your workflow
              </h1>
              <p className="mt-6 text-base leading-8 text-slate-600">
                Not sure where to begin? Lets start with a simple readiness check.
                We help identify which manual process is most suitable to digitize first
                based on your current workflow, pain points, and priorities.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
            <SectionHeading
              eyebrow="Why this matters"
              title="Why start with a readiness check"
              description="A readiness check helps clarify the current situation, identify workflow gaps, and determine the most practical first step."
              align="center"
            />

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                ["See where the gaps are", "Understand where manual processes are slowing work down."],
                ["Prioritize what matters most", "Focus on the workflow with the best practical impact."],
                ["Start with a realistic scope", "Avoid overbuilding and begin with something manageable."],
              ].map(([title, desc]) => (
                <div key={title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                  <div className="text-lg font-semibold text-slate-900">{title}</div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <SectionHeading
                eyebrow="Readiness form"
                title="Tell us about your current workflow"
                description="Share a few details so we can identify the most practical place to start."
              />
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <form className="grid gap-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    value={formData.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
                    placeholder="Full name *"
                  />
                  <input
                    value={formData.company}
                    onChange={(e) => updateField("company", e.target.value)}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
                    placeholder="Company *"
                  />
                  <input
                    value={formData.jobTitle}
                    onChange={(e) => updateField("jobTitle", e.target.value)}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
                    placeholder="Job title"
                  />
                  <input
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
                    placeholder="Email *"
                  />
                  <input
                    value={formData.whatsapp}
                    onChange={(e) => updateField("whatsapp", e.target.value)}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none sm:col-span-2"
                    placeholder="WhatsApp number"
                  />

                  <select
                    value={formData.area}
                    onChange={(e) => updateField("area", e.target.value)}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-600 outline-none sm:col-span-2"
                  >
                    <option value="">Which area do you want to improve? *</option>
                    <option value="sds_msds">SDS / MSDS</option>
                    <option value="moc">MOC</option>
                    <option value="fire_maintenance">Fire Maintenance</option>
                    <option value="permit_to_work">Permit to Work</option>
                    <option value="inspection_action_tracking">Inspection / Action Tracking</option>
                    <option value="oee_operations_dashboard">OEE / Operations Dashboard</option>
                    <option value="custom_workflow_tool">Custom Workflow Tool</option>
                  </select>

                  <select
                    value={formData.currentMethod}
                    onChange={(e) => updateField("currentMethod", e.target.value)}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-600 outline-none sm:col-span-2"
                  >
                    <option value="">How is the process currently managed?</option>
                    <option value="excel">Excel</option>
                    <option value="paper_forms">Paper forms</option>
                    <option value="shared_folders_pdf">Shared folders / PDF</option>
                    <option value="whatsapp_chat">WhatsApp / chat follow-up</option>
                    <option value="existing_software">Existing software</option>
                    <option value="mixed">Mixed / combination</option>
                  </select>

                  <select
                    value={formData.mainProblem}
                    onChange={(e) => updateField("mainProblem", e.target.value)}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-600 outline-none sm:col-span-2"
                  >
                    <option value="">What is the main problem you face?</option>
                    <option value="difficult_tracking">Difficult tracking</option>
                    <option value="slow_reporting">Slow reporting</option>
                    <option value="scattered_data">Scattered data</option>
                    <option value="poor_follow_up">Poor follow-up</option>
                    <option value="audit_compliance_difficulty">Audit / compliance difficulty</option>
                    <option value="lack_of_visibility">Lack of visibility</option>
                  </select>

                  <select
                    value={formData.firstImprovement}
                    onChange={(e) => updateField("firstImprovement", e.target.value)}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-600 outline-none sm:col-span-2"
                  >
                    <option value="">What do you want to improve first?</option>
                    <option value="visibility">Visibility</option>
                    <option value="control">Control</option>
                    <option value="reporting">Reporting</option>
                    <option value="follow_up">Follow-up</option>
                    <option value="approval_flow">Approval flow</option>
                    <option value="documentation">Documentation</option>
                    <option value="compliance">Compliance</option>
                  </select>

                  <textarea
                    value={formData.challenge}
                    onChange={(e) => updateField("challenge", e.target.value)}
                    className="min-h-[140px] rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none sm:col-span-2"
                    placeholder="Short description of your current challenge"
                  />

                  <select
                    value={formData.wantsDemo}
                    onChange={(e) => updateField("wantsDemo", e.target.value)}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-600 outline-none sm:col-span-2"
                  >
                    <option value="">Would you like a demo or discussion after the assessment?</option>
                    <option value="yes">Yes</option>
                    <option value="not_now">Not now</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="mt-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={submitState.status === "loading"}
                >
                  {submitState.status === "loading" ? "Sending..." : "Submit Readiness Check"}
                </button>

                {submitState.status === "error" ? (
                  <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {submitState.message}
                  </div>
                ) : null}

                <p className="text-xs leading-6 text-slate-500">
                  This is not a hard sales step. The purpose is to help identify where
                  digitalization can start in a practical way.
                </p>
              </form>
            </div>
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
}
