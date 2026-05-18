const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const GHL_API_VERSION = '2021-07-28';

export class GhlApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public body?: unknown
  ) {
    super(message);
    this.name = 'GhlApiError';
  }
}

function getConfig() {
  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;
  if (!apiKey) throw new Error('GHL_API_KEY is not configured');
  if (!locationId) throw new Error('GHL_LOCATION_ID is not configured');
  return { apiKey, locationId };
}

export async function ghlRequest<T>(
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const { apiKey, locationId } = getConfig();
  const url = path.startsWith('http') ? path : `${GHL_API_BASE}${path}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    Version: GHL_API_VERSION,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify({ ...body, locationId: body.locationId ?? locationId }) : undefined,
  });

  const text = await res.text();
  let json: unknown = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const msg =
      (json as { message?: string })?.message ??
      (json as { error?: string })?.error ??
      `GHL API error ${res.status}`;
    throw new GhlApiError(msg, res.status, json);
  }

  return json as T;
}

export function getGhlLocationId() {
  return getConfig().locationId;
}
