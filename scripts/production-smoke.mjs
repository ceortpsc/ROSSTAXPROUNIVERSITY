const base = (process.env.RTPU_BASE_URL || 'https://rosstaxprouniversity.onrender.com').replace(/\/$/, '');
const failures = [];
const evidence = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function check(name, path, validator, options = {}) {
  const started = Date.now();
  try {
    const response = await fetch(`${base}${path}`, {
      redirect: options.redirect || 'follow',
      headers: { 'user-agent': 'RTPU-Production-Smoke/1.0' }
    });
    const result = await validator(response);
    evidence.push({ name, ok: true, status: response.status, ms: Date.now() - started, ...result });
    console.log(`PASS ${name} (${response.status})`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push({ name, message });
    evidence.push({ name, ok: false, ms: Date.now() - started, error: message });
    console.error(`FAIL ${name}: ${message}`);
  }
}

await check('core-health', '/api/health', async (response) => {
  assert(response.status === 200, `expected 200, got ${response.status}`);
  const body = await response.json();
  assert(body?.ok === true, 'health ok flag is not true');
  return { service: body.service, version: body.version };
});

await check('ops-health', '/api/ops/health', async (response) => {
  assert(response.status === 200, `expected 200, got ${response.status}`);
  const body = await response.json();
  assert(body?.ok === true, 'ops health ok flag is not true');
  assert(body?.status === 'healthy', `unexpected status ${body?.status}`);
  return { checks: body.checks };
});

await check('ops-security', '/api/ops/security', async (response) => {
  assert(response.status === 200, `expected 200, got ${response.status}`);
  const body = await response.json();
  assert(body?.ok === true, 'security endpoint ok flag is not true');
  return { security: body.security || body.controls || null };
});

await check('ops-topology', '/api/ops/topology', async (response) => {
  assert(response.status === 200, `expected 200, got ${response.status}`);
  const body = await response.json();
  assert(body?.ok === true, 'topology endpoint ok flag is not true');
  return { topologyPresent: Boolean(body.topology || body.nodes || body.dependencies) };
});

await check('operations-ui', '/admin/operations', async (response) => {
  assert(response.status === 200, `expected 200, got ${response.status}`);
  const text = await response.text();
  assert(text.includes('Operations Control Center'), 'operations UI marker missing');
  return { marker: 'Operations Control Center' };
});

await check('classroom-oauth-start', '/api/integrations/google-classroom/oauth/start', async (response) => {
  assert(response.status === 302, `expected 302, got ${response.status}`);
  const location = response.headers.get('location');
  assert(location, 'Google authorization redirect missing');
  const url = new URL(location);
  assert(url.hostname === 'accounts.google.com', `unexpected OAuth host ${url.hostname}`);
  assert(url.searchParams.get('response_type') === 'code', 'response_type is not code');
  assert(url.searchParams.get('access_type') === 'offline', 'offline access not requested');
  assert(url.searchParams.get('prompt') === 'consent', 'consent prompt not requested');
  const redirectUri = url.searchParams.get('redirect_uri');
  assert(redirectUri === `${base}/api/integrations/google-classroom/oauth/callback`, `unexpected redirect_uri ${redirectUri}`);
  const scopes = new Set((url.searchParams.get('scope') || '').split(' '));
  for (const required of [
    'https://www.googleapis.com/auth/classroom.courses',
    'https://www.googleapis.com/auth/classroom.rosters',
    'https://www.googleapis.com/auth/classroom.coursework.students',
    'https://www.googleapis.com/auth/classroom.profile.emails'
  ]) assert(scopes.has(required), `missing scope ${required}`);
  const state = url.searchParams.get('state') || '';
  assert(state.split('.').length === 2 && state.length > 40, 'signed OAuth state is missing or malformed');
  return { oauthHost: url.hostname, redirectUri, scopeCount: scopes.size, signedState: true };
}, { redirect: 'manual' });

await check('classroom-callback-rejects-invalid-state', '/api/integrations/google-classroom/oauth/callback?code=invalid&state=invalid', async (response) => {
  assert(response.status === 400, `expected 400, got ${response.status}`);
  const text = await response.text();
  assert(text.includes('OAuth state validation failed'), 'invalid-state rejection marker missing');
  return { rejectedInvalidState: true };
});

const report = {
  generatedAt: new Date().toISOString(),
  base,
  ok: failures.length === 0,
  evidence,
  failures
};

console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exit(1);
