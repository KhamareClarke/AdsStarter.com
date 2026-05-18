import { createAdminSupabase } from '@/lib/supabase/admin';
import { ghlRequest, getGhlLocationId } from './client';

export interface GhlContactInput {
  name?: string;
  email: string;
  phone?: string;
  companyName?: string;
}

export async function syncUserToGHL(
  userId: string,
  userData: GhlContactInput
): Promise<string> {
  const supabase = createAdminSupabase();
  const locationId = getGhlLocationId();

  const { data: profile } = await supabase
    .from('profiles')
    .select('ghl_contact_id')
    .eq('id', userId)
    .single();

  if (profile?.ghl_contact_id) {
    await ghlRequest('PUT', `/contacts/${profile.ghl_contact_id}`, {
      locationId,
      firstName: userData.name?.split(' ')[0] ?? '',
      lastName: userData.name?.split(' ').slice(1).join(' ') ?? '',
      email: userData.email,
      phone: userData.phone,
      companyName: userData.companyName,
      tags: ['adsstarter_user'],
    });
    return profile.ghl_contact_id;
  }

  const created = await ghlRequest<{ contact?: { id: string } }>('POST', '/contacts/', {
    locationId,
    firstName: userData.name?.split(' ')[0] ?? 'AdsStarter',
    lastName: userData.name?.split(' ').slice(1).join(' ') ?? 'User',
    email: userData.email,
    phone: userData.phone,
    companyName: userData.companyName,
    tags: ['adsstarter_user'],
    source: 'AdsStarter',
  });

  const contactId = created.contact?.id;
  if (!contactId) throw new Error('GHL did not return contact ID');

  await supabase.from('profiles').update({ ghl_contact_id: contactId }).eq('id', userId);

  await supabase.from('integrations').upsert(
    {
      user_id: userId,
      service: 'ghl',
      status: 'connected',
      config: { contact_id: contactId },
      last_synced: new Date().toISOString(),
    },
    { onConflict: 'user_id,service' }
  );

  return contactId;
}

export async function getGhlContactId(userId: string): Promise<string | null> {
  const supabase = createAdminSupabase();
  const { data } = await supabase
    .from('profiles')
    .select('ghl_contact_id')
    .eq('id', userId)
    .single();
  return data?.ghl_contact_id ?? null;
}

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
}

export async function tagContact(userId: string, campaignId: string, campaignName: string) {
  const contactId = await getGhlContactId(userId);
  if (!contactId) return;

  const tag = `campaign_${slugify(campaignName)}`;
  await ghlRequest('POST', `/contacts/${contactId}/tags`, {
    tags: [tag],
  });

  const supabase = createAdminSupabase();
  await supabase
    .from('campaigns')
    .update({ targeting: { ghl_tag: tag } })
    .eq('id', campaignId);
}

export async function removeTag(userId: string, campaignName: string) {
  const contactId = await getGhlContactId(userId);
  if (!contactId) return;

  const tag = `campaign_${slugify(campaignName)}`;
  await ghlRequest('DELETE', `/contacts/${contactId}/tags`, { tags: [tag] });
}

export async function addAlertTag(userId: string, alertType: string) {
  const contactId = await getGhlContactId(userId);
  if (!contactId) return;

  await ghlRequest('POST', `/contacts/${contactId}/tags`, {
    tags: [`alert_${alertType}`],
  });
}
