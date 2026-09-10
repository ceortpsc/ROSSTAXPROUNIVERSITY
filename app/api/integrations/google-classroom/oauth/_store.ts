type PendingCredential = { refreshToken:string; createdAt:number; expiresAt:number };

declare global {
  var __rtpuClassroomOAuthHandoffs: Map<string, PendingCredential> | undefined;
}

const store = globalThis.__rtpuClassroomOAuthHandoffs ?? new Map<string, PendingCredential>();
globalThis.__rtpuClassroomOAuthHandoffs = store;

function purgeExpired() {
  const now = Date.now();
  for (const [id, item] of store.entries()) if (item.expiresAt <= now) store.delete(id);
}

export function createHandoff(refreshToken:string) {
  purgeExpired();
  const id = crypto.randomUUID();
  const createdAt = Date.now();
  store.set(id, { refreshToken, createdAt, expiresAt: createdAt + 10 * 60 * 1000 });
  return { id, expiresAt: createdAt + 10 * 60 * 1000 };
}

export function consumeHandoff(id:string) {
  purgeExpired();
  const item = store.get(id);
  if (!item) return null;
  store.delete(id);
  return item;
}
