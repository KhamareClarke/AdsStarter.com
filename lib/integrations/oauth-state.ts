import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

const COOKIE_MAX_AGE = 600; // 10 minutes

export type OAuthPlatform = 'facebook' | 'google' | 'tiktok' | 'youtube';

export function createOAuthState(platform: OAuthPlatform, userId: string, returnTo = '/dashboard/accounts') {
  const state = randomBytes(24).toString('hex');
  return { state, payload: { platform, userId, returnTo, state } };
}

export async function setOAuthStateCookie(platform: OAuthPlatform, payload: object) {
  const cookieStore = await cookies();
  cookieStore.set(`oauth_${platform}`, JSON.stringify(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

export async function consumeOAuthStateCookie<T extends { state: string }>(
  platform: OAuthPlatform,
  state: string
): Promise<T | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(`oauth_${platform}`)?.value;
  cookieStore.delete(`oauth_${platform}`);

  if (!raw) return null;
  try {
    const payload = JSON.parse(raw) as T;
    if (payload.state !== state) return null;
    return payload;
  } catch {
    return null;
  }
}
