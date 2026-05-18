export async function notifyEmpireRecommendations(
  userId: string,
  campaignId: string,
  campaignName: string,
  count: number
) {
  if (count === 0) return;

  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const link = `${base}/dashboard/empire-os`;

  const { createAdminSupabase } = await import('@/lib/supabase/admin');
  const supabase = createAdminSupabase();

  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'recommendation',
    title: `Empire OS: ${count} optimization${count > 1 ? 's' : ''} for ${campaignName}`,
    message: `${count} new AI recommendation(s) ready. Review: ${link}`,
    sent_via: 'in_app',
    metadata: { campaign_id: campaignId, count },
  });

  if (process.env.GHL_API_KEY) {
    try {
      const { getGhlContactId } = await import('@/lib/ghl/contact-sync');
      const { sendSms } = await import('@/lib/ghl/sms');
      const contactId = await getGhlContactId(userId);
      if (contactId) {
        await sendSms(
          contactId,
          `🤖 Empire OS found ${count} optimization${count > 1 ? 's' : ''} for ${campaignName}. Review: ${link}`
        );
      }
    } catch {
      // SMS optional
    }
  }
}
