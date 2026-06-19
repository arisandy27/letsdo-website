import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
