'use client';

import { useState, useTransition } from 'react';
import { initializeInfrastructure } from '@/app/actions/admin';
import { Settings2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function HealthClient() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleInit() {
    setResult(null);
    startTransition(async () => {
      try {
        const res = await initializeInfrastructure();
        setResult(res);
      } catch (err) {
        setResult({ ok: false, message: err instanceof Error ? err.message : 'Initialization failed' });
      }
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
      <button
        onClick={handleInit}
        disabled={isPending}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 20px',
          borderRadius: 12,
          background: '#111',
          color: '#fff',
          border: 'none',
          fontSize: 14,
          fontWeight: 700,
          cursor: isPending ? 'default' : 'pointer',
          opacity: isPending ? 0.7 : 1,
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        {isPending ? <Loader2 size={16} className="animate-spin" /> : <Settings2 size={16} />}
        Initialize Infrastructure
      </button>

      {result && (
        <div style={{
          padding: '8px 12px',
          borderRadius: 8,
          background: result.ok ? 'oklch(0.96 0.04 150)' : 'oklch(0.96 0.04 25)',
          color: result.ok ? 'oklch(0.35 0.15 150)' : 'oklch(0.35 0.15 25)',
          fontSize: 12,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          maxWidth: 300,
          border: `1px solid ${result.ok ? 'oklch(0.90 0.10 150)' : 'oklch(0.90 0.10 25)'}`
        }}>
          {result.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {result.message}
        </div>
      )}
    </div>
  );
}
