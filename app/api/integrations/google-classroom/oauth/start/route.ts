import { createGoogleClassroomOAuthState } from '../../../../../../lib/oauth-state';

const scopes = [
  'https://www.googleapis.com/auth/classroom.courses',
  'https://www.googleapis.com/auth/classroom.rosters',
  'https://www.googleapis.com/auth/classroom.coursework.students',
  'https://www.googleapis.com/auth/classroom.profile.emails'
];

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLASSROOM_CLIENT_ID;
  if (!clientId) {
    return Response.json(
      { ok:false, error:'GOOGLE_CLASSROOM_CLIENT_ID is not configured' },
      { status:503 }
    );
  }

  const origin = new URL(request.url).origin;
  const redirectUri = process.env.GOOGLE_CLASSROOM_REDIRECT_URI || `${origin}/api/integrations/google-classroom/oauth/callback`;
  const state = createGoogleClassroomOAuthState();

  const authorizationUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authorizationUrl.searchParams.set('client_id', clientId);
  authorizationUrl.searchParams.set('redirect_uri', redirectUri);
  authorizationUrl.searchParams.set('response_type', 'code');
  authorizationUrl.searchParams.set('access_type', 'offline');
  authorizationUrl.searchParams.set('prompt', 'consent');
  authorizationUrl.searchParams.set('include_granted_scopes', 'true');
  authorizationUrl.searchParams.set('scope', scopes.join(' '));
  authorizationUrl.searchParams.set('state', state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorizationUrl.toString(),
      'Cache-Control': 'no-store'
    }
  });
}
