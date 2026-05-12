'use client';

import { useState } from 'react';
import { createCommunity } from '@/app/actions';
import { MessageSquare, Heart, Info, Lock, Globe } from 'lucide-react';

const NICHES = [
  'Business', 'Technology', 'Health & Fitness', 'Arts & Design',
  'Lifestyle', 'Education', 'Marketing', 'Real Estate',
  'Crypto & Web3', 'AI & Machine Learning', 'Gaming', 'Personal Development'
];

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

interface Props {
  onSuccess: (communityId: string) => void;
  submitLabel?: string;
}

export function CreateCommunityForm({ onSuccess, submitLabel = 'Create community' }: Props) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [category, setCategory] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [goodbyeMessage, setGoodbyeMessage] = useState('');
  const [pricingType, setPricingType] = useState<'free' | 'paid'>('free');
  const [priceAmount, setPriceAmount] = useState(0);
  const [priceCurrency, setPriceCurrency] = useState('USD');
  const [pricingPeriod, setPricingPeriod] = useState<'one_time' | 'monthly' | 'yearly'>('one_time');
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
        is_private: isPrivate,
        category: category || undefined,
        welcome_message: welcomeMessage || undefined,
        goodbye_message: goodbyeMessage || undefined,
        pricing_type: pricingType,
        price_amount: priceAmount,
        price_currency: priceCurrency,
        pricing_period: pricingPeriod,
        theme_hue: Math.floor(Math.random() * 360),
      });
      onSuccess(communityId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create community');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Basic Information</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
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
            <span style={{ fontSize: 12, color: '#888' }}>gild.app/c/{slug || '…'}</span>
          </label>

          <div style={{ display: 'flex', gap: 16 }}>
            <label style={{ ...labelStyle, flex: 1 }}>
              Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                style={inputStyle}
              >
                <option value="" disabled>Select a niche</option>
                {NICHES.map(niche => (
                  <option key={niche} value={niche}>{niche}</option>
                ))}
              </select>
            </label>

            <label style={{ ...labelStyle, flex: 1 }}>
              Privacy
              <div style={{ position: 'relative' }}>
                <select
                  value={isPrivate ? 'private' : 'public'}
                  onChange={(e) => setIsPrivate(e.target.value === 'private')}
                  style={{ ...inputStyle, paddingLeft: 36 }}
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#888' }}>
                  {isPrivate ? <Lock size={14} /> : <Globe size={14} />}
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <h3 style={{ ...sectionTitleStyle, margin: 0 }}>Revenue & Access</h3>
          <span style={{ fontSize: 11, background: 'oklch(0.96 0.04 250)', color: 'oklch(0.40 0.15 250)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>MONETIZATION</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <label style={{ ...labelStyle, flex: 1 }}>
              Access Type
              <select
                value={pricingType}
                onChange={(e) => setPricingType(e.target.value as 'free' | 'paid')}
                style={inputStyle}
              >
                <option value="free">Free Access</option>
                <option value="paid">Paid Access</option>
              </select>
            </label>

            {pricingType === 'paid' && (
              <>
                <label style={{ ...labelStyle, flex: 1 }}>
                  Price ({priceCurrency})
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      value={priceAmount}
                      onChange={(e) => setPriceAmount(Number(e.target.value))}
                      min={1}
                      step="0.01"
                      required
                      style={{ ...inputStyle, paddingLeft: 28 }}
                    />
                    <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#888', fontSize: 14 }}>
                      $
                    </div>
                  </div>
                </label>

                <label style={{ ...labelStyle, flex: 1 }}>
                  Billing Cycle
                  <select
                    value={pricingPeriod}
                    onChange={(e) => setPricingPeriod(e.target.value as any)}
                    style={inputStyle}
                  >
                    <option value="one_time">One-time</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </label>
              </>
            )}
          </div>
          <p style={hintStyle}>
            {pricingType === 'free' 
              ? 'Anyone can join your community for free.' 
              : pricingPeriod === 'one_time'
                ? 'Members must pay a one-time fee for lifetime access.'
                : `Members will be charged $${priceAmount} ${pricingPeriod.replace('_', ' ')}.`}
          </p>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <h3 style={{ ...sectionTitleStyle, margin: 0 }}>Onboarding & Experience</h3>
          <span style={{ fontSize: 11, background: 'oklch(0.96 0.04 150)', color: 'oklch(0.40 0.15 150)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>PREMIUM</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <label style={labelStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MessageSquare size={14} />
              Welcome Message
            </div>
            <textarea
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="Write a warm greeting for new members when they first join..."
              style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
            />
            <p style={hintStyle}>Shown in a beautiful modal immediately after a user joins.</p>
          </label>

          <label style={labelStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Heart size={14} />
              Goodbye Message
            </div>
            <textarea
              value={goodbyeMessage}
              onChange={(e) => setGoodbyeMessage(e.target.value)}
              placeholder="A kind note to show when a member considers leaving..."
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            />
            <p style={hintStyle}>Shown in the confirmation dialog when a user clicks 'Leave Community'.</p>
          </label>
        </div>
      </div>

      {error && (
        <div style={{ 
          padding: '12px 16px', 
          background: 'oklch(0.96 0.04 25)', 
          border: '1px solid oklch(0.90 0.10 25)', 
          borderRadius: 12,
          color: 'oklch(0.45 0.16 25)',
          fontSize: 14,
          fontWeight: 600,
          display: 'flex',
          gap: 10,
          alignItems: 'center'
        }}>
          <Info size={18} />
          {error}
        </div>
      )}

      <button type="submit" disabled={loading} style={btnStyle}>
        {loading ? 'Designing your community...' : submitLabel}
      </button>
    </form>
  );
}

const sectionStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid oklch(0.94 0.005 250)',
  borderRadius: 16,
  padding: 24,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  marginBottom: 20,
  color: '#111',
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  fontSize: 13,
  fontWeight: 700,
  color: '#444',
};

const inputStyle: React.CSSProperties = {
  padding: '12px 14px',
  border: '1.5px solid oklch(0.92 0.005 250)',
  borderRadius: 10,
  fontSize: 15,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'all 0.2s ease',
  background: 'oklch(0.99 0.002 250)',
};

const hintStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#888',
  margin: '4px 0 0',
  fontWeight: 400,
  lineHeight: 1.4,
};

const btnStyle: React.CSSProperties = {
  background: 'oklch(0.20 0.02 250)',
  color: '#fff',
  border: 'none',
  borderRadius: 12,
  padding: '16px 0',
  fontSize: 16,
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  boxShadow: '0 4px 12px oklch(0 0 0 / 0.1)',
};
