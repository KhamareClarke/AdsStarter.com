import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCampaignById, updateCampaign } from '@/lib/db/campaign-queries';
import { handleApiError, AppError } from '@/lib/error-handler';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const campaign = await getCampaignById(user.id, params.id);
    if (!campaign) throw new AppError('Campaign not found', 404);

    return NextResponse.json({ campaign });
  } catch (error) {
    const { status, body } = await handleApiError(error, 'api/campaigns/[id] GET');
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    if (body.action === 'pause' || body.action === 'resume') {
      const c = await getCampaignById(user.id, params.id);
      if (c?.external_campaign_id && c.platform === 'facebook') {
        const { getAdAccountsByPlatform, getDecryptedAccessToken } = await import(
          '@/lib/integrations/accounts'
        );
        const { pauseCampaign, resumeCampaign } = await import(
          '@/lib/integrations/facebook/campaigns'
        );
        const accounts = await getAdAccountsByPlatform(user.id, 'facebook');
        const account = accounts.find((a) => a.id === c.ad_account_id) ?? accounts[0];
        if (account) {
          const token = await getDecryptedAccessToken(account);
          if (body.action === 'pause') await pauseCampaign(token, c.external_campaign_id);
          else await resumeCampaign(token, c.external_campaign_id);
        }
      }
      const campaign = await updateCampaign(user.id, params.id, {
        status: body.action === 'pause' ? 'paused' : 'active',
      });
      return NextResponse.json({ success: true, campaign });
    }

    const { action: _action, ...patch } = body;
    const campaign = await updateCampaign(user.id, params.id, patch);
    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    const { status, body } = await handleApiError(error, 'api/campaigns/[id] PATCH');
    return NextResponse.json(body, { status });
  }
}
