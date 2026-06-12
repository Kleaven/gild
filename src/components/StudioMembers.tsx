'use client';

import React, { useState } from 'react';
import { Avatar, GILD_FONTS, ConfirmModal, useGildChat } from '@/components/gild';
import type { Person, MemberRole } from '@/components/gild';
import { updateMemberRole, removeMember } from '@/app/actions';
import { MessageCircle, UserMinus, Settings2 , UserX} from 'lucide-react';
import { AdminPrivilegesUI } from './gild/AdminPrivilegesUI';

interface StudioMembersProps {
  community: {
    id: string;
    name: string;
    member_count: number;
  };
  members: { user_id: string; display_name: string; role: string; joined_at: string; username?: string | null }[];
  currentUserId: string;
  currentUserRole: MemberRole;
}

export function StudioMembers({ community, members, currentUserId, currentUserRole }: StudioMembersProps) {
  const [isPending, setIsPending] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const { onlineUserIds } = useGildChat();
  const [showBanConfirm, setShowBanConfirm] = useState<{ id: string; name: string } | null>(null);
  const [showKickConfirm, setShowKickConfirm] = useState<{ id: string; name: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [privilegeModal, setPrivilegeModal] = useState<{ id: string; name: string; perms: any } | null>(null);
  const { openChatWithUser } = useGildChat();
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
          fontFamily: GILD_FONTS.mono,
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

      </div>

      <ConfirmModal
        isOpen={!!showBanConfirm}
        onClose={() => setShowBanConfirm(null)}
        onConfirm={async () => {
          if (!showBanConfirm) return;
          setIsPending(showBanConfirm.id);
          try {
            await updateMemberRole({
              communityId: community.id,
              targetUserId: showBanConfirm.id,
              newRole: 'banned',
            });
          } finally {
            setIsPending(null);
            setShowBanConfirm(null);
          }
        }}
        title="Ban Member"
        message={`Are you sure you want to ban ${showBanConfirm?.name}? They will lose all access to this community instantly.`}
        confirmLabel="Ban Member"
        isDestructive
      />

      <ConfirmModal
        isOpen={!!showKickConfirm}
        onClose={() => setShowKickConfirm(null)}
        onConfirm={async () => {
          if (!showKickConfirm) return;
          setActionError(null);
          setIsPending(showKickConfirm.id);
          try {
            const res = await removeMember(community.id, showKickConfirm.id);
            if (!res.ok) setActionError(res.error);
          } finally {
            setIsPending(null);
            setShowKickConfirm(null);
          }
        }}
        title="Remove Member"
        message={`Remove ${showKickConfirm?.name} from this community? They can rejoin later unless you ban them instead.`}
        confirmLabel="Remove"
        isDestructive
      />

      {actionError && (
        <div style={{
          margin: '0 0 14px',
          padding: '10px 14px',
          borderRadius: 10,
          background: 'oklch(0.96 0.03 25)',
          border: '1px solid oklch(0.88 0.06 25)',
          color: 'oklch(0.40 0.16 25)',
          fontSize: 13,
          fontWeight: 600,
        }}>
          {actionError}
        </div>
      )}

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
            {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
              <th style={{ padding: '10px 8px', borderBottom: '1px solid oklch(0.94 0.005 250)', textAlign: 'right' }}>Admin</th>
            )}
          </tr>
        </thead>
        <tbody>
          {filteredMembers.map((member) => {
            const person: Person = {
              id: member.user_id,
              name: member.display_name,
              role: member.role as MemberRole,
              hue: (member.user_id.charCodeAt(0) * 10) % 360,
              online: onlineUserIds.has(member.user_id),
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
                <td style={{ padding: '10px 8px', color: 'oklch(0.40 0.02 250)', fontFamily: GILD_FONTS.mono, fontSize: 12 }}>
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
                  {member.user_id !== currentUserId ? (
                    <button
                      type="button"
                      onClick={() => openChatWithUser(member.user_id)}
                      aria-label={`Message ${member.display_name}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: '1px solid oklch(0.90 0.01 250)',
                        background: '#fff',
                        color: 'oklch(0.35 0.02 250)',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'background 0.15s ease, border-color 0.15s ease',
                      }}
                    >
                      <MessageCircle size={13} aria-hidden="true" />
                      Message
                    </button>
                  ) : (
                    <span style={{ fontSize: 12, color: 'oklch(0.55 0.02 250)' }}>You</span>
                  )}
                </td>
                {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
                  <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                    {member.user_id !== currentUserId && member.role !== 'owner' && (
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                        {member.role === 'admin' && currentUserRole === 'owner' && (
                          <button
                            title="Manage Privileges"
                            onClick={() => setPrivilegeModal({ id: member.user_id, name: member.display_name, perms: (member as any).permissions || {} })}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'oklch(0.50 0.02 250)',
                              cursor: 'pointer',
                              padding: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              borderRadius: 6,
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <Settings2 size={14} />
                          </button>
                        )}
                        {member.role !== 'banned' && (
                        <select
                          value={member.role}
                          disabled={!!isPending}
                          onChange={async (e) => {
                            const newRole = e.target.value as any;
                            setIsPending(member.user_id);
                            try {
                              await updateMemberRole({
                                communityId: community.id,
                                targetUserId: member.user_id,
                                newRole,
                              });
                            } finally {
                              setIsPending(null);
                            }
                          }}
                          style={{
                            fontSize: 11,
                            padding: '2px 4px',
                            borderRadius: 4,
                            border: '1px solid oklch(0.90 0.01 250)',
                            background: '#fff',
                            color: 'oklch(0.30 0.02 250)',
                            outline: 'none',
                          }}
                        >
                          <option value="admin">Admin</option>
                          <option value="moderator">Moderator</option>
                          <option value="tier2_member">Tier 2</option>
                          <option value="tier1_member">Tier 1</option>
                          <option value="free_member">Free</option>
                        </select>
                        )}
                        {member.role === 'banned' ? (
                          <button
                            disabled={!!isPending}
                            onClick={async () => {
                              setActionError(null);
                              setIsPending(member.user_id);
                              try {
                                await updateMemberRole({
                                  communityId: community.id,
                                  targetUserId: member.user_id,
                                  newRole: 'free_member',
                                });
                              } catch {
                                setActionError('Couldn’t unban that member. Please try again.');
                              } finally {
                                setIsPending(null);
                              }
                            }}
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '4px 10px',
                              borderRadius: 6,
                              border: '1px solid oklch(0.85 0.06 150)',
                              background: 'oklch(0.96 0.04 150)',
                              color: 'oklch(0.38 0.12 150)',
                              cursor: 'pointer',
                            }}
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            title="Ban Member"
                            onClick={() => setShowBanConfirm({ id: member.user_id, name: member.display_name })}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'oklch(0.60 0.15 25)',
                              cursor: 'pointer',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <UserMinus size={14} />
                          </button>
                        )}
                        <button
                          title="Remove from community"
                          onClick={() => setShowKickConfirm({ id: member.user_id, name: member.display_name })}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'oklch(0.45 0.16 25)',
                            cursor: 'pointer',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <UserX size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                )}
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

      {privilegeModal && (
        <AdminPrivilegesUI 
          communityId={community.id}
          userId={privilegeModal.id}
          userName={privilegeModal.name}
          currentPermissions={privilegeModal.perms}
          onClose={() => setPrivilegeModal(null)}
        />
      )}
    </div>
  );
}
