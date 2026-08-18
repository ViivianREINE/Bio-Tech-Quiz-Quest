import { ContentStatus, Role } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/errorHandler.middleware.js';
import { CreateSubjectInput, UpdateSubjectInput, PublishSubjectInput } from './subject.validation.js';

export class SubjectService {
  async createSubject(input: CreateSubjectInput) {
    const existing = await prisma.subject.findUnique({
      where: { name: input.name.trim() },
    });

    if (existing) {
      throw new AppError(409, 'DUPLICATE_SUBJECT', `A subject named "${input.name}" already exists.`);
    }

    const subject = await prisma.subject.create({
      data: {
        name: input.name.trim(),
        description: input.description?.trim(),
        status: input.status || ContentStatus.DRAFT,
      },
    });

    return subject;
  }

  async getSubjects(userRole: Role, statusFilter?: ContentStatus) {
    const where = userRole === Role.ADMIN
      ? (statusFilter ? { status: statusFilter } : {})
      : { status: ContentStatus.PUBLISHED };

    const subjects = await prisma.subject.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { units: true },
        },
      },
    });

    return subjects;
  }

  async getSubjectById(id: string, userRole: Role) {
    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        units: {
          where: userRole === Role.ADMIN ? {} : { status: ContentStatus.PUBLISHED },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!subject) {
      throw new AppError(404, 'SUBJECT_NOT_FOUND', 'Subject not found.');
    }

    if (userRole === Role.STUDENT && subject.status !== ContentStatus.PUBLISHED) {
      throw new AppError(404, 'SUBJECT_NOT_FOUND', 'Subject not found or not published.');
    }

    return subject;
  }

  async updateSubject(id: string, input: UpdateSubjectInput) {
    const subject = await prisma.subject.findUnique({ where: { id } });
    if (!subject) {
      throw new AppError(404, 'SUBJECT_NOT_FOUND', 'Subject not found.');
    }

    if (input.name && input.name.trim() !== subject.name) {
      const existing = await prisma.subject.findFirst({
        where: {
          name: input.name.trim(),
          NOT: { id },
        },
      });
      if (existing) {
        throw new AppError(409, 'DUPLICATE_SUBJECT', `A subject named "${input.name}" already exists.`);
      }
    }

    const updated = await prisma.subject.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description?.trim() } : {}),
        ...(input.status ? { status: input.status } : {}),
      },
    });

    return updated;
  }

  async publishSubject(id: string, input: PublishSubjectInput) {
    const subject = await prisma.subject.findUnique({ where: { id } });
    if (!subject) {
      throw new AppError(404, 'SUBJECT_NOT_FOUND', 'Subject not found.');
    }

    const updated = await prisma.subject.update({
      where: { id },
      data: { status: input.status },
    });

    return updated;
  }

  async deleteSubject(id: string) {
    const subject = await prisma.subject.findUnique({ where: { id } });
    if (!subject) {
      throw new AppError(404, 'SUBJECT_NOT_FOUND', 'Subject not found.');
    }

    await prisma.subject.delete({ where: { id } });
    return { deleted: true };
  }
}

export const subjectService = new SubjectService();
