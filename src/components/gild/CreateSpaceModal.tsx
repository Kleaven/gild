'use client';

import React, { useState, useTransition } from 'react';
import { createSpace } from '@/app/actions';
import { GILD_FONTS } from '@/components/gild';
import { useRouter } from 'next/navigation';
import { Shield, MessageSquare, Reply, Heart, Lock, Globe, ChevronDown, AlertCircle } from 'lucide-react';

interface Props {
  communityId: string;
  isOpen: boolean;
  onClose: () => void;
}

type PermissionRole = 'member' | 'admin' | 'owner';

export function CreateSpaceModal({ communityId, isOpen, onClose }: Props) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [permissions, setPermissions] = useState({
    post: 'member' as PermissionRole,
    comment: 'member' as PermissionRole,
    react: 'member' as PermissionRole,
  });
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);

    startTransition(async () => {
      try {
        const result = await createSpace({
          communityId,
          name,
          description,
          type: 'feed',
          isPrivate,
          role_permissions: {
            member: { 
              can_view: true, 
              can_post: permissions.post === 'member', 
              can_comment: permissions.comment === 'member', 
              can_react: permissions.react === 'member' 
            },
            admin: { 
              can_view: true, 
              can_post: permissions.post !== 'owner', 
              can_comment: permissions.comment !== 'owner', 
              can_react: permissions.react !== 'owner' 
            }
          },
        });

        if (result.error) {
          throw new Error(result.error);
        }

        setName('');
        setDescription('');
        onClose();
        router.push(`/c/${communityId}/s/${result.spaceId}`);
      } catch (err) {
        console.error('Failed to create space', err);
        setError(err instanceof Error ? err.message : 'Failed to create space');
      }
    });
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <div>
            <h2 style={titleStyle}>Create new space</h2>
            <p style={subtitleStyle}>A place for your members to connect and share.</p>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={formStyle}>
          <section style={sectionStyle}>
            <label style={labelStyle}>
              Space Name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Announcements"
                required
                style={inputStyle}
                autoFocus
              />
            </label>

            <label style={labelStyle}>
              Description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What should members expect here?"
                rows={2}
                style={{ ...inputStyle, resize: 'none' }}
              />
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
              <div 
                onClick={() => setIsPrivate(!isPrivate)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  cursor: 'pointer',
                  padding: '8px 12px',
                  borderRadius: 10,
                  background: isPrivate ? 'oklch(0.96 0.04 250)' : 'oklch(0.98 0.005 250)',
                  border: `1px solid ${isPrivate ? 'oklch(0.20 0.02 250)' : 'oklch(0.94 0.005 250)'}`,
                  transition: 'all 0.2s ease'
                }}
              >
                {isPrivate ? <Lock size={14} /> : <Globe size={14} />}
                <span style={{ fontSize: 13, fontWeight: 600 }}>{isPrivate ? 'Private Space' : 'Public Space'}</span>
              </div>
            </div>
          </section>

          <section style={sectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Shield size={16} color="oklch(0.40 0.15 150)" />
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Space Privileges</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <PermissionRow 
                icon={<MessageSquare size={14} />} 
                label="Who can post?" 
                value={permissions.post} 
                onChange={(v) => setPermissions({ ...permissions, post: v })} 
              />
              <PermissionRow 
                icon={<Reply size={14} />} 
                label="Who can comment?" 
                value={permissions.comment} 
                onChange={(v) => setPermissions({ ...permissions, comment: v })} 
              />
              <PermissionRow 
                icon={<Heart size={14} />} 
                label="Who can react?" 
                value={permissions.react} 
                onChange={(v) => setPermissions({ ...permissions, react: v })} 
              />
            </div>
          </section>
          
          {error && (
            <div style={{ 
              padding: '0 32px', 
              marginTop: 20, 
              color: 'oklch(0.50 0.15 25)', 
              fontSize: 13, 
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div style={footerStyle}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button type="submit" disabled={isPending || !name.trim()} style={submitBtnStyle}>
              {isPending ? 'Creating...' : 'Create Space'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PermissionRow({ icon, label, value, onChange }: { icon: React.ReactNode, label: string, value: PermissionRole, onChange: (v: PermissionRole) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'oklch(0.40 0.02 250)', fontSize: 13, fontWeight: 500 }}>
        {icon}
        {label}
      </div>
      <div style={{ position: 'relative' }}>
        <select 
          value={value} 
          onChange={(e) => onChange(e.target.value as PermissionRole)}
          style={selectStyle}
        >
          <option value="member">Everyone</option>
          <option value="admin">Admins Only</option>
          <option value="owner">Owner Only</option>
        </select>
        <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#888' }}>
          <ChevronDown size={12} />
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'oklch(0 0 0 / 0.4)',
  backdropFilter: 'blur(8px)',
  fontFamily: GILD_FONTS.sans,
};

const modalStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 24,
  width: '100%',
  maxWidth: 480,
  boxShadow: '0 20px 80px oklch(0 0 0 / 0.25)',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  padding: '32px 32px 24px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  borderBottom: '1px solid oklch(0.96 0.005 250)',
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 800,
  fontFamily: GILD_FONTS.display,
  letterSpacing: '-0.03em',
  color: '#111',
};

const subtitleStyle: React.CSSProperties = {
  margin: '4px 0 0',
  fontSize: 14,
  color: 'oklch(0.55 0.02 250)',
};

const closeBtnStyle: React.CSSProperties = {
  background: 'oklch(0.96 0.005 250)',
  border: 'none',
  fontSize: 20,
  width: 32,
  height: 32,
  borderRadius: 10,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'oklch(0.40 0.02 250)',
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const sectionStyle: React.CSSProperties = {
  padding: 32,
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  borderBottom: '1px solid oklch(0.96 0.005 250)',
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  fontSize: 13,
  fontWeight: 700,
  color: '#444',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: '1.5px solid oklch(0.94 0.005 250)',
  fontSize: 15,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'all 0.2s ease',
  background: 'oklch(0.99 0.002 250)',
};

const selectStyle: React.CSSProperties = {
  appearance: 'none',
  padding: '6px 28px 6px 12px',
  borderRadius: 8,
  border: '1px solid oklch(0.90 0.01 250)',
  fontSize: 13,
  fontWeight: 600,
  background: '#fff',
  cursor: 'pointer',
  outline: 'none',
  fontFamily: 'inherit',
};

const footerStyle: React.CSSProperties = {
  padding: 32,
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 12,
  background: 'oklch(0.985 0.002 250)',
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '12px 20px',
  borderRadius: 12,
  background: 'transparent',
  color: '#666',
  border: 'none',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
};

const submitBtnStyle: React.CSSProperties = {
  padding: '12px 24px',
  borderRadius: 12,
  background: '#111',
  color: '#fff',
  border: 'none',
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 4px 12px oklch(0 0 0 / 0.1)',
};
