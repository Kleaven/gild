'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Wordmark, 
  Avatar, 
  LivePill, 
  GILD_FONTS, 
  Person, 
  Space, 
  Post, 
  DashboardStats 
} from '@/components/gild';

interface StudioDashboardProps {
  community: {
    id: string;
    name: string;
    plan: string | null;
    subscription_status: string | null;
  };
  membership: {
    role: string;
  };
  stats: DashboardStats;
  recentPosts: any[];
  user: {
    id: string;
    display_name?: string | null;
    avatar_url?: string | null;
  };
}

export function StudioDashboard({ 
  community, 
  membership, 
  stats, 
  recentPosts,
  user 
}: StudioDashboardProps) {
  // Map Supabase user to Gild Person
  const currentUser: Person = {
    id: user.id,
    name: user.display_name || 'Member',
    role: membership.role as any,
    hue: 220, // Default hue
    online: true,
  };

  return (
    <div style={{
      fontFamily: GILD_FONTS.sans,
      background: '#fff', 
      minHeight: '100vh', 
      color: '#202020',
    }}>
      <header style={{
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '14px 28px', 
        borderBottom: '1px solid oklch(0.95 0.005 250)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Wordmark size={22} />
          </Link>
          <span style={{ fontSize: 13, color: 'oklch(0.40 0.02 250)' }}>
            / {community.name} / Dashboard
          </span>
        </div>
        <Avatar person={currentUser} size={28} presence />
      </header>

      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 22 }}>
          <h1 style={{
            fontFamily: GILD_FONTS.display,
            fontSize: 28, 
            fontWeight: 700, 
            margin: 0, 
            letterSpacing: '-0.025em',
          }}>{community.name}</h1>
          
          <span style={{
            padding: '2px 8px', 
            borderRadius: 4, 
            fontSize: 11, 
            fontWeight: 600,
            background: 'oklch(0.96 0.04 150)', 
            color: 'oklch(0.36 0.10 150)',
            textTransform: 'capitalize',
          }}>
            {community.plan || 'Free'} · {community.subscription_status || 'Active'}
          </span>
          
          <span style={{
            fontSize: 12, 
            color: 'oklch(0.50 0.02 250)', 
            fontFamily: GILD_FONTS.mono,
            marginLeft: 'auto',
          }}>
            last sync just now
          </span>
        </div>

        <div style={{
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: 0,
          border: '1px solid oklch(0.94 0.005 250)', 
          borderRadius: 12, 
          marginBottom: 24,
          overflow: 'hidden',
        }}>
          {[
            { label: 'Members', value: stats.memberCount, hue: 220, sub: '+0 today' },
            { label: 'Posts', value: stats.postCount, hue: 280, sub: '+0 today' },
            { label: 'Spaces', value: stats.spaceCount, hue: 75, sub: 'active' },
            { label: 'Courses', value: stats.courseCount, hue: 150, sub: 'active' },
          ].map((stat, i) => (
            <div key={stat.label} style={{
              padding: '16px 18px',
              borderRight: i < 3 ? '1px solid oklch(0.94 0.005 250)' : 'none',
              background: '#fff',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ 
                  width: 7, 
                  height: 7, 
                  borderRadius: 2, 
                  background: `oklch(0.62 0.16 ${stat.hue})` 
                }}/>
                <p style={{ 
                  fontSize: 11, 
                  fontWeight: 600, 
                  margin: 0, 
                  color: 'oklch(0.50 0.02 250)', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.04em' 
                }}>{stat.label}</p>
              </div>
              <p style={{
                fontFamily: GILD_FONTS.display,
                fontSize: 28, 
                fontWeight: 700, 
                margin: '0 0 2px',
                letterSpacing: '-0.025em',
              }}>{stat.value.toLocaleString()}</p>
              <p style={{
                fontSize: 11, 
                fontWeight: 600, 
                margin: 0,
                color: `oklch(0.42 0.14 ${stat.hue})`,
              }}>{stat.sub}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
          <section style={{
            border: '1px solid oklch(0.94 0.005 250)', 
            borderRadius: 12, 
            padding: 20,
            background: '#fff',
          }}>
            <h2 style={{
              fontFamily: GILD_FONTS.display,
              fontSize: 16, 
              fontWeight: 700, 
              margin: '0 0 14px', 
              letterSpacing: '-0.02em',
            }}>Recent Activity</h2>
            
            {recentPosts.length === 0 ? (
              <p style={{ fontSize: 13, color: 'oklch(0.50 0.02 250)', textAlign: 'center', padding: '20px 0' }}>
                No recent activity to show.
              </p>
            ) : (
              recentPosts.slice(0, 5).map((post) => {
                const postPerson: Person = {
                  id: post.author_id,
                  name: post.author?.display_name || 'Member',
                  role: 'free_member', // Placeholder
                  hue: (post.author_id.charCodeAt(0) * 10) % 360,
                  online: false,
                };
                
                return (
                  <div key={post.id} style={{
                    display: 'grid', 
                    gridTemplateColumns: '24px 1fr auto', 
                    gap: 12,
                    alignItems: 'center', 
                    padding: '10px 0',
                    borderTop: '1px solid oklch(0.95 0.005 250)',
                  }}>
                    <Avatar person={postPerson} size={22} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{
                        fontSize: 13, 
                        margin: 0, 
                        whiteSpace: 'nowrap',
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                      }}>
                        <span style={{ fontWeight: 600 }}>{postPerson.name}</span>{' '}
                        <span style={{ color: 'oklch(0.50 0.02 250)' }}>posted in </span>
                        <span style={{ color: `oklch(0.42 0.10 220)`, fontWeight: 500 }}>
                          {post.space?.name || 'General'}
                        </span>
                      </p>
                      <p style={{
                        fontSize: 12, 
                        color: 'oklch(0.45 0.02 250)', 
                        margin: 0,
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                      }}>{post.title || post.body}</p>
                    </div>
                    <span style={{
                      fontFamily: GILD_FONTS.mono, 
                      fontSize: 11, 
                      color: 'oklch(0.50 0.02 250)',
                    }}>
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                );
              })
            )}
          </section>

          <section style={{
            border: '1px solid oklch(0.94 0.005 250)', 
            borderRadius: 12, 
            padding: 20,
            background: 'oklch(0.985 0.003 250)',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <p style={{
              fontSize: 11, 
              fontWeight: 700, 
              margin: '0 0 6px',
              textTransform: 'uppercase', 
              letterSpacing: '0.06em', 
              color: 'oklch(0.50 0.02 250)',
            }}>Subscription</p>
            
            <p style={{
              fontFamily: GILD_FONTS.display,
              fontSize: 22, 
              fontWeight: 700, 
              margin: '0 0 4px', 
              letterSpacing: '-0.02em',
            }}>{community.plan || 'Hobby'} — {community.plan === 'pro' ? '$59/mo' : '$29/mo'}</p>
            
            <p style={{ 
              fontSize: 13, 
              color: 'oklch(0.45 0.02 250)', 
              margin: '0 0 16px', 
              lineHeight: 1.45 
            }}>
              Status: <strong style={{ textTransform: 'capitalize' }}>{community.subscription_status?.replace('_', ' ') || 'Active'}</strong>
            </p>
            
            <div style={{ marginTop: 'auto', display: 'flex', gap: 10 }}>
              <Link
                href={`/onboarding/${community.id}/plan`}
                style={{
                  padding: '8px 14px', 
                  borderRadius: 8, 
                  fontSize: 13, 
                  fontWeight: 600,
                  background: 'oklch(0.20 0.02 250)', 
                  color: '#fff', 
                  border: 'none', 
                  cursor: 'pointer',
                  textDecoration: 'none',
                }}
              >
                Manage Plan
              </Link>
              <Link
                href={`/c/${community.id}/members`}
                style={{
                  padding: '8px 14px', 
                  borderRadius: 8, 
                  fontSize: 13, 
                  fontWeight: 500,
                  background: '#fff', 
                  color: '#202020',
                  border: '1px solid oklch(0.90 0.01 250)', 
                  cursor: 'pointer',
                  textDecoration: 'none',
                }}
              >
                Members
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
