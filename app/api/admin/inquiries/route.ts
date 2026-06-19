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

function getAdminKey(request: Request) {
  return request.headers.get("x-admin-key");
}

function isAuthorized(request: Request) {
  const expectedKey = process.env.LETSDO_ADMIN_KEY;
  const authHeader = getAdminKey(request);
  return !!expectedKey && authHeader === expectedKey;
}

export async function GET(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = Number(searchParams.get("limit") || 50);

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("website_inquiries")
      .select("id, created_at, name, company, job_title, email, interest_area, message, source_page, source_section, status, is_read, notes")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Fetch admin inquiries error:", error);
      return NextResponse.json({ ok: false, error: "Failed to load inquiries." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, inquiries: data || [] });
  } catch (error) {
    console.error("Admin inquiries API error:", error);
    return NextResponse.json({ ok: false, error: "Unexpected server error." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const inquiryId = typeof body.inquiryId === "string" ? body.inquiryId : "";
    const status = typeof body.status === "string" ? body.status : "";
    const notes = typeof body.notes === "string" ? body.notes.trim() : "";
    const allowed = ["new", "reviewed", "contacted", "closed"];

    if (!inquiryId || !allowed.includes(status)) {
      return NextResponse.json({ ok: false, error: "Invalid payload." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from("website_inquiries")
      .update({
        status,
        is_read: status !== "new",
        notes: notes || null,
      })
      .eq("id", inquiryId);

    if (error) {
      console.error("Update inquiry status/notes error:", error);
      return NextResponse.json({ ok: false, error: "Failed to update inquiry." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Inquiry updated." });
  } catch (error) {
    console.error("Admin inquiry PATCH error:", error);
    return NextResponse.json({ ok: false, error: "Unexpected server error." }, { status: 500 });
  }
}
