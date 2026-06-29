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

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

async function safeList(supabase, table, mocRequestId, orderColumn = "created_at", ascending = true) {
  let query = supabase.from(table).select("*").eq("moc_request_id", mocRequestId);

  if (orderColumn) {
    query = query.order(orderColumn, { ascending });
  }

  const { data, error } = await query;

  return {
    data: data || [],
    error: error ? error.message : null,
  };
}

async function safeSingleById(supabase, table, id, columns = "*") {
  if (!id) return null;

  const { data } = await supabase
    .from(table)
    .select(columns)
    .eq("id", id)
    .maybeSingle();

  return data || null;
}

export async function GET(request, context) {
  try {
    const params = await context.params;
    const requestNo = decodeURIComponent(params.requestNo);
    const supabase = getSupabaseAdmin();

    let { data: mocRequest, error: requestError } = await supabase
      .from("moc_requests")
      .select("*")
      .ilike("request_no", requestNo)
      .maybeSingle();

    if (!mocRequest && isUuid(requestNo)) {
      const fallback = await supabase
        .from("moc_requests")
        .select("*")
        .eq("id", requestNo)
        .maybeSingle();

      mocRequest = fallback.data;
      requestError = fallback.error;
    }

    if (requestError) {
      return NextResponse.json(
        { ok: false, error: requestError.message },
        { status: 500 }
      );
    }

    if (!mocRequest) {
      return NextResponse.json(
        { ok: false, error: "MOC request not found" },
        { status: 404 }
      );
    }

    const company = await safeSingleById(
      supabase,
      "companies",
      mocRequest.company_id,
      "id, company_name, company_code"
    );

    const site = await safeSingleById(
      supabase,
      "sites",
      mocRequest.site_id,
      "id, site_name, site_code, city"
    );

    const [
      screeningOld,
      screeningNew,
      classification,
      impactReviews,
      actions,
      requiredDocuments,
      actionAttachments,
      approvalWorkflows,
      approvalSteps,
      implementationRequirements,
      pssrReviews,
      pssrChecklistItems,
      closureRequirements,
      auditEvents,
    ] = await Promise.all([
      safeList(supabase, "moc_screening", mocRequest.id),
      safeList(supabase, "moc_screenings", mocRequest.id),
      safeList(supabase, "moc_classification", mocRequest.id),
      safeList(supabase, "moc_impact_reviews", mocRequest.id, "created_at", true),
      safeList(supabase, "moc_actions", mocRequest.id, "created_at", true),
      safeList(supabase, "moc_action_required_documents", mocRequest.id, "created_at", true),
      safeList(supabase, "moc_action_attachments", mocRequest.id, "uploaded_at", false),
      safeList(supabase, "moc_approval_workflows", mocRequest.id, "created_at", true),
      safeList(supabase, "moc_approval_steps", mocRequest.id, "step_no", true),
      safeList(supabase, "moc_implementation_requirements", mocRequest.id, "created_at", true),
      safeList(supabase, "moc_pssr_reviews", mocRequest.id, "created_at", true),
      safeList(supabase, "moc_pssr_checklist_items", mocRequest.id, "created_at", true),
      safeList(supabase, "moc_closure_requirements", mocRequest.id, "created_at", true),
      safeList(supabase, "moc_audit_events", mocRequest.id, "created_at", false),
    ]);

    const errors = [
      screeningOld.error,
      screeningNew.error,
      classification.error,
      impactReviews.error,
      actions.error,
      requiredDocuments.error,
      actionAttachments.error,
      approvalWorkflows.error,
      approvalSteps.error,
      implementationRequirements.error,
      pssrReviews.error,
      pssrChecklistItems.error,
      closureRequirements.error,
      auditEvents.error,
    ].filter(Boolean);

    return NextResponse.json({
      ok: true,
      request: mocRequest,
      company,
      site,
      screeningOld: screeningOld.data,
      screeningNew: screeningNew.data,
      classification: classification.data,
      impactReviews: impactReviews.data,
      actions: actions.data,
      requiredDocuments: requiredDocuments.data,
      actionAttachments: actionAttachments.data,
      approvalWorkflows: approvalWorkflows.data,
      approvalSteps: approvalSteps.data,
      implementationRequirements: implementationRequirements.data,
      pssrReviews: pssrReviews.data,
      pssrChecklistItems: pssrChecklistItems.data,
      closureRequirements: closureRequirements.data,
      auditEvents: auditEvents.data,
      warnings: errors,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
