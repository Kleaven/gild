'use client';

import React, { useState, useTransition } from 'react';
import { updateSpace, deleteSpace } from '@/app/actions';
import { GILD_FONTS } from '@/components/gild';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Globe, Trash2, X, ChevronDown, Check } from 'lucide-react';

interface Props {
  communityId: string;
  space: {
    id: string;
    name: string;
    description: string | null;
    is_private: boolean;
    role_permissions: any;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function SpaceSettingsModal({ communityId, space, isOpen, onClose }: Props) {
  const router = useRouter();
  const [name, setName] = useState(space.name);
  const [description, setDescription] = useState(space.description || '');
  const [isPrivate, setIsPrivate] = useState(space.is_private);
  const [rolePermissions, setRolePermissions] = useState(space.role_permissions || {
    member: { can_view: true, can_post: true, can_comment: true, can_react: true },
    admin: { can_view: true, can_post: true, can_comment: true, can_react: true }
  });
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateSpace(space.id, {
          name,
          description,
          isPrivate,
          role_permissions: rolePermissions,
        }, communityId);
        onClose();
        router.refresh();
      } catch (err) {
        console.error('Failed to update space', err);
      }
    });
  }

  function handleDelete() {
    if (!confirm(`Are you sure you want to delete #${space.name}?`)) return;
    startTransition(async () => {
      try {
        await deleteSpace(space.id, communityId);
        onClose();
        router.push(`/c/${communityId}`);
      } catch (err) {
        console.error('Failed to delete space', err);
      }
    });
  }

  const togglePerm = (role: string, key: string) => {
    setRolePermissions({
      ...rolePermissions,
      [role]: { ...rolePermissions[role], [key]: !rolePermissions[role][key] }
    });
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <div>
            <h2 style={titleStyle}>Space Settings</h2>
            <p style={subtitleStyle}>Configure access and interaction for #{space.name}</p>
          </div>
          <button onClick={onClose} style={closeBtnStyle}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={scrollContentStyle}>
            <section style={sectionStyle}>
              <label style={labelStyle}>
                Space Name
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Description
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  style={{ ...inputStyle, resize: 'none' }}
                />
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Permissions Overrides</h3>
              </div>

              {['member', 'admin'].map(role => (
                <div key={role} style={roleBlockStyle}>
                  <p style={roleLabelStyle}>{role.toUpperCase()} ACCESS</p>
                  <div style={permsGridStyle}>
                    {[
                      { key: 'can_view', label: 'View' },
                      { key: 'can_post', label: 'Post' },
                      { key: 'can_comment', label: 'Comment' },
                      { key: 'can_react', label: 'React' },
                    ].map(perm => {
                      const active = rolePermissions[role]?.[perm.key];
                      return (
                        <div 
                          key={perm.key} 
                          onClick={() => togglePerm(role, perm.key)}
                          style={{
                            ...permItemStyle,
                            background: active ? 'oklch(0.96 0.04 150 / 0.2)' : 'oklch(0.99 0.002 250)',
                            borderColor: active ? 'oklch(0.62 0.18 150)' : 'oklch(0.94 0.005 250)',
                            color: active ? 'oklch(0.40 0.15 150)' : '#888',
                          }}
                        >
                          {active && <Check size={12} />}
                          <span>{perm.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>

            <section style={{ ...sectionStyle, borderBottom: 'none' }}>
              <button 
                type="button" 
                onClick={handleDelete}
                style={deleteBtnStyle}
              >
                <Trash2 size={14} />
                Delete Space
              </button>
            </section>
          </div>

          <div style={footerStyle}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button type="submit" disabled={isPending} style={submitBtnStyle}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 10000,
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
  maxWidth: 500,
  boxShadow: '0 20px 80px oklch(0 0 0 / 0.25)',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  padding: '24px 32px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid oklch(0.96 0.005 250)',
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 800,
  color: '#111',
};

const subtitleStyle: React.CSSProperties = {
  margin: '2px 0 0',
  fontSize: 13,
  color: '#666',
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#888',
  cursor: 'pointer',
  padding: 8,
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const scrollContentStyle: React.CSSProperties = {
  maxHeight: '60vh',
  overflowY: 'auto',
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
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
  background: 'oklch(0.99 0.002 250)',
};

const roleBlockStyle: React.CSSProperties = {
  marginBottom: 20,
};

const roleLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: '0.04em',
  color: '#bbb',
  marginBottom: 10,
};

const permsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 8,
};

const permItemStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 10,
  border: '1.5px solid transparent',
  fontSize: 13,
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const deleteBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  background: 'none',
  border: 'none',
  color: 'oklch(0.45 0.15 25)',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  padding: 0,
};

const footerStyle: React.CSSProperties = {
  padding: 32,
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 12,
  background: 'oklch(0.985 0.002 250)',
  borderTop: '1px solid oklch(0.96 0.005 250)',
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: 10,
  background: 'transparent',
  color: '#666',
  border: 'none',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const submitBtnStyle: React.CSSProperties = {
  padding: '10px 24px',
  borderRadius: 10,
  background: '#111',
  color: '#fff',
  border: 'none',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
};
