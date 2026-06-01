import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { getCommunityContextBySlug } from '@/lib/community/context';
import {
  getCourse,
  getLesson,
  getEnrollment,
  getLessonProgress,
  completeLesson,
  getQuiz,
  submitQuiz,
  computeCourseAccess,
} from '@/lib/courses';
import { StudioLessonPlayer } from '@/components/StudioLessonPlayer';
import type { QuizAnswer, QuizAttemptResult } from '@/lib/courses';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  params: Promise<{ slug: string; courseId: string; lessonId: string }>;
};

export default async function LessonPage({ params }: Props) {
  const { slug, courseId, lessonId } = await params;

  if (!UUID_RE.test(courseId) || !UUID_RE.test(lessonId)) {
    notFound();
  }

  const supabase = await getSupabaseServerClient();
  const { community, membership } = await getCommunityContextBySlug(slug);
  if (!community) notFound();

  const communityId = community.id;

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

  // Sequential unlock enforcement — block opening a lesson whose module is
  // still locked behind an incomplete earlier module. Admins bypass.
  const completedLessonIds = new Set(progressRows.map((p) => p.lesson_id));
  const access = computeCourseAccess(course, completedLessonIds, isAdminOrOwner);
  if (!isAdminOrOwner && !access.unlockedLessonIds.has(lessonId)) {
    redirect(`/c/${slug}/courses/${courseId}`);
  }
  const nextLocked = nextLesson
    ? !isAdminOrOwner && !access.unlockedLessonIds.has(nextLesson.id)
    : false;

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

  // A lesson with a quiz can only be completed by passing it — so we hide the
  // manual "Mark complete" until the learner has a passing attempt. This is
  // what makes module unlock mean "completed AND passed".
  let quizPassed = false;
  if (quizId && enrollmentId) {
    const { data: passedAttempt } = await supabase
      .from('quiz_attempts')
      .select('id')
      .eq('quiz_id', quizId)
      .eq('enrollment_id', enrollmentId)
      .eq('passed', true)
      .limit(1)
      .maybeSingle();
    quizPassed = !!passedAttempt;
  }
  const hideManualComplete = !!quizId && !quizPassed;
  const courseComplete = isEnrolled && access.courseComplete;

  async function completeAction() {
    'use server';
    await completeLesson(lessonId);
    revalidatePath(`/c/${slug}/courses/${courseId}/${lessonId}`);
  }

  async function submitQuizAction(
    answersJson: string,
  ): Promise<QuizAttemptResult> {
    'use server';
    if (!quizId || !enrollmentId) {
      throw new Error('[gild] quiz or enrollment unavailable');
    }
    let answers: Array<QuizAnswer>;
    try {
      answers = JSON.parse(answersJson) as Array<QuizAnswer>;
    } catch {
      throw new Error('[gild] invalid answers payload');
    }
    const result = await submitQuiz({
      quizId,
      enrollmentId,
      answers,
    });
    if (result.passed) {
      await completeLesson(lessonId);
      revalidatePath(`/c/${slug}/courses/${courseId}/${lessonId}`);
    }
    return result;
  }

  return (
    <StudioLessonPlayer
      community={{ id: communityId, slug, name: community.name }}
      course={{ id: courseId, title: course.title }}
      lesson={lesson}
      prevLesson={prevLesson}
      nextLesson={nextLesson}
      isCompleted={isCompleted}
      isEnrolled={isEnrolled}
      quiz={quiz}
      enrollmentId={enrollmentId}
      hideManualComplete={hideManualComplete}
      nextLocked={nextLocked}
      courseComplete={courseComplete}
      completeAction={completeAction}
      submitQuizAction={submitQuizAction}
    />
  );
}
