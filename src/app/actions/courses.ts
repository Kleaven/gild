'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { getSupabaseServerClient } from '../../lib/auth/server';
import { resolveCommunitySlug } from '../../lib/community/context';

// Routes live at /c/[slug] — every revalidatePath in this file translates
// the UUID we receive from the client into the active slug before invalidating.
// See lib/community/context.ts:resolveCommunitySlug (React-cached).
import {
  createCourse as libCreateCourse,
  updateCourse as libUpdateCourse,
  deleteCourse as libDeleteCourse,
  createModule as libCreateModule,
  updateModule as libUpdateModule,
  deleteModule as libDeleteModule,
  setModuleRequiredTier as libSetModuleRequiredTier,
  createLesson as libCreateLesson,
  updateLesson as libUpdateLesson,
  deleteLesson as libDeleteLesson,
  reorderModules as libReorderModules,
  reorderLessons as libReorderLessons,
  enrollInCourse as libEnrollInCourse,
  completeLesson as libCompleteLesson,
  submitQuiz as libSubmitQuiz,
  saveQuiz as libSaveQuiz,
  deleteQuiz as libDeleteQuiz,
  getQuizForEdit as libGetQuizForEdit,
  issueCertificate as libIssueCertificate,
} from '../../lib/courses';
import type {
  CreateCourseInput,
  UpdateCourseInput,
  CreateModuleInput,
  UpdateModuleInput,
  CreateLessonInput,
  UpdateLessonInput,
  SubmitQuizInput,
  QuizAttemptResult,
  SaveQuizInput,
  EditableQuiz,
  Certificate,
} from '../../lib/courses';

// ─── Auth guard ───────────────────────────────────────────────────────────────

async function requireUser(): Promise<string> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[gild] not authenticated');
  return user.id;
}

// ─── Course wrappers ──────────────────────────────────────────────────────────

export async function createCourse(input: CreateCourseInput): Promise<{ courseId: string }> {
  await requireUser();
  const result = await libCreateCourse(input);
  const slug = await resolveCommunitySlug(input.communityId);
  revalidatePath(`/c/${slug}/courses`);
  return result;
}

export async function updateCourse(
  courseId: string,
  communityId: string,
  input: UpdateCourseInput,
): Promise<void> {
  await requireUser();
  await libUpdateCourse(courseId, input);
  const slug = await resolveCommunitySlug(communityId);
  revalidatePath(`/c/${slug}/courses`);
  revalidatePath(`/c/${slug}/courses/${courseId}`);
}

export async function deleteCourse(courseId: string, communityId: string): Promise<void> {
  await requireUser();
  await libDeleteCourse(courseId);
  const slug = await resolveCommunitySlug(communityId);
  revalidatePath(`/c/${slug}/courses`);
  revalidatePath(`/c/${slug}/courses/${courseId}`);
}

// ─── Module wrappers ──────────────────────────────────────────────────────────

// communityId and courseId are wrapper-only params for revalidation —
// not part of the lib type.

export async function createModule(
  input: CreateModuleInput,
  communityId: string,
): Promise<{ moduleId: string }> {
  await requireUser();
  const result = await libCreateModule(input);
  const slug = await resolveCommunitySlug(communityId);
  revalidatePath(`/c/${slug}/courses/${input.courseId}`);
  return result;
}

export async function updateModule(
  moduleId: string,
  input: UpdateModuleInput,
  communityId: string,
  courseId: string,
): Promise<void> {
  await requireUser();
  await libUpdateModule(moduleId, input);
  const slug = await resolveCommunitySlug(communityId);
  revalidatePath(`/c/${slug}/courses/${courseId}`);
}

export async function deleteModule(
  moduleId: string,
  communityId: string,
  courseId: string,
): Promise<void> {
  await requireUser();
  await libDeleteModule(moduleId);
  const slug = await resolveCommunitySlug(communityId);
  revalidatePath(`/c/${slug}/courses/${courseId}`);
}

export async function setModuleTier(
  moduleId: string,
  communityId: string,
  courseId: string,
  tierId: string | null,
): Promise<void> {
  await requireUser();
  await libSetModuleRequiredTier(moduleId, tierId);
  const slug = await resolveCommunitySlug(communityId);
  revalidatePath(`/c/${slug}/courses/${courseId}`);
}

// ─── Lesson wrappers ──────────────────────────────────────────────────────────

export async function createLesson(
  input: CreateLessonInput,
  communityId: string,
  courseId: string,
): Promise<{ lessonId: string }> {
  await requireUser();
  const result = await libCreateLesson(input);
  const slug = await resolveCommunitySlug(communityId);
  revalidatePath(`/c/${slug}/courses/${courseId}`);
  return result;
}

export async function updateLesson(
  lessonId: string,
  input: UpdateLessonInput,
  communityId: string,
  courseId: string,
): Promise<void> {
  await requireUser();
  await libUpdateLesson(lessonId, input);
  const slug = await resolveCommunitySlug(communityId);
  revalidatePath(`/c/${slug}/courses/${courseId}`);
}

export async function deleteLesson(
  lessonId: string,
  communityId: string,
  courseId: string,
): Promise<void> {
  await requireUser();
  await libDeleteLesson(lessonId);
  const slug = await resolveCommunitySlug(communityId);
  revalidatePath(`/c/${slug}/courses/${courseId}`);
}

// ─── Reorder wrappers ─────────────────────────────────────────────────────────

export async function reorderModules(
  courseId: string,
  orderedModuleIds: string[],
  communityId: string,
): Promise<void> {
  await requireUser();
  await libReorderModules(courseId, orderedModuleIds);
  const slug = await resolveCommunitySlug(communityId);
  revalidatePath(`/c/${slug}/courses/${courseId}`);
}

export async function reorderLessons(
  moduleId: string,
  orderedLessonIds: string[],
  communityId: string,
  courseId: string,
): Promise<void> {
  await requireUser();
  await libReorderLessons(moduleId, orderedLessonIds);
  const slug = await resolveCommunitySlug(communityId);
  revalidatePath(`/c/${slug}/courses/${courseId}`);
}

// ─── Enrollment + progress wrappers ──────────────────────────────────────────

export async function enrollInCourse(courseId: string, communityId: string): Promise<void> {
  await requireUser();
  await libEnrollInCourse(courseId);
  const slug = await resolveCommunitySlug(communityId);
  revalidatePath(`/c/${slug}/courses/${courseId}`);
}

export async function completeLesson(
  lessonId: string,
  courseId: string,
): Promise<void> {
  await requireUser();
  await libCompleteLesson(lessonId);
  revalidateTag(`course-progress-${courseId}`);
}

// ─── Certificate wrapper ──────────────────────────────────────────────────────

// communityId + courseId are wrapper-only params for revalidation;
// not part of the lib function signature.
export async function issueCertificate(
  enrollmentId: string,
  communityId: string,
  courseId: string,
): Promise<Certificate> {
  await requireUser();
  const result = await libIssueCertificate(enrollmentId);
  const slug = await resolveCommunitySlug(communityId);
  revalidatePath(`/c/${slug}/courses/${courseId}`);
  return result;
}

// ─── Quiz wrapper ─────────────────────────────────────────────────────────────

export async function submitQuiz(input: SubmitQuizInput): Promise<QuizAttemptResult> {
  await requireUser();
  // Resolve courseId from enrollmentId before delegating — needed for revalidation
  const supabase = await getSupabaseServerClient();
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('id', input.enrollmentId)
    .maybeSingle();
  const result = await libSubmitQuiz(input);
  if (enrollment) {
    revalidateTag(`course-progress-${enrollment.course_id}`);
  }
  return result;
}

// ─── Quiz authoring wrappers ──────────────────────────────────────────────────

// Loads the admin-only editable quiz (correct answers included) for a lesson.
// Returns null when no quiz exists yet or the caller isn't an admin+.
export async function loadQuizForEdit(lessonId: string): Promise<EditableQuiz | null> {
  await requireUser();
  const supabase = await getSupabaseServerClient();
  return libGetQuizForEdit(supabase, lessonId);
}

export async function saveQuiz(
  input: SaveQuizInput,
  communityId: string,
  courseId: string,
): Promise<{ quizId: string }> {
  await requireUser();
  const result = await libSaveQuiz(input);
  const slug = await resolveCommunitySlug(communityId);
  revalidatePath(`/c/${slug}/courses/${courseId}`);
  revalidatePath(`/c/${slug}/courses/${courseId}/${input.lessonId}`);
  return result;
}

export async function deleteQuiz(
  lessonId: string,
  communityId: string,
  courseId: string,
): Promise<void> {
  await requireUser();
  await libDeleteQuiz(lessonId);
  const slug = await resolveCommunitySlug(communityId);
  revalidatePath(`/c/${slug}/courses/${courseId}`);
  revalidatePath(`/c/${slug}/courses/${courseId}/${lessonId}`);
}
