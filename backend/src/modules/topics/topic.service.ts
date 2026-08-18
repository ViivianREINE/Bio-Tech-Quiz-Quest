import { ContentStatus, Role } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/errorHandler.middleware.js';
import { CreateTopicInput, UpdateTopicInput } from './topic.validation.js';

export class TopicService {
  async createTopic(unitId: string, input: CreateTopicInput) {
    const unit = await prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) {
      throw new AppError(404, 'UNIT_NOT_FOUND', 'Parent unit not found.');
    }

    const topic = await prisma.topic.create({
      data: {
        unitId,
        title: input.title.trim(),
        description: input.description?.trim(),
        displayOrder: input.displayOrder || 1,
        status: input.status || ContentStatus.DRAFT,
      },
    });

    return topic;
  }

  async getTopicsByUnit(unitId: string, userRole: Role) {
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: { subject: true },
    });

    if (!unit) {
      throw new AppError(404, 'UNIT_NOT_FOUND', 'Parent unit not found.');
    }

    if (userRole === Role.STUDENT) {
      if (unit.status !== ContentStatus.PUBLISHED || unit.subject.status !== ContentStatus.PUBLISHED) {
        throw new AppError(404, 'UNIT_NOT_FOUND', 'Unit is not available.');
      }
    }

    const where = {
      unitId,
      ...(userRole === Role.STUDENT ? { status: ContentStatus.PUBLISHED } : {}),
    };

    const topics = await prisma.topic.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: {
            contents: true,
            quizzes: true,
          },
        },
      },
    });

    return topics;
  }

  async getTopicById(id: string, userRole: Role) {
    const topic = await prisma.topic.findUnique({
      where: { id },
      include: {
        unit: {
          include: { subject: true },
        },
        contents: {
          where: userRole === Role.STUDENT ? { status: ContentStatus.PUBLISHED } : {},
          orderBy: { displayOrder: 'asc' },
        },
        quizzes: {
          where: userRole === Role.STUDENT ? { status: ContentStatus.PUBLISHED } : {},
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!topic) {
      throw new AppError(404, 'TOPIC_NOT_FOUND', 'Topic not found.');
    }

    if (userRole === Role.STUDENT) {
      if (
        topic.status !== ContentStatus.PUBLISHED ||
        topic.unit.status !== ContentStatus.PUBLISHED ||
        topic.unit.subject.status !== ContentStatus.PUBLISHED
      ) {
        throw new AppError(404, 'TOPIC_NOT_FOUND', 'Topic is not available.');
      }
    }

    return topic;
  }

  async updateTopic(id: string, input: UpdateTopicInput) {
    const topic = await prisma.topic.findUnique({ where: { id } });
    if (!topic) {
      throw new AppError(404, 'TOPIC_NOT_FOUND', 'Topic not found.');
    }

    const updated = await prisma.topic.update({
      where: { id },
      data: {
        ...(input.title ? { title: input.title.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description?.trim() } : {}),
        ...(input.displayOrder !== undefined ? { displayOrder: input.displayOrder } : {}),
        ...(input.status ? { status: input.status } : {}),
      },
    });

    return updated;
  }

  async deleteTopic(id: string) {
    const topic = await prisma.topic.findUnique({ where: { id } });
    if (!topic) {
      throw new AppError(404, 'TOPIC_NOT_FOUND', 'Topic not found.');
    }

    await prisma.topic.delete({ where: { id } });
    return { deleted: true };
  }
}

export const topicService = new TopicService();
