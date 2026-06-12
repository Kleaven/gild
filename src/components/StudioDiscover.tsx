'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { GILD_FONTS } from '@/components/gild';
import { Search, Compass, Users, ArrowRight, X, Sparkles } from 'lucide-react';

interface DiscoverTier {
  price_month_usd: number;
  is_active: boolean;
}

interface CommunityCard {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  member_count: number;
  category: string | null;
  logo_url: string | null;
  banner_url?: string | null;
  pricing_type?: string | null;
  price_amount?: number | null;
  pricing_period?: string | null;
  membership_tiers?: DiscoverTier[];
}

interface StudioDiscoverProps {
  initialCommunities: CommunityCard[];
}

const CATEGORIES = [
  'All',
  'Business',
  'Technology',
  'Health & Fitness',
  'Arts & Design',
  'Lifestyle',
  'Education',
];

// Deterministic hue per community so each card gets a stable identity color.
function hueFor(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}

// The badge must match what the join gate actually charges. Two sources:
// 1. The community's JOIN fee (pricing_type/price_amount — what JoinGate bills)
// 2. Optional membership tiers (whole dollars; never divided by 100)
function priceBadge(c: CommunityCard): { label: string; paid: boolean } {
  if (c.pricing_type === 'paid' && (c.price_amount ?? 0) > 0) {
    const amount = c.price_amount as number;
    const suffix = c.pricing_period === 'monthly' ? '/mo' : c.pricing_period === 'yearly' ? '/yr' : ' to join';
    return { label: `$${amount}${suffix}`, paid: true };
  }
  const active = (c.membership_tiers ?? []).filter((t) => t.is_active && t.price_month_usd > 0);
  if (active.length > 0) {
    return { label: `from $${Math.min(...active.map((t) => t.price_month_usd))}/mo`, paid: true };
  }
  return { label: 'Free to join', paid: false };
}

export function StudioDiscover({ initialCommunities }: StudioDiscoverProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return initialCommunities.filter((c) => {
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.description?.toLowerCase().includes(q) ?? false);
      const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
      return matchesQuery && matchesCategory;
    });
  }, [initialCommunities, query, selectedCategory]);

  const platformEmpty = initialCommunities.length === 0;
  const isFiltering = query.trim() !== '' || selectedCategory !== 'All';

  return (
    <div style={{
      fontFamily: GILD_FONTS.sans,
      background: '#fff',
      minHeight: '100vh',
      color: '#202020',
    }}>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(180deg, oklch(0.98 0.006 250), oklch(0.995 0.002 250))',
        padding: 'clamp(48px, 8vw, 80px) clamp(20px, 4vw, 32px)',
        borderBottom: '1px solid oklch(0.94 0.005 250)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* soft identity glows */}
        <span aria-hidden style={{
          position: 'absolute', top: -120, left: '12%', width: 280, height: 280, borderRadius: '50%',
          background: 'oklch(0.90 0.06 75 / 0.5)', filter: 'blur(80px)', pointerEvents: 'none',
        }} />
        <span aria-hidden style={{
          position: 'absolute', bottom: -140, right: '10%', width: 320, height: 320, borderRadius: '50%',
          background: 'oklch(0.90 0.06 300 / 0.4)', filter: 'blur(90px)', pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative' }}>
          <div className="gd-rise" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 100,
            background: '#fff',
            border: '1px solid oklch(0.92 0.01 250)',
            color: 'oklch(0.30 0.02 250)',
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 24,
            letterSpacing: '0.01em',
          }}>
            <Compass size={14} />
            Discover communities
          </div>
          <h1 className="gd-rise gd-d1" style={{
            fontFamily: GILD_FONTS.display,
            fontSize: 'clamp(34px, 5.5vw, 54px)',
            fontWeight: 800,
            margin: '0 0 18px',
            letterSpacing: '-0.035em',
            lineHeight: 1.04,
          }}>Find your people.</h1>
          <p className="gd-rise gd-d2" style={{
            fontSize: 'clamp(15px, 1.6vw, 18px)',
            color: 'oklch(0.40 0.02 250)',
            margin: '0 auto 34px',
            lineHeight: 1.55,
            maxWidth: 540,
          }}>Premium communities where experts teach, members build, and creators keep 100%.</p>

          <div className="gd-rise gd-d3" style={{ position: 'relative', maxWidth: 540, margin: '0 auto' }}>
            <Search
              style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: 'oklch(0.50 0.02 250)' }}
              size={18}
              aria-hidden
            />
            <input
              type="search"
              aria-label="Search communities"
              placeholder="Search by name, niche, or keyword…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '15px 48px 15px 50px',
                borderRadius: 14,
                border: '1px solid oklch(0.88 0.01 250)',
                fontSize: 15,
                outline: 'none',
                background: '#fff',
                boxShadow: '0 8px 28px oklch(0 0 0 / 0.05)',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Clear search"
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  width: 28, height: 28, borderRadius: 8, border: 'none',
                  background: 'oklch(0.96 0.005 250)', color: 'oklch(0.45 0.02 250)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <main style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: 'clamp(32px, 5vw, 56px) clamp(20px, 4vw, 40px) 96px',
      }}>
        {/* category chips + result count */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 'clamp(24px, 4vw, 40px)',
        }}>
          <div style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 4,
            scrollbarWidth: 'thin',
          }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                aria-pressed={selectedCategory === cat}
                style={{
                  padding: '9px 16px',
                  borderRadius: 100,
                  border: '1px solid',
                  borderColor: selectedCategory === cat ? 'oklch(0.20 0.02 250)' : 'oklch(0.90 0.01 250)',
                  background: selectedCategory === cat ? 'oklch(0.20 0.02 250)' : '#fff',
                  color: selectedCategory === cat ? '#fff' : 'oklch(0.30 0.02 250)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  fontFamily: 'inherit',
                  flexShrink: 0,
                }}
              >
                {cat}
              </button>
            ))}
          </div>
          {!platformEmpty && (
            <p aria-live="polite" style={{ margin: 0, fontSize: 13, color: 'oklch(0.52 0.02 250)', fontFamily: GILD_FONTS.mono, whiteSpace: 'nowrap' }}>
              {filtered.length} {filtered.length === 1 ? 'community' : 'communities'}
            </p>
          )}
        </div>

        {/* grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(330px, 100%), 1fr))',
          gap: 'clamp(20px, 2.6vw, 28px)',
          alignItems: 'start',
        }}>
          {filtered.map((community, i) => {
            const hue = hueFor(community.slug || community.name);
            const badge = priceBadge(community);
            return (
              <Link
                key={community.id}
                href={`/c/${community.slug}/join`}
                className="gd-card gd-pop"
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'block',
                  border: '1px solid oklch(0.93 0.005 250)',
                  borderRadius: 18,
                  background: '#fff',
                  overflow: 'hidden',
                  boxShadow: '0 1px 2px oklch(0 0 0 / 0.02)',
                  animationDelay: `${Math.min(i, 11) * 0.05}s`,
                }}
              >
                {/* cover band — real banner when the owner uploaded one */}
                <div aria-hidden style={{
                  height: 72,
                  background: community.banner_url
                    ? undefined
                    : `linear-gradient(120deg, oklch(0.88 0.07 ${hue}), oklch(0.80 0.10 ${(hue + 40) % 360}))`,
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {community.banner_url ? (
                    <img src={community.banner_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <span style={{
                      position: 'absolute', inset: 0,
                      background: 'radial-gradient(ellipse at 80% 0%, oklch(1 0 0 / 0.45), transparent 55%)',
                    }} />
                  )}
                </div>

                <div style={{ padding: '0 22px 22px' }}>
                  {/* logo sits mostly below the band so neither covers the other */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -18, marginBottom: 12, position: 'relative', zIndex: 1 }}>
                    <div style={{
                      width: 54,
                      height: 54,
                      borderRadius: 14,
                      background: `linear-gradient(135deg, oklch(0.70 0.13 ${hue}), oklch(0.50 0.13 ${hue}))`,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: GILD_FONTS.display,
                      fontWeight: 800,
                      fontSize: 22,
                      flexShrink: 0,
                      overflow: 'hidden',
                      border: '3px solid #fff',
                      boxShadow: '0 4px 12px oklch(0 0 0 / 0.10)',
                    }}>
                      {community.logo_url
                        ? <img src={community.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : community.name[0]}
                    </div>
                    <span style={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      fontFamily: GILD_FONTS.mono,
                      whiteSpace: 'nowrap',
                      padding: '5px 11px',
                      borderRadius: 999,
                      marginBottom: 2,
                      background: badge.paid ? 'oklch(0.95 0.05 150)' : 'oklch(0.96 0.005 250)',
                      color: badge.paid ? 'oklch(0.38 0.12 150)' : 'oklch(0.45 0.02 250)',
                    }}>
                      {badge.label}
                    </span>
                  </div>

                  <h3 style={{
                    fontSize: 17.5,
                    fontWeight: 700,
                    margin: '0 0 5px',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>{community.name}</h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <Users size={12} color="oklch(0.50 0.02 250)" aria-hidden />
                    <span style={{ fontSize: 12, color: 'oklch(0.50 0.02 250)', fontWeight: 500, fontFamily: GILD_FONTS.mono }}>
                      {community.member_count.toLocaleString()} {community.member_count === 1 ? 'member' : 'members'}
                    </span>
                  </div>

                  <p style={{
                    fontSize: 14,
                    lineHeight: 1.55,
                    color: 'oklch(0.42 0.02 250)',
                    margin: '0 0 16px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {community.description || 'A premium space for collective growth and expert-led discussion.'}
                  </p>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 14,
                    borderTop: '1px solid oklch(0.96 0.005 250)',
                  }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 700,
                      background: 'oklch(0.96 0.005 250)',
                      color: 'oklch(0.40 0.02 250)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      fontFamily: GILD_FONTS.mono,
                    }}>
                      {community.category || 'Niche'}
                    </span>
                    <span className="gd-join" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: 'oklch(0.20 0.02 250)',
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: '-0.005em',
                    }}>
                      Join
                      <ArrowRight size={14} aria-hidden />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* empty states */}
        {platformEmpty ? (
          <div style={{ textAlign: 'center', padding: '72px 0' }}>
            <Sparkles size={44} color="oklch(0.85 0.06 75)" style={{ marginBottom: 16 }} aria-hidden />
            <h3 style={{ fontFamily: GILD_FONTS.display, fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Be the first.</h3>
            <p style={{ color: 'oklch(0.50 0.02 250)', margin: '0 0 22px', fontSize: 15 }}>
              No public communities yet — yours could be the one everyone discovers.
            </p>
            <Link href="/onboarding" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 26px', borderRadius: 12, textDecoration: 'none',
              background: 'oklch(0.20 0.02 250)', color: '#fff', fontWeight: 700, fontSize: 15,
            }}>
              Start a community <ArrowRight size={16} />
            </Link>
          </div>
        ) : filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '72px 0' }}>
            <Compass size={44} color="oklch(0.90 0.01 250)" style={{ marginBottom: 16 }} aria-hidden />
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>
              {query.trim() ? `No matches for “${query.trim()}”` : 'Nothing in this category yet'}
            </h3>
            <p style={{ color: 'oklch(0.50 0.02 250)', margin: '0 0 20px' }}>Try a different keyword or category.</p>
            {isFiltering && (
              <button
                onClick={() => { setQuery(''); setSelectedCategory('All'); }}
                style={{
                  padding: '10px 20px', borderRadius: 10, border: '1px solid oklch(0.88 0.01 250)',
                  background: '#fff', color: 'oklch(0.25 0.02 250)', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </main>

      <style>{`
        .gd-card { transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s ease, border-color 0.2s ease; }
        .gd-card:hover { transform: translateY(-4px); box-shadow: 0 16px 36px oklch(0 0 0 / 0.08), 0 2px 4px oklch(0 0 0 / 0.03); border-color: oklch(0.86 0.01 250); }
        .gd-card .gd-join { transition: gap 0.18s ease; }
        .gd-card:hover .gd-join { gap: 10px; }

        @media (prefers-reduced-motion: no-preference) {
          .gd-rise { opacity: 0; transform: translateY(18px); animation: gdRise 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
          .gd-d1 { animation-delay: 0.07s; }
          .gd-d2 { animation-delay: 0.14s; }
          .gd-d3 { animation-delay: 0.21s; }
          .gd-pop { opacity: 0; transform: translateY(18px); animation: gdRise 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
          @keyframes gdRise { to { opacity: 1; transform: translateY(0); } }
        }
        @media (prefers-reduced-motion: reduce) {
          .gd-rise, .gd-pop { opacity: 1 !important; transform: none !important; animation: none !important; }
        }
      `}</style>
    </div>
  );
}
