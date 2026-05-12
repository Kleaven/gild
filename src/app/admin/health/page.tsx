import { getSupabaseServiceClient } from '@/lib/auth/server';
import db from '@/lib/db';
import { env } from '@/lib/env';
import { AlertCircle, CheckCircle2, Database, Shield, Box, HardDrive, RefreshCcw } from 'lucide-react';
import { GILD_FONTS } from '@/components/gild';
import HealthClient from './HealthClient';

export const dynamic = 'force-dynamic';

export default async function HealthPage() {
  const status: { name: string; ok: boolean; message: string; type: 'env' | 'db' | 'storage' | 'rpc' }[] = [];

  // 1. Check Env Vars
  const requiredEnv = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL',
    'STRIPE_SECRET_KEY',
  ];

  for (const key of requiredEnv) {
    const val = (env as any)[key];
    status.push({
      name: key,
      ok: !!val && val !== 'placeholder',
      message: !!val && val !== 'placeholder' ? 'Configured' : 'Missing or Placeholder',
      type: 'env',
    });
  }

  // 2. Check DB Connection
  try {
    await db`SELECT 1`;
    status.push({ name: 'Database Connection', ok: true, message: 'Connected', type: 'db' });
  } catch (err) {
    status.push({ name: 'Database Connection', ok: false, message: err instanceof Error ? err.message : 'Failed', type: 'db' });
  }

  // 3. Check Tables
  const tables = ['profiles', 'communities', 'community_members', 'spaces', 'posts', 'comments'];
  for (const table of tables) {
    try {
      await db.unsafe(`SELECT 1 FROM public.${table} LIMIT 1`);
      status.push({ name: `Table: ${table}`, ok: true, message: 'Exists', type: 'db' });
    } catch (err) {
      status.push({ name: `Table: ${table}`, ok: false, message: 'Missing or Error', type: 'db' });
    }
  }

  // 4. Check Storage Buckets
  const supabase = getSupabaseServiceClient();
  const buckets = ['media', 'avatars', 'branding'];
  for (const bucketName of buckets) {
    try {
      const { data: bucket, error } = await supabase.storage.getBucket(bucketName);
      status.push({
        name: `Bucket: ${bucketName}`,
        ok: !error,
        message: error ? error.message : 'Exists',
        type: 'storage',
      });
    } catch (err) {
      status.push({ name: `Bucket: ${bucketName}`, ok: false, message: 'Error checking', type: 'storage' });
    }
  }

  // 5. Check RPCs
  const rpcs = ['user_has_min_role', 'current_user_role', 'is_platform_admin'];
  for (const rpc of rpcs) {
    try {
      const rows = await db`SELECT 1 FROM pg_proc WHERE proname = ${rpc}`;
      status.push({
        name: `RPC: ${rpc}`,
        ok: rows.length > 0,
        message: rows.length > 0 ? 'Defined' : 'Missing',
        type: 'rpc',
      });
    } catch (err) {
      status.push({ name: `RPC: ${rpc}`, ok: false, message: 'Error checking', type: 'rpc' });
    }
  }

  const allOk = status.every(s => s.ok);

  return (
    <div style={{ fontFamily: GILD_FONTS.sans, padding: '60px 24px', maxWidth: 800, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em', margin: '0 0 8px' }}>System Health Check</h1>
          <p style={{ color: 'oklch(0.55 0.02 250)', margin: 0, fontSize: 16 }}>Verification of environment, database, and storage infrastructure.</p>
        </div>
        <HealthClient />
      </header>

      <div style={{ 
        padding: '20px 24px', 
        borderRadius: 16, 
        background: allOk ? 'oklch(0.96 0.04 150)' : 'oklch(0.96 0.04 25)',
        color: allOk ? 'oklch(0.35 0.15 150)' : 'oklch(0.35 0.15 25)',
        fontWeight: 700,
        marginBottom: 40,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        border: `1px solid ${allOk ? 'oklch(0.90 0.10 150)' : 'oklch(0.90 0.10 25)'}`
      }}>
        {allOk ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
        {allOk ? 'All systems operational' : 'Infrastructure issues detected. Check the list below.'}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {status.map((s, i) => (
          <div key={i} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '16px 20px',
            background: '#fff',
            border: '1px solid oklch(0.94 0.005 250)',
            borderRadius: 14,
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.01)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ 
                width: 32, 
                height: 32, 
                borderRadius: 8, 
                background: s.ok ? 'oklch(0.96 0.04 150)' : 'oklch(0.96 0.04 25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: s.ok ? 'oklch(0.40 0.15 150)' : 'oklch(0.40 0.15 25)'
              }}>
                {s.type === 'env' && <Shield size={16} />}
                {s.type === 'db' && <Database size={16} />}
                {s.type === 'storage' && <Box size={16} />}
                {s.type === 'rpc' && <RefreshCcw size={16} />}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{s.name}</div>
                <div style={{ fontSize: 11, color: 'oklch(0.55 0.02 250)', fontWeight: 600, letterSpacing: '0.02em' }}>{s.type.toUpperCase()}</div>
              </div>
            </div>
            <div style={{ 
              fontSize: 13, 
              color: s.ok ? 'oklch(0.40 0.15 150)' : 'oklch(0.40 0.15 25)', 
              fontWeight: 700,
              background: s.ok ? 'oklch(0.96 0.04 150 / 0.5)' : 'oklch(0.96 0.04 25 / 0.5)',
              padding: '4px 10px',
              borderRadius: 6
            }}>
              {s.message}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
