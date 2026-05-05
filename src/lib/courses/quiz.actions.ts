'use server';

import { z } from 'zod';
import { getSupabaseServerClient } from '../auth/server';
import type { Json } from '../supabase/types';
import type {
  SubmitQuizInput,
  QuizAttemptResult,
  QuizAnswerBreakdown,
} from './quiz.types';

// ─── Zod schema ───────────────────────────────────────────────────────────────

const submitQuizSchema = z.object({
  quizId: z.string().uuid(),
  enrollmentId: z.string().uuid(),
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        selectedOptionId: z.string().min(1),
      }),
    )
    .min(1),
});

// ─── submitQuiz ───────────────────────────────────────────────────────────────
// Validates input, verifies ownership, scores server-side, inserts attempt.
// Never trusts client-supplied correctness or score.
// quiz_attempts has no unique constraint — retryable quizzes are supported.

export async function submitQuiz(input: SubmitQuizInput): Promise<QuizAttemptResult> {
  // Step 1 — validate input and auth
  const parsed = submitQuizSchema.safeParse(input);
  if (!parsed.success) throw new Error('[gild] invalid input');

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('[gild] not authenticated');

  const { quizId, enrollmentId, answers } = parsed.data;

  // Step 2 — verify enrollment ownership
  // Explicit user_id check on top of RLS — defense in depth
  const { data: enrollment, error: enrollErr } = await supabase
    .from('enrollments')
    .select('id, course_id')
    .eq('id', enrollmentId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (enrollErr) throw new Error(enrollErr.message);
  if (!enrollment) throw new Error('[gild] enrollment not found');

  // Step 3 — verify quiz belongs to this enrollment's course
  // Chain: quizzes.lesson_id → lessons.module_id → modules.course_id
  const { data: quiz, error: quizErr } = await supabase
    .from('quizzes')
    .select('id, lesson_id, pass_score')
    .eq('id', quizId)
    .maybeSingle();
  if (quizErr) throw new Error(quizErr.message);
  if (!quiz) throw new Error('[gild] quiz not found');

  const { data: lesson, error: lessonErr } = await supabase
    .from('lessons')
    .select('module_id')
    .eq('id', quiz.lesson_id)
    .maybeSingle();
  if (lessonErr) throw new Error(lessonErr.message);
  if (!lesson) throw new Error('[gild] quiz not found');

  const { data: mod, error: modErr } = await supabase
    .from('modules')
    .select('course_id')
    .eq('id', lesson.module_id)
    .maybeSingle();
  if (modErr) throw new Error(modErr.message);
  if (!mod || mod.course_id !== enrollment.course_id) {
    throw new Error('[gild] quiz does not belong to this course');
  }

  // Step 4 — retryable: no unique constraint on quiz_attempts; new attempt always allowed

  // Step 5 — fetch correct answers server-side; client-supplied answers never trusted
  const { data: questionRows, error: qErr } = await supabase
    .from('quiz_questions')
    .select('id, body, options, correct_id, position')
    .eq('quiz_id', quizId)
    .order('position', { ascending: true });
  if (qErr) throw new Error(qErr.message);
  if (!questionRows || questionRows.length === 0) throw new Error('[gild] quiz has no questions');

  const answerMap = new Map(answers.map((a) => [a.questionId, a.selectedOptionId]));

  let correctCount = 0;
  const breakdown: QuizAnswerBreakdown[] = questionRows.map((q) => {
    const rawOptions = q.options as { id: string; text: string }[];
    const selectedOptionId = answerMap.get(q.id) ?? '';
    const isCorrect = selectedOptionId === q.correct_id;
    if (isCorrect) correctCount++;
    return {
      questionId: q.id,
      questionBody: q.body,
      options: rawOptions.map(({ id, text }) => ({ id, text })),
      selectedOptionId,
      correctId: q.correct_id,
      isCorrect,
    };
  });

  const total = questionRows.length;
  const score = Math.round((correctCount / total) * 100);
  const passed = score >= quiz.pass_score;

  // Step 6 — INSERT quiz_attempt using exact columns from migration 00012.
  // Immutability enforced by RLS (UPDATE locked to platform_admin only).
  const { data: attempt, error: insertErr } = await supabase
    .from('quiz_attempts')
    .insert({
      quiz_id: quizId,
      user_id: user.id,
      enrollment_id: enrollmentId,
      answers: breakdown as unknown as Json,
      score,
      passed,
    })
    .select('id')
    .single();
  if (insertErr) throw new Error(insertErr.message);

  // Step 7 — return result
  return {
    attemptId: attempt.id,
    quizId,
    score,
    passed,
    totalQuestions: total,
    correctCount,
    breakdown,
  };
}
