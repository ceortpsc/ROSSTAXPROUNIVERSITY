import { getLmsSnapshot } from '../../../../lib/lms-integration';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(getLmsSnapshot(), {
    headers: { 'cache-control': 'no-store, max-age=0' }
  });
}
