import type { FastifyInstance } from 'fastify';
import { createAndreaaBlueprint } from '../lib/andreaa-engine';
import { platformSnapshot, releaseEvidence, releaseChannels, routeRegistry, moduleRegistry, engineeringPrinciples } from '../lib/platform-evolution';

export async function registerPlatformRoutes(app: FastifyInstance) {
  app.get('/api/platform', async () => ({ ok: true, ...platformSnapshot() }));
  app.get('/api/platform/releases', async () => ({ ok: true, activeChannel: process.env.RTPU_RELEASE_CHANNEL || 'stable', channels: releaseChannels }));
  app.get('/api/platform/routes', async () => ({ ok: true, routes: routeRegistry }));
  app.get('/api/platform/modules', async () => ({ ok: true, modules: moduleRegistry }));
  app.get('/api/platform/principles', async () => ({ ok: true, principles: engineeringPrinciples }));
  app.get('/api/platform/evidence', async () => ({ ok: true, ...releaseEvidence(), snapshot: platformSnapshot() }));

  app.post('/api/andreaa-channel/assist', async (request, reply) => {
    const body = (request.body || {}) as { objective?: unknown; context?: unknown; tier?: unknown; mode?: unknown };
    const objective = typeof body.objective === 'string' ? body.objective.trim() : '';
    if (!objective) return reply.code(400).send({ ok: false, error: 'objective is required' });
    const context = typeof body.context === 'string' ? body.context.trim().slice(0, 6000) : '';
    const tier = Math.max(1, Math.min(10, Number(body.tier || 10)));
    const mode = typeof body.mode === 'string' ? body.mode : 'architecture';
    const blueprint = createAndreaaBlueprint(`${objective}${context ? `\n\nContext:\n${context}` : ''}`, tier);
    return reply.code(201).send({
      ok: true,
      assistant: 'Andreaa Channel',
      mode,
      tier,
      providerMode: 'RTPU deterministic engineering assist',
      note: 'This endpoint produces an evidence-oriented engineering plan. It does not claim an external model action unless a provider adapter returns evidence.',
      blueprint,
      generatedAtUtc: new Date().toISOString()
    });
  });
}
