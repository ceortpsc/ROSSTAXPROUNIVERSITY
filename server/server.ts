import { timingSafeEqual } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify, { type FastifyRequest } from 'fastify';
import compress from '@fastify/compress';
import helmet from '@fastify/helmet';
import staticPlugin from '@fastify/static';
import { createAndreaaBlueprint, getAndreaaEngineSnapshot } from '../lib/andreaa-engine';
import { getAndreaaRuntimeSnapshot } from '../lib/andreaa-channel';
import { getLmsSnapshot } from '../lib/lms-integration';
import { registerPlatformRoutes } from './platform-routes';
import { registerAiLmsRoutes } from './ai-lms-routes';
import { registerCredentialRecordsRoutes } from './credential-records-routes';

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

app.get('/api/health', async () => ({
  ok: true,
  system: 'ROSSTAXPROUNIVERSITY',
  runtime: 'fastify-vite-ai-lms',
  runtimeVersion: '4.0.0',
  deployEnvironment: process.env.RTPU_DEPLOY_ENV || 'development',
  releaseChannel: process.env.RTPU_RELEASE_CHANNEL || 'stable',
  learningRuntime: 'rtpu-native-ai-lms',
  externalLmsDependency: false,
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

app.get('/api/ops/overview', async () => ({
  ok: true,
  system: 'ROSSTAXPROUNIVERSITY',
  runtime: 'fastify-vite-ai-lms',
  runtimeVersion: '4.0.0',
  learningRuntime: 'rtpu-native-ai-lms',
  externalLmsDependency: false,
  sourceBranch: process.env.RENDER_GIT_BRANCH || 'main',
  sourceCommit: process.env.RENDER_GIT_COMMIT || null,
  serviceId: process.env.RENDER_SERVICE_ID || null,
  maintenanceMode: process.env.RTPU_MAINTENANCE_MODE === 'true',
  deploymentEnvironment: process.env.RTPU_DEPLOY_ENV || 'development',
  releaseChannel: process.env.RTPU_RELEASE_CHANNEL || 'stable',
  observedAtUtc: new Date().toISOString()
}));

app.get('/api/ops/health', async () => ({
  ok: true,
  runtime: 'fastify-vite-ai-lms',
  uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
  memory: process.memoryUsage(),
  lms: getLmsSnapshot(),
  observedAtUtc: new Date().toISOString()
}));

app.get('/api/ops/security', async () => ({
  ok: true,
  controls: {
    helmet: true,
    hsts: process.env.RTPU_DEPLOY_ENV === 'production',
    contentSecurityPolicy: true,
    noStoreApis: true,
    secretRedaction: true,
    operationsKeyConfigured: Boolean(process.env.OPS_ADMIN_KEY),
    externalLmsCredentialsRequired: false,
    highImpactHumanApproval: true
  }
}));

app.get('/api/ops/optimization', async () => ({
  ok: true,
  runtime: 'Fastify',
  clientBuild: 'Vite',
  compression: true,
  staticAssets: true,
  processMemoryBytes: process.memoryUsage(),
  note: 'Measure production latency and resource pressure before changing capacity settings.'
}));

app.get('/api/ops/quotas', async () => ({
  ok: true,
  policy: {
    andreaaInternalCapacityMultiplierCeiling: 10,
    nativeAiLmsAgents: 13,
    paidCapacityRequiresExplicitApproval: true,
    quotaBypass: false
  }
}));

app.get('/api/ops/topology', async () => ({
  ok: true,
  nodes: ['GitHub', 'Render', 'Fastify API', 'Vite React Client', 'Andreaa Engine', 'RTPU Native AI LMS', 'Admissions', 'Records', 'Student Experience', 'Faculty Experience'],
  edges: [
    ['GitHub', 'Render'],
    ['Render', 'Fastify API'],
    ['Fastify API', 'Vite React Client'],
    ['Fastify API', 'Andreaa Engine'],
    ['Andreaa Engine', 'RTPU Native AI LMS'],
    ['RTPU Native AI LMS', 'Student Experience'],
    ['RTPU Native AI LMS', 'Faculty Experience'],
    ['RTPU Native AI LMS', 'Admissions'],
    ['RTPU Native AI LMS', 'Records']
  ]
}));

app.get('/api/ops/support', async () => ({
  ok: true,
  supportEmail: process.env.RTPU_SUPPORT_EMAIL || null,
  incidentSequence: ['deployment status', 'application health', 'AI LMS state', 'runtime logs', 'rollback decision']
}));

app.get('/api/ops/maintenance', async () => ({
  ok: true,
  maintenanceMode: process.env.RTPU_MAINTENANCE_MODE === 'true',
  mutationProtected: true
}));

app.post('/api/ops/maintenance', async (request, reply) => {
  if (!requireOperationsKey(request)) return reply.code(401).send({ ok: false, error: 'Unauthorized' });
  return reply.code(409).send({
    ok: false,
    error: 'Runtime environment mutation is intentionally not performed from the application process. Update RTPU_MAINTENANCE_MODE in the deployment control plane and redeploy.'
  });
});

await registerPlatformRoutes(app);
await registerAiLmsRoutes(app);
await registerCredentialRecordsRoutes(app);

await app.register(staticPlugin, {
  root: webRoot,
  prefix: '/',
  decorateReply: true,
  wildcard: false,
  maxAge: process.env.RTPU_DEPLOY_ENV === 'production' ? '1h' : 0,
  immutable: false
});

app.get('/*', async (_request, reply) => reply.sendFile('index.html'));
app.setNotFoundHandler(async (request, reply) => {
  if (request.url.startsWith('/api/')) return reply.code(404).send({ error: 'Not found' });
  return reply.sendFile('index.html');
});
app.setErrorHandler(async (error, request, reply) => {
  request.log.error({ err: error }, 'Unhandled request error');
  if (request.url.startsWith('/api/')) return reply.code(500).send({ error: 'Internal server error' });
  return reply.code(500).type('text/plain').send('Internal server error');
});

const port = Number(process.env.PORT || 10000);
const host = process.env.HOST || '0.0.0.0';
await app.listen({ port, host });