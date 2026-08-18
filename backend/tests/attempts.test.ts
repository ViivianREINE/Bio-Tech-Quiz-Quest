import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { hashPassword } from '../src/utils/password.js';
import { Role, UserStatus, ContentStatus, Difficulty, QuestionType, AttemptStatus } from '@prisma/client';

describe('Checkpoint 5 — Attempt & Scoring Engine Tests', () => {
  const adminEmail = 'attempt-admin@biotechquest.test';
  const student1Email = 'student1@biotechquest.test';
  const student2Email = 'student2@biotechquest.test';
  const testPassword = 'Password123!';

  let adminToken: string;
  let student1Token: string;
  let student2Token: string;
  let student1Id: string;
  let student2Id: string;

  let quizId: string;
  let topicId: string;
  let questionsList: Array<{
    id: string;
    correctOptionId: string;
    incorrectOptionId: string;
  }> = [];

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.subject.deleteMany({
      where: { name: { in: ['Attempt Test Subject'] } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [adminEmail, student1Email, student2Email] } },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up
    await prisma.subject.deleteMany({
      where: { name: { in: ['Attempt Test Subject'] } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [adminEmail, student1Email, student2Email] } },
    });

    const adminHash = await hashPassword(testPassword);
    await prisma.user.create({
      data: {
        name: 'Attempt Admin',
        email: adminEmail,
        passwordHash: adminHash,
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });

    const studentHash = await hashPassword(testPassword);
    const s1 = await prisma.user.create({
      data: {
        name: 'Student One',
        email: student1Email,
        passwordHash: studentHash,
        role: Role.STUDENT,
        status: UserStatus.ACTIVE,
      },
    });
    student1Id = s1.id;

    const s2 = await prisma.user.create({
      data: {
        name: 'Student Two',
        email: student2Email,
        passwordHash: studentHash,
        role: Role.STUDENT,
        status: UserStatus.ACTIVE,
      },
    });
    student2Id = s2.id;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password: testPassword });
    adminToken = adminLogin.body.data.token;

    const s1Login = await request(app)
      .post('/api/auth/login')
      .send({ email: student1Email, password: testPassword });
    student1Token = s1Login.body.data.token;

    const s2Login = await request(app)
      .post('/api/auth/login')
      .send({ email: student2Email, password: testPassword });
    student2Token = s2Login.body.data.token;

    // Create hierarchy: Subject -> Unit -> Topic -> Quiz (5 questions, 2 marks each, -0.5 incorrect, 70% passing, max 2 attempts)
    const subject = await prisma.subject.create({
      data: { name: 'Attempt Test Subject', status: ContentStatus.PUBLISHED },
    });
    const unit = await prisma.unit.create({
      data: {
        subjectId: subject.id,
        title: 'Unit 1',
        unitNumber: 1,
        status: ContentStatus.PUBLISHED,
      },
    });
    const topic = await prisma.topic.create({
      data: {
        unitId: unit.id,
        title: 'Single Cell Sequencing',
        status: ContentStatus.PUBLISHED,
      },
    });
    topicId = topic.id;

    const quiz = await prisma.quiz.create({
      data: {
        topicId: topic.id,
        title: 'Scoring & Attempt Test Quiz',
        difficulty: Difficulty.MEDIUM,
        duration: 10, // 10 minutes
        passingPercentage: 70.0,
        maximumAttempts: 2,
        negativeMarking: true,
        correctMark: 2.0,
        incorrectMark: 0.5,
        unansweredMark: 0.0,
        status: ContentStatus.PUBLISHED,
      },
    });
    quizId = quiz.id;

    // Seed 5 questions
    questionsList = [];
    for (let i = 1; i <= 5; i++) {
      const q = await prisma.question.create({
        data: {
          quizId: quiz.id,
          questionText: `Question ${i}: Which method isolates single cells?`,
          questionType: QuestionType.SINGLE_CHOICE,
          marks: 2.0,
          displayOrder: i,
          explanation: `Explanation for Question ${i}`,
        },
      });

      const optCorrect = await prisma.option.create({
        data: {
          questionId: q.id,
          optionText: `FACS Sorting (Correct ${i})`,
          isCorrect: true,
          displayOrder: 1,
        },
      });

      const optIncorrect = await prisma.option.create({
        data: {
          questionId: q.id,
          optionText: `Bulk Homogenate (Incorrect ${i})`,
          isCorrect: false,
          displayOrder: 2,
        },
      });

      questionsList.push({
        id: q.id,
        correctOptionId: optCorrect.id,
        incorrectOptionId: optIncorrect.id,
      });
    }
  });

  describe('1. Attempt Start & Sanitization', () => {
    it('Student can start a published quiz and receive sanitized data', async () => {
      const res = await request(app)
        .post(`/api/quizzes/${quizId}/start`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.attemptId).toBeDefined();
      expect(res.body.data.startedAt).toBeDefined();
      expect(res.body.data.expiresAt).toBeDefined();
      expect(res.body.data.attemptNumber).toBe(1);
      expect(res.body.data.totalQuestions).toBe(5);

      // Verify no isCorrect in options
      res.body.data.questions.forEach((q: any) => {
        q.options.forEach((opt: any) => {
          expect(opt.isCorrect).toBeUndefined();
        });
      });
    });

    it('Enforces maximumAttempts limit', async () => {
      // 1st attempt
      const res1 = await request(app)
        .post(`/api/quizzes/${quizId}/start`)
        .set('Authorization', `Bearer ${student1Token}`);
      expect(res1.status).toBe(201);
      const attempt1Id = res1.body.data.attemptId;

      // Submit 1st attempt
      await request(app)
        .post(`/api/attempts/${attempt1Id}/submit`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ answers: [] });

      // 2nd attempt
      const res2 = await request(app)
        .post(`/api/quizzes/${quizId}/start`)
        .set('Authorization', `Bearer ${student1Token}`);
      expect(res2.status).toBe(201);
      expect(res2.body.data.attemptNumber).toBe(2);
      const attempt2Id = res2.body.data.attemptId;

      // Submit 2nd attempt
      await request(app)
        .post(`/api/attempts/${attempt2Id}/submit`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ answers: [] });

      // 3rd attempt must be REJECTED (max = 2)
      const res3 = await request(app)
        .post(`/api/quizzes/${quizId}/start`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res3.status).toBe(403);
      expect(res3.body.error.code).toBe('MAX_ATTEMPTS_EXCEEDED');
    });

    it('Student cannot start an unpublished/draft quiz', async () => {
      const draftQuiz = await prisma.quiz.create({
        data: {
          topicId,
          title: 'Secret Draft Quiz',
          duration: 5,
          status: ContentStatus.DRAFT,
        },
      });

      const res = await request(app)
        .post(`/api/quizzes/${draftQuiz.id}/start`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('QUIZ_NOT_FOUND');
    });
  });

  describe('2. Authoritative Scoring & Negative Marking', () => {
    it('Calculates exact score: 3 correct, 1 incorrect, 1 unanswered', async () => {
      const startRes = await request(app)
        .post(`/api/quizzes/${quizId}/start`)
        .set('Authorization', `Bearer ${student1Token}`);
      const attemptId = startRes.body.data.attemptId;

      // Prepare answers:
      // Q1: correct (+2)
      // Q2: correct (+2)
      // Q3: correct (+2)
      // Q4: incorrect (-0.5)
      // Q5: unanswered (0)
      const submitRes = await request(app)
        .post(`/api/attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          answers: [
            { questionId: questionsList[0].id, selectedOptionId: questionsList[0].correctOptionId },
            { questionId: questionsList[1].id, selectedOptionId: questionsList[1].correctOptionId },
            { questionId: questionsList[2].id, selectedOptionId: questionsList[2].correctOptionId },
            { questionId: questionsList[3].id, selectedOptionId: questionsList[3].incorrectOptionId },
          ],
        });

      expect(submitRes.status).toBe(200);
      const result = submitRes.body.data.result;

      expect(result.totalQuestions).toBe(5);
      expect(result.answeredCount).toBe(4);
      expect(result.unansweredCount).toBe(1);
      expect(result.correctCount).toBe(3);
      expect(result.incorrectCount).toBe(1);
      expect(result.totalMarks).toBe(10.0);
      expect(result.obtainedMarks).toBe(5.5); // 2 + 2 + 2 - 0.5 + 0 = 5.5
      expect(result.percentage).toBe(55.0); // 5.5 / 10 * 100
      expect(result.isPassed).toBe(false); // 55% < 70% passing threshold
      expect(result.status).toBe(AttemptStatus.COMPLETED);
    });

    it('Calculates 100% perfect score passing attempt', async () => {
      const startRes = await request(app)
        .post(`/api/quizzes/${quizId}/start`)
        .set('Authorization', `Bearer ${student1Token}`);
      const attemptId = startRes.body.data.attemptId;

      const submitRes = await request(app)
        .post(`/api/attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          answers: questionsList.map((q) => ({
            questionId: q.id,
            selectedOptionId: q.correctOptionId,
          })),
        });

      expect(submitRes.status).toBe(200);
      const result = submitRes.body.data.result;
      expect(result.correctCount).toBe(5);
      expect(result.obtainedMarks).toBe(10.0);
      expect(result.percentage).toBe(100.0);
      expect(result.isPassed).toBe(true);
    });

    it('Calculates all incorrect with negative marking', async () => {
      const startRes = await request(app)
        .post(`/api/quizzes/${quizId}/start`)
        .set('Authorization', `Bearer ${student1Token}`);
      const attemptId = startRes.body.data.attemptId;

      const submitRes = await request(app)
        .post(`/api/attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          answers: questionsList.map((q) => ({
            questionId: q.id,
            selectedOptionId: q.incorrectOptionId,
          })),
        });

      expect(submitRes.status).toBe(200);
      const result = submitRes.body.data.result;
      expect(result.incorrectCount).toBe(5);
      expect(result.obtainedMarks).toBe(-2.5); // 5 * -0.5 = -2.5
      expect(result.isPassed).toBe(false);
    });
  });

  describe('3. Security, IDOR & Tamper Resistance', () => {
    it('DENIES Student 2 from submitting Student 1 attempt (IDOR Protection)', async () => {
      const startRes = await request(app)
        .post(`/api/quizzes/${quizId}/start`)
        .set('Authorization', `Bearer ${student1Token}`);
      const attemptId = startRes.body.data.attemptId;

      const hijackRes = await request(app)
        .post(`/api/attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${student2Token}`)
        .send({ answers: [] });

      expect(hijackRes.status).toBe(403);
      expect(hijackRes.body.error.code).toBe('FORBIDDEN');
    });

    it('DENIES Student 2 from viewing Student 1 attempt details (IDOR Protection)', async () => {
      const startRes = await request(app)
        .post(`/api/quizzes/${quizId}/start`)
        .set('Authorization', `Bearer ${student1Token}`);
      const attemptId = startRes.body.data.attemptId;

      const viewRes = await request(app)
        .get(`/api/attempts/${attemptId}`)
        .set('Authorization', `Bearer ${student2Token}`);

      expect(viewRes.status).toBe(403);
      expect(viewRes.body.error.code).toBe('FORBIDDEN');
    });

    it('Blocks duplicate submission of already completed attempt', async () => {
      const startRes = await request(app)
        .post(`/api/quizzes/${quizId}/start`)
        .set('Authorization', `Bearer ${student1Token}`);
      const attemptId = startRes.body.data.attemptId;

      // 1st submission
      await request(app)
        .post(`/api/attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ answers: [] });

      // 2nd submission must fail
      const repeatRes = await request(app)
        .post(`/api/attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ answers: [] });

      expect(repeatRes.status).toBe(400);
      expect(repeatRes.body.error.code).toBe('ATTEMPT_ALREADY_SUBMITTED');
    });

    it('Ignores client-supplied score, percentage, isCorrect in payload', async () => {
      const startRes = await request(app)
        .post(`/api/quizzes/${quizId}/start`)
        .set('Authorization', `Bearer ${student1Token}`);
      const attemptId = startRes.body.data.attemptId;

      const hackedSubmit = await request(app)
        .post(`/api/attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          score: 100,
          percentage: 100,
          isPassed: true,
          answers: [
            {
              questionId: questionsList[0].id,
              selectedOptionId: questionsList[0].incorrectOptionId, // Send incorrect option
              isCorrect: true, // Attempt to lie about correctness
              marksAwarded: 100,
            },
          ],
        });

      expect(hackedSubmit.status).toBe(200);
      const result = hackedSubmit.body.data.result;
      // Server calculated: 1 incorrect answer -> -0.5 marks, NOT 100!
      expect(result.obtainedMarks).toBe(-0.5);
      expect(result.isPassed).toBe(false);
    });

    it('Rejects invalid questionId or option belonging to different question', async () => {
      const startRes = await request(app)
        .post(`/api/quizzes/${quizId}/start`)
        .set('Authorization', `Bearer ${student1Token}`);
      const attemptId = startRes.body.data.attemptId;

      // Pair Question 1 with Option from Question 2
      const res = await request(app)
        .post(`/api/attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          answers: [
            {
              questionId: questionsList[0].id,
              selectedOptionId: questionsList[1].correctOptionId, // Mismatched option!
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_OPTION');
    });
  });

  describe('4. Expiration & Result Review', () => {
    it('Marks attempt EXPIRED if submitted after server expiresAt', async () => {
      const startRes = await request(app)
        .post(`/api/quizzes/${quizId}/start`)
        .set('Authorization', `Bearer ${student1Token}`);
      const attemptId = startRes.body.data.attemptId;

      // Artificially expire the attempt in DB
      const pastDate = new Date(Date.now() - 1000 * 60 * 20); // 20 mins ago
      await prisma.quizAttempt.update({
        where: { id: attemptId },
        data: {
          startedAt: new Date(pastDate.getTime() - 1000 * 60 * 10),
          expiresAt: pastDate,
        },
      });

      const submitRes = await request(app)
        .post(`/api/attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          answers: [
            { questionId: questionsList[0].id, selectedOptionId: questionsList[0].correctOptionId },
          ],
        });

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.data.result.status).toBe(AttemptStatus.EXPIRED);
    });

    it('Allows student to review question explanations and correct answers ONLY after submission', async () => {
      const startRes = await request(app)
        .post(`/api/quizzes/${quizId}/start`)
        .set('Authorization', `Bearer ${student1Token}`);
      const attemptId = startRes.body.data.attemptId;

      // Submit attempt
      await request(app)
        .post(`/api/attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          answers: [
            { questionId: questionsList[0].id, selectedOptionId: questionsList[0].correctOptionId },
          ],
        });

      // Review attempt
      const reviewRes = await request(app)
        .get(`/api/attempts/${attemptId}`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(reviewRes.status).toBe(200);
      const attempt = reviewRes.body.data.attempt;
      expect(attempt.reviewQuestions).toBeDefined();
      expect(attempt.reviewQuestions.length).toBe(5);

      const q1 = attempt.reviewQuestions[0];
      expect(q1.isCorrect).toBe(true);
      expect(q1.selectedOption.id).toBe(questionsList[0].correctOptionId);
      expect(q1.correctOption.id).toBe(questionsList[0].correctOptionId);
      expect(q1.explanation).toBeDefined();
    });
  });
});
