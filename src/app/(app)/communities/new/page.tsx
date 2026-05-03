'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCommunity } from '@/app/actions';

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export default function NewCommunityPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setName(val);
    setSlug(toSlug(val));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { communityId } = await createCommunity({
        name,
        slug,
        description: description || undefined,
      });
      router.push(`/c/${communityId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create community');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: '60px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 28 }}>Create a community</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label style={labelStyle}>
          Community name
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            required
            minLength={2}
            maxLength={100}
            placeholder="e.g. Indie Founders"
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          URL slug
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            minLength={2}
            maxLength={80}
            pattern="[a-z0-9-]+"
            placeholder="indie-founders"
            style={inputStyle}
          />
          <span style={{ fontSize: 12, color: '#aaa' }}>
            gild.app/c/{slug || '…'}
          </span>
        </label>

        <label style={labelStyle}>
          Description{' '}
          <span style={{ fontSize: 12, color: '#aaa', fontWeight: 400 }}>(optional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="What is this community about?"
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </label>

        {error && <p style={{ color: '#c00', fontSize: 14, margin: 0 }}>{error}</p>}

        <button type="submit" disabled={loading} style={btnStyle}>
          {loading ? 'Creating…' : 'Create community'}
        </button>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  fontSize: 14,
  fontWeight: 600,
  color: '#333',
};

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  border: '1.5px solid #ddd',
  borderRadius: 8,
  fontSize: 15,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const btnStyle: React.CSSProperties = {
  background: '#000',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '12px 0',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
  marginTop: 4,
};
