import { PrismaClient, ContentStatus, Difficulty, ContentType, QuestionType } from '@prisma/client';

export const OMICS_SUBJECT_NAME = 'OMICS';
export const OMICS_UNIT_TITLE = 'Unit 1: Functional Genomics and Epigenomics';

export interface SeedLearningContent {
  title: string;
  contentType: ContentType;
  body: string;
  displayOrder: number;
  difficulty: Difficulty;
  metadata: {
    sourceFile: string;
    sourceSection: string;
    contentPurpose: string;
    sourcePage?: string;
  };
}

export interface SeedOption {
  optionText: string;
  displayOrder: number;
  isCorrect: boolean;
}

export interface SeedQuestion {
  questionText: string;
  questionType: QuestionType;
  explanation: string;
  marks: number;
  difficulty: Difficulty;
  displayOrder: number;
  metadata: {
    sourceFile: string;
    sourceSection: string;
  };
  options: SeedOption[];
}

export interface SeedQuiz {
  title: string;
  description: string;
  difficulty: Difficulty;
  duration: number;
  passingPercentage: number;
  maximumAttempts: number;
  negativeMarking: boolean;
  correctMark: number;
  incorrectMark: number;
  unansweredMark: number;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  questions: SeedQuestion[];
}

export interface SeedTopic {
  title: string;
  description: string;
  displayOrder: number;
  learningContent: SeedLearningContent[];
  quizzes: SeedQuiz[];
}

export async function upsertSubject(
  prisma: PrismaClient,
  data: { name: string; description: string; status: ContentStatus }
) {
  return prisma.subject.upsert({
    where: { name: data.name },
    update: {
      description: data.description,
      status: data.status,
    },
    create: data,
  });
}

export async function upsertUnit(
  prisma: PrismaClient,
  subjectId: string,
  data: {
    title: string;
    description?: string;
    unitNumber: number;
    displayOrder: number;
    status: ContentStatus;
  }
) {
  return prisma.unit.upsert({
    where: {
      subjectId_unitNumber: {
        subjectId,
        unitNumber: data.unitNumber,
      },
    },
    update: {
      title: data.title,
      description: data.description,
      displayOrder: data.displayOrder,
      status: data.status,
    },
    create: {
      subjectId,
      ...data,
    },
  });
}

export async function upsertTopic(
  prisma: PrismaClient,
  unitId: string,
  data: { title: string; description: string; displayOrder: number; status: ContentStatus }
) {
  const existing = await prisma.topic.findFirst({
    where: { unitId, title: data.title },
  });

  if (existing) {
    return prisma.topic.update({
      where: { id: existing.id },
      data: {
        description: data.description,
        displayOrder: data.displayOrder,
        status: data.status,
      },
    });
  }

  return prisma.topic.create({
    data: { unitId, ...data },
  });
}

export async function upsertLearningContent(
  prisma: PrismaClient,
  topicId: string,
  item: SeedLearningContent
) {
  const existing = await prisma.learningContent.findFirst({
    where: { topicId, title: item.title },
  });

  const payload = {
    contentType: item.contentType,
    body: item.body,
    displayOrder: item.displayOrder,
    difficulty: item.difficulty,
    status: ContentStatus.PUBLISHED,
    metadata: item.metadata,
  };

  if (existing) {
    return prisma.learningContent.update({
      where: { id: existing.id },
      data: payload,
    });
  }

  return prisma.learningContent.create({
    data: { topicId, title: item.title, ...payload },
  });
}

export async function upsertQuiz(prisma: PrismaClient, topicId: string, quiz: SeedQuiz) {
  const existing = await prisma.quiz.findFirst({
    where: { topicId, title: quiz.title },
  });

  const quizData = {
    description: quiz.description,
    difficulty: quiz.difficulty,
    duration: quiz.duration,
    passingPercentage: quiz.passingPercentage,
    maximumAttempts: quiz.maximumAttempts,
    negativeMarking: quiz.negativeMarking,
    correctMark: quiz.correctMark,
    incorrectMark: quiz.incorrectMark,
    unansweredMark: quiz.unansweredMark,
    randomizeQuestions: quiz.randomizeQuestions,
    randomizeOptions: quiz.randomizeOptions,
    status: ContentStatus.PUBLISHED,
  };

  const record = existing
    ? await prisma.quiz.update({
        where: { id: existing.id },
        data: quizData,
      })
    : await prisma.quiz.create({
        data: { topicId, title: quiz.title, ...quizData },
      });

  for (const question of quiz.questions) {
    const existingQuestion = await prisma.question.findFirst({
      where: { quizId: record.id, displayOrder: question.displayOrder },
    });

    const questionRecord = existingQuestion
      ? await prisma.question.update({
          where: { id: existingQuestion.id },
          data: {
            questionText: question.questionText,
            questionType: question.questionType,
            explanation: question.explanation,
            marks: question.marks,
            difficulty: question.difficulty,
          },
        })
      : await prisma.question.create({
          data: {
            quizId: record.id,
            questionText: question.questionText,
            questionType: question.questionType,
            explanation: question.explanation,
            marks: question.marks,
            difficulty: question.difficulty,
            displayOrder: question.displayOrder,
          },
        });

    for (const option of question.options) {
      const existingOption = await prisma.option.findFirst({
        where: {
          questionId: questionRecord.id,
          displayOrder: option.displayOrder,
        },
      });

      if (existingOption) {
        await prisma.option.update({
          where: { id: existingOption.id },
          data: {
            optionText: option.optionText,
            isCorrect: option.isCorrect,
          },
        });
      } else {
        await prisma.option.create({
          data: {
            questionId: questionRecord.id,
            optionText: option.optionText,
            displayOrder: option.displayOrder,
            isCorrect: option.isCorrect,
          },
        });
      }
    }
  }

  return record;
}

export async function upsertAdminUser(
  prisma: PrismaClient,
  email: string,
  passwordHash: string,
  name: string
) {
  return prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: {
      name,
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    create: {
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
}
