import { facebookGet, facebookPost } from './client';

export interface FbAd {
  id: string;
  name: string;
  status: string;
  creative?: { id?: string };
}

const AD_FIELDS = 'id,name,status,creative';

export async function getAds(accessToken: string, campaignId: string): Promise<FbAd[]> {
  const result = await facebookGet<{ data: FbAd[] }>(`/${campaignId}/ads`, accessToken, {
    fields: AD_FIELDS,
    limit: '500',
  });
  return result.data ?? [];
}

export async function createAd(
  accessToken: string,
  adSetId: string,
  data: { name: string; adset_id: string; creative: { creative_id: string }; status?: string }
) {
  return facebookPost<{ id: string }>(`/${adSetId}/ads`, accessToken, {
    name: data.name,
    adset_id: data.adset_id,
    creative: { creative_id: data.creative.creative_id },
    status: data.status ?? 'PAUSED',
  });
}

export async function updateAd(accessToken: string, adId: string, updates: Record<string, unknown>) {
  return facebookPost<{ success: boolean }>(`/${adId}`, accessToken, updates);
}

export async function pauseAd(accessToken: string, adId: string) {
  return updateAd(accessToken, adId, { status: 'PAUSED' });
}

export async function resumeAd(accessToken: string, adId: string) {
  return updateAd(accessToken, adId, { status: 'ACTIVE' });
}

export async function createAdVariation(
  accessToken: string,
  originalAdId: string,
  variation: { name: string; status?: string }
) {
  const original = await facebookGet<{ name: string; adset_id: string; creative: { id: string } }>(
    `/${originalAdId}`,
    accessToken,
    { fields: 'name,adset_id,creative' }
  );

  return createAd(accessToken, original.adset_id, {
    name: variation.name ?? `${original.name} (Variation)`,
    adset_id: original.adset_id,
    creative: { creative_id: original.creative.id },
    status: variation.status ?? 'PAUSED',
  });
}
