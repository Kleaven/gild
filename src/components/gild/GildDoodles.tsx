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
