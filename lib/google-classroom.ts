type Json = Record<string, unknown>;

const API_BASE = process.env.GOOGLE_CLASSROOM_BASE_URL || 'https://classroom.googleapis.com/v1';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

export const classroomScopes = [
  'https://www.googleapis.com/auth/classroom.courses',
  'https://www.googleapis.com/auth/classroom.rosters',
  'https://www.googleapis.com/auth/classroom.coursework.students',
  'https://www.googleapis.com/auth/classroom.profile.emails'
];

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function getAccessToken() {
  if (process.env.GOOGLE_CLASSROOM_ACCESS_TOKEN) return process.env.GOOGLE_CLASSROOM_ACCESS_TOKEN;

  const clientId = required('GOOGLE_CLASSROOM_CLIENT_ID');
  const clientSecret = required('GOOGLE_CLASSROOM_CLIENT_SECRET');
  const refreshToken = required('GOOGLE_CLASSROOM_REFRESH_TOKEN');

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  });

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store'
  });

  const payload = await response.json() as { access_token?: string; error?: string; error_description?: string };
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || `Google OAuth token exchange failed (${response.status})`);
  }
  return payload.access_token;
}

export function classroomCredentialStatus() {
  const directAccessToken = Boolean(process.env.GOOGLE_CLASSROOM_ACCESS_TOKEN);
  const refreshFlow = Boolean(
    process.env.GOOGLE_CLASSROOM_CLIENT_ID &&
    process.env.GOOGLE_CLASSROOM_CLIENT_SECRET &&
    process.env.GOOGLE_CLASSROOM_REFRESH_TOKEN
  );
  return {
    configured: directAccessToken || refreshFlow,
    credentialMode: directAccessToken ? 'access_token' : refreshFlow ? 'refresh_token' : 'not_configured',
    adminGateConfigured: Boolean(process.env.RTPU_CLASSROOM_INTEGRATION_KEY)
  };
}

export function assertClassroomAdmin(request: Request) {
  const expected = process.env.RTPU_CLASSROOM_INTEGRATION_KEY;
  if (!expected) throw new Error('Google Classroom write gate is not configured');
  const supplied = request.headers.get('x-rtpu-classroom-key');
  if (!supplied || supplied !== expected) throw new Error('Unauthorized Google Classroom connector request');
}

async function classroomFetch(path: string, init: RequestInit = {}) {
  const accessToken = await getAccessToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: 'application/json',
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...(init.headers || {})
    },
    cache: 'no-store'
  });
  const text = await response.text();
  let payload: unknown = null;
  try { payload = text ? JSON.parse(text) : {}; } catch { payload = { raw: text }; }
  if (!response.ok) {
    const detail = typeof payload === 'object' && payload ? JSON.stringify(payload) : String(payload);
    throw new Error(`Google Classroom API ${response.status}: ${detail}`);
  }
  return payload;
}

export const googleClassroom = {
  listCourses: (pageSize = 50) => classroomFetch(`/courses?pageSize=${Math.min(Math.max(pageSize, 1), 100)}`),
  createCourse: (course: Json) => classroomFetch('/courses', { method: 'POST', body: JSON.stringify(course) }),
  listTeachers: (courseId: string) => classroomFetch(`/courses/${encodeURIComponent(courseId)}/teachers`),
  addTeacher: (courseId: string, userId: string) => classroomFetch(`/courses/${encodeURIComponent(courseId)}/teachers`, { method: 'POST', body: JSON.stringify({ userId }) }),
  listStudents: (courseId: string) => classroomFetch(`/courses/${encodeURIComponent(courseId)}/students`),
  addStudent: (courseId: string, userId: string, enrollmentCode?: string) => classroomFetch(`/courses/${encodeURIComponent(courseId)}/students${enrollmentCode ? `?enrollmentCode=${encodeURIComponent(enrollmentCode)}` : ''}`, { method: 'POST', body: JSON.stringify({ userId }) }),
  listCourseWork: (courseId: string) => classroomFetch(`/courses/${encodeURIComponent(courseId)}/courseWork`),
  createCourseWork: (courseId: string, courseWork: Json) => classroomFetch(`/courses/${encodeURIComponent(courseId)}/courseWork`, { method: 'POST', body: JSON.stringify(courseWork) })
};
