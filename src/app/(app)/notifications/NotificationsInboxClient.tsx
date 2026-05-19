'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Bell,
  MessageSquare,
  GraduationCap,
  Award,
  Heart,
  Trash2,
  CheckCheck,
  Inbox,
} from 'lucide-react';
import { GILD_FONTS } from '@/components/gild';
import {
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '@/app/actions';
import type { NotificationRow } from '@/lib/notifications';

type Props = {
  initialNotifications: NotificationRow[];
  showAll: boolean;
};

// Icon mapping per notification_type enum value. Falls back to Bell.
function iconFor(type: NotificationRow['type']) {
  switch (type) {
    case 'new_comment':
    case 'comment_reply':
      return MessageSquare;
    case 'new_post':
      return Bell;
    case 'course_enrolled':
    case 'course_completed':
      return GraduationCap;
    case 'certificate_issued':
      return Award;
    case 'post_liked':
    case 'comment_liked':
      return Heart;
    default:
      return Bell;
  }
}

// Relative-time formatter — keeps the inbox dense without depending on
// dayjs/date-fns. Falls back to a fixed locale string after 14 days.
function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  const diffDay = Math.floor(diffSec / 86400);
  if (diffDay < 14) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function NotificationsInboxClient({ initialNotifications, showAll }: Props) {
  const [items, setItems] = useState<NotificationRow[]>(initialNotifications);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const hasUnread = items.some((n) => !n.is_read);

  function handleMarkRead(id: string) {
    // Optimistic flip — UI updates immediately, server-side revalidate is
    // async via startTransition.
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setBusyId(id);
    startTransition(async () => {
      const res = await markNotificationRead(id);
      if (!res.ok) {
        // Rollback on failure.
        setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: false } : n)));
        setError(res.error ?? 'Failed to mark as read');
      }
      setBusyId(null);
    });
  }

  function handleMarkAll() {
    const snapshot = items;
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setError(null);
    startTransition(async () => {
      const res = await markAllNotificationsRead();
      if (!res.ok) {
        setItems(snapshot);
        setError(res.error ?? 'Failed to mark all as read');
      }
    });
  }

  function handleDelete(id: string) {
    const snapshot = items;
    setItems((prev) => prev.filter((n) => n.id !== id));
    setBusyId(id);
    setError(null);
    startTransition(async () => {
      const res = await deleteNotification(id);
      if (!res.ok) {
        setItems(snapshot);
        setError(res.error ?? 'Failed to delete');
      }
      setBusyId(null);
    });
  }

  if (items.length === 0) {
    return (
      <div
        style={{
          border: '1px solid oklch(0.93 0.005 250)',
          borderRadius: 16,
          padding: '64px 24px',
          background: '#fff',
          textAlign: 'center',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: 'oklch(0.96 0.005 250)',
            color: 'oklch(0.55 0.02 250)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <Inbox size={26} />
        </div>
        <h2
          style={{
            margin: '0 0 6px',
            fontSize: 16,
            fontWeight: 700,
            fontFamily: GILD_FONTS.display,
            letterSpacing: '-0.01em',
          }}
        >
          {showAll ? 'No notifications yet' : 'You are all caught up'}
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: 'oklch(0.50 0.02 250)' }}>
          {showAll
            ? "New comments, posts, course updates, and certificate awards will appear here."
            : 'Older read notifications are hidden. Click "Show all" to view your archive.'}
        </p>
        {!showAll && (
          <div style={{ marginTop: 20 }}>
            <Link
              href="/notifications?all=1"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                background: 'transparent',
                color: 'oklch(0.30 0.02 250)',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid oklch(0.90 0.01 250)',
              }}
            >
              Show all
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={handleMarkAll}
          disabled={!hasUnread}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 8,
            background: hasUnread ? 'oklch(0.20 0.02 250)' : 'oklch(0.96 0.005 250)',
            color: hasUnread ? '#fff' : 'oklch(0.55 0.02 250)',
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            cursor: hasUnread ? 'pointer' : 'default',
            fontFamily: 'inherit',
          }}
        >
          <CheckCheck size={14} />
          Mark all as read
        </button>
        <Link
          href={showAll ? '/notifications' : '/notifications?all=1'}
          style={{
            fontSize: 13,
            color: 'oklch(0.45 0.02 250)',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          {showAll ? 'Hide archive →' : 'Show all →'}
        </Link>
      </div>

      {error && (
        <p
          role="alert"
          style={{
            margin: 0,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'oklch(0.96 0.04 25)',
            border: '1px solid oklch(0.88 0.08 25)',
            color: 'oklch(0.40 0.16 25)',
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          {error}
        </p>
      )}

      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {items.map((n) => {
          const Icon = iconFor(n.type);
          const unread = !n.is_read;
          // If there's a deep link, the whole row is a Link. Otherwise we
          // render as a div and rely on the explicit action buttons.
          const RowTag = n.resource_url ? Link : 'div';
          const rowProps = n.resource_url
            ? {
                href: n.resource_url as string,
                onClick: () => (unread ? handleMarkRead(n.id) : undefined),
              }
            : ({} as any);

          return (
            <li key={n.id}>
              <RowTag
                {...rowProps}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: unread ? 'oklch(0.985 0.015 240)' : '#fff',
                  border: `1px solid ${unread ? 'oklch(0.88 0.06 240)' : 'oklch(0.94 0.005 250)'}`,
                  textDecoration: 'none',
                  color: 'inherit',
                  cursor: n.resource_url ? 'pointer' : 'default',
                  opacity: busyId === n.id ? 0.5 : 1,
                  transition: 'background 0.15s ease, border-color 0.15s ease',
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: unread ? 'oklch(0.94 0.08 240)' : 'oklch(0.96 0.005 250)',
                    color: unread ? 'oklch(0.40 0.16 240)' : 'oklch(0.45 0.02 250)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={16} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      fontWeight: unread ? 700 : 500,
                      color: 'oklch(0.20 0.02 250)',
                      lineHeight: 1.4,
                    }}
                  >
                    {n.title}
                  </p>
                  {n.body && (
                    <p
                      style={{
                        margin: '3px 0 0',
                        fontSize: 13,
                        color: 'oklch(0.45 0.02 250)',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {n.body}
                    </p>
                  )}
                  <p
                    style={{
                      margin: '6px 0 0',
                      fontSize: 11,
                      color: 'oklch(0.55 0.02 250)',
                      fontFamily: GILD_FONTS.mono,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {relativeTime(n.created_at)}
                  </p>
                </div>

                <div
                  style={{ display: 'flex', gap: 4, flexShrink: 0 }}
                  // Stop click from bubbling to the row's Link.
                  onClick={(e) => e.stopPropagation()}
                >
                  {unread && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleMarkRead(n.id);
                      }}
                      disabled={busyId === n.id}
                      aria-label="Mark as read"
                      title="Mark as read"
                      style={iconBtnStyle}
                    >
                      <CheckCheck size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(n.id);
                    }}
                    disabled={busyId === n.id}
                    aria-label="Delete notification"
                    title="Delete"
                    style={iconBtnStyle}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </RowTag>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 6,
  background: 'transparent',
  border: 'none',
  color: 'oklch(0.50 0.02 250)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
