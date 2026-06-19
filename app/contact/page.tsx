"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/letsdo/homepage/Header";
import FooterSection from "@/components/letsdo/homepage/FooterSection";
import SectionHeading from "@/components/letsdo/ui/SectionHeading";
import ContactCard from "@/components/letsdo/ui/ContactCard";
import { Mail, MessageCircle, Link2 } from "lucide-react";
import { SITE_CONTACT } from "@/lib/letsdo-site";

export default function ContactPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    jobTitle: "",
    email: "",
    interestArea: "",
    message: "",
  });

  const [submitState, setSubmitState] = useState({
    status: "idle",
    message: "",
  });

  const updateField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name || !formData.company || !formData.email || !formData.interestArea) {
      setSubmitState({
        status: "error",
        message: "Please complete all required fields.",
      });
      return;
    }

    try {
      setSubmitState({
        status: "loading",
        message: "Sending your inquiry...",
      });

      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          company: formData.company,
          jobTitle: formData.jobTitle,
          email: formData.email,
          interestArea: formData.interestArea,
          message: formData.message,
          sourcePage: "contact",
          sourceSection: "contact_form",
          referrer: typeof window !== "undefined" ? document.referrer : "",
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setSubmitState({
          status: "error",
          message: result.error || "Failed to send inquiry.",
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
              <div className="text-sm font-medium text-teal-700">Contact</div>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Lets discuss your workflow, challenge, or digitalization need
              </h1>
              <p className="mt-6 text-base leading-8 text-slate-600">
                Whether you are exploring a new idea, improving an existing process,
                or looking for a practical digital solution, we would be glad to hear from you.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <SectionHeading
                eyebrow="Get in touch"
                title="Let us start from your current workflow"
                description="You can contact us directly or send a short inquiry through the form."
              />

              <div className="mt-8 space-y-4">
                <ContactCard
                  href={`mailto:${SITE_CONTACT.email}`}
                  title="Email"
                  value={SITE_CONTACT.email}
                  icon={Mail}
                  eventName="cta_email_click"
                  sectionName="contact"
                  pageName="contact"
                />

                <ContactCard
                  href={SITE_CONTACT.whatsappUrl}
                  title="WhatsApp"
                  value={SITE_CONTACT.whatsappLabel}
                  icon={MessageCircle}
                  eventName="cta_whatsapp_click"
                  sectionName="contact"
                  pageName="contact"
                />

                <ContactCard
                  href={SITE_CONTACT.linkedinUrl}
                  title="LinkedIn"
                  value={SITE_CONTACT.linkedinLabel}
                  icon={Link2}
                  eventName="linkedin_click"
                  sectionName="contact"
                  pageName="contact"
                />
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="text-lg font-semibold text-slate-950">Send an inquiry</div>
              <div className="mt-2 text-sm text-slate-500">
                Share a few details and we will get back to you.
              </div>

              <form className="mt-8" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
                    placeholder="Name *"
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

                  <select
                    value={formData.interestArea}
                    onChange={(e) => updateField("interestArea", e.target.value)}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-600 outline-none sm:col-span-2"
                  >
                    <option value="">Area of interest *</option>
                    <option value="msds_toolkit_pro">MSDS Toolkit Pro</option>
                    <option value="moc_manager_pro">MOC Manager Pro</option>
                    <option value="fire_maintenance_pro">Fire Maintenance Pro</option>
                    <option value="e_permit">E-Permit / PTW</option>
                    <option value="oee_toolkit">OEE / Dashboard</option>
                    <option value="custom_web_app">Custom Web App</option>
                  </select>

                  <textarea
                    value={formData.message}
                    onChange={(e) => updateField("message", e.target.value)}
                    className="min-h-[140px] rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none sm:col-span-2"
                    placeholder="Tell us briefly about your workflow or project need"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-6 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={submitState.status === "loading"}
                >
                  {submitState.status === "loading" ? "Sending..." : "Send Inquiry"}
                </button>

                {submitState.status === "error" ? (
                  <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {submitState.message}
                  </div>
                ) : null}

                <p className="mt-4 text-xs leading-6 text-slate-500">
                  We believe digitalization works best when it starts from real needs and practical scope.
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
