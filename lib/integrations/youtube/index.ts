/**
 * YouTube Ads are managed via Google Ads API with VIDEO channel type.
 * OAuth uses Google with YouTube scope; sync filters VIDEO campaigns.
 */
export {
  buildGoogleAuthUrl as buildYouTubeAuthUrl,
  exchangeGoogleCode,
  refreshGoogleAccessToken,
  listAccessibleCustomers,
} from '../google/oauth';

export { getYouTubeCampaigns } from '../google/campaigns';
export { syncGoogleAccount as syncYouTubeAccount, syncAllGoogleForUser as syncAllYouTubeForUser } from '../google/sync';
