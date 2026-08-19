import { request } from './client';
import type {
  User,
  AuthResponse,
  Subject,
  Unit,
  Topic,
  LearningContent,
  QuizSummary,
  StartQuizResponse,
  SubmitAnswerPayload,
  SubmitQuizResponse,
  AttemptDetailResponse,
  XPData,
  BadgeItem,
  LeaderboardEntry,
  ProgressSummary,
} from '../types';

// ==================== AUTH ====================
export const authApi = {
  login: (data: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: { name: string; email: string; password: string }) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () =>
    request<{ user: User }>('/auth/me'),

  logout: () =>
    request<{ loggedOut: boolean }>('/auth/logout', { method: 'POST' }),
};

// ==================== SUBJECTS & UNITS ====================
export const academicApi = {
  getSubjects: () =>
    request<Subject[]>('/subjects'),

  getSubjectById: (id: string) =>
    request<Subject>(`/subjects/${id}`),

  getUnitsBySubject: (subjectId: string) =>
    request<Unit[]>(`/subjects/${subjectId}/units`),

  getUnitById: (unitId: string) =>
    request<Unit>(`/units/${unitId}`),

  getTopicsByUnit: (unitId: string) =>
    request<Topic[]>(`/units/${unitId}/topics`),

  getTopicById: (topicId: string) =>
    request<Topic>(`/topics/${topicId}`),

  getContentByTopic: (topicId: string) =>
    request<LearningContent[]>(`/topics/${topicId}/content`),
};

// ==================== QUIZZES & ATTEMPTS ====================
export const quizApi = {
  getQuizzes: (params?: { topicId?: string; unitId?: string }) => {
    const query = new URLSearchParams();
    if (params?.topicId) query.append('topicId', params.topicId);
    if (params?.unitId) query.append('unitId', params.unitId);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<{ quizzes: QuizSummary[] }>(`/quizzes${qs}`);
  },

  getQuizById: (id: string) =>
    request<QuizSummary>(`/quizzes/${id}`),

  startQuiz: (quizId: string) =>
    request<StartQuizResponse>(`/quizzes/${quizId}/start`, {
      method: 'POST',
    }),

  submitAttempt: (attemptId: string, answers: SubmitAnswerPayload[]) =>
    request<SubmitQuizResponse>(`/attempts/${attemptId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),

  getAttemptById: (attemptId: string) =>
    request<AttemptDetailResponse>(`/attempts/${attemptId}`),

  getMyAttempts: (params?: { quizId?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.quizId) query.append('quizId', params.quizId);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<{ attempts: any[]; pagination: any }>(`/attempts${qs}`);
  },
};

// ==================== GAMIFICATION ====================
export const gamificationApi = {
  getXP: () =>
    request<XPData>('/gamification/xp'),

  getBadges: () =>
    request<BadgeItem[]>('/gamification/badges'),
};

// ==================== PROGRESS & LEADERBOARD ====================
export const progressApi = {
  getMyProgress: () =>
    request<ProgressSummary>('/progress'),

  getSubjectProgress: (subjectId: string) =>
    request<any>(`/progress/subjects/${subjectId}`),

  getUnitProgress: (unitId: string) =>
    request<any>(`/progress/units/${unitId}`),

  getTopicProgress: (topicId: string) =>
    request<any>(`/progress/topics/${topicId}`),
};

export const leaderboardApi = {
  getGlobalLeaderboard: () =>
    request<LeaderboardEntry[]>('/leaderboard'),
};
