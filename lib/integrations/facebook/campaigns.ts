import { facebookDelete, facebookGet, facebookPost } from './client';

export interface FbCampaign {
  id: string;
  name: string;
  status: string;
  objective?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  stop_time?: string;
}

const CAMPAIGN_FIELDS = 'id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time';

export async function getCampaigns(accessToken: string, adAccountId: string): Promise<FbCampaign[]> {
  const actId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
  const result = await facebookGet<{ data: FbCampaign[] }>(
    `/${actId}/campaigns`,
    accessToken,
    { fields: CAMPAIGN_FIELDS, limit: '500' }
  );
  return result.data ?? [];
}

export async function createCampaign(
  accessToken: string,
  adAccountId: string,
  data: {
    name: string;
    objective: string;
    status?: string;
    daily_budget?: number;
    lifetime_budget?: number;
    start_time?: string;
    stop_time?: string;
    special_ad_categories?: string[];
  }
) {
  const actId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
  const payload: Record<string, unknown> = {
    name: data.name,
    objective: data.objective,
    status: data.status ?? 'PAUSED',
    special_ad_categories: data.special_ad_categories ?? [],
  };
  if (data.daily_budget) payload.daily_budget = Math.round(data.daily_budget * 100);
  if (data.lifetime_budget) payload.lifetime_budget = Math.round(data.lifetime_budget * 100);
  if (data.start_time) payload.start_time = data.start_time;
  if (data.stop_time) payload.stop_time = data.stop_time;

  return facebookPost<{ id: string }>(`/${actId}/campaigns`, accessToken, payload);
}

export async function updateCampaign(
  accessToken: string,
  campaignId: string,
  updates: Record<string, unknown>
) {
  const payload = { ...updates };
  if (typeof payload.daily_budget === 'number') {
    payload.daily_budget = Math.round(payload.daily_budget * 100);
  }
  if (typeof payload.lifetime_budget === 'number') {
    payload.lifetime_budget = Math.round(payload.lifetime_budget * 100);
  }
  return facebookPost<{ success: boolean }>(`/${campaignId}`, accessToken, payload);
}

export async function pauseCampaign(accessToken: string, campaignId: string) {
  return updateCampaign(accessToken, campaignId, { status: 'PAUSED' });
}

export async function resumeCampaign(accessToken: string, campaignId: string) {
  return updateCampaign(accessToken, campaignId, { status: 'ACTIVE' });
}

export async function deleteCampaign(accessToken: string, campaignId: string) {
  return facebookDelete(`/${campaignId}`, accessToken);
}
