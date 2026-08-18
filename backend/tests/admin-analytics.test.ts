import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { hashPassword } from '../src/utils/password.js';
import {
  Role,
  UserStatus,
  ContentStatus,
  Difficulty,
  QuestionType,
  AttemptStatus,
  ProgressScope,
  XPActionType,
} from '@prisma/client';

describe('Checkpoint 7 — Admin Analytics', () => {
  const adminEmail = 'admin-analytics@biotechquest.test';
  const student1Email = 'student-analytics-1@biotechquest.test';
  const student2Email = 'student-analytics-2@biotechquest.test';
  const testPassword = 'Password123!';

  const subjectNames = ['Analytics Subject Alpha', 'Analytics Subject Beta'];
  const testEmails = [adminEmail, student1Email, student2Email];

  let adminToken: string;
  let studentToken: string;
  let student1Id: string;
  let student2Id: string;
  let subjectAId: string;
  let subjectBId: string;
  let quizAId: string;
  let quizBId: string;
  let completedAttemptId: string;
  let expiredAttemptId: string;
  let questionAId: string;
  let questionBId: string;
  let badgeId: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await cleanupFixtures();
    await prisma.$disconnect();
  });

  async function cleanupFixtures() {
    await prisma.subject.deleteMany({ where: { name: { in: subjectNames } } });
    await prisma.user.deleteMany({ where: { email: { in: testEmails } } });
  }

  beforeEach(async () => {
    await cleanupFixtures();

    const passwordHash = await hashPassword(testPassword);

    await prisma.user.create({
      data: {
        name: 'Analytics Admin',
        email: adminEmail,
        passwordHash,
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });

    const student1 = await prisma.user.create({
      data: {
        name: 'Analytics Student One',
        email: student1Email,
        passwordHash,
        role: Role.STUDENT,
        status: UserStatus.ACTIVE,
      },
    });
    student1Id = student1.id;

    const student2 = await prisma.user.create({
      data: {
        name: 'Analytics Student Two',
        email: student2Email,
        passwordHash,
        role: Role.STUDENT,
        status: UserStatus.INACTIVE,
      },
    });
    student2Id = student2.id;

    const subjectA = await prisma.subject.create({
      data: {
        name: 'Analytics Subject Alpha',
        description: 'Alpha analytics',
        status: ContentStatus.PUBLISHED,
      },
    });
    subjectAId = subjectA.id;

    const subjectB = await prisma.subject.create({
      data: {
        name: 'Analytics Subject Beta',
        description: 'Beta analytics',
        status: ContentStatus.DRAFT,
      },
    });
    subjectBId = subjectB.id;

    const unitA = await prisma.unit.create({
      data: {
        subjectId: subjectA.id,
        title: 'Unit A',
        unitNumber: 1,
        status: ContentStatus.PUBLISHED,
      },
    });

    const unitB = await prisma.unit.create({
      data: {
        subjectId: subjectB.id,
        title: 'Unit B',
        unitNumber: 1,
        status: ContentStatus.PUBLISHED,
      },
    });

    const topicA = await prisma.topic.create({
      data: {
        unitId: unitA.id,
        title: 'Topic A',
        status: ContentStatus.PUBLISHED,
      },
    });

    const topicB = await prisma.topic.create({
      data: {
        unitId: unitB.id,
        title: 'Topic B',
        status: ContentStatus.PUBLISHED,
      },
    });

    await prisma.learningContent.create({
      data: {
        topicId: topicA.id,
        title: 'Intro Content',
        body: 'Analytics content body',
        status: ContentStatus.PUBLISHED,
      },
    });

    const quizA = await prisma.quiz.create({
      data: {
        topicId: topicA.id,
        title: 'Analytics Quiz A',
        duration: 10,
        passingPercentage: 60,
        correctMark: 1,
        incorrectMark: 0,
        status: ContentStatus.PUBLISHED,
      },
    });
    quizAId = quizA.id;

    const quizB = await prisma.quiz.create({
      data: {
        topicId: topicB.id,
        title: 'Analytics Quiz B',
        duration: 10,
        passingPercentage: 60,
        correctMark: 1,
        incorrectMark: 0,
        status: ContentStatus.DRAFT,
      },
    });
    quizBId = quizB.id;

    const questionA = await prisma.question.create({
      data: {
        quizId: quizA.id,
        questionText: 'What is analytics used for?',
        questionType: QuestionType.SINGLE_CHOICE,
        marks: 1,
        difficulty: Difficulty.MEDIUM,
        explanation: 'Analytics reveals patterns.',
      },
    });
    questionAId = questionA.id;

    const questionB = await prisma.question.create({
      data: {
        quizId: quizA.id,
        questionText: 'Unused question with zero answers',
        questionType: QuestionType.SINGLE_CHOICE,
        marks: 1,
        difficulty: Difficulty.EASY,
      },
    });
    questionBId = questionB.id;

    const correctOption = await prisma.option.create({
      data: {
        questionId: questionA.id,
        optionText: 'Understanding performance',
        displayOrder: 1,
        isCorrect: true,
      },
    });

    await prisma.option.create({
      data: {
        questionId: questionA.id,
        optionText: 'Hiding data',
        displayOrder: 2,
        isCorrect: false,
      },
    });

    const completedAttempt = await prisma.quizAttempt.create({
      data: {
        userId: student1.id,
        quizId: quizA.id,
        attemptNumber: 1,
        startedAt: new Date('2026-08-10T10:00:00.000Z'),
        expiresAt: new Date('2026-08-10T10:30:00.000Z'),
        submittedAt: new Date('2026-08-10T10:05:00.000Z'),
        status: AttemptStatus.COMPLETED,
        totalQuestions: 1,
        answeredCount: 1,
        correctCount: 1,
        incorrectCount: 0,
        unansweredCount: 0,
        totalMarks: 1,
        obtainedMarks: 1,
        percentage: 100,
        isPassed: true,
        timeTakenSec: 40,
      },
    });
    completedAttemptId = completedAttempt.id;

    await prisma.answer.create({
      data: {
        attemptId: completedAttempt.id,
        questionId: questionA.id,
        selectedOptionId: correctOption.id,
        isCorrect: true,
        marksAwarded: 1,
      },
    });

    const expiredAttempt = await prisma.quizAttempt.create({
      data: {
        userId: student2.id,
        quizId: quizA.id,
        attemptNumber: 1,
        startedAt: new Date('2026-08-11T10:00:00.000Z'),
        expiresAt: new Date('2026-08-11T10:30:00.000Z'),
        status: AttemptStatus.EXPIRED,
        totalQuestions: 1,
        answeredCount: 0,
        correctCount: 0,
        incorrectCount: 0,
        unansweredCount: 1,
        totalMarks: 1,
        obtainedMarks: 0,
        percentage: 0,
        isPassed: false,
      },
    });
    expiredAttemptId = expiredAttempt.id;

    await prisma.userProgress.create({
      data: {
        userId: student1.id,
        scopeType: ProgressScope.SUBJECT,
        scopeId: subjectA.id,
        subjectId: subjectA.id,
        completionPercentage: 80,
        quizzesAttempted: 1,
        quizzesCompleted: 1,
        averageScore: 100,
        highestScore: 100,
      },
    });

    await prisma.userProgress.create({
      data: {
        userId: student1.id,
        scopeType: ProgressScope.UNIT,
        scopeId: unitA.id,
        subjectId: subjectA.id,
        unitId: unitA.id,
        completionPercentage: 75,
        quizzesAttempted: 1,
        quizzesCompleted: 1,
        averageScore: 100,
        highestScore: 100,
      },
    });

    await prisma.userProgress.create({
      data: {
        userId: student1.id,
        scopeType: ProgressScope.TOPIC,
        scopeId: topicA.id,
        subjectId: subjectA.id,
        unitId: unitA.id,
        topicId: topicA.id,
        completionPercentage: 70,
        quizzesAttempted: 1,
        quizzesCompleted: 1,
        averageScore: 100,
        highestScore: 100,
      },
    });

    await prisma.xPTransaction.create({
      data: {
        userId: student1.id,
        actionType: XPActionType.QUIZ_COMPLETION,
        amount: 50,
        description: 'Quiz completion XP',
      },
    });

    const badge = await prisma.badge.upsert({
      where: { code: 'ANALYTICS_TEST_BADGE' },
      update: {},
      create: {
        code: 'ANALYTICS_TEST_BADGE',
        name: 'Analytics Test Badge',
        description: 'Badge for analytics tests',
        criteria: { type: 'TEST' },
      },
    });
    badgeId = badge.id;

    await prisma.userBadge.create({
      data: {
        userId: student1.id,
        badgeId: badge.id,
      },
    });

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password: testPassword });
    adminToken = adminLogin.body.data.token;

    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: student1Email, password: testPassword });
    studentToken = studentLogin.body.data.token;
  });

  function authHeader(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  function expectNoSensitiveFields(payload: unknown) {
    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain('passwordHash');
    expect(serialized).not.toContain('password');
    expect(serialized).not.toMatch(/"token"\s*:/);
  }

  describe('Summary', () => {
    it('admin analytics summary returns HTTP 200 with real database values', async () => {
      const res = await request(app)
        .get('/api/admin/analytics')
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users.total).toBeGreaterThanOrEqual(3);
      expect(res.body.data.users.students).toBeGreaterThanOrEqual(2);
      expect(res.body.data.users.admins).toBeGreaterThanOrEqual(1);
      expect(res.body.data.academic.subjects).toBeGreaterThanOrEqual(2);
      expect(res.body.data.academic.publishedSubjects).toBeGreaterThanOrEqual(1);
      expect(res.body.data.attempts.totalAttempts).toBeGreaterThanOrEqual(2);
      expect(res.body.data.attempts.completedAttempts).toBeGreaterThanOrEqual(1);
      expect(res.body.data.attempts.expiredAttempts).toBeGreaterThanOrEqual(1);
      expect(res.body.data.performance.averageScore).toBeGreaterThanOrEqual(0);
      expect(res.body.data.engagement.totalXP).toBeGreaterThanOrEqual(50);
      expect(res.body.data.engagement.mostAttemptedQuiz).toBeTruthy();
      expectNoSensitiveFields(res.body);
    });

    it('summary handles zero values safely for question with no answers', async () => {
      const res = await request(app)
        .get('/api/admin/analytics/questions')
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      const zeroAnswerQuestion = res.body.data.questions.find(
        (question: { questionId: string }) => question.questionId === questionBId
      );
      expect(zeroAnswerQuestion.totalAnswers).toBe(0);
      expect(zeroAnswerQuestion.accuracyPercentage).toBe(0);
    });
  });

  describe('Users', () => {
    it('returns correct user analytics counts', async () => {
      const res = await request(app)
        .get('/api/admin/analytics/users')
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data.totalUsers).toBeGreaterThanOrEqual(3);
      expect(res.body.data.totalStudents).toBeGreaterThanOrEqual(2);
      expect(res.body.data.totalAdmins).toBeGreaterThanOrEqual(1);
      expect(res.body.data.activeUsers).toBeGreaterThanOrEqual(2);
      expect(res.body.data.inactiveUsers).toBeGreaterThanOrEqual(1);
      expect(res.body.data.suspendedUsers).toBeGreaterThanOrEqual(0);
      expect(res.body.data.usersWithAttempts).toBeGreaterThanOrEqual(2);
      expect(res.body.data.usersWithCompletedAttempts).toBeGreaterThanOrEqual(1);
      expectNoSensitiveFields(res.body);
    });
  });

  describe('Subjects', () => {
    it('returns subject analytics for multiple subjects without hardcoded logic', async () => {
      const res = await request(app)
        .get('/api/admin/analytics/subjects')
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);

      const alpha = res.body.data.find(
        (subject: { subjectId: string }) => subject.subjectId === subjectAId
      );
      const beta = res.body.data.find(
        (subject: { subjectId: string }) => subject.subjectId === subjectBId
      );

      expect(alpha.units).toBe(1);
      expect(alpha.topics).toBe(1);
      expect(alpha.quizzes).toBe(1);
      expect(alpha.publishedQuizzes).toBe(1);
      expect(alpha.attempts).toBe(2);
      expect(alpha.completedAttempts).toBe(1);
      expect(alpha.averageScore).toBe(50);
      expect(alpha.passRate).toBe(50);
      expect(alpha.failRate).toBe(50);

      expect(beta.units).toBe(1);
      expect(beta.quizzes).toBe(1);
      expect(beta.publishedQuizzes).toBe(0);
      expect(beta.attempts).toBe(0);
    });
  });

  describe('Quizzes', () => {
    it('returns quiz analytics with counts, scores, and rankings', async () => {
      const res = await request(app)
        .get('/api/admin/analytics/quizzes')
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      const quizA = res.body.data.quizzes.find(
        (quiz: { quizId: string }) => quiz.quizId === quizAId
      );

      expect(quizA.attempts).toBe(2);
      expect(quizA.completedAttempts).toBe(1);
      expect(quizA.expiredAttempts).toBe(1);
      expect(quizA.averageScore).toBe(50);
      expect(quizA.highestScore).toBe(100);
      expect(quizA.lowestScore).toBe(0);
      expect(quizA.passRate).toBe(50);
      expect(quizA.failRate).toBe(50);
      expect(res.body.data.rankings.mostAttempted.quizId).toBe(quizAId);
    });
  });

  describe('Questions', () => {
    it('returns question analytics with answer counts and accuracy', async () => {
      const res = await request(app)
        .get('/api/admin/analytics/questions')
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      const answeredQuestion = res.body.data.questions.find(
        (question: { questionId: string }) => question.questionId === questionAId
      );

      expect(answeredQuestion.totalAnswers).toBe(1);
      expect(answeredQuestion.correctAnswers).toBe(1);
      expect(answeredQuestion.incorrectAnswers).toBe(0);
      expect(answeredQuestion.accuracyPercentage).toBe(100);
      expect(answeredQuestion.averageMarksAwarded).toBe(1);
      expect(res.body.data.difficultQuestions).toBeInstanceOf(Array);
    });
  });

  describe('Attempts', () => {
    it('admin can list attempts with pagination metadata', async () => {
      const res = await request(app)
        .get('/api/admin/attempts')
        .query({ page: 1, limit: 1 })
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data.attempts).toHaveLength(1);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(1);
      expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(2);
      expect(res.body.data.pagination.totalPages).toBeGreaterThanOrEqual(2);
      expect(res.body.data.attempts[0]).toMatchObject({
        quizTitle: expect.any(String),
        subjectId: subjectAId,
        subjectName: 'Analytics Subject Alpha',
        obtainedMarks: expect.any(Number),
        totalMarks: expect.any(Number),
      });
      expect(res.body.data.attempts[0]).toHaveProperty('timeTakenSec');
    });

    it('supports userId, quizId, subjectId, status, and date filters', async () => {
      const byUser = await request(app)
        .get('/api/admin/attempts')
        .query({ userId: student1Id, status: AttemptStatus.COMPLETED })
        .set(authHeader(adminToken));
      expect(byUser.status).toBe(200);
      expect(byUser.body.data.attempts.every((attempt: { studentId: string }) => attempt.studentId === student1Id)).toBe(true);

      const byQuiz = await request(app)
        .get('/api/admin/attempts')
        .query({ quizId: quizAId })
        .set(authHeader(adminToken));
      expect(byQuiz.status).toBe(200);
      expect(byQuiz.body.data.attempts.every((attempt: { quizId: string }) => attempt.quizId === quizAId)).toBe(true);

      const bySubject = await request(app)
        .get('/api/admin/attempts')
        .query({ subjectId: subjectAId })
        .set(authHeader(adminToken));
      expect(bySubject.status).toBe(200);
      expect(bySubject.body.data.attempts.length).toBeGreaterThanOrEqual(2);

      const byDate = await request(app)
        .get('/api/admin/attempts')
        .query({ from: '2026-08-10T00:00:00.000Z', to: '2026-08-10T23:59:59.999Z' })
        .set(authHeader(adminToken));
      expect(byDate.status).toBe(200);
      expect(byDate.body.data.attempts).toHaveLength(1);
      expect(byDate.body.data.attempts[0].attemptId).toBe(completedAttemptId);
    });

    it('rejects invalid filters', async () => {
      const res = await request(app)
        .get('/api/admin/attempts')
        .query({ userId: 'not-a-uuid' })
        .set(authHeader(adminToken));

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('admin can view detailed attempt information', async () => {
      const res = await request(app)
        .get(`/api/admin/attempts/${completedAttemptId}`)
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data.student.name).toBe('Analytics Student One');
      expect(res.body.data.quiz.title).toBe('Analytics Quiz A');
      expect(res.body.data.hierarchy.subject.name).toBe('Analytics Subject Alpha');
      expect(res.body.data.attempt.correctCount).toBe(1);
      expect(res.body.data.answers[0].correctOption).toBeTruthy();
      expect(res.body.data.answers[0].explanation).toBe('Analytics reveals patterns.');
      expectNoSensitiveFields(res.body);
    });
  });

  describe('Student performance', () => {
    it('admin can retrieve student performance with XP, level, badges, and progress', async () => {
      const res = await request(app)
        .get(`/api/admin/students/${student1Id}/performance`)
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data.user.id).toBe(student1Id);
      expect(res.body.data.attempts.total).toBe(1);
      expect(res.body.data.attempts.completed).toBe(1);
      expect(res.body.data.attempts.averageScore).toBe(100);
      expect(res.body.data.attempts.highestScore).toBe(100);
      expect(res.body.data.attempts.passRate).toBe(100);
      expect(res.body.data.gamification.totalXP).toBeGreaterThanOrEqual(50);
      expect(res.body.data.gamification.level).toBeGreaterThanOrEqual(1);
      expect(res.body.data.gamification.badges.some((badge: { id: string }) => badge.id === badgeId)).toBe(true);
      expect(res.body.data.progress.subjects.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.progress.units.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.progress.topics.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.recentAttempts.length).toBeGreaterThanOrEqual(1);
      expectNoSensitiveFields(res.body);
    });
  });

  describe('Top performers and popular content', () => {
    it('returns top performers based on real data', async () => {
      const res = await request(app)
        .get('/api/admin/analytics/top-performers')
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data.highestXP).toBeInstanceOf(Array);
      expect(res.body.data.highestAverageScore).toBeInstanceOf(Array);
      expect(res.body.data.highestQuizPerformance).toBeInstanceOf(Array);
      expectNoSensitiveFields(res.body);
    });

    it('returns popular content based on quiz attempts', async () => {
      const res = await request(app)
        .get('/api/admin/analytics/popular-content')
        .set(authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.data.mostAttemptedSubjects[0].subjectName).toBe('Analytics Subject Alpha');
      expect(res.body.data.mostAttemptedQuizzes[0].quizId).toBe(quizAId);
      expect(res.body.data.mostActiveTopics.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Security', () => {
    it('rejects unauthenticated access', async () => {
      const res = await request(app).get('/api/admin/analytics');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects student access with 403', async () => {
      const res = await request(app)
        .get('/api/admin/analytics')
        .set(authHeader(studentToken));

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('student cannot access attempt monitoring endpoints', async () => {
      const res = await request(app)
        .get('/api/admin/attempts')
        .set(authHeader(studentToken));

      expect(res.status).toBe(403);
    });
  });
});
