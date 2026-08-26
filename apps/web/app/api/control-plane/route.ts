import systems from "../../../../../../config/system-registry.json";
import actions from "../../../../../../config/action-registry.json";
import capabilities from "../../../../../../config/capability-registry.json";
import automations from "../../../../../../config/automation-registry.json";
import integrations from "../../../../../../config/integration-registry.json";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    ok: true,
    service: "ross-tax-pro-university-control-plane",
    timestamp: new Date().toISOString(),
    systems,
    actions,
    capabilities,
    automations,
    integrations
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const actionId = String(body.actionId ?? "");
  const action = actions.actions.find((item: {id:string}) => item.id === actionId);
  if (!action) return Response.json({ ok:false, error:"Unknown action" }, { status:404 });
  if (action.requiresHuman && body.humanApproval !== true) {
    return Response.json({
      ok:false,
      status:"human_review_required",
      action,
      message:"This action is registered but requires an authorized human approval before execution."
    }, { status:409 });
  }
  return Response.json({
    ok:true,
    status:"accepted",
    action,
    correlationId: body.correlationId ?? crypto.randomUUID(),
    execution: "adapter-dispatch-boundary"
  }, { status:202 });
}
