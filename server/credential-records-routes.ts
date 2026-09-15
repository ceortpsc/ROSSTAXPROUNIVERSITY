import type { FastifyInstance } from 'fastify';
import {
  getCredentialArtifact,
  getCredentialFieldRegistry,
  getCredentialRecordsSnapshot,
  getRecordsQueryRegistry,
  getRecordsTableRegistry,
  getRecordsViewRegistry,
  listCredentialArtifacts
} from '../lib/credential-records';

export async function registerCredentialRecordsRoutes(app: FastifyInstance) {
  app.get('/api/records/registry', async () => ({ ok: true, ...getCredentialRecordsSnapshot() }));

  app.get('/api/records/templates', async () => ({
    ok: true,
    templates: listCredentialArtifacts(),
    fields: getCredentialFieldRegistry()
  }));

  app.get('/api/records/templates/:artifactId', async (request, reply) => {
    const { artifactId } = request.params as { artifactId: string };
    const artifact = getCredentialArtifact(artifactId);
    if (!artifact) return reply.code(404).send({ ok: false, error: 'Template not found' });
    return { ok: true, artifact };
  });

  app.get('/api/records/schema', async () => ({
    ok: true,
    persistence: getCredentialRecordsSnapshot().persistence,
    tables: getRecordsTableRegistry(),
    views: getRecordsViewRegistry()
  }));

  app.get('/api/records/queries', async () => ({
    ok: true,
    persistence: getCredentialRecordsSnapshot().persistence,
    queries: getRecordsQueryRegistry(),
    note: 'Query contracts are source-controlled. A configured database does not by itself prove migrations have been applied.'
  }));
}