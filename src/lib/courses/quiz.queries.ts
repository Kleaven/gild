import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';
import type {
  QuizWithQuestions,
  QuizQuestion,
  QuizAnswerBreakdown,
  QuizAttemptResult,
} from './quiz.types';

// ─── getQuiz ──────────────────────────────────────────────────────────────────
// Returns quiz + questions with correct_id stripped at runtime.
// Application-layer gate: caller must be enrolled in the course OR admin+.
// RLS on quizzes/quiz_questions enforces community membership on top.

export async function getQuiz(
  supabase: SupabaseClient<Database>,
  quizId: string,
): Promise<QuizWithQuestions | null> {
  const { data: quiz, error: quizErr } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .maybeSingle();
  if (quizErr) throw new Error(quizErr.message);
  if (!quiz) return null;

  // Resolve course chain: quiz.lesson_id → lesson.module_id → module.course_id
  const { data: lesson, error: lessonErr } = await supabase
    .from('lessons')
    .select('module_id')
    .eq('id', quiz.lesson_id)
    .maybeSingle();
  if (lessonErr) throw new Error(lessonErr.message);
  if (!lesson) return null;

  const { data: mod, error: modErr } = await supabase
    .from('modules')
    .select('course_id')
    .eq('id', lesson.module_id)
    .maybeSingle();
  if (modErr) throw new Error(modErr.message);
  if (!mod) return null;

  // Application-layer enrollment gate — RLS only enforces community membership.
  // enrollments RLS scopes SELECT to current user's own rows automatically.
  const { data: enrollment, error: enrollErr } = await supabase
    .from('enrollments')
    .select('id')
    .eq('course_id', mod.course_id)
    .maybeSingle();
  if (enrollErr) throw new Error(enrollErr.message);

  if (!enrollment) {
    // Fallback: admin+ may view quizzes without enrollment
    const { data: courseRow, error: courseErr } = await supabase
      .from('courses')
      .select('community_id')
      .eq('id', mod.course_id)
      .maybeSingle();
    if (courseErr) throw new Error(courseErr.message);
    if (!courseRow) return null;

    const { data: hasRole, error: roleErr } = await supabase.rpc('user_has_min_role', {
      p_community_id: courseRow.community_id,
      p_min_role: 'admin',
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!hasRole) return null;
  }

  // Fetch questions including correct_id — stripped at runtime below.
  // Selecting correct_id explicitly so the discard is a visible runtime step,
  // not merely a type-level omission.
  const { data: questionRows, error: questionsErr } = await supabase
    .from('quiz_questions')
    .select('id, quiz_id, body, options, correct_id, position')
    .eq('quiz_id', quizId)
    .order('position', { ascending: true });
  if (questionsErr) throw new Error(questionsErr.message);

  // Runtime strip: each row is explicitly reconstructed without correct_id.
  // options cast is safe per migration 00012: jsonb array of {id, text}.
  const questions: QuizQuestion[] = (questionRows ?? []).map((row) => {
    const rawOptions = row.options as { id: string; text: string }[];
    return {
      id: row.id,
      quizId: row.quiz_id,
      body: row.body,
      position: row.position,
      // correct_id present in row but intentionally discarded here
      options: rawOptions.map(({ id, text }) => ({ id, text })),
    };
  });

  return {
    id: quiz.id,
    lessonId: quiz.lesson_id,
    title: quiz.title,
    passScore: quiz.pass_score,
    createdAt: quiz.created_at,
    updatedAt: quiz.updated_at,
    questions,
  };
}

// ─── getQuizResult ────────────────────────────────────────────────────────────
// Returns a completed attempt including score and full answer breakdown.
// Correct answers are included — attempt is already submitted.
// Ownership enforced by RLS (quiz_attempts_select: user_id = current_user_id()
// OR admin OR platform_admin). Returning null covers both not-found and denied.

export async function getQuizResult(
  supabase: SupabaseClient<Database>,
  attemptId: string,
): Promise<QuizAttemptResult | null> {
  const { data: attempt, error } = await supabase
    .from('quiz_attempts')
    .select('id, quiz_id, score, passed, answers')
    .eq('id', attemptId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!attempt) return null;

  // answers jsonb stores QuizAnswerBreakdown[] written by submitQuiz
  const breakdown = attempt.answers as QuizAnswerBreakdown[];
  const correctCount = breakdown.filter((b) => b.isCorrect).length;

  return {
    attemptId: attempt.id,
    quizId: attempt.quiz_id,
    score: attempt.score,
    passed: attempt.passed,
    totalQuestions: breakdown.length,
    correctCount,
    breakdown,
  };
}
