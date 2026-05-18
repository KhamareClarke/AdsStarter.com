const TIKTOK_API = 'https://business-api.tiktok.com/open_api/v1.3';

async function tiktokPost<T>(path: string, accessToken: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${TIKTOK_API}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Access-Token': accessToken,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (json.code !== 0) throw new Error(json.message ?? 'TikTok API error');
  return json.data as T;
}

export async function getCampaigns(accessToken: string, advertiserId: string) {
  return tiktokPost<{ list: Array<{ campaign_id: string; campaign_name: string; operation_status: string }> }>(
    '/campaign/get/',
    accessToken,
    { advertiser_id: advertiserId, page_size: 100 }
  );
}

export async function pauseCampaign(accessToken: string, advertiserId: string, campaignId: string) {
  return tiktokPost('/campaign/status/update/', accessToken, {
    advertiser_id: advertiserId,
    campaign_ids: [campaignId],
    operation_status: 'DISABLE',
  });
}

export async function resumeCampaign(accessToken: string, advertiserId: string, campaignId: string) {
  return tiktokPost('/campaign/status/update/', accessToken, {
    advertiser_id: advertiserId,
    campaign_ids: [campaignId],
    operation_status: 'ENABLE',
  });
}
