import { requireAuth } from '@/lib/auth';
import { GILD_FONTS } from '@/components/gild';
import { Mail, Shield } from 'lucide-react';
import { ProfileForm } from './ProfileForm';

export default async function ProfileSettingsPage() {
  const { user, profile } = await requireAuth();

  return (
    <div style={{
      fontFamily: GILD_FONTS.sans,
      padding: '64px 28px',
      maxWidth: 600,
      margin: '0 auto',
      color: '#111',
    }}>
      <header style={{ marginBottom: 40 }}>
        <h1 style={{ 
          fontFamily: GILD_FONTS.display, 
          fontSize: 36, 
          fontWeight: 800, 
          letterSpacing: '-0.04em', 
          margin: '0 0 8px' 
        }}>
          Account Settings
        </h1>
        <p style={{ fontSize: 16, color: 'oklch(0.50 0.02 250)', margin: 0 }}>
          Manage your personal identity across the Gild galaxy.
        </p>
      </header>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
        {/* Profile Card / Avatar Area */}
        <div style={{
          padding: 24,
          borderRadius: 20,
          background: 'oklch(0.985 0.003 250)',
          border: '1px solid oklch(0.94 0.005 250)',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            background: 'linear-gradient(135deg, oklch(0.80 0.12 250), oklch(0.60 0.12 250))',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            fontWeight: 800,
            fontFamily: GILD_FONTS.display,
            boxShadow: '0 4px 12px oklch(0 0 0 / 0.1)',
          }}>
            {profile.avatar_url ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }} /> : profile.display_name[0]}
          </div>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800, fontFamily: GILD_FONTS.display }}>{profile.display_name}</h2>
            <p style={{ margin: 0, fontSize: 14, color: 'oklch(0.50 0.02 250)' }}>@{profile.username || 'user'}</p>
          </div>
        </div>

        {/* Profile Form */}
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Profile Information</h3>
          <ProfileForm initialProfile={profile} />
        </div>

        {/* Account Info */}
        <div style={{ borderTop: '1px solid oklch(0.95 0.005 250)', paddingTop: 40 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Security & Account</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Mail size={18} color="oklch(0.50 0.02 250)" />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'oklch(0.50 0.02 250)', letterSpacing: '0.04em' }}>Email Address</p>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>{user.email}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Shield size={18} color="oklch(0.50 0.02 250)" />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'oklch(0.50 0.02 250)', letterSpacing: '0.04em' }}>Security</p>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>Two-factor authentication is disabled</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
