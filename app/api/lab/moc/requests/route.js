import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase URL or service role key");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function normalizeMoc(row) {
  return {
    id: row.id,
    requestNo:
      row.request_no ||
      row.requestNo ||
      row.request_number ||
      row.moc_no ||
      row.id,
    title:
      row.title ||
      row.moc_title ||
      row.change_title ||
      row.description ||
      "Untitled MOC",
    status: row.status || row.workflow_status || row.current_status || "Draft",
    priority: row.priority || row.risk_priority || row.urgency || "-",
    riskBefore: row.risk_before || row.risk_before_level || row.initial_risk || "-",
    riskAfter: row.risk_after || row.risk_after_level || row.residual_risk || "-",
    requester: row.requester || row.requested_by || row.created_by || "-",
    createdAt: row.created_at || row.createdAt || null,
  };
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("moc_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    const items = (data || []).map(normalizeMoc);

    const total = items.length;
    const closed = items.filter((item) =>
      String(item.status).toLowerCase().includes("closed")
    ).length;
    const highPriority = items.filter((item) =>
      ["high", "critical", "urgent"].some((word) =>
        String(item.priority).toLowerCase().includes(word)
      )
    ).length;

    return NextResponse.json({
      ok: true,
      total,
      open: total - closed,
      closed,
      highPriority,
      items,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Unexpected error",
      },
      { status: 500 }
    );
  }
}