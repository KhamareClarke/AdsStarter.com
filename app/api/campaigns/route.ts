import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCampaign, getUserCampaigns } from '@/lib/db/queries';
import { handleApiError, AppError } from '@/lib/error-handler';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const campaigns = await getUserCampaigns(user.id);
    return NextResponse.json({ campaigns });
  } catch (error) {
    const { status, body } = await handleApiError(error, 'api/campaigns GET');
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    if (!body.campaign_name || !body.platform) {
      throw new AppError('campaign_name and platform required', 400);
    }

    const campaign = await createCampaign(user.id, {
      campaign_name: body.campaign_name,
      platform: body.platform,
      ad_account_id: body.ad_account_id,
      status: body.status ?? 'draft',
      budget_daily: body.budget_daily,
      objective: body.objective,
    });

    if (body.start_date || body.end_date || body.targeting) {
      await supabase
        .from('campaigns')
        .update({
          start_date: body.start_date ?? null,
          end_date: body.end_date ?? null,
          targeting: body.targeting ?? {},
        })
        .eq('id', campaign.id);
    }

    if (body.pushToPlatform && body.platform === 'facebook' && body.accountId) {
      try {
        const { getAdAccountsByPlatform, getDecryptedAccessToken } = await import(
          '@/lib/integrations/accounts'
        );
        const { createCampaign: createFbCampaign } = await import(
          '@/lib/integrations/facebook/campaigns'
        );
        const accounts = await getAdAccountsByPlatform(user.id, 'facebook');
        const account = accounts.find((a) => a.id === body.accountId) ?? accounts[0];
        if (account?.external_account_id) {
          const token = await getDecryptedAccessToken(account);
          const created = await createFbCampaign(token, account.external_account_id, {
            name: body.campaign_name,
            objective: body.objective ?? 'OUTCOME_TRAFFIC',
            daily_budget: body.budget_daily,
            status: body.status === 'active' ? 'ACTIVE' : 'PAUSED',
          });
          await supabase
            .from('campaigns')
            .update({ external_campaign_id: created.id })
            .eq('id', campaign.id);
        }
      } catch (fbErr) {
        console.error('Facebook push failed:', fbErr);
      }
    }

    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    const { status, body } = await handleApiError(error, 'api/campaigns POST');
    return NextResponse.json(body, { status });
  }
}
