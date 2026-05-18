import { createAdminSupabase } from '@/lib/supabase/admin';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public userMessage?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

async function captureSentry(error: unknown, source: string) {
  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  try {
    const Sentry = await import('@sentry/nextjs');
    Sentry.captureException(error, { tags: { source } });
  } catch {
    /* Sentry optional */
  }
}

export async function logError(params: {
  source: string;
  message: string;
  stack?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  severity?: 'error' | 'warning' | 'critical';
}) {
  try {
    const supabase = createAdminSupabase();
    await supabase.from('error_logs').insert({
      user_id: params.userId ?? null,
      source: params.source,
      message: params.message,
      stack: params.stack,
      metadata: params.metadata ?? {},
      severity: params.severity ?? 'error',
    });
  } catch {
    console.error('[error-handler] Failed to persist error:', params.message);
  }
  await captureSentry(new Error(params.message), params.source);
}

export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof AppError && error.userMessage) return error.userMessage;
  if (error instanceof AppError) return error.message;
  return 'Something went wrong. Please try again.';
}

export async function handleApiError(error: unknown, source: string) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  await logError({ source, message, stack });
  const status = error instanceof AppError ? error.statusCode : 500;
  return {
    status,
    body: { error: getUserFriendlyMessage(error) },
  };
}
