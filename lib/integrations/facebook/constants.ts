export const FB_GRAPH_VERSION = 'v21.0';
export const FB_GRAPH_BASE = `https://graph.facebook.com/${FB_GRAPH_VERSION}`;

export const FB_SCOPES = [
  'ads_management',
  'ads_read',
  'business_management',
].join(',');

export function getFacebookRedirectUri() {
  return `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/integrations/facebook/callback`;
}
