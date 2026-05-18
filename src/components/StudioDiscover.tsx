'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GILD_FONTS } from '@/components/gild';
import { Search, Compass, Users, ArrowRight } from 'lucide-react';

interface CommunityCard {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  member_count: number;
  category: string | null;
  logo_url: string | null;
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

export function StudioDiscover({ initialCommunities }: StudioDiscoverProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [communities, setCommunities] = useState(initialCommunities);

  // Note: For a real app, we'd debounced search here, but for v1, 
  // we'll do client-side filtering of the initial batch or use the search param.
  const filtered = communities.filter(c => {
    const matchesQuery = c.name.toLowerCase().includes(query.toLowerCase()) ||
      (c.description?.toLowerCase().includes(query.toLowerCase()) ?? false);
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  return (
    <div style={{
      fontFamily: GILD_FONTS.sans,
      background: '#fff',
      minHeight: '100vh',
      color: '#202020',
    }}>
      {/* Hero Section */}
      <section style={{
        background: 'oklch(0.985 0.003 250)',
        padding: 'clamp(48px, 8vw, 80px) clamp(20px, 4vw, 32px)',
        borderBottom: '1px solid oklch(0.94 0.005 250)',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 100,
            background: 'oklch(0.92 0.01 250)',
            color: 'oklch(0.30 0.02 250)',
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 24,
            letterSpacing: '0.01em',
          }}>
            <Compass size={14} />
            Explore the Galaxy
          </div>
          <h1 style={{
            fontFamily: GILD_FONTS.display,
            fontSize: 'clamp(32px, 5.5vw, 52px)',
            fontWeight: 800,
            margin: '0 0 20px',
            letterSpacing: '-0.035em',
            lineHeight: 1.05,
          }}>Find your people.</h1>
          <p style={{
            fontSize: 'clamp(15px, 1.6vw, 18px)',
            color: 'oklch(0.40 0.02 250)',
            margin: '0 0 36px',
            lineHeight: 1.55,
            maxWidth: 540,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>Discover premium communities where experts share knowledge and build together.</p>

          <div style={{
            position: 'relative',
            maxWidth: 520,
            margin: '0 auto',
          }}>
            <Search
              style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: 'oklch(0.50 0.02 250)' }}
              size={18}
            />
            <input
              type="text"
              placeholder="Search by name, niche, or keyword…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '15px 18px 15px 50px',
                borderRadius: 14,
                border: '1px solid oklch(0.88 0.01 250)',
                fontSize: 15,
                outline: 'none',
                background: '#fff',
                boxShadow: '0 6px 24px oklch(0 0 0 / 0.04)',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      </section>

      {/* Main Content — wider container, more breathing room, mobile-safe padding */}
      <main style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: 'clamp(32px, 5vw, 64px) clamp(20px, 4vw, 40px) 96px',
      }}>
        {/* Category Filter — tighter, scroll-snaps cleanly on mobile */}
        <div style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          marginBottom: 'clamp(28px, 4vw, 44px)',
          paddingBottom: 12,
          scrollbarWidth: 'thin',
        }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
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

        {/* Community Grid
            min(340px, 100%) — collapses to 1 column on viewports < 340px
            instead of overflowing.
            alignItems: 'start' — CRITICAL: defeats CSS Grid's default
            `align-items: stretch`, which was making every card balloon to
            match the tallest cell in the row (combined with the
            description's flex:1 + min-height, cards were ending up ~585px
            tall for ~280px of content). With start alignment, each card
            takes only as much vertical space as its own content needs. */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))',
          gap: 'clamp(24px, 3vw, 36px)',
          alignItems: 'start',
        }}>
          {filtered.map(community => (
            <Link
              key={community.id}
              href={`/c/${community.slug}/join`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{
                border: '1px solid oklch(0.93 0.005 250)',
                borderRadius: 16,
                padding: 24,
                background: '#fff',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                transition: 'transform 0.18s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.18s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.18s ease',
                cursor: 'pointer',
                boxShadow: '0 1px 2px oklch(0 0 0 / 0.02)',
                position: 'relative',
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px oklch(0 0 0 / 0.06), 0 2px 4px oklch(0 0 0 / 0.03)';
                  e.currentTarget.style.borderColor = 'oklch(0.85 0.01 250)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 2px oklch(0 0 0 / 0.02)';
                  e.currentTarget.style.borderColor = 'oklch(0.93 0.005 250)';
                }}
              >
                {/* Header: logo + name + price + member count, tighter vertical rhythm */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, minWidth: 0 }}>
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, oklch(0.78 0.14 75), oklch(0.55 0.14 75))',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: GILD_FONTS.display,
                    fontWeight: 800,
                    fontSize: 22,
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}>
                    {community.logo_url
                      ? <img src={community.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : community.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                      <h3 style={{
                        fontSize: 17,
                        fontWeight: 700,
                        margin: 0,
                        letterSpacing: '-0.02em',
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        minWidth: 0,
                        flex: 1,
                      }}>{community.name}</h3>
                      {/* Price Badge — pinned right, never wraps */}
                      {(() => {
                        const tiers = (community as any).membership_tiers || [];
                        const minPrice = tiers.length > 0 ? Math.min(...tiers.map((t: any) => t.price_month_usd)) : 0;
                        const displayPrice = minPrice > 0 ? minPrice / 100 : 0;
                        return (
                          <span style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: displayPrice > 0 ? 'oklch(0.45 0.14 150)' : 'oklch(0.50 0.02 250)',
                            fontFamily: GILD_FONTS.mono,
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}>
                            {displayPrice > 0 ? `$${displayPrice}/mo` : 'Free'}
                          </span>
                        );
                      })()}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Users size={12} color="oklch(0.50 0.02 250)" />
                      <span style={{ fontSize: 12, color: 'oklch(0.50 0.02 250)', fontWeight: 500, fontFamily: GILD_FONTS.mono }}>
                        {community.member_count.toLocaleString()} {community.member_count === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description — naturally sized, clamps at 3 lines. No flex:1
                    or min-height: with alignItems:start on the grid, cards take
                    their content height, so there's no "remaining space" to fill. */}
                <p style={{
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: 'oklch(0.42 0.02 250)',
                  margin: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {community.description || 'A premium space for collective growth and expert-led discussion.'}
                </p>

                {/* Footer — separated from body by a hairline rule for clear visual hierarchy */}
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
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: 'oklch(0.20 0.02 250)',
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: '-0.005em',
                  }}>
                    Join
                    <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <Compass size={48} color="oklch(0.90 0.01 250)" style={{ marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>No communities found</h3>
            <p style={{ color: 'oklch(0.50 0.02 250)', margin: 0 }}>Try adjusting your search or category filters.</p>
          </div>
        )}
      </main>
    </div>
  );
}
