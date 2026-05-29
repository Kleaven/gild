'use client';

import { useState, useEffect, useRef, forwardRef } from 'react';
import { GILD_FONTS } from '@/components/gild';
import { uploadMedia } from '@/app/actions';

// Focusable selector — matches what browsers and ARIA reference impls treat
// as Tab-reachable. Excludes negative tabindex.
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

type Props = {
  communityId: string;
  spaceId: string;
  hue?: number;
  /** Role of the current user — governs newsletter broadcast toggle visibility. */
  currentUserRole?: string;
  /** Community-wide non-banned member count, used to set expectations on the broadcast toggle. */
  communityMemberCount?: number;
  onSubmit: (
    title: string,
    body: string,
    mediaUrls?: string[],
    type?: 'post' | 'poll',
    pollOptions?: { id: string; text: string }[],
    broadcastAsNewsletter?: boolean,
  ) => Promise<void>;
  /** Error injected from parent (e.g. after optimistic rollback). */
  externalError?: string | null;
  onClearError?: () => void;
};

const PostForm = forwardRef<HTMLFormElement, Props>(({ communityId, hue = 250, currentUserRole, communityMemberCount = 0, onSubmit, externalError, onClearError }, ref) => {
  const [activeTab, setActiveTab] = useState<'post' | 'poll'>('post');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [broadcastAsNewsletter, setBroadcastAsNewsletter] = useState(false);
  const [showBroadcastConfirm, setShowBroadcastConfirm] = useState(false);
  const confirmPanelRef = useRef<HTMLDivElement>(null);
  const confirmTriggerRef = useRef<HTMLElement | null>(null);

  // Modal a11y: Esc to close, Tab cycles within modal, focus restores to
  // the trigger element on close. Mounted only while modal is open.
  useEffect(() => {
    if (!showBroadcastConfirm) return;

    // Stash the element that had focus before the modal opened so we can
    // restore it on close. Falls back to document.body if there's nothing.
    confirmTriggerRef.current =
      (document.activeElement as HTMLElement | null) ?? null;

    // Move focus to the panel's "Cancel" (first focusable) by default so
    // keyboard users land on the non-destructive option.
    const panel = confirmPanelRef.current;
    const focusables = panel?.querySelectorAll<HTMLElement>(FOCUSABLE);
    focusables?.[0]?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        // Esc cancels — but block when a send is in flight to avoid
        // leaving the form in an ambiguous state mid-await.
        if (!isPending) {
          e.preventDefault();
          setShowBroadcastConfirm(false);
        }
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const list = panel.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (list.length === 0) return;
      const first = list[0]!;
      const last = list[list.length - 1]!;
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      // Restore focus to the element that opened the modal — but only if
      // it's still in the DOM (component may have unmounted).
      const trigger = confirmTriggerRef.current;
      if (trigger && document.contains(trigger)) {
        trigger.focus();
      }
    };
  }, [showBroadcastConfirm, isPending]);

  const canBroadcast = currentUserRole === 'owner' || currentUserRole === 'admin';
  // Author always receives a copy; show count - 1 for "other members".
  const recipientCount = Math.max(0, communityMemberCount - 1);


  const error = externalError ?? localError;

  async function performSubmit() {
    setLocalError(null);
    onClearError?.();
    setIsPending(true);
    try {
      const isPoll = activeTab === 'poll';
      await onSubmit(
        title,
        body,
        isPoll ? undefined : (attachments.length > 0 ? attachments : undefined),
        isPoll ? 'poll' : 'post',
        isPoll ? pollOptions.filter(o => !!o.trim()).map((o, i) => ({ id: `opt-${i}`, text: o })) : undefined,
        canBroadcast ? broadcastAsNewsletter : false,
      );
      setTitle('');
      setBody('');
      setAttachments([]);
      setPollOptions(['', '']);
      setActiveTab('post');
      setBroadcastAsNewsletter(false);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setIsPending(false);
      setShowBroadcastConfirm(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    // Gate destructive action (emails N members) behind explicit confirm.
    if (canBroadcast && broadcastAsNewsletter) {
      setShowBroadcastConfirm(true);
      return;
    }
    void performSubmit();
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setLocalError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await uploadMedia(communityId, formData);
      if (res.ok) {
        setAttachments([...attachments, res.url]);
      } else {
        setLocalError(res.error || 'Upload failed');
      }
    } catch (err) {
      setLocalError('Upload failed');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form
      ref={ref}
      onSubmit={handleSubmit}
      style={{
        background: '#fff',
        border: '1px solid oklch(0.94 0.005 250)',
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        marginBottom: 20,
      }}
    >
      <div style={{ display: 'flex', gap: 16, marginBottom: 4, borderBottom: '1px solid oklch(0.98 0.005 250)' }}>
        <button 
          type="button" 
          onClick={() => setActiveTab('post')} 
          style={{ 
            padding: '8px 4px', 
            fontSize: 13, 
            fontWeight: 700, 
            background: 'none', 
            border: 'none', 
            color: activeTab === 'post' ? `oklch(0.45 0.16 ${hue})` : '#888',
            borderBottom: activeTab === 'post' ? `2px solid oklch(0.45 0.16 ${hue})` : 'none',
            cursor: 'pointer'
          }}
        >Post</button>
        <button 
          type="button" 
          onClick={() => setActiveTab('poll')} 
          style={{ 
            padding: '8px 4px', 
            fontSize: 13, 
            fontWeight: 700, 
            background: 'none', 
            border: 'none', 
            color: activeTab === 'poll' ? `oklch(0.45 0.16 ${hue})` : '#888',
            borderBottom: activeTab === 'poll' ? `2px solid oklch(0.45 0.16 ${hue})` : 'none',
            cursor: 'pointer'
          }}
        >Poll</button>
      </div>

      <input
        id="post-title"
        name="title"
        type="text"
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={300}
        style={{
          width: '100%',
          border: 'none',
          outline: 'none',
          fontSize: 15,
          fontWeight: 600,
          fontFamily: GILD_FONTS.display,
          letterSpacing: '-0.01em',
          background: 'transparent',
        }}
      />
      <textarea
        id="post-body"
        name="body"
        placeholder="Write a new post…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
        rows={3}
        style={{
          width: '100%',
          border: 'none',
          outline: 'none',
          fontSize: 14,
          color: '#202020',
          resize: 'vertical',
          fontFamily: GILD_FONTS.sans,
          background: 'transparent',
          minHeight: 60,
        }}
      />
      
      {activeTab === 'poll' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '10px 0' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>Poll Options</p>
          {pollOptions.map((opt, i) => (
            <div key={i} style={{ display: 'flex', gap: 8 }}>
              <input 
                id={`poll-option-${i}`}
                name={`option-${i}`}
                type="text" 
                value={opt} 
                onChange={(e) => {
                  const newOpts = [...pollOptions];
                  newOpts[i] = e.target.value;
                  setPollOptions(newOpts);
                }}
                placeholder={`Option ${i + 1}`}
                style={{ ...inputStyle, padding: '8px 12px', fontSize: 13 }}
              />
              {pollOptions.length > 2 && (
                <button 
                  type="button" 
                  onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}
                  style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                >×</button>
              )}
            </div>
          ))}
          {pollOptions.length < 10 && (
            <button 
              type="button" 
              onClick={() => setPollOptions([...pollOptions, ''])}
              style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: `oklch(0.45 0.16 ${hue})`, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '4px 0' }}
            >+ Add Option</button>
          )}
        </div>
      )}
      
      {attachments.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {attachments.map((url, i) => (
            <div key={i} style={{ position: 'relative', width: 80, height: 80 }}>
              <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
              <button
                type="button"
                onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}
                style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, background: '#111', color: '#fff', border: 'none', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p style={{ color: '#c00', fontSize: 13, margin: 0 }}>{error}</p>}

      {canBroadcast && broadcastAsNewsletter && (
        <div
          aria-live="polite"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 8,
            background: `oklch(0.97 0.04 ${hue})`,
            border: `1px solid oklch(0.45 0.16 ${hue} / 0.2)`,
            fontSize: 12,
            color: `oklch(0.35 0.12 ${hue})`,
            lineHeight: 1.5,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>
            This will email{' '}
            <strong>
              {recipientCount.toLocaleString()} member{recipientCount === 1 ? '' : 's'}
            </strong>
            . Members can unsubscribe from the email footer.
          </span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid oklch(0.96 0.005 250)', paddingTop: 10 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ cursor: 'pointer', color: 'oklch(0.40 0.02 250)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500 }}>
            <input id="post-image-upload" name="image" type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={isUploading} />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            {isUploading ? 'Uploading...' : 'Image'}
          </label>
          {canBroadcast && (
            <button
              type="button"
              role="switch"
              aria-checked={broadcastAsNewsletter}
              aria-label={`Broadcast as newsletter to ${recipientCount.toLocaleString()} member${recipientCount === 1 ? '' : 's'}`}
              onClick={() => setBroadcastAsNewsletter(!broadcastAsNewsletter)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 6,
                border: broadcastAsNewsletter
                  ? `1px solid oklch(0.45 0.16 ${hue} / 0.6)`
                  : '1px solid oklch(0.90 0.01 250)',
                background: broadcastAsNewsletter
                  ? `oklch(0.96 0.06 ${hue})`
                  : 'transparent',
                color: broadcastAsNewsletter
                  ? `oklch(0.35 0.16 ${hue})`
                  : 'oklch(0.50 0.02 250)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              Email to members
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="gild-btn"
          style={{
            padding: '7px 16px',
            borderRadius: 8,
            background: `oklch(0.45 0.16 ${hue})`,
            color: '#fff',
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            cursor: isPending ? 'default' : 'pointer',
            opacity: isPending ? 0.7 : 1,
            transition: 'opacity 0.2s ease',
          }}
        >
          {isPending ? 'Posting…' : (canBroadcast && broadcastAsNewsletter ? 'Post & Email' : 'Post')}
        </button>
      </div>

      {showBroadcastConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="broadcast-confirm-title"
          aria-describedby="broadcast-confirm-desc"
          onClick={(e) => {
            // Backdrop click cancels — only when clicking the backdrop itself.
            if (e.target === e.currentTarget && !isPending) setShowBroadcastConfirm(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'oklch(0 0 0 / 0.45)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            ref={confirmPanelRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 16,
              maxWidth: 440,
              width: '100%',
              padding: '24px 24px 20px',
              boxShadow: '0 24px 64px oklch(0 0 0 / 0.25)',
              fontFamily: GILD_FONTS.sans,
            }}
          >
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: `oklch(0.95 0.06 ${hue})`,
                color: `oklch(0.40 0.16 ${hue})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 id="broadcast-confirm-title" style={{ margin: 0, fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', fontFamily: GILD_FONTS.display }}>
                  Email {recipientCount.toLocaleString()} member{recipientCount === 1 ? '' : 's'}?
                </h2>
                <p id="broadcast-confirm-desc" style={{ margin: '6px 0 0', fontSize: 13, color: 'oklch(0.45 0.02 250)', lineHeight: 1.5 }}>
                  Your post will be published to the feed AND sent as an email to every non-banned member who hasn't unsubscribed from broadcasts. This action can't be undone.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                type="button"
                disabled={isPending}
                onClick={() => setShowBroadcastConfirm(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: 'transparent',
                  color: 'oklch(0.35 0.02 250)',
                  border: '1px solid oklch(0.90 0.01 250)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isPending ? 'default' : 'pointer',
                  opacity: isPending ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => void performSubmit()}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: `oklch(0.45 0.16 ${hue})`,
                  color: '#fff',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isPending ? 'default' : 'pointer',
                  opacity: isPending ? 0.7 : 1,
                }}
              >
                {isPending ? 'Posting…' : `Post & email ${recipientCount.toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
});

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid oklch(0.90 0.01 250)',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
  background: 'oklch(0.99 0.002 250)',
};

PostForm.displayName = 'PostForm';

export default PostForm;
