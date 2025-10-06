
export interface SubscriptionKeys {
  auth: string;
  p256dh: string;
}

export interface SubscriptionRecord {
  endpoint: string;
  keys: SubscriptionKeys;
}

export function buildSubscriptionId(endpoint: string): string {
  return endpoint.replace(/\//g, '_');
}

export function normalizeSubscriptionPayload(payload: unknown): SubscriptionRecord | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const endpoint = typeof (payload as { endpoint?: unknown }).endpoint === 'string'
    ? (payload as { endpoint: string }).endpoint
    : null;

  const keysRaw = (payload as { keys?: unknown }).keys;
  const keys = keysRaw && typeof keysRaw === 'object'
    ? keysRaw as Record<string, unknown>
    : null;

  const auth = keys && typeof keys.auth === 'string' ? keys.auth : null;
  const p256dh = keys && typeof keys.p256dh === 'string' ? keys.p256dh : null;

  if (!endpoint || !auth || !p256dh) {
    return null;
  }

  return {
    endpoint,
    keys: { auth, p256dh },
  };
}
