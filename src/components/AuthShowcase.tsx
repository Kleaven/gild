'use client';

import React from 'react';
import {
  Avatar,
  Reactions,
  GILD_FONTS,
  DoodleStar,
  DoodleSpark,
  DoodleHeart,
  DoodleScribbleLine,
  DOODLE_COLORS,
} from '@/components/gild';
import type { Person } from '@/components/gild';
import { Check, Lock } from 'lucide-react';

// ─── AuthShowcase ────────────────────────────────────────────────────────────
// The right-hand art panel on /sign-in and /sign-up. Replaces the old PNG
// screenshots with a live-coded collage of real product moments — sharp at any
// DPI, zero asset weight, always on-brand. Two moods:
//   sign-in  → "your community kept moving while you were gone"
//   sign-up  → "what you're about to build"
// Motion is CSS-only, slow, and fully disabled under prefers-reduced-motion.

const HAIRLINE = '1px solid oklch(0.93 0.005 250)';
const FAINT = 'oklch(0.55 0.02 250)';

const jordan: Person = { id: 'jordan', name: 'Jordan Lee', role: 'owner', hue: 42, online: true, initial: 'JL' };
const mira: Person = { id: 'mira', name: 'Mira Patel', hue: 280, online: true, initial: 'MP', role: 'free_member' };
const sasha: Person = { id: 'sasha', name: 'Sasha Wu', hue: 150, online: true, initial: 'SW', role: 'free_member' };
const reza: Person = { id: 'reza', name: 'Reza Khan', hue: 200, online: true, initial: 'RK', role: 'free_member' };

const cardBase: React.CSSProperties = {
  background: '#fff',
  border: HAIRLINE,
  borderRadius: 16,
  boxShadow: '0 18px 44px -18px oklch(0.30 0.04 250 / 0.28)',
  fontFamily: GILD_FONTS.sans,
};

function PostCard() {
  return (
    <div style={{ ...cardBase, padding: '16px 18px', width: 290 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Avatar person={jordan} size={24} presence />
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>Jordan Lee</span>
        <span style={{
          padding: '1px 8px', borderRadius: 999, fontSize: 10, fontWeight: 600,
          background: 'oklch(0.96 0.02 42)', color: 'oklch(0.36 0.10 42)',
        }}>Announcements</span>
      </div>
      <p style={{ fontSize: 13.5, fontWeight: 600, margin: '0 0 4px' }}>Office hours moving to Thursdays</p>
      <p style={{ fontSize: 12, color: 'oklch(0.42 0.02 250)', margin: '0 0 10px', lineHeight: 1.5 }}>
        Shifting to a global-friendly slot — RSVP in the calendar…
      </p>
      <Reactions items={[['✨', 24], ['❤️', 18]]} hue={42} />
    </div>
  );
}

function PresenceCard() {
  return (
    <div style={{ ...cardBase, padding: '13px 15px', width: 168 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9 }}>
        <span className="as-pulse" style={{ width: 7, height: 7, borderRadius: '50%', background: 'oklch(0.62 0.18 150)', display: 'inline-block' }} />
        <span style={{ fontSize: 9.5, fontWeight: 700, color: 'oklch(0.42 0.14 150)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Live now</span>
      </div>
      {[mira, sasha, reza].map((p) => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3.5px 0' }}>
          <Avatar person={p} size={19} presence />
          <span style={{ fontSize: 12, color: 'oklch(0.30 0.02 250)' }}>{p.name.split(' ')[0]}</span>
        </div>
      ))}
    </div>
  );
}

function RevenueCard() {
  return (
    <div style={{ ...cardBase, padding: '14px 17px', width: 184 }}>
      <p style={{ fontSize: 9.5, fontWeight: 700, margin: '0 0 5px', color: FAINT, textTransform: 'uppercase', letterSpacing: '0.07em' }}>This month</p>
      <p style={{ fontSize: 23, fontWeight: 800, margin: 0, fontFamily: GILD_FONTS.mono, letterSpacing: '-0.02em' }}>$1,284</p>
      <p style={{ fontSize: 11, color: 'oklch(0.42 0.14 150)', fontWeight: 600, margin: '3px 0 0' }}>Yours. Gild takes $0.</p>
    </div>
  );
}

function CourseChip() {
  return (
    <div style={{ ...cardBase, padding: '11px 14px', width: 212, display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{
        width: 26, height: 26, borderRadius: 8, flexShrink: 0,
        background: 'oklch(0.95 0.05 150)', color: 'oklch(0.40 0.12 150)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Check size={14} strokeWidth={3} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 700, margin: 0 }}>Module 02 unlocked</p>
        <p style={{ fontSize: 10.5, color: FAINT, margin: 0 }}>Quiz passed · 92%</p>
      </div>
    </div>
  );
}

function TierStack() {
  const tiers = [
    { name: 'Little Elf', price: 5, emoji: '🌱', hue: 75 },
    { name: 'Wise Elf', price: 15, emoji: '🧙', hue: 300, hot: true },
    { name: 'Elder Elf', price: 40, emoji: '✨', hue: 250 },
  ];
  return (
    <div style={{ ...cardBase, padding: 14, width: 264, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ fontSize: 9.5, fontWeight: 700, margin: '0 0 2px', color: FAINT, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Your tiers, your names</p>
      {tiers.map((t) => (
        <div key={t.name} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
          borderRadius: 11,
          border: t.hot ? '1.5px solid oklch(0.55 0.16 300)' : HAIRLINE,
          background: '#fff',
        }}>
          <span style={{
            width: 23, height: 23, borderRadius: 7, flexShrink: 0, fontSize: 12,
            background: `oklch(0.95 0.04 ${t.hue})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }} aria-hidden>{t.emoji}</span>
          <span style={{ flex: 1, fontSize: 12.5, fontWeight: 700 }}>{t.name}</span>
          <span style={{ fontFamily: GILD_FONTS.mono, fontWeight: 800, fontSize: 12.5 }}>
            ${t.price}<span style={{ fontSize: 9.5, fontWeight: 500, color: FAINT }}>/mo</span>
          </span>
        </div>
      ))}
      <div style={{
        textAlign: 'center', padding: '7px 10px', borderRadius: 10,
        background: 'oklch(0.95 0.05 150)', color: 'oklch(0.36 0.12 150)',
        fontSize: 11, fontWeight: 700,
      }}>
        Platform fee: $0.00
      </div>
    </div>
  );
}

function CelebrationCard() {
  return (
    <div style={{
      ...cardBase,
      padding: '16px 20px',
      width: 208,
      textAlign: 'center',
      background: 'linear-gradient(135deg, oklch(0.95 0.06 150), oklch(0.97 0.03 200))',
      border: '1px solid oklch(0.85 0.08 150)',
    }}>
      <p style={{ fontSize: 20, margin: '0 0 4px' }} aria-hidden>🎉</p>
      <p style={{ fontFamily: GILD_FONTS.display, fontSize: 15, fontWeight: 800, margin: 0, color: 'oklch(0.32 0.10 150)' }}>
        Course complete!
      </p>
      <p style={{ fontSize: 10.5, margin: '3px 0 0', color: 'oklch(0.40 0.06 150)', fontWeight: 600 }}>
        Certificate earned
      </p>
    </div>
  );
}

function JoinToast({ person, label }: { person: Person; label: string }) {
  return (
    <div style={{
      ...cardBase,
      borderRadius: 999,
      padding: '7px 14px 7px 8px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      width: 'auto',
    }}>
      <Avatar person={person} size={20} presence />
      <span style={{ fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );
}

function PaywallChip() {
  return (
    <div style={{ ...cardBase, padding: '10px 13px', width: 196, display: 'flex', alignItems: 'center', gap: 9, color: FAINT }}>
      <span style={{
        width: 23, height: 23, borderRadius: '50%', flexShrink: 0,
        background: 'oklch(0.95 0.01 250)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Lock size={11} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11.5, fontWeight: 700, margin: 0, color: 'oklch(0.38 0.02 250)' }}>Module 03 · Going pro</p>
        <p style={{ fontSize: 9.5, margin: 0 }}>Wise Elf tier</p>
      </div>
      <span style={{
        padding: '3px 9px', borderRadius: 999, fontSize: 9.5, fontWeight: 700,
        background: 'oklch(0.52 0.16 300)', color: '#fff', whiteSpace: 'nowrap',
      }}>Upgrade</span>
    </div>
  );
}

// A floating, slightly-tilted slot in the collage.
function Float({
  top, left, right, bottom, rotate, delay, z,
  children,
}: {
  top?: string; left?: string; right?: string; bottom?: string;
  rotate: number; delay: number; z?: number;
  children: React.ReactNode;
}) {
  return (
    <div style={{ position: 'absolute', top, left, right, bottom, transform: `rotate(${rotate}deg)`, zIndex: z ?? 1 }}>
      <div className="as-float" style={{ animationDelay: `${delay}s` }}>
        {children}
      </div>
    </div>
  );
}

export function AuthShowcase({ variant }: { variant: 'sign-in' | 'sign-up' }) {
  return (
    <div
      className="gild-auth-art"
      aria-hidden
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderLeft: HAIRLINE,
        background: 'oklch(0.985 0.004 250)',
        backgroundImage: 'radial-gradient(oklch(0.90 0.01 250) 1px, transparent 1px)',
        backgroundSize: '26px 26px',
      }}
    >
      {/* soft glows */}
      <span style={{
        position: 'absolute', top: '-12%', right: '-14%', width: 380, height: 380, borderRadius: '50%',
        background: variant === 'sign-in' ? 'oklch(0.90 0.06 75 / 0.55)' : 'oklch(0.90 0.06 300 / 0.5)',
        filter: 'blur(90px)', pointerEvents: 'none',
      }} />
      <span style={{
        position: 'absolute', bottom: '-14%', left: '-12%', width: 360, height: 360, borderRadius: '50%',
        background: 'oklch(0.90 0.06 150 / 0.45)', filter: 'blur(90px)', pointerEvents: 'none',
      }} />

      {/* doodles */}
      <DoodleStar style={{ top: '7%', left: '10%' }} size={26} color={DOODLE_COLORS.warm} />
      <DoodleSpark style={{ top: '14%', right: '12%' }} size={18} color={DOODLE_COLORS.green} />
      <DoodleHeart style={{ bottom: '10%', right: '14%' }} size={22} color={DOODLE_COLORS.warm} />
      <DoodleScribbleLine style={{ bottom: '16%', left: '8%' }} w={64} color={DOODLE_COLORS.lilac} />

      {variant === 'sign-in' ? (
        <>
          <Float top="16%" left="50%" rotate={-2} delay={0} z={3}>
            <div style={{ transform: 'translateX(-50%)' }}><PostCard /></div>
          </Float>
          <Float top="42%" right="7%" rotate={2.5} delay={1.2} z={2}>
            <PresenceCard />
          </Float>
          <Float bottom="17%" left="9%" rotate={1.5} delay={2.1} z={2}>
            <RevenueCard />
          </Float>
          <Float bottom="9%" right="16%" rotate={-1.5} delay={0.7}>
            <CourseChip />
          </Float>
          <p style={{
            position: 'absolute', bottom: '3.5%', left: '50%', transform: 'translateX(-50%) rotate(-2deg)',
            fontFamily: 'var(--font-gochi), cursive', fontSize: 19, color: DOODLE_COLORS.ink,
            margin: 0, whiteSpace: 'nowrap',
          }}>
            right where you left it
          </p>
        </>
      ) : (
        <>
          <Float top="20%" left="50%" rotate={1.5} delay={0} z={3}>
            <div style={{ transform: 'translateX(-50%)' }}><TierStack /></div>
          </Float>
          <Float top="9%" left="8%" rotate={-3} delay={1.6} z={2}>
            <CelebrationCard />
          </Float>
          <Float top="54%" right="7%" rotate={2} delay={0.9} z={2}>
            <PaywallChip />
          </Float>
          <Float bottom="24%" left="9%" rotate={-1.5} delay={2.4}>
            <JoinToast person={mira} label="Mira just joined ✨" />
          </Float>
          <Float bottom="14%" left="20%" rotate={1} delay={3.1}>
            <JoinToast person={reza} label="Reza upgraded to Wise Elf" />
          </Float>
          <p style={{
            position: 'absolute', bottom: '3.5%', left: '50%', transform: 'translateX(-50%) rotate(-2deg)',
            fontFamily: 'var(--font-gochi), cursive', fontSize: 19, color: DOODLE_COLORS.ink,
            margin: 0, whiteSpace: 'nowrap',
          }}>
            all yours, from day one
          </p>
        </>
      )}

      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .as-float { animation: asFloat 7.5s ease-in-out infinite; }
          @keyframes asFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-11px); }
          }
          .as-pulse { animation: asPulse 2.2s ease-in-out infinite; }
          @keyframes asPulse {
            0%, 100% { box-shadow: 0 0 0 0 oklch(0.62 0.18 150 / 0.45); }
            50% { box-shadow: 0 0 0 5px oklch(0.62 0.18 150 / 0); }
          }
        }
        @media (max-width: 860px) {
          .gild-auth-art { display: none !important; }
        }
      `}</style>
    </div>
  );
}
