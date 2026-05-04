'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SpaceForm from './SpaceForm';

type Props = { communityId: string; initialSpaces: string[] };

export default function SpacesStep({ communityId, initialSpaces }: Props) {
  const router = useRouter();
  const [spaces, setSpaces] = useState<string[]>(initialSpaces);

  function handleCreated(name: string) {
    setSpaces((prev) => [...prev, name]);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <SpaceForm communityId={communityId} onCreated={handleCreated} />

      {spaces.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {spaces.map((s) => (
            <li
              key={s}
              style={{
                padding: '10px 14px',
                background: '#f6f6f6',
                borderRadius: 8,
                fontSize: 14,
                color: '#333',
              }}
            >
              # {s}
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => router.push(`/onboarding/${communityId}/invite`)}
        disabled={spaces.length === 0}
        style={{
          display: 'block',
          width: '100%',
          background: spaces.length === 0 ? '#e0e0e0' : '#000',
          color: spaces.length === 0 ? '#aaa' : '#fff',
          border: 'none',
          borderRadius: 9,
          padding: '13px 0',
          fontSize: 15,
          fontWeight: 600,
          cursor: spaces.length === 0 ? 'not-allowed' : 'pointer',
          marginTop: 8,
        }}
      >
        Continue →
      </button>

      {spaces.length === 0 && (
        <p style={{ textAlign: 'center', marginTop: 4 }}>
          <button
            onClick={() => router.push(`/onboarding/${communityId}/invite`)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 13,
              color: '#aaa',
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Skip for now
          </button>
        </p>
      )}
    </div>
  );
}
