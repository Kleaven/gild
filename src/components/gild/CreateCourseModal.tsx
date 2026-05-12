'use client';

import React, { useState, useTransition } from 'react';
import { createCourse } from '@/app/actions/courses';
import { GILD_FONTS } from '@/components/gild';
import { useRouter } from 'next/navigation';

interface Props {
  communityId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CreateCourseModal({ communityId, isOpen, onClose }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    startTransition(async () => {
      try {
        const { courseId } = await createCourse({
          communityId,
          title,
          description,
        });
        setTitle('');
        setDescription('');
        onClose();
        router.push(`/c/${communityId}/courses/${courseId}`);
      } catch (err) {
        console.error('Failed to create course', err);
      }
    });
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'oklch(0 0 0 / 0.4)',
      backdropFilter: 'blur(4px)',
      fontFamily: GILD_FONTS.sans,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 32,
        width: '100%',
        maxWidth: 480,
        boxShadow: '0 12px 48px oklch(0 0 0 / 0.15)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: GILD_FONTS.display, letterSpacing: '-0.02em' }}>
            Create new course
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              lineHeight: 1,
              cursor: 'pointer',
              color: 'oklch(0.60 0.02 250)',
              padding: 4,
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'oklch(0.40 0.02 250)', marginBottom: 6 }}>
              Course Title
            </label>
            <input
              id="course-title"
              name="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Masterclass in Design"
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid oklch(0.90 0.01 250)',
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'oklch(0.40 0.02 250)', marginBottom: 6 }}>
              Description
            </label>
            <textarea
              id="course-description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will students learn?"
              rows={3}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid oklch(0.90 0.01 250)',
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: 8,
                background: 'transparent',
                color: 'oklch(0.40 0.02 250)',
                border: '1px solid oklch(0.90 0.01 250)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !title.trim()}
              style={{
                padding: '10px 18px',
                borderRadius: 8,
                background: '#111',
                color: '#fff',
                border: 'none',
                fontSize: 14,
                fontWeight: 600,
                cursor: (isPending || !title.trim()) ? 'default' : 'pointer',
                opacity: (isPending || !title.trim()) ? 0.7 : 1,
                fontFamily: 'inherit',
              }}
            >
              {isPending ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
