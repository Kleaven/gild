import type { Database } from '../supabase/types';

// ─── Base table types ─────────────────────────────────────────────────────────

export type Course = Database['public']['Tables']['courses']['Row'];
export type Module = Database['public']['Tables']['modules']['Row'];
export type Lesson = Database['public']['Tables']['lessons']['Row'];
export type Enrollment = Database['public']['Tables']['enrollments']['Row'];
export type LessonProgress = Database['public']['Tables']['lesson_progress']['Row'];

// ─── Composed types ───────────────────────────────────────────────────────────

// Lesson metadata for list contexts — body excluded (fetch separately via getLesson)
// NOTE: duration_seconds is absent from the lessons table; column omitted.
export type LessonMeta = Omit<Lesson, 'body'>;

export type ModuleWithLessons = Module & { lessons: LessonMeta[] };

export type CourseWithModules = Course & { modules: ModuleWithLessons[] };

// Full lesson including body — only returned by getLesson after enrollment check
export type LessonWithContent = Lesson;

// ─── Input types ──────────────────────────────────────────────────────────────

export type CreateCourseInput = {
  communityId: string;
  // DEVIATION: courses table requires space_id (NOT NULL FK → spaces.id).
  // Spec omitted this field; added here to match the actual schema.
  spaceId: string;
  title: string;
  description?: string;
  isPublished?: boolean;
};

export type UpdateCourseInput = {
  title?: string;
  description?: string;
  isPublished?: boolean;
};

export type CreateModuleInput = {
  courseId: string;
  title: string;
  position?: number;
  // NOTE: modules table has no description column — field omitted from spec.
};

export type UpdateModuleInput = {
  title?: string;
  // NOTE: modules table has no description column.
};

export type CreateLessonInput = {
  moduleId: string;
  title: string;
  body?: string;
  videoUrl?: string;
  position?: number;
  isPublished?: boolean;
};

export type UpdateLessonInput = {
  title?: string;
  body?: string;
  videoUrl?: string;
  isPublished?: boolean;
};

// ─── Drip scheduling ──────────────────────────────────────────────────────────

export type DripStatus = {
  lessonId: string;
  title: string;
  dripDays: number | null;
  enrolledAt: string;
  isUnlocked: boolean;
  // null when dripDays is 0 or null (immediately available)
  unlocksAt: Date | null;
};
