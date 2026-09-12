import { noStoreJson, runtimeSnapshot } from '../../../../lib/ops';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const snapshot = runtimeSnapshot();
  return noStoreJson({
    ok: true,
    observed: {
      memory: snapshot.memory,
      uptimeSeconds: snapshot.uptimeSeconds
    },
    policy: {
      applicationRateLimits: 'connector-specific limits must be enforced per integration',
      classroomWrites: 'batch conservatively and retry 429/5xx with exponential backoff',
      reservationStrategy: 'no paid capacity reservation created by this endpoint',
      billingGuardrail: 'paid infrastructure changes require explicit approval'
    }
  });
}
