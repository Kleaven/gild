'use client';

import React, { useState } from 'react';

// ─── MakerCrowd ──────────────────────────────────────────────────────────────
// Renders the bespoke persona illustrations from /public/personas/*.png as a
// warm, diverse crowd. LOAD-GATED: each image stays invisible until it loads,
// and removes itself on error — so before the art is dropped in, this renders
// nothing (no broken-image flash, no layout reserved). The moment the files
// exist, the crowd appears. See public/personas/README.md for the art spec.

type Maker = { file: string; alt: string; rotate: number; dy: number; scale: number; delay: number };

const CROWD: Maker[] = [
  { file: 'photographer', alt: 'A photographer', rotate: -4, dy: 16, scale: 0.86, delay: 0.0 },
  { file: 'potter', alt: 'A potter', rotate: 3, dy: 2, scale: 1.0, delay: 0.4 },
  { file: 'guitarist', alt: 'A guitarist', rotate: -3, dy: 10, scale: 0.94, delay: 0.8 },
  { file: 'gardener', alt: 'A gardener', rotate: 4, dy: 0, scale: 1.04, delay: 0.2 },
  { file: 'lifter', alt: 'A weightlifter', rotate: -2, dy: 12, scale: 0.9, delay: 0.6 },
  { file: 'painter', alt: 'A painter', rotate: 3, dy: 18, scale: 0.84, delay: 1.0 },
];

export function MakerCrowd({
  height = 132,
  className,
  style,
}: {
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [ok, setOk] = useState<Record<string, boolean>>({});
  const anyLoaded = Object.values(ok).some(Boolean);

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        // No reserved height until something loads → zero layout shift pre-art.
        minHeight: anyLoaded ? height + 24 : 0,
        ...style,
      }}
    >
      {CROWD.map((m) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={m.file}
          src={`/personas/${m.file}.png`}
          alt={m.alt}
          className="gild-maker"
          onLoad={() => setOk((s) => ({ ...s, [m.file]: true }))}
          onError={() => setOk((s) => ({ ...s, [m.file]: false }))}
          style={{
            height,
            width: 'auto',
            display: ok[m.file] ? 'block' : 'none',
            marginInline: -10,
            transform: `translateY(${m.dy}px) rotate(${m.rotate}deg) scale(${m.scale})`,
            transformOrigin: 'bottom center',
            animationDelay: `${m.delay}s`,
          }}
        />
      ))}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .gild-maker { animation: gildMakerBob 6s ease-in-out infinite; }
          @keyframes gildMakerBob { 0%,100% { translate: 0 0; } 50% { translate: 0 -6px; } }
        }
      `}</style>
    </div>
  );
}

// ─── MakerFigure ─────────────────────────────────────────────────────────────
// A single persona for the auth panels. Same load-gating; renders nothing
// until its file exists.
export function MakerFigure({
  file,
  alt,
  size = 150,
  style,
}: {
  file: string;
  alt: string;
  size?: number;
  style?: React.CSSProperties;
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  if (errored) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/personas/${file}.png`}
      alt={alt}
      onLoad={() => setLoaded(true)}
      onError={() => setErrored(true)}
      style={{ height: size, width: 'auto', display: loaded ? 'block' : 'none', ...style }}
    />
  );
}
