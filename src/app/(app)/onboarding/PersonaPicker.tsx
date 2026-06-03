'use client';

import React from 'react';
import { GILD_FONTS } from '@/components/gild';
import { Users, Layout, ArrowRight } from 'lucide-react';
import { updateProfile } from '@/app/actions';

interface PersonaPickerProps {
  onSelect: (persona: 'member' | 'owner') => void;
}

export function PersonaPicker({ onSelect }: PersonaPickerProps) {
  const [isPending, setIsPending] = React.useState<'member' | 'owner' | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSelect(persona: 'member' | 'owner') {
    setError(null);
    setIsPending(persona);
    // Persist ONLY the persona — never touch display_name/username here.
    const res = await updateProfile({ persona });
    if (!res.ok) {
      setIsPending(null);
      setError(res.error);
      return;
    }
    onSelect(persona);
  }

  return (
    <div style={{
      fontFamily: GILD_FONTS.sans,
      maxWidth: 800,
      margin: '0 auto',
      padding: '40px 20px',
    }}>
      <h1 style={{
        fontFamily: GILD_FONTS.display,
        fontSize: 32,
        fontWeight: 800,
        textAlign: 'center',
        margin: '0 0 12px',
        letterSpacing: '-0.03em',
      }}>Choose your path</h1>
      <p style={{
        fontSize: 16,
        color: 'oklch(0.40 0.02 250)',
        textAlign: 'center',
        margin: '0 0 48px',
      }}>How do you want to use Gild today?</p>

      {error && (
        <p style={{
          textAlign: 'center',
          color: '#c00',
          fontSize: 14,
          fontWeight: 600,
          margin: '0 0 24px',
        }}>{error}</p>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 24,
      }}>
        {/* Member Card */}
        <button
          onClick={() => handleSelect('member')}
          disabled={!!isPending}
          style={{
            background: '#fff',
            border: '2px solid oklch(0.94 0.005 250)',
            borderRadius: 24,
            padding: 32,
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'oklch(0.20 0.02 250)';
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 24px oklch(0 0 0 / 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'oklch(0.94 0.005 250)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'oklch(0.96 0.01 250)',
            color: 'oklch(0.20 0.02 250)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}>
            <Users size={24} />
          </div>
          <h2 style={{
            fontSize: 20,
            fontWeight: 700,
            margin: '0 0 12px',
          }}>I&apos;m a Resident</h2>
          <p style={{
            fontSize: 14,
            lineHeight: 1.5,
            color: 'oklch(0.45 0.02 250)',
            margin: '0 0 32px',
          }}>
            I want to join premium communities, learn from experts, and connect with like-minded people.
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 14,
            fontWeight: 700,
            color: 'oklch(0.20 0.02 250)',
          }}>
            Explore Communities
            <ArrowRight size={16} />
          </div>
        </button>

        {/* Owner Card */}
        <button
          onClick={() => handleSelect('owner')}
          disabled={!!isPending}
          style={{
            background: '#fff',
            border: '2px solid oklch(0.94 0.005 250)',
            borderRadius: 24,
            padding: 32,
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'oklch(0.20 0.02 250)';
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 24px oklch(0 0 0 / 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'oklch(0.94 0.005 250)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'oklch(0.96 0.01 250)',
            color: 'oklch(0.20 0.02 250)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}>
            <Layout size={24} />
          </div>
          <h2 style={{
            fontSize: 20,
            fontWeight: 700,
            margin: '0 0 12px',
          }}>I&apos;m an Architect</h2>
          <p style={{
            fontSize: 14,
            lineHeight: 1.5,
            color: 'oklch(0.45 0.02 250)',
            margin: '0 0 32px',
          }}>
            I want to build a premium community, share my expertise, and monetize my knowledge.
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 14,
            fontWeight: 700,
            color: 'oklch(0.20 0.02 250)',
          }}>
            Create Community
            <ArrowRight size={16} />
          </div>
        </button>
      </div>
    </div>
  );
}
