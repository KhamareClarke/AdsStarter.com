import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncUserToGHL } from '@/lib/ghl/contact-sync';
import { handleApiError, AppError } from '@/lib/error-handler';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new AppError('Unauthorized', 401);

    const body = await request.json().catch(() => ({}));
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const contactId = await syncUserToGHL(user.id, {
      name: body.name ?? profile?.full_name ?? undefined,
      email: profile?.email ?? user.email!,
      phone: body.phone,
      companyName: body.company,
    });

    if (body.phone) {
      await supabase.from('user_alert_settings').upsert(
        { user_id: user.id, phone: body.phone },
        { onConflict: 'user_id' }
      );
    }

    return NextResponse.json({ success: true, ghl_contact_id: contactId });
  } catch (error) {
    const { status, body } = await handleApiError(error, 'api/ghl/contacts/sync');
    return NextResponse.json(body, { status });
  }
}
