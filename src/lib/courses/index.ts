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

export { computeCourseAccess } from './progress';
export type { CourseAccess, ModuleAccess } from './progress';

export { getQuiz, getQuizResult, getQuizForEdit } from './quiz.queries';

export { submitQuiz, saveQuiz, deleteQuiz } from './quiz.actions';

export { getCertificate, getCertificateByToken } from './certificate.queries';

export { issueCertificate } from './certificate.actions';

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
  EditableQuiz,
  EditableQuizQuestion,
  EditableQuizOption,
  SaveQuizInput,
} from './quiz.types';

export type { Certificate, PublicCertificate } from './certificate.types';
