import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '../../lib/auth/server';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/');
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {children}
    </div>
  );
}
