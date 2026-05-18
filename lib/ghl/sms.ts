import { createAdminSupabase } from '@/lib/supabase/admin';
import { ghlRequest, getGhlLocationId } from './client';
import { getGhlContactId } from './contact-sync';

export type CampaignAlertType =
  | 'budget_limit_hit'
  | 'budget_warning'
  | 'conversion_rate_drop'
  | 'roas_warning'
  | 'campaign_live'
  | 'campaign_ending'
  | 'daily_report';

export interface AlertMetrics {
  spent?: number;
  daily_budget?: number;
  conversions?: number;
  conversion_rate?: number;
  avg_conversion_rate?: number;
  roas?: number;
  roas_threshold?: number;
  final_roas?: number;
}

function campaignLink(campaignId: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return `${base}/dashboard/campaigns?id=${campaignId}`;
}

export function buildAlertMessage(
  alertType: CampaignAlertType,
  campaignName: string,
  metrics: AlertMetrics,
  campaignId: string
): string {
  const link = campaignLink(campaignId);

  switch (alertType) {
    case 'budget_limit_hit':
      return `⚠️ ${campaignName} hit daily budget ($${metrics.spent?.toFixed(0) ?? '—'}). Paused to prevent overages. View: ${link}`;
    case 'budget_warning':
      return `💰 ${campaignName} has used ${metrics.spent != null && metrics.daily_budget ? Math.round((metrics.spent / metrics.daily_budget) * 100) : 80}% of daily budget. View: ${link}`;
    case 'conversion_rate_drop':
      return `📉 ${campaignName} conversion rate dropped to ${metrics.conversion_rate?.toFixed(1) ?? '—'}% from ${metrics.avg_conversion_rate?.toFixed(1) ?? '—'}%. Check: ${link}`;
    case 'roas_warning':
      return `⚠️ ${campaignName} ROAS is ${metrics.roas?.toFixed(1) ?? '—'}x (below target ${metrics.roas_threshold?.toFixed(1) ?? '2.0'}x). Review: ${link}`;
    case 'campaign_live':
      return `🚀 ${campaignName} is now LIVE! Budget: $${metrics.daily_budget?.toFixed(0) ?? '—'}/day. Monitor: ${link}`;
    case 'campaign_ending':
      return `📊 ${campaignName} ended. Final: ${metrics.conversions ?? 0} conversions, ${metrics.final_roas?.toFixed(2) ?? metrics.roas?.toFixed(2) ?? '—'}x ROAS. Report: ${link}`;
    case 'daily_report':
      return `📈 Daily report for ${campaignName}: $${metrics.spent?.toFixed(0) ?? 0} spent, ${metrics.conversions ?? 0} conversions, ${metrics.roas?.toFixed(2) ?? '—'}x ROAS. ${link}`;
    default:
      return `AdsStarter alert for ${campaignName}: ${link}`;
  }
}

export async function sendSms(
  contactId: string,
  message: string
): Promise<{ messageId: string | null }> {
  const locationId = getGhlLocationId();

  const result = await ghlRequest<{ messageId?: string; id?: string; conversationId?: string }>(
    'POST',
    '/conversations/messages',
    {
      type: 'SMS',
      contactId,
      message,
      locationId,
    }
  );

  return { messageId: result.messageId ?? result.id ?? null };
}

export async function logNotification(params: {
  userId: string;
  campaignId?: string;
  alertType: CampaignAlertType;
  channel: 'sms' | 'email' | 'both';
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  message: string;
  ghlMessageId?: string | null;
  ghlContactId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createAdminSupabase();
  const channel = params.channel;
  const status = params.status;

  const today = new Date().toISOString().slice(0, 10);
  await supabase.from('ghl_notification_logs').insert({
    user_id: params.userId,
    campaign_id: params.campaignId ?? null,
    alert_type: params.alertType,
    channel,
    status,
    message: params.message,
    ghl_message_id: params.ghlMessageId,
    ghl_contact_id: params.ghlContactId,
    metadata: params.metadata ?? {},
    sent_date: today,
    delivered_at: status === 'delivered' || status === 'sent' ? new Date().toISOString() : null,
  });

  await supabase.from('notifications').insert({
    user_id: params.userId,
    type:
      params.alertType === 'budget_limit_hit' || params.alertType === 'budget_warning'
        ? 'budget_warning'
        : params.alertType === 'roas_warning' || params.alertType === 'conversion_rate_drop'
          ? 'performance_alert'
          : 'recommendation',
    title: `Campaign alert: ${params.alertType.replace(/_/g, ' ')}`,
    message: params.message,
    sent_via: channel === 'both' ? 'sms' : channel,
    metadata: params.metadata ?? {},
  });
}

export async function wasAlertSentToday(
  campaignId: string,
  alertType: CampaignAlertType,
  channel: 'sms' | 'email'
): Promise<boolean> {
  const supabase = createAdminSupabase();
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from('ghl_notification_logs')
    .select('id')
    .eq('campaign_id', campaignId)
    .eq('alert_type', alertType)
    .eq('channel', channel)
    .eq('sent_date', today)
    .limit(1);

  return (data?.length ?? 0) > 0;
}

export async function sendCampaignAlert(
  userId: string,
  campaignId: string,
  alertType: CampaignAlertType,
  metrics: AlertMetrics,
  options?: { campaignName?: string; skipDedupe?: boolean }
) {
  const supabase = createAdminSupabase();

  const [{ data: campaign }, { data: settings }] = await Promise.all([
    supabase.from('campaigns').select('campaign_name, user_id').eq('id', campaignId).single(),
    supabase.from('user_alert_settings').select('*').eq('user_id', userId).single(),
  ]);

  if (!campaign || campaign.user_id !== userId) {
    throw new Error('Campaign not found');
  }

  const campaignName = options?.campaignName ?? campaign.campaign_name;
  const message = buildAlertMessage(alertType, campaignName, metrics, campaignId);

  const contactId = await getGhlContactId(userId);
  if (!contactId) {
    throw new Error('GHL contact not found — sync user first');
  }

  const smsEnabled = settings?.sms_enabled !== false;
  const results: { sms?: string | null; email?: string | null } = {};

  if (smsEnabled) {
    if (!options?.skipDedupe && (await wasAlertSentToday(campaignId, alertType, 'sms'))) {
      return { success: true, skipped: true, reason: 'already_sent_today' };
    }

    try {
      const { messageId } = await sendSms(contactId, message);
      results.sms = messageId;
      await logNotification({
        userId,
        campaignId,
        alertType,
        channel: 'sms',
        status: messageId ? 'sent' : 'pending',
        message,
        ghlMessageId: messageId,
        ghlContactId: contactId,
        metadata: { ...metrics },
      });
    } catch (err) {
      await logNotification({
        userId,
        campaignId,
        alertType,
        channel: 'sms',
        status: 'failed',
        message,
        ghlContactId: contactId,
        metadata: { error: err instanceof Error ? err.message : 'SMS failed', ...metrics },
      });
      throw err;
    }
  }

  return { success: true, message_id: results.sms, message };
}
