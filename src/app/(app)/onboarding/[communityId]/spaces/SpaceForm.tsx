'use client';

import { useState, useTransition } from 'react';
import { createSpace } from '@/app/actions';

type Props = {
  communityId: string;
  onCreated: (name: string) => void;
};

export default function SpaceForm({ communityId, onCreated }: Props) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createSpace({ communityId, name, type: 'feed' });
        onCreated(name);
        setName('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create space');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        minLength={2}
        maxLength={80}
        placeholder="e.g. General, Introductions…"
        style={{
          flex: 1,
          padding: '10px 12px',
          border: '1.5px solid #e0e0e0',
          borderRadius: 8,
          fontSize: 15,
          outline: 'none',
          boxSizing: 'border-box',
        }}
        disabled={isPending}
      />
      <button
        type="submit"
        disabled={isPending || name.trim().length < 2}
        style={{
          background: '#000',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '10px 18px',
          fontSize: 14,
          fontWeight: 600,
          cursor: isPending ? 'wait' : 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {isPending ? 'Adding…' : '+ Add'}
      </button>
      {error && (
        <p style={{ color: '#c00', fontSize: 13, margin: '8px 0 0' }}>{error}</p>
      )}
    </form>
  );
}
