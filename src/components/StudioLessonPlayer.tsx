'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GILD_FONTS } from '@/components/gild';
import type { Lesson } from '@/lib/courses';
import type { QuizWithQuestions, QuizAttemptResult } from '@/lib/courses';

type LessonNavStub = {
  id: string;
  title: string;
};

interface StudioLessonPlayerProps {
  community: { id: string; name: string };
  course: { id: string; title: string };
  lesson: Lesson;
  prevLesson: LessonNavStub | null;
  nextLesson: LessonNavStub | null;
  isCompleted: boolean;
  isEnrolled: boolean;
  quiz: QuizWithQuestions | null;
  quizAlreadyPassed: boolean;
  enrollmentId: string | null;
  completeAction: () => Promise<void>;
  submitQuizAction: (
    answersJson: string,
  ) => Promise<QuizAttemptResult>;
}

export function StudioLessonPlayer({
  community,
  course,
  lesson,
  prevLesson,
  nextLesson,
  isCompleted,
  isEnrolled,
  quiz,
  quizAlreadyPassed,
  enrollmentId,
  completeAction,
  submitQuizAction,
}: StudioLessonPlayerProps) {
  const videoEmbed = toEmbedUrl(lesson.video_url);

  return (
    <div
      style={{
        fontFamily: GILD_FONTS.sans,
        padding: '32px 28px 60px',
        maxWidth: 820,
        margin: '0 auto',
        color: '#111',
      }}
    >
      {/* Breadcrumb */}
      <nav style={{ marginBottom: 20, fontSize: 13, fontFamily: GILD_FONTS.mono }}>
        <Link
          href={`/c/${community.id}/courses/${course.id}`}
          style={{ color: 'oklch(0.55 0.02 250)', textDecoration: 'none' }}
        >
          ← {course.title}
        </Link>
      </nav>

      {/* Title */}
      <h1
        style={{
          fontFamily: GILD_FONTS.display,
          fontSize: 36,
          fontWeight: 800,
          letterSpacing: '-0.04em',
          margin: '0 0 24px',
          lineHeight: 1.1,
          color: '#111',
        }}
      >
        {lesson.title}
      </h1>

      {/* Video */}
      {videoEmbed && (
        <div
          style={{
            position: 'relative',
            width: '100%',
            paddingBottom: '56.25%',
            background: '#000',
            borderRadius: 12,
            overflow: 'hidden',
            marginBottom: 28,
            border: '1px solid oklch(0.92 0.01 250)',
          }}
        >
          <iframe
            src={videoEmbed}
            title={lesson.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 0,
            }}
          />
        </div>
      )}

      {/* Body */}
      {lesson.body && (
        <div
          style={{
            fontSize: 16,
            lineHeight: 1.7,
            color: 'oklch(0.25 0.01 250)',
            whiteSpace: 'pre-wrap',
            marginBottom: 32,
          }}
        >
          {lesson.body}
        </div>
      )}

      {/* Quiz panel */}
      {quiz && enrollmentId && (
        <QuizPanel
          quiz={quiz}
          enrollmentId={enrollmentId}
          submitAction={submitQuizAction}
        />
      )}

      {/* Mark complete */}
      {isEnrolled && (
        <div
          style={{
            marginTop: 32,
            padding: '20px 0',
            borderTop: '1px solid oklch(0.92 0.01 250)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          {isCompleted ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                borderRadius: 14,
                background: 'oklch(0.96 0.04 145)',
                border: '1px solid oklch(0.85 0.06 145)',
                color: 'oklch(0.35 0.10 145)',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <span>✓</span> Completed
            </div>
          ) : quiz && quizAlreadyPassed ? null : (
            <form action={completeAction}>
              <button
                type="submit"
                style={{
                  appearance: 'none',
                  border: 'none',
                  background: '#111',
                  color: '#fff',
                  padding: '10px 20px',
                  borderRadius: 14,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: GILD_FONTS.sans,
                }}
              >
                Mark complete
              </button>
            </form>
          )}

          {/* Prev / Next */}
          <div style={{ display: 'flex', gap: 10 }}>
            {prevLesson ? (
              <Link
                href={`/c/${community.id}/courses/${course.id}/${prevLesson.id}`}
                style={navLinkStyle()}
              >
                ← Previous
              </Link>
            ) : (
              <span style={navLinkStyle(true)}>← Previous</span>
            )}
            {nextLesson ? (
              <Link
                href={`/c/${community.id}/courses/${course.id}/${nextLesson.id}`}
                style={navLinkStyle()}
              >
                Next →
              </Link>
            ) : (
              <span style={navLinkStyle(true)}>Next →</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function navLinkStyle(disabled: boolean = false): React.CSSProperties {
  return {
    padding: '10px 16px',
    borderRadius: 14,
    border: '1px solid oklch(0.90 0.01 250)',
    background: '#fff',
    color: disabled ? 'oklch(0.75 0.01 250)' : '#111',
    fontSize: 13,
    fontWeight: 600,
    textDecoration: 'none',
    fontFamily: GILD_FONTS.sans,
    pointerEvents: disabled ? 'none' : 'auto',
    cursor: disabled ? 'default' : 'pointer',
  };
}

// Map a YouTube / Vimeo / generic URL to an embeddable iframe src.
// Returns null if the URL cannot be embedded.
function toEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');

    // YouTube watch URL
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const videoId = u.searchParams.get('v');
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    // YouTube short URL
    if (host === 'youtu.be') {
      const videoId = u.pathname.slice(1);
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    // YouTube embed URL — already embeddable
    if (host === 'youtube.com' && u.pathname.startsWith('/embed/')) {
      return url;
    }
    // Vimeo
    if (host === 'vimeo.com') {
      const videoId = u.pathname.replace(/^\//, '').split('/')[0] ?? '';
      if (/^\d+$/.test(videoId)) return `https://player.vimeo.com/video/${videoId}`;
    }
    if (host === 'player.vimeo.com') {
      return url;
    }
  } catch {
    return null;
  }
  return null;
}

// ─── Quiz panel ────────────────────────────────────────────────────────────────

function QuizPanel({
  quiz,
  enrollmentId,
  submitAction,
}: {
  quiz: QuizWithQuestions;
  enrollmentId: string;
  submitAction: (answersJson: string) => Promise<QuizAttemptResult>;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizAttemptResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allAnswered = quiz.questions.every((q) => answers[q.id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allAnswered || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = quiz.questions.map((q) => ({
        questionId: q.id,
        selectedOptionId: answers[q.id] as string,
      }));
      const r = await submitAction(JSON.stringify(payload));
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setAnswers({});
    setResult(null);
    setError(null);
  }

  // Result view
  if (result) {
    return (
      <section
        style={{
          border: '1px solid oklch(0.92 0.01 250)',
          borderRadius: 12,
          padding: 24,
          marginBottom: 32,
          background: '#fff',
        }}
      >
        <header style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'oklch(0.55 0.02 250)',
              fontFamily: GILD_FONTS.mono,
              letterSpacing: '0.08em',
              marginBottom: 6,
            }}
          >
            QUIZ RESULT
          </div>
          <h2
            style={{
              fontFamily: GILD_FONTS.display,
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              margin: '0 0 12px',
              color: '#111',
            }}
          >
            {result.passed ? 'Passed' : 'Not yet'}
          </h2>
          <div style={{ fontSize: 15, color: 'oklch(0.40 0.02 250)' }}>
            Score: <strong>{result.score}%</strong> ·{' '}
            {result.correctCount} of {result.totalQuestions} correct
          </div>
        </header>

        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px' }}>
          {result.breakdown.map((b, idx) => {
            const correctOption = b.options.find((o) => o.id === b.correctId);
            const selectedOption = b.options.find((o) => o.id === b.selectedOptionId);
            return (
              <li
                key={b.questionId}
                style={{
                  padding: '14px 0',
                  borderTop: idx === 0 ? 'none' : '1px solid oklch(0.95 0.005 250)',
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 8,
                    display: 'flex',
                    gap: 8,
                  }}
                >
                  <span style={{ color: b.isCorrect ? 'oklch(0.45 0.15 145)' : '#c00' }}>
                    {b.isCorrect ? '✓' : '✗'}
                  </span>
                  <span>{b.questionBody}</span>
                </div>
                <div style={{ fontSize: 13, color: 'oklch(0.40 0.02 250)', paddingLeft: 24 }}>
                  Your answer: {selectedOption?.text ?? '—'}
                  {!b.isCorrect && correctOption && (
                    <>
                      {' '}· Correct: <strong>{correctOption.text}</strong>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={reset}
          style={{
            appearance: 'none',
            border: '1px solid oklch(0.90 0.01 250)',
            background: '#fff',
            color: '#111',
            padding: '8px 14px',
            borderRadius: 14,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: GILD_FONTS.sans,
          }}
        >
          Retake quiz
        </button>
      </section>
    );
  }

  // Submission form
  return (
    <section
      style={{
        border: '1px solid oklch(0.92 0.01 250)',
        borderRadius: 12,
        padding: 24,
        marginBottom: 32,
        background: '#fff',
      }}
    >
      <header style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'oklch(0.55 0.02 250)',
            fontFamily: GILD_FONTS.mono,
            letterSpacing: '0.08em',
            marginBottom: 6,
          }}
        >
          QUIZ
        </div>
        <h2
          style={{
            fontFamily: GILD_FONTS.display,
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            margin: 0,
            color: '#111',
          }}
        >
          {quiz.title}
        </h2>
      </header>

      <form onSubmit={onSubmit}>
        <ol style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', counterReset: 'q' }}>
          {quiz.questions.map((q, qIdx) => (
            <li
              key={q.id}
              style={{
                padding: '16px 0',
                borderTop: qIdx === 0 ? 'none' : '1px solid oklch(0.95 0.005 250)',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'oklch(0.55 0.02 250)',
                  fontFamily: GILD_FONTS.mono,
                  letterSpacing: '0.08em',
                  marginBottom: 8,
                }}
              >
                Q{String(qIdx + 1).padStart(2, '0')}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, lineHeight: 1.4 }}>
                {q.body}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {q.options.map((opt) => {
                  const checked = answers[q.id] === opt.id;
                  return (
                    <label
                      key={opt.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 14px',
                        border: `1px solid ${checked ? '#111' : 'oklch(0.92 0.01 250)'}`,
                        borderRadius: 14,
                        cursor: 'pointer',
                        background: checked ? 'oklch(0.97 0.005 250)' : '#fff',
                      }}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={opt.id}
                        checked={checked}
                        onChange={() =>
                          setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))
                        }
                        style={{ margin: 0 }}
                      />
                      <span style={{ fontSize: 14 }}>{opt.text}</span>
                    </label>
                  );
                })}
              </div>
            </li>
          ))}
        </ol>

        {error && (
          <div
            style={{
              fontSize: 13,
              color: '#c00',
              padding: '10px 14px',
              borderRadius: 12,
              background: 'oklch(0.97 0.02 25)',
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!allAnswered || submitting}
          style={{
            appearance: 'none',
            border: 'none',
            background: !allAnswered || submitting ? 'oklch(0.75 0.01 250)' : '#111',
            color: '#fff',
            padding: '12px 22px',
            borderRadius: 14,
            fontSize: 14,
            fontWeight: 600,
            cursor: !allAnswered || submitting ? 'default' : 'pointer',
            fontFamily: GILD_FONTS.sans,
          }}
        >
          {submitting ? 'Submitting…' : 'Submit answers'}
        </button>

        {/* Hidden field for enrollment context — included so the form has the
            full data shape even though the action receives it via closure. */}
        <input type="hidden" name="enrollmentId" value={enrollmentId} readOnly />
      </form>
    </section>
  );
}
