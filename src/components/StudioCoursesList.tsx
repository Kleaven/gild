'use client';

import React from 'react';
import Link from 'next/link';
import { CoverArt, GILD_FONTS } from '@/components/gild';
import { CreateCourseModal } from '@/components/gild/CreateCourseModal';
import { Plus } from 'lucide-react';
import type { Course } from '@/lib/courses';

interface StudioCoursesListProps {
  community: {
    id: string;
    slug: string;
    name: string;
  };
  courses: Course[];
  isAdminOrOwner: boolean;
}

export function StudioCoursesList({ community, courses, isAdminOrOwner }: StudioCoursesListProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

  const visibleCourses = isAdminOrOwner
    ? courses
    : courses.filter((c) => c.is_published);

  return (
    <div
      style={{
        fontFamily: GILD_FONTS.sans,
        padding: '40px 28px 60px',
        maxWidth: 1080,
        margin: '0 auto',
        color: '#111',
      }}
    >
      <header style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
              <h1
                style={{
                  fontFamily: GILD_FONTS.display,
                  fontSize: 40,
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  margin: 0,
                  lineHeight: 1,
                  color: '#111',
                }}
              >
                Courses
              </h1>
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  background: 'oklch(0.96 0.005 250)',
                  color: 'oklch(0.40 0.02 250)',
                  fontFamily: GILD_FONTS.mono,
                }}
              >
                {visibleCourses.length}
              </span>
            </div>
            <p
              style={{
                fontSize: 16,
                color: 'oklch(0.55 0.02 250)',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Long-form content from {community.name}. Learn at your own pace.
            </p>
          </div>
          {isAdminOrOwner && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 12,
                background: '#111',
                color: '#fff',
                border: 'none',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Plus size={18} />
              New Course
            </button>
          )}
        </div>
      </header>

      {visibleCourses.length === 0 ? (
        <EmptyState isAdminOrOwner={isAdminOrOwner} onOpenCreateModal={() => setIsCreateModalOpen(true)} />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 20,
          }}
        >
          {visibleCourses.map((course, i) => (
            <CourseCard
              key={course.id}
              course={course}
              communitySlug={community.slug}
              hue={hueForCourse(course.id, i)}
            />
          ))}
        </div>
      )}

      <CreateCourseModal
        communityId={community.id}
        communitySlug={community.slug}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}

function CourseCard({
  course,
  communitySlug,
  hue,
}: {
  course: Course;
  communitySlug: string;
  hue: number;
}) {
  return (
    <Link
      href={`/c/${communitySlug}/courses/${course.id}`}
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        border: '1px solid oklch(0.92 0.01 250)',
        borderRadius: 14,
        overflow: 'hidden',
        background: '#fff',
        transition: 'border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      <div style={{ position: 'relative' }}>
        <CoverArt
          space={{
            id: course.id,
            name: course.title,
            desc: course.description ?? '',
            hue,
          }}
          height={160}
          variant={course.position % 3 === 0 ? 'rays' : course.position % 3 === 1 ? 'grid' : 'wash'}
        />
        {!course.is_published && (
          <span
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              padding: '3px 8px',
              borderRadius: 999,
              fontSize: 10,
              fontWeight: 700,
              background: '#111',
              color: '#fff',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontFamily: GILD_FONTS.mono,
            }}
          >
            Draft
          </span>
        )}
      </div>
      <div style={{ padding: '18px 20px 20px' }}>
        <h3
          style={{
            fontFamily: GILD_FONTS.display,
            fontSize: 18,
            fontWeight: 700,
            margin: '0 0 8px',
            letterSpacing: '-0.02em',
            color: '#111',
            lineHeight: 1.25,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {course.title}
        </h3>
        {course.description && (
          <p
            style={{
              fontSize: 14,
              color: 'oklch(0.55 0.02 250)',
              margin: 0,
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {course.description}
          </p>
        )}
      </div>
    </Link>
  );
}

function EmptyState({ isAdminOrOwner, onOpenCreateModal }: { isAdminOrOwner: boolean, onOpenCreateModal: () => void }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '80px 20px',
        border: '1px dashed oklch(0.90 0.01 250)',
        borderRadius: 14,
        background: 'oklch(0.99 0.002 250)',
      }}
    >
      <h2
        style={{
          fontFamily: GILD_FONTS.display,
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          margin: '0 0 8px',
          color: '#111',
          lineHeight: 1,
        }}
      >
        No courses yet
      </h2>
      <p style={{ fontSize: 15, color: 'oklch(0.55 0.02 250)', margin: '0 0 24px', lineHeight: 1.5 }}>
        {isAdminOrOwner
          ? 'Create your first course to share long-form content with your community.'
          : 'Courses will appear here when they are published.'}
      </p>
      {isAdminOrOwner && (
        <button
          onClick={onOpenCreateModal}
          style={{
            padding: '12px 24px',
            borderRadius: 12,
            background: '#111',
            color: '#fff',
            border: 'none',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Create Course
        </button>
      )}
    </div>
  );
}

function hueForCourse(id: string, index: number): number {
  // Deterministic hue per course id, stable across renders.
  const code = id.charCodeAt(0) || 0;
  return ((code * 11) + index * 47) % 360;
}
