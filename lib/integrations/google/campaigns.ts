import { searchGoogleAds } from './oauth';
import { mapGoogleCampaignStatus } from '@/lib/integrations/status-map';

export interface GoogleCampaignRow {
  campaign: {
    id: string;
    name: string;
    status: string;
    advertisingChannelType?: string;
  };
  campaignBudget?: {
    amountMicros?: string;
  };
}

export async function getCampaigns(accessToken: string, customerId: string) {
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      campaign_budget.amount_micros
    FROM campaign
    WHERE campaign.status != 'REMOVED'
    ORDER BY campaign.id
  `;
  return searchGoogleAds<GoogleCampaignRow>(accessToken, customerId, query);
}

export function parseGoogleCampaign(row: GoogleCampaignRow) {
  const budgetMicros = row.campaignBudget?.amountMicros;
  return {
    externalId: row.campaign.id,
    name: row.campaign.name,
    status: mapGoogleCampaignStatus(row.campaign.status),
    externalStatus: row.campaign.status,
    channel: row.campaign.advertisingChannelType,
    budgetDaily: budgetMicros ? parseInt(budgetMicros, 10) / 1_000_000 / 30 : null,
  };
}

export async function getYouTubeCampaigns(accessToken: string, customerId: string) {
  const query = `
    SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type
    FROM campaign
    WHERE campaign.advertising_channel_type = 'VIDEO'
      AND campaign.status != 'REMOVED'
  `;
  return searchGoogleAds<GoogleCampaignRow>(accessToken, customerId, query);
}
