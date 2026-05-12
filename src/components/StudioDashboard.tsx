'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Wordmark, Avatar, GILD_FONTS } from '@/components/gild';
import type { Person } from '@/components/gild';
import type { DashboardStats } from '@/lib/community';
import { useRealtimePresence } from '@/hooks';
import { 
  Users, 
  MessageSquare, 
  Layers, 
  BookOpen, 
  Heart,
  ChevronRight,
  ExternalLink,
  DollarSign,
  TrendingUp as TrendingUpIcon,
  BarChart3
} from 'lucide-react';

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
  user
}: StudioDashboardProps) {
  const currentUserPresence = useMemo(() => ({
    id: user.id,
    name: user.display_name || 'Admin',
    avatar_url: user.avatar_url || null,
    online: true,
  }), [user]);

  const onlineUsers = useRealtimePresence(`community-${community.id}`, currentUserPresence as any);

  return (
    <div style={{
      fontFamily: GILD_FONTS.sans,
      background: 'oklch(0.99 0.002 250)', 
      minHeight: '100vh', 
      color: '#111',
    }}>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 40px' }}>
        <header style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h1 style={{
              fontFamily: GILD_FONTS.display,
              fontSize: 32, 
              fontWeight: 800, 
              margin: 0, 
              letterSpacing: '-0.03em',
            }}>{community.name} Dashboard</h1>
            <span style={{
              padding: '4px 10px', 
              borderRadius: 8, 
              fontSize: 12, 
              fontWeight: 700,
              background: '#fff', 
              color: 'oklch(0.40 0.02 250)',
              border: '1px solid oklch(0.94 0.005 250)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              {community.plan || 'Hobby'}
            </span>
          </div>
          <p style={{ color: 'oklch(0.55 0.02 250)', margin: 0, fontSize: 15 }}>
            Overview of your community growth and member engagement.
          </p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }}>
          {/* Revenue Section (Only if paid) */}
          {(stats.totalRevenue > 0 || community.plan === 'pro') && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              <StatCard 
                label="Monthly Revenue" 
                value={`$${stats.monthlyRevenue.toLocaleString()}`} 
                icon={<DollarSign size={20} />} 
                hue={150} 
              />
              <StatCard 
                label="Total Revenue" 
                value={`$${stats.totalRevenue.toLocaleString()}`} 
                icon={<TrendingUpIcon size={20} />} 
                hue={200} 
              />
              <div style={{
                background: '#fff',
                border: '1px solid oklch(0.94 0.005 250)',
                borderRadius: 24,
                padding: '16px 24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'oklch(0.55 0.02 250)', margin: '0 0 4px', textTransform: 'uppercase' }}>Revenue Trend</p>
                <div style={{ height: 40 }}>
                   <MiniSparkline data={stats.revenueTimeSeries.map(d => d.amount)} hue={150} />
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
            {/* Left Column: Detailed Insights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              <div style={{
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: 20,
              }}>
                <StatCard label="Total Members" value={stats.memberCount} icon={<Users size={20} />} hue={220} />
                <StatCard label="Total Posts" value={stats.postCount} icon={<BarChart3 size={20} />} hue={280} />
                <StatCard label="Engaged Replies" value={stats.replyCount} icon={<MessageSquare size={20} />} hue={150} />
              </div>

              {/* God-Tier Chart Container */}
              <div style={{
                background: '#fff',
                border: '1px solid oklch(0.94 0.005 250)',
                borderRadius: 28,
                padding: 40,
                boxShadow: '0 4px 24px oklch(0 0 0 / 0.02)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Engagement Activity</h3>
                    <p style={{ fontSize: 13, color: 'oklch(0.55 0.02 250)', margin: '4px 0 0' }}>Daily interactions across the community</p>
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'oklch(0.60 0.18 220)' }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#666' }}>Posts</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'oklch(0.60 0.18 150)' }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#666' }}>Replies</span>
                    </div>
                  </div>
                </div>
                
                <div style={{ height: 300 }}>
                   <GodTierChart data={stats.activityTimeSeries} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 40 }}>
                <div style={{ background: '#fff', border: '1px solid oklch(0.94 0.005 250)', borderRadius: 24, padding: 24 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                     <TrendingUpIcon size={18} color="oklch(0.50 0.15 150)" />
                     <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Growth Momentum</h3>
                   </div>
                   <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                     <span style={{ fontSize: 32, fontWeight: 800, color: 'oklch(0.50 0.15 150)' }}>+{stats.growthRate30d}%</span>
                     <span style={{ fontSize: 13, fontWeight: 600, color: 'oklch(0.55 0.02 250)' }}>last 30d</span>
                   </div>
                   <div style={{ height: 6, background: 'oklch(0.96 0.005 250)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, stats.growthRate30d)}%`, background: 'oklch(0.50 0.15 150)', borderRadius: 3 }} />
                   </div>
                </div>

                <div style={{ background: '#fff', border: '1px solid oklch(0.94 0.005 250)', borderRadius: 24, padding: 24 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                     <Layers size={18} color="oklch(0.45 0.16 280)" />
                     <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Top Performing Spaces</h3>
                   </div>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {stats.topSpaces.slice(0, 3).map((s, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>#{s.name}</span>
                          <span style={{ fontSize: 11, fontWeight: 800, color: 'oklch(0.45 0.16 280)', background: 'oklch(0.96 0.06 280 / 0.1)', padding: '3px 8px', borderRadius: 8 }}>{s.count} pts</span>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </div>

            {/* Right Column: Community Pulse */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              <section style={{ 
                background: '#fff', 
                border: '1px solid oklch(0.94 0.005 250)', 
                borderRadius: 24, 
                padding: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                   <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'oklch(0.62 0.18 150)', animation: 'gild-pulse 2s infinite' }} />
                   <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Online Members</h3>
                </div>
                <div style={{ 
                  fontSize: 12, 
                  fontWeight: 800, 
                  color: 'oklch(0.42 0.14 150)', 
                  background: 'oklch(0.96 0.04 150)', 
                  padding: '5px 12px', 
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <span>{onlineUsers.length}</span>
                  <span style={{ fontSize: 10, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Active</span>
                </div>
              </section>


            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes gild-pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 oklch(0.62 0.18 150 / 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px oklch(0.62 0.18 150 / 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 oklch(0.62 0.18 150 / 0); }
        }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, icon, hue }: { label: string, value: string | number, icon: React.ReactNode, hue: number }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid oklch(0.94 0.005 250)',
      borderRadius: 24,
      padding: '24px 28px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      transition: 'all 0.2s ease',
    }}>
      <div style={{ 
        width: 36, 
        height: 36, 
        borderRadius: 10, 
        background: `oklch(0.96 0.04 ${hue})`, 
        color: `oklch(0.50 0.15 ${hue})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {icon}
      </div>
      <div>
        <p style={{ 
          fontSize: 11, 
          fontWeight: 800, 
          color: 'oklch(0.55 0.02 250)', 
          margin: '0 0 4px',
          textTransform: 'uppercase',
          letterSpacing: '0.06em'
        }}>{label}</p>
        <p style={{ 
          fontFamily: GILD_FONTS.display, 
          fontSize: 28, 
          fontWeight: 800, 
          margin: 0,
          letterSpacing: '-0.03em',
          color: '#111'
        }}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
      </div>
    </div>
  );
}

const actionButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  borderRadius: 12,
  background: 'oklch(0.98 0.002 250)',
  border: '1px solid oklch(0.95 0.005 250)',
  textDecoration: 'none',
  color: '#111',
  fontSize: 14,
  fontWeight: 600,
  transition: 'all 0.2s ease',
};

function GodTierChart({ data }: { data: { date: string; posts: number; comments: number }[] }) {
  if (!data || data.length === 0) return null;
  
  const maxVal = Math.max(...data.map(d => d.posts + d.comments), 1);
  
  const getPoints = (valKey: 'posts' | 'comments') => {
    return data.map((d, i) => {
      const x = (i / (data.length - 1)) * 90 + 5; // 5% padding on left/right
      const y = 90 - (d[valKey] / maxVal) * 80; // 10% padding on top/bottom
      return { x, y };
    });
  };

  const renderPath = (points: { x: number, y: number }[], hue: number, fill = false) => {
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    
    if (fill) {
      const fillD = `${d} L ${points[points.length-1].x} 100 L ${points[0].x} 100 Z`;
      return <path d={fillD} fill={`url(#grad-${hue})`} opacity="0.1" />;
    }
    return <path d={d} fill="none" stroke={`oklch(0.60 0.18 ${hue})`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />;
  };

  const postPoints = getPoints('posts');
  const commentPoints = getPoints('comments');

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', flex: 1, overflow: 'hidden' }}>
        <defs>
          <linearGradient id="grad-220" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.60 0.18 220)" />
            <stop offset="100%" stopColor="oklch(0.60 0.18 220)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="grad-150" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.60 0.18 150)" />
            <stop offset="100%" stopColor="oklch(0.60 0.18 150)" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Grid Lines */}
        {[0, 25, 50, 75, 100].map(v => (
          <line key={v} x1="0" y1={v} x2="100" y2={v} stroke="oklch(0.96 0.005 250)" strokeWidth="0.5" />
        ))}
        
        {renderPath(commentPoints, 150, true)}
        {renderPath(commentPoints, 150)}
        {renderPath(postPoints, 220, true)}
        {renderPath(postPoints, 220)}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, padding: '0 4px' }}>
        {data.map((d, i) => (
          <span key={i} style={{ fontSize: 10, fontWeight: 700, color: 'oklch(0.70 0.02 250)', textTransform: 'uppercase' }}>{d.date}</span>
        ))}
      </div>
    </div>
  );
}

function MiniSparkline({ data, hue }: { data: number[], hue: number }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: 100 - (v / max) * 90
  }));
  
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const cp1x = points[i].x + (points[i+1].x - points[i].x) / 2;
    d += ` L ${cp1x} ${points[i].y} L ${cp1x} ${points[i+1].y} L ${points[i+1].x} ${points[i+1].y}`;
  }

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      <path d={d} fill="none" stroke={`oklch(0.60 0.18 ${hue})`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

