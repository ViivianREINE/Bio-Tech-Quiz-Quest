/**
 * Checkpoint 10 — Full backend API smoke verification.
 * Run: npm run e2e:smoke
 */
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { env } from '../src/config/env.js';
import { seedOmicsUnit1, seedPrismaClient } from '../prisma/seeds/run-omics-seed.js';
import { OMICS_SUBJECT_NAME } from '../prisma/seeds/helpers.js';

type FlowResult = { flow: string; result: 'PASS' | 'FAIL'; detail?: string };

const results: FlowResult[] = [];
const testPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@omics.dev.local';
const studentEmail = `e2e-student-${Date.now()}@biotechquest.test`;

function record(flow: string, ok: boolean, detail?: string) {
  results.push({ flow, result: ok ? 'PASS' : 'FAIL', detail });
  if (!ok) console.error(`FAIL: ${flow}${detail ? ` — ${detail}` : ''}`);
}

async function cleanupStudent() {
  await prisma.user.deleteMany({ where: { email: studentEmail } });
}

async function runSmoke() {
  console.log('🚀 Starting E2E smoke verification...\n');

  await seedOmicsUnit1();

  // Health
  const health = await request(app).get('/api/health');
  record(
    'Health',
    health.status === 200 && health.body.data?.database === 'connected',
    `status=${health.status}`
  );

  // Admin login
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: adminEmail, password: testPassword });
  const adminToken = adminLogin.body.data?.token;
  record('Admin Login', adminLogin.status === 200 && !!adminToken);

  const adminAuth = { Authorization: `Bearer ${adminToken}` };

  // Student register/login
  const register = await request(app)
    .post('/api/auth/register')
    .send({ name: 'E2E Student', email: studentEmail, password: testPassword });
  const studentToken = register.body.data?.token;
  record('Student Login', register.status === 201 && !!studentToken, `register status=${register.status}`);
  const studentAuth = { Authorization: `Bearer ${studentToken}` };

  // OMICS retrieval
  const subjects = await request(app).get('/api/subjects').set(studentAuth);
  const omics = subjects.body.data?.subjects?.find((s: { name: string }) => s.name === OMICS_SUBJECT_NAME);
  record('OMICS Retrieval', subjects.status === 200 && !!omics);

  const units = await request(app).get(`/api/subjects/${omics?.id}/units`).set(studentAuth);
  const unit1 = units.body.data?.units?.find((u: { unitNumber: number }) => u.unitNumber === 1);
  record('Unit 1 Retrieval', units.status === 200 && !!unit1);

  const topics = await request(app).get(`/api/units/${unit1?.id}/topics`).set(studentAuth);
  record('Topics Retrieval', topics.status === 200 && topics.body.data?.topics?.length >= 6, `count=${topics.body.data?.topics?.length}`);

  const firstTopic = topics.body.data?.topics?.[0];
  const content = await request(app).get(`/api/topics/${firstTopic?.id}/content`).set(studentAuth);
  record('Learning Content', content.status === 200 && content.body.data?.contents?.length > 0);

  const quizzes = await request(app).get('/api/quizzes').set(studentAuth);
  const omicsQuiz = quizzes.body.data?.quizzes?.find((q: { title: string }) =>
    q.title.includes('Reverse and Forward Genetics Quiz')
  );
  record('Quiz Retrieval', quizzes.status === 200 && !!omicsQuiz);

  // Admin sees answer keys
  const adminQuestions = await request(app)
    .get(`/api/quizzes/${omicsQuiz?.id}/questions`)
    .set(adminAuth);
  const adminHasCorrect = JSON.stringify(adminQuestions.body).includes('isCorrect');
  record('Admin Answer Keys', adminQuestions.status === 200 && adminHasCorrect);

  // Student start quiz — no isCorrect
  const start = await request(app)
    .post(`/api/quizzes/${omicsQuiz?.id}/start`)
    .set(studentAuth);
  const attemptId = start.body.data?.attemptId;
  const sanitized = !JSON.stringify(start.body).includes('"isCorrect":true');
  record('Quiz Start', start.status === 201 && !!attemptId);
  record('Answer Security', sanitized, 'isCorrect leaked in start payload');

  // Submit answers (pick first option for each question)
  const questions = start.body.data?.questions ?? [];
  const answers = questions.map((q: { id: string; options: Array<{ id: string }> }) => ({
    questionId: q.id,
    selectedOptionId: q.options[0]?.id,
  }));

  const submit = await request(app)
    .post(`/api/attempts/${attemptId}/submit`)
    .set(studentAuth)
    .send({ answers });
  record(
    'Quiz Submission',
    submit.status === 200,
    `status=${submit.status}`
  );
  record(
    'Scoring',
    submit.body.data?.result?.percentage !== undefined && submit.body.data?.result?.isPassed !== undefined
  );

  const studentId = register.body.data?.user?.id;
  await new Promise((resolve) => setTimeout(resolve, 500));

  // XP / progress / badges / leaderboard
  const xp = await request(app).get('/api/gamification/xp').set(studentAuth);
  record('XP', xp.status === 200 && (xp.body.data?.totalXP ?? 0) >= 0);

  const progress = await request(app).get('/api/progress').set(studentAuth);
  record('Progress', progress.status === 200);

  const badges = await request(app).get('/api/gamification/badges').set(studentAuth);
  record('Badges', badges.status === 200);

  const leaderboard = await request(app).get('/api/leaderboard').set(studentAuth);
  record('Leaderboard', leaderboard.status === 200);

  const analytics = await request(app).get('/api/admin/analytics').set(adminAuth);
  record('Admin Analytics', analytics.status === 200);

  // Security smoke
  const studentAnalytics = await request(app).get('/api/admin/analytics').set(studentAuth);
  record('IDOR Protection (admin analytics)', studentAnalytics.status === 403);

  const studentCreateSubject = await request(app)
    .post('/api/subjects')
    .set(studentAuth)
    .send({ name: 'Blocked Subject' });
  record('Student create subject blocked', studentCreateSubject.status === 403);

  const noAuth = await request(app).get('/api/progress');
  record('Unauthenticated rejected', noAuth.status === 401);

  const forged = jwt.sign({ userId: '00000000-0000-0000-0000-000000000000', email: 'x@y.com', role: 'ADMIN' }, 'wrong-secret');
  const forgedReq = await request(app)
    .get('/api/admin/analytics')
    .set({ Authorization: `Bearer ${forged}` });
  record('Forged JWT rejected', forgedReq.status === 401);

  const expired = jwt.sign(
    { userId: '00000000-0000-0000-0000-000000000000', email: 'x@y.com', role: 'ADMIN' },
    env.JWT_SECRET,
    { expiresIn: '-1s' }
  );
  const expiredReq = await request(app)
    .get('/api/admin/analytics')
    .set({ Authorization: `Bearer ${expired}` });
  record('Expired JWT rejected', expiredReq.status === 401);

  // Database consistency
  if (attemptId) {
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: { answers: true },
    });
    const xpCount = await prisma.xPTransaction.count({
      where: { userId: studentId },
    });
    record(
      'Database Consistency',
      !!attempt &&
        attempt.answers.length > 0 &&
        attempt.percentage >= 0 &&
        attempt.timeTakenSec !== null &&
        xpCount > 0,
      `answers=${attempt?.answers.length}, xp=${xpCount}`
    );
  } else {
    record('Database Consistency', false, 'missing attemptId');
  }

  await cleanupStudent();

  console.log('\n## Smoke Test Report\n');
  console.log('| Flow | Result |');
  console.log('| --- | --- |');
  for (const row of results) {
    console.log(`| ${row.flow} | ${row.result} |`);
  }

  const failed = results.filter((row) => row.result === 'FAIL');
  if (failed.length > 0) {
    console.error(`\n❌ ${failed.length} smoke flow(s) failed.`);
    process.exit(1);
  }

  console.log('\n✅ All smoke flows passed.');
}

runSmoke()
  .catch(async (error) => {
    console.error('Smoke test crashed:', error);
    await cleanupStudent().catch(() => undefined);
    process.exit(1);
  })
  .finally(async () => {
    await seedPrismaClient.$disconnect();
  });
