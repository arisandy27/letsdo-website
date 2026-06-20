import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

type InquiryNotificationPayload = {
  inquiryId: string;
  name: string;
  company: string;
  jobTitle: string;
  email: string;
  interestArea: string;
  message: string;
  sourcePage: string;
  sourceSection: string;
  referrer: string;
};

async function sendInquiryNotification(payload: InquiryNotificationPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const notifyTo = process.env.INQUIRY_NOTIFY_TO;
  const notifyFrom =
    process.env.INQUIRY_NOTIFY_FROM || "LetsDo Website <onboarding@resend.dev>";

  if (!apiKey || !notifyTo) {
    console.warn(
      "Inquiry email notification skipped: RESEND_API_KEY or INQUIRY_NOTIFY_TO is missing."
    );
    return;
  }

  const resend = new Resend(apiKey);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const adminUrl = siteUrl ? `${siteUrl}/admin/inquiries` : "/admin/inquiries";

  const subject = `[LetsDo Inquiry] ${payload.interestArea} - ${payload.company}`;

  const text = [
    "New Website Inquiry",
    "",
    `Inquiry ID: ${payload.inquiryId}`,
    `Name: ${payload.name}`,
    `Company: ${payload.company}`,
    `Job Title: ${payload.jobTitle || "-"}`,
    `Email: ${payload.email}`,
    `Interest Area: ${payload.interestArea}`,
    `Source: ${payload.sourcePage} / ${payload.sourceSection}`,
    `Referrer: ${payload.referrer || "-"}`,
    "",
    "Message:",
    payload.message || "-",
    "",
    `Admin page: ${adminUrl}`,
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
      <h2>New Website Inquiry</h2>
      <p>A new inquiry has been submitted from the Let's Do website.</p>

      <ul>
        <li><strong>Inquiry ID:</strong> ${escapeHtml(payload.inquiryId)}</li>
        <li><strong>Name:</strong> ${escapeHtml(payload.name)}</li>
        <li><strong>Company:</strong> ${escapeHtml(payload.company)}</li>
        <li><strong>Job Title:</strong> ${escapeHtml(payload.jobTitle || "-")}</li>
        <li><strong>Email:</strong> ${escapeHtml(payload.email)}</li>
        <li><strong>Interest Area:</strong> ${escapeHtml(payload.interestArea)}</li>
        <li><strong>Source:</strong> ${escapeHtml(
          `${payload.sourcePage} / ${payload.sourceSection}`
        )}</li>
        <li><strong>Referrer:</strong> ${escapeHtml(payload.referrer || "-")}</li>
      </ul>

      <h3>Message</h3>
      <p>${escapeHtml(payload.message || "-").replaceAll("\n", "<br />")}</p>

      <p>
        Admin page:
        <a href="${escapeHtml(adminUrl)}">${escapeHtml(adminUrl)}</a>
      </p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: notifyFrom,
    to: [notifyTo],
    replyTo: payload.email,
    subject,
    html,
    text,
  });

  if (error) {
    console.error("Inquiry email notification error:", error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = normalizeString(body.name);
    const company = normalizeString(body.company);
    const jobTitle = normalizeString(body.jobTitle);
    const email = normalizeString(body.email).toLowerCase();
    const interestArea = normalizeString(body.interestArea);
    const message = normalizeString(body.message);
    const sourcePage = normalizeString(body.sourcePage || "website");
    const sourceSection = normalizeString(body.sourceSection || "form");
    const referrer = normalizeString(body.referrer || "");

    if (!name || !company || !email || !interestArea) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "Invalid email format." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("website_inquiries")
      .insert([
        {
          name,
          company,
          job_title: jobTitle || null,
          email,
          interest_area: interestArea,
          message: message || null,
          source_page: sourcePage,
          source_section: sourceSection,
          referrer: referrer || null,
          status: "new",
        },
      ])
      .select("id")
      .single();

    if (error) {
      console.error("Insert inquiry error:", error);
      return NextResponse.json(
        { ok: false, error: "Failed to save inquiry." },
        { status: 500 }
      );
    }

    await sendInquiryNotification({
      inquiryId: data.id,
      name,
      company,
      jobTitle,
      email,
      interestArea,
      message,
      sourcePage,
      sourceSection,
      referrer,
    }).catch((emailError) => {
      console.error("Inquiry email notification unexpected error:", emailError);
    });

    return NextResponse.json({
      ok: true,
      inquiryId: data.id,
      message: "Inquiry submitted successfully.",
    });
  } catch (error) {
    console.error("Inquiry API error:", error);
    return NextResponse.json(
      { ok: false, error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
