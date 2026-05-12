import React from 'react';
import { GILD_FONTS } from '@/components/gild';

export default function SpaceFeedLoading() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px', width: '100%', fontFamily: GILD_FONTS.sans }}>
      {/* Skeleton for space header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{
          width: '100%',
          height: 160,
          borderRadius: 16,
          background: 'oklch(0.96 0.01 250)',
          marginBottom: 20,
          animation: 'pulse 1.5s infinite ease-in-out',
        }} />
        <div style={{ width: '40%', height: 32, borderRadius: 8, background: 'oklch(0.96 0.01 250)', marginBottom: 12, animation: 'pulse 1.5s infinite ease-in-out' }} />
        <div style={{ width: '60%', height: 20, borderRadius: 6, background: 'oklch(0.96 0.01 250)', animation: 'pulse 1.5s infinite ease-in-out' }} />
      </div>

      {/* Skeleton for post form */}
      <div style={{
        background: '#fff',
        border: '1px solid oklch(0.94 0.005 250)',
        borderRadius: 12,
        padding: '14px 16px',
        marginBottom: 32,
        height: 120,
        animation: 'pulse 1.5s infinite ease-in-out',
      }} />

      {/* Skeletons for posts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{
            background: '#fff',
            border: '1px solid oklch(0.94 0.005 250)',
            borderRadius: 16,
            padding: '24px 28px',
            animation: 'pulse 1.5s infinite ease-in-out',
          }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'oklch(0.96 0.01 250)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: '30%', height: 16, borderRadius: 4, background: 'oklch(0.96 0.01 250)', marginBottom: 6 }} />
                <div style={{ width: '20%', height: 12, borderRadius: 4, background: 'oklch(0.96 0.01 250)' }} />
              </div>
            </div>
            <div style={{ width: '80%', height: 24, borderRadius: 6, background: 'oklch(0.96 0.01 250)', marginBottom: 12 }} />
            <div style={{ width: '100%', height: 16, borderRadius: 4, background: 'oklch(0.96 0.01 250)', marginBottom: 8 }} />
            <div style={{ width: '90%', height: 16, borderRadius: 4, background: 'oklch(0.96 0.01 250)' }} />
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}} />
    </div>
  );
}
