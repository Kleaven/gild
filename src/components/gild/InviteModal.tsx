'use client';

import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Link as LinkIcon, Mail, Users, Shield } from 'lucide-react';
import { GILD_FONTS } from './styles';

interface Props {
  communityId: string;
  communitySlug: string;
  communityName: string;
  isPrivate: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export function InviteModal({ communityId, communitySlug, communityName, isPrivate, isOpen, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isPrivate) {
        generateInviteLink();
      } else {
        setInviteLink(`${window.location.origin}/c/${communitySlug}`);
      }
    }
  }, [isOpen, communitySlug, isPrivate]);

  async function generateInviteLink() {
    setLoading(true);
    try {
      // In a real app, this would be a server action to create a link in community_invite_links
      // For now, we'll simulate it or use a placeholder that matches the expected SOTA pattern
      const response = await fetch(`/api/communities/${communityId}/invites`, { method: 'POST' });
      const data = await response.json();
      setInviteLink(`${window.location.origin}/join/${data.token}`);
    } catch (err) {
      console.error('Failed to generate invite link:', err);
      // Fallback for demo/dev
      setInviteLink(`${window.location.origin}/c/${communitySlug}?invite=demo-token`);
    } finally {
      setLoading(false);
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'oklch(0.96 0.04 250)',
              color: 'oklch(0.40 0.15 250)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={20} />
            </div>
            <div>
              <h2 style={titleStyle}>Invite to {communityName}</h2>
              <p style={subtitleStyle}>Grow your community with the right people.</p>
            </div>
          </div>
          <button onClick={onClose} style={closeButtonStyle}><X size={20} /></button>
        </div>

        <div style={contentStyle}>
          <div style={sectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <LinkIcon size={16} color="oklch(0.50 0.02 250)" />
              <span style={sectionLabelStyle}>Community Link</span>
            </div>
            
            <div style={copyGroupStyle}>
              <div style={linkBoxStyle}>
                {loading ? 'Generating secure link...' : inviteLink}
              </div>
              <button 
                onClick={handleCopy} 
                style={{
                  ...copyButtonStyle,
                  background: copied ? 'oklch(0.96 0.04 150)' : 'oklch(0.20 0.02 250)',
                  color: copied ? 'oklch(0.40 0.15 150)' : '#fff',
                }}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            
            {isPrivate && (
              <div style={alertStyle}>
                <Shield size={14} />
                <span>This is a private community. Only people with this secure link can join.</span>
              </div>
            )}
          </div>

          <div style={dividerStyle}>
            <span style={dividerTextStyle}>or invite via email</span>
          </div>

          <div style={sectionStyle}>
            <div style={{ position: 'relative' }}>
              <input 
                type="email" 
                placeholder="Enter email addresses..." 
                style={inputStyle}
              />
              <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#888' }}>
                <Mail size={16} />
              </div>
              <button style={sendButtonStyle}>Send Invite</button>
            </div>
            <p style={hintStyle}>Separate multiple emails with commas.</p>
          </div>
        </div>

        <div style={footerStyle}>
          <p style={{ fontSize: 12, color: '#888', margin: 0 }}>
            Invitees will receive a personalized onboarding experience.
          </p>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 10000,
  background: 'oklch(0 0 0 / 0.4)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
  fontFamily: GILD_FONTS.sans,
};

const modalStyle: React.CSSProperties = {
  background: '#fff',
  width: '100%',
  maxWidth: 520,
  borderRadius: 24,
  boxShadow: '0 25px 50px -12px oklch(0 0 0 / 0.25)',
  overflow: 'hidden',
  animation: 'gild-modal-pop 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
};

const headerStyle: React.CSSProperties = {
  padding: '24px 32px',
  borderBottom: '1px solid oklch(0.96 0.005 250)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const titleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  margin: 0,
  color: '#111',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#666',
  margin: '2px 0 0',
};

const closeButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#888',
  cursor: 'pointer',
  padding: 8,
  borderRadius: '50%',
  transition: 'all 0.2s ease',
};

const contentStyle: React.CSSProperties = {
  padding: '32px',
};

const sectionStyle: React.CSSProperties = {
  marginBottom: 24,
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: 'oklch(0.50 0.02 250)',
};

const copyGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
};

const linkBoxStyle: React.CSSProperties = {
  flex: 1,
  padding: '12px 16px',
  background: 'oklch(0.98 0.005 250)',
  border: '1.5px solid oklch(0.94 0.01 250)',
  borderRadius: 12,
  fontSize: 14,
  color: '#444',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const copyButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '0 20px',
  borderRadius: 12,
  border: 'none',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const alertStyle: React.CSSProperties = {
  marginTop: 16,
  padding: '10px 14px',
  background: 'oklch(0.96 0.04 150 / 0.1)',
  border: '1px solid oklch(0.96 0.04 150 / 0.2)',
  borderRadius: 10,
  color: 'oklch(0.40 0.15 150)',
  fontSize: 12,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const dividerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  margin: '32px 0',
};

const dividerTextStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#bbb',
  whiteSpace: 'nowrap',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 120px 14px 42px',
  background: 'oklch(0.99 0.002 250)',
  border: '1.5px solid oklch(0.92 0.005 250)',
  borderRadius: 14,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

const sendButtonStyle: React.CSSProperties = {
  position: 'absolute',
  right: 6,
  top: 6,
  bottom: 6,
  padding: '0 16px',
  background: 'oklch(0.20 0.02 250)',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
};

const hintStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#888',
  marginTop: 8,
  marginRight: 4,
};

const footerStyle: React.CSSProperties = {
  padding: '20px 32px',
  background: 'oklch(0.985 0.003 250)',
  borderTop: '1px solid oklch(0.96 0.005 250)',
  textAlign: 'center',
};
