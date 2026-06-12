import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { ResetPasswordForm } from './ResetPasswordForm';

// The recovery email lands on /auth/callback, which exchanges the code for a
// session and forwards here. No session means the link expired or was tampered
// with — send them back to request a fresh one.
export default async function ResetPasswordPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/forgot-password');
  }

  return <ResetPasswordForm email={user.email ?? ''} />;
}
