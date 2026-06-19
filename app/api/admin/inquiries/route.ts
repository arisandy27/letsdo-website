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

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("x-admin-key");
    const expectedKey = process.env.LETSDO_ADMIN_KEY;

    if (!expectedKey || authHeader !== expectedKey) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = Number(searchParams.get("limit") || 50);

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("website_inquiries")
      .select("id, created_at, name, company, job_title, email, interest_area, message, source_page, source_section, status, is_read")
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
