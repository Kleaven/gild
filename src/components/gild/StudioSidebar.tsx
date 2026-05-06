'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Wordmark, 
  Avatar, 
  GILD_FONTS, 
  Person, 
  Space 
} from '@/components/gild';

interface StudioSidebarProps {
  community: {
    id: string;
    name: string;
    member_count: number;
    plan: string | null;
  };
  spaces: any[];
  currentUser: Person;
}

export function StudioSidebar({ 
  community, 
  spaces, 
  currentUser 
}: StudioSidebarProps) {
  const pathname = usePathname();

  return (
    <aside style={{
      background: 'oklch(0.985 0.003 250)',
      borderRight: '1px solid oklch(0.94 0.005 250)',
      padding: '14px 10px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 18,
      width: 240,
      flexShrink: 0,
      fontFamily: GILD_FONTS.sans,
    }}>
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
          background: 'linear-gradient(135deg, oklch(0.78 0.14 75), oklch(0.55 0.14 75))',
          color: '#fff', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontFamily: GILD_FONTS.display,
          fontWeight: 800, 
          fontSize: 14, 
          letterSpacing: '-0.04em',
        }}>{community.name[0]}</div>
        <div style={{ lineHeight: 1.25, flex: 1, minWidth: 0 }}>
          <p style={{ 
            fontSize: 13, 
            fontWeight: 600, 
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis' 
          }}>{community.name}</p>
          <p style={{ fontSize: 11, color: 'oklch(0.50 0.02 250)', margin: 0 }}>
            {community.member_count} members · {community.plan || 'Free'}
          </p>
        </div>
      </div>

      <div>
        <p style={{
          fontSize: 11, 
          fontWeight: 600,
          color: 'oklch(0.55 0.02 250)', 
          padding: '0 10px 4px', 
          margin: 0,
          textTransform: 'uppercase', 
          letterSpacing: '0.04em',
        }}>Spaces</p>
        {spaces.map(s => {
          const isActive = pathname.includes(`/s/${s.id}`);
          return (
            <Link key={s.id} href={`/c/${community.id}/s/${s.id}`} style={{
              display: 'flex', 
              alignItems: 'center', 
              gap: 10,
              padding: '5px 10px', 
              borderRadius: 6, 
              marginBottom: 1,
              textDecoration: 'none', 
              fontSize: 14,
              background: isActive ? 'oklch(0.94 0.005 250)' : 'transparent',
              color: isActive ? '#202020' : 'oklch(0.30 0.02 250)',
              fontWeight: isActive ? 600 : 400,
            }}>
              <span style={{
                width: 8, 
                height: 8, 
                borderRadius: 2,
                background: `oklch(0.62 0.16 ${s.hue || 220})`,
                boxShadow: isActive ? `0 0 0 3px oklch(0.62 0.16 ${s.hue || 220} / 0.18)` : 'none',
              }}/>
              <span style={{ flex: 1 }}>{s.name}</span>
            </Link>
          );
        })}
      </div>

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
          { label: 'Members', href: `/c/${community.id}/members` },
          { label: 'Courses', href: `#` },
          { label: 'Search', href: `/c/${community.id}/search` },
        ].map((item) => {
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
          <Link href={`/c/${community.id}/dashboard`} style={{
            display: 'flex', 
            alignItems: 'center',
            padding: '5px 10px', 
            borderRadius: 6,
            textDecoration: 'none', 
            fontSize: 14, 
            color: pathname.includes('/dashboard') ? '#202020' : 'oklch(0.30 0.02 250)',
            background: pathname.includes('/dashboard') ? 'oklch(0.94 0.005 250)' : 'transparent',
            fontWeight: pathname.includes('/dashboard') ? 600 : 400,
          }}>
            Dashboard
          </Link>
          <Link href={`/c/${community.id}/settings`} style={{
            display: 'flex', 
            alignItems: 'center',
            padding: '5px 10px', 
            borderRadius: 6,
            textDecoration: 'none', 
            fontSize: 14, 
            color: pathname.includes('/settings') ? '#202020' : 'oklch(0.30 0.02 250)',
            background: pathname.includes('/settings') ? 'oklch(0.94 0.005 250)' : 'transparent',
            fontWeight: pathname.includes('/settings') ? 600 : 400,
          }}>
            Settings
          </Link>
        </div>
      )}

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
            textOverflow: 'ellipsis' 
          }}>{currentUser.name}</p>
          <p style={{ fontSize: 11, color: 'oklch(0.50 0.02 250)', margin: 0, textTransform: 'capitalize' }}>
            {currentUser.role.replace('_', ' ')}
          </p>
        </div>
      </div>
    </aside>
  );
}
