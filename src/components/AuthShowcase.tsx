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
  DoodlePot,
  DoodleGuitar,
  DoodleCamera,
  DoodleSprout,
  DOODLE_COLORS,
} from '@/components/gild';
import type { Person } from '@/components/gild';
import { Check } from 'lucide-react';

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
const theo: Person = { id: 'theo', name: 'Theo Marsh', hue: 30, online: true, initial: 'TM', role: 'free_member' };
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
        }}>Synth Lab</span>
      </div>
      <p style={{ fontSize: 13.5, fontWeight: 600, margin: '0 0 4px' }}>Patch breakdown just dropped 🎛️</p>
      <p style={{ fontSize: 12, color: 'oklch(0.42 0.02 250)', margin: '0 0 10px', lineHeight: 1.5 }}>
        Rebuilt the Blade Runner brass on a $99 synth — preset pack inside. Crank it and tell me what you hear!
      </p>
      <Reactions items={[['🎛️', 27], ['🔥', 19]]} hue={42} />
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
      {[mira, theo, reza].map((p) => (
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

function DMCard() {
  return (
    <div style={{ ...cardBase, padding: '13px 15px', width: 226 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Avatar person={theo} size={22} presence />
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, margin: 0 }}>Theo Marsh</p>
          <p style={{ fontSize: 9.5, color: FAINT, margin: 0 }}>Direct message</p>
        </div>
      </div>
      <p style={{
        margin: 0, padding: '8px 12px', borderRadius: '12px 12px 12px 4px',
        background: 'oklch(0.96 0.01 250)', fontSize: 12, lineHeight: 1.5,
        color: 'oklch(0.28 0.02 250)',
      }}>
        the kiln opening did NOT disappoint 🏺 starting mine tonight!!
      </p>
    </div>
  );
}

function WelcomeCard() {
  return (
    <div style={{ ...cardBase, padding: '18px 20px', width: 272 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0, fontSize: 17,
          background: 'oklch(0.94 0.05 42)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} aria-hidden>🏺</span>
        <div>
          <p style={{ fontFamily: GILD_FONTS.display, fontSize: 15.5, fontWeight: 700, margin: 0 }}>Welcome to Clay Club</p>
          <p style={{ fontSize: 10.5, color: FAINT, margin: 0 }}>say hi in #introductions</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex' }}>
          {[mira, theo, reza, jordan].map((person, i) => (
            <span key={person.id} style={{ marginLeft: i === 0 ? 0 : -7, display: 'inline-flex', border: '2px solid #fff', borderRadius: '50%' }}>
              <Avatar person={person} size={22} />
            </span>
          ))}
        </div>
        <span style={{ fontSize: 11, color: FAINT, fontWeight: 600 }}>are already inside</span>
      </div>
    </div>
  );
}

function FeePill() {
  return (
    <div style={{
      ...cardBase, borderRadius: 999, padding: '8px 16px',
      display: 'inline-flex', alignItems: 'center', gap: 8, width: 'auto',
      background: 'oklch(0.95 0.05 150)', border: '1px solid oklch(0.85 0.08 150)',
    }}>
      <Check size={13} strokeWidth={3} color="oklch(0.38 0.12 150)" />
      <span style={{ fontSize: 11.5, fontWeight: 700, color: 'oklch(0.34 0.10 150)', whiteSpace: 'nowrap' }}>
        Creators keep 100%
      </span>
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

function CourseProgressCard() {
  return (
    <div style={{ ...cardBase, padding: '14px 16px', width: 212 }}>
      <p style={{ fontSize: 9.5, fontWeight: 700, margin: '0 0 9px', color: FAINT, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Wheel Throwing 101</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, background: 'oklch(0.95 0.05 150)', color: 'oklch(0.40 0.12 150)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={14} strokeWidth={3} />
        </span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, fontWeight: 700, margin: 0 }}>Module 02 unlocked</p>
          <div style={{ height: 6, borderRadius: 999, background: 'oklch(0.94 0.01 250)', marginTop: 5, overflow: 'hidden' }}>
            <span style={{ display: 'block', height: '100%', width: '66%', background: 'oklch(0.62 0.16 150)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PollCard() {
  const opts: [string, number][] = [['Raku', 62], ['Cone 6', 38]];
  return (
    <div style={{ ...cardBase, padding: '14px 16px', width: 202 }}>
      <p style={{ fontSize: 12, fontWeight: 700, margin: '0 0 10px' }}>Next firing — which glaze?</p>
      {opts.map(([label, pct]) => (
        <div key={label} style={{ marginBottom: 7 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, marginBottom: 3 }}>
            <span>{label}</span><span>{pct}%</span>
          </div>
          <div style={{ height: 7, borderRadius: 999, background: 'oklch(0.95 0.01 250)', overflow: 'hidden' }}>
            <span style={{ display: 'block', height: '100%', width: `${pct}%`, background: 'oklch(0.62 0.16 280)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CertBadge() {
  return (
    <div style={{ ...cardBase, padding: '11px 15px', width: 'auto', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 18 }} aria-hidden>🏆</span>
      <div>
        <p style={{ fontSize: 11.5, fontWeight: 700, margin: 0 }}>Certificate earned</p>
        <p style={{ fontSize: 9.5, color: FAINT, margin: 0 }}>Glazing 101 · verified</p>
      </div>
    </div>
  );
}

function TierMiniCard() {
  return (
    <div style={{ ...cardBase, padding: '13px 15px', width: 192 }}>
      <p style={{ fontSize: 9.5, fontWeight: 700, margin: '0 0 7px', color: FAINT, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Your tiers</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>🌱 Apprentice</span>
        <span style={{ fontFamily: GILD_FONTS.mono, fontWeight: 800, fontSize: 12.5 }}>$5</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0 0', borderTop: HAIRLINE }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'oklch(0.40 0.14 300)' }}>🏺 Master</span>
        <span style={{ fontFamily: GILD_FONTS.mono, fontWeight: 800, fontSize: 12.5 }}>$20</span>
      </div>
    </div>
  );
}

function ReactionBurst() {
  return (
    <div style={{ ...cardBase, borderRadius: 999, padding: '7px 14px', width: 'auto', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
      <span style={{ fontSize: 14 }} aria-hidden>🔥</span>
      <span style={{ fontSize: 12.5, fontWeight: 800, fontFamily: GILD_FONTS.mono }}>+31</span>
      <span style={{ fontSize: 11, color: FAINT, fontWeight: 600 }}>reacted</span>
    </div>
  );
}

// Sign-in only — an upcoming live event in the community.
function EventCard() {
  return (
    <div style={{ ...cardBase, padding: '12px 15px', width: 200, display: 'flex', gap: 12, alignItems: 'center' }}>
      <div style={{ textAlign: 'center', flexShrink: 0 }}>
        <p style={{ fontSize: 9, fontWeight: 700, color: 'oklch(0.50 0.16 25)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Thu</p>
        <p style={{ fontFamily: GILD_FONTS.display, fontSize: 21, fontWeight: 800, margin: 0, lineHeight: 1 }}>14</p>
      </div>
      <div style={{ borderLeft: HAIRLINE, paddingLeft: 12 }}>
        <p style={{ fontSize: 12, fontWeight: 700, margin: 0 }}>Live throwing workshop</p>
        <p style={{ fontSize: 10.5, color: FAINT, margin: '2px 0 0' }}>7:00 PM · 23 going</p>
      </div>
    </div>
  );
}

// Sign-up only — a creator milestone (the "what you'll build" mood).
function MilestoneCard() {
  return (
    <div style={{ ...cardBase, padding: '14px 16px', width: 208 }}>
      <p style={{ fontSize: 9.5, fontWeight: 700, margin: '0 0 9px', color: FAINT, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Milestone</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <span style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, fontSize: 15, background: 'oklch(0.95 0.05 42)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-hidden>🎉</span>
        <div>
          <p style={{ fontSize: 12.5, fontWeight: 700, margin: 0 }}>First $100 earned</p>
          <p style={{ fontSize: 10.5, color: FAINT, margin: 0 }}>3 members joined Master</p>
        </div>
      </div>
    </div>
  );
}

// Niche communities you could join — the new niches shown as real communities.
function DiscoverStack() {
  const rows: { emoji: string; name: string; niche: string; members: string; price: string; hue: number }[] = [
    { emoji: '🤖', name: 'Prompt Forge', niche: 'AI automations', members: '2,481', price: '$19', hue: 280 },
    { emoji: '💼', name: "Closer's Club", niche: 'Sales', members: '1,204', price: '$29', hue: 150 },
    { emoji: '🎨', name: 'The Life Studio', niche: 'Arts', members: '890', price: 'Free', hue: 42 },
  ];
  return (
    <div style={{ ...cardBase, padding: '13px 15px', width: 238 }}>
      <p style={{ fontSize: 9.5, fontWeight: 700, margin: '0 0 8px', color: FAINT, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        Communities to join
      </p>
      {rows.map((r, i) => (
        <div
          key={r.name}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0',
            borderTop: i === 0 ? 'none' : '1px solid oklch(0.96 0.005 250)',
          }}
        >
          <span style={{
            width: 30, height: 30, borderRadius: 9, flexShrink: 0, fontSize: 15,
            background: `oklch(0.95 0.05 ${r.hue})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }} aria-hidden>{r.emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{r.name}</p>
            <p style={{ fontSize: 10, color: FAINT, margin: 0 }}>{r.niche} · {r.members}</p>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 800, fontFamily: GILD_FONTS.mono, whiteSpace: 'nowrap',
            color: r.price === 'Free' ? 'oklch(0.50 0.02 250)' : 'oklch(0.40 0.12 150)',
          }}>{r.price === 'Free' ? 'Free' : `${r.price}/mo`}</span>
        </div>
      ))}
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

      {/* doodles — the niches sketched into the margins */}
      <DoodleStar style={{ top: '6%', left: '8%' }} size={22} color={DOODLE_COLORS.warm} />
      <DoodleSpark style={{ top: '13%', right: '10%' }} size={16} color={DOODLE_COLORS.green} />
      {variant === 'sign-in' ? (
        <>
          <DoodleGuitar style={{ top: '36%', left: '6%' }} size={34} color={DOODLE_COLORS.lilac} />
          <DoodleCamera style={{ bottom: '28%', right: '8%' }} size={30} color={DOODLE_COLORS.green} />
        </>
      ) : (
        <>
          <DoodlePot style={{ top: '38%', left: '7%' }} size={36} color={DOODLE_COLORS.warm} />
          <DoodleSprout style={{ bottom: '32%', right: '6%' }} size={28} color={DOODLE_COLORS.green} />
        </>
      )}
      <DoodleHeart style={{ bottom: '9%', right: '13%' }} size={20} color={DOODLE_COLORS.warm} />
      <DoodleScribbleLine style={{ bottom: '15%', left: '8%' }} w={64} color={DOODLE_COLORS.lilac} />

      {variant === 'sign-in' ? (
        <>
          <Float top="6%" left="6%" rotate={-3} delay={1.4}>
            <ReactionBurst />
          </Float>
          <Float top="11%" left="50%" rotate={-2} delay={0} z={3}>
            <div style={{ transform: 'translateX(-50%)' }}><PostCard /></div>
          </Float>
          <Float top="36%" right="6%" rotate={2.5} delay={1.2} z={2}>
            <PresenceCard />
          </Float>
          <Float top="40%" left="6%" rotate={-2} delay={0.5} z={2}>
            <EventCard />
          </Float>
          <Float bottom="29%" right="7%" rotate={2} delay={2.4} z={2}>
            <CourseProgressCard />
          </Float>
          <Float bottom="27%" left="7%" rotate={1.5} delay={1.8} z={2}>
            <RevenueCard />
          </Float>
          <Float bottom="9%" left="50%" rotate={-1.5} delay={0.9} z={3}>
            <div style={{ transform: 'translateX(-50%)' }}><DMCard /></div>
          </Float>
          <p style={{
            position: 'absolute', bottom: '2.5%', left: '50%', transform: 'translateX(-50%) rotate(-2deg)',
            fontFamily: 'var(--font-gochi), cursive', fontSize: 19, color: DOODLE_COLORS.ink,
            margin: 0, whiteSpace: 'nowrap', zIndex: 4,
          }}>
            right where you left it
          </p>
        </>
      ) : (
        <>
          <Float top="11%" left="50%" rotate={1.2} delay={0} z={3}>
            <div style={{ transform: 'translateX(-50%)' }}><WelcomeCard /></div>
          </Float>
          <Float top="7%" left="5%" rotate={-2.5} delay={1.6} z={2}>
            <DiscoverStack />
          </Float>
          <Float top="35%" right="6%" rotate={2} delay={0.9} z={2}>
            <TierMiniCard />
          </Float>
          <Float top="39%" left="6%" rotate={-2} delay={2.0} z={2}>
            <MilestoneCard />
          </Float>
          <Float bottom="30%" right="7%" rotate={1.5} delay={1.2} z={2}>
            <PollCard />
          </Float>
          <Float bottom="31%" left="8%" rotate={-1.5} delay={2.6}>
            <CertBadge />
          </Float>
          <Float bottom="20%" left="20%" rotate={1.5} delay={3.1}>
            <JoinToast person={mira} label="Mira just joined ✨" />
          </Float>
          <Float bottom="9%" left="9%" rotate={-1} delay={2.2}>
            <JoinToast person={reza} label="Reza shipped their first course 🎉" />
          </Float>
          <Float bottom="8%" right="13%" rotate={-1} delay={1.0}>
            <FeePill />
          </Float>
          <p style={{
            position: 'absolute', bottom: '3%', left: '50%', transform: 'translateX(-50%) rotate(-2deg)',
            fontFamily: 'var(--font-gochi), cursive', fontSize: 19, color: DOODLE_COLORS.ink,
            margin: 0, whiteSpace: 'nowrap',
          }}>
            your corner of the internet
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
