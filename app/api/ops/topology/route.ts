import { noStoreJson } from '../../../../lib/ops';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return noStoreJson({
    ok: true,
    topology: {
      application: { id:'rtpu-web', type:'Next.js web service', provider:'Render', branch:'main' },
      source: { id:'github', type:'SCM', repository:'ceortpsc/ROSSTAXPROUNIVERSITY' },
      googleWorkspace: { id:'workspace', type:'external platform', systems:['Classroom','Drive','Docs','Sheets','Slides'] },
      classroomConnector: { id:'classroom-oauth', type:'OAuth2/API integration', auth:'user consent + offline token' },
      operations: { id:'ops', type:'control surface', endpoint:'/admin/operations' }
    },
    edges: [
      ['github','rtpu-web','auto deploy'],
      ['rtpu-web','classroom-oauth','OAuth/API'],
      ['classroom-oauth','workspace','Google APIs'],
      ['ops','rtpu-web','health/readiness']
    ]
  });
}
