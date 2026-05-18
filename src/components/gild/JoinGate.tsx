'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { joinCommunity } from '@/app/actions';
import { WelcomeModal } from './WelcomeModal';
import { GILD_FONTS } from './styles';
import { CoverArt } from './GildPrimitives';
import { Users, Sparkles, ArrowRight } from 'lucide-react';

interface Props {
  community: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    member_count: number;
    welcome_message: string | null;
    theme_hue?: number;
    pricing_type?: 'free' | 'paid';
    price_amount?: number;
    price_currency?: string;
  };
}

export function JoinGate({ community }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const hue = community.theme_hue || 250;

  function handleJoin() {
    setError(null);
    startTransition(async () => {
      try {
        if (community.pricing_type === 'paid') {
          const { createCommunityJoinSession } = await import('@/app/actions/billing');
          const { url } = await createCommunityJoinSession(community.id);
          window.location.href = url;
          return;
        }

        const result = await joinCommunity(community.id);
        if (result.ok) {
          router.push(`/c/${community.slug}?welcome=1`);
          return;
        }
        // Already-a-member is a "soft" failure: they belong here, just
        // send them in. Other codes need explicit inline messaging.
        if (result.code === 'already_member') {
          router.push(`/c/${community.slug}`);
          return;
        }
        setError(result.message);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to join. Please try again.');
      }
    });
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <CoverArt 
          space={{ id: community.id, name: community.name, hue }} 
          height={180} 
          variant="rays" 
        />
        
        <div style={contentStyle}>
          <div style={badgeStyle}>
            <Sparkles size={12} />
            Exclusive Community
          </div>
          
          <h1 style={titleStyle}>{community.name}</h1>
          
          {community.description && (
            <p style={descriptionStyle}>{community.description}</p>
          )}

          <div style={statsStyle}>
            <Users size={16} />
            <span>{community.member_count.toLocaleString()} members already here</span>
          </div>

          <button 
            onClick={handleJoin}
            disabled={isPending}
            style={{
              ...buttonStyle,
              background: `oklch(0.20 0.02 ${hue})`,
              cursor: isPending ? 'wait' : 'pointer',
              opacity: isPending ? 0.7 : 1
            }}
          >
            {isPending
              ? 'Processing...'
              : community.pricing_type === 'paid'
                ? `Join for $${community.price_amount}`
                : 'Join Community'}
            {!isPending && <ArrowRight size={18} />}
          </button>

          {error && (
            <p
              role="alert"
              style={{
                marginTop: 16,
                padding: '12px 16px',
                background: 'oklch(0.96 0.04 25)',
                border: '1px solid oklch(0.88 0.08 25)',
                borderRadius: 10,
                color: 'oklch(0.40 0.16 25)',
                fontSize: 13,
                lineHeight: 1.5,
                textAlign: 'center',
              }}
            >
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 5000,
  background: 'oklch(0.99 0.002 250)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  fontFamily: GILD_FONTS.sans
};

const cardStyle: React.CSSProperties = {
  background: '#fff',
  width: '100%',
  maxWidth: 480,
  borderRadius: 32,
  overflow: 'hidden',
  boxShadow: '0 40px 120px rgba(0,0,0,0.1)',
  border: '1px solid oklch(0.94 0.005 250)',
  animation: 'gild-pop-in 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
};

const contentStyle: React.CSSProperties = {
  padding: '40px',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
};

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  borderRadius: 999,
  background: 'oklch(0.96 0.04 150)',
  color: 'oklch(0.40 0.15 150)',
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: 20
};

const titleStyle: React.CSSProperties = {
  fontFamily: GILD_FONTS.display,
  fontSize: 36,
  fontWeight: 800,
  letterSpacing: '-0.04em',
  margin: '0 0 12px',
  color: '#111'
};

const descriptionStyle: React.CSSProperties = {
  fontSize: 16,
  lineHeight: 1.6,
  color: 'oklch(0.40 0.02 250)',
  margin: '0 0 24px',
  maxWidth: '90%'
};

const statsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 14,
  fontWeight: 600,
  color: 'oklch(0.55 0.02 250)',
  marginBottom: 32
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '18px',
  borderRadius: 16,
  border: 'none',
  color: '#fff',
  fontSize: 16,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  transition: 'all 0.2s ease',
  boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
};
