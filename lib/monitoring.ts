type EventPayload = Record<string, unknown>;

export function trackEvent(name: string, payload?: EventPayload) {
  if (process.env.NODE_ENV === 'development') {
    console.debug('[track]', name, payload);
    return;
  }
  if (typeof window !== 'undefined' && 'va' in window) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).va?.('event', { name, ...payload });
    } catch {
      /* ignore */
    }
  }
}

export function trackApiTiming(route: string, durationMs: number, status: number) {
  if (durationMs > 2000) {
    console.warn(`[slow-api] ${route} ${durationMs}ms status=${status}`);
  }
  trackEvent('api_timing', { route, durationMs, status });
}

export async function withApiTiming<T>(
  route: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    trackApiTiming(route, Date.now() - start, 200);
    return result;
  } catch (err) {
    trackApiTiming(route, Date.now() - start, 500);
    throw err;
  }
}
