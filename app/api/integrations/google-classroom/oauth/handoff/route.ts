import { consumeHandoff } from '../_store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const expected = process.env.RTPU_CLASSROOM_INTEGRATION_KEY;
  const supplied = request.headers.get('x-rtpu-classroom-key');
  if (!expected || !supplied || supplied !== expected) return Response.json({ ok:false, error:'Unauthorized' }, { status:401 });

  const body = await request.json().catch(() => ({})) as { handoffId?:string };
  const handoffId = String(body.handoffId || '');
  if (!handoffId) return Response.json({ ok:false, error:'handoffId is required' }, { status:400 });
  const credential = consumeHandoff(handoffId);
  if (!credential) return Response.json({ ok:false, error:'Handoff not found, expired, or already consumed' }, { status:404 });

  return Response.json({ ok:true, refreshToken:credential.refreshToken, issuedAt:credential.createdAt, expiresAt:credential.expiresAt }, { headers:{'cache-control':'no-store'} });
}
