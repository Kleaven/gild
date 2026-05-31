'use client';

import React, { useEffect, useState } from 'react';
import { GILD_FONTS } from '@/components/gild';
import { loadQuizForEdit, saveQuiz, deleteQuiz } from '@/app/actions/courses';
import type { EditableQuizQuestion } from '@/lib/courses';
import { X, Save, Plus, Trash2, Check } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

interface QuizEditorModalProps {
  communityId: string;
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function makeOption() {
  return { id: crypto.randomUUID(), text: '' };
}

function makeQuestion(position: number): EditableQuizQuestion {
  const options = [makeOption(), makeOption()];
  return {
    id: `temp-${crypto.randomUUID()}`,
    body: '',
    options,
    correctId: options[0]!.id,
    position,
  };
}

export function QuizEditorModal({
  communityId,
  courseId,
  lessonId,
  lessonTitle,
  isOpen,
  onClose,
  onSaved,
}: QuizEditorModalProps) {
  const [loading, setLoading] = useState(true);
  const [hasExisting, setHasExisting] = useState(false);
  const [title, setTitle] = useState('');
  const [passScore, setPassScore] = useState(80);
  const [questions, setQuestions] = useState<EditableQuizQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Load the existing quiz (or seed a blank one) each time the modal opens.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadQuizForEdit(lessonId)
      .then((quiz) => {
        if (cancelled) return;
        if (quiz) {
          setHasExisting(true);
          setTitle(quiz.title);
          setPassScore(quiz.passScore);
          setQuestions(quiz.questions);
        } else {
          setHasExisting(false);
          setTitle(`${lessonTitle} Quiz`);
          setPassScore(80);
          setQuestions([makeQuestion(0)]);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load quiz');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, lessonId, lessonTitle]);

  if (!isOpen) return null;

  function updateQuestion(qid: string, patch: Partial<EditableQuizQuestion>) {
    setQuestions((prev) => prev.map((q) => (q.id === qid ? { ...q, ...patch } : q)));
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, makeQuestion(prev.length)]);
  }

  function removeQuestion(qid: string) {
    setQuestions((prev) => (prev.length <= 1 ? prev : prev.filter((q) => q.id !== qid)));
  }

  function addOption(qid: string) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qid && q.options.length < 6
          ? { ...q, options: [...q.options, makeOption()] }
          : q,
      ),
    );
  }

  function removeOption(qid: string, oid: string) {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qid || q.options.length <= 2) return q;
        const options = q.options.filter((o) => o.id !== oid);
        // If the correct option was removed, fall back to the first remaining.
        const correctId = q.correctId === oid ? options[0]!.id : q.correctId;
        return { ...q, options, correctId };
      }),
    );
  }

  function updateOptionText(qid: string, oid: string, text: string) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qid
          ? { ...q, options: q.options.map((o) => (o.id === oid ? { ...o, text } : o)) }
          : q,
      ),
    );
  }

  function validate(): string | null {
    if (!title.trim()) return 'Give the quiz a title.';
    if (passScore < 1 || passScore > 100) return 'Pass score must be between 1 and 100.';
    if (questions.length === 0) return 'Add at least one question.';
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]!;
      if (!q.body.trim()) return `Question ${i + 1} needs a prompt.`;
      if (q.options.length < 2) return `Question ${i + 1} needs at least two answers.`;
      if (q.options.some((o) => !o.text.trim())) return `Question ${i + 1} has an empty answer.`;
      if (!q.options.some((o) => o.id === q.correctId)) {
        return `Question ${i + 1} needs a correct answer selected.`;
      }
    }
    return null;
  }

  async function handleSave() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await saveQuiz(
        {
          lessonId,
          title: title.trim(),
          passScore,
          questions: questions.map((q) => ({
            body: q.body.trim(),
            options: q.options.map((o) => ({ id: o.id, text: o.text.trim() })),
            correctId: q.correctId,
          })),
        },
        communityId,
        courseId,
      );
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save quiz');
    } finally {
      setSaving(false);
    }
  }

  async function performDelete() {
    setError(null);
    setDeleting(true);
    try {
      await deleteQuiz(lessonId, communityId, courseId);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete quiz');
      setConfirmDeleteOpen(false);
      setDeleting(false);
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1100,
      background: 'rgba(0,0,0,0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: '#fff',
        width: '100%',
        maxWidth: 760,
        maxHeight: '90vh',
        borderRadius: 24,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        overflow: 'hidden',
        animation: 'gild-modal-in 0.3s ease-out',
      }}>
        <header style={{
          padding: '20px 24px',
          borderBottom: '1px solid oklch(0.95 0.005 250)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ fontFamily: GILD_FONTS.display, fontSize: 20, fontWeight: 800, margin: 0 }}>Lesson Quiz</h2>
            <p style={{ fontSize: 13, color: 'oklch(0.55 0.02 250)', margin: 0 }}>
              Multiple-choice. Learners must pass to complete the lesson.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'oklch(0.55 0.02 250)' }}>
            <X size={24} />
          </button>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {loading ? (
            <p style={{ fontSize: 14, color: 'oklch(0.55 0.02 250)', textAlign: 'center', padding: '40px 0' }}>
              Loading quiz…
            </p>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: '2 1 240px' }}>
                  <label style={labelStyle}>Quiz Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={inputStyle}
                    maxLength={200}
                    placeholder="e.g. Module 1 Checkpoint"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: '1 1 120px' }}>
                  <label style={labelStyle}>Pass Score (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={passScore}
                    onChange={(e) => setPassScore(Number(e.target.value))}
                    style={inputStyle}
                  />
                </div>
              </div>

              {questions.map((q, qi) => (
                <div key={q.id} style={{
                  border: '1px solid oklch(0.92 0.01 250)',
                  borderRadius: 16,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <label style={{ ...labelStyle, fontSize: 12 }}>Question {qi + 1}</label>
                    <button
                      onClick={() => removeQuestion(q.id)}
                      disabled={questions.length <= 1}
                      title="Remove question"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: questions.length <= 1 ? 'default' : 'pointer',
                        color: questions.length <= 1 ? 'oklch(0.85 0.01 250)' : 'oklch(0.50 0.16 25)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>

                  <textarea
                    value={q.body}
                    onChange={(e) => updateQuestion(q.id, { body: e.target.value })}
                    rows={2}
                    maxLength={1000}
                    placeholder="Type the question prompt…"
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                  />

                  <p style={{ fontSize: 12, color: 'oklch(0.55 0.02 250)', margin: 0 }}>
                    Select the radio button to mark the correct answer.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {q.options.map((o) => {
                      const isCorrect = o.id === q.correctId;
                      return (
                        <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <button
                            type="button"
                            onClick={() => updateQuestion(q.id, { correctId: o.id })}
                            title={isCorrect ? 'Correct answer' : 'Mark correct'}
                            style={{
                              width: 24,
                              height: 24,
                              flexShrink: 0,
                              borderRadius: 999,
                              border: isCorrect ? 'none' : '1.5px solid oklch(0.85 0.01 250)',
                              background: isCorrect ? 'oklch(0.55 0.15 150)' : '#fff',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                          >
                            {isCorrect && <Check size={14} strokeWidth={3} />}
                          </button>
                          <input
                            type="text"
                            value={o.text}
                            onChange={(e) => updateOptionText(q.id, o.id, e.target.value)}
                            maxLength={200}
                            placeholder="Answer option"
                            style={{ ...inputStyle, flex: 1 }}
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(q.id, o.id)}
                            disabled={q.options.length <= 2}
                            title="Remove option"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: q.options.length <= 2 ? 'default' : 'pointer',
                              color: q.options.length <= 2 ? 'oklch(0.85 0.01 250)' : 'oklch(0.50 0.16 25)',
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {q.options.length < 6 && (
                    <button
                      type="button"
                      onClick={() => addOption(q.id)}
                      style={{
                        alignSelf: 'flex-start',
                        background: 'transparent',
                        border: 'none',
                        color: 'oklch(0.45 0.02 250)',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: 0,
                      }}
                    >
                      <Plus size={14} /> Add option
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addQuestion}
                style={{
                  alignSelf: 'flex-start',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: '1px solid oklch(0.90 0.01 250)',
                  background: 'transparent',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} /> Add Question
              </button>

              {error && (
                <p style={{ color: '#c00', fontSize: 14, margin: 0 }}>{error}</p>
              )}
            </>
          )}
        </div>

        <footer style={{
          padding: '20px 24px',
          borderTop: '1px solid oklch(0.95 0.005 250)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}>
          <div>
            {hasExisting && !loading && (
              <button
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={deleting || saving}
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  background: 'transparent',
                  border: '1px solid oklch(0.88 0.06 25)',
                  color: 'oklch(0.45 0.16 25)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: deleting ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Trash2 size={16} /> {deleting ? 'Deleting…' : 'Delete Quiz'}
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                background: 'transparent',
                border: '1px solid oklch(0.90 0.01 250)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              style={{
                padding: '10px 24px',
                borderRadius: 10,
                background: '#111',
                color: '#fff',
                border: 'none',
                fontSize: 14,
                fontWeight: 700,
                cursor: saving || loading ? 'default' : 'pointer',
                opacity: saving || loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {saving ? 'Saving…' : <><Save size={18} /> Save Quiz</>}
            </button>
          </div>
        </footer>
      </div>
      <style>{`
        @keyframes gild-modal-in {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete quiz?"
        message="This removes the quiz, all of its questions, and every learner attempt. This cannot be undone."
        confirmLabel="Delete Quiz"
        busy={deleting}
        onConfirm={performDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: 'oklch(0.40 0.02 250)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid oklch(0.90 0.01 250)',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};
