'use client';

import { useRouter } from 'next/navigation';

// "← Back" that returns to wherever the reader came from (sign-up, settings…)
// instead of dumping them on the landing page. Falls back to "/" when the
// legal page was opened directly (no in-app history).
export function BackLink({ label }: { label: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push('/');
      }}
      style={{
        background: 'transparent',
        border: 'none',
        padding: 0,
        color: 'oklch(0.50 0.02 250)',
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      ← {label}
    </button>
  );
}
