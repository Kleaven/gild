'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Wordmark, Avatar, GILD_FONTS } from '@/components/gild';
import type { Person } from '@/components/gild';
import { updateProfile, uploadAvatar, requestDataExport, requestAccountDeletion } from '@/app/actions';
import { signOut } from '@/lib/auth/actions';
import { Camera, Shield, User, Trash2, LogOut } from 'lucide-react';
import { SecurityPanel } from './SecurityPanel';

type Tab = 'profile' | 'security' | 'danger';

interface StudioSettingsProps {
  user: {
    id: string;
    display_name: string;
    username: string | null;
    bio: string | null;
    avatar_url: string | null;
  };
}

export function StudioSettings({ user }: StudioSettingsProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('profile');

  const currentUser: Person = {
    id: user.id,
    name: user.display_name,
    role: 'free_member',
    hue: user.id.charCodeAt(0) * 10 % 360,
    online: true,
  };

  return (
    <div style={{ fontFamily: GILD_FONTS.sans, background: '#fff', minHeight: '100vh', color: '#202020' }}>
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px' }}>
        <h1
          style={{
            fontFamily: GILD_FONTS.display,
            fontSize: 28,
            fontWeight: 700,
            margin: '0 0 24px',
            letterSpacing: '-0.025em',
          }}
        >
          Settings
        </h1>

        <nav style={{ display: 'flex', gap: 4, marginBottom: 40, borderBottom: '1px solid oklch(0.94 0.005 250)' }}>
          <TabButton active={tab === 'profile'} onClick={() => setTab('profile')}>
            <User size={16} style={{ marginRight: 8 }} /> Profile
          </TabButton>
          <TabButton active={tab === 'security'} onClick={() => setTab('security')}>
            <Shield size={16} style={{ marginRight: 8 }} /> Security
          </TabButton>
          <TabButton active={tab === 'danger'} onClick={() => setTab('danger')}>
            <Trash2 size={16} style={{ marginRight: 8 }} /> Danger Zone
          </TabButton>
        </nav>

        <div style={{ minHeight: 400 }}>
          {tab === 'profile' && <ProfilePanel user={user} />}
          {tab === 'security' && <SecurityPanel />}
          {tab === 'danger' && <DangerPanel />}
        </div>
      </main>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '10px 16px',
        background: 'transparent',
        border: 'none',
        borderBottom: active ? '2px solid oklch(0.20 0.02 250)' : '2px solid transparent',
        color: active ? '#202020' : 'oklch(0.50 0.02 250)',
        fontFamily: 'inherit',
        fontSize: 14,
        fontWeight: active ? 600 : 500,
        cursor: 'pointer',
        marginBottom: -1,
      }}
    >
      {children}
    </button>
  );
}

function ProfilePanel({ user }: { user: StudioSettingsProps['user'] }) {
  const [displayName, setDisplayName] = useState(user.display_name);
  const [username, setUsername] = useState(user.username ?? '');
  const [bio, setBio] = useState(user.bio ?? '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    const result = await uploadAvatar(formData);
    setIsUploading(false);

    if (result.ok) {
      setAvatarUrl(result.url);
      setSuccess(true);
    } else {
      setError(result.error);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateProfile({
        display_name: displayName,
        username: username.trim() === '' ? null : username.trim(),
        bio: bio.trim() === '' ? null : bio.trim(),
      });
      if (result.ok) {
        setSuccess(true);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 10 }}>
        <div style={{ position: 'relative' }}>
          <Avatar 
            person={{ 
              id: user.id, 
              name: displayName, 
              avatar_url: avatarUrl,
              role: 'free_member',
              hue: user.id.charCodeAt(0) * 10 % 360,
              online: true 
            }} 
            size={80} 
          />
          <label style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'oklch(0.20 0.02 250)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: '3px solid #fff',
            boxShadow: '0 2px 8px oklch(0 0 0 / 0.15)',
            opacity: isUploading ? 0.7 : 1,
          }}>
            <Camera size={14} />
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleAvatarChange} 
              disabled={isUploading}
              style={{ display: 'none' }} 
            />
          </label>
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>Profile Picture</h3>
          <p style={{ fontSize: 13, color: 'oklch(0.50 0.02 250)', margin: 0 }}>
            {isUploading ? 'Uploading...' : 'JPG, PNG or GIF. Max 2MB.'}
          </p>
        </div>
      </div>

      <Field label="Display name" required>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={80}
          required
          style={inputStyle}
        />
      </Field>

      <Field label="Username" hint="Letters, numbers, underscores. 3-30 characters.">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={30}
          style={inputStyle}
          placeholder="optional"
        />
      </Field>

      <Field label="Bio" hint="Up to 500 characters.">
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
          rows={4}
          style={{ ...inputStyle, resize: 'vertical', minHeight: 96 }}
          placeholder="Tell people who you are."
        />
      </Field>

      {error && <p style={{ color: '#c00', fontSize: 13, margin: 0 }}>{error}</p>}
      {success && <p style={{ color: 'oklch(0.42 0.14 150)', fontSize: 13, margin: 0 }}>Saved.</p>}

      <div>
        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: '10px 22px',
            borderRadius: 8,
            background: 'oklch(0.20 0.02 250)',
            color: '#fff',
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            cursor: isPending ? 'default' : 'pointer',
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {isPending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

function DangerPanel() {
  const router = useRouter();
  const handleLogout = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <section style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ padding: 10, borderRadius: 12, background: 'oklch(0.96 0.04 250)', color: 'oklch(0.50 0.02 250)' }}>
            <LogOut size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Sign Out</h3>
            <p style={{ fontSize: 13, color: 'oklch(0.55 0.02 250)', margin: 0 }}>End your current session on this device.</p>
          </div>
        </div>
        <button onClick={handleLogout} style={secondaryBtnStyle}>Log out</button>
      </section>

      <ExportSection />
      <DeleteSection />
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 10,
  background: 'transparent',
  border: '1px solid oklch(0.90 0.01 250)',
  color: '#111',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  width: 'fit-content'
};

function ExportSection() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleExport() {
    setError(null);
    startTransition(async () => {
      const { data, error: exportError } = await requestDataExport();
      if (exportError || !data) {
        setError(exportError ?? 'Export failed');
        return;
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gild-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <section
      style={{
        border: '1px solid oklch(0.94 0.005 250)',
        borderRadius: 12,
        padding: 20,
        background: '#fff',
      }}
    >
      <h2
        style={{
          fontFamily: GILD_FONTS.display,
          fontSize: 16,
          fontWeight: 700,
          margin: '0 0 6px',
          letterSpacing: '-0.02em',
        }}
      >
        Export your data
      </h2>
      <p style={{ fontSize: 13, color: 'oklch(0.45 0.02 250)', margin: '0 0 14px', lineHeight: 1.5 }}>
        Download a JSON copy of your profile, communities, enrollments, and certificates.
      </p>
      {error && <p style={{ color: '#c00', fontSize: 13, margin: '0 0 10px' }}>{error}</p>}
      <button
        type="button"
        onClick={handleExport}
        disabled={isPending}
        style={{
          padding: '8px 16px',
          borderRadius: 8,
          background: '#fff',
          color: '#202020',
          border: '1px solid oklch(0.90 0.01 250)',
          fontSize: 13,
          fontWeight: 500,
          cursor: isPending ? 'default' : 'pointer',
          opacity: isPending ? 0.7 : 1,
        }}
      >
        {isPending ? 'Preparing…' : 'Download data'}
      </button>
    </section>
  );
}

function DeleteSection() {
  const [stage, setStage] = useState<'idle' | 'confirm'>('idle');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await requestAccountDeletion();
      if (result?.error) {
        setError(result.error);
        setStage('idle');
      }
    });
  }

  return (
    <section
      style={{
        border: '1px solid oklch(0.85 0.10 25)',
        borderRadius: 12,
        padding: 20,
        background: 'oklch(0.985 0.01 25)',
      }}
    >
      <h2
        style={{
          fontFamily: GILD_FONTS.display,
          fontSize: 16,
          fontWeight: 700,
          margin: '0 0 6px',
          letterSpacing: '-0.02em',
          color: 'oklch(0.40 0.14 25)',
        }}
      >
        Delete account
      </h2>
      <p style={{ fontSize: 13, color: 'oklch(0.45 0.02 250)', margin: '0 0 14px', lineHeight: 1.5 }}>
        Permanent. Your profile, posts, and comments will be removed or anonymised. Communities you own
        must be transferred or deleted first.
      </p>
      {error && <p style={{ color: '#c00', fontSize: 13, margin: '0 0 10px' }}>{error}</p>}
      {stage === 'idle' ? (
        <button
          type="button"
          onClick={() => setStage('confirm')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            background: '#fff',
            color: 'oklch(0.40 0.14 25)',
            border: '1px solid oklch(0.75 0.14 25)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Delete account
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: 'oklch(0.50 0.16 25)',
              color: '#fff',
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: isPending ? 'default' : 'pointer',
              opacity: isPending ? 0.7 : 1,
            }}
          >
            {isPending ? 'Deleting…' : 'Yes, permanently delete'}
          </button>
          <button
            type="button"
            onClick={() => setStage('idle')}
            disabled={isPending}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: 'transparent',
              color: 'oklch(0.30 0.02 250)',
              border: '1px solid oklch(0.90 0.01 250)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#202020' }}>
        {label}
        {required && <span style={{ color: 'oklch(0.50 0.16 25)', marginLeft: 4 }}>*</span>}
      </span>
      {children}
      {hint && (
        <span style={{ fontSize: 11, color: 'oklch(0.50 0.02 250)' }}>{hint}</span>
      )}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  border: '1px solid oklch(0.90 0.01 250)',
  borderRadius: 8,
  fontSize: 14,
  outline: 'none',
  background: '#fff',
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box',
};
