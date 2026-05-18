import { createAdminSupabase } from '@/lib/supabase/admin';
import { sendCampaignEmail } from './email';
import type { AlertMetrics } from './sms';

export type WorkflowType =
  | 'daily_report'
  | 'optimization'
  | 'budget_warning'
  | 'launch_reminder'
  | 'weekly_summary';

export async function createWorkflowRecord(
  userId: string,
  workflowType: WorkflowType,
  campaignId: string | null,
  config: Record<string, unknown> = {}
) {
  const supabase = createAdminSupabase();
  const { data, error } = await supabase
    .from('ghl_workflows')
    .upsert(
      {
        user_id: userId,
        campaign_id: campaignId,
        workflow_type: workflowType,
        config,
        is_active: true,
        ghl_workflow_id: (config.ghl_workflow_id as string) ?? null,
        ghl_webhook_id: (config.ghl_webhook_id as string) ?? null,
      },
      { onConflict: 'user_id,workflow_type,campaign_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createDailyReportWorkflow(
  userId: string,
  campaignId: string,
  preferredTime: string
) {
  return createWorkflowRecord(userId, 'daily_report', campaignId, {
    preferred_time: preferredTime,
    description: 'Daily campaign performance email at preferred time',
  });
}

export async function createOptimizationWorkflow(
  userId: string,
  campaignId: string,
  roasThreshold: number
) {
  return createWorkflowRecord(userId, 'optimization', campaignId, {
    roas_threshold: roasThreshold,
    description: 'Email when ROAS drops below threshold',
  });
}

export async function triggerWorkflow(
  userId: string,
  workflowType: WorkflowType,
  campaignId: string,
  metrics: AlertMetrics
) {
  const supabase = createAdminSupabase();
  const { data: workflow } = await supabase
    .from('ghl_workflows')
    .select('*')
    .eq('user_id', userId)
    .eq('workflow_type', workflowType)
    .eq('campaign_id', campaignId)
    .eq('is_active', true)
    .single();

  if (!workflow) return { skipped: true, reason: 'workflow_not_configured' };

  const emailType =
    workflowType === 'optimization'
      ? 'optimization'
      : workflowType === 'budget_warning'
        ? 'budget_warning'
        : workflowType;

  const result = await sendCampaignEmail(userId, campaignId, emailType, metrics);

  await supabase
    .from('ghl_workflows')
    .update({ last_triggered: new Date().toISOString() })
    .eq('id', workflow.id);

  return result;
}

export async function setupUserWorkflows(
  userId: string,
  campaignId: string,
  options: {
    dailyReportTime?: string;
    roasThreshold?: number;
    enableWeekly?: boolean;
  }
) {
  const results = [];

  if (options.dailyReportTime) {
    results.push(
      await createDailyReportWorkflow(userId, campaignId, options.dailyReportTime)
    );
  }

  if (options.roasThreshold != null) {
    results.push(
      await createOptimizationWorkflow(userId, campaignId, options.roasThreshold)
    );
  }

  if (options.enableWeekly) {
    results.push(
      await createWorkflowRecord(userId, 'weekly_summary', campaignId, {
        schedule: 'sunday 18:00',
      })
    );
  }

  results.push(
    await createWorkflowRecord(userId, 'budget_warning', campaignId, {
      threshold_pct: 80,
    })
  );

  results.push(
    await createWorkflowRecord(userId, 'launch_reminder', campaignId, {
      days_before: 1,
    })
  );

  return results;
}
