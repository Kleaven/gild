'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { GILD_FONTS } from './styles';

// Focusable selector for the focus trap — mirrors the pattern in PostForm's
// broadcast-confirm modal. Excludes negative tabindex.
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

type Props = {
  /** Required confirmation string. Delete is disabled until the user types
      this verbatim (case-sensitive) — industry standard for destructive ops. */
  expectedName: string;
  isOpen: boolean;
  isPending: boolean;
  /** Surfaces inline errors returned by the server action. */
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
};

export function DeleteCommunityModal({
  expectedName,
  isOpen,
  isPending,
  error,
  onConfirm,
  onClose,
}: Props) {
  const [typed, setTyped] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Reset the input every time the modal opens — never preserve typed-name
  // across opens, that defeats the safety check.
  useEffect(() => {
    if (isOpen) setTyped('');
  }, [isOpen]);

  // Esc-to-close + Tab focus trap + focus restore. Mounted only while open.
  useEffect(() => {
    if (!isOpen) return;

    triggerRef.current = (document.activeElement as HTMLElement | null) ?? null;

    // Initial focus on the textbox so the user can type immediately.
    const input = panelRef.current?.querySelector<HTMLInputElement>('input[name="confirm-name"]');
    input?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (!isPending) {
          e.preventDefault();
          onClose();
        }
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const list = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
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
      const trigger = triggerRef.current;
      if (trigger && document.contains(trigger)) trigger.focus();
    };
  }, [isOpen, isPending, onClose]);

  if (!isOpen) return null;

  const matches = typed === expectedName;
  const canConfirm = matches && !isPending;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-community-title"
      aria-describedby="delete-community-desc"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose();
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
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 16,
          maxWidth: 460,
          width: '100%',
          padding: '24px 24px 20px',
          boxShadow: '0 24px 64px oklch(0 0 0 / 0.25)',
          fontFamily: GILD_FONTS.sans,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div
            aria-hidden="true"
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'oklch(0.95 0.05 25)',
              color: 'oklch(0.45 0.16 25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              id="delete-community-title"
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                fontFamily: GILD_FONTS.display,
                color: 'oklch(0.20 0.02 250)',
              }}
            >
              Delete {expectedName}?
            </h2>
            <p
              id="delete-community-desc"
              style={{
                margin: '6px 0 0',
                fontSize: 13,
                color: 'oklch(0.45 0.02 250)',
                lineHeight: 1.55,
              }}
            >
              This permanently removes every space, post, comment, course, and
              membership in <strong>{expectedName}</strong>. Members will lose
              access immediately. <strong>This action cannot be undone.</strong>
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            disabled={isPending}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'transparent',
              border: 'none',
              color: 'oklch(0.50 0.02 250)',
              cursor: isPending ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              opacity: isPending ? 0.4 : 1,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Type-to-confirm */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
          <span style={{ color: 'oklch(0.40 0.02 250)' }}>
            Type <strong style={{ fontFamily: GILD_FONTS.mono, color: 'oklch(0.25 0.02 250)' }}>{expectedName}</strong> to confirm
          </span>
          <input
            name="confirm-name"
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={isPending}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={typed.length > 0 && !matches}
            placeholder={expectedName}
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              border: `1px solid ${
                typed.length > 0 && !matches
                  ? 'oklch(0.75 0.12 25)'
                  : 'oklch(0.92 0.01 250)'
              }`,
              fontSize: 14,
              fontFamily: GILD_FONTS.mono,
              outline: 'none',
              background: isPending ? 'oklch(0.97 0.005 250)' : '#fff',
              color: 'oklch(0.15 0.02 250)',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canConfirm) {
                e.preventDefault();
                onConfirm();
              }
            }}
          />
        </label>

        {error && (
          <div
            role="alert"
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              background: 'oklch(0.96 0.05 25)',
              color: 'oklch(0.40 0.16 25)',
              fontSize: 13,
              lineHeight: 1.4,
            }}
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            style={{
              padding: '9px 16px',
              borderRadius: 8,
              background: 'transparent',
              color: 'oklch(0.35 0.02 250)',
              border: '1px solid oklch(0.90 0.01 250)',
              fontSize: 13,
              fontWeight: 600,
              cursor: isPending ? 'default' : 'pointer',
              fontFamily: 'inherit',
              opacity: isPending ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm}
            style={{
              padding: '9px 16px',
              borderRadius: 8,
              background: canConfirm ? 'oklch(0.50 0.18 25)' : 'oklch(0.88 0.04 25)',
              color: canConfirm ? '#fff' : 'oklch(0.55 0.06 25)',
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              cursor: canConfirm ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              transition: 'background 0.15s ease',
            }}
          >
            {isPending ? 'Deleting…' : 'Delete community'}
          </button>
        </div>
      </div>
    </div>
  );
}
