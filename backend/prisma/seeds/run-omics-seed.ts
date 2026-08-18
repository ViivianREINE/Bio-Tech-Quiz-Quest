import { PrismaClient, ContentStatus } from '@prisma/client';
import { hashPassword } from '../../src/utils/password.js';
import {
  OMICS_SUBJECT_NAME,
  OMICS_UNIT_TITLE,
  upsertAdminUser,
  upsertLearningContent,
  upsertQuiz,
  upsertSubject,
  upsertTopic,
  upsertUnit,
} from './helpers.js';
import { OMICS_UNIT1_TOPICS } from './omics-unit1-data.js';

const prisma = new PrismaClient();

export async function seedOmicsUnit1(client: PrismaClient = prisma) {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@omics.dev.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const adminName = process.env.SEED_ADMIN_NAME ?? 'OMICS Development Admin';

  console.log('🌱 Seeding OMICS Unit 1 content...');

  const subject = await upsertSubject(client, {
    name: OMICS_SUBJECT_NAME,
    description:
      'Functional Genomics and Epigenomics — Unit 1 content seeded from Unit-1_i.pdf, Unit-1_ii.pdf, and Unit-1-epigenome.pdf.',
    status: ContentStatus.PUBLISHED,
  });

  const unit = await upsertUnit(client, subject.id, {
    title: OMICS_UNIT_TITLE,
    description:
      'Functional Genomics and Epigenomics: Reverse and forward genetics, Single cell technologies, Epigenetic mechanisms, Epigenetics databases.',
    unitNumber: 1,
    displayOrder: 1,
    status: ContentStatus.PUBLISHED,
  });

  for (const topicSeed of OMICS_UNIT1_TOPICS) {
    const topic = await upsertTopic(client, unit.id, {
      title: topicSeed.title,
      description: topicSeed.description,
      displayOrder: topicSeed.displayOrder,
      status: ContentStatus.PUBLISHED,
    });

    for (const content of topicSeed.learningContent) {
      await upsertLearningContent(client, topic.id, content);
    }

    for (const quiz of topicSeed.quizzes) {
      await upsertQuiz(client, topic.id, quiz);
    }
  }

  const passwordHash = await hashPassword(adminPassword);
  await upsertAdminUser(client, adminEmail, passwordHash, adminName);

  const counts = await reportSeedCounts(client);

  console.log('✅ OMICS Unit 1 seed complete.');
  console.log(`   Development admin: ${adminEmail}`);
  console.log('   Override with SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD env vars.');

  return counts;
}

export async function reportSeedCounts(client: PrismaClient = prisma) {
  const subject = await client.subject.findUnique({ where: { name: OMICS_SUBJECT_NAME } });
  if (!subject) {
    return null;
  }

  const unit = await client.unit.findFirst({
    where: { subjectId: subject.id, unitNumber: 1 },
  });

  const topicIds = unit
    ? (
        await client.topic.findMany({
          where: { unitId: unit.id },
          select: { id: true },
        })
      ).map((topic) => topic.id)
    : [];

  const quizRecords = topicIds.length
    ? await client.quiz.findMany({
        where: { topicId: { in: topicIds } },
        select: { id: true },
      })
    : [];

  const quizIds = quizRecords.map((quiz) => quiz.id);

  const counts = {
    subjects: await client.subject.count({ where: { name: OMICS_SUBJECT_NAME } }),
    units: unit ? 1 : 0,
    topics: await client.topic.count({ where: { unitId: unit?.id } }),
    learningContent: await client.learningContent.count({ where: { topicId: { in: topicIds } } }),
    quizzes: await client.quiz.count({ where: { topicId: { in: topicIds } } }),
    questions: await client.question.count({ where: { quizId: { in: quizIds } } }),
    options: await client.option.count({
      where: { question: { quizId: { in: quizIds } } },
    }),
    publishedQuizzes: await client.quiz.count({
      where: { topicId: { in: topicIds }, status: ContentStatus.PUBLISHED },
    }),
  };

  console.log('📊 OMICS seed counts:', counts);
  return counts;
}

export { prisma as seedPrismaClient };
