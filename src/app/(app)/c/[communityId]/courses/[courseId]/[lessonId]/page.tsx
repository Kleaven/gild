import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { getCommunityContext } from '@/lib/community/context';
import {
  getCourse,
  getLesson,
  getEnrollment,
  getLessonProgress,
  completeLesson,
  getQuiz,
  submitQuiz,
} from '@/lib/courses';
import { StudioLessonPlayer } from '@/components/StudioLessonPlayer';
import type { QuizAnswer, QuizAttemptResult } from '@/lib/courses';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  params: Promise<{ communityId: string; courseId: string; lessonId: string }>;
};

export default async function LessonPage({ params }: Props) {
  const { communityId, courseId, lessonId } = await params;

  if (!UUID_RE.test(communityId) || !UUID_RE.test(courseId) || !UUID_RE.test(lessonId)) {
    notFound();
  }

  const supabase = await getSupabaseServerClient();
  const { community, membership } = await getCommunityContext(communityId);
  if (!community) notFound();

  // Course must exist and belong to this community.
  const course = await getCourse(supabase, courseId);
  if (!course || course.community_id !== communityId) notFound();

  const isAdminOrOwner = membership?.role === 'owner' || membership?.role === 'admin';

  // Hide unpublished course from non-admin members.
  if (!course.is_published && !isAdminOrOwner) notFound();

  // Lesson — getLesson already enforces enrollment + drip + admin fallback.
  const lesson = await getLesson(supabase, lessonId);
  if (!lesson) notFound();

  // Verify the lesson actually belongs to a module of this course (defense
  // against URL tampering — fetching across courses must not be possible).
  const lessonInCourse = course.modules.some((m) =>
    m.lessons.some((l) => l.id === lessonId),
  );
  if (!lessonInCourse) notFound();

  // Build prev/next based on flat order across modules → lessons (admin sees
  // all; members see published only).
  const flatLessons: { id: string; title: string }[] = [];
  for (const mod of course.modules) {
    const ordered = isAdminOrOwner
      ? mod.lessons
      : mod.lessons.filter((l) => l.is_published);
    for (const l of ordered) flatLessons.push({ id: l.id, title: l.title });
  }
  const idx = flatLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = idx > 0 ? (flatLessons[idx - 1] ?? null) : null;
  const nextLesson =
    idx >= 0 && idx < flatLessons.length - 1 ? (flatLessons[idx + 1] ?? null) : null;

  // Enrollment + completion state.
  const enrollment = await getEnrollment(supabase, courseId);
  const isEnrolled = enrollment !== null;
  const progressRows = isEnrolled ? await getLessonProgress(supabase, courseId) : [];
  const isCompleted = progressRows.some((p) => p.lesson_id === lessonId);

  // Quiz: at most one per lesson (FK is one-to-one). Inline lookup avoids
  // touching the lib layer.
  let quiz: Awaited<ReturnType<typeof getQuiz>> | null = null;
  const { data: quizRow, error: quizErr } = await supabase
    .from('quizzes')
    .select('id')
    .eq('lesson_id', lessonId)
    .maybeSingle();
  if (quizErr) throw new Error(quizErr.message);
  if (quizRow) {
    quiz = await getQuiz(supabase, quizRow.id);
  }

  // ─── Server actions (closures over IDs, never client-supplied) ───────────

  const enrollmentId = enrollment?.id ?? null;
  const quizId = quiz?.id ?? null;

  async function completeAction() {
    'use server';
    await completeLesson(lessonId);
    revalidatePath(`/c/${communityId}/courses/${courseId}/${lessonId}`);
  }

  async function submitQuizAction(
    answers: QuizAnswer[],
  ): Promise<QuizAttemptResult> {
    'use server';
    if (!quizId || !enrollmentId) {
      throw new Error('[gild] quiz or enrollment unavailable');
    }
    return submitQuiz({
      quizId,
      enrollmentId,
      answers,
    });
  }

  return (
    <StudioLessonPlayer
      community={{ id: communityId, name: community.name }}
      course={{ id: courseId, title: course.title }}
      lesson={lesson}
      prevLesson={prevLesson}
      nextLesson={nextLesson}
      isCompleted={isCompleted}
      isEnrolled={isEnrolled}
      quiz={quiz}
      enrollmentId={enrollmentId}
      completeAction={completeAction}
      submitQuizAction={submitQuizAction}
    />
  );
}
