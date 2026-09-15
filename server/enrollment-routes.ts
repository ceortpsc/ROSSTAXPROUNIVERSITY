import type { FastifyInstance } from 'fastify';
import { registerEnrollmentRoutes as registerEnrollmentCoreRoutes } from './enrollment-core-routes';
import { registerAdmissionsRoutes } from './admissions-routes';

export async function registerEnrollmentRoutes(app: FastifyInstance) {
  await registerEnrollmentCoreRoutes(app);
  await registerAdmissionsRoutes(app);
}
