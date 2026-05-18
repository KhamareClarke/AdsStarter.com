import { searchGoogleAds } from './oauth';

export async function getAdGroups(accessToken: string, customerId: string, campaignId: string) {
  const query = `
    SELECT ad_group.id, ad_group.name, ad_group.status, ad_group.campaign
    FROM ad_group
    WHERE ad_group.campaign = 'customers/${customerId.replace('customers/', '')}/campaigns/${campaignId}'
      AND ad_group.status != 'REMOVED'
  `;
  return searchGoogleAds(accessToken, customerId, query);
}

export async function pauseAdGroup(
  accessToken: string,
  customerId: string,
  adGroupId: string
) {
  // Mutations require google-ads-api client library; stub for Phase 1
  return { adGroupId, status: 'PAUSED', note: 'Use Google Ads UI or Phase 1.1 mutation API' };
}
