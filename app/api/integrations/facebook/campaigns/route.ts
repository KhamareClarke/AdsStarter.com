import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdAccountsByPlatform, getDecryptedAccessToken } from '@/lib/integrations/accounts';
import {
  createCampaign,
  getCampaigns,
  pauseCampaign,
  resumeCampaign,
} from '@/lib/integrations/facebook/campaigns';
import { handleApiError, AppError } from '@/lib/error-handler';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const accountId = request.nextUrl.searchParams.get('accountId');
    const accounts = await getAdAccountsByPlatform(user.id, 'facebook');
    const account = accountId
      ? accounts.find((a) => a.id === accountId)
      : accounts[0];

    if (!account?.external_account_id) {
      throw new AppError('No Facebook account connected', 404, 'Connect a Facebook account first');
    }

    const token = await getDecryptedAccessToken(account);
    const campaigns = await getCampaigns(token, account.external_account_id);

    return NextResponse.json({ campaigns, accountId: account.id });
  } catch (error) {
    const { status, body } = await handleApiError(error, 'api/integrations/facebook/campaigns GET');
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const accounts = await getAdAccountsByPlatform(user.id, 'facebook');
    const account = accounts.find((a) => a.id === body.accountId) ?? accounts[0];
    if (!account?.external_account_id) {
      throw new AppError('No Facebook account', 404);
    }

    const token = await getDecryptedAccessToken(account);
    const created = await createCampaign(token, account.external_account_id, {
      name: body.name,
      objective: body.objective ?? 'OUTCOME_TRAFFIC',
      daily_budget: body.daily_budget,
      status: body.status ?? 'PAUSED',
    });

    return NextResponse.json({ success: true, campaignId: created.id });
  } catch (error) {
    const { status, body } = await handleApiError(error, 'api/integrations/facebook/campaigns POST');
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { campaignId, action, updates } = await request.json();
    if (!campaignId) throw new AppError('campaignId required', 400);

    const accounts = await getAdAccountsByPlatform(user.id, 'facebook');
    const token = await getDecryptedAccessToken(accounts[0]);

    if (action === 'pause') await pauseCampaign(token, campaignId);
    else if (action === 'resume') await resumeCampaign(token, campaignId);
    else if (updates) {
      const { updateCampaign } = await import('@/lib/integrations/facebook/campaigns');
      await updateCampaign(token, campaignId, updates);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const { status, body } = await handleApiError(error, 'api/integrations/facebook/campaigns PATCH');
    return NextResponse.json(body, { status });
  }
}
