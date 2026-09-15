import { getAndreaaRuntimeSnapshot, type AndreaaPlanId } from '../../../../lib/andreaa-channel';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requested = url.searchParams.get('plan');
  const plan: AndreaaPlanId = requested === 'standard' ? 'standard' : 'ultra-lte';
  return Response.json(getAndreaaRuntimeSnapshot(plan), {
    headers: { 'cache-control': 'no-store' }
  });
}
