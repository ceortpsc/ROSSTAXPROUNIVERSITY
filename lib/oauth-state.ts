import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const MAX_STATE_AGE_MS = 10 * 60 * 1000;
const CLOCK_SKEW_MS = 60 * 1000;

function stateSecret() {
  const value = process.env.GOOGLE_CLASSROOM_OAUTH_STATE_SECRET || process.env.GOOGLE_CLASSROOM_CLIENT_SECRET;
  if (!value) throw new Error('Google Classroom OAuth state secret is not configured');
  return value;
}

export function createGoogleClassroomOAuthState() {
  const payload = `${Date.now()}.${randomBytes(24).toString('hex')}`;
  const encoded = Buffer.from(payload, 'utf8').toString('base64url');
  const signature = createHmac('sha256', stateSecret()).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifyGoogleClassroomOAuthState(state: string | null) {
  if (!state) return false;

  const [encoded, signature, extra] = state.split('.');
  if (!encoded || !signature || extra) return false;

  const expected = createHmac('sha256', stateSecret()).update(encoded).digest('base64url');
  const suppliedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (suppliedBuffer.length !== expectedBuffer.length || !timingSafeEqual(suppliedBuffer, expectedBuffer)) return false;

  let payload: string;
  try {
    payload = Buffer.from(encoded, 'base64url').toString('utf8');
  } catch {
    return false;
  }

  const separator = payload.indexOf('.');
  if (separator < 1) return false;
  const issuedAt = Number(payload.slice(0, separator));
  const nonce = payload.slice(separator + 1);
  if (!Number.isFinite(issuedAt) || nonce.length < 32) return false;

  const age = Date.now() - issuedAt;
  return age >= -CLOCK_SKEW_MS && age <= MAX_STATE_AGE_MS;
}
