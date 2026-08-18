import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { hashPassword } from '../src/utils/password.js';
import { Role, UserStatus, ContentStatus, Difficulty, QuestionType, AttemptStatus } from '@prisma/client';
import { calculateLevel } from '../src/modules/gamification/level.calculator.js';

describe('Checkpoint 6 — Gamification, Progress & Leaderboard Tests', () => {
  const adminEmail = 'gamify-admin@biotechquest.test';
  const student1Email = 'gamify-student1@biotechquest.test';
  const student2Email = 'gamify-student2@biotechquest.test';
  const testPassword = 'Password123!';

  let adminToken: string;
  let student1Token: string;
  let student2Token: string;
  let student1Id: string;
  let student2Id: string;

  let subjectId: string;
  let unitId: string;
  let topicId: string;
  let quizId: string;
  let questionsList: Array<{ id: string; correctOptionId: string; incorrectOptionId: string }> = [];

  const submitAttempt = async (token: string, answers: any[]) => {
    const startRes = await request(app)
      .post(`/api/quizzes/${quizId}/start`)
      .set('Authorization', `Bearer ${token}`);
    expect(startRes.status).toBe(201);
    const attemptId = startRes.body.data.attemptId;

    const submitRes = await request(app)
      .post(`/api/attempts/${attemptId}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({ answers });
    return { submitRes, attemptId };
  };

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.subject.deleteMany({ where: { name: { in: ['Gamification Test Subject'] } } });
    await prisma.user.deleteMany({ where: { email: { in: [adminEmail, student1Email, student2Email] } } });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.subject.deleteMany({ where: { name: { in: ['Gamification Test Subject'] } } });
    await prisma.user.deleteMany({ where: { email: { in: [adminEmail, student1Email, student2Email] } } });

    const adminHash = await hashPassword(testPassword);
    await prisma.user.create({
      data: { name: 'Gamify Admin', email: adminEmail, passwordHash: adminHash, role: Role.ADMIN, status: UserStatus.ACTIVE },
    });

    const studentHash = await hashPassword(testPassword);
    const s1 = await prisma.user.create({
      data: { name: 'Gamify Student 1', email: student1Email, passwordHash: studentHash, role: Role.STUDENT, status: UserStatus.ACTIVE },
    });
    student1Id = s1.id;

    const s2 = await prisma.user.create({
      data: { name: 'Gamify Student 2', email: student2Email, passwordHash: studentHash, role: Role.STUDENT, status: UserStatus.ACTIVE },
    });
    student2Id = s2.id;

    const adminLogin = await request(app).post('/api/auth/login').send({ email: adminEmail, password: testPassword });
    adminToken = adminLogin.body.data.token;

    const s1Login = await request(app).post('/api/auth/login').send({ email: student1Email, password: testPassword });
    student1Token = s1Login.body.data.token;

    const s2Login = await request(app).post('/api/auth/login').send({ email: student2Email, password: testPassword });
    student2Token = s2Login.body.data.token;

    // Create content hierarchy
    const subject = await prisma.subject.create({
      data: { name: 'Gamification Test Subject', status: ContentStatus.PUBLISHED },
    });
    subjectId = subject.id;

    const unit = await prisma.unit.create({
      data: { subjectId: subject.id, title: 'Unit 1', unitNumber: 1, status: ContentStatus.PUBLISHED },
    });
    unitId = unit.id;

    const topic = await prisma.topic.create({
      data: { unitId: unit.id, title: 'Epigenetics', status: ContentStatus.PUBLISHED },
    });
    topicId = topic.id;

    const quiz = await prisma.quiz.create({
      data: {
        topicId: topic.id,
        title: 'Gamification Test Quiz',
        difficulty: Difficulty.MEDIUM,
        duration: 60,
        passingPercentage: 70.0,
        maximumAttempts: 5,
        negativeMarking: true,
        correctMark: 2.0,
        incorrectMark: 0.5,
        status: ContentStatus.PUBLISHED,
      },
    });
    quizId = quiz.id;

    questionsList = [];
    for (let i = 1; i <= 3; i++) {
      const q = await prisma.question.create({
        data: {
          quizId: quiz.id,
          questionText: `Q${i}: Epigenetic mechanism?`,
          questionType: QuestionType.SINGLE_CHOICE,
          marks: 2.0,
          displayOrder: i,
          explanation: `Explanation ${i}`,
        },
      });
      const correct = await prisma.option.create({ data: { questionId: q.id, optionText: 'DNA Methylation', isCorrect: true, displayOrder: 1 } });
      const incorrect = await prisma.option.create({ data: { questionId: q.id, optionText: 'Protein Folding', isCorrect: false, displayOrder: 2 } });
      questionsList.push({ id: q.id, correctOptionId: correct.id, incorrectOptionId: incorrect.id });
    }
  });

  // ========================= LEVEL CALCULATOR =========================
  describe('1. Level Calculation Engine', () => {
    it('0 XP = Level 1', () => {
      const lvl = calculateLevel(0);
      expect(lvl.currentLevel).toBe(1);
      expect(lvl.totalXP).toBe(0);
      expect(lvl.XPToNextLevel).toBeGreaterThan(0);
    });

    it('Low XP stays at Level 1', () => {
      const lvl = calculateLevel(50);
      expect(lvl.currentLevel).toBe(1);
    });

    it('Exact L2 threshold transitions to Level 2', () => {
      // L2 min XP = 50 * 1 * 2 = 100
      const lvl = calculateLevel(100);
      expect(lvl.currentLevel).toBe(2);
    });

    it('XP between thresholds returns correct next level info', () => {
      const lvl = calculateLevel(150);
      expect(lvl.currentLevel).toBe(2);
      expect(lvl.nextLevel).toBe(3);
      expect(lvl.XPToNextLevel).toBeGreaterThan(0);
      expect(lvl.progressPercentage).toBeGreaterThan(0);
      expect(lvl.progressPercentage).toBeLessThan(100);
    });

    it('High XP = high level', () => {
      const lvl = calculateLevel(10000);
      expect(lvl.currentLevel).toBeGreaterThan(5);
    });

    it('No off-by-one errors at level boundaries', () => {
      // L3 min XP = 50 * 2 * 3 = 300
      const atL3 = calculateLevel(300);
      const justBelow = calculateLevel(299);
      expect(atL3.currentLevel).toBe(3);
      expect(justBelow.currentLevel).toBe(2);
    });
  });

  // ========================= PROGRESS ENGINE =========================
  describe('2. Progress Engine', () => {
    it('Updates quiz-level progress after attempt submission', async () => {
      const answers = questionsList.map((q) => ({ questionId: q.id, selectedOptionId: q.correctOptionId }));
      const { submitRes } = await submitAttempt(student1Token, answers);
      expect(submitRes.status).toBe(200);

      // Allow async gamification to settle
      await new Promise((r) => setTimeout(r, 600));

      const res = await request(app)
        .get(`/api/progress/quizzes/${quizId}`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      const progress = res.body.data.progress;
      expect(progress).not.toBeNull();
      expect(progress.completionPercentage).toBe(100);
      expect(progress.quizzesCompleted).toBeGreaterThanOrEqual(1);
    });

    it('Updates topic-level progress after quiz completion', async () => {
      const answers = questionsList.map((q) => ({ questionId: q.id, selectedOptionId: q.correctOptionId }));
      await submitAttempt(student1Token, answers);
      await new Promise((r) => setTimeout(r, 600));

      const res = await request(app)
        .get(`/api/progress/topics/${topicId}`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      const progress = res.body.data.progress;
      expect(progress).not.toBeNull();
      expect(progress.completionPercentage).toBe(100); // 1 quiz, completed
      expect(progress.highestScore).toBe(100);
    });

    it('Updates unit and subject progress', async () => {
      const answers = questionsList.map((q) => ({ questionId: q.id, selectedOptionId: q.correctOptionId }));
      await submitAttempt(student1Token, answers);
      await new Promise((r) => setTimeout(r, 600));

      const unitRes = await request(app)
        .get(`/api/progress/units/${unitId}`)
        .set('Authorization', `Bearer ${student1Token}`);
      expect(unitRes.status).toBe(200);
      expect(unitRes.body.data.progress).not.toBeNull();

      const subjectRes = await request(app)
        .get(`/api/progress/subjects/${subjectId}`)
        .set('Authorization', `Bearer ${student1Token}`);
      expect(subjectRes.status).toBe(200);
      expect(subjectRes.body.data.progress).not.toBeNull();
    });

    it('IDEMPOTENCY: Repeated processing does not double-count progress', async () => {
      const answers = questionsList.map((q) => ({ questionId: q.id, selectedOptionId: q.correctOptionId }));
      const { submitRes, attemptId } = await submitAttempt(student1Token, answers);
      expect(submitRes.status).toBe(200);

      // Manually call progress recalculation again — must be idempotent
      const { progressService } = await import('../src/modules/progress/progress.service.js');
      await progressService.recalculateAfterAttempt(student1Id, attemptId);
      await progressService.recalculateAfterAttempt(student1Id, attemptId);

      const res = await request(app)
        .get(`/api/progress/quizzes/${quizId}`)
        .set('Authorization', `Bearer ${student1Token}`);

      const progress = res.body.data.progress;
      expect(progress.quizzesCompleted).toBe(1); // Not 3
    });

    it('Returns 404 for non-existent subject/unit/topic', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res1 = await request(app).get(`/api/progress/subjects/${fakeId}`).set('Authorization', `Bearer ${student1Token}`);
      expect(res1.status).toBe(404);

      const res2 = await request(app).get(`/api/progress/units/${fakeId}`).set('Authorization', `Bearer ${student1Token}`);
      expect(res2.status).toBe(404);

      const res3 = await request(app).get(`/api/progress/topics/${fakeId}`).set('Authorization', `Bearer ${student1Token}`);
      expect(res3.status).toBe(404);
    });
  });

  // ========================= XP ENGINE =========================
  describe('3. XP Engine', () => {
    it('Awards XP after a quiz attempt and returns positive total', async () => {
      const answers = questionsList.map((q) => ({ questionId: q.id, selectedOptionId: q.correctOptionId }));
      const { submitRes } = await submitAttempt(student1Token, answers);
      expect(submitRes.status).toBe(200);
      await new Promise((r) => setTimeout(r, 600));

      const xpRes = await request(app)
        .get('/api/gamification/xp')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(xpRes.status).toBe(200);
      expect(xpRes.body.data.totalXP).toBeGreaterThan(0);
      expect(xpRes.body.data.transactions.length).toBeGreaterThan(0);
    });

    it('Awards QUIZ_COMPLETION XP only once per attempt (idempotency)', async () => {
      const answers = questionsList.map((q) => ({ questionId: q.id, selectedOptionId: q.correctOptionId }));
      const { attemptId } = await submitAttempt(student1Token, answers);
      await new Promise((r) => setTimeout(r, 600));

      // Manually trigger again — should be idempotent
      const { xpService } = await import('../src/modules/gamification/xp.service.js');
      await xpService.awardQuizCompletionXP(student1Id, attemptId);
      await xpService.awardQuizCompletionXP(student1Id, attemptId);

      const xpRes = await request(app)
        .get('/api/gamification/xp')
        .set('Authorization', `Bearer ${student1Token}`);

      const completionTxns = xpRes.body.data.transactions.filter((t: any) => t.actionType === 'QUIZ_COMPLETION');
      expect(completionTxns.length).toBe(1); // Only once
    });

    it('Admin can adjust XP for any user', async () => {
      const res = await request(app)
        .post('/api/gamification/admin/xp-adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ targetUserId: student1Id, amount: 100, description: 'Test admin bonus' });

      expect(res.status).toBe(201);
      expect(res.body.data.transaction.amount).toBe(100);
      expect(res.body.data.transaction.actionType).toBe('ADMIN_ADJUSTMENT');
    });

    it('SECURITY: Student cannot award XP via admin endpoint', async () => {
      const res = await request(app)
        .post('/api/gamification/admin/xp-adjust')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ targetUserId: student1Id, amount: 1000, description: 'Self-award attempt' });

      expect(res.status).toBe(403);
    });

    it('XP is correct for 3/3 correct answers (perfect score)', async () => {
      const answers = questionsList.map((q) => ({ questionId: q.id, selectedOptionId: q.correctOptionId }));
      await submitAttempt(student1Token, answers);
      await new Promise((r) => setTimeout(r, 800));

      const xpRes = await request(app)
        .get('/api/gamification/xp')
        .set('Authorization', `Bearer ${student1Token}`);

      const txns = xpRes.body.data.transactions;
      const correctAnswerXP = txns.find((t: any) => t.actionType === 'CORRECT_ANSWER');
      expect(correctAnswerXP).toBeDefined();
      const perfectScoreXP = txns.find((t: any) => t.actionType === 'PERFECT_SCORE');
      expect(perfectScoreXP).toBeDefined();
    });
  });

  // ========================= BADGES =========================
  describe('4. Badge Engine', () => {
    it('Awards FIRST_QUIZ badge on first finalized attempt', async () => {
      await submitAttempt(student1Token, []);
      await new Promise((r) => setTimeout(r, 600));

      const badgeRes = await request(app)
        .get('/api/gamification/badges')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(badgeRes.status).toBe(200);
      const badges = badgeRes.body.data.badges;
      const firstQuiz = badges.find((b: any) => b.badge.code === 'FIRST_QUIZ');
      expect(firstQuiz).toBeDefined();
    });

    it('Awards PERFECT_SCORE badge on 100% attempt', async () => {
      const answers = questionsList.map((q) => ({ questionId: q.id, selectedOptionId: q.correctOptionId }));
      await submitAttempt(student1Token, answers);
      await new Promise((r) => setTimeout(r, 600));

      const badgeRes = await request(app)
        .get('/api/gamification/badges')
        .set('Authorization', `Bearer ${student1Token}`);

      const badges = badgeRes.body.data.badges;
      const perfect = badges.find((b: any) => b.badge.code === 'PERFECT_SCORE');
      expect(perfect).toBeDefined();
    });

    it('IDEMPOTENCY: Duplicate badge evaluation does not re-award FIRST_QUIZ', async () => {
      await submitAttempt(student1Token, []);
      await new Promise((r) => setTimeout(r, 600));

      // Trigger badge evaluation multiple times
      const { badgeService } = await import('../src/modules/gamification/badge.service.js');
      const firstAttempt = await prisma.quizAttempt.findFirst({ where: { userId: student1Id } });
      if (firstAttempt) {
        await badgeService.evaluateAfterAttempt(student1Id, firstAttempt.id);
        await badgeService.evaluateAfterAttempt(student1Id, firstAttempt.id);
      }

      const badgeRes = await request(app)
        .get('/api/gamification/badges')
        .set('Authorization', `Bearer ${student1Token}`);

      const firstQuizBadges = badgeRes.body.data.badges.filter((b: any) => b.badge.code === 'FIRST_QUIZ');
      expect(firstQuizBadges.length).toBe(1); // Exactly once
    });

    it('Awards TOPIC_MASTER when all topic quizzes are completed', async () => {
      const answers = questionsList.map((q) => ({ questionId: q.id, selectedOptionId: q.correctOptionId }));
      await submitAttempt(student1Token, answers);
      await new Promise((r) => setTimeout(r, 800));

      const badgeRes = await request(app)
        .get('/api/gamification/badges')
        .set('Authorization', `Bearer ${student1Token}`);

      const topicMaster = badgeRes.body.data.badges.find((b: any) => b.badge.code === 'TOPIC_MASTER');
      expect(topicMaster).toBeDefined();
    });
  });

  // ========================= LEADERBOARD =========================
  describe('5. Leaderboard', () => {
    it('Returns global leaderboard sorted by XP DESC', async () => {
      // Give S1 more XP than S2
      const answers = questionsList.map((q) => ({ questionId: q.id, selectedOptionId: q.correctOptionId }));
      await submitAttempt(student1Token, answers);
      await submitAttempt(student2Token, []);
      await new Promise((r) => setTimeout(r, 800));

      const res = await request(app)
        .get('/api/leaderboard')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      const rankings = res.body.data.rankings;
      expect(Array.isArray(rankings)).toBe(true);
      expect(rankings.length).toBeGreaterThan(0);

      // Verify XP ordering
      for (let i = 1; i < rankings.length; i++) {
        expect(rankings[i - 1].totalXP).toBeGreaterThanOrEqual(rankings[i].totalXP);
      }

      // Verify rank assignment
      rankings.forEach((r: any, i: number) => {
        expect(r.rank).toBe(i + 1);
      });
    });

    it('SECURITY: Leaderboard does not expose email, passwordHash, or private fields', async () => {
      const res = await request(app)
        .get('/api/leaderboard')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      res.body.data.rankings.forEach((r: any) => {
        expect(r.email).toBeUndefined();
        expect(r.passwordHash).toBeUndefined();
        expect(r.role).toBeUndefined();
        expect(r.displayName).toBeDefined();
        expect(r.totalXP).toBeDefined();
        expect(r.level).toBeDefined();
        expect(r.rank).toBeDefined();
      });
    });

    it('Handles zero-XP users deterministically', async () => {
      const res = await request(app)
        .get('/api/leaderboard')
        .set('Authorization', `Bearer ${student1Token}`);

      // Should return without error even if some users have 0 XP
      expect(res.status).toBe(200);
    });
  });

  // ========================= SECURITY =========================
  describe('6. Gamification Security', () => {
    it('Unauthenticated request to /api/gamification/xp is rejected', async () => {
      const res = await request(app).get('/api/gamification/xp');
      expect(res.status).toBe(401);
    });

    it('Unauthenticated request to /api/progress is rejected', async () => {
      const res = await request(app).get('/api/progress');
      expect(res.status).toBe(401);
    });

    it('Unauthenticated request to /api/leaderboard is rejected', async () => {
      const res = await request(app).get('/api/leaderboard');
      expect(res.status).toBe(401);
    });
  });
});
