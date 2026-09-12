import { integrationReadiness, noStoreJson } from '../../../../lib/ops';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const readiness = integrationReadiness();
  return noStoreJson({
    ok: true,
    controls: {
      tlsOnly: true,
      hsts: true,
      contentTypeSniffingProtection: true,
      frameProtection: 'SAMEORIGIN',
      referrerPolicy: 'strict-origin-when-cross-origin',
      restrictiveBrowserPermissions: true,
      apiCachePolicy: 'no-store',
      secretValuesExposedByEndpoint: false,
      mutatingOpsRequireSharedSecret: true
    },
    configurationPresence: readiness,
    compliancePosture: {
      studentDataMinimization: 'required',
      leastPrivilege: 'required',
      auditability: 'required',
      secretsInSource: 'prohibited',
      productionClaims: 'verify-before-claim'
    }
  });
}
