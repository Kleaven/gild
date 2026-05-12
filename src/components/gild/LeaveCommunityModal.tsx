'use client';

import React, { useTransition } from 'react';
import { GILD_FONTS } from './styles';
import { Heart, X, AlertTriangle } from 'lucide-react';
import { leaveCommunity } from '@/app/actions';
import { useRouter } from 'next/navigation';

interface Props {
  communityId: string;
  communityName: string;
  message?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LeaveCommunityModal({ communityId, communityName, message, isOpen, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  async function handleLeave() {
    startTransition(async () => {
      try {
        await leaveCommunity(communityId);
        router.push('/communities');
        router.refresh();
      } catch (err) {
        console.error('Failed to leave community:', err);
      }
    });
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(10px)',
      animation: 'gild-fade-in 0.3s ease-out'
    }}>
      <div style={{
        background: '#fff',
        width: '100%',
        maxWidth: 440,
        borderRadius: 24,
        padding: 32,
        position: 'relative',
        boxShadow: '0 30px 100px rgba(0,0,0,0.25)',
        animation: 'gild-pop-in 0.3s ease-out'
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
          width: 56,
          height: 56,
          borderRadius: 16,
          background: 'oklch(0.96 0.04 25)',
          color: 'oklch(0.50 0.16 25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24
        }}>
          <AlertTriangle size={28} />
        </div>

        <h2 style={{ 
          fontFamily: GILD_FONTS.display, 
          fontSize: 24, 
          fontWeight: 800, 
          letterSpacing: '-0.02em',
          margin: '0 0 12px'
        }}>
          Leaving {communityName}?
        </h2>

        <p style={{
          fontSize: 15,
          lineHeight: 1.5,
          color: 'oklch(0.45 0.02 250)',
          margin: '0 0 24px'
        }}>
          Are you sure you want to leave this community? You will lose access to all private spaces and members-only content.
        </p>

        {message && (
          <div style={{
            background: 'oklch(0.985 0.003 250)',
            border: '1px solid oklch(0.94 0.005 250)',
            borderRadius: 16,
            padding: 20,
            marginBottom: 32,
            position: 'relative'
          }}>
            <p style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: 'oklch(0.25 0.02 250)',
              margin: 0,
              fontStyle: 'italic'
            }}>
              "{message}"
            </p>
            <div style={{
              position: 'absolute',
              top: -10,
              left: 16,
              background: '#fff',
              padding: '2px 8px',
              fontSize: 10,
              fontWeight: 800,
              color: 'oklch(0.55 0.02 250)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              border: '1px solid oklch(0.94 0.005 250)',
              borderRadius: 6
            }}>A note from the owner</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={onClose}
            disabled={isPending}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: 12,
              background: 'oklch(0.96 0.005 250)',
              color: 'oklch(0.20 0.02 250)',
              border: 'none',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Stay here
          </button>
          <button 
            onClick={handleLeave}
            disabled={isPending}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: 12,
              background: 'oklch(0.50 0.16 25)',
              color: '#fff',
              border: 'none',
              fontSize: 15,
              fontWeight: 700,
              cursor: isPending ? 'wait' : 'pointer'
            }}
          >
            {isPending ? 'Leaving...' : 'Leave Community'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes gild-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes gild-pop-in {
          from { transform: scale(0.95) translateY(10px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
