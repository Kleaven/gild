'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { GILD_FONTS } from '@/components/gild';
import { updateProfile } from '@/app/actions';
import { Check } from 'lucide-react';

const NICHES = [
  'Business', 'Technology', 'Health & Fitness', 'Arts & Design',
  'Lifestyle', 'Education', 'Marketing', 'Real Estate',
  'Crypto & Web3', 'AI & Machine Learning', 'Gaming', 'Personal Development'
];

const OCCUPATIONS = [
  'Entrepreneur', 'Software Engineer', 'Student', 'Designer',
  'Marketing Professional', 'Freelancer', 'Content Creator',
  'Sales Executive', 'Executive/Manager', 'Coach/Consultant',
  'Artist/Creative', 'Educator/Teacher', 'Health Professional',
  'Real Estate Agent', 'Investor', 'Researcher/Scientist',
  'Retired', 'Full-time Parent', 'Other'
];

export function MemberKYC() {
  const router = useRouter();
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [occupation, setOccupation] = useState('');
  const [isPending, startTransition] = useTransition();

  function toggleNiche(niche: string) {
    setSelectedNiches(prev => 
      prev.includes(niche) ? prev.filter(n => n !== niche) : [...prev, niche]
    );
  }

  function handleFinish() {
    startTransition(async () => {
      await updateProfile({
        display_name: 'User', // Placeholder, real name should be set during sign up
        interests: selectedNiches,
        occupation,
      } as any);
      router.push('/communities');
    });
  }

  const isValid = selectedNiches.length >= 3 && occupation !== '';

  return (
    <div style={{
      fontFamily: GILD_FONTS.sans,
      maxWidth: 600,
      margin: '0 auto',
      padding: '40px 20px',
    }}>
      <h1 style={{
        fontFamily: GILD_FONTS.display,
        fontSize: 28,
        fontWeight: 800,
        margin: '0 0 8px',
        letterSpacing: '-0.02em',
      }}>Personalize your experience</h1>
      <p style={{
        fontSize: 15,
        color: 'oklch(0.40 0.02 250)',
        margin: '0 0 40px',
      }}>Help us find the best communities for you.</p>

      <section style={{ marginBottom: 40 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 16px', color: '#111' }}>
          What are you interested in? (Select at least 3)
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {NICHES.map(niche => {
            const isSelected = selectedNiches.includes(niche);
            return (
              <button
                key={niche}
                onClick={() => toggleNiche(niche)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 100,
                  border: '1px solid',
                  borderColor: isSelected ? 'oklch(0.20 0.02 250)' : 'oklch(0.90 0.01 250)',
                  background: isSelected ? 'oklch(0.20 0.02 250)' : 'transparent',
                  color: isSelected ? '#fff' : 'oklch(0.30 0.02 250)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {isSelected && <Check size={14} />}
                {niche}
              </button>
            );
          })}
        </div>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px', color: '#111' }}>
          What is your current occupation?
        </h3>
        <select
          value={occupation}
          onChange={(e) => setOccupation(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 12,
            border: '1px solid oklch(0.85 0.01 250)',
            fontSize: 15,
            outline: 'none',
            background: '#fff',
            fontFamily: 'inherit',
          }}
        >
          <option value="" disabled>Select an option</option>
          {OCCUPATIONS.map(occ => (
            <option key={occ} value={occ}>{occ}</option>
          ))}
        </select>
      </section>

      <button
        onClick={handleFinish}
        disabled={!isValid || isPending}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: 12,
          background: isValid ? 'oklch(0.20 0.02 250)' : 'oklch(0.92 0.01 250)',
          color: isValid ? '#fff' : 'oklch(0.60 0.02 250)',
          border: 'none',
          fontSize: 16,
          fontWeight: 700,
          cursor: isValid ? 'pointer' : 'default',
          transition: 'all 0.2s',
        }}
      >
        {isPending ? 'Saving...' : 'Finish Setup'}
      </button>
    </div>
  );
}
