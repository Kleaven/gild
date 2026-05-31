'use client';

import React from 'react';
import { GILD_FONTS } from '@/components/gild';
import { AlertTriangle, Trash2 } from 'lucide-react';

// In-app destructive confirmation. Replaces the native window.confirm() so the
// experience matches the rest of the product (overlay, blur, branded buttons).
// Layers at z-index 1200 so it sits above other modals (e.g. the quiz editor).

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={busy ? undefined : onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          width: '100%',
          maxWidth: 420,
          borderRadius: 20,
          padding: 24,
          boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
          animation: 'gild-modal-in 0.2s ease-out',
          fontFamily: GILD_FONTS.sans,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            flexShrink: 0,
            background: 'oklch(0.96 0.03 25)',
            color: 'oklch(0.50 0.20 25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <AlertTriangle size={20} />
          </div>
          <h3 style={{ fontFamily: GILD_FONTS.display, fontSize: 18, fontWeight: 800, margin: 0 }}>{title}</h3>
        </div>
        <p style={{ fontSize: 14, color: 'oklch(0.45 0.02 250)', lineHeight: 1.6, margin: '0 0 24px' }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            onClick={onCancel}
            disabled={busy}
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              background: 'transparent',
              border: '1px solid oklch(0.90 0.01 250)',
              fontSize: 14,
              fontWeight: 600,
              cursor: busy ? 'default' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              background: 'oklch(0.55 0.20 25)',
              color: '#fff',
              border: 'none',
              fontSize: 14,
              fontWeight: 700,
              cursor: busy ? 'default' : 'pointer',
              opacity: busy ? 0.7 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'inherit',
            }}
          >
            <Trash2 size={16} /> {busy ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes gild-modal-in {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
