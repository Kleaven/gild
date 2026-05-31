'use server';

import { z } from 'zod';
import { getSupabaseServerClient } from '../auth/server';
import { assertFlag } from '@/lib/feature-flags';
import type { Json } from '../supabase/types';
import type {
  SubmitQuizInput,
  QuizAttemptResult,
  QuizAnswerBreakdown,
  SaveQuizInput,
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

  // Resolve communityId and gate on feature flag before any write
  const { data: courseForFlag, error: courseErr } = await supabase
    .from('courses')
    .select('community_id')
    .eq('id', enrollment.course_id)
    .maybeSingle();
  if (courseErr || !courseForFlag) throw new Error('[gild] course not found');
  await assertFlag('quizzes', courseForFlag.community_id);

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

// ─── Authoring: saveQuiz ──────────────────────────────────────────────────────
// Full upsert of a lesson's quiz. Creates the quiz row if absent, then replaces
// the entire question set. Admin role is enforced by RLS on every write; we add
// an application-layer community resolution to gate the feature flag. correct_id
// is validated to be one of the question's own option ids.

const saveQuizSchema = z.object({
  lessonId: z.string().uuid(),
  title: z.string().min(1).max(200),
  passScore: z.number().int().min(1).max(100),
  questions: z
    .array(
      z
        .object({
          body: z.string().min(1).max(1000),
          options: z
            .array(
              z.object({
                id: z.string().min(1),
                text: z.string().min(1).max(200),
              }),
            )
            .min(2)
            .max(6),
          correctId: z.string().min(1),
        })
        .refine((q) => q.options.some((o) => o.id === q.correctId), {
          message: 'correctId must match one of the question options',
        }),
    )
    .min(1)
    .max(50),
});

export async function saveQuiz(input: SaveQuizInput): Promise<{ quizId: string }> {
  const parsed = saveQuizSchema.safeParse(input);
  if (!parsed.success) throw new Error('[gild] invalid quiz input');

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('[gild] not authenticated');

  const { lessonId, title, passScore, questions } = parsed.data;

  // Resolve community for the feature-flag gate. RLS enforces the admin role
  // on the quiz/question writes themselves.
  const { data: lesson, error: lessonErr } = await supabase
    .from('lessons')
    .select('module_id')
    .eq('id', lessonId)
    .maybeSingle();
  if (lessonErr) throw new Error(lessonErr.message);
  if (!lesson) throw new Error('[gild] lesson not found');

  const { data: mod, error: modErr } = await supabase
    .from('modules')
    .select('course_id')
    .eq('id', lesson.module_id)
    .maybeSingle();
  if (modErr) throw new Error(modErr.message);
  if (!mod) throw new Error('[gild] module not found');

  const { data: courseRow, error: courseErr } = await supabase
    .from('courses')
    .select('community_id')
    .eq('id', mod.course_id)
    .maybeSingle();
  if (courseErr || !courseRow) throw new Error('[gild] course not found');
  await assertFlag('quizzes', courseRow.community_id);

  // Upsert the quiz row (one per lesson, enforced by the UNIQUE on lesson_id).
  const { data: existing, error: existingErr } = await supabase
    .from('quizzes')
    .select('id')
    .eq('lesson_id', lessonId)
    .maybeSingle();
  if (existingErr) throw new Error(existingErr.message);

  let quizId: string;
  if (existing) {
    quizId = existing.id;
    const { error: updateErr } = await supabase
      .from('quizzes')
      .update({ title, pass_score: passScore })
      .eq('id', quizId);
    if (updateErr) throw new Error(updateErr.message);
  } else {
    const { data: inserted, error: insertErr } = await supabase
      .from('quizzes')
      .insert({ lesson_id: lessonId, title, pass_score: passScore })
      .select('id')
      .single();
    if (insertErr) throw new Error(insertErr.message);
    quizId = inserted.id;
  }

  // Replace the full question set: clear then insert in submitted order.
  // quiz_attempts reference quiz_id (not question rows) and snapshot their
  // own answer breakdown, so swapping questions never corrupts past attempts.
  const { error: deleteErr } = await supabase
    .from('quiz_questions')
    .delete()
    .eq('quiz_id', quizId);
  if (deleteErr) throw new Error(deleteErr.message);

  const rows = questions.map((q, index) => ({
    quiz_id: quizId,
    body: q.body,
    options: q.options as unknown as Json,
    correct_id: q.correctId,
    position: index,
  }));
  const { error: questionsErr } = await supabase.from('quiz_questions').insert(rows);
  if (questionsErr) throw new Error(questionsErr.message);

  return { quizId };
}

// ─── Authoring: deleteQuiz ────────────────────────────────────────────────────
// Removes a lesson's quiz entirely. Questions and attempts cascade via FK.
// Admin role enforced by RLS on the DELETE.

export async function deleteQuiz(lessonId: string): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('[gild] not authenticated');

  const { error } = await supabase.from('quizzes').delete().eq('lesson_id', lessonId);
  if (error) throw new Error(error.message);
}
