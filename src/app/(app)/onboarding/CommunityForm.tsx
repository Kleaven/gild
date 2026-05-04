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
    .slice(0, 50);
}

export default function CommunityForm() {
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
      router.push(`/onboarding/${communityId}/plan`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create community');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
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
          autoFocus
        />
      </label>

      <label style={labelStyle}>
        URL slug
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          minLength={3}
          maxLength={50}
          pattern="[a-z0-9-]+"
          placeholder="indie-founders"
          style={inputStyle}
        />
        <span style={{ fontSize: 12, color: '#aaa' }}>gild.app/c/{slug || '…'}</span>
      </label>

      <label style={labelStyle}>
        Description{' '}
        <span style={{ fontSize: 12, color: '#aaa', fontWeight: 400 }}>(optional)</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="What is your community about?"
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </label>

      {error && <p style={{ color: '#c00', fontSize: 14, margin: 0 }}>{error}</p>}

      <button type="submit" disabled={loading} style={btnStyle}>
        {loading ? 'Creating…' : 'Create community →'}
      </button>
    </form>
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
  border: '1.5px solid #e0e0e0',
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
  borderRadius: 9,
  padding: '13px 0',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
  marginTop: 4,
};
