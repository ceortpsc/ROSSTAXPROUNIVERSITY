import { randomUUID } from 'node:crypto';

type HandoffRecord = {
  id: string;
  refreshToken: string;
  createdAt: string;
  expiresAt: string;
};

const TTL_MS = 10 * 60 * 1000;
const handoffs = new Map<string, HandoffRecord>();

function cleanup() {
  const now = Date.now();
  for (const [id, record] of handoffs.entries()) {
    if (Date.parse(record.expiresAt) <= now) handoffs.delete(id);
  }
}

export function createHandoff(refreshToken: string) {
  cleanup();
  const now = Date.now();
  const record: HandoffRecord = {
    id: randomUUID(),
    refreshToken,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + TTL_MS).toISOString()
  };
  handoffs.set(record.id, record);
  return { id: record.id, createdAt: record.createdAt, expiresAt: record.expiresAt };
}

export function consumeHandoff(id: string) {
  cleanup();
  const record = handoffs.get(id);
  if (!record) return null;
  handoffs.delete(id);
  return record;
}
