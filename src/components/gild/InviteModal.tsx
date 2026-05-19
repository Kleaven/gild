'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { X, Copy, Check, Link as LinkIcon, Mail, Users, Shield, Trash2, Plus } from 'lucide-react';
import { GILD_FONTS } from './styles';
import {
  createSharedInviteLink,
  listSharedInviteLinks,
  revokeSharedInviteLink,
} from '@/app/actions';
import type { SharedInviteLink } from '@/app/actions/invitations';

interface Props {
  communityId: string;
  communitySlug: string;
  communityName: string;
  isPrivate: boolean;
  isOpen: boolean;
  onClose: () => void;
}

function inviteUrl(slug: string, token: string): string {
  if (typeof window === 'undefined') return `/c/${slug}?invite=${token}`;
  return `${window.location.origin}/c/${slug}?invite=${token}`;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const day = 24 * 60 * 60 * 1000;
  if (diff < 60 * 1000) return 'just now';
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < day) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 14 * day) return `${Math.floor(diff / day)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatExpiry(iso: string | null): string {
  if (!iso) return 'No expiry';
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'Expired';
  if (days === 1) return 'Expires tomorrow';
  if (days < 30) return `Expires in ${days}d`;
  return `Expires ${new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

export function InviteModal({ communityId, communitySlug, communityName, isPrivate, isOpen, onClose }: Props) {
  const [links, setLinks] = useState<SharedInviteLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setLoading(true);
    (async () => {
      const res = await listSharedInviteLinks(communityId);
      setLoading(false);
      if (!res.ok) {
        setError(res.error ?? 'Failed to load invite links');
        return;
      }
      setLinks(res.links ?? []);
    })();
  }, [isOpen, communityId]);

  async function handleCreate() {
    setError(null);
    setCreating(true);
    const res = await createSharedInviteLink({ communityId, expiresInDays: 30 });
    setCreating(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setLinks((prev) => [res.link, ...prev]);
  }

  function handleRevoke(linkId: string) {
    const snapshot = links;
    setLinks((prev) => prev.filter((l) => l.id !== linkId));
    startTransition(async () => {
      const res = await revokeSharedInviteLink(linkId);
      if (!res.ok) {
        setLinks(snapshot);
        setError(res.error ?? 'Failed to revoke link');
      }
    });
  }

  function handleCopy(token: string) {
    navigator.clipboard.writeText(inviteUrl(communitySlug, token));
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={iconBoxStyle}>
              <Users size={20} />
            </div>
            <div>
              <h2 style={titleStyle}>Invite to {communityName}</h2>
              <p style={subtitleStyle}>Share a link or revoke access at any time.</p>
            </div>
          </div>
          <button onClick={onClose} style={closeButtonStyle} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div style={contentStyle}>
          {/* Public-community direct link */}
          {!isPrivate && (
            <div>
              <div style={sectionHeaderStyle}>
                <LinkIcon size={14} color="oklch(0.50 0.02 250)" />
                <span style={sectionLabelStyle}>Community page</span>
              </div>
              <p style={{ ...hintStyle, margin: '4px 0 10px' }}>
                Anyone can join from this URL without an invite token (community is public).
              </p>
              <div style={copyGroupStyle}>
                <div style={linkBoxStyle}>
                  {typeof window !== 'undefined' ? `${window.location.origin}/c/${communitySlug}` : `/c/${communitySlug}`}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/c/${communitySlug}`);
                    setCopiedToken('public');
                    setTimeout(() => setCopiedToken(null), 2000);
                  }}
                  style={{
                    ...copyButtonStyle,
                    background: copiedToken === 'public' ? 'oklch(0.96 0.04 150)' : 'oklch(0.20 0.02 250)',
                    color: copiedToken === 'public' ? 'oklch(0.40 0.15 150)' : '#fff',
                  }}
                >
                  {copiedToken === 'public' ? <Check size={16} /> : <Copy size={16} />}
                  {copiedToken === 'public' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {/* Shared invite links */}
          <div>
            <div style={{ ...sectionHeaderStyle, justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={14} color="oklch(0.50 0.02 250)" />
                <span style={sectionLabelStyle}>Shared invite links</span>
              </div>
              <button type="button" onClick={handleCreate} disabled={creating} style={smallPrimaryButton}>
                <Plus size={13} />
                {creating ? 'Creating…' : 'New link'}
              </button>
            </div>
            <p style={{ ...hintStyle, margin: '4px 0 12px' }}>
              Anyone with the link can join. New links expire in 30 days.
            </p>

            {error && (
              <p role="alert" style={errorChipStyle}>
                {error}
              </p>
            )}

            {loading ? (
              <p style={{ fontSize: 13, color: 'oklch(0.55 0.02 250)', margin: '12px 0' }}>
                Loading links…
              </p>
            ) : links.length === 0 ? (
              <div style={emptyStyle}>
                <p style={{ margin: 0, fontSize: 13, color: 'oklch(0.50 0.02 250)' }}>
                  No active invite links. Create one above.
                </p>
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {links.map((link) => {
                  const usesLabel = link.max_uses === null
                    ? `${link.uses} uses · unlimited`
                    : `${link.uses}/${link.max_uses} uses`;
                  const url = inviteUrl(communitySlug, link.token);
                  return (
                    <li key={link.id} style={linkRowStyle}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ ...linkBoxStyle, fontFamily: GILD_FONTS.mono, fontSize: 12, marginBottom: 6 }}>
                          {url}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            flexWrap: 'wrap',
                            fontSize: 11,
                            color: 'oklch(0.55 0.02 250)',
                            fontFamily: GILD_FONTS.mono,
                            letterSpacing: '0.02em',
                          }}
                        >
                          <span>{usesLabel}</span>
                          <span>·</span>
                          <span>{formatExpiry(link.expires_at)}</span>
                          <span>·</span>
                          <span>created {relativeTime(link.created_at)}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => handleCopy(link.token)}
                          style={{
                            ...iconBtnStyle,
                            background: copiedToken === link.token ? 'oklch(0.96 0.04 150)' : '#fff',
                            color: copiedToken === link.token ? 'oklch(0.40 0.15 150)' : 'oklch(0.35 0.02 250)',
                          }}
                          aria-label="Copy invite URL"
                        >
                          {copiedToken === link.token ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRevoke(link.id)}
                          style={{
                            ...iconBtnStyle,
                            color: 'oklch(0.45 0.16 25)',
                            borderColor: 'oklch(0.88 0.08 25)',
                          }}
                          aria-label="Revoke invite link"
                          title="Revoke"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Email invitations — still a stub. The infrastructure for
              one-shot per-recipient email invites (public.invitations
              table + Resend integration) is a future feature. */}
          <div style={emailStubStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Mail size={16} color="oklch(0.50 0.02 250)" />
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'oklch(0.30 0.02 250)' }}>
                  Email invites coming soon
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'oklch(0.55 0.02 250)' }}>
                  For now, paste the shared link above into your existing email tool.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 10000,
  background: 'oklch(0 0 0 / 0.4)', backdropFilter: 'blur(8px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 20, fontFamily: GILD_FONTS.sans,
};
const modalStyle: React.CSSProperties = {
  background: '#fff', width: '100%', maxWidth: 560, borderRadius: 20,
  boxShadow: '0 25px 50px -12px oklch(0 0 0 / 0.25)',
  overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
};
const headerStyle: React.CSSProperties = {
  padding: '20px 24px', borderBottom: '1px solid oklch(0.96 0.005 250)',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  flexShrink: 0,
};
const iconBoxStyle: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 12,
  background: 'oklch(0.96 0.04 250)', color: 'oklch(0.40 0.15 250)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const titleStyle: React.CSSProperties = {
  fontSize: 17, fontWeight: 700, margin: 0, color: '#111',
  fontFamily: GILD_FONTS.display, letterSpacing: '-0.01em',
};
const subtitleStyle: React.CSSProperties = {
  fontSize: 13, color: '#666', margin: '2px 0 0',
};
const closeButtonStyle: React.CSSProperties = {
  background: 'none', border: 'none', color: '#888',
  cursor: 'pointer', padding: 6, borderRadius: 8,
};
const contentStyle: React.CSSProperties = {
  padding: '20px 24px 24px', overflowY: 'auto', flex: 1,
  display: 'flex', flexDirection: 'column', gap: 20,
};
const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
};
const sectionLabelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.06em', color: 'oklch(0.40 0.02 250)',
  fontFamily: GILD_FONTS.mono,
};
const copyGroupStyle: React.CSSProperties = { display: 'flex', gap: 8 };
const linkBoxStyle: React.CSSProperties = {
  flex: 1, padding: '10px 12px',
  background: 'oklch(0.98 0.005 250)', border: '1px solid oklch(0.93 0.01 250)',
  borderRadius: 8, fontSize: 13, color: '#444',
  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  minWidth: 0,
};
const copyButtonStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px',
  borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit',
};
const smallPrimaryButton: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '6px 10px', borderRadius: 6,
  background: 'oklch(0.20 0.02 250)', color: '#fff', border: 'none',
  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
};
const linkRowStyle: React.CSSProperties = {
  display: 'flex', gap: 10, alignItems: 'flex-start',
  padding: '12px', border: '1px solid oklch(0.94 0.005 250)', borderRadius: 10,
  background: '#fff',
};
const iconBtnStyle: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 6,
  background: '#fff', border: '1px solid oklch(0.92 0.01 250)',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const emptyStyle: React.CSSProperties = {
  padding: '20px', textAlign: 'center',
  background: 'oklch(0.98 0.005 250)',
  border: '1px dashed oklch(0.90 0.01 250)', borderRadius: 10,
};
const emailStubStyle: React.CSSProperties = {
  padding: '14px 16px',
  background: 'oklch(0.985 0.005 250)',
  border: '1px solid oklch(0.93 0.005 250)',
  borderRadius: 10,
};
const errorChipStyle: React.CSSProperties = {
  margin: '0 0 10px', padding: '10px 12px', borderRadius: 8,
  background: 'oklch(0.96 0.04 25)', border: '1px solid oklch(0.88 0.08 25)',
  color: 'oklch(0.40 0.16 25)', fontSize: 13, lineHeight: 1.4,
};
const hintStyle: React.CSSProperties = {
  fontSize: 12, color: 'oklch(0.55 0.02 250)', margin: 0,
};
