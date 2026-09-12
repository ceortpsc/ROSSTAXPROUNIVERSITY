import { noStoreJson } from '../../../../lib/ops';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return noStoreJson({
    ok: true,
    support: {
      service: 'Ross Tax Pro University IT / Platform Support',
      email: process.env.RTPU_SUPPORT_EMAIL || 'support@rosstaxprosoftwareco.com',
      healthEndpoint: '/api/ops/health',
      operationsDashboard: '/admin/operations',
      classroomAuthorization: '/api/integrations/google-classroom/oauth/start'
    },
    incidentChecklist: [
      'Confirm latest deploy status',
      'Check /api/ops/health',
      'Review application and build logs',
      'Confirm integration configuration presence',
      'Reproduce with correlation/request context without exposing student data or secrets'
    ]
  });
}
