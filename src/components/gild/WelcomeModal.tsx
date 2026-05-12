'use client';

import React from 'react';
import { Wordmark, GILD_FONTS } from './styles';
import { Sparkles, X } from 'lucide-react';

interface Props {
  communityName: string;
  message?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeModal({ communityName, message, isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: 'rgba(0,0,0,0.4)',
      backdropFilter: 'blur(8px)',
      animation: 'gild-fade-in 0.3s ease-out'
    }}>
      <div style={{
        background: '#fff',
        width: '100%',
        maxWidth: 480,
        borderRadius: 24,
        padding: 40,
        position: 'relative',
        boxShadow: '0 20px 80px rgba(0,0,0,0.2)',
        textAlign: 'center',
        animation: 'gild-pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'oklch(0.96 0.005 250)',
            border: 'none',
            borderRadius: 10,
            width: 32,
            height: 32,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'oklch(0.40 0.02 250)'
          }}
        >
          <X size={18} />
        </button>

        <div style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          background: 'oklch(0.96 0.04 150)',
          color: 'oklch(0.40 0.15 150)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <Sparkles size={32} />
        </div>

        <h2 style={{ 
          fontFamily: GILD_FONTS.display, 
          fontSize: 28, 
          fontWeight: 800, 
          letterSpacing: '-0.03em',
          margin: '0 0 12px'
        }}>
          Welcome to {communityName}!
        </h2>

        <div style={{
          background: 'oklch(0.985 0.003 250)',
          border: '1px solid oklch(0.94 0.005 250)',
          borderRadius: 16,
          padding: 24,
          marginBottom: 32,
          position: 'relative'
        }}>
          <p style={{
            fontSize: 15,
            lineHeight: 1.6,
            color: 'oklch(0.25 0.02 250)',
            margin: 0,
            fontStyle: message ? 'normal' : 'italic'
          }}>
            {message || "We're thrilled to have you here. Explore our spaces and start connecting with the community."}
          </p>
          <div style={{
            position: 'absolute',
            top: -10,
            left: 20,
            background: '#fff',
            padding: '2px 8px',
            fontSize: 11,
            fontWeight: 700,
            color: 'oklch(0.55 0.02 250)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            border: '1px solid oklch(0.94 0.005 250)',
            borderRadius: 6
          }}>Message from Owner</div>
        </div>

        <button 
          onClick={onClose}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 14,
            background: 'oklch(0.20 0.02 250)',
            color: '#fff',
            border: 'none',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Let's Explore
        </button>
      </div>

      <style>{`
        @keyframes gild-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes gild-pop-in {
          from { transform: scale(0.9) translateY(20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
