import registry from "../../../../../../config/automation-registry.json";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    ok: true,
    service: "ross-tax-pro-university-automation",
    timestamp: new Date().toISOString(),
    automations: registry.automations
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const trigger = String(body.trigger ?? "");
  const matches = registry.automations.filter((item: {trigger:string}) => item.trigger === trigger);
  if (!matches.length) return Response.json({ ok:false, error:"Unknown trigger" }, { status:404 });
  return Response.json({
    ok: true,
    status: "accepted",
    trigger,
    automations: matches.map((item: {id:string;owner:string;steps:string[]}) => ({ id:item.id, owner:item.owner, steps:item.steps })),
    correlationId: body.correlationId ?? crypto.randomUUID(),
    execution: "workflow-dispatch-boundary"
  }, { status:202 });
}
