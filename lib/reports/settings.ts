import { createAdminSupabase } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import {
  DEFAULT_REPORT_SECTIONS,
  mergeReportSections,
  type ReportBranding,
  type ReportSectionsConfig,
} from './sections';

export interface ReportSettings {
  sections: ReportSectionsConfig;
  agency_name: string | null;
  client_name: string | null;
  footer_note: string | null;
  default_aov: number;
}

const DEFAULT_SETTINGS: ReportSettings = {
  sections: DEFAULT_REPORT_SECTIONS,
  agency_name: null,
  client_name: null,
  footer_note: null,
  default_aov: 35,
};

function rowToSettings(row: Record<string, unknown>): ReportSettings {
  return {
    sections: mergeReportSections(
      DEFAULT_REPORT_SECTIONS,
      (row.sections as Partial<ReportSectionsConfig>) ?? {}
    ),
    agency_name: (row.agency_name as string) ?? null,
    client_name: (row.client_name as string) ?? null,
    footer_note: (row.footer_note as string) ?? null,
    default_aov: Number(row.default_aov) || 35,
  };
}

export async function getUserReportSettings(userId: string): Promise<ReportSettings> {
  try {
    const supabase = createAdminSupabase();
    const { data, error } = await supabase
      .from('report_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return { ...DEFAULT_SETTINGS };
    return rowToSettings(data as Record<string, unknown>);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function getCampaignReportSettings(
  userId: string,
  campaignId: string
): Promise<ReportSettings & { branding: ReportBranding }> {
  const userSettings = await getUserReportSettings(userId);

  try {
    const supabase = createAdminSupabase();
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('user_id', userId)
      .single();

    if (!campaign) return { ...userSettings, branding: brandingFrom(userSettings) };

    const { data: override } = await supabase
      .from('campaign_report_settings')
      .select('*')
      .eq('campaign_id', campaignId)
      .maybeSingle();

    if (!override) {
      return { ...userSettings, branding: brandingFrom(userSettings) };
    }

    const row = override as Record<string, unknown>;
    return {
      sections: mergeReportSections(
        userSettings.sections,
        (row.sections as Partial<ReportSectionsConfig>) ?? {}
      ),
      agency_name: (row.agency_name as string) ?? userSettings.agency_name,
      client_name: (row.client_name as string) ?? userSettings.client_name,
      footer_note: (row.footer_note as string) ?? userSettings.footer_note,
      default_aov: Number(row.default_aov) || userSettings.default_aov,
      branding: {
        agency_name: (row.agency_name as string) ?? userSettings.agency_name,
        client_name: (row.client_name as string) ?? userSettings.client_name,
        footer_note: (row.footer_note as string) ?? userSettings.footer_note,
      },
    };
  } catch {
    return { ...userSettings, branding: brandingFrom(userSettings) };
  }
}

function brandingFrom(s: ReportSettings): ReportBranding {
  return {
    agency_name: s.agency_name,
    client_name: s.client_name,
    footer_note: s.footer_note,
  };
}

export async function saveUserReportSettings(
  userId: string,
  patch: Partial<ReportSettings>
): Promise<ReportSettings> {
  const supabase = await createClient();
  const current = await getUserReportSettings(userId);
  const next = { ...current, ...patch };

  const { data, error } = await supabase
    .from('report_settings')
    .upsert(
      {
        user_id: userId,
        sections: next.sections,
        agency_name: next.agency_name,
        client_name: next.client_name,
        footer_note: next.footer_note,
        default_aov: next.default_aov,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return rowToSettings(data as Record<string, unknown>);
}

export async function saveCampaignReportSettings(
  userId: string,
  campaignId: string,
  patch: Partial<ReportSettings>
): Promise<ReportSettings> {
  const supabase = await createClient();

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id')
    .eq('id', campaignId)
    .eq('user_id', userId)
    .single();

  if (!campaign) throw new Error('Campaign not found');

  const current = await getCampaignReportSettings(userId, campaignId);

  const { data, error } = await supabase
    .from('campaign_report_settings')
    .upsert(
      {
        campaign_id: campaignId,
        sections: patch.sections ?? current.sections,
        agency_name: patch.agency_name ?? current.agency_name,
        client_name: patch.client_name ?? current.client_name,
        footer_note: patch.footer_note ?? current.footer_note,
        default_aov: patch.default_aov ?? current.default_aov,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'campaign_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return getCampaignReportSettings(userId, campaignId);
}
