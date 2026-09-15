import { timingSafeEqual } from 'node:crypto';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { admissionsSeedSnapshot, createAdmissionsVerificationRecord } from '../lib/admissions';
import { backgroundScreeningPolicy, backgroundScreeningReadiness, createBackgroundAuthorization, usStateAndTerritoryCodes } from '../lib/background-screening';

function secureEqual(left: string | undefined, right: string | undefined) {
  if (!left || !right) return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function requireAdmissionsAdmin(request: FastifyRequest) {
  const expected = process.env.ENROLLMENT_ADMIN_KEY;
  const supplied = typeof request.headers['x-enrollment-admin-key'] === 'string'
    ? request.headers['x-enrollment-admin-key']
    : undefined;
  return secureEqual(expected, supplied);
}

export async function registerAdmissionsRoutes(app: FastifyInstance) {
  app.get('/api/admissions/seed', async () => ({ ok: true, ...admissionsSeedSnapshot() }));

  app.get('/api/admissions/background-policy', async () => ({
    ok: true,
    policy: backgroundScreeningPolicy,
    readiness: backgroundScreeningReadiness(),
    statesAndTerritories: usStateAndTerritoryCodes
  }));

  app.post('/api/admissions/verification-records', async (request, reply) => {
    if (!requireAdmissionsAdmin(request)) return reply.code(401).send({ ok: false, error: 'Unauthorized' });
    try {
      const record = createAdmissionsVerificationRecord((request.body || {}) as Record<string, unknown>);
      request.log.info({ verificationRecordId: record.verificationRecordId, applicationId: record.applicationId, track: record.track }, 'Admissions verification record created');
      return reply.code(201).send({ ok: true, record });
    } catch (error) {
      return reply.code(400).send({ ok: false, error: error instanceof Error ? error.message : 'invalid verification record' });
    }
  });

  app.post('/api/admissions/background-authorizations', async (request, reply) => {
    if (!requireAdmissionsAdmin(request)) return reply.code(401).send({ ok: false, error: 'Unauthorized' });
    try {
      const authorization = createBackgroundAuthorization((request.body || {}) as Record<string, unknown>);
      request.log.info({ authorizationId: authorization.authorizationId, applicationId: authorization.applicationId, purpose: authorization.purpose }, 'Background screening authorization created');
      return reply.code(201).send({
        ok: true,
        authorization,
        screeningExecuted: false,
        providerConnected: false,
        notice: 'Authorization evidence was created. No federal, state, county, credit, criminal, driving, or other consumer-report search was executed.'
      });
    } catch (error) {
      return reply.code(400).send({ ok: false, error: error instanceof Error ? error.message : 'invalid background authorization' });
    }
  });
}
