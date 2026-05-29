'use client';

import React from 'react';
import { Shield, Info } from 'lucide-react';

interface PermissionConfig {
  can_post: boolean;
  can_comment: boolean;
  can_react: boolean;
  can_invite: boolean;
  manage_members: boolean;
  manage_spaces: boolean;
}

interface Props {
  role: string;
  permissions: PermissionConfig;
  onChange: (newPerms: PermissionConfig) => void;
}

export function RolePermissionsEditor({ role, permissions, onChange }: Props) {
  const toggle = (key: keyof PermissionConfig) => {
    onChange({ ...permissions, [key]: !permissions[key] });
  };

  const permsList = [
    { key: 'can_post', label: 'Create Posts', description: 'Can start new discussions or share content.' },
    { key: 'can_comment', label: 'Comment', description: 'Can reply to posts and join conversations.' },
    { key: 'can_react', label: 'React', description: 'Can add emojis to express sentiments on content.' },
    { key: 'can_invite', label: 'Invite People', description: 'Can generate invite links and invite new members.' },
    { key: 'manage_members', label: 'Manage Members', description: 'Can ban members and update roles.' },
    { key: 'manage_spaces', label: 'Manage Spaces', description: 'Can create, edit, and delete spaces.' },
  ] as const;

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={18} color="oklch(0.50 0.02 250)" />
          <h3 style={titleStyle}>{role === 'admin' ? 'Admin Permissions' : 'Member Permissions'}</h3>
        </div>
        <div style={badgeStyle}>{role.toUpperCase()}</div>
      </div>

      <div style={gridStyle}>
        {permsList.map(({ key, label, description }) => {
          const isEnabled = permissions[key];
          // Owners and admins usually have most perms, but we allow fine-tuning
          return (
            <div key={key} onClick={() => toggle(key)} style={{
              ...itemStyle,
              borderColor: isEnabled ? 'oklch(0.92 0.04 150)' : 'oklch(0.96 0.005 250)',
              background: isEnabled ? 'oklch(0.99 0.04 150 / 0.3)' : 'transparent',
            }}>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>{label}</div>
                <div style={descStyle}>{description}</div>
              </div>
              <div style={{
                ...toggleStyle,
                background: isEnabled ? 'oklch(0.62 0.18 150)' : 'oklch(0.90 0.01 250)',
              }}>
                <div style={{
                  ...thumbStyle,
                  transform: isEnabled ? 'translateX(18px)' : 'translateX(2px)',
                }} />
              </div>
            </div>
          );
        })}
      </div>
      
      <div style={footerStyle}>
        <Info size={14} />
        <span>Owner permissions are immutable and grant full access to everything.</span>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  background: '#fff',
  border: '1.5px solid oklch(0.94 0.01 250)',
  borderRadius: 20,
  overflow: 'hidden',
  marginBottom: 24,
};

const headerStyle: React.CSSProperties = {
  padding: '16px 20px',
  background: 'oklch(0.985 0.003 250)',
  borderBottom: '1px solid oklch(0.96 0.005 250)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const titleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  margin: 0,
  color: '#111',
};

const badgeStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  padding: '2px 8px',
  borderRadius: 999,
  background: 'oklch(0.94 0.01 250)',
  color: 'oklch(0.40 0.02 250)',
  letterSpacing: '0.04em',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
  padding: 20,
};

const itemStyle: React.CSSProperties = {
  padding: '14px',
  borderRadius: 14,
  border: '1.5px solid transparent',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  cursor: 'pointer',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
};

const labelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#111',
  marginBottom: 2,
};

const descStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#666',
  lineHeight: 1.4,
};

const toggleStyle: React.CSSProperties = {
  width: 36,
  height: 20,
  borderRadius: 10,
  position: 'relative',
  transition: 'background 0.2s ease',
  flexShrink: 0,
};

const thumbStyle: React.CSSProperties = {
  width: 16,
  height: 16,
  borderRadius: '50%',
  background: '#fff',
  position: 'absolute',
  top: 2,
  transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
};

const footerStyle: React.CSSProperties = {
  padding: '12px 20px',
  background: 'oklch(0.99 0.002 250)',
  borderTop: '1px solid oklch(0.96 0.005 250)',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 11,
  color: '#888',
};
