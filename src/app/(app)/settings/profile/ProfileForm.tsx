'use client';

import React, { useState, useTransition } from 'react';
import { updateProfile } from '@/app/actions/profile';
import { GILD_FONTS } from '@/components/gild';

interface Props {
  initialProfile: {
    display_name: string;
    username: string | null;
    avatar_url: string | null;
    bio: string | null;
  };
}

export function ProfileForm({ initialProfile }: Props) {
  const [displayName, setDisplayName] = useState(initialProfile.display_name);
  const [username, setUsername] = useState(initialProfile.username || '');
  const [bio, setBio] = useState(initialProfile.bio || '');
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      try {
        await updateProfile({
          display_name: displayName,
          username: username || undefined,
          bio: bio || undefined,
        });
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } catch (err) {
        setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update profile' });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <label style={labelStyle}>Display Name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Username</label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'oklch(0.50 0.02 250)', fontSize: 14 }}>@</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 30 }}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      {message && (
        <p style={{ 
          fontSize: 14, 
          color: message.type === 'success' ? 'oklch(0.50 0.15 150)' : 'oklch(0.45 0.15 25)',
          margin: 0,
          fontWeight: 600
        }}>
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        style={{
          padding: '12px 24px',
          borderRadius: 12,
          background: '#111',
          color: '#fff',
          border: 'none',
          fontSize: 14,
          fontWeight: 700,
          cursor: isPending ? 'default' : 'pointer',
          opacity: isPending ? 0.7 : 1,
          fontFamily: GILD_FONTS.sans,
        }}
      >
        {isPending ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: 'oklch(0.40 0.02 250)',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid oklch(0.90 0.01 250)',
  fontSize: 15,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
};
