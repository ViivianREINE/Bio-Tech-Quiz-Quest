import { request } from './client';
import type {
  User,
  AuthResponse,
  Subject,
  Unit,
  Topic,
  LearningContent,
  QuizSummary,
  QuizQuestion,
  StartQuizResponse,
  SubmitAnswerPayload,
  SubmitQuizResponse,
  AttemptDetailResponse,
  XPData,
  BadgeItem,
  LeaderboardEntry,
  ProgressSummary,
  AdminDashboardSummary,
  AdminAttemptItem,
} from '../types';

// ==================== AUTH ====================
export const authApi = {
  login: async (data: { email: string; password: string }) => {
    const res = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res;
  },

  register: async (data: { name: string; email: string; password: string }) => {
    const res = await request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res;
  },

  getMe: async () => {
    const res = await request<{ user: User }>('/auth/me');
    return res;
  },

  logout: () =>
    request<{ loggedOut: boolean }>('/auth/logout', { method: 'POST' }),
};

// ==================== SUBJECTS & UNITS ====================
export const academicApi = {
  getSubjects: async (status?: string): Promise<Subject[]> => {
    const query = status ? `?status=${status}` : '';
    const res = await request<any>(`/subjects${query}`);
    return Array.isArray(res) ? res : Array.isArray(res?.subjects) ? res.subjects : [];
  },

  getSubjectById: async (id: string): Promise<Subject> => {
    const res = await request<any>(`/subjects/${id}`);
    return res?.subject || res;
  },

  getUnitsBySubject: async (subjectId: string): Promise<Unit[]> => {
    const res = await request<any>(`/subjects/${subjectId}/units`);
    return Array.isArray(res) ? res : Array.isArray(res?.units) ? res.units : [];
  },

  getUnitById: async (unitId: string): Promise<Unit> => {
    const res = await request<any>(`/units/${unitId}`);
    return res?.unit || res;
  },

  getTopicsByUnit: async (unitId: string): Promise<Topic[]> => {
    const res = await request<any>(`/units/${unitId}/topics`);
    return Array.isArray(res) ? res : Array.isArray(res?.topics) ? res.topics : [];
  },

  getTopicById: async (topicId: string): Promise<Topic> => {
    const res = await request<any>(`/topics/${topicId}`);
    return res?.topic || res;
  },

  getContentByTopic: async (topicId: string): Promise<LearningContent[]> => {
    const res = await request<any>(`/topics/${topicId}/content`);
    const rawList = Array.isArray(res) ? res : Array.isArray(res?.contents) ? res.contents : [];
    return rawList.map((item: any) => ({
      ...item,
      content: item.body || item.content || '',
    }));
  },

  getContentById: async (contentId: string): Promise<LearningContent> => {
    const res = await request<any>(`/content/${contentId}`);
    const item = res?.content || res;
    return {
      ...item,
      content: item?.body || item?.content || '',
    };
  },
};

// ==================== QUIZZES & ATTEMPTS ====================
export const quizApi = {
  getQuizzes: async (params?: { topicId?: string; unitId?: string; difficulty?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.topicId) query.append('topicId', params.topicId);
    if (params?.unitId) query.append('unitId', params.unitId);
    if (params?.difficulty) query.append('difficulty', params.difficulty);
    if (params?.status) query.append('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await request<any>(`/quizzes${qs}`);
    const quizzes = Array.isArray(res) ? res : Array.isArray(res?.quizzes) ? res.quizzes : [];
    return { quizzes };
  },

  getQuizById: async (id: string): Promise<QuizSummary> => {
    const res = await request<any>(`/quizzes/${id}`);
    return res?.quiz || res;
  },

  startQuiz: async (quizId: string): Promise<StartQuizResponse> => {
    const res = await request<StartQuizResponse>(`/quizzes/${quizId}/start`, {
      method: 'POST',
    });
    return res;
  },

  submitAttempt: async (attemptId: string, answers: SubmitAnswerPayload[]): Promise<SubmitQuizResponse> => {
    const res = await request<any>(`/attempts/${attemptId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
    return res?.result || res;
  },

  getAttemptById: async (attemptId: string): Promise<AttemptDetailResponse> => {
    const res = await request<any>(`/attempts/${attemptId}`);
    return res?.attempt || res;
  },

  getMyAttempts: async (params?: { quizId?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.quizId) query.append('quizId', params.quizId);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await request<any>(`/attempts${qs}`);
    return {
      attempts: Array.isArray(res?.attempts) ? res.attempts : [],
      pagination: res?.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 },
    };
  },
};

// ==================== GAMIFICATION ====================
export const gamificationApi = {
  getXP: async (): Promise<XPData> => {
    const res = await request<any>('/gamification/xp');
    const totalXP = res?.totalXP ?? 0;
    const levelInfo = res?.level ?? {};
    return {
      totalXP,
      currentLevel: levelInfo.currentLevel ?? 1,
      xpForCurrentLevel: levelInfo.xpForCurrentLevel ?? 0,
      xpForNextLevel: levelInfo.xpForNextLevel ?? 100,
      progressPercent: levelInfo.progressPercent ?? 0,
      streakDays: levelInfo.streakDays ?? 1,
    };
  },

  getBadges: async (): Promise<BadgeItem[]> => {
    const res = await request<any>('/gamification/badges');
    return Array.isArray(res) ? res : Array.isArray(res?.badges) ? res.badges : [];
  },
};

// ==================== PROGRESS & LEADERBOARD ====================
export const progressApi = {
  getMyProgress: async (): Promise<ProgressSummary> => {
    const res = await request<any>('/progress');
    return res?.progress || res || {
      userId: '',
      overallCompletionPercent: 0,
      totalQuizzes: 0,
      completedQuizzes: 0,
      passedQuizzes: 0,
    };
  },

  getSubjectProgress: (subjectId: string) =>
    request<any>(`/progress/subjects/${subjectId}`),

  getUnitProgress: (unitId: string) =>
    request<any>(`/progress/units/${unitId}`),

  getTopicProgress: (topicId: string) =>
    request<any>(`/progress/topics/${topicId}`),
};

export const leaderboardApi = {
  getGlobalLeaderboard: async (): Promise<LeaderboardEntry[]> => {
    const res = await request<any>('/leaderboard');
    const rawList = Array.isArray(res) ? res : Array.isArray(res?.rankings) ? res.rankings : [];
    return rawList.map((entry: any, idx: number) => ({
      rank: entry.rank ?? idx + 1,
      userId: entry.userId ?? '',
      name: entry.displayName ?? entry.name ?? `Researcher #${idx + 1}`,
      email: entry.email ?? '',
      role: entry.role ?? 'STUDENT',
      level: entry.level ?? 1,
      totalXP: entry.totalXP ?? 0,
      quizzesPassed: entry.quizzesPassed ?? 0,
      badgesCount: entry.badgesCount ?? 0,
    }));
  },
};

// ==================== ADMIN CMS & ANALYTICS ====================
export const adminApi = {
  // Analytics
  getDashboardSummary: async (dateRange?: { from?: string; to?: string }): Promise<AdminDashboardSummary> => {
    const query = new URLSearchParams();
    if (dateRange?.from) query.append('from', dateRange.from);
    if (dateRange?.to) query.append('to', dateRange.to);
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await request<AdminDashboardSummary>(`/admin/analytics${qs}`);
    return res;
  },

  getUserAnalytics: async () => {
    return request<any>('/admin/analytics/users');
  },

  getSubjectAnalytics: async () => {
    const res = await request<any>('/admin/analytics/subjects');
    return Array.isArray(res) ? res : [];
  },

  getQuizAnalytics: async () => {
    const res = await request<any>('/admin/analytics/quizzes');
    return {
      quizzes: Array.isArray(res?.quizzes) ? res.quizzes : [],
      rankings: res?.rankings || {},
    };
  },

  getQuestionAnalytics: async () => {
    const res = await request<any>('/admin/analytics/questions');
    return {
      questions: Array.isArray(res?.questions) ? res.questions : [],
      difficultQuestions: Array.isArray(res?.difficultQuestions) ? res.difficultQuestions : [],
    };
  },

  getTopPerformers: async () => {
    const res = await request<any>('/admin/analytics/top-performers');
    return res || { highestXP: [], highestAverageScore: [], highestQuizPerformance: [] };
  },

  getAttempts: async (params?: {
    userId?: string;
    quizId?: string;
    subjectId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ attempts: AdminAttemptItem[]; pagination: any }> => {
    const query = new URLSearchParams();
    if (params?.userId) query.append('userId', params.userId);
    if (params?.quizId) query.append('quizId', params.quizId);
    if (params?.subjectId) query.append('subjectId', params.subjectId);
    if (params?.status) query.append('status', params.status);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await request<any>(`/admin/attempts${qs}`);
    return {
      attempts: Array.isArray(res?.attempts) ? res.attempts : [],
      pagination: res?.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 },
    };
  },

  getAttemptDetail: async (id: string) => {
    const res = await request<any>(`/admin/attempts/${id}`);
    return res;
  },

  getStudentPerformance: async (studentId: string) => {
    const res = await request<any>(`/admin/students/${studentId}/performance`);
    return res;
  },

  // Subjects CRUD
  createSubject: async (data: { name: string; description?: string; status?: string }) => {
    const res = await request<any>('/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.subject || res;
  },

  updateSubject: async (id: string, data: { name?: string; description?: string; status?: string }) => {
    const res = await request<any>(`/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res?.subject || res;
  },

  publishSubject: async (id: string, status: string) => {
    const res = await request<any>(`/subjects/${id}/publish`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res?.subject || res;
  },

  deleteSubject: async (id: string) => {
    return request<any>(`/subjects/${id}`, { method: 'DELETE' });
  },

  // Units CRUD
  createUnit: async (
    subjectId: string,
    data: { title: string; description?: string; unitNumber: number; displayOrder?: number; status?: string }
  ) => {
    const res = await request<any>(`/subjects/${subjectId}/units`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.unit || res;
  },

  updateUnit: async (
    id: string,
    data: { title?: string; description?: string; unitNumber?: number; displayOrder?: number; status?: string }
  ) => {
    const res = await request<any>(`/units/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res?.unit || res;
  },

  deleteUnit: async (id: string) => {
    return request<any>(`/units/${id}`, { method: 'DELETE' });
  },

  // Topics CRUD
  createTopic: async (
    unitId: string,
    data: { title: string; description?: string; displayOrder?: number; status?: string }
  ) => {
    const res = await request<any>(`/units/${unitId}/topics`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.topic || res;
  },

  updateTopic: async (
    id: string,
    data: { title?: string; description?: string; displayOrder?: number; status?: string }
  ) => {
    const res = await request<any>(`/topics/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res?.topic || res;
  },

  deleteTopic: async (id: string) => {
    return request<any>(`/topics/${id}`, { method: 'DELETE' });
  },

  // Learning Content / Resources CRUD
  createContent: async (
    topicId: string,
    data: {
      title: string;
      contentType?: string;
      body: string;
      displayOrder?: number;
      difficulty?: string;
      status?: string;
      metadata?: any;
    }
  ) => {
    const res = await request<any>(`/topics/${topicId}/content`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.content || res;
  },

  updateContent: async (
    id: string,
    data: {
      title?: string;
      contentType?: string;
      body?: string;
      displayOrder?: number;
      difficulty?: string;
      status?: string;
      metadata?: any;
    }
  ) => {
    const res = await request<any>(`/content/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res?.content || res;
  },

  deleteContent: async (id: string) => {
    return request<any>(`/content/${id}`, { method: 'DELETE' });
  },

  // Quizzes CRUD
  createQuiz: async (data: {
    topicId: string;
    title: string;
    description?: string;
    difficulty?: string;
    duration: number;
    passingPercentage?: number;
    maximumAttempts?: number;
    negativeMarking?: boolean;
    correctMark?: number;
    incorrectMark?: number;
    unansweredMark?: number;
    randomizeQuestions?: boolean;
    randomizeOptions?: boolean;
    status?: string;
  }) => {
    const res = await request<any>('/quizzes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.quiz || res;
  },

  updateQuiz: async (id: string, data: any) => {
    const res = await request<any>(`/quizzes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res?.quiz || res;
  },

  publishQuiz: async (id: string, status: string) => {
    const res = await request<any>(`/quizzes/${id}/publish`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res?.quiz || res;
  },

  deleteQuiz: async (id: string) => {
    return request<any>(`/quizzes/${id}`, { method: 'DELETE' });
  },

  // Questions CRUD
  getQuestionsByQuiz: async (quizId: string): Promise<QuizQuestion[]> => {
    const res = await request<any>(`/quizzes/${quizId}/questions`);
    return Array.isArray(res) ? res : Array.isArray(res?.questions) ? res.questions : [];
  },

  createQuestion: async (
    quizId: string,
    data: {
      questionText: string;
      questionType?: string;
      explanation?: string;
      marks?: number;
      difficulty?: string;
      displayOrder?: number;
      options: Array<{ optionText: string; displayOrder?: number; isCorrect: boolean }>;
    }
  ) => {
    const res = await request<any>(`/quizzes/${quizId}/questions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.question || res;
  },

  updateQuestion: async (
    id: string,
    data: {
      questionText?: string;
      questionType?: string;
      explanation?: string;
      marks?: number;
      difficulty?: string;
      displayOrder?: number;
      options?: Array<{ id?: string; optionText: string; displayOrder?: number; isCorrect: boolean }>;
    }
  ) => {
    const res = await request<any>(`/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res?.question || res;
  },

  deleteQuestion: async (id: string) => {
    return request<any>(`/questions/${id}`, { method: 'DELETE' });
  },

  // Users Management
  getUsers: async (params?: { role?: string; status?: string; search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.role) query.append('role', params.role);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await request<any>(`/users${qs}`);
    return {
      users: Array.isArray(res?.users) ? res.users : [],
      pagination: res?.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 },
    };
  },

  getUserById: async (id: string): Promise<User> => {
    const res = await request<any>(`/users/${id}`);
    return res?.user || res;
  },

  updateUser: async (id: string, data: { name?: string; email?: string }) => {
    const res = await request<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res?.user || res;
  },

  updateUserStatus: async (id: string, status: string) => {
    const res = await request<any>(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res?.user || res;
  },

  deleteUser: async (id: string) => {
    return request<any>(`/users/${id}`, { method: 'DELETE' });
  },
};
