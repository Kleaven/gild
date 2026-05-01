export const metadata = {
  title: 'Platform Admin Login | Gild',
};

import WebAuthnLoginForm from './login-form';

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-2">Admin Login</h1>
        <p className="text-neutral-400 mb-8">
          Authenticate using your Security Key or Touch ID.
        </p>
        
        <WebAuthnLoginForm />
      </div>
    </div>
  );
}
