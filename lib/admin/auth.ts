import { getSessionUser } from '@/lib/supabase/server';

export async function requireAdmin() {
  const user = await getSessionUser();

  if (!user?.email) return null;

  const admins = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (admins.length === 0) return null;
  if (!admins.includes(user.email.toLowerCase())) return null;

  return user;
}
