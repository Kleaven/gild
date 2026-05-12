import React from 'react';
import { GILD_FONTS } from './styles';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'oklch(0 0 0 / 0.4)',
          backdropFilter: 'blur(4px)',
        }} 
      />

      {/* Modal Card */}
      <div style={{
        position: 'relative',
        background: '#fff',
        borderRadius: 20,
        padding: '32px 28px',
        maxWidth: 400,
        width: '100%',
        boxShadow: '0 20px 40px oklch(0 0 0 / 0.15)',
        fontFamily: GILD_FONTS.sans,
        animation: 'gild-modal-enter 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <h2 style={{
          fontFamily: GILD_FONTS.display,
          fontSize: 22,
          fontWeight: 800,
          margin: '0 0 12px',
          color: '#111',
          letterSpacing: '-0.02em',
        }}>{title}</h2>
        <p style={{
          fontSize: 15,
          color: 'oklch(0.40 0.02 250)',
          margin: '0 0 32px',
          lineHeight: 1.5,
        }}>{message}</p>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 12,
              border: '1px solid oklch(0.90 0.01 250)',
              background: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              color: 'oklch(0.30 0.02 250)',
              transition: 'background 0.2s',
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 12,
              border: 'none',
              background: isDestructive ? 'oklch(0.60 0.15 25)' : 'oklch(0.20 0.02 250)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px oklch(0 0 0 / 0.1)',
              transition: 'transform 0.2s',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes gild-modal-enter {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}} />
    </div>
  );
}
