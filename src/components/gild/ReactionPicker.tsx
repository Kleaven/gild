'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { GILD_FONTS } from './styles';
import { toggleVote } from '@/app/actions/comments';
import type { ReactionTally } from '@/lib/reactions';

const PICKER_EMOJI = ['❤️', '👍', '🎉', '😂', '😮', '😢'] as const;
type PickerEmoji = (typeof PICKER_EMOJI)[number];

type Props = {
  targetId: string;
  targetType: 'post' | 'comment';
  initialReactions: ReactionTally[];
  enabled: boolean;
  hue?: number;
};

function applyToggle(prev: ReactionTally[], emoji: PickerEmoji): ReactionTally[] {
  const existing = prev.find((r) => r.emoji === emoji);
  if (!existing) {
    return [...prev, { emoji, count: 1, viewerReacted: true }];
  }
  if (existing.viewerReacted) {
    const nextCount = existing.count - 1;
    if (nextCount <= 0) return prev.filter((r) => r.emoji !== emoji);
    return prev.map((r) =>
      r.emoji === emoji ? { ...r, count: nextCount, viewerReacted: false } : r,
    );
  }
  return prev.map((r) =>
    r.emoji === emoji ? { ...r, count: r.count + 1, viewerReacted: true } : r,
  );
}

export default function ReactionPicker({
  targetId,
  targetType,
  initialReactions,
  enabled,
  hue = 220,
}: Props) {
  const [reactions, setReactions] = useState<ReactionTally[]>(initialReactions);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [, startTransition] = useTransition();
  const pickerRef = useRef<HTMLDivElement | null>(null);

  // Click outside closes picker.
  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerOpen]);

  const handleToggle = (emoji: PickerEmoji) => {
    if (!enabled) return;
    const snapshot = reactions;
    setReactions((prev) => applyToggle(prev, emoji));
    setPickerOpen(false);
    startTransition(async () => {
      try {
        await toggleVote(targetId, targetType, emoji);
      } catch {
        setReactions(snapshot);
      }
    });
  };

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
      {reactions.map((r) => {
        const interactive = enabled;
        const reacted = r.viewerReacted;
        return (
          <button
            key={r.emoji}
            type="button"
            onClick={interactive ? () => handleToggle(r.emoji as PickerEmoji) : undefined}
            disabled={!interactive}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 999,
              background: reacted
                ? `oklch(0.92 0.06 ${hue})`
                : `oklch(0.97 0.02 ${hue})`,
              border: reacted
                ? `1px solid oklch(0.65 0.12 ${hue})`
                : `1px solid oklch(0.92 0.04 ${hue})`,
              fontSize: 12,
              color: `oklch(0.32 0.08 ${hue})`,
              fontFamily: GILD_FONTS.sans,
              fontWeight: 500,
              cursor: interactive ? 'pointer' : 'default',
              transition: 'background-color 120ms ease, border-color 120ms ease',
            }}
          >
            <span style={{ fontSize: 13 }}>{r.emoji}</span>
            <span style={{ fontFamily: GILD_FONTS.mono, fontSize: 11 }}>{r.count}</span>
          </button>
        );
      })}

      {enabled && (
        <div style={{ position: 'relative' }} ref={pickerRef}>
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            aria-label="Add reaction"
            aria-expanded={pickerOpen}
            style={{
              padding: '3px 10px',
              borderRadius: 999,
              background: 'transparent',
              border: `1px dashed oklch(0.85 0.02 ${hue})`,
              color: `oklch(0.50 0.04 ${hue})`,
              fontSize: 13,
              fontFamily: GILD_FONTS.sans,
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            +
          </button>
          {pickerOpen && (
            <div
              role="menu"
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 6px)',
                left: 0,
                display: 'flex',
                gap: 4,
                padding: '6px 8px',
                borderRadius: 10,
                background: '#fff',
                border: `1px solid oklch(0.90 0.01 ${hue})`,
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                zIndex: 20,
              }}
            >
              {PICKER_EMOJI.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  role="menuitem"
                  onClick={() => handleToggle(emoji)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: 18,
                    padding: '4px 6px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    lineHeight: 1,
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
