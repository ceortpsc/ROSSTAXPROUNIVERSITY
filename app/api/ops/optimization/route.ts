import { noStoreJson, runtimeSnapshot } from '../../../../lib/ops';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const snapshot = runtimeSnapshot();
  return noStoreJson({
    ok: true,
    runtime: snapshot,
    optimization: {
      compression: true,
      nextProductionBuild: true,
      apiNoStore: true,
      staticAssetOptimization: 'Next.js managed',
      imageOptimization: 'Next.js route-dependent',
      buildCache: 'provider-managed/not asserted',
      recommendations: [
        'Keep dependencies pinned during release windows',
        'Use database indexes for roster/course enrollment queries when persistence is connected',
        'Use background jobs for bulk Classroom provisioning',
        'Measure p95 latency before increasing instance size'
      ]
    }
  });
}
