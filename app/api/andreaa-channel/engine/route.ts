import { createAndreaaBlueprint, getAndreaaEngineSnapshot } from '../../../../lib/andreaa-engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function noStore(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { 'cache-control': 'no-store' }
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tier = Number(url.searchParams.get('tier') || '10');
  return noStore(getAndreaaEngineSnapshot(tier));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { objective?: unknown; tier?: unknown };
    const objective = typeof body.objective === 'string' ? body.objective : '';
    const tier = Number(body.tier ?? 10);
    return noStore(createAndreaaBlueprint(objective, tier), 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'invalid request';
    return noStore({ error: message }, 400);
  }
}
