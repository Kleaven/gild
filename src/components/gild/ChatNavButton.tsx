'use client';

import { MessageCircle } from 'lucide-react';
import { useGildChat } from './GildChatProvider';

// The universal Chat tab in the app shell — opens the DM inbox from anywhere
// and wears the live unread badge.
export function ChatNavButton() {
  const { openChat, unreadCount } = useGildChat();

  return (
    <button
      type="button"
      onClick={openChat}
      aria-label={unreadCount > 0 ? `Chat — ${unreadCount} unread` : 'Chat'}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: 'transparent',
        border: 'none',
        padding: 0,
        fontSize: 13,
        color: '#555',
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      <MessageCircle size={15} />
      Chat
      {unreadCount > 0 && (
        <span
          style={{
            position: 'absolute',
            top: -7,
            right: -13,
            minWidth: 16,
            height: 16,
            padding: '0 4px',
            borderRadius: 999,
            background: 'oklch(0.45 0.16 25)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
