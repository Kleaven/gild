import type { Database } from '../supabase/types';

// ─── Base type ────────────────────────────────────────────────────────────────

export type Quiz = Database['public']['Tables']['quizzes']['Row'];

// ─── Display types (no correct answer data) ───────────────────────────────────

// Safe display option — id and text only; correct_id never exposed pre-submission
export type QuizOption = {
  id: string;
  text: string;
};

// Question with correct_id stripped at runtime in getQuiz
export type QuizQuestion = {
  id: string;
  quizId: string;
  body: string;
  options: QuizOption[];
  position: number;
};

// Full quiz for display — no correct answers included
export type QuizWithQuestions = {
  id: string;
  lessonId: string;
  title: string;
  passScore: number;
  createdAt: string;
  updatedAt: string;
  questions: QuizQuestion[];
};

// ─── Submission types ─────────────────────────────────────────────────────────

export type QuizAnswer = {
  questionId: string;
  selectedOptionId: string;
};

export type SubmitQuizInput = {
  quizId: string;
  enrollmentId: string;
  answers: QuizAnswer[];
};

// ─── Result types (correct answers revealed post-submission) ──────────────────

// Stored verbatim in quiz_attempts.answers jsonb — persists the full breakdown
export type QuizAnswerBreakdown = {
  questionId: string;
  questionBody: string;
  options: QuizOption[];
  selectedOptionId: string;
  correctId: string;
  isCorrect: boolean;
};

export type QuizAttemptResult = {
  attemptId: string;
  quizId: string;
  score: number;
  passed: boolean;
  totalQuestions: number;
  correctCount: number;
  breakdown: QuizAnswerBreakdown[];
};
