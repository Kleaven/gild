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
        padding: '64px 28px',
        borderBottom: '1px solid oklch(0.94 0.005 250)',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            borderRadius: 100,
            background: 'oklch(0.92 0.01 250)',
            color: 'oklch(0.30 0.02 250)',
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 20,
          }}>
            <Compass size={14} />
            Explore the Galaxy
          </div>
          <h1 style={{
            fontFamily: GILD_FONTS.display,
            fontSize: 48,
            fontWeight: 800,
            margin: '0 0 16px',
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
          }}>Find your people.</h1>
          <p style={{
            fontSize: 18,
            color: 'oklch(0.40 0.02 250)',
            margin: '0 0 32px',
            lineHeight: 1.5,
          }}>Discover premium communities where experts share knowledge and build together.</p>

          <div style={{
            position: 'relative',
            maxWidth: 500,
            margin: '0 auto',
          }}>
            <Search
              style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'oklch(0.50 0.02 250)' }}
              size={18}
            />
            <input
              type="text"
              placeholder="Search by name, niche, or keyword…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px 14px 48px',
                borderRadius: 12,
                border: '1px solid oklch(0.85 0.01 250)',
                fontSize: 15,
                outline: 'none',
                background: '#fff',
                boxShadow: '0 4px 20px oklch(0 0 0 / 0.05)',
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 28px' }}>
        {/* Category Filter */}
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', marginBottom: 40, paddingBottom: 10 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '8px 18px',
                borderRadius: 100,
                border: '1px solid',
                borderColor: selectedCategory === cat ? 'oklch(0.20 0.02 250)' : 'oklch(0.90 0.01 250)',
                background: selectedCategory === cat ? 'oklch(0.20 0.02 250)' : 'transparent',
                color: selectedCategory === cat ? '#fff' : 'oklch(0.30 0.02 250)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Community Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '40px 32px',
        }}>
          {filtered.map(community => (
            <Link
              key={community.id}
              href={`/c/${community.id}/join`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{
                border: '1px solid oklch(0.94 0.005 250)',
                borderRadius: 20,
                padding: 24,
                background: '#fff',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                boxShadow: '0 2px 8px oklch(0 0 0 / 0.02)',
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px oklch(0 0 0 / 0.06)';
                  e.currentTarget.style.borderColor = 'oklch(0.85 0.01 250)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px oklch(0 0 0 / 0.02)';
                  e.currentTarget.style.borderColor = 'oklch(0.94 0.005 250)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, oklch(0.78 0.14 75), oklch(0.55 0.14 75))',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: GILD_FONTS.display,
                    fontWeight: 800,
                    fontSize: 20,
                  }}>
                    {community.logo_url ? <img src={community.logo_url} style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }} /> : community.name[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>{community.name}</h3>
                      {/* Price Badge */}
                      {(() => {
                        const tiers = (community as any).membership_tiers || [];
                        const minPrice = tiers.length > 0 ? Math.min(...tiers.map((t: any) => t.price_month_usd)) : 0;
                        const displayPrice = minPrice > 0 ? minPrice / 100 : 0;
                        return (
                          <span style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: displayPrice > 0 ? 'oklch(0.60 0.15 150)' : 'oklch(0.50 0.02 250)',
                          }}>
                            {displayPrice > 0 ? `$${displayPrice}/mo` : 'Free'}
                          </span>
                        );
                      })()}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <Users size={12} color="oklch(0.50 0.02 250)" />
                      <span style={{ fontSize: 12, color: 'oklch(0.50 0.02 250)', fontWeight: 500 }}>
                        {community.member_count.toLocaleString()} members
                      </span>
                    </div>
                  </div>
                </div>

                <p style={{
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: 'oklch(0.40 0.02 250)',
                  margin: '0 0 24px',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  flex: 1,
                }}>
                  {community.description || "A premium space for collective growth and expert-led discussion."}
                </p>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 'auto',
                }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    background: 'oklch(0.96 0.005 250)',
                    color: 'oklch(0.40 0.02 250)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
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
                  }}>
                    Join Community
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
