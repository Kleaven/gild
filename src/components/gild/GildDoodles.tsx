'use client';

import React from 'react';

const INK = 'oklch(0.30 0.02 250)';
const INK_WARM = 'oklch(0.55 0.14 75)'; // gold accent
const INK_GREEN = 'oklch(0.50 0.14 150)';
const INK_LILAC = 'oklch(0.55 0.14 280)';

export const DOODLE_COLORS = {
  ink: INK,
  warm: INK_WARM,
  green: INK_GREEN,
  lilac: INK_LILAC,
};

interface DoodleProps {
  style?: React.CSSProperties;
  color?: string;
  rotate?: number;
}

export function DoodleSquiggleArrow({ style, color = INK, rotate = 0 }: DoodleProps) {
  return (
    <svg viewBox="0 0 120 90" width="120" height="90" fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      style={{ position: 'absolute', transform: `rotate(${rotate}deg)`, ...style }}>
      <path d="M5 12 C 22 4, 42 6, 56 18 C 70 30, 62 48, 44 50 C 28 52, 22 38, 32 30 C 44 22, 70 28, 86 44 C 96 54, 100 64, 102 76"/>
      <path d="M94 66 L 102 78 L 112 70"/>
    </svg>
  );
}

export function DoodleStar({ style, color = INK_WARM, size = 28 }: DoodleProps & { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      style={{ position: 'absolute', ...style }}>
      <path d="M20 4 C 20 14, 22 18, 36 20 C 22 22, 20 26, 20 36 C 20 26, 18 22, 4 20 C 18 18, 20 14, 20 4 Z"/>
    </svg>
  );
}

export function DoodleUnderline({ style, color = INK_WARM, w = 180 }: DoodleProps & { w?: number }) {
  return (
    <svg viewBox="0 0 200 16" width={w} height={w * 0.08} fill="none"
      stroke={color} strokeWidth="2.2" strokeLinecap="round"
      style={{ position: 'absolute', ...style }}>
      <path d="M4 10 C 40 4, 80 14, 120 6 C 150 1, 180 10, 196 8"/>
    </svg>
  );
}

export function DoodleCircle({ style, color = INK, size = 80 }: DoodleProps & { size?: number }) {
  return (
    <svg viewBox="0 0 100 60" width={size} height={size * 0.6} fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round"
      style={{ position: 'absolute', ...style }}>
      <path d="M52 4 C 78 5, 96 16, 96 30 C 95 46, 70 56, 46 56 C 22 56, 4 46, 4 30 C 4 16, 24 5, 52 4 Z"/>
    </svg>
  );
}

export function DoodleHeart({ style, color = INK_WARM, size = 22 }: DoodleProps & { size?: number }) {
  return (
    <svg viewBox="0 0 30 28" width={size} height={size} fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      style={{ position: 'absolute', ...style }}>
      <path d="M15 25 C 4 18, 1 11, 5 6 C 9 1, 14 4, 15 8 C 16 4, 21 1, 25 6 C 29 11, 26 18, 15 25 Z"/>
    </svg>
  );
}

export function DoodleSpark({ style, color = INK_GREEN, size = 22 }: DoodleProps & { size?: number }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round"
      style={{ position: 'absolute', ...style }}>
      <path d="M10 2 L 10 18 M 2 10 L 18 10 M 4 4 L 16 16 M 16 4 L 4 16" strokeOpacity="0.85"/>
    </svg>
  );
}

export function DoodleScribbleLine({ style, color = INK_LILAC, w = 90 }: DoodleProps & { w?: number }) {
  return (
    <svg viewBox="0 0 100 14" width={w} height={w * 0.14} fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round"
      style={{ position: 'absolute', ...style }}>
      <path d="M2 7 C 10 2, 18 12, 26 7 C 34 2, 42 12, 50 7 C 58 2, 66 12, 74 7 C 82 2, 90 12, 98 7"/>
    </svg>
  );
}

export function DoodleCheck({ style, color = INK_GREEN, size = 26 }: DoodleProps & { size?: number }) {
  return (
    <svg viewBox="0 0 30 30" width={size} height={size} fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      style={{ position: 'absolute', ...style }}>
      <path d="M5 16 L 12 22 L 25 7"/>
    </svg>
  );
}

export function DoodleArrowStraight({ style, color = INK, w = 70, rotate = 0 }: DoodleProps & { w?: number }) {
  return (
    <svg viewBox="0 0 80 30" width={w} height={w * 0.4} fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      style={{ position: 'absolute', transform: `rotate(${rotate}deg)`, ...style }}>
      <path d="M4 18 C 24 6, 50 6, 72 14"/>
      <path d="M64 8 L 72 14 L 66 22"/>
    </svg>
  );
}

// ─── Niche doodles ───────────────────────────────────────────────────────────
// Hand-drawn line sketches of the crafts that live on Gild — same ink style
// as the ambient doodles (single stroke, round caps, slightly imperfect).

export function DoodlePot({ style, color = INK_WARM, size = 34 }: DoodleProps & { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      style={{ position: 'absolute', ...style }}>
      <path d="M14 8 C 13 11, 13 12, 11 13 C 7 16, 6 22, 9 27 C 12 32, 17 34, 20 34 C 23 34, 28 32, 31 27 C 34 22, 33 16, 29 13 C 27 12, 27 11, 26 8" />
      <path d="M14 8 C 17 9.5, 23 9.5, 26 8" />
      <path d="M12 20 C 15 22, 25 22, 28 20" />
    </svg>
  );
}

export function DoodleGuitar({ style, color = INK_WARM, size = 36 }: DoodleProps & { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      style={{ position: 'absolute', ...style }}>
      <path d="M25 4 L 33 12 M27 3 L 30 6 M30 6 L 34 10 M34 10 L 37 7" />
      <path d="M25 6 L 16 15 C 14 17, 13 17, 11 18 C 6 21, 4 28, 8 32 C 12 36, 19 34, 22 29 C 23 27, 23 26, 25 24 L 34 15" />
      <circle cx="14" cy="26" r="3.4" />
    </svg>
  );
}

export function DoodleCamera({ style, color = INK_WARM, size = 34 }: DoodleProps & { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      style={{ position: 'absolute', ...style }}>
      <rect x="5" y="13" width="30" height="20" rx="4" />
      <path d="M14 13 L 16 8 L 24 8 L 26 13" />
      <circle cx="20" cy="23" r="5.5" />
      <circle cx="30" cy="18" r="1.1" />
    </svg>
  );
}

export function DoodleSprout({ style, color = INK_WARM, size = 32 }: DoodleProps & { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      style={{ position: 'absolute', ...style }}>
      <path d="M20 35 C 20 28, 20 22, 20 17" />
      <path d="M20 17 C 20 11, 24 7, 30 7 C 30 13, 26 17, 20 17 Z" />
      <path d="M20 23 C 20 19, 16 16, 11 16 C 11 20, 15 23, 20 23 Z" />
      <path d="M13 35 C 16 33, 24 33, 27 35" />
    </svg>
  );
}

export function DoodleDumbbell({ style, color = INK_WARM, size = 36 }: DoodleProps & { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      style={{ position: 'absolute', ...style }}>
      <path d="M13 17 L 27 17 M13 23 L 27 23" />
      <rect x="7" y="12" width="5" height="16" rx="2" />
      <rect x="28" y="12" width="5" height="16" rx="2" />
      <path d="M3 16 L 3 24 M37 16 L 37 24" />
    </svg>
  );
}
