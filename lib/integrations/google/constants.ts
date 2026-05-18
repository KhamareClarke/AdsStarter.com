export const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const GOOGLE_ADS_API = 'https://googleads.googleapis.com/v17';

export const GOOGLE_ADS_SCOPES = [
  'https://www.googleapis.com/auth/adwords',
  'openid',
  'email',
  'profile',
].join(' ');

export const YOUTUBE_ADS_SCOPES = [
  'https://www.googleapis.com/auth/adwords',
  'https://www.googleapis.com/auth/youtube',
  'openid',
  'email',
  'profile',
].join(' ');

export function getGoogleRedirectUri(platform: 'google' | 'youtube' = 'google') {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return `${base}/api/integrations/${platform}/callback`;
}
