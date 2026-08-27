import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminSetPasswordForm } from './AdminSetPasswordForm';

export default async function AdminSetPasswordPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/admin-login');

  return <AdminSetPasswordForm email={user.email ?? ''} />;
}
