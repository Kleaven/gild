'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, X } from 'lucide-react';
import { useGildChat } from './GildChatProvider';
import { Avatar, GILD_FONTS } from '@/components/gild';
import type { Person, MemberRole } from '@/components/gild';
import { useDirectMessages } from '@/hooks';
import { sendDirectMessage } from '@/app/actions';
import { getDmConversations, markDmThreadRead } from '@/app/actions/dm';
import type { Conversation } from '@/lib/dm';
import { createClient } from '@/lib/supabase/browser';
import type { DirectMessage, RecipientProfile } from '@/lib/dm';

// ─── Types ───────────────────────────────────────────────────────────────────

type LocalMessage = DirectMessage & {
  /** Set on optimistic placeholders so the renderer can dim them slightly. */
  _optimistic?: true;
};

type Props = {
  /** Current viewer's profile id — the "me" side of every message. */
  currentUserId: string;
  /** Stable list of online user ids — drives the recipient's presence dot. */
  onlineUserIds?: Set<string>;
};

// ─── Component ───────────────────────────────────────────────────────────────
// Renders the drawer at the layout root. AnimatePresence keeps the exit
// frame mounted long enough for the slide-out spring to finish before the
// component unmounts.

export function GildChatDrawer({ currentUserId, onlineUserIds }: Props) {
  const { isChatOpen, activeRecipientId, closeChat, openChat, onlineUserIds: ctxOnline } = useGildChat();
  const online = onlineUserIds ?? ctxOnline;

  return (
    <AnimatePresence>
      {isChatOpen && activeRecipientId && (
        <ChatPanel
          key={activeRecipientId}
          currentUserId={currentUserId}
          recipientId={activeRecipientId}
          isOnline={online.has(activeRecipientId)}
          onClose={closeChat}
          onBack={openChat}
        />
      )}
      {isChatOpen && !activeRecipientId && (
        <ConversationListPanel key="dm-inbox" onlineUserIds={online} onClose={closeChat} />
      )}
    </AnimatePresence>
  );
}

// ─── ConversationListPanel ───────────────────────────────────────────────────
// The DM inbox: every thread, newest first, with unread counts, presence dots
// and the shared community for context ("who is this person?").

function ConversationListPanel({
  onlineUserIds,
  onClose,
}: {
  onlineUserIds: Set<string>;
  onClose: () => void;
}) {
  const { openChatWithUser } = useGildChat();
  const [conversations, setConversations] = useState<Conversation[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDmConversations().then((rows) => {
      if (!cancelled) setConversations(rows);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.aside
      role="dialog"
      aria-label="Messages"
      initial={{ x: 420 }}
      animate={{ x: 0 }}
      exit={{ x: 420 }}
      transition={{ type: 'spring', stiffness: 380, damping: 36 }}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 'min(400px, 100vw)',
        background: '#fff',
        borderLeft: '1px solid oklch(0.94 0.005 250)',
        boxShadow: '-12px 0 32px oklch(0 0 0 / 0.06)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1001,
        fontFamily: GILD_FONTS.sans,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 18px',
          borderBottom: '1px solid oklch(0.96 0.005 250)',
          flexShrink: 0,
        }}
      >
        <h2 style={{ margin: 0, flex: 1, fontSize: 16, fontWeight: 700, fontFamily: GILD_FONTS.display, letterSpacing: '-0.01em' }}>
          Messages
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close messages"
          style={{
            width: 32, height: 32, borderRadius: 8, background: 'transparent', border: 'none',
            color: 'oklch(0.45 0.02 250)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>
      </header>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {conversations === null ? (
          <p style={{ padding: '28px 18px', fontSize: 13, color: 'oklch(0.55 0.02 250)', textAlign: 'center' }}>
            Loading conversations…
          </p>
        ) : conversations.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 28, margin: '0 0 10px' }} aria-hidden>💬</p>
            <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 6px' }}>No messages yet</p>
            <p style={{ fontSize: 13, color: 'oklch(0.55 0.02 250)', margin: 0, lineHeight: 1.6 }}>
              Open any community’s Members tab and hit “Message” to start a conversation.
            </p>
          </div>
        ) : (
          conversations.map((c) => {
            const person: Person = {
              id: c.peer_id,
              name: c.display_name,
              role: 'free_member' as MemberRole,
              hue: (c.display_name.charCodeAt(0) * 13) % 360,
              online: onlineUserIds.has(c.peer_id),
            };
            return (
              <button
                key={c.peer_id}
                onClick={() => openChatWithUser(c.peer_id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '13px 18px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid oklch(0.97 0.003 250)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                }}
              >
                <Avatar person={person} size={40} presence />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.display_name}
                    </span>
                    {c.shared_community && (
                      <span style={{ fontSize: 10.5, color: 'oklch(0.55 0.02 250)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        via {c.shared_community}
                      </span>
                    )}
                  </div>
                  <p style={{
                    margin: '3px 0 0',
                    fontSize: 12.5,
                    color: c.unread_count > 0 ? 'oklch(0.25 0.02 250)' : 'oklch(0.52 0.02 250)',
                    fontWeight: c.unread_count > 0 ? 600 : 400,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {c.last_from_me ? 'You: ' : ''}{c.last_message}
                  </p>
                </div>
                {c.unread_count > 0 && (
                  <span style={{
                    minWidth: 20,
                    height: 20,
                    padding: '0 6px',
                    borderRadius: 999,
                    background: 'oklch(0.45 0.16 25)',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {c.unread_count}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </motion.aside>
  );
}

// ─── ChatPanel ───────────────────────────────────────────────────────────────
// Inner panel — re-mounts when activeRecipientId changes (key={recipientId})
// so each conversation starts with fresh state, no leakage between threads.

function ChatPanel({
  currentUserId,
  recipientId,
  isOnline,
  onClose,
  onBack,
}: {
  currentUserId: string;
  recipientId: string;
  isOnline: boolean;
  onClose: () => void;
  onBack?: () => void;
}) {
  const { refreshUnread } = useGildChat();
  const [recipient, setRecipient] = useState<RecipientProfile | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timelineRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  // ── Mark this thread read on open + clear the nav badge ─────────────────
  useEffect(() => {
    markDmThreadRead(recipientId).then(refreshUnread);
  }, [recipientId, refreshUnread]);

  // ── Esc-to-close ─────────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        // Don't close mid-send — avoids racing the await on submit.
        if (!isSending) onClose();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isSending, onClose]);

  // ── Focus composer on open ───────────────────────────────────────────────
  useEffect(() => {
    composerRef.current?.focus();
  }, []);

  // ── Body scroll lock while drawer is open ────────────────────────────────
  // Without this the page behind the overlay scrolls when the user wheels
  // through the conversation. Restore on unmount.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ── Initial fetch: recipient profile + conversation history ─────────────
  // Inline in the client component (not RSC) because the drawer lives in a
  // client layout shell — RSC fetching would require a route change.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [profileRes, msgRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .eq('id', recipientId)
          .maybeSingle(),
        // Use the get_dm_thread RPC instead of an OR-filter on the table —
        // the RPC uses LEAST/GREATEST so the idx_direct_messages_thread
        // compound index is walked as a single Index Scan rather than the
        // planner's previous two-direction OR-scan + sort. See migration
        // 20260520000001 for rationale.
        supabase.rpc('get_dm_thread', {
          p_other_user_id: recipientId,
          p_limit: 50,
        }),
      ]);

      if (cancelled) return;
      setRecipient(profileRes.data);
      // RPC returns DESC for the LIMIT optimisation; flip to chronological
      // for append-render.
      setMessages(((msgRes.data ?? []) as DirectMessage[]).reverse() as LocalMessage[]);
    }

    load().catch(() => {
      if (!cancelled) setError('Failed to load conversation');
    });

    return () => {
      cancelled = true;
    };
  }, [recipientId, supabase]);

  // ── Realtime: incoming messages from this counterpart ───────────────────
  const onIncoming = useCallback((msg: DirectMessage) => {
    setMessages((prev) => {
      // De-dupe in case the same row arrives via both INSERT response and
      // realtime broadcast (rare but possible during reconnect storms).
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg as LocalMessage];
    });
  }, []);
  useDirectMessages(currentUserId, recipientId, onIncoming);

  // ── Auto-scroll-to-bottom on new messages ───────────────────────────────
  // useLayoutEffect (not useEffect) so the scroll happens before the browser
  // paints — no visible jump from the user's perspective.
  useLayoutEffect(() => {
    const el = timelineRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  // ── Send handler ─────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const content = draft.trim();
    if (!content || isSending) return;

    // Optimistic placeholder — visible the instant the user hits Send.
    const tempId = `tmp-${crypto.randomUUID()}`;
    const optimistic: LocalMessage = {
      id: tempId,
      sender_id: currentUserId,
      receiver_id: recipientId,
      content,
      read_at: null,
      created_at: new Date().toISOString(),
      _optimistic: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft('');
    setError(null);
    setIsSending(true);

    const res = await sendDirectMessage({ receiverId: recipientId, content });
    setIsSending(false);

    if (!res.ok) {
      // Roll back the optimistic insert + restore the draft so the user
      // doesn't lose what they typed.
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setDraft(content);
      setError(res.error);
      return;
    }

    // Reconcile: replace optimistic placeholder with canonical row.
    setMessages((prev) =>
      prev.map((m) => (m.id === tempId ? (res.message as LocalMessage) : m)),
    );
  }, [currentUserId, recipientId, draft, isSending]);

  // ── Header avatar Person — synthesize from RecipientProfile ─────────────
  const recipientPerson: Person | null = recipient
    ? {
        id: recipient.id,
        name: recipient.display_name,
        role: 'free_member' as MemberRole, // role doesn't matter for the avatar render
        hue: (recipient.id.charCodeAt(0) * 10) % 360,
        online: isOnline,
      }
    : null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 1000,
        }}
      />

      {/* Drawer panel */}
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="gild-chat-title"
        initial={{ x: '100%' }}
        animate={{ x: '0%' }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 36 }}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(420px, 100vw)',
          background: '#fff',
          borderLeft: '1px solid oklch(0.94 0.005 250)',
          boxShadow: '-12px 0 32px oklch(0 0 0 / 0.06)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1001,
          fontFamily: GILD_FONTS.sans,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 18px',
            borderBottom: '1px solid oklch(0.96 0.005 250)',
            flexShrink: 0,
          }}
        >
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to all messages"
              style={{
                width: 30, height: 30, borderRadius: 8, background: 'transparent', border: 'none',
                color: 'oklch(0.45 0.02 250)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer', flexShrink: 0, fontSize: 17,
              }}
            >
              ←
            </button>
          )}
          {recipientPerson && <Avatar person={recipientPerson} size={36} presence />}
          <div style={{ flex: 1, minWidth: 0, lineHeight: 1.25 }}>
            <h2
              id="gild-chat-title"
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 700,
                color: 'oklch(0.20 0.02 250)',
                fontFamily: GILD_FONTS.display,
                letterSpacing: '-0.01em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {recipient?.display_name ?? '…'}
            </h2>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: 11,
                fontFamily: GILD_FONTS.mono,
                color: isOnline ? 'oklch(0.50 0.14 150)' : 'oklch(0.55 0.02 250)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'transparent',
              border: 'none',
              color: 'oklch(0.45 0.02 250)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </header>

        {/* Timeline */}
        <div
          ref={timelineRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            background: 'oklch(0.99 0.002 250)',
          }}
        >
          {messages.length === 0 && !error && (
            <div
              style={{
                margin: 'auto',
                padding: '24px 16px',
                textAlign: 'center',
                color: 'oklch(0.55 0.02 250)',
                fontSize: 13,
                lineHeight: 1.6,
                maxWidth: 280,
              }}
            >
              No messages yet. Say hi to{' '}
              <strong style={{ color: 'oklch(0.30 0.02 250)' }}>
                {recipient?.display_name ?? 'this member'}
              </strong>
              .
            </div>
          )}

          {messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  justifyContent: mine ? 'flex-end' : 'flex-start',
                }}
              >
                <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: mine ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                      background: mine ? 'oklch(0.35 0.16 var(--theme-hue, 250))' : '#fff',
                      color: mine ? '#fff' : 'oklch(0.20 0.02 250)',
                      border: mine ? 'none' : '1px solid oklch(0.92 0.01 250)',
                      fontSize: 14,
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      opacity: m._optimistic ? 0.65 : 1,
                    }}
                  >
                    {m.content}
                  </div>
                  <time
                    dateTime={m.created_at}
                    style={{
                      marginTop: 2,
                      fontSize: 10,
                      fontFamily: GILD_FONTS.mono,
                      color: 'oklch(0.55 0.02 250)',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {formatMicroTime(m.created_at)}
                  </time>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error strip */}
        {error && (
          <div
            role="alert"
            style={{
              padding: '8px 18px',
              background: 'oklch(0.96 0.04 25)',
              color: 'oklch(0.40 0.16 25)',
              fontSize: 12,
              borderTop: '1px solid oklch(0.92 0.06 25)',
            }}
          >
            {error}
          </div>
        )}

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
          style={{
            display: 'flex',
            gap: 8,
            padding: '12px 14px 14px',
            borderTop: '1px solid oklch(0.96 0.005 250)',
            background: '#fff',
            flexShrink: 0,
          }}
        >
          <textarea
            ref={composerRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // Enter = send. Shift+Enter = newline. Mirrors Slack/iMessage/Notion.
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder={`Message ${recipient?.display_name ?? ''}`}
            rows={1}
            maxLength={3000}
            aria-label="Message"
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid oklch(0.92 0.01 250)',
              fontSize: 14,
              fontFamily: 'inherit',
              outline: 'none',
              resize: 'none',
              minHeight: 40,
              maxHeight: 120,
              background: 'oklch(0.99 0.002 250)',
              lineHeight: 1.4,
            }}
          />
          <button
            type="submit"
            disabled={!draft.trim() || isSending}
            aria-label="Send message"
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              border: 'none',
              background:
                !draft.trim() || isSending
                  ? 'oklch(0.92 0.01 250)'
                  : 'oklch(0.40 0.16 var(--theme-hue, 250))',
              color: !draft.trim() || isSending ? 'oklch(0.55 0.02 250)' : '#fff',
              cursor: !draft.trim() || isSending ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              alignSelf: 'flex-end',
              transition: 'background 0.15s ease',
            }}
          >
            <Send size={16} />
          </button>
        </form>
      </motion.aside>
    </>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMicroTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (sameDay) return time;
  const date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${date} · ${time}`;
}
