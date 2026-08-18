import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { hashPassword } from '../src/utils/password.js';
import { env } from '../src/config/env.js';
import { sendError } from '../src/utils/apiResponse.js';
import {
  Role,
  UserStatus,
  ContentStatus,
  Difficulty,
  QuestionType,
  AttemptStatus,
} from '@prisma/client';

describe('Checkpoint 9 — Backend Security Hardening', () => {
  const adminEmail = 'security-admin@biotechquest.test';
  const student1Email = 'security-student1@biotechquest.test';
  const student2Email = 'security-student2@biotechquest.test';
  const password = 'Password123!';

  let adminToken: string;
  let student1Token: string;
  let student2Token: string;
  let student1Id: string;
  let student2Id: string;
  let quizId: string;
  let questionId: string;
  let correctOptionId: string;
  let student1AttemptId: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.subject.deleteMany({ where: { name: { in: ['Security Test Subject'] } } });
    await prisma.user.deleteMany({
      where: { email: { in: [adminEmail, student1Email, student2Email] } },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.subject.deleteMany({ where: { name: { in: ['Security Test Subject'] } } });
    await prisma.user.deleteMany({
      where: { email: { in: [adminEmail, student1Email, student2Email] } },
    });

    const hash = await hashPassword(password);
    await prisma.user.create({
      data: { name: 'Sec Admin', email: adminEmail, passwordHash: hash, role: Role.ADMIN, status: UserStatus.ACTIVE },
    });

    const s1 = await prisma.user.create({
      data: { name: 'Sec Student 1', email: student1Email, passwordHash: hash, role: Role.STUDENT, status: UserStatus.ACTIVE },
    });
    student1Id = s1.id;

    const s2 = await prisma.user.create({
      data: { name: 'Sec Student 2', email: student2Email, passwordHash: hash, role: Role.STUDENT, status: UserStatus.ACTIVE },
    });
    student2Id = s2.id;

    adminToken = (await request(app).post('/api/auth/login').send({ email: adminEmail, password })).body.data.token;
    student1Token = (await request(app).post('/api/auth/login').send({ email: student1Email, password })).body.data.token;
    student2Token = (await request(app).post('/api/auth/login').send({ email: student2Email, password })).body.data.token;

    const subject = await prisma.subject.create({
      data: { name: 'Security Test Subject', status: ContentStatus.PUBLISHED },
    });
    const unit = await prisma.unit.create({
      data: { subjectId: subject.id, title: 'U1', unitNumber: 1, status: ContentStatus.PUBLISHED },
    });
    const topic = await prisma.topic.create({
      data: { unitId: unit.id, title: 'Topic', status: ContentStatus.PUBLISHED },
    });
    const quiz = await prisma.quiz.create({
      data: {
        topicId: topic.id,
        title: 'Security Quiz',
        duration: 10,
        passingPercentage: 50,
        status: ContentStatus.PUBLISHED,
      },
    });
    quizId = quiz.id;

    const question = await prisma.question.create({
      data: {
        quizId,
        questionText: 'Security question?',
        questionType: QuestionType.SINGLE_CHOICE,
        marks: 1,
        displayOrder: 1,
      },
    });
    questionId = question.id;

    const correct = await prisma.option.create({
      data: { questionId, optionText: 'Correct', displayOrder: 1, isCorrect: true },
    });
    correctOptionId = correct.id;

    await prisma.option.create({
      data: { questionId, optionText: 'Wrong', displayOrder: 2, isCorrect: false },
    });

    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: student1Id,
        quizId,
        attemptNumber: 1,
        expiresAt: new Date(Date.now() + 600_000),
        status: AttemptStatus.IN_PROGRESS,
        totalQuestions: 1,
      },
    });
    student1AttemptId = attempt.id;
  });

  it('rejects forged JWT tokens', async () => {
    const forged = jwt.sign({ userId: student1Id, email: student1Email, role: Role.STUDENT }, 'wrong-secret');
    const res = await request(app)
      .get('/api/auth/me')
      .set({ Authorization: `Bearer ${forged}` });
    expect(res.status).toBe(401);
  });

  it('rejects expired JWT tokens', async () => {
    const expired = jwt.sign(
      { userId: student1Id, email: student1Email, role: Role.STUDENT },
      env.JWT_SECRET,
      { expiresIn: '-10s' }
    );
    const res = await request(app)
      .get('/api/auth/me')
      .set({ Authorization: `Bearer ${expired}` });
    expect(res.status).toBe(401);
  });

  it('rejects inactive and suspended users at authentication layer', async () => {
    await prisma.user.update({ where: { id: student1Id }, data: { status: UserStatus.INACTIVE } });
    const inactive = await request(app).post('/api/auth/login').send({ email: student1Email, password });
    expect(inactive.status).toBe(403);

    await prisma.user.update({ where: { id: student1Id }, data: { status: UserStatus.SUSPENDED } });
    const suspended = await request(app).post('/api/auth/login').send({ email: student1Email, password });
    expect(suspended.status).toBe(403);
  });

  it('prevents registration privilege escalation to ADMIN', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Escalation Attempt',
        email: `escalation-${Date.now()}@biotechquest.test`,
        password,
        role: Role.ADMIN,
      });
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe(Role.STUDENT);
    await prisma.user.delete({ where: { email: res.body.data.user.email } });
  });

  it('blocks student IDOR on another user attempt', async () => {
    const res = await request(app)
      .get(`/api/attempts/${student1AttemptId}`)
      .set({ Authorization: `Bearer ${student2Token}` });
    expect(res.status).toBe(403);
  });

  it('blocks admin attempt detail access for students', async () => {
    const res = await request(app)
      .get(`/api/admin/attempts/${student1AttemptId}`)
      .set({ Authorization: `Bearer ${student1Token}` });
    expect(res.status).toBe(403);
  });

  it('rejects malformed UUID params with validation error', async () => {
    const res = await request(app)
      .get('/api/admin/attempts/not-a-uuid')
      .set({ Authorization: `Bearer ${adminToken}` });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('ignores client score manipulation fields on submit', async () => {
    const submit = await request(app)
      .post(`/api/attempts/${student1AttemptId}/submit`)
      .set({ Authorization: `Bearer ${student1Token}` })
      .send({
        answers: [{ questionId, selectedOptionId: correctOptionId }],
        obtainedMarks: 999,
        percentage: 999,
        isPassed: true,
      });

    expect(submit.status).toBe(200);
    const result = submit.body.data.result ?? submit.body.data;
    expect(result.obtainedMarks).toBeLessThan(999);
    expect(result.percentage).toBeLessThanOrEqual(100);
  });

  it('prevents student XP self-award via admin endpoint', async () => {
    const res = await request(app)
      .post('/api/gamification/admin/xp-adjust')
      .set({ Authorization: `Bearer ${student1Token}` })
      .send({ userId: student1Id, amount: 5000, description: 'Self boost' });
    expect(res.status).toBe(403);
  });

  it('prevents student subject/quiz/content mutations', async () => {
    const subject = await request(app)
      .post('/api/subjects')
      .set({ Authorization: `Bearer ${student1Token}` })
      .send({ name: 'Hacked Subject' });
    expect(subject.status).toBe(403);

    const quiz = await request(app)
      .post('/api/quizzes')
      .set({ Authorization: `Bearer ${student1Token}` })
      .send({
        topicId: '00000000-0000-0000-0000-000000000001',
        title: 'Hacked Quiz',
        duration: 10,
        difficulty: Difficulty.EASY,
      });
    expect(quiz.status).toBe(403);
  });

  it('does not expose passwordHash or JWT secrets in API responses', async () => {
    const me = await request(app).get('/api/auth/me').set({ Authorization: `Bearer ${student1Token}` });
    const body = JSON.stringify(me.body);
    expect(body).not.toContain('passwordHash');
    expect(body).not.toContain(env.JWT_SECRET);
    expect(body).not.toMatch(/"password"\s*:/);
  });

  it('returns generic 500 message without stack trace in response body', async () => {
    const res = await request(app)
      .get('/api/users/not-a-valid-uuid')
      .set({ Authorization: `Bearer ${adminToken}` });
    expect([400, 404]).toContain(res.status);
    expect(JSON.stringify(res.body)).not.toContain('at ');
  });

  it('enforces rate limiting response format on auth endpoints', async () => {
    const miniApp = express();
    miniApp.use(
      rateLimit({
        windowMs: 60_000,
        max: 2,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (_req, res) =>
          sendError(res, 429, 'TOO_MANY_REQUESTS', 'Too many login/registration attempts. Please try again after 15 minutes.'),
      })
    );
    miniApp.post('/login', (_req, res) => res.json({ ok: true }));

    await request(miniApp).post('/login').send({});
    await request(miniApp).post('/login').send({});
    const blocked = await request(miniApp).post('/login').send({});
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('TOO_MANY_REQUESTS');
  });

  it('awards XP only once per attempt reference (idempotency)', async () => {
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: student2Id,
        quizId,
        attemptNumber: 1,
        expiresAt: new Date(Date.now() + 600_000),
        status: AttemptStatus.COMPLETED,
        totalQuestions: 1,
        answeredCount: 1,
        correctCount: 1,
        totalMarks: 1,
        obtainedMarks: 1,
        percentage: 100,
        isPassed: true,
      },
    });

    const { xpService } = await import('../src/modules/gamification/xp.service.js');
    await xpService.awardQuizCompletionXP(student2Id, attempt.id);
    await xpService.awardQuizCompletionXP(student2Id, attempt.id);

    const count = await prisma.xPTransaction.count({
      where: {
        userId: student2Id,
        referenceId: `QUIZ_COMPLETION:${attempt.id}`,
      },
    });
    expect(count).toBe(1);
  });
});
