'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Trash2, ShieldCheck, AlertTriangle, X } from 'lucide-react';
import { GILD_FONTS } from '@/components/gild';
import { requestDataExport, requestAccountDeletion } from '@/app/actions';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

type Props = {
  displayName: string;
  email: string;
};

export default function PrivacyClient({ displayName, email }: Props) {
  // ─── Export state ──────────────────────────────────────────────────────────
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  // ─── Delete-account modal state ────────────────────────────────────────────
  const [showDelete, setShowDelete] = useState(false);
  const [typed, setTyped] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Reset modal state every time it opens.
  useEffect(() => {
    if (showDelete) {
      setTyped('');
      setDeleteError(null);
    }
  }, [showDelete]);

  // Esc-to-close + Tab focus trap + focus restore.
  useEffect(() => {
    if (!showDelete) return;
    triggerRef.current = (document.activeElement as HTMLElement | null) ?? null;
    const panel = panelRef.current;
    const focusables = panel?.querySelectorAll<HTMLElement>(FOCUSABLE);
    focusables?.[0]?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (!isDeleting) {
          e.preventDefault();
          setShowDelete(false);
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
      const t = triggerRef.current;
      if (t && document.contains(t)) t.focus();
    };
  }, [showDelete, isDeleting]);

  async function handleExport() {
    setExportError(null);
    setExportSuccess(false);
    setIsExporting(true);
    try {
      const res = await requestDataExport();
      if (res.error || !res.data) {
        setExportError(res.error ?? 'Export failed');
        return;
      }
      // Client-side JSON download — no server file storage involved, the
      // payload lives only in the browser as long as the user keeps the
      // download. URL revoked immediately after click for cleanup.
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gild-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setExportSuccess(true);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDelete() {
    if (!canConfirmDelete) return;
    setDeleteError(null);
    setIsDeleting(true);
    try {
      const res = await requestAccountDeletion();
      // On success the action redirects server-side, so we should never
      // actually reach the post-await branch unless the server returned
      // an error response. Handle defensively.
      if (res?.error) {
        setDeleteError(res.error);
        setIsDeleting(false);
        return;
      }
      // Belt-and-braces hard navigation in case the redirect was caught.
      window.location.assign('/');
    } catch (err) {
      // Next.js' redirect() throws an internal NEXT_REDIRECT — that's the
      // happy path. Anything else is a real error.
      if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
        return;
      }
      setDeleteError(err instanceof Error ? err.message : 'Deletion failed');
      setIsDeleting(false);
    }
  }

  const expectedConfirmation = 'delete my account';
  const canConfirmDelete = typed.trim().toLowerCase() === expectedConfirmation && !isDeleting;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Export card */}
      <section style={sectionStyle}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ ...iconWrap, background: 'oklch(0.94 0.04 240)', color: 'oklch(0.40 0.14 240)' }}>
            <Download size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={sectionTitle}>Export your data</h2>
            <p style={sectionBody}>
              Download a JSON snapshot of your profile, community memberships,
              course enrollments, certificates, and usage counts. The file is
              generated on demand and never stored on Gild's servers.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            style={{
              ...primaryButton,
              background: 'oklch(0.20 0.02 250)',
              opacity: isExporting ? 0.7 : 1,
              cursor: isExporting ? 'default' : 'pointer',
            }}
          >
            <Download size={14} />
            {isExporting ? 'Preparing…' : 'Download my data'}
          </button>

          {exportSuccess && (
            <span
              role="status"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                color: 'oklch(0.36 0.14 150)',
              }}
            >
              <ShieldCheck size={14} /> Saved to your downloads.
            </span>
          )}
        </div>

        {exportError && (
          <p role="alert" style={errorChip}>
            {exportError}
          </p>
        )}
      </section>

      {/* Delete card — destructive section */}
      <section style={{ ...sectionStyle, borderColor: 'oklch(0.92 0.05 25)' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ ...iconWrap, background: 'oklch(0.96 0.05 25)', color: 'oklch(0.45 0.16 25)' }}>
            <Trash2 size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={sectionTitle}>Delete your account</h2>
            <p style={sectionBody}>
              Permanently removes your profile, anonymises your posts and
              comments (authorship set to null, content preserved for community
              continuity), revokes your sessions, and cancels every active
              membership. This action cannot be undone.
            </p>
            <p style={{ ...sectionBody, marginTop: 12 }}>
              <strong style={{ color: 'oklch(0.30 0.02 250)' }}>
                If you own any communities, transfer ownership first
              </strong>{' '}
              — accounts owning live communities cannot be deleted (the server
              will surface a clear error).
            </p>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            style={{
              ...primaryButton,
              background: 'oklch(0.96 0.02 25)',
              color: 'oklch(0.45 0.15 25)',
              border: '1px solid oklch(0.85 0.05 25)',
            }}
          >
            <Trash2 size={14} />
            Delete account…
          </button>
        </div>
      </section>

      {/* Delete-account confirmation modal */}
      {showDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
          aria-describedby="delete-account-desc"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) setShowDelete(false);
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
              maxWidth: 480,
              width: '100%',
              padding: '24px 24px 20px',
              boxShadow: '0 24px 64px oklch(0 0 0 / 0.25)',
              fontFamily: GILD_FONTS.sans,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ ...iconWrap, background: 'oklch(0.95 0.05 25)', color: 'oklch(0.45 0.16 25)', flexShrink: 0 }}>
                <AlertTriangle size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2
                  id="delete-account-title"
                  style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    fontFamily: GILD_FONTS.display,
                  }}
                >
                  Delete account permanently
                </h2>
                <p
                  id="delete-account-desc"
                  style={{
                    margin: '6px 0 0',
                    fontSize: 13,
                    color: 'oklch(0.45 0.02 250)',
                    lineHeight: 1.55,
                  }}
                >
                  This will delete the account associated with{' '}
                  <strong style={{ fontFamily: GILD_FONTS.mono, color: 'oklch(0.25 0.02 250)' }}>
                    {email || displayName}
                  </strong>
                  . Your authored posts and comments remain visible but with
                  authorship anonymised.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setShowDelete(false)}
                disabled={isDeleting}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'transparent',
                  border: 'none',
                  color: 'oklch(0.50 0.02 250)',
                  cursor: isDeleting ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  opacity: isDeleting ? 0.4 : 1,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Type-to-confirm gate */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
              <span style={{ color: 'oklch(0.40 0.02 250)' }}>
                Type{' '}
                <strong style={{ fontFamily: GILD_FONTS.mono, color: 'oklch(0.25 0.02 250)' }}>
                  delete my account
                </strong>{' '}
                to confirm
              </span>
              <input
                name="confirm-delete"
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                disabled={isDeleting}
                autoComplete="off"
                spellCheck={false}
                aria-invalid={typed.length > 0 && !canConfirmDelete && !isDeleting}
                placeholder="delete my account"
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `1px solid ${
                    typed.length > 0 && !canConfirmDelete && !isDeleting
                      ? 'oklch(0.75 0.12 25)'
                      : 'oklch(0.92 0.01 250)'
                  }`,
                  fontSize: 14,
                  fontFamily: GILD_FONTS.mono,
                  outline: 'none',
                  background: isDeleting ? 'oklch(0.97 0.005 250)' : '#fff',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canConfirmDelete) {
                    e.preventDefault();
                    void handleDelete();
                  }
                }}
              />
            </label>

            {deleteError && (
              <p role="alert" style={{ ...errorChip, margin: 0 }}>
                {deleteError}
              </p>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setShowDelete(false)}
                disabled={isDeleting}
                style={{
                  padding: '9px 16px',
                  borderRadius: 8,
                  background: 'transparent',
                  color: 'oklch(0.35 0.02 250)',
                  border: '1px solid oklch(0.90 0.01 250)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isDeleting ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                  opacity: isDeleting ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={!canConfirmDelete}
                style={{
                  padding: '9px 16px',
                  borderRadius: 8,
                  background: canConfirmDelete ? 'oklch(0.50 0.18 25)' : 'oklch(0.88 0.04 25)',
                  color: canConfirmDelete ? '#fff' : 'oklch(0.55 0.06 25)',
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: canConfirmDelete ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                  transition: 'background 0.15s ease',
                }}
              >
                {isDeleting ? 'Deleting…' : 'Delete account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const sectionStyle: React.CSSProperties = {
  border: '1px solid oklch(0.93 0.005 250)',
  borderRadius: 16,
  padding: 24,
  background: '#fff',
};

const sectionTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 700,
  letterSpacing: '-0.015em',
  fontFamily: GILD_FONTS.display,
  color: 'oklch(0.20 0.02 250)',
};

const sectionBody: React.CSSProperties = {
  margin: '6px 0 0',
  fontSize: 13.5,
  lineHeight: 1.55,
  color: 'oklch(0.42 0.02 250)',
};

const iconWrap: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const primaryButton: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 16px',
  borderRadius: 8,
  color: '#fff',
  border: 'none',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const errorChip: React.CSSProperties = {
  marginTop: 12,
  padding: '10px 14px',
  borderRadius: 8,
  background: 'oklch(0.96 0.04 25)',
  border: '1px solid oklch(0.88 0.08 25)',
  color: 'oklch(0.40 0.16 25)',
  fontSize: 13,
  lineHeight: 1.4,
};
