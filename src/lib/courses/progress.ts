import type { CourseWithModules } from './types';

// ─── Sequential module access ───────────────────────────────────────────────
// Pure resolver (no DB) shared by the course detail page, the lesson page, and
// the lesson player. Encodes the unlock rule:
//
//   Module N is unlocked only once every module before it is COMPLETE.
//   A module is complete when all of its PUBLISHED lessons are completed.
//   (A lesson with a quiz only becomes "completed" by passing that quiz, so
//    "completed and passed" falls out naturally — see the lesson page, which
//    hides the manual Mark-complete while a quiz is unpassed.)
//
// Empty modules (no published lessons) are vacuously complete and never block
// the next module. Admins/owners bypass all locks (preview the whole course).

export interface ModuleAccess {
  moduleId: string;
  unlocked: boolean;
  complete: boolean;
  publishedLessonCount: number;
  completedLessonCount: number;
}

export interface CourseAccess {
  // Per-module access keyed by module id.
  modules: Record<string, ModuleAccess>;
  // Lesson ids the caller is allowed to open right now.
  unlockedLessonIds: Set<string>;
  // True once every module with published lessons is complete.
  courseComplete: boolean;
}

export function computeCourseAccess(
  course: CourseWithModules,
  completedLessonIds: Set<string>,
  bypass: boolean,
): CourseAccess {
  const modules: Record<string, ModuleAccess> = {};
  const unlockedLessonIds = new Set<string>();

  let allPriorComplete = true; // every module before the current one is complete
  let anyPublished = false;
  let everyModuleComplete = true;

  for (const m of course.modules) {
    const published = m.lessons.filter((l) => l.is_published);
    if (published.length > 0) anyPublished = true;

    const completedCount = published.filter((l) => completedLessonIds.has(l.id)).length;
    const moduleComplete = published.length === 0 || completedCount === published.length;

    const unlocked = bypass || allPriorComplete;

    modules[m.id] = {
      moduleId: m.id,
      unlocked,
      complete: moduleComplete,
      publishedLessonCount: published.length,
      completedLessonCount: completedCount,
    };

    if (unlocked) {
      const openable = bypass ? m.lessons : published;
      for (const l of openable) unlockedLessonIds.add(l.id);
    }

    if (published.length > 0 && !moduleComplete) everyModuleComplete = false;
    // Gate every subsequent module on this one's completion.
    if (!moduleComplete) allPriorComplete = false;
  }

  return {
    modules,
    unlockedLessonIds,
    courseComplete: anyPublished && everyModuleComplete,
  };
}
