'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { getSupabaseServerClient } from '../../lib/auth/server';
import {
  createCourse as libCreateCourse,
  updateCourse as libUpdateCourse,
  deleteCourse as libDeleteCourse,
  createModule as libCreateModule,
  updateModule as libUpdateModule,
  deleteModule as libDeleteModule,
  createLesson as libCreateLesson,
  updateLesson as libUpdateLesson,
  deleteLesson as libDeleteLesson,
  reorderModules as libReorderModules,
  reorderLessons as libReorderLessons,
  enrollInCourse as libEnrollInCourse,
  completeLesson as libCompleteLesson,
  submitQuiz as libSubmitQuiz,
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
  revalidatePath(`/c/${input.communityId}/courses`);
  return result;
}

export async function updateCourse(
  courseId: string,
  communityId: string,
  input: UpdateCourseInput,
): Promise<void> {
  await requireUser();
  await libUpdateCourse(courseId, input);
  revalidatePath(`/c/${communityId}/courses`);
  revalidatePath(`/c/${communityId}/courses/${courseId}`);
}

export async function deleteCourse(courseId: string, communityId: string): Promise<void> {
  await requireUser();
  await libDeleteCourse(courseId);
  revalidatePath(`/c/${communityId}/courses`);
  revalidatePath(`/c/${communityId}/courses/${courseId}`);
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
  revalidatePath(`/c/${communityId}/courses/${input.courseId}`);
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
  revalidatePath(`/c/${communityId}/courses/${courseId}`);
}

export async function deleteModule(
  moduleId: string,
  communityId: string,
  courseId: string,
): Promise<void> {
  await requireUser();
  await libDeleteModule(moduleId);
  revalidatePath(`/c/${communityId}/courses/${courseId}`);
}

// ─── Lesson wrappers ──────────────────────────────────────────────────────────

export async function createLesson(
  input: CreateLessonInput,
  communityId: string,
  courseId: string,
): Promise<{ lessonId: string }> {
  await requireUser();
  const result = await libCreateLesson(input);
  revalidatePath(`/c/${communityId}/courses/${courseId}`);
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
  revalidatePath(`/c/${communityId}/courses/${courseId}`);
}

export async function deleteLesson(
  lessonId: string,
  communityId: string,
  courseId: string,
): Promise<void> {
  await requireUser();
  await libDeleteLesson(lessonId);
  revalidatePath(`/c/${communityId}/courses/${courseId}`);
}

// ─── Reorder wrappers ─────────────────────────────────────────────────────────

export async function reorderModules(
  courseId: string,
  orderedModuleIds: string[],
  communityId: string,
): Promise<void> {
  await requireUser();
  await libReorderModules(courseId, orderedModuleIds);
  revalidatePath(`/c/${communityId}/courses/${courseId}`);
}

export async function reorderLessons(
  moduleId: string,
  orderedLessonIds: string[],
  communityId: string,
  courseId: string,
): Promise<void> {
  await requireUser();
  await libReorderLessons(moduleId, orderedLessonIds);
  revalidatePath(`/c/${communityId}/courses/${courseId}`);
}

// ─── Enrollment + progress wrappers ──────────────────────────────────────────

export async function enrollInCourse(courseId: string, communityId: string): Promise<void> {
  await requireUser();
  await libEnrollInCourse(courseId);
  revalidatePath(`/c/${communityId}/courses/${courseId}`);
}

export async function completeLesson(
  lessonId: string,
  courseId: string,
): Promise<void> {
  await requireUser();
  await libCompleteLesson(lessonId);
  revalidateTag(`course-progress-${courseId}`);
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
