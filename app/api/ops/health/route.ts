import { integrationReadiness, noStoreJson, runtimeSnapshot } from '../../../../lib/ops';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const readiness = integrationReadiness();
  const classroomCore = readiness.googleClassroomClientId && readiness.googleClassroomClientSecret && readiness.googleClassroomRedirectUri;
  return noStoreJson({
    ok: true,
    status: 'healthy',
    ...runtimeSnapshot(),
    checks: {
      process: 'pass',
      api: 'pass',
      googleClassroomOAuthConfiguration: classroomCore ? 'pass' : 'attention',
      googleClassroomOfflineAuthorization: readiness.googleClassroomRefreshToken ? 'pass' : 'pending_authorization'
    }
  });
}
