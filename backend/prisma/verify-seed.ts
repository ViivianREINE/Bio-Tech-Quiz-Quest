import { PrismaClient, ContentStatus, QuestionType } from '@prisma/client';
import { OMICS_SUBJECT_NAME } from './seeds/helpers.js';

const prisma = new PrismaClient();

async function main() {
  const subject = await prisma.subject.findUnique({ where: { name: OMICS_SUBJECT_NAME } });
  if (!subject) {
    console.error('❌ OMICS subject not found. Run npm run seed first.');
    process.exit(1);
  }

  const unit = await prisma.unit.findFirst({
    where: { subjectId: subject.id, unitNumber: 1 },
  });

  const topics = await prisma.topic.findMany({
    where: { unitId: unit?.id },
    orderBy: { displayOrder: 'asc' },
  });

  const quizzes = await prisma.quiz.findMany({
    where: { topicId: { in: topics.map((topic) => topic.id) } },
    include: {
      questions: {
        include: { options: true },
        orderBy: { displayOrder: 'asc' },
      },
    },
  });

  let invalidQuizzes = 0;

  for (const quiz of quizzes) {
    if (quiz.questions.length === 0) {
      console.error(`❌ Quiz "${quiz.title}" has no questions.`);
      invalidQuizzes += 1;
      continue;
    }

    for (const question of quiz.questions) {
      const correctCount = question.options.filter((option) => option.isCorrect).length;
      if (question.options.length < 2) {
        console.error(`❌ Question ${question.displayOrder} in "${quiz.title}" has fewer than 2 options.`);
        invalidQuizzes += 1;
      }
      if (correctCount !== 1) {
        console.error(
          `❌ Question ${question.displayOrder} in "${quiz.title}" must have exactly 1 correct option (found ${correctCount}).`
        );
        invalidQuizzes += 1;
      }
      if (
        question.questionType === QuestionType.TRUE_FALSE &&
        question.options.length !== 2
      ) {
        console.error(`❌ TRUE_FALSE question ${question.displayOrder} in "${quiz.title}" must have 2 options.`);
        invalidQuizzes += 1;
      }
    }
  }

  const publishedQuizzes = quizzes.filter((quiz) => quiz.status === ContentStatus.PUBLISHED).length;

  console.log('📊 OMICS verification');
  console.log({
    subjects: 1,
    units: unit ? 1 : 0,
    topics: topics.length,
    learningContent: await prisma.learningContent.count({
      where: { topicId: { in: topics.map((topic) => topic.id) } },
    }),
    quizzes: quizzes.length,
    questions: quizzes.reduce((sum, quiz) => sum + quiz.questions.length, 0),
    options: quizzes.reduce(
      (sum, quiz) => sum + quiz.questions.reduce((inner, question) => inner + question.options.length, 0),
      0
    ),
    publishedQuizzes,
    invalidQuizzes,
  });

  if (invalidQuizzes > 0) {
    process.exit(1);
  }

  console.log('✅ All OMICS quizzes passed validation.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
