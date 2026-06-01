'use client';

import React from 'react';
import Link from 'next/link';
import { GILD_FONTS, CoverArt } from '@/components/gild';
import type { CourseWithModules } from '@/lib/courses';

interface StudioCourseDetailProps {
  community: {
    id: string;
    slug: string;
    name: string;
  };
  course: CourseWithModules;
  isEnrolled: boolean;
  isAdminOrOwner: boolean;
  completedLessonsCount?: number;
  hasCertificate?: boolean;
  enrollAction: () => Promise<void>;
  claimCertificateAction?: () => Promise<void>;
}

export function StudioCourseDetail({
  community,
  course,
  isEnrolled,
  isAdminOrOwner,
  completedLessonsCount = 0,
  hasCertificate = false,
  enrollAction,
  claimCertificateAction,
}: StudioCourseDetailProps) {
  const publishedLessons = course.modules.reduce(
    (sum, m) => sum + m.lessons.filter((l) => l.is_published).length,
    0,
  );

  const hue = (course.id.charCodeAt(0) * 11) % 360;

  return (
    <div
      style={{
        fontFamily: GILD_FONTS.sans,
        padding: '32px 28px 60px',
        maxWidth: 920,
        margin: '0 auto',
        color: '#111',
      }}
    >
      {/* Breadcrumb */}
      <div style={{ marginBottom: 20 }}>
        <Link
          href={`/c/${community.slug}/courses`}
          style={{
            fontSize: 13,
            color: 'oklch(0.55 0.02 250)',
            textDecoration: 'none',
            fontFamily: GILD_FONTS.mono,
          }}
        >
          ← Courses
        </Link>
      </div>

      {/* Cover */}
      <div
        style={{
          borderRadius: 14,
          overflow: 'hidden',
          border: '1px solid oklch(0.92 0.01 250)',
          marginBottom: 24,
        }}
      >
        {course.image_url ? (
          <img
            src={course.image_url}
            alt={course.title}
            style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <CoverArt
            space={{
              id: course.id,
              name: course.title,
              desc: course.description ?? '',
              hue,
            }}
            height={220}
            variant="rays"
          />
        )}
      </div>

      {/* Header */}
      <header style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          {!course.is_published && (
            <span
              style={{
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
          <span
            style={{
              fontSize: 12,
              color: 'oklch(0.55 0.02 250)',
              fontFamily: GILD_FONTS.mono,
            }}
          >
            {course.modules.length} {course.modules.length === 1 ? 'module' : 'modules'} ·{' '}
            {publishedLessons} {publishedLessons === 1 ? 'lesson' : 'lessons'}
          </span>
        </div>

        <h1
          style={{
            fontFamily: GILD_FONTS.display,
            fontSize: 44,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            margin: '0 0 12px',
            lineHeight: 1.05,
            color: '#111',
          }}
        >
          {course.title}
        </h1>

        {course.description && (
          <p
            style={{
              fontSize: 17,
              color: 'oklch(0.40 0.02 250)',
              margin: '0 0 24px',
              lineHeight: 1.5,
              maxWidth: 680,
            }}
          >
            {course.description}
          </p>
        )}

        <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
          {/* Enroll / Certificate CTA */}
          {isEnrolled ? (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 20px',
                  borderRadius: 14,
                  background: 'oklch(0.96 0.04 145)',
                  border: '1px solid oklch(0.85 0.06 145)',
                  color: 'oklch(0.35 0.10 145)',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                <span style={{ fontSize: 16 }}>✓</span>
                Enrolled
              </div>
              {completedLessonsCount === publishedLessons && publishedLessons > 0 && !hasCertificate && claimCertificateAction && (
                <form action={claimCertificateAction}>
                  <button
                    type="submit"
                    style={{
                      appearance: 'none',
                      border: '1px solid oklch(0.85 0.06 75)',
                      background: 'oklch(0.96 0.04 75)',
                      color: 'oklch(0.40 0.10 75)',
                      padding: '12px 20px',
                      borderRadius: 14,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: GILD_FONTS.sans,
                    }}
                  >
                    Claim Certificate
                  </button>
                </form>
              )}
              {hasCertificate && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 20px',
                    borderRadius: 14,
                    background: 'oklch(0.95 0.04 75)',
                    border: '1px solid oklch(0.85 0.06 75)',
                    color: 'oklch(0.40 0.10 75)',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  <span style={{ fontSize: 16 }}>🏆</span>
                  Certified
                </div>
              )}
            </div>
          ) : (
            <form action={enrollAction}>
              <button
                type="submit"
                style={{
                  appearance: 'none',
                  border: 'none',
                  background: '#111',
                  color: '#fff',
                  padding: '12px 22px',
                  borderRadius: 14,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: GILD_FONTS.sans,
                }}
              >
                Enroll in course
              </button>
            </form>
          )}

          {isAdminOrOwner && (
            <Link
              href={`/c/${community.slug}/courses/${course.id}/manage`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 22px',
                borderRadius: 14,
                background: 'transparent',
                border: '1px solid oklch(0.90 0.01 250)',
                color: '#111',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                fontFamily: GILD_FONTS.sans,
              }}
            >
              Manage Course
            </Link>
          )}
        </div>
      </header>

      {/* Modules + Lessons */}
      {course.modules.length === 0 ? (
        <EmptyState isAdminOrOwner={isAdminOrOwner} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {course.modules
            .filter((m) => {
              if (isAdminOrOwner) return true;
              return m.lessons.some((l) => l.is_published);
            })
            .map((module, idx) => {
              const visibleLessons = isAdminOrOwner
                ? module.lessons
                : module.lessons.filter((l) => l.is_published);

              return (
                <section
                  key={module.id}
                  style={{
                    border: '1px solid oklch(0.92 0.01 250)',
                    borderRadius: 12,
                    background: '#fff',
                    overflow: 'hidden',
                  }}
                >
                  <header
                    style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid oklch(0.95 0.005 250)',
                      background: 'oklch(0.99 0.002 250)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'oklch(0.55 0.02 250)',
                        fontFamily: GILD_FONTS.mono,
                        letterSpacing: '0.08em',
                      }}
                    >
                      MODULE {String(idx + 1).padStart(2, '0')}
                    </span>
                    <h2
                      style={{
                        fontFamily: GILD_FONTS.display,
                        fontSize: 18,
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                        margin: 0,
                        color: '#111',
                        flex: 1,
                      }}
                    >
                      {module.title}
                    </h2>
                    <span
                      style={{
                        fontSize: 12,
                        color: 'oklch(0.55 0.02 250)',
                        fontFamily: GILD_FONTS.mono,
                      }}
                    >
                      {visibleLessons.length}
                    </span>
                  </header>

                  {visibleLessons.length === 0 ? (
                    <div
                      style={{
                        padding: '20px',
                        fontSize: 13,
                        color: 'oklch(0.55 0.02 250)',
                        fontStyle: 'italic',
                      }}
                    >
                      No lessons yet.
                    </div>
                  ) : (
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                      {visibleLessons.map((lesson, lIdx) => {
                        const canOpen = isEnrolled || isAdminOrOwner;
                        const inner = (
                          <>
                            <span
                              style={{
                                fontSize: 11,
                                color: 'oklch(0.55 0.02 250)',
                                fontFamily: GILD_FONTS.mono,
                                minWidth: 28,
                              }}
                            >
                              {String(lIdx + 1).padStart(2, '0')}
                            </span>
                            <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>
                              {lesson.title}
                            </span>
                            {!lesson.is_published && (
                              <span
                                style={{
                                  padding: '2px 7px',
                                  borderRadius: 999,
                                  fontSize: 9,
                                  fontWeight: 700,
                                  background: 'oklch(0.95 0.01 250)',
                                  color: 'oklch(0.45 0.02 250)',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.06em',
                                  fontFamily: GILD_FONTS.mono,
                                }}
                              >
                                Draft
                              </span>
                            )}
                            {lesson.video_url && (
                              <span
                                title="Has video"
                                style={{
                                  fontSize: 11,
                                  color: 'oklch(0.55 0.02 250)',
                                  fontFamily: GILD_FONTS.mono,
                                }}
                              >
                                ▶
                              </span>
                            )}
                          </>
                        );

                        const rowStyle: React.CSSProperties = {
                          padding: '14px 20px',
                          borderTop: lIdx === 0 ? 'none' : '1px solid oklch(0.96 0.005 250)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          color: '#111',
                          textDecoration: 'none',
                        };

                        return (
                          <li key={lesson.id} style={{ margin: 0, padding: 0 }}>
                            {canOpen ? (
                              <Link
                                href={`/c/${community.slug}/courses/${course.id}/${lesson.id}`}
                                style={rowStyle}
                              >
                                {inner}
                              </Link>
                            ) : (
                              <div style={rowStyle}>{inner}</div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })}
        </div>
      )}
    </div>
  );
}

function EmptyState({ isAdminOrOwner }: { isAdminOrOwner: boolean }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '60px 20px',
        border: '1px dashed oklch(0.90 0.01 250)',
        borderRadius: 14,
        background: 'oklch(0.99 0.002 250)',
      }}
    >
      <h2
        style={{
          fontFamily: GILD_FONTS.display,
          fontSize: 20,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          margin: '0 0 8px',
          color: '#111',
          lineHeight: 1,
        }}
      >
        No content yet
      </h2>
      <p style={{ fontSize: 14, color: 'oklch(0.55 0.02 250)', margin: 0, lineHeight: 1.5 }}>
        {isAdminOrOwner
          ? 'Add modules and lessons to populate this course.'
          : 'Course content will appear here once published.'}
      </p>
    </div>
  );
}
