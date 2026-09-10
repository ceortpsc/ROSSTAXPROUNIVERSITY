import { classroomCredentialStatus, classroomScopes } from '../../../../lib/google-classroom';

export const dynamic = 'force-dynamic';

export default function GoogleClassroomIntegrationPage() {
  const status = classroomCredentialStatus();
  const ready = status.configured && status.adminGateConfigured;
  return <main className='gateLayout'>
    <section className='card'>
      <span className='status'>GOOGLE CLASSROOM CONNECTOR</span>
      <h1>Google Classroom Integration</h1>
      <p><strong>State:</strong> {ready ? 'Ready' : 'Needs Google OAuth authorization'}</p>
      <p><strong>Credential mode:</strong> {status.credentialMode}</p>
      <p><strong>Administrative write gate:</strong> {status.adminGateConfigured ? 'Configured' : 'Not configured'}</p>
      <h2>Authorized capability contract</h2>
      <div className='moduleList'>
        {['Courses','Teachers','Students / Rosters','Coursework'].map(item => <div className='module' key={item}><strong>{item}</strong><p className='muted'>Read/write through governed server connector.</p></div>)}
      </div>
      <h2>OAuth scopes</h2>
      <ul>{classroomScopes.map(scope => <li key={scope}><code>{scope}</code></li>)}</ul>
      <div className='notice'><strong>Security:</strong><p className='muted'>Google client secrets, refresh tokens and the RTPSC integration key are deployment-environment secrets and must never be committed to Git.</p></div>
      <p><a className='button gold' href='/api/integrations/google-classroom'>Open connector health</a></p>
    </section>
  </main>;
}
