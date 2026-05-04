import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';
import type {
  Course,
  CourseWithModules,
  DripStatus,
  Enrollment,
  LessonMeta,
  LessonProgress,
  LessonWithContent,
  ModuleWithLessons,
} from './types';

// ─── isDripUnlocked ───────────────────────────────────────────────────────────
// Internal helper — not exported. drip_days null or 0 = immediately available.

function isDripUnlocked(dripDays: number | null, enrolledAt: string): boolean {
  if (!dripDays) return true;
  const unlocksAt = new Date(enrolledAt);
  unlocksAt.setDate(unlocksAt.getDate() + dripDays);
  return new Date() >= unlocksAt;
}

// ─── getCourses ───────────────────────────────────────────────────────────────
// Returns published + unpublished courses for community members (RLS enforces
// membership via two-policy SELECT on courses table).

export async function getCourses(
  supabase: SupabaseClient<Database>,
  communityId: string,
): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('community_id', communityId)
    .is('deleted_at', null)
    .order('position', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ─── getCourse ────────────────────────────────────────────────────────────────
// Returns a single course with full module + lesson metadata (body excluded).
// Three separate queries assembled in JS to keep TypeScript inference clean.
// RLS on courses / modules / lessons enforces community membership throughout.

export async function getCourse(
  supabase: SupabaseClient<Database>,
  courseId: string,
): Promise<CourseWithModules | null> {
  // Step 1 — course row
  const { data: course, error: courseErr } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .is('deleted_at', null)
    .maybeSingle();
  if (courseErr) throw new Error(courseErr.message);
  if (!course) return null;

  // Step 2 — modules for this course, ordered by position
  const { data: modules, error: modErr } = await supabase
    .from('modules')
    .select('*')
    .eq('course_id', courseId)
    .order('position', { ascending: true });
  if (modErr) throw new Error(modErr.message);

  const moduleRows = modules ?? [];

  // Step 3 — lesson metadata for all modules (no body — list context)
  let lessonRows: LessonMeta[] = [];
  if (moduleRows.length > 0) {
    const moduleIds = moduleRows.map((m) => m.id);
    const { data: lessons, error: lessonErr } = await supabase
      .from('lessons')
      .select('id, module_id, title, position, is_published, video_url, drip_days, created_at, updated_at')
      .in('module_id', moduleIds)
      .order('position', { ascending: true });
    if (lessonErr) throw new Error(lessonErr.message);
    // Cast is safe: selected columns exactly match LessonMeta (Lesson without body)
    lessonRows = (lessons ?? []) as unknown as LessonMeta[];
  }

  // Assemble: bucket lessons by module_id
  const lessonsByModule = new Map<string, LessonMeta[]>();
  for (const lesson of lessonRows) {
    const bucket = lessonsByModule.get(lesson.module_id) ?? [];
    bucket.push(lesson);
    lessonsByModule.set(lesson.module_id, bucket);
  }

  const modulesWithLessons: ModuleWithLessons[] = moduleRows.map((m) => ({
    ...m,
    lessons: lessonsByModule.get(m.id) ?? [],
  }));

  return { ...course, modules: modulesWithLessons };
}

// ─── getLesson ────────────────────────────────────────────────────────────────
// Returns a single lesson including body. Application-layer guard: caller must
// be enrolled in the course OR have admin+ role in the community.
// RLS on lessons already enforces community membership — this adds the
// enrollment gate on top.

export async function getLesson(
  supabase: SupabaseClient<Database>,
  lessonId: string,
): Promise<LessonWithContent | null> {
  // Fetch the lesson (RLS enforces community membership)
  const { data: lesson, error: lessonErr } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .maybeSingle();
  if (lessonErr) throw new Error(lessonErr.message);
  if (!lesson) return null;

  // Resolve course_id via module
  const { data: mod, error: modErr } = await supabase
    .from('modules')
    .select('course_id')
    .eq('id', lesson.module_id)
    .maybeSingle();
  if (modErr) throw new Error(modErr.message);
  if (!mod) return null;

  // Check enrollment (enrollments RLS: users see their own rows).
  // enrolled_at required for drip gate calculation.
  const { data: enrollment, error: enrollErr } = await supabase
    .from('enrollments')
    .select('id, enrolled_at')
    .eq('course_id', mod.course_id)
    .maybeSingle();
  if (enrollErr) throw new Error(enrollErr.message);

  if (enrollment) {
    // Drip gate: lesson exists but may not yet be available to this enrollee.
    // Treat a locked lesson the same as not found — no content exposed.
    if (!isDripUnlocked(lesson.drip_days, enrollment.enrolled_at)) return null;
    return lesson;
  }

  // Fallback: check admin+ role in the community.
  // Admins bypass the drip gate entirely — they always see all lessons.
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

  return hasRole ? lesson : null;
}

// ─── getEnrollment ────────────────────────────────────────────────────────────

export async function getEnrollment(
  supabase: SupabaseClient<Database>,
  courseId: string,
): Promise<Enrollment | null> {
  const { data, error } = await supabase
    .from('enrollments')
    .select('*')
    .eq('course_id', courseId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

// ─── getDripStatus ────────────────────────────────────────────────────────────
// Returns locked/unlocked state per lesson for the enrolled caller.
// Returns [] if the caller is not enrolled — never throws on missing enrollment.
// Uses supabase client throughout so RLS scopes the enrollment join to the
// current user — never exposes another user's enrollment data.

export async function getDripStatus(
  supabase: SupabaseClient<Database>,
  courseId: string,
): Promise<DripStatus[]> {
  // Resolve current user's enrollment (RLS: only own rows visible)
  const { data: enrollment, error: enrollErr } = await supabase
    .from('enrollments')
    .select('id, enrolled_at')
    .eq('course_id', courseId)
    .maybeSingle();
  if (enrollErr) throw new Error(enrollErr.message);
  if (!enrollment) return [];

  // Fetch all lessons in the course via module join
  const { data: rows, error: lessonsErr } = await supabase
    .from('lessons')
    .select('id, title, drip_days, modules!inner(course_id)')
    .eq('modules.course_id', courseId);
  if (lessonsErr) throw new Error(lessonsErr.message);

  return (rows ?? []).map((row) => {
    const dripDays = row.drip_days;
    const unlocksAt =
      dripDays
        ? (() => {
            const d = new Date(enrollment.enrolled_at);
            d.setDate(d.getDate() + dripDays);
            return d;
          })()
        : null;

    return {
      lessonId: row.id,
      title: row.title,
      dripDays,
      enrolledAt: enrollment.enrolled_at,
      isUnlocked: isDripUnlocked(dripDays, enrollment.enrolled_at),
      unlocksAt,
    };
  });
}

// ─── getLessonProgress ────────────────────────────────────────────────────────
// Returns all lesson_progress rows for the current user's enrollment in courseId.

export async function getLessonProgress(
  supabase: SupabaseClient<Database>,
  courseId: string,
): Promise<LessonProgress[]> {
  // Resolve user's enrollment for this course
  const { data: enrollment, error: enrollErr } = await supabase
    .from('enrollments')
    .select('id')
    .eq('course_id', courseId)
    .maybeSingle();
  if (enrollErr) throw new Error(enrollErr.message);
  if (!enrollment) return [];

  const { data, error } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('enrollment_id', enrollment.id);
  if (error) throw new Error(error.message);
  return data ?? [];
}
