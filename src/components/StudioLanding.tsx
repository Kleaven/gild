'use client';

import React from 'react';
import Link from 'next/link';
import {
  Wordmark,
  Avatar,
  Reactions,
  GILD_FONTS,
  DoodleStar,
  DoodleSpark,
  DoodleHeart,
  DoodlePot,
  DoodleGuitar,
  DoodleCamera,
  DoodleSprout,
  DoodleDumbbell,
  DOODLE_COLORS,
} from '@/components/gild';
import type { Person } from '@/components/gild';
import { Check, Lock, ArrowRight, Sparkles } from 'lucide-react';

// ─── Shared bits ─────────────────────────────────────────────────────────────

const INK = 'oklch(0.20 0.02 250)';
const MUTED = 'oklch(0.45 0.02 250)';
const FAINT = 'oklch(0.55 0.02 250)';
const HAIRLINE = '1px solid oklch(0.93 0.005 250)';

// Everything listed here exists in the product today. Never list vapor.
const MARQUEE_FEATURES = [
  'Spaces & feeds',
  'Realtime presence',
  'Courses',
  'Sequential unlock',
  'Quizzes',
  'Certificates',
  'Membership tiers',
  'Module paywalls',
  'Direct Stripe payouts',
  '0% transaction fees',
  'Member DMs',
  'Polls & reactions',
  'Roles & moderation',
  'Invite links',
];

function CTAButton({ href, children, big = false }: { href: string; children: React.ReactNode; big?: boolean }) {
  return (
    <Link
      href={href}
      className="gild-cta"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: big ? '17px 34px' : '12px 22px',
        borderRadius: 14,
        fontWeight: 700,
        fontSize: big ? 18 : 15,
        background: INK,
        color: '#fff',
        textDecoration: 'none',
        boxShadow: '0 18px 36px -12px oklch(0.20 0.02 250 / 0.35)',
        fontFamily: 'inherit',
      }}
    >
      {children}
      <ArrowRight size={big ? 19 : 16} />
    </Link>
  );
}

function GhostButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="gild-ghost"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '17px 28px',
        borderRadius: 14,
        fontWeight: 600,
        fontSize: 17,
        background: 'transparent',
        border: '1px solid oklch(0.88 0.01 250)',
        color: INK,
        textDecoration: 'none',
      }}
    >
      {children}
    </a>
  );
}

function SectionKicker({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: FAINT,
      fontFamily: GILD_FONTS.mono,
      margin: '0 0 14px',
    }}>
      {children}
    </p>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function StudioLanding() {
  // Scroll-reveal: one observer flips .in on every [data-reveal] element.
  React.useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('in'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const mockSpaces = [
    { id: 'announcements', name: 'Announcements', hue: 42 },
    { id: 'general', name: 'General', hue: 220 },
    { id: 'introductions', name: 'Introductions', hue: 14 },
    { id: 'building', name: 'Building', hue: 280 },
  ];

  const mockUser: Person = {
    id: 'jordan', name: 'Jordan Lee', role: 'owner', hue: 42, online: true, initial: 'JL',
  };

  const mockOnline: Person[] = [
    { id: 'mira', name: 'Mira Patel', hue: 280, online: true, initial: 'MP', role: 'free_member' },
    { id: 'sasha', name: 'Sasha Wu', hue: 150, online: true, initial: 'SW', role: 'free_member' },
    { id: 'reza', name: 'Reza Khan', hue: 200, online: true, initial: 'RK', role: 'free_member' },
  ];

  return (
    <div style={{
      fontFamily: GILD_FONTS.sans,
      background: '#fff',
      minHeight: '100vh',
      color: '#202020',
      position: 'relative',
      overflowX: 'clip',
    }}>
      {/* ── Sticky nav ──────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '13px clamp(20px, 4vw, 32px)',
        borderBottom: HAIRLINE,
        background: 'oklch(1 0 0 / 0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        <Link href="/" aria-label="Gild home" style={{ display: 'flex', textDecoration: 'none', color: 'inherit' }}>
          <Wordmark size={22} />
        </Link>
        <nav className="gild-nav-links" aria-label="Page sections" style={{ display: 'flex', gap: 26, fontSize: 13.5, fontWeight: 500 }}>
          <a href="#product" style={{ color: MUTED, textDecoration: 'none' }}>Product</a>
          <a href="#how" style={{ color: MUTED, textDecoration: 'none' }}>How it works</a>
          <a href="#pricing" style={{ color: MUTED, textDecoration: 'none' }}>Pricing</a>
        </nav>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 13.5 }}>
          <Link href="/sign-in" style={{ color: 'oklch(0.30 0.02 250)', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
          <Link href="/sign-up" className="gild-cta" style={{
            padding: '8px 16px',
            borderRadius: 10,
            background: INK,
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 600,
          }}>Start free</Link>
        </div>
      </header>

      {/* ambient accents + the niches themselves, sketched in the margins */}
      <DoodleStar style={{ top: 150, left: '6%' }} size={24} color={DOODLE_COLORS.warm} />
      <DoodleSpark style={{ top: 210, right: '8%' }} size={18} color={DOODLE_COLORS.green} />
      <DoodlePot style={{ top: 320, left: '5%' }} size={38} color={DOODLE_COLORS.warm} />
      <DoodleGuitar style={{ top: 470, left: '9%' }} size={34} color={DOODLE_COLORS.lilac} />
      <DoodleCamera style={{ top: 330, right: '6%' }} size={34} color={DOODLE_COLORS.green} />
      <DoodleSprout style={{ top: 480, right: '10%' }} size={30} color={DOODLE_COLORS.warm} />
      <DoodleDumbbell style={{ top: 600, left: '4%' }} size={34} color={DOODLE_COLORS.green} />

      <main>
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section style={{
          maxWidth: 1080,
          margin: '0 auto',
          padding: 'clamp(56px, 9vw, 96px) clamp(20px, 4vw, 28px) 24px',
          textAlign: 'center',
          position: 'relative',
        }}>
          <span className="gild-rise" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 13px',
            borderRadius: 999,
            marginBottom: 28,
            background: 'oklch(0.97 0.005 250)',
            border: HAIRLINE,
            fontSize: 12.5,
            fontWeight: 500,
            color: 'oklch(0.32 0.02 250)',
          }}>
            <Sparkles size={13} color="oklch(0.55 0.15 75)" />
            Where the internet’s best niches live
          </span>

          <h1 className="gild-rise gild-d1" style={{
            fontFamily: GILD_FONTS.display,
            fontSize: 'clamp(46px, 8vw, 86px)',
            lineHeight: 1.02,
            fontWeight: 600,
            margin: '0 auto 22px',
            letterSpacing: '-0.025em',
            ...({ textWrap: 'balance' } as React.CSSProperties),
            maxWidth: 880,
          }}>
            Find your people.
            <br />
            <em style={{ fontStyle: 'italic', fontWeight: 500 }}>Fund their work.</em>
          </h1>

          <p className="gild-rise gild-d2" style={{
            fontSize: 'clamp(16px, 2vw, 19px)',
            lineHeight: 1.6,
            color: 'oklch(0.42 0.02 250)',
            margin: '0 auto 34px',
            maxWidth: 560,
          }}>
            Gild is home to small, expert-led communities — spaces, courses, and
            real conversation. Creators keep <strong style={{ color: INK }}>100% of what members pay</strong>.
          </p>

          <div className="gild-rise gild-d3" style={{
            display: 'flex',
            gap: 14,
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: 18,
          }}>
            <CTAButton href="/sign-up" big>Find your community</CTAButton>
            <GhostButton href="#how">I’m a creator</GhostButton>
          </div>

          <p className="gild-rise gild-d3" style={{ fontSize: 13, color: FAINT, margin: '0 0 34px' }}>
            Free to join as a member · creators keep 100% · 14-day creator trial
          </p>

          {/* Niche strip — the people, not the plumbing */}
          <div className="gild-rise gild-d3" style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 8,
            margin: '0 auto 56px',
            maxWidth: 720,
          }}>
            {['🏺 Ceramics', '💻 Indie hackers', '🎸 Guitar', '📈 Trading', '🧶 Fiber arts', '🏋️ Strength', '🎬 Filmmaking', '🌱 Permaculture'].map((n) => (
              <span key={n} style={{
                padding: '6px 13px',
                borderRadius: 999,
                border: HAIRLINE,
                background: '#fff',
                fontSize: 13,
                fontWeight: 600,
                color: 'oklch(0.35 0.02 250)',
              }}>
                {n}
              </span>
            ))}
          </div>

          {/* ── Product canvas ─────────────────────────────────────────── */}
          <div className="gild-rise gild-d4" style={{
            maxWidth: 980,
            margin: '0 auto',
            background: 'oklch(0.985 0.003 250)',
            borderRadius: 18,
            border: HAIRLINE,
            padding: 14,
            boxShadow: '0 40px 80px -36px oklch(0.30 0.04 250 / 0.32)',
            position: 'relative',
          }}>
            <DoodleStar style={{ top: -22, left: -28 }} size={26} color={DOODLE_COLORS.lilac} />
            <DoodleHeart style={{ bottom: -16, left: -20 }} size={20} color={DOODLE_COLORS.warm} />
            <DoodleStar style={{ top: -20, right: -22 }} size={22} color={DOODLE_COLORS.green} />

            <div className="gild-hero-canvas" style={{
              display: 'grid',
              gridTemplateColumns: '180px 1fr 200px',
              gap: 14,
              textAlign: 'left',
            }}>
              {/* sidebar peek */}
              <div className="gild-hero-rail" style={{
                background: '#fff', borderRadius: 10, padding: '14px 12px', border: HAIRLINE,
              }}>
                <p style={{ fontSize: 10, fontWeight: 600, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em', color: FAINT }}>Spaces</p>
                {mockSpaces.map((s, i) => (
                  <div key={s.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '5px 6px',
                    borderRadius: 6, fontSize: 12,
                    background: i === 0 ? 'oklch(0.96 0.005 250)' : 'transparent',
                    fontWeight: i === 0 ? 600 : 400,
                    color: 'oklch(0.30 0.02 250)',
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: 2, background: `oklch(0.62 0.16 ${s.hue})` }} />
                    {s.name}
                  </div>
                ))}
                <p style={{ fontSize: 10, fontWeight: 600, margin: '12px 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em', color: FAINT }}>Library</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 6px', fontSize: 12, color: 'oklch(0.30 0.02 250)' }}>
                  <span style={{ width: 7, height: 7, borderRadius: 2, background: 'oklch(0.62 0.16 150)' }} />
                  Courses
                </div>
              </div>

              {/* content peek */}
              <div style={{ background: '#fff', borderRadius: 10, padding: '16px 18px', border: HAIRLINE }}>
                <div style={{ paddingBottom: 12, borderBottom: '1px solid oklch(0.95 0.005 250)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Avatar person={mockUser} size={22} presence />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{mockUser.name}</span>
                    <span style={{
                      padding: '1px 8px', borderRadius: 999, fontSize: 10, fontWeight: 600,
                      background: 'oklch(0.96 0.02 42)', color: 'oklch(0.36 0.10 42)',
                    }}>Kiln Room</span>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>Moon jar tutorial is LIVE 🏺</p>
                  <p style={{ fontSize: 12, color: 'oklch(0.40 0.02 250)', margin: '0 0 8px', lineHeight: 1.45 }}>
                    Full cone-6 glaze recipe + the throwing timelapse from my last firing. Who’s making one with me this weekend?!
                  </p>
                  <Reactions items={[['🔥', 31], ['🏺', 18]]} hue={42} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                      background: 'oklch(0.95 0.05 150)', color: 'oklch(0.40 0.12 150)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Check size={14} strokeWidth={3} />
                    </span>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>Module 01 complete</p>
                      <p style={{ fontSize: 10.5, color: FAINT, margin: 0 }}>Module 02 unlocked</p>
                    </div>
                  </div>
                  <span style={{
                    padding: '3px 9px', borderRadius: 999, fontSize: 10.5, fontWeight: 700,
                    background: 'oklch(0.95 0.05 150)', color: 'oklch(0.40 0.12 150)',
                  }}>Passed · 92%</span>
                </div>
              </div>

              {/* right rail peek */}
              <div className="gild-hero-rail" style={{ background: '#fff', borderRadius: 10, padding: '14px 12px', border: HAIRLINE }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <span className="gild-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'oklch(0.62 0.18 150)' }} />
                  <p style={{ fontSize: 10, fontWeight: 700, margin: 0, color: 'oklch(0.42 0.14 150)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Live now</p>
                </div>
                {mockOnline.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                    <Avatar person={p} size={20} presence />
                    <span style={{ fontSize: 12, color: 'oklch(0.30 0.02 250)' }}>{p.name.split(' ')[0]}</span>
                  </div>
                ))}
                <div style={{
                  marginTop: 10, paddingTop: 10, borderTop: '1px solid oklch(0.95 0.005 250)',
                }}>
                  <p style={{ fontSize: 10, fontWeight: 700, margin: '0 0 6px', color: FAINT, textTransform: 'uppercase', letterSpacing: '0.06em' }}>This month</p>
                  <p style={{ fontSize: 16, fontWeight: 800, margin: 0, fontFamily: GILD_FONTS.mono }}>$1,284</p>
                  <p style={{ fontSize: 10.5, color: 'oklch(0.42 0.14 150)', fontWeight: 600, margin: 0 }}>Yours. Gild takes $0.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Marquee strip ────────────────────────────────────────────── */}
        <section aria-hidden style={{
          borderTop: HAIRLINE,
          borderBottom: HAIRLINE,
          margin: '64px 0 0',
          padding: '14px 0',
          overflow: 'hidden',
          background: 'oklch(0.99 0.002 250)',
        }}>
          <div className="gild-marquee">
            {[0, 1].map((dup) => (
              <div key={dup} className="gild-marquee-track" aria-hidden={dup === 1}>
                {MARQUEE_FEATURES.map((f) => (
                  <span key={`${dup}-${f}`} style={{
                    fontFamily: GILD_FONTS.mono,
                    fontSize: 12.5,
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: FAINT,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 28,
                    paddingRight: 28,
                  }}>
                    {f}
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'oklch(0.80 0.06 75)', display: 'inline-block' }} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────────────── */}
        <section id="how" style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(72px, 10vw, 120px) clamp(20px, 4vw, 28px) 0' }}>
          <div data-reveal className="gild-reveal" style={{ textAlign: 'center', marginBottom: 'clamp(40px, 6vw, 64px)' }}>
            <SectionKicker>How it works</SectionKicker>
            <h2 style={{
              fontFamily: GILD_FONTS.display,
              fontSize: 'clamp(30px, 4.6vw, 46px)',
              fontWeight: 800,
              letterSpacing: '-0.035em',
              margin: '0 0 14px',
              lineHeight: 1.05,
            }}>
              From idea to income, in an afternoon.
            </h2>
            <p style={{ fontSize: 17, color: MUTED, margin: '0 auto', maxWidth: 520, lineHeight: 1.55 }}>
              Three steps. No code, no plugins, no platform tax.
            </p>
          </div>

          <div className="gild-3col" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              {
                n: '01',
                title: 'Shape your space',
                body: 'Spin up a community with spaces for announcements, discussion, and everything in between. Realtime feed, polls, reactions, presence.',
                visual: (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {['Announcements', 'General', 'Wins'].map((s, i) => (
                      <div key={s} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                        borderRadius: 8, background: i === 0 ? 'oklch(0.96 0.005 250)' : '#fff',
                        border: HAIRLINE, fontSize: 12.5, fontWeight: i === 0 ? 600 : 400,
                      }}>
                        <span style={{ width: 7, height: 7, borderRadius: 2, background: `oklch(0.62 0.16 ${[42, 220, 150][i]})` }} />
                        {s}
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                n: '02',
                title: 'Teach what you know',
                body: 'Build courses with modules, lessons, and quizzes. Modules unlock in sequence — learners pass a quiz to move on, and celebrate when they do.',
                visual: (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, border: HAIRLINE, background: '#fff', fontSize: 12.5 }}>
                      <Check size={13} color="oklch(0.50 0.14 150)" strokeWidth={3} /> Module 01 · Foundations
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, border: '1px solid oklch(0.86 0.04 250)', background: '#fff', fontSize: 12.5, fontWeight: 600 }}>
                      <span style={{ width: 13, textAlign: 'center', color: 'oklch(0.50 0.10 250)' }}>▸</span> Module 02 · In progress
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, border: HAIRLINE, background: 'oklch(0.985 0.003 250)', fontSize: 12.5, color: FAINT }}>
                      <Lock size={12} /> Module 03 · Finish 02 first
                    </div>
                  </div>
                ),
              },
              {
                n: '03',
                title: 'Get paid. Keep 100%.',
                body: 'Name your own membership tiers, paywall premium modules, and connect Stripe. Members pay you directly — Gild never touches a cent.',
                visual: (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 8, border: HAIRLINE, background: '#fff', fontSize: 12.5 }}>
                      <span>Supporter</span><span style={{ fontFamily: GILD_FONTS.mono, fontWeight: 700 }}>$9/mo</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 8, border: '1px solid oklch(0.82 0.08 300)', background: 'oklch(0.985 0.01 300)', fontSize: 12.5, fontWeight: 600 }}>
                      <span>Insider</span><span style={{ fontFamily: GILD_FONTS.mono, fontWeight: 700 }}>$29/mo</span>
                    </div>
                    <div style={{ textAlign: 'center', padding: '6px 10px', borderRadius: 8, background: 'oklch(0.95 0.05 150)', color: 'oklch(0.36 0.12 150)', fontSize: 11.5, fontWeight: 700 }}>
                      Platform fee: $0.00
                    </div>
                  </div>
                ),
              },
            ].map((step, i) => (
              <article key={step.n} data-reveal className={`gild-reveal gild-rd${i}`} style={{
                border: HAIRLINE,
                borderRadius: 18,
                padding: 'clamp(20px, 2.6vw, 28px)',
                background: '#fff',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}>
                <span style={{ fontFamily: GILD_FONTS.mono, fontSize: 13, fontWeight: 700, color: 'oklch(0.60 0.10 75)' }}>{step.n}</span>
                <div style={{ minHeight: 118 }}>{step.visual}</div>
                <div>
                  <h3 style={{ fontFamily: GILD_FONTS.display, fontSize: 21, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 8px' }}>{step.title}</h3>
                  <p style={{ fontSize: 14.5, lineHeight: 1.6, color: MUTED, margin: 0 }}>{step.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ── Feature bento ────────────────────────────────────────────── */}
        <section id="product" style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(72px, 10vw, 120px) clamp(20px, 4vw, 28px) 0' }}>
          <div data-reveal className="gild-reveal" style={{ textAlign: 'center', marginBottom: 'clamp(40px, 6vw, 64px)' }}>
            <SectionKicker>Everything included</SectionKicker>
            <h2 style={{
              fontFamily: GILD_FONTS.display,
              fontSize: 'clamp(30px, 4.6vw, 46px)',
              fontWeight: 800,
              letterSpacing: '-0.035em',
              margin: '0 0 14px',
              lineHeight: 1.05,
              position: 'relative',
              display: 'inline-block',
            }}>
              One roof. The whole craft.
              <DoodleSpark style={{ top: -14, right: -30 }} size={20} color={DOODLE_COLORS.warm} />
            </h2>
            <p style={{ fontSize: 17, color: MUTED, margin: '0 auto', maxWidth: 540, lineHeight: 1.55 }}>
              No bolted-on course plugin, no third-party paywall. It’s all native, on every plan.
            </p>
          </div>

          <div className="gild-bento" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
            {[
              { emoji: '⚡', title: 'Realtime feed & presence', body: 'Posts, polls, and reactions that land live — see who’s online right now.' },
              { emoji: '🎓', title: 'Courses that pace themselves', body: 'Sequential module unlock keeps learners moving in order, never lost.' },
              { emoji: '🏆', title: 'Quizzes & certificates', body: 'Pass to progress. Finishers earn shareable, verifiable certificates.' },
              { emoji: '👑', title: 'Tiers you name yourself', body: '“Wise Elf”, “Inner Circle” — your niche, your words. Paywall any module by tier.' },
              { emoji: '💬', title: 'Member DMs & chat', body: 'Direct messages between members, scoped to your community.' },
              { emoji: '🛡️', title: 'Roles & moderation', body: 'Owners, admins, moderators, invite links, reports — control without chaos.' },
            ].map((f, i) => (
              <article key={f.title} data-reveal className={`gild-reveal gild-card gild-rd${i % 3}`} style={{
                border: HAIRLINE,
                borderRadius: 16,
                padding: '24px 22px',
                background: '#fff',
              }}>
                <span aria-hidden style={{ fontSize: 24, display: 'block', marginBottom: 14 }}>{f.emoji}</span>
                <h3 style={{ fontSize: 16.5, fontWeight: 700, letterSpacing: '-0.015em', margin: '0 0 7px' }}>{f.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: MUTED, margin: 0 }}>{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── Deep dive: monetization ──────────────────────────────────── */}
        <section style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(72px, 10vw, 120px) clamp(20px, 4vw, 28px) 0' }}>
          <div className="gild-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(32px, 5vw, 64px)', alignItems: 'center' }}>
            <div data-reveal className="gild-reveal">
              <SectionKicker>Own your revenue</SectionKicker>
              <h2 style={{
                fontFamily: GILD_FONTS.display,
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                margin: '0 0 16px',
                lineHeight: 1.08,
              }}>
                0% isn’t a promo.<br />It’s the architecture.
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.65, color: MUTED, margin: '0 0 22px' }}>
                Member payments run on Stripe Connect — charged directly on <em>your</em> Stripe
                account, not ours. There is no platform cut to waive, because the money never
                passes through Gild at all.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 26px', display: 'flex', flexDirection: 'column', gap: 11 }}>
                {[
                  'Direct payouts to your own Stripe account',
                  'Monthly tiers with upgrades, downgrades & proration',
                  'Members manage or cancel themselves — no support tickets',
                ].map((li) => (
                  <li key={li} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14.5, color: 'oklch(0.32 0.02 250)' }}>
                    <span style={{
                      width: 19, height: 19, borderRadius: 6, flexShrink: 0, marginTop: 1,
                      background: 'oklch(0.95 0.05 150)', color: 'oklch(0.40 0.12 150)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}><Check size={12} strokeWidth={3} /></span>
                    {li}
                  </li>
                ))}
              </ul>
              <CTAButton href="/sign-up">Start earning</CTAButton>
            </div>

            <div data-reveal className="gild-reveal gild-rd1" style={{ position: 'relative' }}>
              <DoodleStar style={{ top: -24, right: 8 }} size={24} color={DOODLE_COLORS.warm} />
              <div style={{
                border: HAIRLINE, borderRadius: 18, background: 'oklch(0.985 0.003 250)', padding: 18,
                display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                {[
                  { name: 'Little Elf', price: 5, note: 'Community + free courses' },
                  { name: 'Wise Elf', price: 15, note: 'Everything + premium modules', hot: true },
                  { name: 'Elder Elf', price: 40, note: 'All access + group calls' },
                ].map((t, i) => (
                  <div key={t.name} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
                    borderRadius: 12, background: '#fff',
                    border: t.hot ? '1.5px solid oklch(0.55 0.16 300)' : HAIRLINE,
                    boxShadow: t.hot ? '0 10px 24px -12px oklch(0.55 0.16 300 / 0.35)' : 'none',
                  }}>
                    <span style={{
                      width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                      background: `oklch(0.95 0.04 ${[75, 300, 250][i]})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                    }} aria-hidden>{['🌱', '🧙', '✨'][i]}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{t.name}</p>
                      <p style={{ fontSize: 11.5, color: FAINT, margin: 0 }}>{t.note}</p>
                    </div>
                    <span style={{ fontFamily: GILD_FONTS.mono, fontWeight: 800, fontSize: 15 }}>
                      ${t.price}<span style={{ fontSize: 11, fontWeight: 500, color: FAINT }}>/mo</span>
                    </span>
                  </div>
                ))}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderRadius: 12,
                  background: 'oklch(0.95 0.05 150)', color: 'oklch(0.32 0.10 150)',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Gild’s cut of every payment</span>
                  <span style={{ fontFamily: GILD_FONTS.mono, fontWeight: 800, fontSize: 16 }}>$0.00</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Deep dive: courses ───────────────────────────────────────── */}
        <section style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(72px, 10vw, 120px) clamp(20px, 4vw, 28px) 0' }}>
          <div className="gild-split gild-split-flip" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(32px, 5vw, 64px)', alignItems: 'center' }}>
            <div data-reveal className="gild-reveal" style={{ position: 'relative' }}>
              <DoodleHeart style={{ top: -20, left: -8 }} size={22} color={DOODLE_COLORS.warm} />
              <div style={{
                border: HAIRLINE, borderRadius: 18, background: 'oklch(0.985 0.003 250)', padding: 18,
                display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 12, background: '#fff', border: HAIRLINE }}>
                  <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'oklch(0.62 0.16 150)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Module 01 · Foundations</p>
                    <p style={{ fontSize: 11.5, color: FAINT, margin: 0 }}>5 of 5 lessons · quiz passed</p>
                  </div>
                  <span style={{ padding: '3px 9px', borderRadius: 999, fontSize: 10.5, fontWeight: 700, background: 'oklch(0.95 0.05 150)', color: 'oklch(0.40 0.12 150)' }}>92%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 12, background: '#fff', border: '1.5px solid oklch(0.55 0.10 250)' }}>
                  <span style={{ width: 26, height: 26, borderRadius: '50%', border: '2px solid oklch(0.55 0.10 250)', color: 'oklch(0.45 0.10 250)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                    3/5
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Module 02 · The craft</p>
                    <p style={{ fontSize: 11.5, color: FAINT, margin: 0 }}>In progress — keep going</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 12, background: 'oklch(0.99 0.002 250)', border: HAIRLINE, color: FAINT }}>
                  <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'oklch(0.95 0.01 250)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Lock size={13} />
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'oklch(0.40 0.02 250)' }}>Module 03 · Going pro</p>
                    <p style={{ fontSize: 11.5, margin: 0 }}>Included with the Wise Elf tier</p>
                  </div>
                  <span style={{ padding: '4px 11px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: 'oklch(0.52 0.16 300)', color: '#fff', whiteSpace: 'nowrap' }}>Upgrade</span>
                </div>
                <div style={{
                  textAlign: 'center', padding: '11px 16px', borderRadius: 12,
                  background: 'linear-gradient(135deg, oklch(0.95 0.06 150), oklch(0.97 0.03 200))',
                  border: '1px solid oklch(0.85 0.08 150)',
                  fontSize: 13, fontWeight: 800, color: 'oklch(0.32 0.10 150)',
                  fontFamily: GILD_FONTS.display,
                }}>
                  Course complete! 🎉
                </div>
              </div>
            </div>

            <div data-reveal className="gild-reveal gild-rd1">
              <SectionKicker>Courses & quizzes</SectionKicker>
              <h2 style={{
                fontFamily: GILD_FONTS.display,
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                margin: '0 0 16px',
                lineHeight: 1.08,
              }}>
                Teaching that feels<br />like a game, not a PDF.
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.65, color: MUTED, margin: '0 0 22px' }}>
                Modules unlock in order, quizzes gate progression, and every pass is celebrated.
                Lock your most valuable modules behind a tier and the upgrade is one click away —
                right where the curiosity peaks.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 26px', display: 'flex', flexDirection: 'column', gap: 11 }}>
                {[
                  'Drag-and-drop curriculum with instant (optimistic) editing',
                  'Multiple-choice quizzes with pass scores you set',
                  'Certificates with public verification links',
                ].map((li) => (
                  <li key={li} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14.5, color: 'oklch(0.32 0.02 250)' }}>
                    <span style={{
                      width: 19, height: 19, borderRadius: 6, flexShrink: 0, marginTop: 1,
                      background: 'oklch(0.95 0.05 150)', color: 'oklch(0.40 0.12 150)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}><Check size={12} strokeWidth={3} /></span>
                    {li}
                  </li>
                ))}
              </ul>
              <CTAButton href="/sign-up">Build your first course</CTAButton>
            </div>
          </div>
        </section>

        {/* ── Pricing ──────────────────────────────────────────────────── */}
        <section id="pricing" style={{ maxWidth: 920, margin: '0 auto', padding: 'clamp(72px, 10vw, 120px) clamp(20px, 4vw, 28px) 0' }}>
          <div data-reveal className="gild-reveal" style={{ textAlign: 'center', marginBottom: 'clamp(36px, 5vw, 56px)' }}>
            <SectionKicker>Pricing</SectionKicker>
            <h2 style={{
              fontFamily: GILD_FONTS.display,
              fontSize: 'clamp(30px, 4.6vw, 46px)',
              fontWeight: 800,
              letterSpacing: '-0.035em',
              margin: '0 0 14px',
              lineHeight: 1.05,
            }}>
              One flat fee. Zero take rate.
            </h2>
            <p style={{ fontSize: 17, color: MUTED, margin: '0 auto', maxWidth: 480, lineHeight: 1.55 }}>
              Every feature on every plan. The only difference is how big you grow.
            </p>
          </div>

          <div className="gild-pricing" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'stretch' }}>
            {[
              {
                name: 'Hobby',
                price: 29,
                blurb: 'For communities finding their footing.',
                features: ['Up to 100 members', 'Unlimited spaces & courses', 'Membership tiers — 0% fees', 'Custom logo & theme'],
                hot: false,
              },
              {
                name: 'Pro',
                price: 59,
                blurb: 'For communities ready to scale.',
                features: ['Unlimited members', 'Unlimited spaces & courses', 'Membership tiers — 0% fees', 'Custom logo & theme', 'Priority support'],
                hot: true,
              },
            ].map((plan, i) => (
              <article key={plan.name} data-reveal className={`gild-reveal gild-card gild-rd${i}`} style={{
                border: plan.hot ? `1.5px solid ${INK}` : HAIRLINE,
                borderRadius: 20,
                padding: 'clamp(24px, 3vw, 32px)',
                background: '#fff',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: plan.hot ? '0 28px 56px -28px oklch(0.20 0.02 250 / 0.35)' : 'none',
              }}>
                {plan.hot && (
                  <span style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    padding: '4px 14px', borderRadius: 999, background: INK, color: '#fff',
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}>Most popular</span>
                )}
                <h3 style={{ fontFamily: GILD_FONTS.display, fontSize: 22, fontWeight: 800, margin: '0 0 4px' }}>{plan.name}</h3>
                <p style={{ fontSize: 13.5, color: FAINT, margin: '0 0 18px' }}>{plan.blurb}</p>
                <p style={{ margin: '0 0 20px' }}>
                  <span style={{ fontFamily: GILD_FONTS.display, fontSize: 46, fontWeight: 800, letterSpacing: '-0.03em' }}>${plan.price}</span>
                  <span style={{ fontSize: 14, color: FAINT, fontWeight: 500 }}> /month</span>
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 26px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14.5, color: 'oklch(0.30 0.02 250)' }}>
                      <Check size={15} color="oklch(0.50 0.14 150)" strokeWidth={3} style={{ flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/sign-up" className="gild-cta" style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '13px 20px',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: 'none',
                  background: plan.hot ? INK : 'transparent',
                  color: plan.hot ? '#fff' : INK,
                  border: plan.hot ? 'none' : '1px solid oklch(0.86 0.01 250)',
                }}>
                  Start 14-day free trial
                </Link>
              </article>
            ))}
          </div>
          <p data-reveal className="gild-reveal" style={{ textAlign: 'center', fontSize: 13, color: FAINT, marginTop: 22 }}>
            Members never pay Gild anything. Cancel your trial in one click.
          </p>
        </section>

        {/* ── Final CTA ────────────────────────────────────────────────── */}
        <section style={{
          maxWidth: 1080,
          margin: 'clamp(72px, 10vw, 120px) auto 0',
          padding: '0 clamp(20px, 4vw, 28px) clamp(72px, 9vw, 110px)',
        }}>
          <div data-reveal className="gild-reveal" style={{
            position: 'relative',
            textAlign: 'center',
            borderRadius: 28,
            padding: 'clamp(48px, 7vw, 84px) clamp(24px, 5vw, 60px)',
            background: INK,
            color: '#fff',
            overflow: 'hidden',
          }}>
            <DoodleStar style={{ top: 26, left: '8%' }} size={26} color="oklch(0.80 0.10 75)" />
            <DoodleSpark style={{ bottom: 30, right: '9%' }} size={22} color="oklch(0.78 0.10 150)" />
            <h2 style={{
              fontFamily: GILD_FONTS.display,
              fontSize: 'clamp(32px, 5.4vw, 56px)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1.02,
              margin: '0 auto 16px',
              maxWidth: 700,
              ...({ textWrap: 'balance' } as React.CSSProperties),
            }}>
              Your people are waiting.
            </h2>
            <p style={{ fontSize: 17, color: 'oklch(0.80 0.01 250)', margin: '0 auto 30px', maxWidth: 460, lineHeight: 1.55 }}>
              Start free, build your space, and keep every dollar your community pays you.
            </p>
            <Link href="/sign-up" className="gild-cta" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '17px 36px',
              borderRadius: 14,
              fontWeight: 700,
              fontSize: 18,
              background: '#fff',
              color: INK,
              textDecoration: 'none',
            }}>
              Start your community <ArrowRight size={19} />
            </Link>
            <p style={{ fontSize: 12.5, color: 'oklch(0.65 0.01 250)', margin: '18px 0 0' }}>
              14-day free trial · 0% transaction fees · cancel anytime
            </p>
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: HAIRLINE,
        padding: '28px clamp(20px, 4vw, 32px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Wordmark size={18} />
          <span style={{ fontSize: 12.5, color: FAINT }}>© {new Date().getFullYear()} Gild. The home for paid communities.</span>
        </div>
        <nav aria-label="Legal" style={{ display: 'flex', gap: 20, fontSize: 13 }}>
          <Link href="/terms" style={{ color: FAINT, textDecoration: 'none' }}>Terms</Link>
          <Link href="/privacy" style={{ color: FAINT, textDecoration: 'none' }}>Privacy</Link>
          <Link href="/sign-in" style={{ color: FAINT, textDecoration: 'none' }}>Sign in</Link>
        </nav>
      </footer>

      {/* ── Motion & responsive rules ────────────────────────────────── */}
      <style>{`
        html { scroll-behavior: smooth; }

        .gild-cta, .gild-ghost { transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.18s ease, background 0.18s ease; }
        .gild-cta:hover { transform: translateY(-2px); }
        .gild-cta:active { transform: translateY(0); }
        .gild-ghost:hover { transform: translateY(-2px); background: oklch(0.98 0.003 250); }

        .gild-card { transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s ease, border-color 0.2s ease; }
        .gild-card:hover { transform: translateY(-4px); box-shadow: 0 18px 36px -20px oklch(0.30 0.04 250 / 0.35); border-color: oklch(0.86 0.01 250); }

        .gild-marquee { display: flex; width: max-content; }
        .gild-marquee-track { display: flex; align-items: center; }

        @media (prefers-reduced-motion: no-preference) {
          .gild-rise { opacity: 0; transform: translateY(22px); animation: gildRise 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
          .gild-d1 { animation-delay: 0.08s; }
          .gild-d2 { animation-delay: 0.16s; }
          .gild-d3 { animation-delay: 0.24s; }
          .gild-d4 { animation-delay: 0.36s; }
          @keyframes gildRise { to { opacity: 1; transform: translateY(0); } }

          .gild-reveal { opacity: 0; transform: translateY(26px); transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1); }
          .gild-reveal.in { opacity: 1; transform: translateY(0); }
          .gild-rd1.in { transition-delay: 0.1s; }
          .gild-rd2.in { transition-delay: 0.2s; }

          .gild-marquee { animation: gildMarquee 36s linear infinite; }
          @keyframes gildMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

          .gild-pulse { animation: gildPulse 2.2s ease-in-out infinite; }
          @keyframes gildPulse {
            0%, 100% { box-shadow: 0 0 0 0 oklch(0.62 0.18 150 / 0.45); }
            50% { box-shadow: 0 0 0 5px oklch(0.62 0.18 150 / 0); }
          }
        }
        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          .gild-reveal, .gild-rise { opacity: 1; transform: none; }
        }

        @media (max-width: 880px) {
          .gild-nav-links { display: none !important; }
          .gild-3col { grid-template-columns: 1fr !important; }
          .gild-bento { grid-template-columns: 1fr 1fr !important; }
          .gild-split { grid-template-columns: 1fr !important; }
          .gild-split-flip > :first-child { order: 2; }
          .gild-pricing { grid-template-columns: 1fr !important; }
          .gild-handnote { display: none; }
        }
        @media (max-width: 620px) {
          .gild-bento { grid-template-columns: 1fr !important; }
          .gild-hero-canvas { grid-template-columns: 1fr !important; }
          .gild-hero-rail { display: none !important; }
        }
      `}</style>
    </div>
  );
}
