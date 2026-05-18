/**
 * Canonical app URL for auth emails, OAuth callbacks, and share links.
 * Set NEXT_PUBLIC_APP_URL in Vercel (e.g. https://adsstarter.com).
 */
export function getAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
  }

  return 'http://localhost:3000';
}
