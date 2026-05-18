import { createAdminSupabase } from '@/lib/supabase/admin';
import { decryptToken, encryptToken } from './crypto';
import type { AdPlatform } from '@/lib/db/types';

export interface StoredAdAccount {
  id: string;
  user_id: string;
  platform: AdPlatform;
  account_name: string;
  external_account_id: string | null;
  access_token: string | null;
  refresh_token: string | null;
  access_token_expiry: string | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
}

export async function upsertAdAccount(input: {
  userId: string;
  platform: AdPlatform;
  accountName: string;
  externalAccountId: string;
  accessToken: string;
  refreshToken?: string;
  accessTokenExpiry?: Date;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createAdminSupabase();
  const { data, error } = await supabase
    .from('ad_accounts')
    .upsert(
      {
        user_id: input.userId,
        platform: input.platform,
        account_name: input.accountName,
        external_account_id: input.externalAccountId,
        access_token: encryptToken(input.accessToken),
        refresh_token: input.refreshToken ? encryptToken(input.refreshToken) : null,
        access_token_expiry: input.accessTokenExpiry?.toISOString() ?? null,
        is_active: true,
        metadata: input.metadata ?? {},
        connected_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,platform,external_account_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data as StoredAdAccount;
}

export async function getAdAccountsByPlatform(userId: string, platform: AdPlatform) {
  const supabase = createAdminSupabase();
  const { data, error } = await supabase
    .from('ad_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('platform', platform)
    .eq('is_active', true);

  if (error) throw error;
  return (data ?? []) as StoredAdAccount[];
}

export async function getDecryptedAccessToken(account: StoredAdAccount): Promise<string> {
  if (!account.access_token) throw new Error('No access token on account');
  return decryptToken(account.access_token);
}

export async function updateAccountTokens(
  accountId: string,
  tokens: { accessToken: string; refreshToken?: string; expiry?: Date }
) {
  const supabase = createAdminSupabase();
  const { error } = await supabase
    .from('ad_accounts')
    .update({
      access_token: encryptToken(tokens.accessToken),
      refresh_token: tokens.refreshToken ? encryptToken(tokens.refreshToken) : undefined,
      access_token_expiry: tokens.expiry?.toISOString(),
    })
    .eq('id', accountId);

  if (error) throw error;
}

export async function markAccountSynced(accountId: string) {
  const supabase = createAdminSupabase();
  await supabase
    .from('ad_accounts')
    .update({ last_synced: new Date().toISOString(), metrics_last_synced: new Date().toISOString() })
    .eq('id', accountId);
}
