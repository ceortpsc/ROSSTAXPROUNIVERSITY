import registry from '../../../../config/ops-registry.json';
import { integrationReadiness, noStoreJson, runtimeSnapshot } from '../../../../lib/ops';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return noStoreJson({
    ok: true,
    ...runtimeSnapshot(),
    deployment: {
      provider: 'Render',
      branch: 'main',
      autoDeploy: true,
      repository: 'ceortpsc/ROSSTAXPROUNIVERSITY'
    },
    readiness: integrationReadiness(),
    operations: registry.areas
  });
}
