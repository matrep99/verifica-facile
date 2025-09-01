// Tipi per l'app di verifiche docenti
export type QuestionType = 'MCQ' | 'TF' | 'SHORT' | 'LONG';

export type TestStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';

export type SubmissionState = 'IN_PROGRESS' | 'SUBMITTED';

export interface User {
  id: string;
  email: string;
  role: 'DOCENTE' | 'STUDENTE' | 'ADMIN';
  name?: string;
}

export interface Test {
  id: string;
  title: string;
  description: string;
  status: TestStatus;
  ownerId: string;
  settings: {
    joinCode?: string;
    timeLimit?: number;
    allowRetake?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  testId: string;
  questionIndex: number;
  type: QuestionType;
  prompt: string;
  options?: string[];
  correctAnswer?: {
    selected?: number | number[];
    value?: string;
    boolean?: boolean;
  };
  points: number;
  rubric?: {
    excellent: string;
    good: string;
    fair: string;
    poor: string;
  };
}

export interface Submission {
  id: string;
  testId: string;
  studentId?: string;
  studentName?: string;
  state: SubmissionState;
  startedAt: Date;
  submittedAt?: Date;
  timeMs?: number;
  totalScore?: number;
}

export interface Answer {
  id: string;
  submissionId: string;
  questionId: string;
  response: {
    selected?: number | number[];
    text?: string;
    boolean?: boolean;
  };
  autoScore?: number;
  aiSuggestedScore?: number;
  finalScore?: number;
  feedback?: string;
}

export interface GenerateQuestionsRequest {
  topic: string;
  gradeLevel: string;
  difficulty: 'easy' | 'medium' | 'hard';
  count?: number;
}

export interface AiGradeRequest {
  prompt: string;
  studentAnswer: string;
  modelAnswer?: string;
  rubric?: string;
  maxPoints: number;
}

export interface AiGradeResponse {
  suggestedScore: number;
  feedback: string;
}

export interface TestAnalytics {
  testId: string;
  totalSubmissions: number;
  averageScore: number;
  completionRate: number;
  questionStats: Array<{
    questionId: string;
    prompt: string;
    correctAnswers: number;
    totalAnswers: number;
    averageScore: number;
  }>;
  scoreDistribution: Array<{
    range: string;
    count: number;
  }>;
}