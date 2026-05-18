import type { AdStatus, CampaignStatus } from '@/lib/db/types';

export function mapFacebookCampaignStatus(status: string): CampaignStatus {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return 'active';
    case 'PAUSED':
      return 'paused';
    case 'ARCHIVED':
    case 'DELETED':
      return 'completed';
    default:
      return 'draft';
  }
}

export function mapFacebookAdStatus(status: string): AdStatus {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return 'active';
    case 'PAUSED':
      return 'paused';
    case 'DISAPPROVED':
    case 'REJECTED':
      return 'rejected';
    default:
      return 'draft';
  }
}

export function mapGoogleCampaignStatus(status: string): CampaignStatus {
  switch (status) {
    case 'ENABLED':
      return 'active';
    case 'PAUSED':
      return 'paused';
    case 'REMOVED':
      return 'completed';
    default:
      return 'draft';
  }
}

export function mapTikTokCampaignStatus(status: string): CampaignStatus {
  switch (status) {
    case 'ENABLE':
    case 'ACTIVE':
      return 'active';
    case 'DISABLE':
    case 'PAUSED':
      return 'paused';
    default:
      return 'draft';
  }
}
