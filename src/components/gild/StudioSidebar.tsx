'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar } from './GildPrimitives';
import { GILD_FONTS } from './styles';
import { CreateSpaceModal } from './CreateSpaceModal';
import { LeaveCommunityModal } from './LeaveCommunityModal';
import { InviteModal } from './InviteModal';
import type { Person } from './types';

interface StudioSidebarProps {
  community: {
    id: string;
    name: string;
    member_count: number;
    plan: string | null;
    theme_hue?: number;
    logo_url?: string | null;
    welcome_message?: string | null;
    goodbye_message?: string | null;
    is_private?: boolean;
    slug: string;
  };
  spaces: { id: string; name: string; hue?: number; [key: string]: unknown }[];
  currentUser: Person;
  showCourses?: boolean;
}

const MOBILE_BP = 768;

export function StudioSidebar({
  community,
  spaces,
  currentUser,
  showCourses = false,
}: StudioSidebarProps) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isCreateSpaceOpen, setIsCreateSpaceOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth <= MOBILE_BP);
    }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const sidebarContent = (
    <aside style={{
      background: 'oklch(0.985 0.003 250 / 0.75)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderRight: '1px solid oklch(0.94 0.005 250 / 0.6)',
      padding: '14px 10px',
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      width: 240,
      flexShrink: 0,
      fontFamily: GILD_FONTS.sans,
      height: '100%',
      overflowY: 'auto',
    }}>
      {/* Community header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '4px 8px',
      }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          background: community.logo_url ? `url(${community.logo_url}) center/cover` : `linear-gradient(135deg, oklch(0.78 0.14 ${community.theme_hue || 75}), oklch(0.55 0.14 ${community.theme_hue || 75}))`,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: GILD_FONTS.display,
          fontWeight: 800,
          fontSize: 14,
          letterSpacing: '-0.04em',
          overflow: 'hidden',
        }}>
          {!community.logo_url && community.name[0]}
        </div>
        <div style={{ lineHeight: 1.25, flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 13,
            fontWeight: 600,
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>{community.name}</p>
          <p style={{ fontSize: 11, color: 'oklch(0.50 0.02 250)', margin: 0 }}>
            {community.member_count} members · {community.plan || 'Free'}
          </p>
        </div>
      </div>

      {/* Spaces */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px 4px' }}>
          <p style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'oklch(0.55 0.02 250)',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}>Spaces</p>
          {(currentUser.role === 'owner' || currentUser.role === 'admin') && (
            <button
              onClick={() => setIsCreateSpaceOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'oklch(0.55 0.02 250)',
                cursor: 'pointer',
                fontSize: 16,
                lineHeight: 1,
                padding: '0 4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Create Space"
            >
              +
            </button>
          )}
        </div>
        {spaces.map(s => {
          const isActive = pathname.includes(`/s/${s.id}`);
          return (
            <Link key={s.id} href={`/c/${community.slug}/s/${s.id}`} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '5px 10px',
              borderRadius: 6,
              marginBottom: 1,
              textDecoration: 'none',
              fontSize: 14,
              background: isActive ? `oklch(0.96 0.01 ${community.theme_hue || 250})` : 'transparent',
              color: isActive ? `oklch(0.20 0.02 ${community.theme_hue || 250})` : 'oklch(0.30 0.02 250)',
              fontWeight: isActive ? 600 : 400,
            }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: `oklch(0.62 0.16 ${s.hue || community.theme_hue || 220})`,
                boxShadow: isActive
                  ? `0 0 0 3px oklch(0.62 0.16 ${s.hue || community.theme_hue || 220} / 0.18)`
                  : 'none',
              }}/>
              <span style={{ flex: 1 }}>{s.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Library */}
      <div>
        <p style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'oklch(0.55 0.02 250)',
          padding: '0 10px 4px',
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>Library</p>
        {[
          { label: 'Members', href: `/c/${community.slug}/members` },
          ...(showCourses ? [{ label: 'Courses', href: `/c/${community.slug}/courses` }] : []),
          { label: 'Search', href: `/c/${community.slug}/search` },
          // Moderation queue — owner/admin only. Lives under Library to match
          // the existing nav structure for admin-tier surfaces.
          ...((currentUser.role === 'owner' || currentUser.role === 'admin')
            ? [{ label: 'Moderation', href: `/c/${community.slug}/moderation` }]
            : []),
          ...(currentUser.role !== 'owner' ? [{ label: 'Leave Community', onClick: () => setIsLeaveModalOpen(true), danger: true }] : []),
        ].map((item: any) => {
          if (item.onClick) {
            return (
              <button key={item.label} onClick={item.onClick} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '5px 10px',
                borderRadius: 6,
                border: 'none',
                background: item.primary ? `oklch(0.20 0.02 ${community.theme_hue || 250})` : 'transparent',
                width: '100%',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: 14,
                color: item.primary ? '#fff' : item.danger ? 'oklch(0.50 0.16 25)' : 'oklch(0.30 0.02 250)',
                fontWeight: 600,
                marginBottom: item.primary ? 8 : 0,
                boxShadow: item.primary ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
              }}>
                <span style={{ flex: 1 }}>{item.label}</span>
              </button>
            );
          }
          const isActive = pathname === item.href;
          return (
            <Link key={item.label} href={item.href} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '5px 10px',
              borderRadius: 6,
              textDecoration: 'none',
              fontSize: 14,
              color: isActive ? '#202020' : 'oklch(0.30 0.02 250)',
              background: isActive ? 'oklch(0.94 0.005 250)' : 'transparent',
              fontWeight: isActive ? 600 : 400,
            }}>
              <span style={{ flex: 1 }}>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Admin */}
      {(currentUser.role === 'owner' || currentUser.role === 'admin') && (
        <div>
          <p style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'oklch(0.55 0.02 250)',
            padding: '0 10px 4px',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}>Admin</p>
          <Link href={`/c/${community.slug}/dashboard`} style={{
            display: 'flex',
            alignItems: 'center',
            padding: '5px 10px',
            borderRadius: 6,
            textDecoration: 'none',
            fontSize: 14,
            color: pathname.includes('/dashboard') ? '#202020' : 'oklch(0.30 0.02 250)',
            background: pathname.includes('/dashboard')
              ? 'oklch(0.94 0.005 250)'
              : 'transparent',
            fontWeight: pathname.includes('/dashboard') ? 600 : 400,
          }}>
            Dashboard
          </Link>
          <Link href={`/c/${community.slug}/settings`} style={{
            display: 'flex',
            alignItems: 'center',
            padding: '5px 10px',
            borderRadius: 6,
            textDecoration: 'none',
            fontSize: 14,
            color: pathname.includes('/settings') ? '#202020' : 'oklch(0.30 0.02 250)',
            background: pathname.includes('/settings')
              ? 'oklch(0.94 0.005 250)'
              : 'transparent',
            fontWeight: pathname.includes('/settings') ? 600 : 400,
          }}>
            Settings
          </Link>
        </div>
      )}

      {/* User footer */}
      <div style={{
        marginTop: 'auto',
        padding: 10,
        borderRadius: 8,
        background: 'oklch(0.94 0.005 250)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <Avatar person={currentUser} size={24} presence />
        <div style={{ flex: 1, lineHeight: 1.2, minWidth: 0 }}>
          <p style={{
            fontSize: 12,
            fontWeight: 600,
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>{currentUser.name}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link 
              href="/settings/profile"
              style={{
                fontSize: 11,
                color: 'oklch(0.50 0.02 250)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Settings
            </Link>
            <span style={{ color: 'oklch(0.80 0.01 250)' }}>·</span>
            <button 
              onClick={() => {
                const supabase = require('@/lib/auth/client').getSupabaseBrowserClient();
                supabase.auth.signOut().then(() => window.location.href = '/');
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: 11,
                color: 'oklch(0.40 0.15 25)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={() => setIsInviteModalOpen(true)}
        style={{
          marginTop: 12,
          padding: '10px',
          borderRadius: 8,
          background: `oklch(0.25 0.05 ${community.theme_hue || 250})`,
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          width: '100%',
          boxShadow: '0 4px 12px oklch(0 0 0 / 0.05)',
        }}
      >
        <span>Invite People</span>
      </button>
    </aside>
  );

  const modals = (
    <>
      <CreateSpaceModal
        communityId={community.id}
        communitySlug={community.slug || ''}
        isOpen={isCreateSpaceOpen}
        onClose={() => setIsCreateSpaceOpen(false)}
      />
      <LeaveCommunityModal
        communityId={community.id}
        communityName={community.name}
        message={community.goodbye_message}
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
      />
      <InviteModal
        communityId={community.id}
        communitySlug={community.slug || ''}
        communityName={community.name}
        isPrivate={community.is_private || false}
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </>
  );

  // ─── Desktop ───────────────────────────────────────────────────────────────
  if (!isMobile) {
    return (
      <>
        {sidebarContent}
        {modals}
      </>
    );
  }

  // ─── Mobile ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setDrawerOpen((o) => !o)}
        aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
        style={{
          position: 'fixed',
          top: 60,
          left: 12,
          zIndex: 200,
          width: 36,
          height: 36,
          borderRadius: 8,
          border: '1px solid oklch(0.90 0.01 250)',
          background: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 4,
          padding: 0,
          boxShadow: '0 1px 4px oklch(0 0 0 / 0.08)',
        }}
      >
        {drawerOpen ? (
          // × close icon
          <span style={{
            fontSize: 18,
            lineHeight: 1,
            color: '#111',
            fontFamily: GILD_FONTS.sans,
          }}>×</span>
        ) : (
          // ☰ hamburger lines
          <>
            <span style={{
              width: 16, height: 2, borderRadius: 1,
              background: 'oklch(0.30 0.02 250)',
            }}/>
            <span style={{
              width: 16, height: 2, borderRadius: 1,
              background: 'oklch(0.30 0.02 250)',
            }}/>
            <span style={{
              width: 16, height: 2, borderRadius: 1,
              background: 'oklch(0.30 0.02 250)',
            }}/>
          </>
        )}
      </button>

      {/* Backdrop */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 150,
            background: 'oklch(0 0 0 / 0.35)',
          }}
        />
      )}

      {/* Drawer */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 160,
        width: 260,
        transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: drawerOpen ? '4px 0 24px oklch(0 0 0 / 0.12)' : 'none',
      }}>
        {sidebarContent}
      </div>

      {modals}
    </>
  );
}
