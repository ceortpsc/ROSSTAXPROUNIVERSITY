import type { FastifyInstance } from 'fastify';
import { aiUniversitySnapshot, createAssessmentPlan, createLearningPlan, createLectureSession } from '../lib/ai-university';

export async function registerAiLmsRoutes(app: FastifyInstance) {
  app.get('/api/lms', async () => ({ ok: true, ...aiUniversitySnapshot() }));
  app.get('/api/lms/agents', async () => {
    const snapshot = aiUniversitySnapshot();
    return { ok: true, agents: snapshot.agents, controls: snapshot.controls, observedAtUtc: snapshot.observedAtUtc };
  });
  app.get('/api/lms/programs', async () => ({ ok: true, programs: aiUniversitySnapshot().programs }));

  app.post('/api/lms/lecture', async (request, reply) => {
    try {
      return reply.code(201).send({ ok: true, lecture: createLectureSession((request.body || {}) as Record<string, unknown>) });
    } catch (error) {
      return reply.code(400).send({ ok: false, error: error instanceof Error ? error.message : 'invalid lecture request' });
    }
  });

  app.post('/api/lms/learning-plan', async (request, reply) => {
    try {
      return reply.code(201).send({ ok: true, plan: createLearningPlan((request.body || {}) as Record<string, unknown>) });
    } catch (error) {
      return reply.code(400).send({ ok: false, error: error instanceof Error ? error.message : 'invalid learning-plan request' });
    }
  });

  app.post('/api/lms/assessment', async (request, reply) => {
    try {
      return reply.code(201).send({ ok: true, assessment: createAssessmentPlan((request.body || {}) as Record<string, unknown>) });
    } catch (error) {
      return reply.code(400).send({ ok: false, error: error instanceof Error ? error.message : 'invalid assessment request' });
    }
  });
}
