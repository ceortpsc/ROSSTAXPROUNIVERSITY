import { createHandoff } from '../_store';
import { verifyGoogleClassroomOAuthState } from '../../../../../../lib/oauth-state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function page(title:string, body:string, status=200) {
  return new Response(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title><style>body{font-family:system-ui;background:#f7f2e8;color:#172033;padding:32px}.card{max-width:760px;margin:auto;background:white;border:1px solid #ddd6c8;border-radius:18px;padding:28px}h1{color:#0b1f3a}.code{font-family:ui-monospace,monospace;background:#f1f5f9;padding:12px;border-radius:10px;word-break:break-all}.ok{color:#166534;font-weight:800}</style></head><body><main class="card">${body}</main></body></html>`, { status, headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'} });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const oauthError = url.searchParams.get('error');
  if (oauthError) return page('Google Classroom authorization declined', `<h1>Google Classroom authorization was not completed</h1><p>${oauthError}</p>`, 400);

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !verifyGoogleClassroomOAuthState(state)) {
    return page('Invalid OAuth callback', '<h1>OAuth state validation failed</h1><p>Restart authorization from the RTPSC Google Classroom connector. The authorization link must be started fresh and completed within 10 minutes.</p>', 400);
  }

  const clientId = process.env.GOOGLE_CLASSROOM_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLASSROOM_CLIENT_SECRET;
  if (!clientId || !clientSecret) return page('Connector not configured', '<h1>Google OAuth client credentials are missing</h1><p>Configure the client ID and client secret in the deployment environment.</p>', 503);

  const redirectUri = process.env.GOOGLE_CLASSROOM_REDIRECT_URI || `${url.origin}/api/integrations/google-classroom/oauth/callback`;
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method:'POST',
    headers:{'content-type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({ client_id:clientId, client_secret:clientSecret, code, grant_type:'authorization_code', redirect_uri:redirectUri }),
    cache:'no-store'
  });
  const token = await tokenResponse.json() as { refresh_token?:string; access_token?:string; expires_in?:number; error?:string; error_description?:string };
  if (!tokenResponse.ok) return page('OAuth exchange failed', `<h1>Google token exchange failed</h1><p>${token.error_description || token.error || 'Unknown OAuth error'}</p>`, 502);
  if (!token.refresh_token) return page('Refresh token not issued', '<h1>Authorization completed, but no refresh token was issued</h1><p>Revoke the prior grant if necessary and restart authorization with consent so Google can issue an offline refresh token.</p>', 409);

  const handoff = createHandoff(token.refresh_token);
  return page('Google Classroom authorized', `<p class="ok">GOOGLE CLASSROOM OAUTH AUTHORIZATION SUCCESSFUL</p><h1>Secure credential handoff created</h1><p>The refresh token is <strong>not displayed</strong>. Send only the one-time handoff ID below back to ChatGPT so it can be transferred into the Render deployment secret and consumed once.</p><div class="code">${handoff.id}</div><p>This handoff expires in 10 minutes.</p>`);
}
