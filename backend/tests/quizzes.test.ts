import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { hashPassword } from '../src/utils/password.js';
import { Role, UserStatus, ContentStatus, Difficulty, QuestionType } from '@prisma/client';

describe('Checkpoint 4 — Quiz Engine Tests', () => {
  const adminEmail = 'quiz-admin@biotechquest.test';
  const studentEmail = 'quiz-student@biotechquest.test';
  const testPassword = 'Password123!';

  let adminToken: string;
  let studentToken: string;
  let topicId: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    // Clean up
    await prisma.subject.deleteMany({
      where: { name: { in: ['Quiz Test Omics'] } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [adminEmail, studentEmail] } },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.subject.deleteMany({
      where: { name: { in: ['Quiz Test Omics'] } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [adminEmail, studentEmail] } },
    });

    const adminHash = await hashPassword(testPassword);
    await prisma.user.create({
      data: {
        name: 'Quiz Admin',
        email: adminEmail,
        passwordHash: adminHash,
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });

    const studentHash = await hashPassword(testPassword);
    await prisma.user.create({
      data: {
        name: 'Quiz Student',
        email: studentEmail,
        passwordHash: studentHash,
        role: Role.STUDENT,
        status: UserStatus.ACTIVE,
      },
    });

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password: testPassword });
    adminToken = adminLogin.body.data.token;

    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: studentEmail, password: testPassword });
    studentToken = studentLogin.body.data.token;

    // Create Subject -> Unit -> Topic
    const subject = await prisma.subject.create({
      data: {
        name: 'Quiz Test Omics',
        description: 'Testing Quizzes',
        status: ContentStatus.PUBLISHED,
      },
    });

    const unit = await prisma.unit.create({
      data: {
        subjectId: subject.id,
        title: 'Unit 1 — Functional Genomics',
        unitNumber: 1,
        status: ContentStatus.PUBLISHED,
      },
    });

    const topic = await prisma.topic.create({
      data: {
        unitId: unit.id,
        title: 'Forward vs Reverse Genetics',
        status: ContentStatus.PUBLISHED,
      },
    });
    topicId = topic.id;
  });

  describe('1. Quiz Creation & Admin Management', () => {
    it('Admin can create a new quiz with valid configuration', async () => {
      const res = await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          topicId,
          title: 'Forward Genetics Mastery Quiz',
          description: 'Assess understanding of mutation approaches and screen types',
          difficulty: Difficulty.MEDIUM,
          duration: 15,
          passingPercentage: 60.0,
          maximumAttempts: 3,
          negativeMarking: true,
          correctMark: 2.0,
          incorrectMark: 0.5,
          randomizeQuestions: false,
          randomizeOptions: false,
          status: ContentStatus.DRAFT,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.quiz.title).toBe('Forward Genetics Mastery Quiz');
      expect(res.body.data.quiz.duration).toBe(15);
      expect(res.body.data.quiz.negativeMarking).toBe(true);
      expect(res.body.data.quiz.status).toBe(ContentStatus.DRAFT);
    });

    it('Student CANNOT create a quiz', async () => {
      const res = await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          topicId,
          title: 'Student Attempted Quiz',
          duration: 10,
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('Rejects quiz creation with nonexistent topicId', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          topicId: fakeId,
          title: 'Orphan Quiz',
          duration: 10,
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('TOPIC_NOT_FOUND');
    });

    it('Admin can update quiz settings', async () => {
      const createRes = await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          topicId,
          title: 'Original Quiz Title',
          duration: 10,
        });
      const quizId = createRes.body.data.quiz.id;

      const updateRes = await request(app)
        .put(`/api/quizzes/${quizId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Quiz Title',
          duration: 20,
          passingPercentage: 75.0,
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.quiz.title).toBe('Updated Quiz Title');
      expect(updateRes.body.data.quiz.duration).toBe(20);
      expect(updateRes.body.data.quiz.passingPercentage).toBe(75.0);
    });

    it('Admin can delete a quiz', async () => {
      const createRes = await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          topicId,
          title: 'Quiz to delete',
          duration: 10,
        });
      const quizId = createRes.body.data.quiz.id;

      const deleteRes = await request(app)
        .delete(`/api/quizzes/${quizId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.data.deleted).toBe(true);
    });
  });

  describe('2. Question & Option Authoring', () => {
    let quizId: string;

    beforeEach(async () => {
      const q = await prisma.quiz.create({
        data: {
          topicId,
          title: 'Genetics Quiz',
          duration: 15,
          status: ContentStatus.DRAFT,
        },
      });
      quizId = q.id;
    });

    it('Admin can add a valid SINGLE_CHOICE question with exactly 1 correct option', async () => {
      const res = await request(app)
        .post(`/api/quizzes/${quizId}/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          questionText: 'Which approach identifies the gene underlying a known phenotype?',
          questionType: QuestionType.SINGLE_CHOICE,
          explanation: 'Forward genetics starts with a phenotype and identifies the gene.',
          marks: 2.0,
          difficulty: Difficulty.EASY,
          displayOrder: 1,
          options: [
            { optionText: 'Forward Genetics', displayOrder: 1, isCorrect: true },
            { optionText: 'Reverse Genetics', displayOrder: 2, isCorrect: false },
            { optionText: 'Structural Genomics', displayOrder: 3, isCorrect: false },
            { optionText: 'Comparative Proteomics', displayOrder: 4, isCorrect: false },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.question.options.length).toBe(4);
      expect(res.body.data.question.marks).toBe(2.0);
    });

    it('Admin can add a TRUE_FALSE question', async () => {
      const res = await request(app)
        .post(`/api/quizzes/${quizId}/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          questionText: 'TILLING is a reverse genetic technique used in plant functional genomics.',
          questionType: QuestionType.TRUE_FALSE,
          explanation: 'TILLING allows identification of induced mutations in a target gene.',
          marks: 1.0,
          options: [
            { optionText: 'True', displayOrder: 1, isCorrect: true },
            { optionText: 'False', displayOrder: 2, isCorrect: false },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.question.questionType).toBe(QuestionType.TRUE_FALSE);
      expect(res.body.data.question.options.length).toBe(2);
    });

    it('Rejects SINGLE_CHOICE with 0 correct options', async () => {
      const res = await request(app)
        .post(`/api/quizzes/${quizId}/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          questionText: 'Invalid Question?',
          questionType: QuestionType.SINGLE_CHOICE,
          options: [
            { optionText: 'Option A', isCorrect: false },
            { optionText: 'Option B', isCorrect: false },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('Rejects SINGLE_CHOICE with multiple correct options', async () => {
      const res = await request(app)
        .post(`/api/quizzes/${quizId}/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          questionText: 'Invalid Question?',
          questionType: QuestionType.SINGLE_CHOICE,
          options: [
            { optionText: 'Option A', isCorrect: true },
            { optionText: 'Option B', isCorrect: true },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('Admin can update and delete a question', async () => {
      const createRes = await request(app)
        .post(`/api/quizzes/${quizId}/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          questionText: 'Original text',
          options: [
            { optionText: 'A', isCorrect: true },
            { optionText: 'B', isCorrect: false },
          ],
        });
      const questionId = createRes.body.data.question.id;

      // Update question
      const updateRes = await request(app)
        .put(`/api/questions/${questionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          questionText: 'Updated question text',
          marks: 3.0,
        });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.question.questionText).toBe('Updated question text');
      expect(updateRes.body.data.question.marks).toBe(3.0);

      // Delete question
      const deleteRes = await request(app)
        .delete(`/api/questions/${questionId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.data.deleted).toBe(true);
    });
  });

  describe('3. Quiz Publishing Validation & Student Security', () => {
    let emptyQuizId: string;
    let validQuizId: string;

    beforeEach(async () => {
      const emptyQ = await prisma.quiz.create({
        data: {
          topicId,
          title: 'Empty Quiz',
          duration: 10,
          status: ContentStatus.DRAFT,
        },
      });
      emptyQuizId = emptyQ.id;

      const validQ = await prisma.quiz.create({
        data: {
          topicId,
          title: 'Ready Quiz',
          duration: 10,
          status: ContentStatus.DRAFT,
        },
      });
      validQuizId = validQ.id;

      // Add a valid question to validQ
      await request(app)
        .post(`/api/quizzes/${validQuizId}/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          questionText: 'What is RNA interference used for in functional genomics?',
          options: [
            { optionText: 'Targeted gene silencing (Reverse genetics)', isCorrect: true },
            { optionText: 'Random chemical mutagenesis', isCorrect: false },
          ],
        });
    });

    it('Rejects publishing an empty quiz with no questions', async () => {
      const res = await request(app)
        .patch(`/api/quizzes/${emptyQuizId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: ContentStatus.PUBLISHED });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_QUIZ_CONFIGURATION');
    });

    it('Successfully publishes a valid quiz', async () => {
      const res = await request(app)
        .patch(`/api/quizzes/${validQuizId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: ContentStatus.PUBLISHED });

      expect(res.status).toBe(200);
      expect(res.body.data.quiz.status).toBe(ContentStatus.PUBLISHED);
    });

    it('CRITICAL SECURITY: Student cannot see isCorrect flag in quiz retrieval', async () => {
      // Publish quiz
      await prisma.quiz.update({
        where: { id: validQuizId },
        data: { status: ContentStatus.PUBLISHED },
      });

      const res = await request(app)
        .get(`/api/quizzes/${validQuizId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const question = res.body.data.quiz.questions[0];
      expect(question).toBeDefined();

      // Check each option to verify isCorrect is NEVER returned
      question.options.forEach((opt: any) => {
        expect(opt.isCorrect).toBeUndefined();
        expect(opt.optionText).toBeDefined();
      });
    });

    it('CRITICAL SECURITY: Student cannot see isCorrect in get questions list', async () => {
      await prisma.quiz.update({
        where: { id: validQuizId },
        data: { status: ContentStatus.PUBLISHED },
      });

      const res = await request(app)
        .get(`/api/quizzes/${validQuizId}/questions`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.questions[0].options[0].isCorrect).toBeUndefined();
    });

    it('Student CANNOT access draft/unpublished quiz', async () => {
      const res = await request(app)
        .get(`/api/quizzes/${emptyQuizId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('QUIZ_NOT_FOUND');
    });
  });

  describe('4. Display Ordering & Randomization Configuration', () => {
    let quizId: string;

    beforeEach(async () => {
      const q = await prisma.quiz.create({
        data: {
          topicId,
          title: 'Ordered Quiz',
          duration: 10,
          randomizeQuestions: false,
          randomizeOptions: false,
          status: ContentStatus.PUBLISHED,
        },
      });
      quizId = q.id;

      // Add 2 questions with displayOrder 1 and 2
      await request(app)
        .post(`/api/quizzes/${quizId}/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          questionText: 'Question 1',
          displayOrder: 1,
          options: [
            { optionText: 'Opt 1', displayOrder: 1, isCorrect: true },
            { optionText: 'Opt 2', displayOrder: 2, isCorrect: false },
          ],
        });

      await request(app)
        .post(`/api/quizzes/${quizId}/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          questionText: 'Question 2',
          displayOrder: 2,
          options: [
            { optionText: 'Opt A', displayOrder: 1, isCorrect: true },
            { optionText: 'Opt B', displayOrder: 2, isCorrect: false },
          ],
        });
    });

    it('Preserves displayOrder when randomization is disabled', async () => {
      const res = await request(app)
        .get(`/api/quizzes/${quizId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      const questions = res.body.data.quiz.questions;
      expect(questions[0].questionText).toBe('Question 1');
      expect(questions[1].questionText).toBe('Question 2');
      expect(questions[0].options[0].optionText).toBe('Opt 1');
    });

    it('Randomization configuration does not leak isCorrect', async () => {
      await prisma.quiz.update({
        where: { id: quizId },
        data: {
          randomizeQuestions: true,
          randomizeOptions: true,
        },
      });

      const res = await request(app)
        .get(`/api/quizzes/${quizId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      const questions = res.body.data.quiz.questions;
      expect(questions.length).toBe(2);
      questions.forEach((q: any) => {
        q.options.forEach((opt: any) => {
          expect(opt.isCorrect).toBeUndefined();
        });
      });
    });
  });
});
