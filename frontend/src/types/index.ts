export type Role = 'ADMIN' | 'STUDENT';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type AttemptStatus = 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'ABANDONED';
export type QuestionType = 'SINGLE_CHOICE' | 'TRUE_FALSE' | 'MULTIPLE_SELECT';
export type ContentType =
  | 'TEXT'
  | 'IMAGE'
  | 'DIAGRAM'
  | 'FLOWCHART'
  | 'TABLE'
  | 'CASE_STUDY'
  | 'VIDEO_REFERENCE'
  | 'INTERACTIVE_ACTIVITY';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

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
  code?: string;
  description?: string;
  icon?: string;
  status: ContentStatus;
  displayOrder?: number;
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
    code?: string;
  };
}

export interface Topic {
  id: string;
  unitId: string;
  topicNumber?: number;
  title: string;
  description?: string;
  status: ContentStatus;
  displayOrder: number;
  contents?: LearningContent[];
  quizzes?: QuizSummary[];
  unit?: {
    id: string;
    title: string;
    subject?: {
      id: string;
      name: string;
    };
  };
}

export interface LearningContent {
  id: string;
  topicId: string;
  title: string;
  contentType?: ContentType;
  summary?: string;
  content?: string;
  body?: string;
  keyPoints?: string[] | any;
  diagramUrl?: string;
  tableData?: any;
  difficulty?: Difficulty;
  orderIndex?: number;
  displayOrder?: number;
  status?: ContentStatus;
  metadata?: any;
}

export interface QuizSummary {
  id: string;
  topicId: string;
  title: string;
  description?: string;
  difficulty?: Difficulty;
  duration: number; // minutes
  passingPercentage: number;
  totalQuestions?: number;
  maximumAttempts: number;
  negativeMarking: boolean;
  correctMark?: number;
  incorrectMark?: number;
  unansweredMark?: number;
  randomizeQuestions?: boolean;
  randomizeOptions?: boolean;
  status: ContentStatus;
  topic?: {
    id: string;
    title: string;
    unit?: {
      id: string;
      title: string;
      subject?: {
        id: string;
        name: string;
      };
    };
  };
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
  questionType?: QuestionType;
  marks: number;
  difficulty?: Difficulty;
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

export interface AdminDashboardSummary {
  users: {
    total: number;
    students: number;
    admins: number;
    active: number;
    inactive: number;
    suspended: number;
  };
  academic: {
    subjects: number;
    publishedSubjects: number;
    units: number;
    topics: number;
    learningContent: number;
    quizzes: number;
    publishedQuizzes: number;
    questions: number;
  };
  attempts: {
    totalAttempts: number;
    inProgressAttempts: number;
    completedAttempts: number;
    expiredAttempts: number;
    abandonedAttempts: number;
  };
  performance: {
    averageScore: number;
    passRate: number;
    failRate: number;
  };
  engagement: {
    totalXP: number;
    usersWithAttempts: number;
    mostAttemptedQuiz?: {
      quizId: string;
      quizTitle: string;
      attempts: number;
    } | null;
    mostAttemptedSubject?: {
      subjectId: string;
      subjectName: string;
      attempts: number;
    } | null;
  };
  topPerformers: {
    highestXP: Array<{ userId: string; name: string; totalXP: number }>;
    highestAverageScore: Array<{ userId: string; name: string; averageScore: number; completedAttempts: number }>;
    highestQuizPerformance: Array<{ userId: string; quizId: string; name: string; averageScore: number; attempts: number }>;
  };
  popularContent: {
    mostAttemptedSubjects: Array<{ subjectId: string; subjectName: string; attempts: number }>;
    mostAttemptedQuizzes: Array<{ quizId: string; quizTitle: string; attempts: number }>;
    mostActiveTopics: Array<{ topicId: string; topicTitle: string; attempts: number }>;
  };
}

export interface AdminAttemptItem {
  attemptId: string;
  studentId: string;
  studentName: string;
  quizId: string;
  quizTitle: string;
  subjectId: string;
  subjectName: string;
  status: AttemptStatus;
  startedAt: string;
  submittedAt?: string | null;
  expiresAt: string;
  percentage: number;
  obtainedMarks: number;
  totalMarks: number;
  isPassed: boolean;
  timeTakenSec: number;
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
