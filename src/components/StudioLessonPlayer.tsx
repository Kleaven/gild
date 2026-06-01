'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { GILD_FONTS } from '@/components/gild';
import type { Lesson } from '@/lib/courses';
import type { QuizWithQuestions, QuizAttemptResult } from '@/lib/courses';

type LessonNavStub = {
  id: string;
  title: string;
};

interface StudioLessonPlayerProps {
  community: { id: string; slug: string; name: string };
  course: { id: string; title: string };
  lesson: Lesson;
  prevLesson: LessonNavStub | null;
  nextLesson: LessonNavStub | null;
  isCompleted: boolean;
  isEnrolled: boolean;
  quiz: QuizWithQuestions | null;
  enrollmentId: string | null;
  hideManualComplete?: boolean;
  nextLocked?: boolean;
  courseComplete?: boolean;
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
  enrollmentId,
  hideManualComplete = false,
  nextLocked = false,
  courseComplete = false,
  completeAction,
  submitQuizAction,
}: StudioLessonPlayerProps) {
  const videoEmbed = toEmbedUrl(lesson.video_url);
  const [completing, setCompleting] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [, startTransition] = useTransition();

  function handleComplete() {
    if (completing) return;
    setCompleting(true);
    startTransition(async () => {
      try {
        await completeAction();
        setJustCompleted(true);
      } finally {
        setCompleting(false);
      }
    });
  }

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
          href={`/c/${community.slug}/courses/${course.id}`}
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
          {isCompleted || justCompleted ? (
            <div
              style={{
                position: 'relative',
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
                animation: justCompleted ? 'gild-pop 0.5s cubic-bezier(0.22, 1, 0.36, 1)' : undefined,
              }}
            >
              {justCompleted && <Confetti />}
              <span>✓</span> {justCompleted ? 'Lesson complete!' : 'Completed'}
            </div>
          ) : hideManualComplete ? (
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'oklch(0.50 0.02 250)',
                padding: '10px 0',
              }}
            >
              Pass the quiz above to complete this lesson.
            </div>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              disabled={completing}
              style={{
                appearance: 'none',
                border: 'none',
                background: completing ? 'oklch(0.75 0.01 250)' : '#111',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: 14,
                fontSize: 14,
                fontWeight: 600,
                cursor: completing ? 'default' : 'pointer',
                fontFamily: GILD_FONTS.sans,
              }}
            >
              {completing ? 'Saving…' : 'Mark complete'}
            </button>
          )}

          {/* Prev / Next */}
          <div style={{ display: 'flex', gap: 10 }}>
            {prevLesson ? (
              <Link
                href={`/c/${community.slug}/courses/${course.id}/${prevLesson.id}`}
                style={navLinkStyle()}
              >
                ← Previous
              </Link>
            ) : (
              <span style={navLinkStyle(true)}>← Previous</span>
            )}
            {nextLesson && !nextLocked ? (
              <Link
                href={`/c/${community.slug}/courses/${course.id}/${nextLesson.id}`}
                style={navLinkStyle()}
              >
                Next →
              </Link>
            ) : nextLesson && nextLocked ? (
              <span style={navLinkStyle(true)} title="Complete this module to unlock">
                🔒 Next
              </span>
            ) : (
              <span style={navLinkStyle(true)}>Next →</span>
            )}
          </div>
        </div>
      )}

      {/* Course-complete celebration — the finish-line moment. */}
      {isEnrolled && courseComplete && (
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            marginTop: 24,
            borderRadius: 16,
            padding: '28px 24px',
            textAlign: 'center',
            background:
              'linear-gradient(135deg, oklch(0.95 0.06 150), oklch(0.96 0.05 280))',
            border: '1px solid oklch(0.85 0.08 150)',
          }}
        >
          <Confetti />
          <div style={{ fontSize: 40, lineHeight: 1, marginBottom: 8 }} aria-hidden>
            🎉
          </div>
          <h2
            style={{
              fontFamily: GILD_FONTS.display,
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              margin: '0 0 6px',
              color: 'oklch(0.30 0.10 150)',
            }}
          >
            Course complete!
          </h2>
          <p
            style={{
              margin: '0 0 16px',
              fontSize: 15,
              color: 'oklch(0.40 0.06 150)',
              fontWeight: 600,
            }}
          >
            You finished every module of {course.title}. Congratulations!
          </p>
          <Link
            href={`/c/${community.slug}/courses/${course.id}`}
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              borderRadius: 14,
              background: 'oklch(0.32 0.10 150)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
              fontFamily: GILD_FONTS.sans,
            }}
          >
            Back to course
          </Link>
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

// ─── Celebration confetti ──────────────────────────────────────────────────────
// Pure CSS/SVG burst — no dependency, no layout shift (absolutely positioned).

const CONFETTI_COLORS = [
  'oklch(0.72 0.18 150)',
  'oklch(0.75 0.16 90)',
  'oklch(0.70 0.17 250)',
  'oklch(0.72 0.19 30)',
  'oklch(0.74 0.16 320)',
];

function Confetti() {
  const pieces = React.useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.3,
        duration: 1.6 + Math.random() * 1.1,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + Math.random() * 6,
        rotate: Math.random() * 360,
      })),
    [],
  );
  return (
    <div
      aria-hidden
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}
    >
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: -12,
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.6,
            background: p.color,
            borderRadius: 1,
            transform: `rotate(${p.rotate}deg)`,
            animation: `gild-confetti ${p.duration}s linear ${p.delay}s forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes gild-confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(220px) rotate(540deg); opacity: 0; }
        }
        @keyframes gild-pop {
          0% { transform: scale(0); }
          70% { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
        @keyframes gild-check {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
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
          {result.passed ? (
            <div
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 16,
                padding: '28px 24px',
                marginBottom: 8,
                textAlign: 'center',
                background:
                  'linear-gradient(135deg, oklch(0.95 0.06 150), oklch(0.97 0.03 200))',
                border: '1px solid oklch(0.85 0.08 150)',
              }}
            >
              <Confetti />
              <div
                style={{
                  width: 64,
                  height: 64,
                  margin: '0 auto 14px',
                  borderRadius: '50%',
                  background: 'oklch(0.62 0.16 150)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px oklch(0.62 0.16 150 / 0.4)',
                  animation: 'gild-pop 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="#fff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      strokeDasharray: 28,
                      strokeDashoffset: 28,
                      animation: 'gild-check 0.4s ease-out 0.25s forwards',
                    }}
                  />
                </svg>
              </div>
              <h2
                style={{
                  fontFamily: GILD_FONTS.display,
                  fontSize: 28,
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  margin: '0 0 6px',
                  color: 'oklch(0.32 0.10 150)',
                }}
              >
                Passed! 🎉
              </h2>
              <div style={{ fontSize: 15, color: 'oklch(0.40 0.06 150)', fontWeight: 600 }}>
                Scored <strong>{result.score}%</strong> · {result.correctCount} of{' '}
                {result.totalQuestions} correct
              </div>
            </div>
          ) : (
            <>
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
                Not quite yet
              </h2>
              <div style={{ fontSize: 15, color: 'oklch(0.40 0.02 250)' }}>
                Scored <strong>{result.score}%</strong> · {result.correctCount} of{' '}
                {result.totalQuestions} correct · need{' '}
                <strong>{quiz.passScore}%</strong> to pass. Review below and try again.
              </div>
            </>
          )}
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
