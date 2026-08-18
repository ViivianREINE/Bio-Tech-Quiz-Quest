import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { hashPassword } from '../src/utils/password.js';
import { Role, UserStatus, ContentStatus, ContentType, Difficulty } from '@prisma/client';

describe('Checkpoint 3 — Content Management Engine Tests', () => {
  const adminEmail = 'content-admin@biotechquest.test';
  const studentEmail = 'content-student@biotechquest.test';
  const testPassword = 'Password123!';

  let adminToken: string;
  let studentToken: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    // Clean up created subjects & users
    await prisma.subject.deleteMany({
      where: {
        name: {
          in: ['Test Omics', 'Test Genetics', 'Test Molecular Biology', 'Duplicate Subject'],
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: { in: [adminEmail, studentEmail] },
      },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean data between test blocks
    await prisma.subject.deleteMany({
      where: {
        name: {
          in: ['Test Omics', 'Test Genetics', 'Test Molecular Biology', 'Duplicate Subject'],
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: { in: [adminEmail, studentEmail] },
      },
    });

    const adminHash = await hashPassword(testPassword);
    await prisma.user.create({
      data: {
        name: 'Content Admin',
        email: adminEmail,
        passwordHash: adminHash,
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });

    const studentHash = await hashPassword(testPassword);
    await prisma.user.create({
      data: {
        name: 'Content Student',
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
  });

  describe('1. Subject Management', () => {
    it('Admin can create a new subject', async () => {
      const res = await request(app)
        .post('/api/subjects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Omics',
          description: 'Functional Genomics and Epigenomics Subject',
          status: ContentStatus.DRAFT,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.subject.name).toBe('Test Omics');
      expect(res.body.data.subject.status).toBe(ContentStatus.DRAFT);
    });

    it('Rejects duplicate subject name', async () => {
      await request(app)
        .post('/api/subjects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Duplicate Subject' });

      const res = await request(app)
        .post('/api/subjects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Duplicate Subject' });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DUPLICATE_SUBJECT');
    });

    it('Student cannot create a subject', async () => {
      const res = await request(app)
        .post('/api/subjects')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ name: 'Hacker Subject' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('Student sees only PUBLISHED subjects', async () => {
      // Create draft subject
      await request(app)
        .post('/api/subjects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Omics', status: ContentStatus.DRAFT });

      // Create published subject
      await request(app)
        .post('/api/subjects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Genetics', status: ContentStatus.PUBLISHED });

      const res = await request(app)
        .get('/api/subjects')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const names = res.body.data.subjects.map((s: any) => s.name);
      expect(names).toContain('Test Genetics');
      expect(names).not.toContain('Test Omics');
    });

    it('Admin can publish, update and delete a subject', async () => {
      const createRes = await request(app)
        .post('/api/subjects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Molecular Biology', status: ContentStatus.DRAFT });
      const subjectId = createRes.body.data.subject.id;

      // Publish
      const publishRes = await request(app)
        .patch(`/api/subjects/${subjectId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: ContentStatus.PUBLISHED });
      expect(publishRes.status).toBe(200);
      expect(publishRes.body.data.subject.status).toBe(ContentStatus.PUBLISHED);

      // Update
      const updateRes = await request(app)
        .put(`/api/subjects/${subjectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Updated Molecular Biology Description' });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.subject.description).toBe('Updated Molecular Biology Description');

      // Delete
      const deleteRes = await request(app)
        .delete(`/api/subjects/${subjectId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.data.deleted).toBe(true);
    });
  });

  describe('2. Unit Management', () => {
    let subjectId: string;

    beforeEach(async () => {
      const sub = await prisma.subject.create({
        data: {
          name: 'Test Omics',
          description: 'Omics test subject',
          status: ContentStatus.PUBLISHED,
        },
      });
      subjectId = sub.id;
    });

    it('Admin can create a unit under a subject', async () => {
      const res = await request(app)
        .post(`/api/subjects/${subjectId}/units`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Unit 1 — Functional Genomics',
          unitNumber: 1,
          displayOrder: 1,
          status: ContentStatus.PUBLISHED,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.unit.unitNumber).toBe(1);
    });

    it('Rejects duplicate unitNumber in the same subject', async () => {
      await request(app)
        .post(`/api/subjects/${subjectId}/units`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Unit 1', unitNumber: 1 });

      const res = await request(app)
        .post(`/api/subjects/${subjectId}/units`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Unit 1 Again', unitNumber: 1 });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE_UNIT_NUMBER');
    });

    it('Rejects creating unit for non-existent subject', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .post(`/api/subjects/${fakeId}/units`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Orphan Unit', unitNumber: 99 });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('SUBJECT_NOT_FOUND');
    });

    it('Student cannot mutate units', async () => {
      const res = await request(app)
        .post(`/api/subjects/${subjectId}/units`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ title: 'Student Unit', unitNumber: 2 });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('3. Topic Management', () => {
    let unitId: string;

    beforeEach(async () => {
      const sub = await prisma.subject.create({
        data: { name: 'Test Omics', status: ContentStatus.PUBLISHED },
      });
      const unit = await prisma.unit.create({
        data: {
          subjectId: sub.id,
          title: 'Unit 1',
          unitNumber: 1,
          status: ContentStatus.PUBLISHED,
        },
      });
      unitId = unit.id;
    });

    it('Admin can create, retrieve, update, and delete a topic', async () => {
      // Create
      const createRes = await request(app)
        .post(`/api/units/${unitId}/topics`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Forward and Reverse Genetics',
          description: 'Mutagenesis, screening, and RNAi',
          displayOrder: 1,
          status: ContentStatus.PUBLISHED,
        });

      expect(createRes.status).toBe(201);
      const topicId = createRes.body.data.topic.id;

      // Read
      const readRes = await request(app)
        .get(`/api/topics/${topicId}`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(readRes.status).toBe(200);
      expect(readRes.body.data.topic.title).toBe('Forward and Reverse Genetics');

      // Update
      const updateRes = await request(app)
        .put(`/api/topics/${topicId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Forward and Reverse Genetics (Updated)' });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.topic.title).toBe('Forward and Reverse Genetics (Updated)');

      // Delete
      const deleteRes = await request(app)
        .delete(`/api/topics/${topicId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.data.deleted).toBe(true);
    });

    it('Rejects topic creation on invalid unit', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .post(`/api/units/${fakeId}/topics`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Orphan Topic' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('UNIT_NOT_FOUND');
    });
  });

  describe('4. Learning Content Management', () => {
    let topicId: string;

    beforeEach(async () => {
      const sub = await prisma.subject.create({
        data: { name: 'Test Omics', status: ContentStatus.PUBLISHED },
      });
      const unit = await prisma.unit.create({
        data: {
          subjectId: sub.id,
          title: 'Unit 1',
          unitNumber: 1,
          status: ContentStatus.PUBLISHED,
        },
      });
      const topic = await prisma.topic.create({
        data: {
          unitId: unit.id,
          title: 'Single-Cell Technologies',
          status: ContentStatus.PUBLISHED,
        },
      });
      topicId = topic.id;
    });

    it('Validates all 8 supported content types', async () => {
      const contentTypes = [
        ContentType.TEXT,
        ContentType.IMAGE,
        ContentType.DIAGRAM,
        ContentType.FLOWCHART,
        ContentType.TABLE,
        ContentType.CASE_STUDY,
        ContentType.VIDEO_REFERENCE,
        ContentType.INTERACTIVE_ACTIVITY,
      ];

      for (const ct of contentTypes) {
        const res = await request(app)
          .post(`/api/topics/${topicId}/content`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: `Content for ${ct}`,
            contentType: ct,
            body: `Description and details for ${ct} module.`,
            difficulty: Difficulty.MEDIUM,
            status: ContentStatus.PUBLISHED,
          });

        expect(res.status).toBe(201);
        expect(res.body.data.content.contentType).toBe(ct);
      }
    });

    it('Rejects invalid content type', async () => {
      const res = await request(app)
        .post(`/api/topics/${topicId}/content`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Invalid Type Content',
          contentType: 'UNSUPPORTED_TYPE',
          body: 'Some body text',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('Student can read PUBLISHED content but NOT UNPUBLISHED/DRAFT content', async () => {
      // Create draft content
      const draftRes = await request(app)
        .post(`/api/topics/${topicId}/content`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Hidden Draft Content',
          contentType: ContentType.TEXT,
          body: 'Secret upcoming content',
          status: ContentStatus.DRAFT,
        });
      const draftContentId = draftRes.body.data.content.id;

      // Student tries to access directly
      const readDraftRes = await request(app)
        .get(`/api/content/${draftContentId}`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(readDraftRes.status).toBe(404);

      // Student views topic list - draft should not be included
      const listRes = await request(app)
        .get(`/api/topics/${topicId}/content`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(listRes.status).toBe(200);
      const titles = listRes.body.data.contents.map((c: any) => c.title);
      expect(titles).not.toContain('Hidden Draft Content');
    });

    it('Student cannot mutate learning content', async () => {
      const res = await request(app)
        .post(`/api/topics/${topicId}/content`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Student Attempted Content',
          contentType: ContentType.TEXT,
          body: 'Body',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });
});
