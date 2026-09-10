import { classroomCredentialStatus, classroomScopes } from '../../../../lib/google-classroom';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const status = classroomCredentialStatus();
  return Response.json({
    ok: true,
    integration: 'google-classroom',
    provider: 'Google Classroom',
    apiVersion: 'v1',
    baseUrl: process.env.GOOGLE_CLASSROOM_BASE_URL || 'https://classroom.googleapis.com/v1',
    configured: status.configured,
    credentialMode: status.credentialMode,
    adminGateConfigured: status.adminGateConfigured,
    scopes: classroomScopes,
    capabilities: [
      'courses.list','courses.create','teachers.list','teachers.create',
      'students.list','students.create','courseWork.list','courseWork.create'
    ],
    state: status.configured && status.adminGateConfigured ? 'ready' : 'needs_authorization'
  }, { headers: { 'cache-control': 'no-store' } });
}
