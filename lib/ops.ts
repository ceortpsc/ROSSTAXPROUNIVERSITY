export const SERVICE_NAME = 'ROSSTAXPROUNIVERSITY';
export const SERVICE_ENV = process.env.RTPU_DEPLOY_ENV || 'production';

export function runtimeSnapshot() {
  const mem = process.memoryUsage();
  return {
    service: SERVICE_NAME,
    environment: SERVICE_ENV,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    node: process.version,
    memory: {
      rssMB: Math.round(mem.rss / 1024 / 1024),
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024)
    }
  };
}

export function integrationReadiness() {
  return {
    googleClassroomClientId: Boolean(process.env.GOOGLE_CLASSROOM_CLIENT_ID),
    googleClassroomClientSecret: Boolean(process.env.GOOGLE_CLASSROOM_CLIENT_SECRET),
    googleClassroomRedirectUri: Boolean(process.env.GOOGLE_CLASSROOM_REDIRECT_URI),
    googleClassroomRefreshToken: Boolean(process.env.GOOGLE_CLASSROOM_REFRESH_TOKEN),
    opsAdminKey: Boolean(process.env.OPS_ADMIN_KEY)
  };
}

export function noStoreJson(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('cache-control', 'no-store, max-age=0');
  headers.set('content-type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(body, null, 2), { ...init, headers });
}

export function authorizeOps(request: Request) {
  const configured = process.env.OPS_ADMIN_KEY;
  if (!configured) return false;
  const supplied = request.headers.get('x-ops-key') || '';
  return supplied.length > 0 && supplied === configured;
}
