'use server';

import { z } from 'zod';
import { getSupabaseServerClient } from '../auth/server';
import type { Database } from '../supabase/types';
import type {
  CreateCourseInput,
  CreateLessonInput,
  CreateModuleInput,
  UpdateCourseInput,
  UpdateLessonInput,
  UpdateModuleInput,
} from './types';

type CourseUpdate = Database['public']['Tables']['courses']['Update'];
type LessonUpdate = Database['public']['Tables']['lessons']['Update'];

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const createCourseSchema = z.object({
  communityId: z.string().uuid(),
  spaceId: z.string().uuid(),
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  isPublished: z.boolean().default(false),
});

const updateCourseSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).optional(),
  isPublished: z.boolean().optional(),
});

const createModuleSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().min(1).max(300),
  position: z.number().int().min(0).default(0),
});

const updateModuleSchema = z.object({
  title: z.string().min(1).max(300).optional(),
});

const createLessonSchema = z.object({
  moduleId: z.string().uuid(),
  title: z.string().min(1).max(300),
  body: z.string().max(100000).optional(),
  videoUrl: z.string().url().optional(),
  position: z.number().int().min(0).default(0),
  isPublished: z.boolean().default(false),
});

const updateLessonSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  body: z.string().max(100000).optional(),
  videoUrl: z.string().url().optional(),
  isPublished: z.boolean().optional(),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requireAdmin(communityId: string): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('[gild] not authenticated');

  const { data: hasRole, error: roleErr } = await supabase.rpc('user_has_min_role', {
    p_community_id: communityId,
    p_min_role: 'admin',
  });
  if (roleErr) throw new Error(roleErr.message);
  if (!hasRole) throw new Error('[gild] must be admin to perform this action');
}

async function resolveCommunityFromCourse(courseId: string): Promise<string> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('courses')
    .select('community_id')
    .eq('id', courseId)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('[gild] course not found');
  return data.community_id;
}

async function resolveCommunityFromModule(moduleId: string): Promise<{ communityId: string; courseId: string }> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('modules')
    .select('course_id, courses(community_id)')
    .eq('id', moduleId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('[gild] module not found');
  const courseRow = data.courses as { community_id: string } | null;
  if (!courseRow) throw new Error('[gild] course not found for module');
  return { communityId: courseRow.community_id, courseId: data.course_id };
}

async function resolveCommunityFromLesson(lessonId: string): Promise<{ communityId: string; courseId: string }> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('lessons')
    .select('module_id, modules(course_id, courses(community_id))')
    .eq('id', lessonId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('[gild] lesson not found');
  const modRow = data.modules as { course_id: string; courses: { community_id: string } | null } | null;
  if (!modRow?.courses) throw new Error('[gild] course not found for lesson');
  return { communityId: modRow.courses.community_id, courseId: modRow.course_id };
}

// ─── Course mutations ─────────────────────────────────────────────────────────

export async function createCourse(input: CreateCourseInput): Promise<{ courseId: string }> {
  const parsed = createCourseSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues.map((i) => i.message).join(', '));
  const { communityId, spaceId, title, description, isPublished } = parsed.data;

  await requireAdmin(communityId);

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('courses')
    .insert({
      community_id: communityId,
      space_id: spaceId,
      title,
      description: description ?? null,
      is_published: isPublished,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return { courseId: data.id };
}

export async function updateCourse(courseId: string, input: UpdateCourseInput): Promise<void> {
  const parsed = updateCourseSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues.map((i) => i.message).join(', '));

  const communityId = await resolveCommunityFromCourse(courseId);
  await requireAdmin(communityId);

  const updates: CourseUpdate = {};
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.isPublished !== undefined) updates.is_published = parsed.data.isPublished;

  if (Object.keys(updates).length === 0) return;

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', courseId)
    .is('deleted_at', null);
  if (error) throw new Error(error.message);
}

// Soft delete — deleted_at column confirmed on courses table
export async function deleteCourse(courseId: string): Promise<void> {
  const communityId = await resolveCommunityFromCourse(courseId);
  await requireAdmin(communityId);

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from('courses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', courseId);
  if (error) throw new Error(error.message);
}

// ─── Module mutations ─────────────────────────────────────────────────────────

export async function createModule(input: CreateModuleInput): Promise<{ moduleId: string }> {
  const parsed = createModuleSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues.map((i) => i.message).join(', '));
  const { courseId, title, position } = parsed.data;

  const communityId = await resolveCommunityFromCourse(courseId);
  await requireAdmin(communityId);

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('modules')
    .insert({ course_id: courseId, title, position })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return { moduleId: data.id };
}

export async function updateModule(moduleId: string, input: UpdateModuleInput): Promise<void> {
  const parsed = updateModuleSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues.map((i) => i.message).join(', '));
  if (parsed.data.title === undefined) return;

  const { communityId } = await resolveCommunityFromModule(moduleId);
  await requireAdmin(communityId);

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from('modules')
    .update({ title: parsed.data.title })
    .eq('id', moduleId);
  if (error) throw new Error(error.message);
}

// Hard delete — modules table has no deleted_at column
export async function deleteModule(moduleId: string): Promise<void> {
  const { communityId } = await resolveCommunityFromModule(moduleId);
  await requireAdmin(communityId);

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from('modules').delete().eq('id', moduleId);
  if (error) throw new Error(error.message);
}

// ─── Lesson mutations ─────────────────────────────────────────────────────────

export async function createLesson(input: CreateLessonInput): Promise<{ lessonId: string }> {
  const parsed = createLessonSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues.map((i) => i.message).join(', '));
  const { moduleId, title, body, videoUrl, position, isPublished } = parsed.data;

  const { communityId } = await resolveCommunityFromModule(moduleId);
  await requireAdmin(communityId);

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('lessons')
    .insert({
      module_id: moduleId,
      title,
      body: body ?? null,
      video_url: videoUrl ?? null,
      position,
      is_published: isPublished,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return { lessonId: data.id };
}

export async function updateLesson(lessonId: string, input: UpdateLessonInput): Promise<void> {
  const parsed = updateLessonSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues.map((i) => i.message).join(', '));

  const { communityId } = await resolveCommunityFromLesson(lessonId);
  await requireAdmin(communityId);

  const updates: LessonUpdate = {};
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.body !== undefined) updates.body = parsed.data.body;
  if (parsed.data.videoUrl !== undefined) updates.video_url = parsed.data.videoUrl;
  if (parsed.data.isPublished !== undefined) updates.is_published = parsed.data.isPublished;

  if (Object.keys(updates).length === 0) return;

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from('lessons').update(updates).eq('id', lessonId);
  if (error) throw new Error(error.message);
}

// Hard delete — lessons table has no deleted_at column
export async function deleteLesson(lessonId: string): Promise<void> {
  const { communityId } = await resolveCommunityFromLesson(lessonId);
  await requireAdmin(communityId);

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
  if (error) throw new Error(error.message);
}

// ─── Reorder mutations ────────────────────────────────────────────────────────

export async function reorderModules(
  courseId: string,
  orderedModuleIds: string[],
): Promise<void> {
  const communityId = await resolveCommunityFromCourse(courseId);
  await requireAdmin(communityId);

  if (orderedModuleIds.length === 0) return;

  // Validate ALL moduleIds belong to courseId before any write
  const supabase = await getSupabaseServerClient();
  const { data: existing, error: fetchErr } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', courseId)
    .in('id', orderedModuleIds);
  if (fetchErr) throw new Error(fetchErr.message);

  if ((existing?.length ?? 0) !== orderedModuleIds.length) {
    throw new Error('[gild] one or more module IDs do not belong to this course');
  }

  const results = await Promise.all(
    orderedModuleIds.map((moduleId, index) =>
      supabase.from('modules').update({ position: index }).eq('id', moduleId).eq('course_id', courseId),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
}

export async function reorderLessons(
  moduleId: string,
  orderedLessonIds: string[],
): Promise<void> {
  const { communityId } = await resolveCommunityFromModule(moduleId);
  await requireAdmin(communityId);

  if (orderedLessonIds.length === 0) return;

  // Validate ALL lessonIds belong to moduleId before any write
  const supabase = await getSupabaseServerClient();
  const { data: existing, error: fetchErr } = await supabase
    .from('lessons')
    .select('id')
    .eq('module_id', moduleId)
    .in('id', orderedLessonIds);
  if (fetchErr) throw new Error(fetchErr.message);

  if ((existing?.length ?? 0) !== orderedLessonIds.length) {
    throw new Error('[gild] one or more lesson IDs do not belong to this module');
  }

  const results = await Promise.all(
    orderedLessonIds.map((lessonId, index) =>
      supabase.from('lessons').update({ position: index }).eq('id', lessonId).eq('module_id', moduleId),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
}

// ─── Enrollment + progress ────────────────────────────────────────────────────

export async function enrollInCourse(courseId: string): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('[gild] not authenticated');

  // enroll_in_course is idempotent — safe to call if already enrolled.
  // RPC returns enrollment uuid (deviation from spec's void); ignored here.
  const { error } = await supabase.rpc('enroll_in_course', { p_course_id: courseId });
  if (error) throw new Error(error.message);
}

export async function completeLesson(lessonId: string): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('[gild] not authenticated');

  // Resolve course_id from lesson → module chain
  const { data: lessonRow, error: lessonErr } = await supabase
    .from('lessons')
    .select('module_id, modules(course_id)')
    .eq('id', lessonId)
    .maybeSingle();
  if (lessonErr) throw new Error(lessonErr.message);
  if (!lessonRow) throw new Error('[gild] lesson not found');

  const modRow = lessonRow.modules as { course_id: string } | null;
  if (!modRow) throw new Error('[gild] module not found for lesson');

  // Resolve enrollment_id — complete_lesson RPC requires it
  // DEVIATION: spec signature is completeLesson(lessonId) but the DB RPC is
  // complete_lesson(p_enrollment_id, p_lesson_id). Enrollment resolved here.
  const { data: enrollment, error: enrollErr } = await supabase
    .from('enrollments')
    .select('id')
    .eq('course_id', modRow.course_id)
    .maybeSingle();
  if (enrollErr) throw new Error(enrollErr.message);
  if (!enrollment) throw new Error('[gild] not enrolled in this course');

  const { error } = await supabase.rpc('complete_lesson', {
    p_enrollment_id: enrollment.id,
    p_lesson_id: lessonId,
  });
  if (error) throw new Error(error.message);
}
