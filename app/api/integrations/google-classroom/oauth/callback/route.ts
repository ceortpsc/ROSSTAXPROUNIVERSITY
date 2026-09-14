import { createHash, randomUUID } from 'node:crypto';
import { createHandoff } from '../_store';
import { verifyGoogleClassroomOAuthState } from '../../../../../../lib/oauth-state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type GoogleTokenResponse = {
  refresh_token?: string;
  access_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type ClassroomProfile = {
  id?: string;
  emailAddress?: string;
  name?: { fullName?: string };
};

type ClassroomCourses = {
  courses?: Array<{ id?: string; name?: string; courseState?: string }>;
};

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function page(title: string, body: string, status = 200) {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(title)}</title><style>body{font-family:system-ui;background:#f7f2e8;color:#172033;padding:32px}.card{max-width:860px;margin:auto;background:white;border:1px solid #ddd6c8;border-radius:18px;padding:28px}h1{color:#0b1f3a}.code{font-family:ui-monospace,monospace;background:#f1f5f9;padding:12px;border-radius:10px;word-break:break-all;white-space:pre-wrap}.ok{color:#166534;font-weight:800}.warn{color:#92400e;font-weight:700}</style></head><body><main class="card">${body}</main></body></html>`,
    { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } }
  );
}

function sha256Prefix(value: string, length = 24) {
  return createHash('sha256').update(value).digest('hex').slice(0, length);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const oauthError = url.searchParams.get('error');
  if (oauthError) {
    return page(
      'Google Classroom authorization declined',
      `<h1>Google Classroom authorization was not completed</h1><p>${escapeHtml(oauthError)}</p>`,
      400
    );
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !verifyGoogleClassroomOAuthState(state)) {
    return page(
      'Invalid OAuth callback',
      '<h1>OAuth state validation failed</h1><p>Restart authorization from the RTPU Google Classroom connector. The authorization link must be started fresh and completed within 10 minutes.</p>',
      400
    );
  }

  const clientId = process.env.GOOGLE_CLASSROOM_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLASSROOM_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return page(
      'Connector not configured',
      '<h1>Google OAuth client credentials are missing</h1><p>Configure the client ID and client secret in the deployment environment.</p>',
      503
    );
  }

  const redirectUri =
    process.env.GOOGLE_CLASSROOM_REDIRECT_URI ||
    `${url.origin}/api/integrations/google-classroom/oauth/callback`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    }),
    cache: 'no-store'
  });

  const token = (await tokenResponse.json()) as GoogleTokenResponse;
  if (!tokenResponse.ok) {
    return page(
      'OAuth exchange failed',
      `<h1>Google token exchange failed</h1><p>${escapeHtml(token.error_description || token.error || 'Unknown OAuth error')}</p>`,
      502
    );
  }

  if (!token.refresh_token || !token.access_token) {
    return page(
      'Offline authorization incomplete',
      '<h1>Google did not issue the required offline credentials</h1><p>Restart authorization with consent so Google can issue both an access token and refresh token.</p>',
      409
    );
  }

  const authHeaders = { Authorization: `Bearer ${token.access_token}` };
  const [profileResponse, coursesResponse] = await Promise.all([
    fetch('https://classroom.googleapis.com/v1/userProfiles/me', {
      headers: authHeaders,
      cache: 'no-store'
    }),
    fetch('https://classroom.googleapis.com/v1/courses?pageSize=1', {
      headers: authHeaders,
      cache: 'no-store'
    })
  ]);

  const profile = (await profileResponse.json().catch(() => ({}))) as ClassroomProfile;
  const courses = (await coursesResponse.json().catch(() => ({}))) as ClassroomCourses;
  const emailDomain = profile.emailAddress?.split('@')[1]?.toLowerCase() || null;
  const accountEvidenceSource = `${profile.id || 'unknown'}|${profile.emailAddress || 'unknown'}`;
  const receiptId = randomUUID();
  const receipt = {
    schemaVersion: '1.0',
    receiptId,
    evidenceType: 'google-classroom-oauth-consent',
    system: 'ROSSTAXPROUNIVERSITY',
    environment: process.env.RTPU_DEPLOY_ENV || 'production',
    authorizedAtUtc: new Date().toISOString(),
    oauth: {
      tokenExchange: 'success',
      refreshTokenIssued: true,
      accessTokenIssued: true,
      expiresInSeconds: token.expires_in ?? null,
      grantedScopes: token.scope ? token.scope.split(' ').filter(Boolean).sort() : [],
      refreshTokenFingerprintSha256Prefix: sha256Prefix(token.refresh_token),
      clientIdSuffix: clientId.slice(-20),
      redirectUri
    },
    googleClassroom: {
      userProfilesMeHttpStatus: profileResponse.status,
      coursesListHttpStatus: coursesResponse.status,
      profileReadAuthorized: profileResponse.ok,
      coursesReadAuthorized: coursesResponse.ok,
      returnedCourseCount: Array.isArray(courses.courses) ? courses.courses.length : 0,
      accountEvidenceSha256Prefix: sha256Prefix(accountEvidenceSource),
      emailDomain
    },
    endToEndAuthorizationVerified: profileResponse.ok && coursesResponse.ok
  };

  if (!profileResponse.ok || !coursesResponse.ok) {
    console.error('[RTPU_GOOGLE_CLASSROOM_CONSENT_EVIDENCE_FAILED]', JSON.stringify(receipt));
    return page(
      'Google Classroom verification failed',
      `<p class="warn">GOOGLE OAUTH TOKEN EXCHANGE SUCCEEDED, BUT CLASSROOM API VERIFICATION FAILED</p><h1>Authorization is not production-verified</h1><p>User profile status: ${profileResponse.status}; course-list status: ${coursesResponse.status}.</p><div class="code">${escapeHtml(JSON.stringify(receipt, null, 2))}</div>`,
      502
    );
  }

  const handoff = createHandoff(token.refresh_token);
  console.info('[RTPU_GOOGLE_CLASSROOM_CONSENT_EVIDENCE]', JSON.stringify(receipt));

  return page(
    'Google Classroom authorized',
    `<p class="ok">GOOGLE CLASSROOM OAUTH CONSENT AND API AUTHORIZATION VERIFIED</p><h1>Production consent evidence issued</h1><p>Google issued offline credentials and RTPU successfully completed authorized reads against both <strong>userProfiles/me</strong> and <strong>courses.list</strong>.</p><h2>Evidence receipt</h2><div class="code">${escapeHtml(JSON.stringify(receipt, null, 2))}</div><h2>Secure credential handoff</h2><p>The refresh token is <strong>not displayed</strong>. Send only the one-time handoff ID below back to ChatGPT so it can be transferred into the deployment secret store.</p><div class="code">${escapeHtml(handoff.id)}</div><p>This handoff expires in 10 minutes.</p>`
  );
}
