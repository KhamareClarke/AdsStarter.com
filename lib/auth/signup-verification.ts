import { createHash, randomInt, scryptSync, timingSafeEqual } from 'crypto';
import { AppError } from '@/lib/error-handler';
import { createAdminSupabase } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/send';
import { signupVerificationEmail } from '@/lib/email/templates';

function mapDbError(error: { message?: string; code?: string }) {
  const msg = error.message ?? 'Database error';
  if (
    error.code === '42P01' ||
    msg.includes('pending_signups') ||
    msg.includes('does not exist')
  ) {
    throw new AppError(
      msg,
      503,
      'Signup is not fully set up yet. Run supabase/migrations/006_pending_signups.sql in Supabase SQL Editor.'
    );
  }
  throw new AppError(msg, 400, msg);
}

const CODE_TTL_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function secret(): string {
  return (
    process.env.SIGNUP_CODE_SECRET ??
    process.env.CRON_SECRET ??
    'adsstarter-signup'
  );
}

function hashCode(email: string, code: string): string {
  return createHash('sha256').update(`${email.toLowerCase()}:${code}:${secret()}`).digest('hex');
}

function hashPassword(password: string): string {
  const salt = createHash('sha256').update(`${secret()}:pw`).digest('hex').slice(0, 32);
  return scryptSync(password, salt, 64).toString('hex');
}

function passwordsMatch(password: string, stored: string): boolean {
  const hash = hashPassword(password);
  try {
    return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(stored, 'hex'));
  } catch {
    return false;
  }
}

export function generateSignupCode(): string {
  return String(randomInt(100000, 999999));
}

export async function createPendingSignup(
  email: string,
  password: string,
  fullName: string
): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const code = generateSignupCode();
  let admin;
  try {
    admin = createAdminSupabase();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Supabase not configured';
    throw new AppError(msg, 503, 'Server configuration error. Please contact support.');
  }

  const { error } = await admin.from('pending_signups').upsert(
    {
      email: normalized,
      code_hash: hashCode(normalized, code),
      password_encrypted: hashPassword(password),
      full_name: fullName.trim() || null,
      expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
      attempts: 0,
    },
    { onConflict: 'email' }
  );

  if (error) mapDbError(error);

  const { html, text, subject } = signupVerificationEmail(code, CODE_TTL_MS / 60000);
  await sendEmail({ to: normalized, subject, html, text });
}

export async function verifyAndConsumePendingSignup(
  email: string,
  code: string,
  password: string
): Promise<{ email: string; fullName: string }> {
  const normalized = email.trim().toLowerCase();
  const admin = createAdminSupabase();

  const { data: row, error } = await admin
    .from('pending_signups')
    .select('*')
    .eq('email', normalized)
    .maybeSingle();

  if (error || !row) {
    throw new Error('No pending signup found. Please sign up again.');
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    await admin.from('pending_signups').delete().eq('email', normalized);
    throw new Error('Verification code expired. Please sign up again.');
  }

  if (row.attempts >= MAX_ATTEMPTS) {
    throw new Error('Too many attempts. Please sign up again.');
  }

  const codeOk = hashCode(normalized, code.trim()) === row.code_hash;
  const passwordOk = passwordsMatch(password, row.password_encrypted);

  if (!codeOk || !passwordOk) {
    await admin
      .from('pending_signups')
      .update({ attempts: row.attempts + 1 })
      .eq('email', normalized);
    throw new Error('Invalid verification code.');
  }

  await admin.from('pending_signups').delete().eq('email', normalized);

  return { email: normalized, fullName: row.full_name ?? '' };
}

export async function resendSignupCode(email: string, password: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const admin = createAdminSupabase();

  const { data: row } = await admin
    .from('pending_signups')
    .select('full_name')
    .eq('email', normalized)
    .maybeSingle();

  if (!row) {
    throw new Error('No pending signup found. Please sign up again.');
  }

  await createPendingSignup(normalized, password, row.full_name ?? '');
}
