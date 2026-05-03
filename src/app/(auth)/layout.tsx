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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9f9f9',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: '40px 36px',
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
