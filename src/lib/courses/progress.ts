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

export interface ModuleTierRequirement {
  id: string;
  name: string;
  position: number;
}

// Tier gating context. memberTierPosition is the rank of the member's active
// tier (null = no active paid tier); moduleTier maps module id → its required
// tier (null = free). Unlock is "that tier or higher": memberPos ≥ requiredPos.
export interface TierGating {
  memberTierPosition: number | null;
  moduleTier: Record<string, ModuleTierRequirement | null>;
}

export interface ModuleAccess {
  moduleId: string;
  unlocked: boolean;
  // Sequentially reachable (all earlier modules complete). A module can be
  // reachable yet still locked if it's tier-gated.
  reachable: boolean;
  complete: boolean;
  publishedLessonCount: number;
  completedLessonCount: number;
  tierLocked: boolean;
  requiredTier: ModuleTierRequirement | null;
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
  tier?: TierGating,
): CourseAccess {
  const modules: Record<string, ModuleAccess> = {};
  const unlockedLessonIds = new Set<string>();

  let allPriorComplete = true; // every module before the current one is complete
  let anyPublished = false;
  let everyModuleComplete = true;

  const memberPos = tier?.memberTierPosition ?? null;

  for (const m of course.modules) {
    const published = m.lessons.filter((l) => l.is_published);
    if (published.length > 0) anyPublished = true;

    const completedCount = published.filter((l) => completedLessonIds.has(l.id)).length;
    const moduleComplete = published.length === 0 || completedCount === published.length;

    const requiredTier = tier?.moduleTier[m.id] ?? null;
    // "That tier or higher" — locked if the module requires a tier the member
    // doesn't hold (or holds a lower one). Admins/owners bypass.
    const tierLocked =
      !bypass &&
      requiredTier !== null &&
      (memberPos === null || memberPos < requiredTier.position);

    const sequentiallyUnlocked = bypass || allPriorComplete;
    const unlocked = sequentiallyUnlocked && !tierLocked;

    modules[m.id] = {
      moduleId: m.id,
      unlocked,
      reachable: sequentiallyUnlocked,
      complete: moduleComplete,
      publishedLessonCount: published.length,
      completedLessonCount: completedCount,
      tierLocked,
      requiredTier,
    };

    if (unlocked) {
      const openable = bypass ? m.lessons : published;
      for (const l of openable) unlockedLessonIds.add(l.id);
    }

    if (published.length > 0 && !moduleComplete) everyModuleComplete = false;
    // Gate every subsequent module on this one's completion. A tier-locked
    // module can't be completed, so it also blocks the modules after it —
    // members must purchase to continue.
    if (!moduleComplete) allPriorComplete = false;
  }

  return {
    modules,
    unlockedLessonIds,
    courseComplete: anyPublished && everyModuleComplete,
  };
}
