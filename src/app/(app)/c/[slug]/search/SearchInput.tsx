'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

export default function SearchInput() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const q = searchParams.get('q') ?? '';
  const scope = searchParams.get('scope') ?? 'posts';

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 24, alignItems: 'center' }}>
      <input
        type="search"
        placeholder="Search…"
        defaultValue={q}
        onChange={(e) => update('q', e.target.value)}
        style={{
          flex: 1,
          padding: '10px 14px',
          border: '1.5px solid #ddd',
          borderRadius: 8,
          fontSize: 15,
          outline: 'none',
        }}
      />
      <select
        value={scope}
        onChange={(e) => update('scope', e.target.value)}
        style={{
          padding: '10px 12px',
          border: '1.5px solid #ddd',
          borderRadius: 8,
          fontSize: 14,
          background: '#fff',
          cursor: 'pointer',
        }}
      >
        <option value="posts">Posts</option>
        <option value="members">Members</option>
      </select>
      {isPending && <span style={{ fontSize: 13, color: '#aaa' }}>…</span>}
    </div>
  );
}
