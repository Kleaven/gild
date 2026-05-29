'use client';

import React, { useState } from 'react';
import { GILD_FONTS } from './styles';
import { CheckCircle2 } from 'lucide-react';

interface Props {
  postId: string;
  options: { id: string; text: string }[];
  results: Record<string, number> | null;
  viewerVotedOption: string | null;
  hue?: number;
  onVote: (optionId: string) => void;
}

export function PollRenderer({ options, results, viewerVotedOption, hue = 250, onVote }: Props) {
  const [isVoting, setIsVoting] = useState(false);
  
  const totalVotes = Object.values(results || {}).reduce((a, b) => a + b, 0);
  const hasVoted = !!viewerVotedOption;

  const handleVoteClick = (optionId: string) => {
    if (hasVoted || isVoting) return;
    setIsVoting(true);
    onVote(optionId);
  };

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {options.map((opt) => {
          const voteCount = results?.[opt.id] || 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isSelected = viewerVotedOption === opt.id;

          return (
            <div 
              key={opt.id} 
              onClick={() => handleVoteClick(opt.id)}
              style={{
                ...optionStyle,
                cursor: hasVoted ? 'default' : 'pointer',
                borderColor: isSelected ? `oklch(0.60 0.16 ${hue})` : 'oklch(0.94 0.005 250)',
                background: isSelected ? `oklch(0.98 0.04 ${hue} / 0.4)` : 'oklch(0.99 0.002 250)',
              }}
            >
              {/* Progress Bar Background */}
              {hasVoted && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  width: `${percentage}%`,
                  background: isSelected ? `oklch(0.85 0.12 ${hue} / 0.3)` : 'oklch(0.94 0.01 250 / 0.5)',
                  zIndex: 0,
                  transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                }} />
              )}

              <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {isSelected && <CheckCircle2 size={16} color={`oklch(0.50 0.18 ${hue})`} />}
                  <span style={{ 
                    fontSize: 14, 
                    fontWeight: isSelected ? 700 : 500, 
                    color: isSelected ? `oklch(0.20 0.12 ${hue})` : '#333' 
                  }}>
                    {opt.text}
                  </span>
                </div>
                {hasVoted && (
                  <span style={{ 
                    fontSize: 12, 
                    fontWeight: 700, 
                    color: isSelected ? `oklch(0.40 0.15 ${hue})` : '#888',
                    fontFamily: GILD_FONTS.mono 
                  }}>
                    {percentage}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <div style={footerStyle}>
        <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
        {hasVoted && <span style={dotStyle}>•</span>}
        {hasVoted && <span style={{ color: `oklch(0.40 0.15 ${hue})`, fontWeight: 600 }}>Final results shown</span>}
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  marginTop: 16,
  padding: '4px 0',
  fontFamily: GILD_FONTS.sans,
};

const optionStyle: React.CSSProperties = {
  position: 'relative',
  padding: '12px 16px',
  borderRadius: 12,
  border: '1.5px solid transparent',
  overflow: 'hidden',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
};

const footerStyle: React.CSSProperties = {
  marginTop: 14,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 12,
  color: '#888',
  fontWeight: 500,
};

const dotStyle: React.CSSProperties = {
  opacity: 0.5,
};
