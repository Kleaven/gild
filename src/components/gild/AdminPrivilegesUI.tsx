'use client';

import React, { useState, useTransition } from 'react';
import { GILD_FONTS } from './styles';
import { Shield, Check, X, Info, Settings, Trash2, Users, MessageSquare, LayoutGrid } from 'lucide-react';
import { updateMemberPermissions } from '@/app/actions/admin'; // I will create this action

interface Permission {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const PERMISSIONS: Permission[] = [
  { id: 'manage_community', label: 'Manage Community', description: 'Can edit branding, name, and settings.', icon: <Settings size={16} /> },
  { id: 'manage_spaces', label: 'Manage Spaces', description: 'Can create, edit, and delete spaces.', icon: <LayoutGrid size={16} /> },
  { id: 'manage_members', label: 'Manage Members', description: 'Can invite, remove, and ban members.', icon: <Users size={16} /> },
  { id: 'manage_roles', label: 'Manage Roles', description: 'Can assign admin and moderator roles.', icon: <Shield size={16} /> },
  { id: 'manage_content', label: 'Manage Content', description: 'Can delete any post or comment.', icon: <MessageSquare size={16} /> },
  { id: 'delete_community', label: 'Delete Community', description: 'Can permanently delete the community.', icon: <Trash2 size={16} /> },
];

interface Props {
  communityId: string;
  userId: string;
  userName: string;
  currentPermissions: Record<string, boolean>;
  onClose: () => void;
}

export function AdminPrivilegesUI({ communityId, userId, userName, currentPermissions, onClose }: Props) {
  const [perms, setPerms] = useState<Record<string, boolean>>(currentPermissions);
  const [isPending, startTransition] = useTransition();

  const togglePerm = (id: string) => {
    setPerms(prev => ({ ...prev, [id]: !prev[id] }));
  };

  async function handleSave() {
    startTransition(async () => {
      try {
        await updateMemberPermissions(communityId, userId, perms);
        onClose();
      } catch (err) {
        console.error('Failed to update permissions', err);
      }
    });
  }

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <header style={headerStyle}>
          <div style={iconBoxStyle}>
            <Shield size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={titleStyle}>Admin Privileges: {userName}</h2>
            <p style={subtitleStyle}>Configure granular permissions for this administrator.</p>
          </div>
          <button onClick={onClose} style={closeBtnStyle}><X size={20} /></button>
        </header>

        <div style={scrollAreaStyle}>
          {PERMISSIONS.map((p) => (
            <div 
              key={p.id} 
              onClick={() => togglePerm(p.id)}
              style={{
                ...permCardStyle,
                border: perms[p.id] ? '1px solid oklch(0.20 0.02 250)' : '1px solid oklch(0.94 0.005 250)',
                background: perms[p.id] ? 'oklch(0.985 0.003 250)' : '#fff'
              }}
            >
              <div style={{
                ...checkboxStyle,
                background: perms[p.id] ? 'oklch(0.20 0.02 250)' : 'transparent',
                borderColor: perms[p.id] ? 'oklch(0.20 0.02 250)' : '#ddd'
              }}>
                {perms[p.id] && <Check size={12} color="#fff" />}
              </div>
              <div style={permIconStyle}>{p.icon}</div>
              <div style={{ flex: 1 }}>
                <h4 style={permLabelStyle}>{p.label}</h4>
                <p style={permDescStyle}>{p.description}</p>
              </div>
            </div>
          ))}
        </div>

        <footer style={footerStyle}>
          <div style={infoBoxStyle}>
            <Info size={14} />
            <span>Permissions are effective immediately across the platform.</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button 
              onClick={handleSave} 
              disabled={isPending}
              style={saveBtnStyle}
            >
              {isPending ? 'Updating...' : 'Save Privileges'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 3000,
  background: 'rgba(0,0,0,0.5)',
  backdropFilter: 'blur(12px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  animation: 'gild-fade-in 0.2s ease-out'
};

const modalContentStyle: React.CSSProperties = {
  background: '#fff',
  width: '100%',
  maxWidth: 520,
  borderRadius: 24,
  display: 'flex',
  flexDirection: 'column',
  maxHeight: '90vh',
  boxShadow: '0 40px 120px rgba(0,0,0,0.3)',
  animation: 'gild-pop-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  overflow: 'hidden',
  fontFamily: GILD_FONTS.sans
};

const headerStyle: React.CSSProperties = {
  padding: '32px 32px 24px',
  display: 'flex',
  alignItems: 'center',
  gap: 20,
  borderBottom: '1px solid oklch(0.96 0.005 250)'
};

const iconBoxStyle: React.CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: 16,
  background: 'oklch(0.96 0.04 250)',
  color: 'oklch(0.20 0.02 250)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
};

const titleStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  margin: 0,
  letterSpacing: '-0.02em',
  color: '#111'
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 14,
  color: 'oklch(0.55 0.02 250)',
  margin: '4px 0 0'
};

const closeBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: 8,
  cursor: 'pointer',
  color: '#aaa'
};

const scrollAreaStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '24px 32px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12
};

const permCardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  padding: '16px',
  borderRadius: 16,
  cursor: 'pointer',
  transition: 'all 0.2s ease'
};

const checkboxStyle: React.CSSProperties = {
  width: 20,
  height: 20,
  borderRadius: 6,
  border: '2px solid',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
  flexShrink: 0
};

const permIconStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 8,
  background: 'oklch(0.98 0.005 250)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'oklch(0.40 0.02 250)',
  flexShrink: 0
};

const permLabelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  margin: 0,
  color: '#111'
};

const permDescStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'oklch(0.55 0.02 250)',
  margin: '2px 0 0'
};

const footerStyle: React.CSSProperties = {
  padding: '24px 32px 32px',
  borderTop: '1px solid oklch(0.96 0.005 250)',
  display: 'flex',
  flexDirection: 'column',
  gap: 20
};

const infoBoxStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 12,
  color: 'oklch(0.45 0.15 150)',
  background: 'oklch(0.97 0.04 150)',
  padding: '8px 12px',
  borderRadius: 10,
  fontWeight: 600
};

const cancelBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '12px',
  borderRadius: 12,
  background: 'transparent',
  border: '1px solid oklch(0.90 0.01 250)',
  color: '#111',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer'
};

const saveBtnStyle: React.CSSProperties = {
  flex: 2,
  padding: '12px',
  borderRadius: 12,
  background: 'oklch(0.20 0.02 250)',
  color: '#fff',
  border: 'none',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer'
};
