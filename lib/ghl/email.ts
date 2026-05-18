import { ghlRequest, getGhlLocationId } from './client';
import { getGhlContactId } from './contact-sync';
import { buildAlertMessage, logNotification, type AlertMetrics, type CampaignAlertType } from './sms';
import { wasAlertSentToday } from './sms';

export async function sendEmail(
  contactId: string,
  subject: string,
  htmlBody: string,
  emailTo?: string
): Promise<{ messageId: string | null }> {
  const locationId = getGhlLocationId();

  let recipient = emailTo;
  if (!recipient) {
    try {
      const contact = await ghlRequest<{ contact?: { email?: string }; email?: string }>(
        'GET',
        `/contacts/${contactId}`,
        undefined
      );
      recipient = contact.contact?.email ?? contact.email;
    } catch {
      // continue without emailTo
    }
  }

  const result = await ghlRequest<{ messageId?: string; id?: string; msg?: string }>(
    'POST',
    '/conversations/messages',
    {
      type: 'Email',
      contactId,
      subject,
      message: htmlBody,
      html: htmlBody,
      ...(recipient ? { emailTo: recipient } : {}),
      locationId,
    }
  );

  return { messageId: result.messageId ?? result.id ?? null };
}

function wrapEmailHtml(title: string, body: string, ctaUrl: string, ctaLabel: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #00c6ff, #0072ff); padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">${title}</h1>
      </div>
      <div style="background: #fff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        ${body}
        <p style="margin-top: 24px;">
          <a href="${ctaUrl}" style="background: #0072ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">${ctaLabel}</a>
        </p>
      </div>
    </div>
  `;
}

export function buildWorkflowEmail(
  workflowType: string,
  campaignName: string,
  metrics: AlertMetrics,
  campaignId: string
): { subject: string; html: string } {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const link = `${base}/dashboard/campaigns?id=${campaignId}`;

  switch (workflowType) {
    case 'daily_report':
      return {
        subject: `Daily Report: ${campaignName}`,
        html: wrapEmailHtml(
          `Daily Report — ${campaignName}`,
          `<p><strong>Status:</strong> Active</p>
           <p><strong>Spend today:</strong> $${metrics.spent?.toFixed(2) ?? '0'}</p>
           <p><strong>Conversions:</strong> ${metrics.conversions ?? 0}</p>
           <p><strong>ROAS:</strong> ${metrics.roas?.toFixed(2) ?? '—'}x</p>
           <p>Compare to yesterday in your dashboard for full trends.</p>`,
          link,
          'View full report'
        ),
      };
    case 'optimization':
      return {
        subject: `Optimization needed: ${campaignName}`,
        html: wrapEmailHtml(
          `ROAS Below Target`,
          `<p>Your campaign <strong>${campaignName}</strong> ROAS is <strong>${metrics.roas?.toFixed(2) ?? '—'}x</strong>, below your target of <strong>${metrics.roas_threshold?.toFixed(1) ?? '2.0'}x</strong>.</p>
           <p><strong>Recommendations:</strong></p>
           <ul>
             <li>Review audience targeting — may be too broad</li>
             <li>Lower bids on underperforming ad sets</li>
             <li>Pause low-converting creatives</li>
           </ul>`,
          link,
          'Adjust campaign'
        ),
      };
    case 'budget_warning':
      return {
        subject: `Budget warning: ${campaignName}`,
        html: wrapEmailHtml(
          `80% Budget Used`,
          `<p><strong>${campaignName}</strong> has spent <strong>$${metrics.spent?.toFixed(0) ?? '—'}</strong> of <strong>$${metrics.daily_budget?.toFixed(0) ?? '—'}</strong> daily budget.</p>
           <p>At current pace you may hit your limit before end of day.</p>`,
          link,
          'View details'
        ),
      };
    case 'launch_reminder':
      return {
        subject: `Launching tomorrow: ${campaignName}`,
        html: wrapEmailHtml(
          `Campaign Launch Reminder`,
          `<p><strong>${campaignName}</strong> is scheduled to go live tomorrow.</p>
           <p><strong>Daily budget:</strong> $${metrics.daily_budget?.toFixed(0) ?? '—'}</p>
           <p>Review audience, placements, and bidding before launch.</p>`,
          link,
          'Launch checklist'
        ),
      };
    case 'weekly_summary':
      return {
        subject: `Weekly summary: ${campaignName}`,
        html: wrapEmailHtml(
          `Weekly Performance`,
          `<p><strong>${campaignName}</strong> this week:</p>
           <p>Spend: $${metrics.spent?.toFixed(0) ?? '0'} · Conversions: ${metrics.conversions ?? 0} · ROAS: ${metrics.roas?.toFixed(2) ?? '—'}x</p>`,
          `${base}/dashboard`,
          'View all campaigns'
        ),
      };
    default:
      return {
        subject: `AdsStarter: ${campaignName}`,
        html: wrapEmailHtml('Campaign Update', `<p>${buildAlertMessage(workflowType as CampaignAlertType, campaignName, metrics, campaignId)}</p>`, link, 'Open dashboard'),
      };
  }
}

export async function sendCampaignEmail(
  userId: string,
  campaignId: string,
  workflowType: string,
  metrics: AlertMetrics,
  options?: { campaignName?: string }
) {
  const contactId = await getGhlContactId(userId);
  if (!contactId) throw new Error('GHL contact not found');

  const { createAdminSupabase } = await import('@/lib/supabase/admin');
  const supabase = createAdminSupabase();
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('campaign_name')
    .eq('id', campaignId)
    .single();

  const campaignName = options?.campaignName ?? campaign?.campaign_name ?? 'Campaign';
  const { subject, html } = buildWorkflowEmail(workflowType, campaignName, metrics, campaignId);

  const alertType = workflowType === 'daily_report' ? 'daily_report' : workflowType === 'budget_warning' ? 'budget_warning' : 'roas_warning';

  if (await wasAlertSentToday(campaignId, alertType as CampaignAlertType, 'email')) {
    return { success: true, skipped: true };
  }

  const { messageId } = await sendEmail(contactId, subject, html);

  await logNotification({
    userId,
    campaignId,
    alertType: alertType as CampaignAlertType,
    channel: 'email',
    status: messageId ? 'sent' : 'pending',
    message: subject,
    ghlMessageId: messageId,
    ghlContactId: contactId,
    metadata: { workflowType, ...metrics },
  });

  return { success: true, message_id: messageId };
}
