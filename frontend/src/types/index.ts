export type Role = 'ADMIN' | 'STUDENT';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type AttemptStatus = 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'ABANDONED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  icon?: string;
  status: ContentStatus;
  displayOrder: number;
  units?: Unit[];
}

export interface Unit {
  id: string;
  subjectId: string;
  unitNumber: number;
  title: string;
  description?: string;
  status: ContentStatus;
  displayOrder: number;
  topics?: Topic[];
  subject?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface Topic {
  id: string;
  unitId: string;
  topicNumber: number;
  title: string;
  description?: string;
  status: ContentStatus;
  displayOrder: number;
  contents?: LearningContent[];
  quizzes?: QuizSummary[];
}

export interface LearningContent {
  id: string;
  topicId: string;
  title: string;
  summary?: string;
  content: string;
  keyPoints?: string[] | any;
  diagramUrl?: string;
  tableData?: any;
  orderIndex: number;
  status?: ContentStatus;
}

export interface QuizSummary {
  id: string;
  topicId: string;
  title: string;
  description?: string;
  duration: number; // minutes
  passingPercentage: number;
  totalQuestions?: number;
  maximumAttempts: number;
  negativeMarking: boolean;
  status: ContentStatus;
}

export interface QuizOption {
  id: string;
  optionText: string;
  displayOrder?: number;
  isCorrect?: boolean;
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  questionType?: string;
  marks: number;
  difficulty?: string;
  displayOrder: number;
  options: QuizOption[];
  explanation?: string;
  selectedOption?: {
    id: string;
    optionText: string;
  } | null;
  correctOption?: {
    id: string;
    optionText: string;
  } | null;
  isCorrect?: boolean;
  marksAwarded?: number;
}

export interface StartQuizResponse {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  attemptNumber: number;
  maximumAttempts: number;
  duration: number; // in minutes
  startedAt: string;
  expiresAt: string;
  totalQuestions: number;
  totalMarks: number;
  questions: QuizQuestion[];
}

export interface SubmitAnswerPayload {
  questionId: string;
  selectedOptionId?: string | null;
}

export interface SubmitQuizResponse {
  attemptId: string;
  quizId: string;
  status: AttemptStatus;
  attemptNumber: number;
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  correctCount: number;
  incorrectCount: number;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  isPassed: boolean;
  timeTakenSec: number;
  submittedAt: string;
}

export interface AttemptDetailResponse extends SubmitQuizResponse {
  id: string;
  quizTitle?: string;
  startedAt: string;
  expiresAt: string;
  reviewQuestions?: QuizQuestion[];
}

export interface XPData {
  totalXP: number;
  currentLevel: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progressPercent: number;
  streakDays?: number;
}

export interface BadgeItem {
  id: string;
  code: string;
  name: string;
  description: string;
  icon?: string;
  criteria?: any;
  isUnlocked: boolean;
  unlockedAt?: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  email: string;
  role: Role;
  level: number;
  totalXP: number;
  quizzesPassed: number;
  badgesCount: number;
}

export interface ProgressSummary {
  userId: string;
  overallCompletionPercent: number;
  totalQuizzes: number;
  completedQuizzes: number;
  passedQuizzes: number;
  subjects?: Array<{
    subjectId: string;
    subjectName: string;
    completionPercent: number;
    unitsCount: number;
  }>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
