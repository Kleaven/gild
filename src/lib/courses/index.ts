export {
  getCourses,
  getCourse,
  getLesson,
  getEnrollment,
  getLessonProgress,
  getDripStatus,
} from './queries';

export {
  createCourse,
  updateCourse,
  deleteCourse,
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderModules,
  reorderLessons,
  enrollInCourse,
  completeLesson,
} from './actions';

export { getQuiz, getQuizResult } from './quiz.queries';

export { submitQuiz } from './quiz.actions';

export type {
  Course,
  CourseWithModules,
  Module,
  ModuleWithLessons,
  Lesson,
  LessonMeta,
  LessonWithContent,
  Enrollment,
  LessonProgress,
  CreateCourseInput,
  UpdateCourseInput,
  CreateModuleInput,
  UpdateModuleInput,
  CreateLessonInput,
  UpdateLessonInput,
  DripStatus,
} from './types';

export type {
  Quiz,
  QuizOption,
  QuizQuestion,
  QuizWithQuestions,
  QuizAnswer,
  SubmitQuizInput,
  QuizAnswerBreakdown,
  QuizAttemptResult,
} from './quiz.types';
