import { ContentStatus, Role } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/errorHandler.middleware.js';
import { CreateContentInput, UpdateContentInput } from './learning-content.validation.js';

export class LearningContentService {
  async createContent(topicId: string, input: CreateContentInput) {
    const topic = await prisma.topic.findUnique({ where: { id: topicId } });
    if (!topic) {
      throw new AppError(404, 'TOPIC_NOT_FOUND', 'Parent topic not found.');
    }

    const content = await prisma.learningContent.create({
      data: {
        topicId,
        title: input.title.trim(),
        contentType: input.contentType,
        body: input.body.trim(),
        displayOrder: input.displayOrder || 1,
        difficulty: input.difficulty,
        status: input.status || ContentStatus.DRAFT,
        metadata: input.metadata || undefined,
      },
    });

    return content;
  }

  async getContentByTopic(topicId: string, userRole: Role) {
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        unit: {
          include: { subject: true },
        },
      },
    });

    if (!topic) {
      throw new AppError(404, 'TOPIC_NOT_FOUND', 'Parent topic not found.');
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

    const where = {
      topicId,
      ...(userRole === Role.STUDENT ? { status: ContentStatus.PUBLISHED } : {}),
    };

    const contents = await prisma.learningContent.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
    });

    return contents;
  }

  async getContentById(id: string, userRole: Role) {
    const content = await prisma.learningContent.findUnique({
      where: { id },
      include: {
        topic: {
          include: {
            unit: {
              include: { subject: true },
            },
          },
        },
      },
    });

    if (!content) {
      throw new AppError(404, 'CONTENT_NOT_FOUND', 'Learning content not found.');
    }

    if (userRole === Role.STUDENT) {
      if (
        content.status !== ContentStatus.PUBLISHED ||
        content.topic.status !== ContentStatus.PUBLISHED ||
        content.topic.unit.status !== ContentStatus.PUBLISHED ||
        content.topic.unit.subject.status !== ContentStatus.PUBLISHED
      ) {
        throw new AppError(404, 'CONTENT_NOT_FOUND', 'Learning content is not available.');
      }
    }

    return content;
  }

  async updateContent(id: string, input: UpdateContentInput) {
    const content = await prisma.learningContent.findUnique({ where: { id } });
    if (!content) {
      throw new AppError(404, 'CONTENT_NOT_FOUND', 'Learning content not found.');
    }

    const updated = await prisma.learningContent.update({
      where: { id },
      data: {
        ...(input.title ? { title: input.title.trim() } : {}),
        ...(input.contentType ? { contentType: input.contentType } : {}),
        ...(input.body ? { body: input.body.trim() } : {}),
        ...(input.displayOrder !== undefined ? { displayOrder: input.displayOrder } : {}),
        ...(input.difficulty ? { difficulty: input.difficulty } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
      },
    });

    return updated;
  }

  async deleteContent(id: string) {
    const content = await prisma.learningContent.findUnique({ where: { id } });
    if (!content) {
      throw new AppError(404, 'CONTENT_NOT_FOUND', 'Learning content not found.');
    }

    await prisma.learningContent.delete({ where: { id } });
    return { deleted: true };
  }
}

export const learningContentService = new LearningContentService();
