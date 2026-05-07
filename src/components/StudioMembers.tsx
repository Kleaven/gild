'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Avatar, GILD_FONTS } from '@/components/gild';
import type { Person, MemberRole } from '@/components/gild';

interface StudioMembersProps {
  community: {
    id: string;
    name: string;
    member_count: number;
  };
  members: { user_id: string; display_name: string; role: string; joined_at: string; username?: string | null }[];
}

export function StudioMembers({ community, members }: StudioMembersProps) {
  const [filter, setFilter] = useState('');
  const filteredMembers = filter.trim() === ''
    ? members
    : members.filter((m) => {
        const q = filter.trim().toLowerCase();
        return (
          m.display_name.toLowerCase().includes(q) ||
          (m.username?.toLowerCase().includes(q) ?? false)
        );
      });

  return (
    <div style={{
      fontFamily: GILD_FONTS.sans,
      background: '#fff', 
      minHeight: '100vh', 
      padding: '24px 28px',
      color: '#202020',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 18 }}>
        <h1 style={{
          fontFamily: GILD_FONTS.display,
          fontSize: 24, 
          fontWeight: 700, 
          margin: 0, 
          letterSpacing: '-0.025em',
        }}>Members</h1>
        
        <span style={{
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 600,
          background: 'oklch(0.96 0.005 250)',
          color: 'oklch(0.40 0.02 250)',
        }}>
          {filter.trim() === '' ? community.member_count : `${filteredMembers.length} of ${community.member_count}`}
        </span>

        <input
          type="search"
          placeholder="Filter members…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            marginLeft: 'auto',
            padding: '6px 12px',
            fontSize: 13,
            border: '1px solid oklch(0.90 0.01 250)',
            borderRadius: 6,
            outline: 'none',
            width: 220,
            fontFamily: 'inherit',
          }}
        />

        <Link
          href={`/onboarding/${community.id}/invite`}
          style={{
            padding: '7px 12px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            background: 'oklch(0.20 0.02 250)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >Invite</Link>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{
            textAlign: 'left', 
            fontSize: 11, 
            fontWeight: 600,
            color: 'oklch(0.50 0.02 250)', 
            textTransform: 'uppercase', 
            letterSpacing: '0.04em',
          }}>
            <th style={{ padding: '10px 8px', borderBottom: '1px solid oklch(0.94 0.005 250)' }}>Name</th>
            <th style={{ padding: '10px 8px', borderBottom: '1px solid oklch(0.94 0.005 250)' }}>Role</th>
            <th style={{ padding: '10px 8px', borderBottom: '1px solid oklch(0.94 0.005 250)' }}>Joined</th>
            <th style={{ padding: '10px 8px', borderBottom: '1px solid oklch(0.94 0.005 250)' }}>Handle</th>
            <th style={{ padding: '10px 8px', borderBottom: '1px solid oklch(0.94 0.005 250)' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredMembers.map((member) => {
            const person: Person = {
              id: member.user_id,
              name: member.display_name,
              role: member.role as MemberRole,
              hue: (member.user_id.charCodeAt(0) * 10) % 360,
              online: false, // We don't have realtime online status here yet
            };

            return (
              <tr key={member.user_id} style={{ borderBottom: '1px solid oklch(0.96 0.005 250)' }}>
                <td style={{ padding: '10px 8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar person={person} size={26} presence />
                    <div style={{ lineHeight: 1.25 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{member.display_name}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '10px 8px' }}>
                  <span style={{
                    padding: '2px 8px', 
                    borderRadius: 4, 
                    fontSize: 11, 
                    fontWeight: 600,
                    background: member.role === 'owner' ? 'oklch(0.94 0.06 75)' : 'oklch(0.96 0.005 250)',
                    color: member.role === 'owner' ? 'oklch(0.40 0.10 75)' : 'oklch(0.40 0.02 250)',
                    textTransform: 'capitalize',
                  }}>{member.role.replace('_', ' ')}</span>
                </td>
                <td style={{ padding: '10px 8px', color: 'oklch(0.40 0.02 250)' }}>
                  {new Date(member.joined_at).toLocaleDateString()}
                </td>
                <td style={{ 
                  padding: '10px 8px', 
                  fontFamily: GILD_FONTS.mono, 
                  color: 'oklch(0.50 0.02 250)' 
                }}>
                  {member.username ? `@${member.username}` : '—'}
                </td>
                <td style={{ padding: '10px 8px' }}>
                  <span style={{ fontSize: 12, color: 'oklch(0.55 0.02 250)' }}>Offline</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {filteredMembers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'oklch(0.50 0.02 250)' }}>
          {members.length === 0 ? 'No members found.' : `No members match "${filter}".`}
        </div>
      )}
    </div>
  );
}
