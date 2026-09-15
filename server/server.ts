import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify, { type FastifyRequest } from 'fastify';
import compress from '@fastify/compress';
import helmet from '@fastify/helmet';
import staticPlugin from '@fastify/static';
import { createAndreaaBlueprint, getAndreaaEngineSnapshot } from '../lib/andreaa-engine';
import { getAndreaaRuntimeSnapshot } from '../lib/andreaa-channel';
import { getLmsSnapshot } from '../lib/lms-integration';
import { classroomCredentialStatus, classroomScopes, googleClassroom } from '../lib/google-classroom';
import { createGoogleClassroomOAuthState, verifyGoogleClassroomOAuthState } from '../lib/oauth-state';
import { consumeHandoff, createHandoff } from './oauth-handoff';
import { registerPlatformRoutes } from './platform-routes';

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers.set-cookie']
  },
  trustProxy: true,
  bodyLimit: 1024 * 1024
});

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(__dirname, '../web/dist');
const startedAt = Date.now();

await app.register(compress, { global: true });
await app.register(helmet, {
  global: true,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'data:'],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'same-site' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  strictTransportSecurity: process.env.RTPU_DEPLOY_ENV === 'production'
    ? { maxAge: 63_072_000, includeSubDomains: true, preload: true }
    : false
});

app.addHook('onSend', async (request, reply, payload) => {
  if (request.url.startsWith('/api/')) reply.header('cache-control', 'no-store, max-age=0');
  return payload;
});

function publicOrigin(request: FastifyRequest) {
  const explicit = process.env.PUBLIC_BASE_URL || process.env.ANDREAA_PRODUCTION_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  const host = request.headers['x-forwarded-host'] || request.headers.host || 'localhost:3000';
  const protocol = request.headers['x-forwarded-proto'] || request.protocol || 'http';
  return `${String(protocol).split(',')[0]}://${String(host).split(',')[0]}`;
}

function secureEqual(left: string | undefined, right: string | undefined) {
  if (!left || !right) return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function requireOperationsKey(request: FastifyRequest) {
  const expected = process.env.OPS_ADMIN_KEY;
  const supplied = typeof request.headers['x-ops-key'] === 'string' ? request.headers['x-ops-key'] : undefined;
  return secureEqual(expected, supplied);
}

function requireClassroomKey(request: FastifyRequest) {
  const expected = process.env.RTPU_CLASSROOM_INTEGRATION_KEY;
  const supplied = typeof request.headers['x-rtpu-classroom-key'] === 'string' ? request.headers['x-rtpu-classroom-key'] : undefined;
  return secureEqual(expected, supplied);
}

function htmlEscape(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function consentPage(title: string, body: string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${htmlEscape(title)}</title><style>body{font-family:system-ui;background:#f7f2e8;color:#172033;padding:32px}.card{max-width:880px;margin:auto;background:white;border:1px solid #ddd6c8;border-radius:18px;padding:28px}h1{color:#0b1f3a}.code{font-family:ui-monospace,monospace;background:#f1f5f9;padding:12px;border-radius:10px;word-break:break-all;white-space:pre-wrap}.ok{color:#166534;font-weight:800}.warn{color:#92400e;font-weight:800}</style></head><body><main class="card">${body}</main></body></html>`;
}

function sha256Prefix(value: string, length = 24) {
  return createHash('sha256').update(value).digest('hex').slice(0, length);
}

app.get('/api/health', async () => ({
  ok: true,
  system: 'ROSSTAXPROUNIVERSITY',
  runtime: 'fastify-vite',
  runtimeVersion: '3.0.0',
  deployEnvironment: process.env.RTPU_DEPLOY_ENV || 'development',
  releaseChannel: process.env.RTPU_RELEASE_CHANNEL || 'stable',
  uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
  observedAtUtc: new Date().toISOString()
}));

app.get('/api/andreaa-channel/engine', async (request) => {
  const query = request.query as { tier?: string };
  return getAndreaaEngineSnapshot(Number(query.tier || 10));
});

app.post('/api/andreaa-channel/engine', async (request, reply) => {
  try {
    const body = (request.body || {}) as { objective?: unknown; tier?: unknown };
    const objective = typeof body.objective === 'string' ? body.objective : '';
    return reply.code(201).send(createAndreaaBlueprint(objective, Number(body.tier ?? 10)));
  } catch (error) {
    return reply.code(400).send({ error: error instanceof Error ? error.message : 'invalid request' });
  }
});

app.get('/api/andreaa-channel/capabilities', async (request) => {
  const query = request.query as { plan?: string };
  const plan = query.plan === 'standard' ? 'standard' : 'ultra-lte';
  return getAndreaaRuntimeSnapshot(plan);
});

app.get('/api/lms/integrations', async () => getLmsSnapshot());

app.get('/api/integrations/google-classroom', async () => ({
  ok: true,
  connector: 'google-classroom',
  credentialStatus: classroomCredentialStatus(),
  oauthClientConfigured: Boolean(process.env.GOOGLE_CLASSROOM_CLIENT_ID && process.env.GOOGLE_CLASSROOM_CLIENT_SECRET),
  redirectUri: process.env.GOOGLE_CLASSROOM_REDIRECT_URI || null,
  scopes: classroomScopes,
  providerAuthorizationRequired: true
}));

app.get('/api/integrations/google-classroom/courses', async (request, reply) => {
  try {
    const query = request.query as { pageSize?: string };
    return await googleClassroom.listCourses(Number(query.pageSize || 50));
  } catch (error) {
    return reply.code(502).send({ ok: false, error: error instanceof Error ? error.message : 'Google Classroom request failed' });
  }
});

app.post('/api/integrations/google-classroom/courses', async (request, reply) => {
  if (!requireClassroomKey(request)) return reply.code(401).send({ ok: false, error: 'Unauthorized' });
  try {
    return reply.code(201).send(await googleClassroom.createCourse((request.body || {}) as Record<string, unknown>));
  } catch (error) {
    return reply.code(502).send({ ok: false, error: error instanceof Error ? error.message : 'Google Classroom request failed' });
  }
});

app.get('/api/integrations/google-classroom/courses/:courseId/students', async (request, reply) => {
  try {
    const { courseId } = request.params as { courseId: string };
    return await googleClassroom.listStudents(courseId);
  } catch (error) {
    return reply.code(502).send({ ok: false, error: error instanceof Error ? error.message : 'Google Classroom request failed' });
  }
});

app.post('/api/integrations/google-classroom/courses/:courseId/students', async (request, reply) => {
  if (!requireClassroomKey(request)) return reply.code(401).send({ ok: false, error: 'Unauthorized' });
  try {
    const { courseId } = request.params as { courseId: string };
    const body = (request.body || {}) as { userId?: string; enrollmentCode?: string };
    if (!body.userId) return reply.code(400).send({ ok: false, error: 'userId is required' });
    return reply.code(201).send(await googleClassroom.addStudent(courseId, body.userId, body.enrollmentCode));
  } catch (error) {
    return reply.code(502).send({ ok: false, error: error instanceof Error ? error.message : 'Google Classroom request failed' });
  }
});

app.get('/api/integrations/google-classroom/courses/:courseId/teachers', async (request, reply) => {
  try {
    const { courseId } = request.params as { courseId: string };
    return await googleClassroom.listTeachers(courseId);
  } catch (error) {
    return reply.code(502).send({ ok: false, error: error instanceof Error ? error.message : 'Google Classroom request failed' });
  }
});

app.post('/api/integrations/google-classroom/courses/:courseId/teachers', async (request, reply) => {
  if (!requireClassroomKey(request)) return reply.code(401).send({ ok: false, error: 'Unauthorized' });
  try {
    const { courseId } = request.params as { courseId: string };
    const body = (request.body || {}) as { userId?: string };
    if (!body.userId) return reply.code(400).send({ ok: false, error: 'userId is required' });
    return reply.code(201).send(await googleClassroom.addTeacher(courseId, body.userId));
  } catch (error) {
    return reply.code(502).send({ ok: false, error: error instanceof Error ? error.message : 'Google Classroom request failed' });
  }
});

app.get('/api/integrations/google-classroom/courses/:courseId/coursework', async (request, reply) => {
  try {
    const { courseId } = request.params as { courseId: string };
    return await googleClassroom.listCourseWork(courseId);
  } catch (error) {
    return reply.code(502).send({ ok: false, error: error instanceof Error ? error.message : 'Google Classroom request failed' });
  }
});

app.post('/api/integrations/google-classroom/courses/:courseId/coursework', async (request, reply) => {
  if (!requireClassroomKey(request)) return reply.code(401).send({ ok: false, error: 'Unauthorized' });
  try {
    const { courseId } = request.params as { courseId: string };
    return reply.code(201).send(await googleClassroom.createCourseWork(courseId, (request.body || {}) as Record<string, unknown>));
  } catch (error) {
    return reply.code(502).send({ ok: false, error: error instanceof Error ? error.message : 'Google Classroom request failed' });
  }
});

app.get('/api/integrations/google-classroom/oauth/start', async (request, reply) => {
  const clientId = process.env.GOOGLE_CLASSROOM_CLIENT_ID;
  if (!clientId) return reply.code(503).send({ ok: false, error: 'GOOGLE_CLASSROOM_CLIENT_ID is not configured' });
  const origin = publicOrigin(request);
  const redirectUri = process.env.GOOGLE_CLASSROOM_REDIRECT_URI || `${origin}/api/integrations/google-classroom/oauth/callback`;
  const state = createGoogleClassroomOAuthState();
  const authorizationUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authorizationUrl.searchParams.set('client_id', clientId);
  authorizationUrl.searchParams.set('redirect_uri', redirectUri);
  authorizationUrl.searchParams.set('response_type', 'code');
  authorizationUrl.searchParams.set('access_type', 'offline');
  authorizationUrl.searchParams.set('prompt', 'consent');
  authorizationUrl.searchParams.set('include_granted_scopes', 'true');
  authorizationUrl.searchParams.set('scope', classroomScopes.join(' '));
  authorizationUrl.searchParams.set('state', state);
  return reply.redirect(authorizationUrl.toString(), 302);
});

app.get('/api/integrations/google-classroom/oauth/callback', async (request, reply) => {
  const query = request.query as { code?: string; state?: string; error?: string };
  if (query.error) return reply.code(400).type('text/html').send(consentPage('Google Classroom authorization declined', `<p class="warn">Authorization was not completed</p><h1>Google returned an OAuth error</h1><p>${htmlEscape(query.error)}</p>`));
  if (!query.code || !verifyGoogleClassroomOAuthState(query.state || null)) return reply.code(400).type('text/html').send(consentPage('Invalid OAuth callback', '<p class="warn">OAuth state validation failed</p><h1>Start a fresh authorization</h1><p>The authorization must be started from RTPU and completed within 10 minutes.</p>'));
  const clientId = process.env.GOOGLE_CLASSROOM_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLASSROOM_CLIENT_SECRET;
  if (!clientId || !clientSecret) return reply.code(503).type('text/html').send(consentPage('Connector not configured', '<h1>Google OAuth client credentials are missing</h1>'));
  const origin = publicOrigin(request);
  const redirectUri = process.env.GOOGLE_CLASSROOM_REDIRECT_URI || `${origin}/api/integrations/google-classroom/oauth/callback`;
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, code: query.code, grant_type: 'authorization_code', redirect_uri: redirectUri }) });
  const token = await tokenResponse.json() as { refresh_token?: string; access_token?: string; expires_in?: number; scope?: string; error?: string; error_description?: string };
  if (!tokenResponse.ok) return reply.code(502).type('text/html').send(consentPage('OAuth exchange failed', `<h1>Google token exchange failed</h1><p>${htmlEscape(token.error_description || token.error || 'Unknown OAuth error')}</p>`));
  if (!token.refresh_token || !token.access_token) return reply.code(409).type('text/html').send(consentPage('Offline authorization incomplete', '<h1>Google did not issue the required offline credentials</h1><p>Restart authorization with consent so Google can issue an access token and refresh token.</p>'));
  const authHeaders = { Authorization: `Bearer ${token.access_token}` };
  const [profileResponse, coursesResponse] = await Promise.all([fetch('https://classroom.googleapis.com/v1/userProfiles/me', { headers: authHeaders }), fetch('https://classroom.googleapis.com/v1/courses?pageSize=1', { headers: authHeaders })]);
  const profile = await profileResponse.json().catch(() => ({})) as { id?: string; emailAddress?: string };
  const courses = await coursesResponse.json().catch(() => ({})) as { courses?: Array<{ id?: string }> };
  const accountEvidenceSource = `${profile.id || 'unknown'}|${profile.emailAddress || 'unknown'}`;
  const receipt = { schemaVersion: '2.0', receiptId: randomUUID(), evidenceType: 'google-classroom-oauth-consent', runtime: 'fastify-vite', environment: process.env.RTPU_DEPLOY_ENV || 'production', authorizedAtUtc: new Date().toISOString(), oauth: { tokenExchange: 'success', refreshTokenIssued: true, accessTokenIssued: true, expiresInSeconds: token.expires_in ?? null, grantedScopes: token.scope ? token.scope.split(' ').filter(Boolean).sort() : [], refreshTokenFingerprintSha256Prefix: sha256Prefix(token.refresh_token), clientIdSuffix: clientId.slice(-20), redirectUri }, googleClassroom: { userProfilesMeHttpStatus: profileResponse.status, coursesListHttpStatus: coursesResponse.status, profileReadAuthorized: profileResponse.ok, coursesReadAuthorized: coursesResponse.ok, returnedCourseCount: Array.isArray(courses.courses) ? courses.courses.length : 0, accountEvidenceSha256Prefix: sha256Prefix(accountEvidenceSource), emailDomain: profile.emailAddress?.split('@')[1]?.toLowerCase() || null }, endToEndAuthorizationVerified: profileResponse.ok && coursesResponse.ok };
  if (!receipt.endToEndAuthorizationVerified) { request.log.error({ receipt }, 'Google Classroom consent verification failed'); return reply.code(502).type('text/html').send(consentPage('Google Classroom verification failed', `<p class="warn">Token exchange succeeded, but Classroom API verification failed</p><div class="code">${htmlEscape(JSON.stringify(receipt, null, 2))}</div>`)); }
  const handoff = createHandoff(token.refresh_token);
  request.log.info({ receipt }, 'Google Classroom consent verified');
  return reply.type('text/html').send(consentPage('Google Classroom authorized', `<p class="ok">GOOGLE CLASSROOM OAUTH CONSENT AND API AUTHORIZATION VERIFIED</p><h1>Production consent evidence issued</h1><div class="code">${htmlEscape(JSON.stringify(receipt, null, 2))}</div><h2>Secure credential handoff</h2><p>The refresh token is not displayed. Use the one-time handoff ID below through the protected handoff endpoint.</p><div class="code">${htmlEscape(handoff.id)}</div><p>Expires: ${htmlEscape(handoff.expiresAt)}</p>`));
});

app.post('/api/integrations/google-classroom/oauth/handoff', async (request, reply) => {
  if (!requireClassroomKey(request)) return reply.code(401).send({ ok: false, error: 'Unauthorized' });
  const body = (request.body || {}) as { handoffId?: string };
  const handoffId = String(body.handoffId || '');
  if (!handoffId) return reply.code(400).send({ ok: false, error: 'handoffId is required' });
  const credential = consumeHandoff(handoffId);
  if (!credential) return reply.code(404).send({ ok: false, error: 'Handoff not found, expired, or already consumed' });
  return { ok: true, refreshToken: credential.refreshToken, issuedAt: credential.createdAt, expiresAt: credential.expiresAt };
});

app.get('/api/ops/overview', async () => ({ ok: true, system: 'ROSSTAXPROUNIVERSITY', runtime: 'fastify-vite', runtimeVersion: '3.0.0', sourceBranch: process.env.RENDER_GIT_BRANCH || 'main', sourceCommit: process.env.RENDER_GIT_COMMIT || null, serviceId: process.env.RENDER_SERVICE_ID || null, maintenanceMode: process.env.RTPU_MAINTENANCE_MODE === 'true', deploymentEnvironment: process.env.RTPU_DEPLOY_ENV || 'development', releaseChannel: process.env.RTPU_RELEASE_CHANNEL || 'stable', observedAtUtc: new Date().toISOString() }));
app.get('/api/ops/health', async () => ({ ok: true, runtime: 'fastify-vite', uptimeSeconds: Math.round((Date.now() - startedAt) / 1000), memory: process.memoryUsage(), classroom: classroomCredentialStatus(), observedAtUtc: new Date().toISOString() }));
app.get('/api/ops/security', async () => ({ ok: true, controls: { helmet: true, hsts: process.env.RTPU_DEPLOY_ENV === 'production', contentSecurityPolicy: true, noStoreApis: true, secretRedaction: true, operationsKeyConfigured: Boolean(process.env.OPS_ADMIN_KEY), classroomWriteGateConfigured: Boolean(process.env.RTPU_CLASSROOM_INTEGRATION_KEY) } }));
app.get('/api/ops/optimization', async () => ({ ok: true, runtime: 'Fastify', clientBuild: 'Vite', compression: true, staticAssets: true, processMemoryBytes: process.memoryUsage(), note: 'Measure production latency and resource pressure before changing capacity settings.' }));
app.get('/api/ops/quotas', async () => ({ ok: true, policy: { andreaaInternalCapacityMultiplierCeiling: 10, externalProviderQuotas: 'provider-managed', paidCapacityRequiresExplicitApproval: true, quotaBypass: false } }));
app.get('/api/ops/topology', async () => ({ ok: true, nodes: ['GitHub', 'Render', 'Fastify API', 'Vite React Client', 'Andreaa Engine', 'LMS Integration Plane', 'Google Classroom'], edges: [['GitHub','Render'],['Render','Fastify API'],['Fastify API','Vite React Client'],['Fastify API','Andreaa Engine'],['Fastify API','LMS Integration Plane'],['LMS Integration Plane','Google Classroom']] }));
app.get('/api/ops/support', async () => ({ ok: true, supportEmail: process.env.RTPU_SUPPORT_EMAIL || null, incidentSequence: ['deployment status','application health','runtime logs','provider-specific state','rollback decision'] }));
app.get('/api/ops/maintenance', async () => ({ ok: true, maintenanceMode: process.env.RTPU_MAINTENANCE_MODE === 'true', mutationProtected: true }));
app.post('/api/ops/maintenance', async (request, reply) => { if (!requireOperationsKey(request)) return reply.code(401).send({ ok: false, error: 'Unauthorized' }); return reply.code(409).send({ ok: false, error: 'Runtime environment mutation is intentionally not performed from the application process. Update RTPU_MAINTENANCE_MODE in the deployment control plane and redeploy.' }); });
app.get('/api/classroom', async () => ({ ok: true, compatibility: true, connector: 'google-classroom', credentialStatus: classroomCredentialStatus() }));

await registerPlatformRoutes(app);

await app.register(staticPlugin, {
  root: webRoot,
  prefix: '/',
  decorateReply: true,
  wildcard: false,
  maxAge: process.env.RTPU_DEPLOY_ENV === 'production' ? '1h' : 0,
  immutable: false
});

app.get('/*', async (_request, reply) => reply.sendFile('index.html'));
app.setNotFoundHandler(async (request, reply) => { if (request.url.startsWith('/api/')) return reply.code(404).send({ error: 'Not found' }); return reply.sendFile('index.html'); });
app.setErrorHandler(async (error, request, reply) => { request.log.error({ err: error }, 'Unhandled request error'); if (request.url.startsWith('/api/')) return reply.code(500).send({ error: 'Internal server error' }); return reply.code(500).type('text/plain').send('Internal server error'); });

const port = Number(process.env.PORT || 10000);
const host = process.env.HOST || '0.0.0.0';
await app.listen({ port, host });
