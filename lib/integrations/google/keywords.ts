import { searchGoogleAds } from './oauth';

export async function getKeywords(accessToken: string, customerId: string, adGroupId: string) {
  const customer = customerId.replace('customers/', '');
  const query = `
    SELECT
      ad_group_criterion.criterion_id,
      ad_group_criterion.keyword.text,
      ad_group_criterion.keyword.match_type,
      ad_group_criterion.status,
      ad_group_criterion.effective_cpc_bid_micros
    FROM keyword_view
    WHERE ad_group.id = ${adGroupId}
      AND ad_group_criterion.status != 'REMOVED'
  `;
  return searchGoogleAds(accessToken, customer, query);
}

export async function updateKeywordBid(
  _accessToken: string,
  _customerId: string,
  keywordId: string,
  newBidMicros: number
) {
  return { keywordId, bidMicros: newBidMicros, note: 'Mutation API — Phase 1.1' };
}
