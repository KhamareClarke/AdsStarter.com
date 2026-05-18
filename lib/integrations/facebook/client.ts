import { FB_GRAPH_BASE } from './constants';

export class FacebookApiError extends Error {
  constructor(
    message: string,
    public code?: number,
    public subcode?: number
  ) {
    super(message);
    this.name = 'FacebookApiError';
  }
}

export async function facebookGet<T>(
  path: string,
  accessToken: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(path.startsWith('http') ? path : `${FB_GRAPH_BASE}${path}`);
  url.searchParams.set('access_token', accessToken);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString());
  const json = await res.json();

  if (json.error) {
    throw new FacebookApiError(
      json.error.message ?? 'Facebook API error',
      json.error.code,
      json.error.error_subcode
    );
  }

  return json as T;
}

export async function facebookPost<T>(
  path: string,
  accessToken: string,
  body: Record<string, unknown>
): Promise<T> {
  const url = new URL(path.startsWith('http') ? path : `${FB_GRAPH_BASE}${path}`);
  url.searchParams.set('access_token', accessToken);

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (json.error) {
    throw new FacebookApiError(json.error.message ?? 'Facebook API error', json.error.code);
  }
  return json as T;
}

export async function facebookDelete(path: string, accessToken: string): Promise<{ success: boolean }> {
  const url = new URL(path.startsWith('http') ? path : `${FB_GRAPH_BASE}${path}`);
  url.searchParams.set('access_token', accessToken);

  const res = await fetch(url.toString(), { method: 'DELETE' });
  const json = await res.json();
  if (json.error) {
    throw new FacebookApiError(json.error.message ?? 'Facebook API error', json.error.code);
  }
  return json;
}
