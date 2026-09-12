import { authorizeOps, noStoreJson, runtimeSnapshot } from '../../../../lib/ops';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return noStoreJson({
    ok: true,
    maintenanceMode: process.env.RTPU_MAINTENANCE_MODE === 'true',
    supportedActions: ['runtime-snapshot', 'readiness-check'],
    destructiveActions: false,
    note: 'POST actions require x-ops-key and are deliberately non-destructive.'
  });
}

export async function POST(request: Request) {
  if (!authorizeOps(request)) return noStoreJson({ ok:false, error:'unauthorized' }, { status:401 });
  const body = await request.json().catch(() => ({})) as { action?: string };
  const action = String(body.action || '');
  if (action === 'runtime-snapshot' || action === 'readiness-check') {
    return noStoreJson({ ok:true, action, result:runtimeSnapshot() });
  }
  return noStoreJson({ ok:false, error:'unsupported_action' }, { status:400 });
}
