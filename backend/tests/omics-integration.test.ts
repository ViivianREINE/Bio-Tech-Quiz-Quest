import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { seedOmicsUnit1 } from '../prisma/seeds/run-omics-seed.js';
import { OMICS_SUBJECT_NAME } from '../prisma/seeds/helpers.js';
import { ContentStatus, QuestionType } from '@prisma/client';

describe('Checkpoint 8 — OMICS Unit 1 Seed Integration', () => {
  const studentEmail = `omics-student-${Date.now()}@biotechquest.test`;
  const password = 'Password123!';
  let studentToken: string;
  let adminToken: string;
  let seedCounts: Awaited<ReturnType<typeof seedOmicsUnit1>>;

  beforeAll(async () => {
    await prisma.$connect();
    seedCounts = await seedOmicsUnit1();
    const secondRun = await seedOmicsUnit1();
    expect(secondRun?.topics).toBe(seedCounts?.topics);

    const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@omics.dev.local';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password: adminPassword });
    adminToken = adminLogin.body.data.token;

    const register = await request(app)
      .post('/api/auth/register')
      .send({ name: 'OMICS Student', email: studentEmail, password });
    studentToken = register.body.data.token;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: studentEmail } });
    await prisma.$disconnect();
  });

  it('seeds expected OMICS hierarchy counts from source PDFs', () => {
    expect(seedCounts?.subjects).toBe(1);
    expect(seedCounts?.units).toBe(1);
    expect(seedCounts?.topics).toBeGreaterThanOrEqual(6);
    expect(seedCounts?.learningContent).toBeGreaterThanOrEqual(10);
    expect(seedCounts?.quizzes).toBeGreaterThanOrEqual(6);
    expect(seedCounts?.questions).toBeGreaterThanOrEqual(40);
    expect(seedCounts?.options).toBeGreaterThanOrEqual(80);
    expect(seedCounts?.publishedQuizzes).toBe(seedCounts?.quizzes);
  });

  it('validates every published quiz has valid questions and options', async () => {
    const subject = await prisma.subject.findUnique({ where: { name: OMICS_SUBJECT_NAME } });
    const unit = await prisma.unit.findFirst({ where: { subjectId: subject!.id, unitNumber: 1 } });
    const quizzes = await prisma.quiz.findMany({
      where: { topic: { unitId: unit!.id }, status: ContentStatus.PUBLISHED },
      include: { questions: { include: { options: true } } },
    });

    for (const quiz of quizzes) {
      expect(quiz.questions.length).toBeGreaterThan(0);
      for (const question of quiz.questions) {
        expect(question.options.length).toBeGreaterThanOrEqual(2);
        expect(question.options.filter((option) => option.isCorrect).length).toBe(1);
        if (question.questionType === QuestionType.TRUE_FALSE) {
          expect(question.options.length).toBe(2);
        }
      }
    }
  });

  it('student can navigate OMICS → Unit 1 → topics → content → quiz → attempt → gamification', async () => {
    const auth = { Authorization: `Bearer ${studentToken}` };

    const subjects = await request(app).get('/api/subjects').set(auth);
    expect(subjects.status).toBe(200);
    const omics = subjects.body.data.subjects.find((item: { name: string }) => item.name === OMICS_SUBJECT_NAME);
    expect(omics).toBeTruthy();

    const units = await request(app).get(`/api/subjects/${omics.id}/units`).set(auth);
    expect(units.body.data.units.some((unit: { unitNumber: number }) => unit.unitNumber === 1)).toBe(true);

    const unit1 = units.body.data.units.find((unit: { unitNumber: number }) => unit.unitNumber === 1);
    const topics = await request(app).get(`/api/units/${unit1.id}/topics`).set(auth);
    expect(topics.body.data.topics.length).toBeGreaterThanOrEqual(6);

    const topic = topics.body.data.topics[0];
    const content = await request(app).get(`/api/topics/${topic.id}/content`).set(auth);
    expect(content.status).toBe(200);
    expect(content.body.data.contents.length).toBeGreaterThan(0);

    const quizzes = await request(app).get('/api/quizzes').set(auth);
    const quiz = quizzes.body.data.quizzes.find((item: { title: string }) =>
      item.title.includes('Reverse and Forward Genetics Quiz')
    );
    expect(quiz).toBeTruthy();

    const start = await request(app).post(`/api/quizzes/${quiz.id}/start`).set(auth);
    expect(start.status).toBe(201);
    expect(JSON.stringify(start.body)).not.toContain('"isCorrect":true');

    const attemptId = start.body.data.attemptId;
    const answers = start.body.data.questions.map(
      (question: { id: string; options: Array<{ id: string }> }) => ({
        questionId: question.id,
        selectedOptionId: question.options[0]?.id,
      })
    );

    const submit = await request(app)
      .post(`/api/attempts/${attemptId}/submit`)
      .set(auth)
      .send({ answers });
    expect(submit.status).toBe(200);
    expect(submit.body.data.result.percentage).toBeGreaterThanOrEqual(0);

    const xp = await request(app).get('/api/gamification/xp').set(auth);
    expect(xp.status).toBe(200);

    const progress = await request(app).get('/api/progress').set(auth);
    expect(progress.status).toBe(200);

    const badges = await request(app).get('/api/gamification/badges').set(auth);
    expect(badges.status).toBe(200);

    const leaderboard = await request(app).get('/api/leaderboard').set(auth);
    expect(leaderboard.status).toBe(200);
  });

  it('admin can view OMICS analytics and answer keys; student cannot access admin analytics', async () => {
    const adminAuth = { Authorization: `Bearer ${adminToken}` };
    const studentAuth = { Authorization: `Bearer ${studentToken}` };

    const analytics = await request(app).get('/api/admin/analytics').set(adminAuth);
    expect(analytics.status).toBe(200);

    const quizzes = await request(app).get('/api/quizzes').set(adminAuth);
    const quiz = quizzes.body.data.quizzes.find((item: { title: string }) =>
      item.title.includes('Epigenetic Mechanisms Quiz')
    );

    const questions = await request(app)
      .get(`/api/quizzes/${quiz.id}/questions`)
      .set(adminAuth);
    expect(questions.status).toBe(200);
    expect(JSON.stringify(questions.body)).toContain('isCorrect');

    const denied = await request(app).get('/api/admin/analytics').set(studentAuth);
    expect(denied.status).toBe(403);
  });

  it('learning content metadata references source PDF files', async () => {
    const subject = await prisma.subject.findUnique({ where: { name: OMICS_SUBJECT_NAME } });
    const unit = await prisma.unit.findFirst({ where: { subjectId: subject!.id, unitNumber: 1 } });
    const contentItems = await prisma.learningContent.findMany({
      where: { topic: { unitId: unit!.id } },
      select: { metadata: true },
    });

    expect(contentItems.length).toBeGreaterThan(0);
    for (const item of contentItems) {
      const metadata = item.metadata as { sourceFile?: string };
      expect(metadata?.sourceFile).toMatch(/Unit-1/);
    }
  });
});
