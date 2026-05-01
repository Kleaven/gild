import { redirect } from 'next/navigation';
import { getSupabaseServiceClient } from '@/lib/auth/server';
import WebAuthnSetupForm from './setup-form';

export const metadata = {
  title: 'Platform Admin Setup | Gild',
};

export default async function AdminSetupPage(props: { searchParams: Promise<{ token?: string }> }) {
  const searchParams = await props.searchParams;
  const token = searchParams.token;

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h1>
          <p className="text-neutral-400">Missing setup token.</p>
        </div>
      </div>
    );
  }

  const serviceClient = getSupabaseServiceClient();

  // Verify the setup token
  const { data: adminRow, error } = await serviceClient
    .from('platform_admins')
    .select('id, email, setup_token')
    .eq('setup_token', token)
    .maybeSingle();

  if (error || !adminRow) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Invalid Token</h1>
          <p className="text-neutral-400">The setup token is invalid or has already been used.</p>
        </div>
      </div>
    );
  }

  // Double check if they already have credentials
  const { count } = await serviceClient
    .from('webauthn_credentials')
    .select('*', { count: 'exact', head: true })
    .eq('admin_id', adminRow.id);

  if (count && count > 0) {
    // Already setup, redirect to login
    redirect('/admin/login');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-2">Admin Setup</h1>
        <p className="text-neutral-400 mb-8">
          Welcome, {adminRow.email}. Please register your Security Key or biometric authenticator to secure your account.
        </p>
        
        <WebAuthnSetupForm adminId={adminRow.id} adminEmail={adminRow.email} setupToken={token} />
      </div>
    </div>
  );
}
