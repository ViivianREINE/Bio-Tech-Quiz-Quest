import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { hashPassword } from '../src/utils/password.js';
import { Role, UserStatus } from '@prisma/client';

describe('Checkpoint 2 — Authentication & Authorization Tests', () => {
  const adminEmail = 'admin@biotechquest.test';
  const studentEmail = 'student@biotechquest.test';
  const testPassword = 'Password123!';

  let adminToken: string;
  let studentToken: string;
  let studentUserId: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    // Clean up test users
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            adminEmail,
            studentEmail,
            'inactive@biotechquest.test',
            'suspended@biotechquest.test',
            'newstudent@biotechquest.test',
            'escalation@biotechquest.test',
          ],
        },
      },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean and set up seed users for auth tests
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            adminEmail,
            studentEmail,
            'inactive@biotechquest.test',
            'suspended@biotechquest.test',
            'newstudent@biotechquest.test',
            'escalation@biotechquest.test',
          ],
        },
      },
    });

    const adminHash = await hashPassword(testPassword);
    const admin = await prisma.user.create({
      data: {
        name: 'System Admin',
        email: adminEmail,
        passwordHash: adminHash,
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });

    const studentHash = await hashPassword(testPassword);
    const student = await prisma.user.create({
      data: {
        name: 'John Student',
        email: studentEmail,
        passwordHash: studentHash,
        role: Role.STUDENT,
        status: UserStatus.ACTIVE,
      },
    });
    studentUserId = student.id;

    // Inactive user
    await prisma.user.create({
      data: {
        name: 'Inactive User',
        email: 'inactive@biotechquest.test',
        passwordHash: studentHash,
        role: Role.STUDENT,
        status: UserStatus.INACTIVE,
      },
    });

    // Suspended user
    await prisma.user.create({
      data: {
        name: 'Suspended User',
        email: 'suspended@biotechquest.test',
        passwordHash: studentHash,
        role: Role.STUDENT,
        status: UserStatus.SUSPENDED,
      },
    });

    // Login admin to get token
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password: testPassword });
    adminToken = adminLoginRes.body.data.token;

    // Login student to get token
    const studentLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: studentEmail, password: testPassword });
    studentToken = studentLoginRes.body.data.token;
  });

  describe('1. User Registration (POST /api/auth/register)', () => {
    it('successfully registers a new student', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'New Student',
        email: 'newstudent@biotechquest.test',
        password: 'ValidPassword123!',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('newstudent@biotechquest.test');
      expect(res.body.data.user.role).toBe(Role.STUDENT);
      expect(res.body.data.user.passwordHash).toBeUndefined(); // Never return hash
      expect(res.body.data.token).toBeDefined();
    });

    it('rejects registration with duplicate email', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Duplicate Student',
        email: studentEmail,
        password: 'ValidPassword123!',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EMAIL_EXISTS');
    });

    it('rejects registration with invalid email or short password', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'A',
        email: 'not-an-email',
        password: '123',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('prevents privilege escalation if client attempts to pass role ADMIN', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Hacker Attempt',
        email: 'escalation@biotechquest.test',
        password: 'Password123!',
        role: 'ADMIN',
      });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe(Role.STUDENT); // Forced to STUDENT
    });
  });

  describe('2. User Login (POST /api/auth/login)', () => {
    it('successfully logs in with valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: studentEmail,
        password: testPassword,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(studentEmail);
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('rejects login with invalid password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: studentEmail,
        password: 'WrongPassword!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('rejects login with nonexistent email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'ghost@biotechquest.test',
        password: testPassword,
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('rejects login for INACTIVE account', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'inactive@biotechquest.test',
        password: testPassword,
      });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ACCOUNT_INACTIVE');
    });

    it('rejects login for SUSPENDED account', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'suspended@biotechquest.test',
        password: testPassword,
      });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ACCOUNT_SUSPENDED');
    });
  });

  describe('3. Protected Route & Token Verification', () => {
    it('allows access to /api/auth/me with valid Bearer token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(studentEmail);
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('rejects access without Authorization header', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects access with invalid or forged JWT token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.payload');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });

    it('successfully responds to logout endpoint', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.loggedOut).toBe(true);
    });
  });

  describe('4. Role-Based Authorization', () => {
    it('allows ADMIN to access admin user list (GET /api/users)', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users).toBeInstanceOf(Array);
    });

    it('DENIES STUDENT from accessing admin user list (GET /api/users)', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('allows student to view their own profile (GET /api/users/:id)', async () => {
      const res = await request(app)
        .get(`/api/users/${studentUserId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe(studentUserId);
    });

    it('allows ADMIN to update a user status (PATCH /api/users/:id/status)', async () => {
      const res = await request(app)
        .patch(`/api/users/${studentUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: UserStatus.SUSPENDED });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.status).toBe(UserStatus.SUSPENDED);
    });

    it('DENIES STUDENT from updating user status', async () => {
      const res = await request(app)
        .patch(`/api/users/${studentUserId}/status`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ status: UserStatus.ACTIVE });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });
});
