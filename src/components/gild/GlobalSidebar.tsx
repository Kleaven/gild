'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Wordmark, Avatar, GILD_FONTS } from '@/components/gild';
import { signOut } from '@/lib/auth/actions';
import { 
  Users, 
  Settings, 
  LogOut, 
  Plus, 
  ChevronRight, 
  Search,
  LayoutGrid,
  ShieldCheck,
  User,
  CreditCard
} from 'lucide-react';

interface Community {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  theme_hue?: number;
}

interface GlobalSidebarProps {
  user: {
    id: string;
    display_name: string;
    username: string | null;
    avatar_url: string | null;
  };
  communities: {
    owned: Community[];
    managed: Community[];
    joined: Community[];
  };
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSidebar({ user, communities, isOpen, onClose }: GlobalSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Close when pathname changes
  useEffect(() => {
    onClose();
  }, [pathname]);

  if (!isOpen) return null;

  const handleLogout = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          animation: 'gild-fade-in 0.2s ease-out'
        }}
      />

      {/* Sidebar.
          Layout invariants:
            - height: 100dvh (dynamic viewport height) guarantees the column
              fills the screen even when the parent has a transform-induced
              containing block, and respects mobile URL-bar collapse.
            - The middle row is flex:1 with min-height: 0, so it can shrink
              when content overflows AND grow to push the footer to the
              very bottom when content is short. Without min-height: 0,
              flex children default to min-height: auto = content height,
              which prevents shrinking AND prevents overflowY: auto from
              kicking in on small viewports. That was the bug. */}
      <aside style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: 320,
        height: '100dvh',
        background: '#fff',
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '4px 0 40px rgba(0,0,0,0.1)',
        animation: 'gild-slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        fontFamily: GILD_FONTS.sans
      }}>
        <header style={{
          padding: '24px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid oklch(0.96 0.005 250)',
          flexShrink: 0,
        }}>
          <Wordmark size={22} />
          <button 
            onClick={onClose}
            style={{ 
              background: 'oklch(0.96 0.005 250)', 
              border: 'none', 
              borderRadius: 8, 
              width: 32, 
              height: 32, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'oklch(0.40 0.02 250)'
            }}
          >
            <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
          </button>
        </header>

        <div style={{ flex: '1 1 0%', minHeight: 0, overflowY: 'auto', padding: '12px 12px 24px' }}>
          {/* Quick Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 24 }}>
             <SidebarItem 
              icon={<Search size={18} />} 
              label="Explore Communities" 
              href="/communities" 
              active={pathname === '/communities'}
            />
            <SidebarItem 
              icon={<Plus size={18} />} 
              label="Create Community" 
              href="/communities/new" 
              active={pathname === '/communities/new'}
            />
          </div>

          {/* Communities Sections */}
          <Section label="Your Communities" count={communities.owned.length}>
            {communities.owned.map(c => (
              <CommunityItem key={c.id} community={c} />
            ))}
          </Section>

          <Section label="Managing" count={communities.managed.length}>
            {communities.managed.map(c => (
              <CommunityItem key={c.id} community={c} />
            ))}
          </Section>

          <Section label="Joined" count={communities.joined.length}>
            {communities.joined.map(c => (
              <CommunityItem key={c.id} community={c} />
            ))}
          </Section>
        </div>

        {/* User Footer */}
        <footer style={{
          padding: '16px',
          borderTop: '1px solid oklch(0.96 0.005 250)',
          background: 'oklch(0.99 0.002 250)',
          flexShrink: 0,
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12, 
            padding: '10px',
            borderRadius: 12,
            background: '#fff',
            border: '1px solid oklch(0.95 0.005 250)',
            marginBottom: 12
          }}>
            <Avatar 
              person={{ 
                id: user.id, 
                name: user.display_name, 
                avatar_url: user.avatar_url,
                role: 'free_member',
                hue: user.id.charCodeAt(0) * 10 % 360,
                online: true 
              }} 
              size={36} 
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.display_name}
              </p>
              <p style={{ fontSize: 12, color: 'oklch(0.55 0.02 250)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                @{user.username || 'user'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <SidebarItem 
              icon={<User size={18} />} 
              label="Profile & Security" 
              href="/settings" 
              active={pathname === '/settings'}
            />
            <SidebarItem 
              icon={<CreditCard size={18} />} 
              label="Billing & Subscription" 
              href="/settings/billing" 
              active={pathname === '/settings/billing'}
            />
            <button 
              onClick={handleLogout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 10,
                background: 'transparent',
                border: 'none',
                color: 'oklch(0.50 0.16 25)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'oklch(0.98 0.01 25)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </footer>
      </aside>

      <style>{`
        @keyframes gild-slide-in {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes gild-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}

function Section({ label, count, children }: { label: string, count: number, children: React.ReactNode }) {
  if (count === 0) return null;
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ 
        fontSize: 11, 
        fontWeight: 800, 
        color: 'oklch(0.55 0.02 250)', 
        textTransform: 'uppercase', 
        letterSpacing: '0.05em',
        padding: '0 12px',
        margin: '0 0 8px'
      }}>
        {label}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {children}
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, href, active }: { icon: React.ReactNode, label: string, href: string, active: boolean }) {
  return (
    <Link 
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        borderRadius: 10,
        textDecoration: 'none',
        background: active ? 'oklch(0.96 0.005 250)' : 'transparent',
        color: active ? '#111' : 'oklch(0.40 0.02 250)',
        fontSize: 14,
        fontWeight: active ? 700 : 500,
        transition: 'all 0.2s ease'
      }}
      onMouseOver={(e) => { if (!active) e.currentTarget.style.background = 'oklch(0.98 0.002 250)'; }}
      onMouseOut={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ color: active ? '#111' : 'oklch(0.55 0.02 250)' }}>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function CommunityItem({ community }: { community: Community }) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(`/c/${community.slug}`);

  return (
    <Link
      href={`/c/${community.slug}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 12px',
        borderRadius: 10,
        textDecoration: 'none',
        background: isActive ? 'oklch(0.96 0.01 250)' : 'transparent',
        color: isActive ? '#111' : 'oklch(0.30 0.02 250)',
        fontSize: 14,
        fontWeight: isActive ? 700 : 500,
        transition: 'all 0.2s ease'
      }}
      onMouseOver={(e) => { if (!isActive) e.currentTarget.style.background = 'oklch(0.98 0.005 250)'; }}
      onMouseOut={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
    >
      <div style={{ 
        width: 32, 
        height: 32, 
        borderRadius: 8, 
        background: community.logo_url ? `url(${community.logo_url}) center/cover` : `linear-gradient(135deg, oklch(0.85 0.12 ${community.theme_hue || 75}), oklch(0.65 0.16 ${community.theme_hue || 75}))`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: 14,
        fontWeight: 800,
        fontFamily: GILD_FONTS.display,
        flexShrink: 0,
        overflow: 'hidden'
      }}>
        {!community.logo_url && community.name[0]}
      </div>
      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {community.name}
      </span>
      {isActive && <div style={{ width: 6, height: 6, borderRadius: 3, background: '#111' }} />}
    </Link>
  );
}
